import type {
	VisionLLM,
	VisionLLMConfig,
	VisionLLMResponse,
	VisionLLMMessage,
} from "../../interfaces/vision-llm.js";

/**
 * Mock Vision LLM for testing
 */
export class MockVisionLLM implements VisionLLM {
	private initialized = false;

	private mockResponses: Record<string, string> = {
		describe:
			"The image shows a living room with a couch, coffee table, and a window with curtains. Natural light is coming through the window.",
		objects: "person, dog, chair, table, lamp",
		"what do you see":
			"I see a person sitting on a couch with a dog. There's a table in front of them with some books on it.",
		"how many people":
			"There is one person visible in the image.",
		"what is the person doing":
			"The person appears to be reading a book while sitting on the couch.",
	};

	async initialize(_config: VisionLLMConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Vision LLM already initialized");
		}

		await this.delay(100);
		this.initialized = true;
	}

	async analyzeImage(
		_imagePath: string,
		prompt: string,
	): Promise<VisionLLMResponse> {
		this.ensureInitialized();

		await this.delay(300);

		const text = this.getMockResponse(prompt);

		return {
			text,
			confidence: 0.9,
			usage: {
				promptTokens: prompt.length / 4,
				completionTokens: text.length / 4,
				totalTokens: (prompt.length + text.length) / 4,
			},
			processingTime: 300,
		};
	}

	async analyzeImageBuffer(
		_imageBuffer: Buffer,
		prompt: string,
	): Promise<VisionLLMResponse> {
		return this.analyzeImage("mock-buffer", prompt);
	}

	async analyzeImageBase64(
		_base64Image: string,
		prompt: string,
	): Promise<VisionLLMResponse> {
		return this.analyzeImage("mock-base64", prompt);
	}

	async chat(messages: VisionLLMMessage[]): Promise<VisionLLMResponse> {
		this.ensureInitialized();

		await this.delay(400);

		// Get the last user message
		const lastUserMessage = messages
			.reverse()
			.find((m) => m.role === "user");
		const prompt = lastUserMessage?.content || "describe this image";

		const text = this.getMockResponse(prompt);

		return {
			text,
			confidence: 0.9,
			usage: {
				promptTokens: messages.reduce((sum, m) => sum + m.content.length / 4, 0),
				completionTokens: text.length / 4,
				totalTokens:
					messages.reduce((sum, m) => sum + m.content.length / 4, 0) +
					text.length / 4,
			},
			processingTime: 400,
		};
	}

	async describeImage(_imagePath: string): Promise<string> {
		this.ensureInitialized();

		await this.delay(300);

		return this.mockResponses.describe;
	}

	async detectObjects(_imagePath: string): Promise<string[]> {
		this.ensureInitialized();

		await this.delay(250);

		return this.mockResponses.objects.split(", ");
	}

	async answerQuestion(
		_imagePath: string,
		question: string,
	): Promise<string> {
		this.ensureInitialized();

		await this.delay(350);

		return this.getMockResponse(question);
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		this.initialized = false;
	}

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Vision LLM not initialized");
		}
	}

	private getMockResponse(prompt: string): string {
		const lowerPrompt = prompt.toLowerCase();

		// Find matching response
		for (const [key, value] of Object.entries(this.mockResponses)) {
			if (lowerPrompt.includes(key)) {
				return value;
			}
		}

		// Default response
		return "Based on the image, I can see various objects and scenes. The image appears to be well-lit and clear.";
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public setMockResponse(key: string, response: string): void {
		this.mockResponses[key] = response;
	}

	public getMockResponses(): Record<string, string> {
		return { ...this.mockResponses };
	}
}
