import type { MotorDriver, MotorConfig } from "../../interfaces/motor.js";

/**
 * Mock motor driver for testing without real hardware.
 * Simulates motor operations and tracks state.
 */
export class MockMotorDriver implements MotorDriver {
	private initialized = false;
	private leftSpeed = 0;
	private rightSpeed = 0;
	private movementHistory: Array<{
		action: string;
		left: number;
		right: number;
		timestamp: number;
	}> = [];

	async initialize(_config: MotorConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Motor driver already initialized");
		}

		// Simulate initialization delay
		await this.delay(50);

		this.initialized = true;
	}

	async forward(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		this.leftSpeed = speed;
		this.rightSpeed = speed;

		this.recordMovement("forward", speed, speed);
	}

	async backward(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		this.leftSpeed = -speed;
		this.rightSpeed = -speed;

		this.recordMovement("backward", -speed, -speed);
	}

	async turnLeft(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		// Turn left by reversing left motor
		this.leftSpeed = -speed;
		this.rightSpeed = speed;

		this.recordMovement("turnLeft", -speed, speed);
	}

	async turnRight(speed: number): Promise<void> {
		this.ensureInitialized();
		this.validateSpeed(speed);

		// Turn right by reversing right motor
		this.leftSpeed = speed;
		this.rightSpeed = -speed;

		this.recordMovement("turnRight", speed, -speed);
	}

	async stop(): Promise<void> {
		this.ensureInitialized();

		this.leftSpeed = 0;
		this.rightSpeed = 0;

		this.recordMovement("stop", 0, 0);
	}

	async setMotorSpeeds(left: number, right: number): Promise<void> {
		this.ensureInitialized();

		// Validate speeds are in range [-255, 255]
		if (Math.abs(left) > 255 || Math.abs(right) > 255) {
			throw new Error("Motor speed must be between -255 and 255");
		}

		this.leftSpeed = left;
		this.rightSpeed = right;

		this.recordMovement("setMotorSpeeds", left, right);
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

		this.initialized = false;
		this.movementHistory = [];
	}

	// Helper methods
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

	private recordMovement(
		action: string,
		left: number,
		right: number,
	): void {
		this.movementHistory.push({
			action,
			left,
			right,
			timestamp: Date.now(),
		});
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public getLeftSpeed(): number {
		return this.leftSpeed;
	}

	public getRightSpeed(): number {
		return this.rightSpeed;
	}

	public getMovementHistory(): Array<{
		action: string;
		left: number;
		right: number;
		timestamp: number;
	}> {
		return [...this.movementHistory];
	}

	public clearHistory(): void {
		this.movementHistory = [];
	}
}
