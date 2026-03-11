import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
	TTSDriver,
	TTSConfig,
	SynthesisResult,
} from "../../interfaces/tts.js";

const execAsync = promisify(exec);

/**
 * Piper TTS Driver
 * Uses Piper for local text-to-speech
 * 
 * Prerequisites:
 * - Piper must be installed and 'piper' command available in PATH
 * - Or specify path to piper executable in config.options.piperPath
 * - Voice model files must be available
 */
export class PiperTTSDriver implements TTSDriver {
	private config?: TTSConfig;
	private initialized = false;
	private piperCommand = "piper";
	private speaking = false;
	private currentProcess?: ReturnType<typeof spawn>;

	async initialize(config: TTSConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("TTS already initialized");
		}

		this.config = config;

		// Check for custom piper path
		if (config.options?.piperPath) {
			this.piperCommand = config.options.piperPath as string;
		}

		// Verify piper is available
		try {
			await execAsync(`which ${this.piperCommand}`);
		} catch {
			throw new Error(
				`Piper command not found: ${this.piperCommand}. Please install Piper or set piperPath in config.`,
			);
		}

		this.initialized = true;
	}

	async synthesizeToFile(
		text: string,
		outputPath: string,
	): Promise<SynthesisResult> {
		this.ensureInitialized();

		const startTime = Date.now();

		try {
			// Build piper command
			const voice = this.config?.voice ?? "en_US-lessac-medium";
			const rate = this.config?.rate ?? 1.0;

			const command = [
				`echo "${text.replace(/"/g, '\\"')}" |`,
				this.piperCommand,
				"--model",
				voice,
				"--output_file",
				outputPath,
				"--length_scale",
				(1 / rate).toString(),
			].join(" ");

			await execAsync(command);

			// Processing time could be used for metrics/logging
			void (Date.now() - startTime);

			// Read the generated file to get its size
			const audioBuffer = await readFile(outputPath);

			// Estimate duration (assuming 16-bit, 22050 Hz mono WAV)
			const sampleRate = this.config?.sampleRate ?? 22050;
			const duration = audioBuffer.length / (sampleRate * 2); // 2 bytes per sample

			return {
				audio: audioBuffer,
				format: this.config?.format ?? "wav",
				duration,
				sampleRate,
			};
		} catch (error) {
			throw new Error(`Piper synthesis failed: ${error}`);
		}
	}

	async synthesizeToBuffer(text: string): Promise<SynthesisResult> {
		this.ensureInitialized();

		// Use temp file
		const tempFile = join(tmpdir(), `piper_${Date.now()}.wav`);

		try {
			const result = await this.synthesizeToFile(text, tempFile);

			// Clean up temp file
			await unlink(tempFile).catch(() => {
				/* ignore cleanup errors */
			});

			return result;
		} catch (error) {
			// Try to clean up temp file on error
			await unlink(tempFile).catch(() => {
				/* ignore cleanup errors */
			});
			throw error;
		}
	}

	async speak(text: string): Promise<void> {
		this.ensureInitialized();

		if (this.speaking) {
			await this.stop();
		}

		this.speaking = true;

		try {
			// Generate audio
			const result = await this.synthesizeToBuffer(text);

			// Play audio using aplay (ALSA) or paplay (PulseAudio)
			// This is a simplified approach - for production, use a proper audio library
			const playCommand = await this.detectPlayCommand();
			const tempFile = join(tmpdir(), `piper_speak_${Date.now()}.wav`);

			await writeFile(tempFile, result.audio);

			return new Promise((resolve, reject) => {
				this.currentProcess = spawn(playCommand, [tempFile]);

				this.currentProcess.on("close", async () => {
					this.speaking = false;
					this.currentProcess = undefined;
					await unlink(tempFile).catch(() => {
						/* ignore */
					});
					resolve();
				});

				this.currentProcess.on("error", async (error) => {
					this.speaking = false;
					this.currentProcess = undefined;
					await unlink(tempFile).catch(() => {
						/* ignore */
					});
					reject(error);
				});
			});
		} catch (error) {
			this.speaking = false;
			throw error;
		}
	}

	async stop(): Promise<void> {
		this.ensureInitialized();

		if (!this.speaking || !this.currentProcess) {
			return;
		}

		this.currentProcess.kill();
		this.currentProcess = undefined;
		this.speaking = false;
	}

	isSpeaking(): boolean {
		return this.speaking;
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		if (this.speaking) {
			await this.stop();
		}

		this.initialized = false;
		this.config = undefined;
	}

	// Private helper methods

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("TTS not initialized");
		}
	}

	/**
	 * Detect available audio play command
	 */
	private async detectPlayCommand(): Promise<string> {
		// Try paplay (PulseAudio) first
		try {
			await execAsync("which paplay");
			return "paplay";
		} catch {
			// Fall back to aplay (ALSA)
			try {
				await execAsync("which aplay");
				return "aplay";
			} catch {
				throw new Error(
					"No audio playback command found (tried paplay, aplay)",
				);
			}
		}
	}
}
