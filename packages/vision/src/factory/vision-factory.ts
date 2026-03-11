import type {
	ObjectDetector,
	ObjectDetectorConfig,
} from "../interfaces/object-detector.js";
import type {
	FaceRecognizer,
	FaceRecognizerConfig,
} from "../interfaces/face-recognizer.js";
import type { VisionLLM, VisionLLMConfig } from "../interfaces/vision-llm.js";

// Object detector drivers
import { MockObjectDetector } from "../drivers/object-detector/mock-detector.js";
import { YOLODetector } from "../drivers/object-detector/yolo-detector.js";

// Face recognizer drivers
import { MockFaceRecognizer } from "../drivers/face-recognizer/mock-recognizer.js";

// Vision LLM drivers
import { MockVisionLLM } from "../drivers/vision-llm/mock-vision-llm.js";

/**
 * Factory for creating vision drivers
 */
export class VisionFactory {
	/**
	 * Create an object detector instance
	 */
	static createObjectDetector(config: ObjectDetectorConfig): ObjectDetector {
		switch (config.type) {
			case "mock":
				return new MockObjectDetector();
			case "yolo":
				return new YOLODetector();
			default:
				throw new Error(`Unknown object detector type: ${config.type}`);
		}
	}

	/**
	 * Create a face recognizer instance
	 */
	static createFaceRecognizer(config: FaceRecognizerConfig): FaceRecognizer {
		switch (config.type) {
			case "mock":
				return new MockFaceRecognizer();
			case "dlib":
			case "facenet":
				throw new Error(
					`${config.type} face recognizer not yet implemented. Use 'mock' for testing.`,
				);
			default:
				throw new Error(`Unknown face recognizer type: ${config.type}`);
		}
	}

	/**
	 * Create a Vision LLM instance
	 */
	static createVisionLLM(config: VisionLLMConfig): VisionLLM {
		switch (config.provider) {
			case "mock":
				return new MockVisionLLM();
			case "openai":
			case "anthropic":
			case "ollama":
				throw new Error(
					`${config.provider} Vision LLM not yet implemented. Use 'mock' for testing.`,
				);
			default:
				throw new Error(`Unknown Vision LLM provider: ${config.provider}`);
		}
	}

	/**
	 * Create and initialize an object detector
	 */
	static async createAndInitializeObjectDetector(
		config: ObjectDetectorConfig,
	): Promise<ObjectDetector> {
		const detector = VisionFactory.createObjectDetector(config);
		await detector.initialize(config);
		return detector;
	}

	/**
	 * Create and initialize a face recognizer
	 */
	static async createAndInitializeFaceRecognizer(
		config: FaceRecognizerConfig,
	): Promise<FaceRecognizer> {
		const recognizer = VisionFactory.createFaceRecognizer(config);
		await recognizer.initialize(config);
		return recognizer;
	}

	/**
	 * Create and initialize a Vision LLM
	 */
	static async createAndInitializeVisionLLM(
		config: VisionLLMConfig,
	): Promise<VisionLLM> {
		const visionLLM = VisionFactory.createVisionLLM(config);
		await visionLLM.initialize(config);
		return visionLLM;
	}
}
