import { gpioManager } from "../../gpio/gpio-manager.js";
import type { MotorDriver, MotorConfig } from "../../interfaces/motor.js";

/**
 * L298N Motor Driver implementation
 * Controls DC motors using the L298N H-Bridge driver IC
 * 
 * Note: This is a simplified implementation using digital GPIO only.
 * For proper PWM speed control, consider using a library like pigpio.
 */
export class L298NDriver implements MotorDriver {
	private config?: MotorConfig;
	private initialized = false;
	private leftSpeed = 0;
	private rightSpeed = 0;

	async initialize(config: MotorConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Motor driver already initialized");
		}

		this.config = config;

		try {
			// Initialize left motor pins
			gpioManager.setupPin(config.motors.left.pwm_pin, "out");
			gpioManager.setupPin(config.motors.left.in1_pin, "out");
			gpioManager.setupPin(config.motors.left.in2_pin, "out");

			// Initialize right motor pins
			gpioManager.setupPin(config.motors.right.pwm_pin, "out");
			gpioManager.setupPin(config.motors.right.in1_pin, "out");
			gpioManager.setupPin(config.motors.right.in2_pin, "out");

			// Set initial state (all stopped)
			this.stopMotorPins(config.motors.left);
			this.stopMotorPins(config.motors.right);

			this.initialized = true;
		} catch (error) {
			// Cleanup on error
			await this.cleanup();
			throw new Error(`Failed to initialize L298N driver: ${error}`);
		}
	}

	async forward(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		await this.setMotorSpeeds(speed, speed);
	}

	async backward(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		await this.setMotorSpeeds(-speed, -speed);
	}

	async turnLeft(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		// Turn left by reversing left motor
		await this.setMotorSpeeds(-speed, speed);
	}

	async turnRight(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		// Turn right by reversing right motor
		await this.setMotorSpeeds(speed, -speed);
	}

	async stop(): Promise<void> {
		this.ensureInitialized();

		await this.setMotorSpeeds(0, 0);
	}

	async setMotorSpeeds(left: number, right: number): Promise<void> {
		this.ensureInitialized();

		// Validate speeds are in range [-255, 255]
		if (Math.abs(left) > 255 || Math.abs(right) > 255) {
			throw new Error("Motor speed must be between -255 and 255");
		}

		// Set left motor
		this.setMotorSpeed(this.config!.motors.left, left);

		// Set right motor
		this.setMotorSpeed(this.config!.motors.right, right);

		this.leftSpeed = left;
		this.rightSpeed = right;
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		// Stop motors before closing
		if (this.leftSpeed !== 0 || this.rightSpeed !== 0) {
			await this.stop();
		}

		await this.cleanup();
		this.initialized = false;
		this.config = undefined;
	}

	// Private helper methods

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Motor driver not initialized");
		}
	}

	private validateSpeed(speed: number): void {
		if (speed < 0 || speed > 255) {
			throw new Error("Speed must be between 0 and 255");
		}
	}

	/**
	 * Set individual motor speed and direction
	 * Note: Uses digital on/off, not true PWM. For true PWM, use pigpio library.
	 */
	private setMotorSpeed(motorPins: { pwm_pin: number; in1_pin: number; in2_pin: number; max_speed: number }, speed: number): void {
		// Clamp speed to max_speed
		const clampedSpeed = Math.min(Math.abs(speed), motorPins.max_speed);

		if (speed > 0) {
			// Forward direction
			gpioManager.write(motorPins.in1_pin, 1);
			gpioManager.write(motorPins.in2_pin, 0);
			// Simple digital PWM: on if speed > threshold
			gpioManager.write(motorPins.pwm_pin, clampedSpeed > 127 ? 1 : 0);
		} else if (speed < 0) {
			// Backward direction
			gpioManager.write(motorPins.in1_pin, 0);
			gpioManager.write(motorPins.in2_pin, 1);
			// Simple digital PWM: on if speed > threshold
			gpioManager.write(motorPins.pwm_pin, clampedSpeed > 127 ? 1 : 0);
		} else {
			// Stop
			this.stopMotorPins(motorPins);
		}
	}

	/**
	 * Stop a motor by setting all control pins low
	 */
	private stopMotorPins(motorPins: { pwm_pin: number; in1_pin: number; in2_pin: number }): void {
		gpioManager.write(motorPins.in1_pin, 0);
		gpioManager.write(motorPins.in2_pin, 0);
		gpioManager.write(motorPins.pwm_pin, 0);
	}

	/**
	 * Cleanup all GPIO pins
	 */
	private async cleanup(): Promise<void> {
		if (this.config) {
			// Release left motor pins
			gpioManager.releasePin(this.config.motors.left.pwm_pin);
			gpioManager.releasePin(this.config.motors.left.in1_pin);
			gpioManager.releasePin(this.config.motors.left.in2_pin);

			// Release right motor pins
			gpioManager.releasePin(this.config.motors.right.pwm_pin);
			gpioManager.releasePin(this.config.motors.right.in1_pin);
			gpioManager.releasePin(this.config.motors.right.in2_pin);
		}
	}
}
