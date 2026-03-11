import { EventEmitter } from "node:events";
import type { STTDriver, STTConfig } from "./interfaces/stt.js";
import type { TTSDriver, TTSConfig } from "./interfaces/tts.js";
import { VoiceFactory } from "./factory/voice-factory.js";

export interface VoiceManagerConfig {
	stt: STTConfig;
	tts: TTSConfig;
	wakeWord?: string;
}

/**
 * Voice Manager
 * Orchestrates STT and TTS for voice interactions
 */
export class VoiceManager extends EventEmitter {
	private stt?: STTDriver;
	private tts?: TTSDriver;
	private config?: VoiceManagerConfig;
	private initialized = false;
	private listening = false;

	async initialize(config: VoiceManagerConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Voice manager already initialized");
		}

		this.config = config;

		// Initialize STT
		this.stt = await VoiceFactory.createAndInitializeSTT(config.stt);
		this.emit("stt:ready");

		// Initialize TTS
		this.tts = await VoiceFactory.createAndInitializeTTS(config.tts);
		this.emit("tts:ready");

		this.initialized = true;
		this.emit("ready");
	}

	/**
	 * Start listening for voice input
	 */
	async startListening(): Promise<void> {
		this.ensureInitialized();

		if (this.listening) {
			throw new Error("Already listening");
		}

		this.listening = true;

		// Start realtime transcription
		await this.stt!.startRealtime((result) => {
			this.emit("transcription", result);

			// Check for wake word if configured
			if (this.config?.wakeWord) {
				const text = result.text.toLowerCase();
				if (text.includes(this.config.wakeWord.toLowerCase())) {
					this.emit("wakeword", result);
				}
			}
		});

		this.emit("listening");
	}

	/**
	 * Stop listening
	 */
	async stopListening(): Promise<void> {
		this.ensureInitialized();

		if (!this.listening) {
			return;
		}

		await this.stt!.stopRealtime();
		this.listening = false;
		this.emit("stopped");
	}

	/**
	 * Transcribe audio file
	 */
	async transcribeFile(audioPath: string) {
		this.ensureInitialized();
		const result = await this.stt!.transcribeFile(audioPath);
		this.emit("transcription", result);
		return result;
	}

	/**
	 * Speak text
	 */
	async speak(text: string): Promise<void> {
		this.ensureInitialized();
		this.emit("speaking", text);
		await this.tts!.speak(text);
		this.emit("spoke", text);
	}

	/**
	 * Stop speaking
	 */
	async stopSpeaking(): Promise<void> {
		this.ensureInitialized();
		await this.tts!.stop();
	}

	/**
	 * Check if currently listening
	 */
	isListening(): boolean {
		return this.listening;
	}

	/**
	 * Check if currently speaking
	 */
	isSpeaking(): boolean {
		return this.tts?.isSpeaking() ?? false;
	}

	/**
	 * Check if ready
	 */
	isReady(): boolean {
		return this.initialized;
	}

	/**
	 * Close and cleanup
	 */
	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		if (this.listening) {
			await this.stopListening();
		}

		if (this.tts?.isSpeaking()) {
			await this.stopSpeaking();
		}

		await this.stt?.close();
		await this.tts?.close();

		this.initialized = false;
		this.config = undefined;
		this.removeAllListeners();
		this.emit("closed");
	}

	// Private helpers
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Voice manager not initialized");
		}
	}
}
