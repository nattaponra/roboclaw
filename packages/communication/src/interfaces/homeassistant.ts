/**
 * Home Assistant MQTT Discovery interface
 */

export interface HADiscoveryConfig {
	/** Discovery prefix (default: homeassistant) */
	discoveryPrefix?: string;
	/** Node ID (unique identifier for this device) */
	nodeId: string;
	/** Device info */
	device: {
		/** Device name */
		name: string;
		/** Device model */
		model?: string;
		/** Manufacturer */
		manufacturer?: string;
		/** Software version */
		swVersion?: string;
		/** Hardware version */
		hwVersion?: string;
		/** Device identifiers */
		identifiers?: string[];
	};
	/** Availability topic */
	availabilityTopic?: string;
}

export interface HAEntity {
	/** Entity type (sensor, binary_sensor, switch, camera, etc.) */
	type:
		| "sensor"
		| "binary_sensor"
		| "switch"
		| "button"
		| "camera"
		| "select"
		| "number";
	/** Unique ID */
	uniqueId: string;
	/** Entity name */
	name: string;
	/** State topic */
	stateTopic: string;
	/** Command topic (for controllable entities) */
	commandTopic?: string;
	/** Icon */
	icon?: string;
	/** Unit of measurement */
	unitOfMeasurement?: string;
	/** Device class */
	deviceClass?: string;
	/** Additional configuration */
	config?: Record<string, unknown>;
}

export interface HomeAssistantDiscovery {
	/**
	 * Initialize Home Assistant discovery
	 */
	initialize(config: HADiscoveryConfig): Promise<void>;

	/**
	 * Register an entity with Home Assistant
	 * @param entity - Entity configuration
	 */
	registerEntity(entity: HAEntity): Promise<void>;

	/**
	 * Remove an entity
	 * @param entityType - Entity type
	 * @param uniqueId - Unique ID
	 */
	removeEntity(entityType: string, uniqueId: string): Promise<void>;

	/**
	 * Update entity state
	 * @param uniqueId - Entity unique ID
	 * @param state - New state value
	 */
	updateState(uniqueId: string, state: string | number | boolean): Promise<void>;

	/**
	 * Set device availability
	 * @param available - Whether device is available
	 */
	setAvailability(available: boolean): Promise<void>;

	/**
	 * Get discovery topic for an entity
	 * @param entityType - Entity type
	 * @param uniqueId - Unique ID
	 */
	getDiscoveryTopic(entityType: string, uniqueId: string): string;

	/**
	 * Check if initialized
	 */
	isReady(): boolean;

	/**
	 * Close and cleanup
	 */
	close(): Promise<void>;
}
