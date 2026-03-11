import { gpioManager } from "../../gpio/gpio-manager.js";
import type { SensorDriver, SensorConfig } from "../../interfaces/sensor.js";

/**
 * HC-SR04 Ultrasonic Distance Sensor Driver
 * Measures distance using ultrasonic sound waves
 * 
 * Working principle:
 * 1. Send 10μs pulse to trigger pin
 * 2. Sensor sends 8 ultrasonic bursts
 * 3. Echo pin goes HIGH when echo is received
 * 4. Distance = (echo pulse width * speed of sound) / 2
 */
export class HCSR04SensorDriver implements SensorDriver {
	private config?: SensorConfig;
	private initialized = false;
	private readingInterval?: NodeJS.Timeout;
	private callback?: (distance: number) => void;

	// Speed of sound in cm/μs (at 20°C)
	private static readonly SPEED_OF_SOUND = 0.0343;

	async initialize(config: SensorConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Sensor already initialized");
		}

		if (!config.trigger_pin || !config.echo_pin) {
			throw new Error("HC-SR04 requires trigger_pin and echo_pin");
		}

		this.config = config;

		try {
			// Setup trigger pin as output
			gpioManager.setupPin(config.trigger_pin, "out");
			
			// Setup echo pin as input with rising edge detection
			gpioManager.setupPin(config.echo_pin, "in", "both");

			// Initialize trigger pin to LOW
			gpioManager.write(config.trigger_pin, 0);

			// Wait for sensor to settle
			await this.delay(50);

			this.initialized = true;
		} catch (error) {
			await this.cleanup();
			throw new Error(`Failed to initialize HC-SR04 sensor: ${error}`);
		}
	}

	async read(): Promise<number> {
		this.ensureInitialized();

		const triggerPin = this.config!.trigger_pin!;
		const echoPin = this.config!.echo_pin!;
		const maxDistance = this.config!.max_distance ?? 400;

		// Send 10μs trigger pulse
		gpioManager.write(triggerPin, 1);
		await this.delay(0.01); // 10 microseconds
		gpioManager.write(triggerPin, 0);

		// Measure echo pulse width
		const pulseWidth = await this.measurePulseWidth(echoPin);

		// Calculate distance in cm
		// distance = (pulseWidth * speedOfSound) / 2
		const distance = (pulseWidth * HCSR04SensorDriver.SPEED_OF_SOUND) / 2;

		// Clamp to valid range (2cm to maxDistance)
		return Math.max(2, Math.min(distance, maxDistance));
	}

	startReading(callback: (distance: number) => void, interval: number): void {
		this.ensureInitialized();

		if (this.readingInterval) {
			throw new Error("Already reading continuously");
		}

		this.callback = callback;

		// Start continuous reading
		this.readingInterval = setInterval(async () => {
			try {
				const distance = await this.read();
				this.callback?.(distance);
			} catch (error) {
				console.error("HC-SR04 read error:", error);
			}
		}, interval);
	}

	stopReading(): void {
		this.ensureInitialized();

		if (!this.readingInterval) {
			throw new Error("Not currently reading");
		}

		clearInterval(this.readingInterval);
		this.readingInterval = undefined;
		this.callback = undefined;
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		// Stop continuous reading if active
		if (this.readingInterval) {
			this.stopReading();
		}

		await this.cleanup();
		this.initialized = false;
		this.config = undefined;
	}

	// Private helper methods

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Sensor not initialized");
		}
	}

	/**
	 * Measure the width of a pulse on the echo pin
	 * Returns pulse width in microseconds
	 * 
	 * Note: This is a simplified implementation.
	 * For more accurate timing, consider using pigpio or similar library.
	 */
	private async measurePulseWidth(echoPin: number): Promise<number> {
		const timeout = 30000; // 30ms timeout (max range ~5m)
		let startTime: bigint;
		let endTime: bigint;

		// Wait for echo pin to go HIGH (with timeout)
		const startWaitTime = Date.now();
		while (gpioManager.read(echoPin) === 0) {
			if (Date.now() - startWaitTime > timeout / 1000) {
				throw new Error("HC-SR04 timeout waiting for echo start");
			}
		}
		startTime = process.hrtime.bigint();

		// Wait for echo pin to go LOW (with timeout)
		const endWaitTime = Date.now();
		while (gpioManager.read(echoPin) === 1) {
			if (Date.now() - endWaitTime > timeout / 1000) {
				throw new Error("HC-SR04 timeout waiting for echo end");
			}
		}
		endTime = process.hrtime.bigint();

		// Calculate pulse width in microseconds
		const pulseWidth = Number(endTime - startTime) / 1000;

		return pulseWidth;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Cleanup GPIO pins
	 */
	private async cleanup(): Promise<void> {
		if (this.config) {
			if (this.config.trigger_pin) {
				gpioManager.releasePin(this.config.trigger_pin);
			}
			if (this.config.echo_pin) {
				gpioManager.releasePin(this.config.echo_pin);
			}
		}
	}
}
