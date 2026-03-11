/**
 * Audio driver interface
 */

export interface AudioConfig {
	type: 'usb' | 'i2s' | 'mock';
	device: string;
	sample_rate?: number;
}

export interface MicrophoneDriver {
	/**
	 * Initialize the microphone
	 */
	initialize(config: AudioConfig): Promise<void>;

	/**
	 * Start recording audio
	 * @returns Audio stream
	 */
	startRecording(): AsyncIterableIterator<Buffer>;

	/**
	 * Stop recording
	 */
	stopRecording(): Promise<void>;

	/**
	 * Check if microphone is ready
	 */
	isReady(): boolean;

	/**
	 * Close the microphone
	 */
	close(): Promise<void>;
}

export interface SpeakerDriver {
	/**
	 * Initialize the speaker
	 */
	initialize(config: AudioConfig): Promise<void>;

	/**
	 * Play audio buffer
	 * @param buffer - Audio data (PCM)
	 */
	play(buffer: Buffer): Promise<void>;

	/**
	 * Stop playback
	 */
	stop(): Promise<void>;

	/**
	 * Check if speaker is ready
	 */
	isReady(): boolean;

	/**
	 * Close the speaker
	 */
	close(): Promise<void>;
}
