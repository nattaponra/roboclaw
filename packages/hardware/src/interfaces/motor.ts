/**
 * Motor driver interface
 */

export interface MotorConfig {
	type: 'l298n' | 'tb6612' | 'mock';
	motors: {
		left: MotorPins;
		right: MotorPins;
	};
}

export interface MotorPins {
	pwm_pin: number;
	in1_pin: number;
	in2_pin: number;
	max_speed: number;
}

export interface MotorDriver {
	/**
	 * Initialize the motor driver
	 */
	initialize(config: MotorConfig): Promise<void>;

	/**
	 * Move forward
	 * @param speed - Speed (0-255)
	 */
	forward(speed: number): Promise<void>;

	/**
	 * Move backward
	 * @param speed - Speed (0-255)
	 */
	backward(speed: number): Promise<void>;

	/**
	 * Turn left
	 * @param speed - Speed (0-255)
	 */
	turnLeft(speed: number): Promise<void>;

	/**
	 * Turn right
	 * @param speed - Speed (0-255)
	 */
	turnRight(speed: number): Promise<void>;

	/**
	 * Stop all motors
	 */
	stop(): Promise<void>;

	/**
	 * Set individual motor speeds
	 * @param left - Left motor speed (-255 to 255, negative = reverse)
	 * @param right - Right motor speed (-255 to 255, negative = reverse)
	 */
	setMotorSpeeds(left: number, right: number): Promise<void>;

	/**
	 * Check if motors are initialized
	 */
	isReady(): boolean;

	/**
	 * Cleanup and close
	 */
	close(): Promise<void>;
}
