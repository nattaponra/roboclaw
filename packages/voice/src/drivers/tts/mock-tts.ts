import type {
	TTSDriver,
	TTSConfig,
	SynthesisResult,
} from "../../interfaces/tts.js";

/**
 * Mock TTS driver for testing
 * Generates fake audio data
 */
export class MockTTSDriver implements TTSDriver {
	private initialized = false;
	private speaking = false;
	private volume = 1.0;

	async initialize(_config: TTSConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("TTS already initialized");
		}

		// Simulate initialization delay
		await this.delay(100);

		this.initialized = true;
	}

	async synthesizeToFile(
		text: string,
		_outputPath: string,
	): Promise<SynthesisResult> {
		this.ensureInitialized();

		// Simulate synthesis delay based on text length
		const delay = Math.min(text.length * 10, 2000);
		await this.delay(delay);

		return this.createMockResult(text);
	}

	async synthesizeToBuffer(text: string): Promise<SynthesisResult> {
		this.ensureInitialized();

		// Simulate synthesis delay
		const delay = Math.min(text.length * 10, 2000);
		await this.delay(delay);

		return this.createMockResult(text);
	}

	async speak(text: string): Promise<void> {
		this.ensureInitialized();

		if (this.speaking) {
			await this.stop();
		}

		this.speaking = true;

		// Simulate speaking duration (100ms per character)
		const duration = text.length * 100;
		await this.delay(duration);

		this.speaking = false;
	}

	async stop(): Promise<void> {
		this.ensureInitialized();

		if (!this.speaking) {
			return;
		}

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
	}

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("TTS not initialized");
		}
	}

	private createMockResult(text: string): SynthesisResult {
		// Create fake WAV header + data
		const fakeAudio = Buffer.from(`mock-audio-${text}`);

		return {
			audio: fakeAudio,
			format: "wav",
			duration: text.length * 0.1, // 100ms per character
			sampleRate: 22050,
		};
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public setVolume(volume: number): void {
		if (volume < 0 || volume > 1) {
			throw new Error("Volume must be between 0 and 1");
		}
		this.volume = volume;
	}

	public getVolume(): number {
		return this.volume;
	}
}
