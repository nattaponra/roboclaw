import { describe, it, expect, beforeEach } from "vitest";
import { MockMotorDriver } from "./mock-motor.js";
import type { MotorConfig } from "../../interfaces/motor.js";

describe("MockMotorDriver", () => {
	let driver: MockMotorDriver;
	let config: MotorConfig;

	beforeEach(() => {
		config = {
			type: "mock",
			motors: {
				left: {
					pwm_pin: 12,
					in1_pin: 23,
					in2_pin: 24,
					max_speed: 255,
				},
				right: {
					pwm_pin: 13,
					in1_pin: 27,
					in2_pin: 22,
					max_speed: 255,
				},
			},
		};
		driver = new MockMotorDriver();
	});

	it("should initialize successfully", async () => {
		expect(driver.isReady()).toBe(false);
		await driver.initialize(config);
		expect(driver.isReady()).toBe(true);
	});

	it("should move forward", async () => {
		await driver.initialize(config);
		await driver.forward(100);
		expect(driver.getLeftSpeed()).toBe(100);
		expect(driver.getRightSpeed()).toBe(100);
	});

	it("should move backward", async () => {
		await driver.initialize(config);
		await driver.backward(100);
		expect(driver.getLeftSpeed()).toBe(-100);
		expect(driver.getRightSpeed()).toBe(-100);
	});

	it("should turn left", async () => {
		await driver.initialize(config);
		await driver.turnLeft(100);
		expect(driver.getLeftSpeed()).toBe(-100);
		expect(driver.getRightSpeed()).toBe(100);
	});

	it("should turn right", async () => {
		await driver.initialize(config);
		await driver.turnRight(100);
		expect(driver.getLeftSpeed()).toBe(100);
		expect(driver.getRightSpeed()).toBe(-100);
	});

	it("should stop", async () => {
		await driver.initialize(config);
		await driver.forward(100);
		await driver.stop();
		expect(driver.getLeftSpeed()).toBe(0);
		expect(driver.getRightSpeed()).toBe(0);
	});

	it("should set individual motor speeds", async () => {
		await driver.initialize(config);
		await driver.setMotorSpeeds(150, -75);
		expect(driver.getLeftSpeed()).toBe(150);
		expect(driver.getRightSpeed()).toBe(-75);
	});

	it("should track movement history", async () => {
		await driver.initialize(config);
		await driver.forward(100);
		await driver.turnLeft(50);
		await driver.stop();

		const history = driver.getMovementHistory();
		expect(history.length).toBe(3);
		expect(history[0].action).toBe("forward");
		expect(history[1].action).toBe("turnLeft");
		expect(history[2].action).toBe("stop");
	});

	it("should clear history", async () => {
		await driver.initialize(config);
		await driver.forward(100);
		expect(driver.getMovementHistory().length).toBe(1);
		driver.clearHistory();
		expect(driver.getMovementHistory().length).toBe(0);
	});

	it("should throw error for invalid speed", async () => {
		await driver.initialize(config);
		await expect(driver.forward(300)).rejects.toThrow(
			"Speed must be between 0 and 255",
		);
		await expect(driver.forward(-10)).rejects.toThrow(
			"Speed must be between 0 and 255",
		);
	});

	it("should throw error for invalid motor speeds range", async () => {
		await driver.initialize(config);
		await expect(driver.setMotorSpeeds(300, 100)).rejects.toThrow(
			"Motor speed must be between -255 and 255",
		);
	});

	it("should close successfully", async () => {
		await driver.initialize(config);
		await driver.forward(100);
		await driver.close();
		expect(driver.isReady()).toBe(false);
		expect(driver.getLeftSpeed()).toBe(0);
		expect(driver.getRightSpeed()).toBe(0);
	});
});
