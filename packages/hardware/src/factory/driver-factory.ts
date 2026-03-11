import type {
	CameraDriver,
	CameraConfig,
} from "../interfaces/camera.js";
import type { MotorDriver, MotorConfig } from "../interfaces/motor.js";
import type { SensorDriver, SensorConfig } from "../interfaces/sensor.js";

// Camera drivers
import { MockCameraDriver } from "../drivers/camera/mock-camera.js";
import { PiCameraDriver } from "../drivers/camera/picamera-driver.js";

// Motor drivers
import { MockMotorDriver } from "../drivers/motor/mock-motor.js";
import { L298NDriver } from "../drivers/motor/l298n-driver.js";

// Sensor drivers
import { MockSensorDriver } from "../drivers/sensor/mock-sensor.js";
import { HCSR04SensorDriver } from "../drivers/sensor/hcsr04-sensor.js";

/**
 * Factory for creating hardware drivers based on configuration
 */
export class DriverFactory {
	/**
	 * Create a camera driver instance
	 */
	static createCamera(config: CameraConfig): CameraDriver {
		switch (config.type) {
			case "mock":
				return new MockCameraDriver();
			case "picamera":
				return new PiCameraDriver();
			case "usb":
				// USB camera driver not yet implemented
				throw new Error("USB camera driver not yet implemented");
			default:
				throw new Error(`Unknown camera type: ${config.type}`);
		}
	}

	/**
	 * Create a motor driver instance
	 */
	static createMotor(config: MotorConfig): MotorDriver {
		switch (config.type) {
			case "mock":
				return new MockMotorDriver();
			case "l298n":
				return new L298NDriver();
			case "tb6612":
				// TB6612 driver not yet implemented
				throw new Error("TB6612 motor driver not yet implemented");
			default:
				throw new Error(`Unknown motor type: ${config.type}`);
		}
	}

	/**
	 * Create a sensor driver instance
	 */
	static createSensor(config: SensorConfig): SensorDriver {
		switch (config.type) {
			case "mock":
				return new MockSensorDriver();
			case "hcsr04":
				return new HCSR04SensorDriver();
			case "vl53l0x":
				// VL53L0X driver not yet implemented
				throw new Error("VL53L0X sensor driver not yet implemented");
			default:
				throw new Error(`Unknown sensor type: ${config.type}`);
		}
	}

	/**
	 * Create and initialize a camera driver
	 */
	static async createAndInitializeCamera(
		config: CameraConfig,
	): Promise<CameraDriver> {
		const driver = DriverFactory.createCamera(config);
		await driver.initialize(config);
		return driver;
	}

	/**
	 * Create and initialize a motor driver
	 */
	static async createAndInitializeMotor(
		config: MotorConfig,
	): Promise<MotorDriver> {
		const driver = DriverFactory.createMotor(config);
		await driver.initialize(config);
		return driver;
	}

	/**
	 * Create and initialize a sensor driver
	 */
	static async createAndInitializeSensor(
		config: SensorConfig,
	): Promise<SensorDriver> {
		const driver = DriverFactory.createSensor(config);
		await driver.initialize(config);
		return driver;
	}
}
