import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockSTTDriver } from "./mock-stt.js";
import type { STTConfig } from "../../interfaces/stt.js";

describe("MockSTTDriver", () => {
	let driver: MockSTTDriver;
	let config: STTConfig;

	beforeEach(() => {
		config = {
			engine: "mock",
			language: "en",
		};
		driver = new MockSTTDriver();
	});

	it("should initialize successfully", async () => {
		expect(driver.isReady()).toBe(false);
		await driver.initialize(config);
		expect(driver.isReady()).toBe(true);
	});

	it("should throw error if initialized twice", async () => {
		await driver.initialize(config);
		await expect(driver.initialize(config)).rejects.toThrow(
			"STT already initialized",
		);
	});

	it("should transcribe from file", async () => {
		await driver.initialize(config);
		const result = await driver.transcribeFile("test.wav");
		
		expect(result.text).toBeTruthy();
		expect(result.confidence).toBeGreaterThanOrEqual(0.95);
		expect(result.confidence).toBeLessThanOrEqual(1.0);
		expect(result.language).toBe("en");
		expect(result.processingTime).toBeGreaterThan(0);
	});

	it("should transcribe from buffer", async () => {
		await driver.initialize(config);
		const buffer = Buffer.from("fake-audio-data");
		const result = await driver.transcribeBuffer(buffer);
		
		expect(result.text).toBeTruthy();
		expect(result.confidence).toBeGreaterThan(0);
		expect(result.language).toBe("en");
	});

	it("should cycle through mock transcriptions", async () => {
		await driver.initialize(config);
		
		const result1 = await driver.transcribeFile("test1.wav");
		const result2 = await driver.transcribeFile("test2.wav");
		const result3 = await driver.transcribeFile("test3.wav");
		
		// Should get different transcriptions
		expect(result1.text).not.toBe(result2.text);
		expect(result2.text).not.toBe(result3.text);
	});

	it("should set custom mock transcriptions", async () => {
		await driver.initialize(config);
		
		const customTranscriptions = ["Test one", "Test two"];
		driver.setMockTranscriptions(customTranscriptions);
		
		const result1 = await driver.transcribeFile("test.wav");
		const result2 = await driver.transcribeFile("test.wav");
		const result3 = await driver.transcribeFile("test.wav");
		
		expect(result1.text).toBe("Test one");
		expect(result2.text).toBe("Test two");
		expect(result3.text).toBe("Test one"); // Cycles back
	});

	it("should start realtime transcription", async () => {
		await driver.initialize(config);
		
		const callback = vi.fn();
		await driver.startRealtime(callback);
		
		expect(driver.isRealtimeActive()).toBe(true);
		
		// Wait for at least one transcription
		await new Promise((resolve) => setTimeout(resolve, 2200));
		
		expect(callback).toHaveBeenCalled();
		expect(callback.mock.calls[0][0].text).toBeTruthy();
		
		await driver.stopRealtime();
	});

	it("should stop realtime transcription", async () => {
		await driver.initialize(config);
		
		const callback = vi.fn();
		await driver.startRealtime(callback);
		await driver.stopRealtime();
		
		expect(driver.isRealtimeActive()).toBe(false);
	});

	it("should throw error if starting realtime twice", async () => {
		await driver.initialize(config);
		
		const callback = vi.fn();
		await driver.startRealtime(callback);
		
		await expect(driver.startRealtime(callback)).rejects.toThrow(
			"Realtime transcription already active",
		);
		
		await driver.stopRealtime();
	});

	it("should close successfully", async () => {
		await driver.initialize(config);
		await driver.close();
		expect(driver.isReady()).toBe(false);
	});

	it("should stop realtime on close", async () => {
		await driver.initialize(config);
		
		const callback = vi.fn();
		await driver.startRealtime(callback);
		
		await driver.close();
		expect(driver.isRealtimeActive()).toBe(false);
		expect(driver.isReady()).toBe(false);
	});
});
