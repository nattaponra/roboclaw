import type { CameraDriver, CameraConfig } from "../../interfaces/camera.js";

/**
 * Mock camera driver for testing without real hardware.
 * Simulates camera operations with fake data.
 */
export class MockCameraDriver implements CameraDriver {
	private config?: CameraConfig;
	private initialized = false;
	private captureCount = 0;
	private streaming = false;

	async initialize(config: CameraConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Camera already initialized");
		}

		this.config = config;

		// Simulate initialization delay
		await this.delay(100);

		this.initialized = true;
	}

	async captureImage(): Promise<Buffer> {
		this.ensureInitialized();

		// Simulate capture delay
		await this.delay(50);

		// Generate fake image data (1x1 pixel PNG)
		// This is a minimal valid PNG file
		const fakeImage = Buffer.from([
			0x89,
			0x50,
			0x4e,
			0x47,
			0x0d,
			0x0a,
			0x1a,
			0x0a, // PNG signature
			0x00,
			0x00,
			0x00,
			0x0d, // IHDR chunk length
			0x49,
			0x48,
			0x44,
			0x52, // IHDR
			0x00,
			0x00,
			0x00,
			0x01, // Width: 1
			0x00,
			0x00,
			0x00,
			0x01, // Height: 1
			0x08,
			0x02,
			0x00,
			0x00,
			0x00, // 8-bit RGB
			0x90,
			0x77,
			0x53,
			0xde, // CRC
			0x00,
			0x00,
			0x00,
			0x0c, // IDAT chunk length
			0x49,
			0x44,
			0x41,
			0x54, // IDAT
			0x08,
			0xd7,
			0x63,
			0xf8,
			0xcf,
			0xc0,
			0x00,
			0x00, // Compressed data
			0x03,
			0x01,
			0x01,
			0x00,
			0x18,
			0xdd,
			0x8d,
			0xb4, // CRC
			0x00,
			0x00,
			0x00,
			0x00, // IEND chunk length
			0x49,
			0x45,
			0x4e,
			0x44, // IEND
			0xae,
			0x42,
			0x60,
			0x82, // CRC
		]);

		this.captureCount++;

		return fakeImage;
	}

	async *startStreaming(): AsyncIterableIterator<Buffer> {
		this.ensureInitialized();

		if (this.streaming) {
			throw new Error("Stream already started");
		}

		this.streaming = true;

		// Simulate streaming at the configured FPS
		const fps = this.config?.fps ?? 10;
		const frameDelay = 1000 / fps;

		try {
			while (this.streaming) {
				// Generate a fake frame
				const fakeFrame = Buffer.from("mock-frame-data");
				yield fakeFrame;

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

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Camera not initialized");
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public getCaptureCount(): number {
		return this.captureCount;
	}

	public isStreaming(): boolean {
		return this.streaming;
	}
}
