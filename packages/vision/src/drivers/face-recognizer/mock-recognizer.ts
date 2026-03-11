import type {
	FaceRecognizer,
	FaceRecognizerConfig,
	FaceRecognitionResult,
	FaceEmbedding,
} from "../../interfaces/face-recognizer.js";

/**
 * Mock Face Recognizer for testing
 */
export class MockFaceRecognizer implements FaceRecognizer {
	private initialized = false;
	private registeredFaces: Map<string, FaceEmbedding> = new Map();

	async initialize(_config: FaceRecognizerConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Face recognizer already initialized");
		}

		await this.delay(100);

		// Add some default registered faces
		this.registeredFaces.set("Alice", {
			embedding: this.generateMockEmbedding(),
			name: "Alice",
			metadata: { registered: new Date().toISOString() },
		});

		this.registeredFaces.set("Bob", {
			embedding: this.generateMockEmbedding(),
			name: "Bob",
			metadata: { registered: new Date().toISOString() },
		});

		this.initialized = true;
	}

	async recognizeFile(_imagePath: string): Promise<FaceRecognitionResult> {
		this.ensureInitialized();

		await this.delay(200);

		return {
			faces: [
				{
					detection: {
						bbox: { x: 100, y: 100, width: 150, height: 200 },
						confidence: 0.98,
						landmarks: [
							{ x: 130, y: 150 },
							{ x: 160, y: 150 },
							{ x: 145, y: 180 },
						],
					},
					identity: {
						name: "Alice",
						confidence: 0.92,
						metadata: { lastSeen: new Date().toISOString() },
					},
				},
			],
			processingTime: 200,
		};
	}

	async recognizeBuffer(_imageBuffer: Buffer): Promise<FaceRecognitionResult> {
		return this.recognizeFile("mock-buffer");
	}

	async registerFace(
		_imagePath: string,
		name: string,
		metadata?: Record<string, unknown>,
	): Promise<void> {
		this.ensureInitialized();

		await this.delay(150);

		this.registeredFaces.set(name, {
			embedding: this.generateMockEmbedding(),
			name,
			metadata: metadata || {},
		});
	}

	async registerFaceFromBuffer(
		_imageBuffer: Buffer,
		name: string,
		metadata?: Record<string, unknown>,
	): Promise<void> {
		return this.registerFace("mock-buffer", name, metadata);
	}

	async removeFace(name: string): Promise<void> {
		this.ensureInitialized();

		if (!this.registeredFaces.has(name)) {
			throw new Error(`Face not found: ${name}`);
		}

		this.registeredFaces.delete(name);
	}

	async getRegisteredFaces(): Promise<string[]> {
		this.ensureInitialized();
		return Array.from(this.registeredFaces.keys());
	}

	async getEmbedding(_imagePath: string): Promise<FaceEmbedding | null> {
		this.ensureInitialized();

		await this.delay(150);

		return {
			embedding: this.generateMockEmbedding(),
			name: "Unknown",
			metadata: {},
		};
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		this.initialized = false;
		this.registeredFaces.clear();
	}

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Face recognizer not initialized");
		}
	}

	private generateMockEmbedding(): number[] {
		// Generate 128-dimensional embedding (typical for face recognition)
		return Array.from({ length: 128 }, () => Math.random());
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public getRegisteredFaceCount(): number {
		return this.registeredFaces.size;
	}
}
