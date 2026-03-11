/**
 * MQTT Client interface
 */

export interface MQTTConfig {
	/** MQTT broker URL */
	broker: string;
	/** MQTT port */
	port?: number;
	/** Client ID */
	clientId?: string;
	/** Username */
	username?: string;
	/** Password */
	password?: string;
	/** Keep alive interval in seconds */
	keepalive?: number;
	/** Clean session */
	clean?: boolean;
	/** QoS level (0, 1, 2) */
	qos?: 0 | 1 | 2;
	/** Reconnect automatically */
	reconnect?: boolean;
	/** Additional options */
	options?: Record<string, unknown>;
}

export interface MQTTMessage {
	/** Topic */
	topic: string;
	/** Payload */
	payload: string | Buffer;
	/** QoS level */
	qos?: 0 | 1 | 2;
	/** Retain flag */
	retain?: boolean;
}

export interface MQTTSubscription {
	/** Topic pattern */
	topic: string;
	/** QoS level */
	qos?: 0 | 1 | 2;
	/** Message callback */
	callback: (topic: string, message: Buffer) => void;
}

export interface MQTTClient {
	/**
	 * Initialize and connect to MQTT broker
	 */
	connect(config: MQTTConfig): Promise<void>;

	/**
	 * Publish a message
	 * @param topic - MQTT topic
	 * @param payload - Message payload
	 * @param options - Publish options
	 */
	publish(
		topic: string,
		payload: string | Buffer,
		options?: { qos?: 0 | 1 | 2; retain?: boolean },
	): Promise<void>;

	/**
	 * Subscribe to a topic
	 * @param topic - Topic pattern (supports wildcards)
	 * @param callback - Called when message received
	 * @param qos - QoS level
	 */
	subscribe(
		topic: string,
		callback: (topic: string, message: Buffer) => void,
		qos?: 0 | 1 | 2,
	): Promise<void>;

	/**
	 * Unsubscribe from a topic
	 * @param topic - Topic pattern
	 */
	unsubscribe(topic: string): Promise<void>;

	/**
	 * Check if connected
	 */
	isConnected(): boolean;

	/**
	 * Disconnect from broker
	 */
	disconnect(): Promise<void>;

	/**
	 * Get connection status
	 */
	getStatus(): {
		connected: boolean;
		broker: string;
		clientId: string;
	};
}
