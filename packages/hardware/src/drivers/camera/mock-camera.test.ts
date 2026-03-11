import { describe, it, expect, beforeEach } from "vitest";
import { MockCameraDriver } from "./mock-camera.js";
import type { CameraConfig } from "../../interfaces/camera.js";

describe("MockCameraDriver", () => {
	let driver: MockCameraDriver;
	let config: CameraConfig;

	beforeEach(() => {
		config = {
			type: "mock",
			resolution: [640, 480],
			fps: 10,
		};
		driver = new MockCameraDriver();
	});

	it("should initialize successfully", async () => {
		expect(driver.isReady()).toBe(false);
		await driver.initialize(config);
		expect(driver.isReady()).toBe(true);
	});

	it("should throw error if initialized twice", async () => {
		await driver.initialize(config);
		await expect(driver.initialize(config)).rejects.toThrow(
			"Camera already initialized",
		);
	});

	it("should capture an image", async () => {
		await driver.initialize(config);
		const image = await driver.captureImage();
		expect(image).toBeInstanceOf(Buffer);
		expect(image.length).toBeGreaterThan(0);
	});

	it("should track capture count", async () => {
		await driver.initialize(config);
		expect(driver.getCaptureCount()).toBe(0);
		await driver.captureImage();
		expect(driver.getCaptureCount()).toBe(1);
		await driver.captureImage();
		expect(driver.getCaptureCount()).toBe(2);
	});

	it("should stream frames", async () => {
		await driver.initialize(config);
		
		const frames: Buffer[] = [];
		const stream = driver.startStreaming();

		// Collect 3 frames
		for await (const frame of stream) {
			frames.push(frame);
			if (frames.length >= 3) {
				await driver.stopStreaming();
				break;
			}
		}

		expect(frames.length).toBe(3);
		expect(driver.isStreaming()).toBe(false);
	});

	it("should throw error if not initialized before capture", async () => {
		await expect(driver.captureImage()).rejects.toThrow(
			"Camera not initialized",
		);
	});

	it("should throw error if streaming already started", async () => {
		await driver.initialize(config);
		
		const stream1 = driver.startStreaming();
		
		// Consume first frame to ensure streaming started
		const { value: value1 } = await stream1.next();
		expect(value1).toBeInstanceOf(Buffer);
		
		// Try to start another stream - should throw when we try to iterate
		const stream2 = driver.startStreaming();
		await expect(stream2.next()).rejects.toThrow("Stream already started");

		// Cleanup
		await driver.stopStreaming();
	});

	it("should close successfully", async () => {
		await driver.initialize(config);
		await driver.captureImage();
		await driver.close();
		expect(driver.isReady()).toBe(false);
	});

	it("should stop streaming on close", async () => {
		await driver.initialize(config);
		const stream = driver.startStreaming();
		
		setTimeout(() => {
			driver.close();
		}, 100);

		const frames: Buffer[] = [];
		for await (const frame of stream) {
			frames.push(frame);
			// Stream should stop when close() is called
			if (!driver.isStreaming()) {
				break;
			}
		}

		expect(driver.isReady()).toBe(false);
	});
});
