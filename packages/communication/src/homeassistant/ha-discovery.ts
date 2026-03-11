import type {
	HomeAssistantDiscovery,
	HADiscoveryConfig,
	HAEntity,
} from "../interfaces/homeassistant.js";
import type { MQTTClient } from "../interfaces/mqtt.js";

/**
 * Home Assistant MQTT Discovery implementation
 */
export class HADiscoveryManager implements HomeAssistantDiscovery {
	private config?: HADiscoveryConfig;
	private initialized = false;
	private mqttClient?: MQTTClient;
	private entities: Map<string, HAEntity> = new Map();

	constructor(mqttClient: MQTTClient) {
		this.mqttClient = mqttClient;
	}

	async initialize(config: HADiscoveryConfig): Promise<void> {
		if (this.initialized) {
			throw new Error("Already initialized");
		}

		this.config = config;
		this.initialized = true;

		// Publish availability
		await this.setAvailability(true);
	}

	async registerEntity(entity: HAEntity): Promise<void> {
		this.ensureInitialized();

		const discoveryTopic = this.getDiscoveryTopic(entity.type, entity.uniqueId);

		// Build discovery payload
		const payload = {
			name: entity.name,
			unique_id: entity.uniqueId,
			state_topic: entity.stateTopic,
			command_topic: entity.commandTopic,
			icon: entity.icon,
			unit_of_measurement: entity.unitOfMeasurement,
			device_class: entity.deviceClass,
			availability_topic: this.config?.availabilityTopic,
			device: this.config?.device,
			...entity.config,
		};

		// Publish discovery message
		await this.mqttClient!.publish(
			discoveryTopic,
			JSON.stringify(payload),
			{ retain: true },
		);

		this.entities.set(entity.uniqueId, entity);
	}

	async removeEntity(entityType: string, uniqueId: string): Promise<void> {
		this.ensureInitialized();

		const discoveryTopic = this.getDiscoveryTopic(entityType, uniqueId);

		// Publish empty payload to remove
		await this.mqttClient!.publish(discoveryTopic, "", { retain: true });

		this.entities.delete(uniqueId);
	}

	async updateState(
		uniqueId: string,
		state: string | number | boolean,
	): Promise<void> {
		this.ensureInitialized();

		const entity = this.entities.get(uniqueId);
		if (!entity) {
			throw new Error(`Entity not found: ${uniqueId}`);
		}

		// Publish state
		await this.mqttClient!.publish(
			entity.stateTopic,
			String(state),
		);
	}

	async setAvailability(available: boolean): Promise<void> {
		this.ensureInitialized();

		if (this.config?.availabilityTopic) {
			await this.mqttClient!.publish(
				this.config.availabilityTopic,
				available ? "online" : "offline",
				{ retain: true },
			);
		}
	}

	getDiscoveryTopic(entityType: string, uniqueId: string): string {
		const prefix = this.config?.discoveryPrefix || "homeassistant";
		const nodeId = this.config?.nodeId || "roboclaw";
		return `${prefix}/${entityType}/${nodeId}/${uniqueId}/config`;
	}

	isReady(): boolean {
		return this.initialized;
	}

	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		// Set unavailable
		await this.setAvailability(false);

		this.initialized = false;
		this.entities.clear();
	}

	// Helper methods
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error("Not initialized");
		}
	}
}
