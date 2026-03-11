import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CameraDriver, CameraConfig } from "../../interfaces/camera.js";

const execAsync = promisify(exec);

/**
 * Raspberry Pi Camera Driver
 * Supports both legacy (raspistill) and modern (libcamera-still) camera stacks
 */
export class PiCameraDriver implements CameraDriver {
	private config?: CameraConfig;
	private initialized = false;
	private streaming = false;
	private cameraCommand: "raspistill" | "libcamera-still" = "libcamera-still";

	async initialize(config: CameraConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Camera already initialized");
		}

		this.config = config;

		// Detect which camera command is available
		try {
			await execAsync("which libcamera-still");
			this.cameraCommand = "libcamera-still";
		} catch {
			try {
				await execAsync("which raspistill");
				this.cameraCommand = "raspistill";
			} catch {
				throw new Error(
					"Neither libcamera-still nor raspistill found. Please install camera tools.",
				);
			}
		}

		// Test camera by taking a dummy capture
		try {
			await this.captureImage();
			this.initialized = true;
		} catch (error) {
			throw new Error(`Failed to initialize Pi Camera: ${error}`);
		}
	}

	async captureImage(): Promise<Buffer> {
		this.ensureInitialized();

		const [width, height] = this.config!.resolution;
		const tempFile = join(tmpdir(), `picamera_${Date.now()}.jpg`);

		try {
			// Build command based on available tool
			let command: string;

			if (this.cameraCommand === "libcamera-still") {
				command = [
					"libcamera-still",
					"--output",
					tempFile,
					"--width",
					width.toString(),
					"--height",
					height.toString(),
					"--timeout",
					"1", // 1ms timeout (immediate capture)
					"--nopreview",
				].join(" ");
			} else {
				// raspistill
				command = [
					"raspistill",
					"-o",
					tempFile,
					"-w",
					width.toString(),
					"-h",
					height.toString(),
					"-t",
					"1", // 1ms timeout
					"-n", // No preview
				].join(" ");
			}

			// Execute capture command
			await execAsync(command);

			// Read the captured image
			const imageBuffer = await readFile(tempFile);

			// Clean up temp file
			await unlink(tempFile).catch(() => {
				/* ignore cleanup errors */
			});

			return imageBuffer;
		} catch (error) {
			// Try to clean up temp file on error
			await unlink(tempFile).catch(() => {
				/* ignore cleanup errors */
			});
			throw new Error(`Failed to capture image: ${error}`);
		}
	}

	async *startStreaming(): AsyncIterableIterator<Buffer> {
		this.ensureInitialized();

		if (this.streaming) {
			throw new Error("Stream already started");
		}

		this.streaming = true;

		// Calculate frame delay based on FPS
		const frameDelay = 1000 / this.config!.fps;

		try {
			while (this.streaming) {
				// Capture a frame
				const frame = await this.captureImage();
				yield frame;

				// Wait for next frame
				await this.delay(frameDelay);
			}
		} finally {
			this.streaming = false;
		}
	}

	async stopStreaming(): Promise<void> {
		this.ensureInitialized();

		if (!this.streaming) {
			throw new Error("Stream not started");
		}

		this.streaming = false;
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		if (this.streaming) {
			await this.stopStreaming();
		}

		this.initialized = false;
		this.config = undefined;
	}

	// Private helper methods

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Camera not initialized");
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Public getters for testing
	public getCameraCommand(): string {
		return this.cameraCommand;
	}

	public isStreaming(): boolean {
		return this.streaming;
	}
}
