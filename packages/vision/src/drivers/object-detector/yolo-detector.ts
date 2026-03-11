import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
	ObjectDetector,
	ObjectDetectorConfig,
	DetectionResult,
	Detection,
} from "../../interfaces/object-detector.js";

const execAsync = promisify(exec);

/**
 * YOLO Object Detector
 * Uses YOLOv5/YOLOv8 via Python script or ONNX runtime
 * 
 * Prerequisites:
 * - Python with ultralytics/yolov5 installed, OR
 * - ONNX Runtime with YOLO model
 * - Specify detection script path in config.options.scriptPath
 */
export class YOLODetector implements ObjectDetector {
	private config?: ObjectDetectorConfig;
	private initialized = false;
	private scriptPath?: string;

	async initialize(config: ObjectDetectorConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Object detector already initialized");
		}

		this.config = config;

		// Check for detection script
		if (config.options?.scriptPath) {
			this.scriptPath = config.options.scriptPath as string;
		} else {
			// Try to find yolo command
			try {
				await execAsync("which yolo");
				this.scriptPath = "yolo";
			} catch {
				throw new Error(
					"YOLO not found. Please install ultralytics (pip install ultralytics) or provide scriptPath in config.",
				);
			}
		}

		this.initialized = true;
	}

	async detectFile(imagePath: string): Promise<DetectionResult> {
		this.ensureInitialized();

		const startTime = Date.now();

		try {
			// Create temp file for results
			const resultFile = join(tmpdir(), `yolo_results_${Date.now()}.json`);

			// Build YOLO command
			const model = this.config?.model ?? "yolov8n.pt";
			const confidence = this.config?.confidence ?? 0.25;

			// Example command for ultralytics YOLO
			const command = [
				this.scriptPath!,
				"predict",
				`model=${model}`,
				`source=${imagePath}`,
				`conf=${confidence}`,
				`save_json=${resultFile}`,
				"--quiet",
			].join(" ");

			await execAsync(command);

			// Read results
			const resultsJson = await readFile(resultFile, "utf-8");
			const results = JSON.parse(resultsJson);

			// Clean up temp file
			await unlink(resultFile).catch(() => {
				/* ignore */
			});

			const processingTime = Date.now() - startTime;

			return this.parseYOLOResults(results, processingTime);
		} catch (error) {
			throw new Error(`YOLO detection failed: ${error}`);
		}
	}

	async detectBuffer(imageBuffer: Buffer): Promise<DetectionResult> {
		this.ensureInitialized();

		// Save buffer to temp file
		const tempFile = join(tmpdir(), `yolo_input_${Date.now()}.jpg`);

		try {
			await writeFile(tempFile, imageBuffer);
			const result = await this.detectFile(tempFile);

			// Clean up
			await unlink(tempFile).catch(() => {
				/* ignore */
			});

			return result;
		} catch (error) {
			await unlink(tempFile).catch(() => {
				/* ignore */
			});
			throw error;
		}
	}

	async detectBase64(base64Image: string): Promise<DetectionResult> {
		this.ensureInitialized();

		// Convert base64 to buffer
		const imageBuffer = Buffer.from(base64Image, "base64");
		return this.detectBuffer(imageBuffer);
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		this.initialized = false;
		this.config = undefined;
	}

	// Private helper methods

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Object detector not initialized");
		}
	}

	/**
	 * Parse YOLO detection results into standard format
	 */
	private parseYOLOResults(
		results: any,
		processingTime: number,
	): DetectionResult {
		const detections: Detection[] = [];

		// Parse YOLO output format (varies by version)
		// This is a simplified parser - adjust based on actual YOLO output
		if (Array.isArray(results)) {
			for (const detection of results) {
				detections.push({
					class: detection.name || detection.class || "unknown",
					confidence: detection.confidence || detection.conf || 0,
					bbox: {
						x: detection.x || detection.xmin || 0,
						y: detection.y || detection.ymin || 0,
						width: detection.width || detection.w || 0,
						height: detection.height || detection.h || 0,
					},
				});
			}
		} else if (results.detections) {
			// Alternative format
			for (const detection of results.detections) {
				detections.push({
					class: detection.class,
					confidence: detection.confidence,
					bbox: detection.bbox,
				});
			}
		}

		return {
			detections,
			processingTime,
			imageDimensions: results.imageDimensions,
		};
	}
}
