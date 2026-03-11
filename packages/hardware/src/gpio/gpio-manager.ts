/**
 * GPIO Manager for Raspberry Pi
 * Provides abstraction over the onoff library
 */

import { Gpio } from 'onoff';

export type PinDirection = 'in' | 'out';
export type PinEdge = 'none' | 'rising' | 'falling' | 'both';

export class GPIOManager {
	private pins: Map<number, Gpio> = new Map();

	/**
	 * Setup a GPIO pin
	 * @param pin - GPIO pin number (BCM numbering)
	 * @param direction - 'in' or 'out'
	 * @param edge - For input pins: 'none', 'rising', 'falling', 'both'
	 */
	setupPin(pin: number, direction: PinDirection, edge: PinEdge = 'none'): void {
		if (this.pins.has(pin)) {
			throw new Error(`GPIO pin ${pin} is already in use`);
		}

		try {
			const gpio = new Gpio(pin, direction, edge);
			this.pins.set(pin, gpio);
		} catch (error) {
			throw new Error(`Failed to setup GPIO pin ${pin}: ${error}`);
		}
	}

	/**
	 * Write a value to an output pin
	 * @param pin - GPIO pin number
	 * @param value - 0 or 1
	 */
	write(pin: number, value: 0 | 1): void {
		const gpio = this.pins.get(pin);
		if (!gpio) {
			throw new Error(`GPIO pin ${pin} is not initialized`);
		}

		try {
			gpio.writeSync(value);
		} catch (error) {
			throw new Error(`Failed to write to GPIO pin ${pin}: ${error}`);
		}
	}

	/**
	 * Read a value from an input pin
	 * @param pin - GPIO pin number
	 * @returns 0 or 1
	 */
	read(pin: number): 0 | 1 {
		const gpio = this.pins.get(pin);
		if (!gpio) {
			throw new Error(`GPIO pin ${pin} is not initialized`);
		}

		try {
			return gpio.readSync() as 0 | 1;
		} catch (error) {
			throw new Error(`Failed to read from GPIO pin ${pin}: ${error}`);
		}
	}

	/**
	 * Set up an interrupt handler for an input pin
	 * @param pin - GPIO pin number
	 * @param callback - Function to call on interrupt
	 */
	watch(pin: number, callback: (err: Error | null | undefined, value: number) => void): void {
		const gpio = this.pins.get(pin);
		if (!gpio) {
			throw new Error(`GPIO pin ${pin} is not initialized`);
		}

		gpio.watch(callback);
	}

	/**
	 * Remove interrupt handler from a pin
	 * @param pin - GPIO pin number
	 */
	unwatch(pin: number): void {
		const gpio = this.pins.get(pin);
		if (!gpio) {
			return;
		}

		gpio.unwatch();
	}

	/**
	 * Release a GPIO pin
	 * @param pin - GPIO pin number
	 */
	releasePin(pin: number): void {
		const gpio = this.pins.get(pin);
		if (!gpio) {
			return;
		}

		gpio.unexport();
		this.pins.delete(pin);
	}

	/**
	 * Release all GPIO pins
	 */
	releaseAll(): void {
		for (const [pin, gpio] of this.pins) {
			try {
				gpio.unexport();
			} catch (error) {
				console.error(`Error releasing GPIO pin ${pin}:`, error);
			}
		}
		this.pins.clear();
	}

	/**
	 * Check if a pin is initialized
	 */
	isPinInitialized(pin: number): boolean {
		return this.pins.has(pin);
	}

	/**
	 * Get list of initialized pins
	 */
	getInitializedPins(): number[] {
		return Array.from(this.pins.keys());
	}
}

/**
 * Singleton GPIO manager instance
 */
export const gpioManager = new GPIOManager();
