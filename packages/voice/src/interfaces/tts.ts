/**
 * Text-to-Speech (TTS) interface
 */

export interface TTSConfig {
	/** TTS engine type */
	engine: "piper" | "mock";
	/** Voice model name/path */
	voice?: string;
	/** Speech rate (0.5 - 2.0, 1.0 = normal) */
	rate?: number;
	/** Volume (0.0 - 1.0) */
	volume?: number;
	/** Pitch adjustment (-10 to 10, 0 = normal) */
	pitch?: number;
	/** Output audio format */
	format?: "wav" | "mp3" | "raw";
	/** Sample rate in Hz */
	sampleRate?: number;
	/** Additional engine-specific options */
	options?: Record<string, unknown>;
}

export interface SynthesisResult {
	/** Audio data buffer */
	audio: Buffer;
	/** Audio format */
	format: string;
	/** Duration in seconds */
	duration?: number;
	/** Sample rate */
	sampleRate?: number;
}

export interface TTSDriver {
	/**
	 * Initialize the TTS engine
	 */
	initialize(config: TTSConfig): Promise<void>;

	/**
	 * Synthesize text to audio file
	 * @param text - Text to synthesize
	 * @param outputPath - Path to save audio file
	 * @returns Synthesis result
	 */
	synthesizeToFile(text: string, outputPath: string): Promise<SynthesisResult>;

	/**
	 * Synthesize text to audio buffer
	 * @param text - Text to synthesize
	 * @returns Synthesis result with audio buffer
	 */
	synthesizeToBuffer(text: string): Promise<SynthesisResult>;

	/**
	 * Synthesize and play text immediately
	 * @param text - Text to speak
	 */
	speak(text: string): Promise<void>;

	/**
	 * Stop current speech
	 */
	stop(): Promise<void>;

	/**
	 * Check if currently speaking
	 */
	isSpeaking(): boolean;

	/**
	 * Check if engine is ready
	 */
	isReady(): boolean;

	/**
	 * Close the TTS engine
	 */
	close(): Promise<void>;
}
