import type {
	AudioRecorder,
	AudioPlayer,
	AudioConfig,
	AudioChunk,
} from "../../interfaces/audio.js";

/**
 * Mock Audio Recorder for testing
 */
export class MockAudioRecorder implements AudioRecorder {
	private initialized = false;
	private recording = false;
	private callback?: (chunk: AudioChunk) => void;
	private recordInterval?: NodeJS.Timeout;
	private level = 0;

	async initialize(_config: AudioConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Audio recorder already initialized");
		}

		await this.delay(50);
		this.initialized = true;
	}

	async startRecording(callback: (chunk: AudioChunk) => void): Promise<void> {
		this.ensureInitialized();

		if (this.recording) {
			throw new Error("Already recording");
		}

		this.callback = callback;
		this.recording = true;

		// Simulate audio chunks every 100ms
		this.recordInterval = setInterval(() => {
			const chunk: AudioChunk = {
				data: Buffer.from("mock-audio-data"),
				timestamp: Date.now(),
				sampleRate: 16000,
				channels: 1,
			};

			// Simulate varying audio levels
			this.level = Math.floor(Math.random() * 100);

			this.callback?.(chunk);
		}, 100);
	}

	async stopRecording(): Promise<void> {
		this.ensureInitialized();

		if (!this.recording) {
			throw new Error("Not currently recording");
		}

		if (this.recordInterval) {
			clearInterval(this.recordInterval);
			this.recordInterval = undefined;
		}

		this.recording = false;
		this.callback = undefined;
		this.level = 0;
	}

	isRecording(): boolean {
		return this.recording;
	}

	getLevel(): number {
		return this.level;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		if (this.recording) {
			await this.stopRecording();
		}

		this.initialized = false;
	}

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Audio recorder not initialized");
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Mock Audio Player for testing
 */
export class MockAudioPlayer implements AudioPlayer {
	private initialized = false;
	private playing = false;
	private paused = false;
	private volume = 1.0;

	async initialize(_config: AudioConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Audio player already initialized");
		}

		await this.delay(50);
		this.initialized = true;
	}

	async playFile(_audioPath: string): Promise<void> {
		this.ensureInitialized();

		if (this.playing && !this.paused) {
			throw new Error("Already playing");
		}

		this.playing = true;
		this.paused = false;

		// Simulate playback duration
		await this.delay(1000);

		this.playing = false;
	}

	async playBuffer(_audioBuffer: Buffer, _format?: string): Promise<void> {
		this.ensureInitialized();

		if (this.playing && !this.paused) {
			throw new Error("Already playing");
		}

		this.playing = true;
		this.paused = false;

		// Simulate playback duration
		await this.delay(500);

		this.playing = false;
	}

	async stop(): Promise<void> {
		this.ensureInitialized();

		this.playing = false;
		this.paused = false;
	}

	async pause(): Promise<void> {
		this.ensureInitialized();

		if (!this.playing) {
			throw new Error("Nothing is playing");
		}

		this.paused = true;
	}

	async resume(): Promise<void> {
		this.ensureInitialized();

		if (!this.paused) {
			throw new Error("Not paused");
		}

		this.paused = false;
	}

	isPlaying(): boolean {
		return this.playing && !this.paused;
	}

	setVolume(volume: number): void {
		if (volume < 0 || volume > 1) {
			throw new Error("Volume must be between 0 and 1");
		}
		this.volume = volume;
	}

	getVolume(): number {
		return this.volume;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		if (this.playing) {
			await this.stop();
		}

		this.initialized = false;
	}

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Audio player not initialized");
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
