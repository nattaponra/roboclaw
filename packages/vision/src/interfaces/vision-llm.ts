/**
 * Vision LLM interface for image understanding
 */

export interface VisionLLMConfig {
	/** LLM provider */
	provider: "openai" | "anthropic" | "ollama" | "mock";
	/** Model name */
	model?: string;
	/** API key (if needed) */
	apiKey?: string;
	/** API base URL (for custom endpoints) */
	baseUrl?: string;
	/** Max tokens for response */
	maxTokens?: number;
	/** Temperature for generation */
	temperature?: number;
	/** Additional options */
	options?: Record<string, unknown>;
}

export interface VisionLLMMessage {
	/** Message role */
	role: "user" | "assistant" | "system";
	/** Text content */
	content: string;
	/** Image data (base64 or URL) */
	image?: string;
}

export interface VisionLLMResponse {
	/** Generated text response */
	text: string;
	/** Confidence/reasoning (if available) */
	confidence?: number;
	/** Usage statistics */
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	/** Processing time in milliseconds */
	processingTime?: number;
}

export interface VisionLLM {
	/**
	 * Initialize the Vision LLM
	 */
	initialize(config: VisionLLMConfig): Promise<void>;

	/**
	 * Analyze an image with a prompt
	 * @param imagePath - Path to image file
	 * @param prompt - Question or instruction about the image
	 * @returns LLM response
	 */
	analyzeImage(imagePath: string, prompt: string): Promise<VisionLLMResponse>;

	/**
	 * Analyze an image buffer with a prompt
	 * @param imageBuffer - Image data buffer
	 * @param prompt - Question or instruction about the image
	 * @returns LLM response
	 */
	analyzeImageBuffer(
		imageBuffer: Buffer,
		prompt: string,
	): Promise<VisionLLMResponse>;

	/**
	 * Analyze a base64-encoded image with a prompt
	 * @param base64Image - Base64-encoded image
	 * @param prompt - Question or instruction about the image
	 * @returns LLM response
	 */
	analyzeImageBase64(
		base64Image: string,
		prompt: string,
	): Promise<VisionLLMResponse>;

	/**
	 * Multi-turn conversation with images
	 * @param messages - Conversation history with images
	 * @returns LLM response
	 */
	chat(messages: VisionLLMMessage[]): Promise<VisionLLMResponse>;

	/**
	 * Describe an image (default prompt)
	 * @param imagePath - Path to image file
	 * @returns Image description
	 */
	describeImage(imagePath: string): Promise<string>;

	/**
	 * Detect objects in an image using Vision LLM
	 * @param imagePath - Path to image file
	 * @returns List of detected objects
	 */
	detectObjects(imagePath: string): Promise<string[]>;

	/**
	 * Answer a question about an image
	 * @param imagePath - Path to image file
	 * @param question - Question about the image
	 * @returns Answer
	 */
	answerQuestion(imagePath: string, question: string): Promise<string>;

	/**
	 * Check if Vision LLM is ready
	 */
	isReady(): boolean;

	/**
	 * Close the Vision LLM
	 */
	close(): Promise<void>;
}
