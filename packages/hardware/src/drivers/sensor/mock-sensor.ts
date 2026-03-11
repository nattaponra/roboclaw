import type { SensorDriver, SensorConfig } from "../../interfaces/sensor.js";

/**
 * Mock sensor driver for testing without real hardware.
 * Simulates distance readings with random variations.
 */
export class MockSensorDriver implements SensorDriver {
	private config?: SensorConfig;
	private initialized = false;
	private readingInterval?: NodeJS.Timeout;
	private callback?: (distance: number) => void;
	private baseDistance = 50; // Base distance in cm
	private readCount = 0;

	async initialize(config: SensorConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Sensor already initialized");
		}

		this.config = config;

		// Simulate initialization delay
		await this.delay(50);

		this.initialized = true;
	}

	async read(): Promise<number> {
		this.ensureInitialized();

		// Simulate reading delay
		await this.delay(30);

		this.readCount++;

		// Generate a realistic distance reading with some variation
		// Add ±5cm random variation to base distance
		const variation = (Math.random() - 0.5) * 10;
		const distance = Math.max(2, this.baseDistance + variation);

		// Respect max_distance if configured
		const maxDistance = this.config?.max_distance ?? 400;
		return Math.min(distance, maxDistance);
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
				// Silently ignore errors during continuous reading
				console.error("Mock sensor read error:", error);
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

		this.initialized = false;
		this.config = undefined;
		this.readCount = 0;
	}

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Sensor not initialized");
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public setBaseDistance(distance: number): void {
		if (distance < 2 || distance > 400) {
			throw new Error("Base distance must be between 2 and 400 cm");
		}
		this.baseDistance = distance;
	}

	public getReadCount(): number {
		return this.readCount;
	}

	public isReading(): boolean {
		return this.readingInterval !== undefined;
	}
}
