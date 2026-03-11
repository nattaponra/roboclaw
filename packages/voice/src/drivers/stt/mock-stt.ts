import type {
	STTDriver,
	STTConfig,
	TranscriptionResult,
} from "../../interfaces/stt.js";

/**
 * Mock STT driver for testing
 * Returns predefined transcriptions
 */
export class MockSTTDriver implements STTDriver {
	private initialized = false;
	private realtimeCallback?: (result: TranscriptionResult) => void;
	private realtimeInterval?: NodeJS.Timeout;

	// Configurable mock responses
	private mockTranscriptions = [
		"Hello, how can I help you?",
		"What's the weather like today?",
		"Turn on the lights",
		"Navigate to the kitchen",
		"Take a picture",
	];
	private currentIndex = 0;

	async initialize(_config: STTConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("STT already initialized");
		}

		// Simulate initialization delay
		await this.delay(100);

		this.initialized = true;
	}

	async transcribeFile(_audioPath: string): Promise<TranscriptionResult> {
		this.ensureInitialized();

		// Simulate processing delay
		await this.delay(200);

		return this.getMockTranscription();
	}

	async transcribeBuffer(
		_audioBuffer: Buffer,
		_format?: string,
	): Promise<TranscriptionResult> {
		this.ensureInitialized();

		// Simulate processing delay
		await this.delay(150);

		return this.getMockTranscription();
	}

	async startRealtime(
		callback: (result: TranscriptionResult) => void,
	): Promise<void> {
		this.ensureInitialized();

		if (this.realtimeCallback) {
			throw new Error("Realtime transcription already active");
		}

		this.realtimeCallback = callback;

		// Simulate realtime transcription every 2 seconds
		this.realtimeInterval = setInterval(() => {
			const result = this.getMockTranscription();
			this.realtimeCallback?.(result);
		}, 2000);
	}

	async stopRealtime(): Promise<void> {
		this.ensureInitialized();

		if (!this.realtimeCallback) {
			throw new Error("Realtime transcription not active");
		}

		if (this.realtimeInterval) {
			clearInterval(this.realtimeInterval);
			this.realtimeInterval = undefined;
		}

		this.realtimeCallback = undefined;
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		if (this.realtimeCallback) {
			await this.stopRealtime();
		}

		this.initialized = false;
	}

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("STT not initialized");
		}
	}

	private getMockTranscription(): TranscriptionResult {
		const text = this.mockTranscriptions[this.currentIndex];
		this.currentIndex =
			(this.currentIndex + 1) % this.mockTranscriptions.length;

		return {
			text,
			confidence: 0.95 + Math.random() * 0.05, // 0.95-1.0
			language: "en",
			processingTime: 150 + Math.random() * 100, // 150-250ms
		};
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public setMockTranscriptions(transcriptions: string[]): void {
		this.mockTranscriptions = transcriptions;
		this.currentIndex = 0;
	}

	public isRealtimeActive(): boolean {
		return this.realtimeCallback !== undefined;
	}
}
