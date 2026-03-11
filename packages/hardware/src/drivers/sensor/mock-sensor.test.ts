import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockSensorDriver } from "./mock-sensor.js";
import type { SensorConfig } from "../../interfaces/sensor.js";

describe("MockSensorDriver", () => {
	let driver: MockSensorDriver;
	let config: SensorConfig;

	beforeEach(() => {
		config = {
			type: "mock",
			trigger_pin: 18,
			echo_pin: 24,
			max_distance: 400,
		};
		driver = new MockSensorDriver();
	});

	it("should initialize successfully", async () => {
		expect(driver.isReady()).toBe(false);
		await driver.initialize(config);
		expect(driver.isReady()).toBe(true);
	});

	it("should read distance", async () => {
		await driver.initialize(config);
		const distance = await driver.read();
		expect(distance).toBeGreaterThanOrEqual(2);
		expect(distance).toBeLessThanOrEqual(400);
	});

	it("should track read count", async () => {
		await driver.initialize(config);
		expect(driver.getReadCount()).toBe(0);
		await driver.read();
		expect(driver.getReadCount()).toBe(1);
		await driver.read();
		expect(driver.getReadCount()).toBe(2);
	});

	it("should respect max_distance", async () => {
		const shortConfig = { ...config, max_distance: 100 };
		await driver.initialize(shortConfig);
		const distance = await driver.read();
		expect(distance).toBeLessThanOrEqual(100);
	});

	it("should set base distance", async () => {
		await driver.initialize(config);
		driver.setBaseDistance(100);
		
		// Read multiple times and check average is around 100 (±10)
		const readings: number[] = [];
		for (let i = 0; i < 10; i++) {
			readings.push(await driver.read());
		}
		
		const average = readings.reduce((sum, val) => sum + val, 0) / readings.length;
		expect(average).toBeGreaterThan(90);
		expect(average).toBeLessThan(110);
	});

	it("should start continuous reading", async () => {
		await driver.initialize(config);
		
		const readings: number[] = [];
		const callback = vi.fn((distance: number) => {
			readings.push(distance);
		});

		driver.startReading(callback, 50);
		expect(driver.isReading()).toBe(true);

		// Wait for some readings
		await new Promise((resolve) => setTimeout(resolve, 250));

		driver.stopReading();
		expect(driver.isReading()).toBe(false);
		
		// Should have collected ~5 readings (250ms / 50ms interval)
		expect(readings.length).toBeGreaterThanOrEqual(3);
		expect(readings.length).toBeLessThanOrEqual(6);
	});

	it("should throw error if starting reading twice", async () => {
		await driver.initialize(config);
		
		const callback = vi.fn();
		driver.startReading(callback, 100);
		
		expect(() => {
			driver.startReading(callback, 100);
		}).toThrow("Already reading continuously");
		
		driver.stopReading();
	});

	it("should throw error if stopping reading when not started", async () => {
		await driver.initialize(config);
		
		expect(() => {
			driver.stopReading();
		}).toThrow("Not currently reading");
	});

	it("should throw error for invalid base distance", async () => {
		await driver.initialize(config);
		
		expect(() => {
			driver.setBaseDistance(1);
		}).toThrow("Base distance must be between 2 and 400 cm");
		
		expect(() => {
			driver.setBaseDistance(500);
		}).toThrow("Base distance must be between 2 and 400 cm");
	});

	it("should close successfully", async () => {
		await driver.initialize(config);
		await driver.read();
		await driver.close();
		expect(driver.isReady()).toBe(false);
		expect(driver.getReadCount()).toBe(0);
	});

	it("should stop reading on close", async () => {
		await driver.initialize(config);
		
		const callback = vi.fn();
		driver.startReading(callback, 100);
		expect(driver.isReading()).toBe(true);
		
		await driver.close();
		expect(driver.isReading()).toBe(false);
	});
});
