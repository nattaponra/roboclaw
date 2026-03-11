import { describe, it, expect, beforeEach } from "vitest";
import { MockTTSDriver } from "./mock-tts.js";
import type { TTSConfig } from "../../interfaces/tts.js";

describe("MockTTSDriver", () => {
	let driver: MockTTSDriver;
	let config: TTSConfig;

	beforeEach(() => {
		config = {
			engine: "mock",
			voice: "en_US",
			rate: 1.0,
			volume: 1.0,
		};
		driver = new MockTTSDriver();
	});

	it("should initialize successfully", async () => {
		expect(driver.isReady()).toBe(false);
		await driver.initialize(config);
		expect(driver.isReady()).toBe(true);
	});

	it("should throw error if initialized twice", async () => {
		await driver.initialize(config);
		await expect(driver.initialize(config)).rejects.toThrow(
			"TTS already initialized",
		);
	});

	it("should synthesize to file", async () => {
		await driver.initialize(config);
		const result = await driver.synthesizeToFile(
			"Hello world",
			"/tmp/test.wav",
		);

		expect(result.audio).toBeInstanceOf(Buffer);
		expect(result.format).toBe("wav");
		expect(result.duration).toBeGreaterThan(0);
		expect(result.sampleRate).toBe(22050);
	});

	it("should synthesize to buffer", async () => {
		await driver.initialize(config);
		const result = await driver.synthesizeToBuffer("Hello world");

		expect(result.audio).toBeInstanceOf(Buffer);
		expect(result.audio.length).toBeGreaterThan(0);
		expect(result.format).toBe("wav");
	});

	it("should speak text", async () => {
		await driver.initialize(config);

		const speakPromise = driver.speak("Hello");
		expect(driver.isSpeaking()).toBe(true);

		await speakPromise;
		expect(driver.isSpeaking()).toBe(false);
	});

	it("should stop speaking", async () => {
		await driver.initialize(config);

		const speakPromise = driver.speak("This is a longer sentence");
		expect(driver.isSpeaking()).toBe(true);

		await driver.stop();
		expect(driver.isSpeaking()).toBe(false);

		// Wait for speak promise to resolve
		await speakPromise;
	});

	it("should stop previous speech when speaking new text", async () => {
		await driver.initialize(config);

		// Start speaking
		const firstSpeak = driver.speak("First sentence");
		expect(driver.isSpeaking()).toBe(true);

		// Start speaking something else (should stop first)
		await driver.speak("Second sentence");

		await firstSpeak; // Clean up
	});

	it("should set and get volume", () => {
		driver.setVolume(0.5);
		expect(driver.getVolume()).toBe(0.5);

		driver.setVolume(1.0);
		expect(driver.getVolume()).toBe(1.0);
	});

	it("should throw error for invalid volume", () => {
		expect(() => driver.setVolume(-0.1)).toThrow(
			"Volume must be between 0 and 1",
		);
		expect(() => driver.setVolume(1.5)).toThrow(
			"Volume must be between 0 and 1",
		);
	});

	it("should estimate duration based on text length", async () => {
		await driver.initialize(config);

		const shortResult = await driver.synthesizeToBuffer("Hi");
		const longResult = await driver.synthesizeToBuffer(
			"This is a much longer sentence",
		);

		expect(longResult.duration).toBeGreaterThan(shortResult.duration!);
	});

	it("should close successfully", async () => {
		await driver.initialize(config);
		await driver.close();
		expect(driver.isReady()).toBe(false);
	});

	it("should stop speaking on close", async () => {
		await driver.initialize(config);

		const speakPromise = driver.speak("Test sentence");
		expect(driver.isSpeaking()).toBe(true);

		await driver.close();
		expect(driver.isSpeaking()).toBe(false);

		await speakPromise; // Clean up
	});
});
