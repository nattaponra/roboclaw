/**
 * Sensor driver interface
 */

export interface SensorConfig {
	type: 'hcsr04' | 'vl53l0x' | 'mock';
	trigger_pin?: number;
	echo_pin?: number;
	max_distance?: number;
}

export interface SensorDriver {
	/**
	 * Initialize the sensor
	 */
	initialize(config: SensorConfig): Promise<void>;

	/**
	 * Read sensor value
	 * @returns Distance in centimeters
	 */
	read(): Promise<number>;

	/**
	 * Start continuous reading
	 * @param callback - Called with each reading
	 * @param interval - Reading interval in milliseconds
	 */
	startReading(callback: (distance: number) => void, interval: number): void;

	/**
	 * Stop continuous reading
	 */
	stopReading(): void;

	/**
	 * Check if sensor is ready
	 */
	isReady(): boolean;

	/**
	 * Close the sensor
	 */
	close(): Promise<void>;
}
