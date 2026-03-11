/**
 * Object Detection interface
 */

export interface ObjectDetectorConfig {
	/** Detector type */
	type: "yolo" | "mock";
	/** Model path or name */
	model?: string;
	/** Confidence threshold (0-1) */
	confidence?: number;
	/** IoU threshold for NMS */
	iouThreshold?: number;
	/** Maximum detections per image */
	maxDetections?: number;
	/** Input image size */
	inputSize?: [number, number];
	/** Additional options */
	options?: Record<string, unknown>;
}

export interface BoundingBox {
	/** X coordinate of top-left corner */
	x: number;
	/** Y coordinate of top-left corner */
	y: number;
	/** Width of bounding box */
	width: number;
	/** Height of bounding box */
	height: number;
}

export interface Detection {
	/** Object class/label */
	class: string;
	/** Confidence score (0-1) */
	confidence: number;
	/** Bounding box coordinates */
	bbox: BoundingBox;
	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

export interface DetectionResult {
	/** List of detected objects */
	detections: Detection[];
	/** Processing time in milliseconds */
	processingTime?: number;
	/** Image dimensions */
	imageDimensions?: {
		width: number;
		height: number;
	};
}

export interface ObjectDetector {
	/**
	 * Initialize the object detector
	 */
	initialize(config: ObjectDetectorConfig): Promise<void>;

	/**
	 * Detect objects in an image file
	 * @param imagePath - Path to image file
	 * @returns Detection results
	 */
	detectFile(imagePath: string): Promise<DetectionResult>;

	/**
	 * Detect objects in an image buffer
	 * @param imageBuffer - Image data buffer
	 * @returns Detection results
	 */
	detectBuffer(imageBuffer: Buffer): Promise<DetectionResult>;

	/**
	 * Detect objects in a base64-encoded image
	 * @param base64Image - Base64-encoded image
	 * @returns Detection results
	 */
	detectBase64(base64Image: string): Promise<DetectionResult>;

	/**
	 * Check if detector is ready
	 */
	isReady(): boolean;

	/**
	 * Close the detector
	 */
	close(): Promise<void>;
}
