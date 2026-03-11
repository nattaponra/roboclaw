import { EventEmitter } from "node:events";
import type { MQTTClient, MQTTConfig } from "../interfaces/mqtt.js";

/**
 * Mock MQTT Client for testing
 */
export class MockMQTTClient extends EventEmitter implements MQTTClient {
	private config?: MQTTConfig;
	private connected = false;
	private subscriptions: Map<
		string,
		Array<(topic: string, message: Buffer) => void>
	> = new Map();
	private publishedMessages: Array<{
		topic: string;
		payload: string | Buffer;
		timestamp: number;
	}> = [];

	async connect(config: MQTTConfig): Promise<void> {
		if (this.connected) {
			throw new Error("Already connected");
		}

		this.config = config;

		// Simulate connection delay
		await this.delay(100);

		this.connected = true;
		this.emit("connect");
	}

	async publish(
		topic: string,
		payload: string | Buffer,
		options?: { qos?: 0 | 1 | 2; retain?: boolean },
	): Promise<void> {
		this.ensureConnected();

		// Store published message
		this.publishedMessages.push({
			topic,
			payload,
			timestamp: Date.now(),
		});

		this.emit("publish", { topic, payload, options });

		// Simulate publish delay
		await this.delay(10);
	}

	async subscribe(
		topic: string,
		callback: (topic: string, message: Buffer) => void,
		_qos?: 0 | 1 | 2,
	): Promise<void> {
		this.ensureConnected();

		if (!this.subscriptions.has(topic)) {
			this.subscriptions.set(topic, []);
		}

		this.subscriptions.get(topic)!.push(callback);
		this.emit("subscribe", topic);

		// Simulate subscribe delay
		await this.delay(10);
	}

	async unsubscribe(topic: string): Promise<void> {
		this.ensureConnected();

		this.subscriptions.delete(topic);
		this.emit("unsubscribe", topic);

		// Simulate unsubscribe delay
		await this.delay(10);
	}

	isConnected(): boolean {
		return this.connected;
	}

	async disconnect(): Promise<void> {
		if (!this.connected) {
			return;
		}

		this.connected = false;
		this.subscriptions.clear();
		this.emit("disconnect");

		// Simulate disconnect delay
		await this.delay(50);
	}

	getStatus(): { connected: boolean; broker: string; clientId: string } {
		return {
			connected: this.connected,
			broker: this.config?.broker || "",
			clientId: this.config?.clientId || "",
		};
	}

	// Helper methods
	private ensureConnected(): void {
		if (!this.connected) {
			throw new Error("Not connected to MQTT broker");
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public simulateMessage(topic: string, message: string | Buffer): void {
		const messageBuffer =
			typeof message === "string" ? Buffer.from(message) : message;

		// Find matching subscriptions
		for (const [subTopic, callbacks] of this.subscriptions.entries()) {
			if (this.topicMatches(topic, subTopic)) {
				for (const callback of callbacks) {
					callback(topic, messageBuffer);
				}
			}
		}
	}

	public getPublishedMessages(): Array<{
		topic: string;
		payload: string | Buffer;
		timestamp: number;
	}> {
		return [...this.publishedMessages];
	}

	public clearPublishedMessages(): void {
		this.publishedMessages = [];
	}

	public getSubscriptions(): string[] {
		return Array.from(this.subscriptions.keys());
	}

	private topicMatches(topic: string, pattern: string): boolean {
		// Simple wildcard matching
		// + matches single level
		// # matches multiple levels
		const topicParts = topic.split("/");
		const patternParts = pattern.split("/");

		for (let i = 0; i < patternParts.length; i++) {
			if (patternParts[i] === "#") {
				return true;
			}

			if (patternParts[i] === "+") {
				continue;
			}

			if (patternParts[i] !== topicParts[i]) {
				return false;
			}
		}

		return topicParts.length === patternParts.length;
	}
}
