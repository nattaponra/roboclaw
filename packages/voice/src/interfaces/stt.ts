/**
 * Speech-to-Text (STT) interface
 */

export interface STTConfig {
	/** STT engine type */
	engine: "whisper" | "mock";
	/** Model name/path */
	model?: string;
	/** Language code (e.g., 'en', 'th') */
	language?: string;
	/** Additional engine-specific options */
	options?: Record<string, unknown>;
}

export interface TranscriptionResult {
	/** Transcribed text */
	text: string;
	/** Confidence score (0-1) */
	confidence?: number;
	/** Language detected */
	language?: string;
	/** Processing time in milliseconds */
	processingTime?: number;
}

export interface STTDriver {
	/**
	 * Initialize the STT engine
	 */
	initialize(config: STTConfig): Promise<void>;

	/**
	 * Transcribe audio from a file
	 * @param audioPath - Path to audio file (WAV, MP3, etc.)
	 * @returns Transcription result
	 */
	transcribeFile(audioPath: string): Promise<TranscriptionResult>;

	/**
	 * Transcribe audio from a buffer
	 * @param audioBuffer - Audio data buffer
	 * @param format - Audio format (e.g., 'wav', 'mp3')
	 * @returns Transcription result
	 */
	transcribeBuffer(
		audioBuffer: Buffer,
		format?: string,
	): Promise<TranscriptionResult>;

	/**
	 * Start real-time transcription
	 * @param callback - Called with transcription results
	 */
	startRealtime(callback: (result: TranscriptionResult) => void): Promise<void>;

	/**
	 * Stop real-time transcription
	 */
	stopRealtime(): Promise<void>;

	/**
	 * Check if engine is ready
	 */
	isReady(): boolean;

	/**
	 * Close the STT engine
	 */
	close(): Promise<void>;
}
