import type {
	ObjectDetector,
	ObjectDetectorConfig,
	DetectionResult,
	Detection,
} from "../../interfaces/object-detector.js";

/**
 * Mock Object Detector for testing
 */
export class MockObjectDetector implements ObjectDetector {
	private initialized = false;
	private mockDetections: Detection[] = [
		{
			class: "person",
			confidence: 0.95,
			bbox: { x: 100, y: 100, width: 200, height: 300 },
		},
		{
			class: "dog",
			confidence: 0.88,
			bbox: { x: 400, y: 250, width: 150, height: 200 },
		},
		{
			class: "car",
			confidence: 0.92,
			bbox: { x: 50, y: 400, width: 300, height: 150 },
		},
	];

	async initialize(_config: ObjectDetectorConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Object detector already initialized");
		}

		await this.delay(100);
		this.initialized = true;
	}

	async detectFile(_imagePath: string): Promise<DetectionResult> {
		this.ensureInitialized();

		await this.delay(150);

		return {
			detections: this.mockDetections,
			processingTime: 150,
			imageDimensions: {
				width: 640,
				height: 480,
			},
		};
	}

	async detectBuffer(_imageBuffer: Buffer): Promise<DetectionResult> {
		this.ensureInitialized();

		await this.delay(150);

		return {
			detections: this.mockDetections,
			processingTime: 150,
			imageDimensions: {
				width: 640,
				height: 480,
			},
		};
	}

	async detectBase64(_base64Image: string): Promise<DetectionResult> {
		this.ensureInitialized();

		await this.delay(150);

		return {
			detections: this.mockDetections,
			processingTime: 150,
			imageDimensions: {
				width: 640,
				height: 480,
			},
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
	}

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Object detector not initialized");
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public setMockDetections(detections: Detection[]): void {
		this.mockDetections = detections;
	}

	public getMockDetections(): Detection[] {
		return this.mockDetections;
	}
}
