/**
 * Audio input/output interface
 */

export interface AudioConfig {
	/** Audio device type */
	device: "alsa" | "pulseaudio" | "mock";
	/** Sample rate in Hz */
	sampleRate?: number;
	/** Number of channels (1 = mono, 2 = stereo) */
	channels?: number;
	/** Bit depth */
	bitDepth?: 8 | 16 | 24 | 32;
	/** Input device name/ID */
	inputDevice?: string;
	/** Output device name/ID */
	outputDevice?: string;
}

export interface AudioChunk {
	/** Audio data */
	data: Buffer;
	/** Timestamp */
	timestamp: number;
	/** Sample rate */
	sampleRate: number;
	/** Number of channels */
	channels: number;
}

export interface AudioRecorder {
	/**
	 * Initialize the audio recorder
	 */
	initialize(config: AudioConfig): Promise<void>;

	/**
	 * Start recording audio
	 * @param callback - Called with each audio chunk
	 */
	startRecording(callback: (chunk: AudioChunk) => void): Promise<void>;

	/**
	 * Stop recording
	 */
	stopRecording(): Promise<void>;

	/**
	 * Check if currently recording
	 */
	isRecording(): boolean;

	/**
	 * Get audio level (0-100)
	 */
	getLevel(): number;

	/**
	 * Close the recorder
	 */
	close(): Promise<void>;
}

export interface AudioPlayer {
	/**
	 * Initialize the audio player
	 */
	initialize(config: AudioConfig): Promise<void>;

	/**
	 * Play audio from file
	 * @param audioPath - Path to audio file
	 */
	playFile(audioPath: string): Promise<void>;

	/**
	 * Play audio from buffer
	 * @param audioBuffer - Audio data
	 * @param format - Audio format
	 */
	playBuffer(audioBuffer: Buffer, format?: string): Promise<void>;

	/**
	 * Stop playback
	 */
	stop(): Promise<void>;

	/**
	 * Pause playback
	 */
	pause(): Promise<void>;

	/**
	 * Resume playback
	 */
	resume(): Promise<void>;

	/**
	 * Check if currently playing
	 */
	isPlaying(): boolean;

	/**
	 * Set volume (0.0 - 1.0)
	 */
	setVolume(volume: number): void;

	/**
	 * Get current volume
	 */
	getVolume(): number;

	/**
	 * Close the player
	 */
	close(): Promise<void>;
}
