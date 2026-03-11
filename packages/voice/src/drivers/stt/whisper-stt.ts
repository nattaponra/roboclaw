import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
	STTDriver,
	STTConfig,
	TranscriptionResult,
} from "../../interfaces/stt.js";

const execAsync = promisify(exec);

/**
 * Whisper STT Driver
 * Uses whisper.cpp for local speech-to-text
 * 
 * Prerequisites:
 * - whisper.cpp must be installed and 'whisper' command available in PATH
 * - Or specify path to whisper executable in config.options.whisperPath
 */
export class WhisperSTTDriver implements STTDriver {
	private config?: STTConfig;
	private initialized = false;
	private whisperCommand = "whisper";
	private realtimeActive = false;

	async initialize(config: STTConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("STT already initialized");
		}

		this.config = config;

		// Check for custom whisper path
		if (config.options?.whisperPath) {
			this.whisperCommand = config.options.whisperPath as string;
		}

		// Verify whisper is available
		try {
			await execAsync(`which ${this.whisperCommand}`);
		} catch {
			throw new Error(
				`Whisper command not found: ${this.whisperCommand}. Please install whisper.cpp or set whisperPath in config.`,
			);
		}

		this.initialized = true;
	}

	async transcribeFile(audioPath: string): Promise<TranscriptionResult> {
		this.ensureInitialized();

		const startTime = Date.now();

		try {
			// Build whisper command
			const model = this.config?.model ?? "base";
			const language = this.config?.language ?? "en";

			const command = [
				this.whisperCommand,
				"-m",
				model,
				"-l",
				language,
				"-f",
				audioPath,
				"--print-colors",
				"--no-timestamps",
				"--output-txt",
			].join(" ");

			const { stdout, stderr } = await execAsync(command);

			const processingTime = Date.now() - startTime;

			// Extract transcription from output
			const text = this.extractTranscription(stdout || stderr);

			return {
				text: text.trim(),
				confidence: this.estimateConfidence(text),
				language: language,
				processingTime,
			};
		} catch (error) {
			throw new Error(`Whisper transcription failed: ${error}`);
		}
	}

	async transcribeBuffer(
		audioBuffer: Buffer,
		format = "wav",
	): Promise<TranscriptionResult> {
		this.ensureInitialized();

		// Save buffer to temp file
		const tempFile = join(tmpdir(), `whisper_${Date.now()}.${format}`);

		try {
			await writeFile(tempFile, audioBuffer);
			const result = await this.transcribeFile(tempFile);

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

	async startRealtime(
		callback: (result: TranscriptionResult) => void,
	): Promise<void> {
		this.ensureInitialized();

		if (this.realtimeActive) {
			throw new Error("Realtime transcription already active");
		}

		// Store callback for future use in streaming implementation
		// Currently unused in simplified implementation
		void callback;
		this.realtimeActive = true;

		// Note: This is a simplified implementation
		// For true real-time, you'd need to stream audio chunks
		// and use whisper.cpp streaming mode
	}

	async stopRealtime(): Promise<void> {
		this.ensureInitialized();

		if (!this.realtimeActive) {
			throw new Error("Realtime transcription not active");
		}

		this.realtimeActive = false;
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		if (this.realtimeActive) {
			await this.stopRealtime();
		}

		this.initialized = false;
		this.config = undefined;
	}

	// Private helper methods

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("STT not initialized");
		}
	}

	/**
	 * Extract transcription text from whisper output
	 */
	private extractTranscription(output: string): string {
		// Whisper output format varies, try to extract the transcription
		const lines = output.split("\n").filter((line) => line.trim());

		// Look for the transcription (usually the last non-empty line)
		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i].trim();
			// Skip metadata lines
			if (
				!line.startsWith("[") &&
				!line.includes("whisper_") &&
				!line.includes("sample")
			) {
				return line;
			}
		}

		return lines[lines.length - 1] || "";
	}

	/**
	 * Estimate confidence based on output characteristics
	 * (Whisper doesn't provide confidence scores directly)
	 */
	private estimateConfidence(text: string): number {
		// Simple heuristic: longer text = higher confidence
		// Real implementation might parse whisper's log probabilities
		const baseConfidence = 0.8;
		const lengthBonus = Math.min(text.length / 100, 0.15);
		return Math.min(baseConfidence + lengthBonus, 0.99);
	}
}
