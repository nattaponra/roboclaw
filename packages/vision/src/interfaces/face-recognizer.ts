/**
 * Face Recognition interface
 */

export interface FaceRecognizerConfig {
	/** Recognizer type */
	type: "dlib" | "facenet" | "mock";
	/** Model path or name */
	model?: string;
	/** Minimum face size in pixels */
	minFaceSize?: number;
	/** Confidence threshold for recognition */
	threshold?: number;
	/** Additional options */
	options?: Record<string, unknown>;
}

export interface FaceDetection {
	/** Bounding box of detected face */
	bbox: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	/** Confidence score (0-1) */
	confidence: number;
	/** Face landmarks (optional) */
	landmarks?: Array<{ x: number; y: number }>;
}

export interface FaceRecognitionResult {
	/** Detected faces */
	faces: Array<{
		/** Face detection info */
		detection: FaceDetection;
		/** Recognized identity (if known) */
		identity?: {
			/** Person's name */
			name: string;
			/** Recognition confidence (0-1) */
			confidence: number;
			/** Additional metadata */
			metadata?: Record<string, unknown>;
		};
	}>;
	/** Processing time in milliseconds */
	processingTime?: number;
}

export interface FaceEmbedding {
	/** Face embedding vector */
	embedding: number[];
	/** Person's name */
	name: string;
	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

export interface FaceRecognizer {
	/**
	 * Initialize the face recognizer
	 */
	initialize(config: FaceRecognizerConfig): Promise<void>;

	/**
	 * Detect and recognize faces in an image file
	 * @param imagePath - Path to image file
	 * @returns Recognition results
	 */
	recognizeFile(imagePath: string): Promise<FaceRecognitionResult>;

	/**
	 * Detect and recognize faces in an image buffer
	 * @param imageBuffer - Image data buffer
	 * @returns Recognition results
	 */
	recognizeBuffer(imageBuffer: Buffer): Promise<FaceRecognitionResult>;

	/**
	 * Register a new face
	 * @param imagePath - Path to image file with face
	 * @param name - Person's name
	 * @param metadata - Additional metadata
	 */
	registerFace(
		imagePath: string,
		name: string,
		metadata?: Record<string, unknown>,
	): Promise<void>;

	/**
	 * Register a face from buffer
	 * @param imageBuffer - Image data buffer
	 * @param name - Person's name
	 * @param metadata - Additional metadata
	 */
	registerFaceFromBuffer(
		imageBuffer: Buffer,
		name: string,
		metadata?: Record<string, unknown>,
	): Promise<void>;

	/**
	 * Remove a registered face
	 * @param name - Person's name
	 */
	removeFace(name: string): Promise<void>;

	/**
	 * Get all registered faces
	 * @returns List of registered names
	 */
	getRegisteredFaces(): Promise<string[]>;

	/**
	 * Get face embedding for an image
	 * @param imagePath - Path to image file
	 * @returns Face embedding
	 */
	getEmbedding(imagePath: string): Promise<FaceEmbedding | null>;

	/**
	 * Check if recognizer is ready
	 */
	isReady(): boolean;

	/**
	 * Close the recognizer
	 */
	close(): Promise<void>;
}
