/**
 * Main RobotAgent class
 */

import { Agent, type AgentOptions } from '@mariozechner/pi-agent-core';
import { getModel } from '@mariozechner/pi-ai';
import { EventEmitter } from 'node:events';
import { loadConfig, type RobotConfig } from './config/index.js';
import { RobotMemory } from './memory/index.js';
import { Scheduler } from './scheduler/index.js';
import type { RobotStatus } from './types/index.js';

/**
 * Robot Agent - extends pi-agent with robot-specific functionality
 */
export class RobotAgent extends EventEmitter {
	private agent: Agent;
	private config: RobotConfig;
	private _status: RobotStatus = 'idle';

	public readonly memory: RobotMemory;
	public readonly scheduler: Scheduler;

	constructor(config: RobotConfig) {
		super();

		this.config = config;

		// Initialize memory
		this.memory = new RobotMemory(config.memory.path);

		// Initialize scheduler
		this.scheduler = new Scheduler();

		// Setup scheduler event forwarding
		this.scheduler.on('task:start', (taskId) => {
			this.memory.logEvent('task:start', { taskId });
		});

		this.scheduler.on('task:complete', (taskId) => {
			this.memory.logEvent('task:complete', { taskId });
		});

		this.scheduler.on('task:error', (taskId, error) => {
			this.memory.logEvent('task:error', { taskId, error: error.message });
			this.emit('robot:error', error);
		});

		// Initialize pi-agent
		const model = getModel(config.llm.provider as any, config.llm.model as any);

		const agentOptions: Partial<AgentOptions> = {
			initialState: {
				systemPrompt: this.buildSystemPrompt(),
				model,
				thinkingLevel: 'medium',
				tools: [],
				messages: [],
			},
			getApiKey: async (provider) => {
				if (provider === config.llm.provider) {
					return config.llm.api_key;
				}
				return undefined;
			},
		};

		this.agent = new Agent(agentOptions);

		// Forward agent events
		this.agent.subscribe((event) => {
			if (event.type === 'agent_end') {
				// Save conversation to memory
				for (const msg of event.messages) {
					// Only save user and assistant messages (skip system and tool messages)
					if (msg.role === 'user' || msg.role === 'assistant') {
						this.memory.conversation.addMessage({
							role: msg.role,
							content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
							timestamp: msg.timestamp,
						});
					}
				}
			}
		});
	}

	/**
	 * Create robot from config file
	 */
	static fromConfigFile(configPath: string): RobotAgent {
		const config = loadConfig(configPath);
		return new RobotAgent(config);
	}

	/**
	 * Build system prompt based on config
	 */
	private buildSystemPrompt(): string {
		const parts = [
			`You are ${this.config.robot.name}, an AI-powered robot assistant.`,
		];

		if (this.config.robot.description) {
			parts.push(this.config.robot.description);
		}

		// Add capabilities based on enabled features
		const capabilities: string[] = [];

		if (this.config.features.voice?.enabled) {
			capabilities.push('voice interaction');
		}

		if (this.config.features.vision?.enabled) {
			capabilities.push('computer vision');
		}

		if (this.config.features.movement?.enabled) {
			capabilities.push('physical movement');
		}

		if (capabilities.length > 0) {
			parts.push(`\nYour capabilities include: ${capabilities.join(', ')}.`);
		}

		parts.push('\nYou are helpful, concise, and friendly.');

		return parts.join(' ');
	}

	/**
	 * Get current status
	 */
	get status(): RobotStatus {
		return this._status;
	}

	/**
	 * Set status and emit event
	 */
	private setStatus(status: RobotStatus): void {
		if (this._status !== status) {
			this._status = status;
			this.emit('status:changed', status);
		}
	}

	/**
	 * Start the robot
	 */
	async start(): Promise<void> {
		try {
			this.setStatus('active');
			this.emit('robot:started');
			this.memory.logEvent('robot:started', { name: this.config.robot.name });
		} catch (error) {
			this.setStatus('error');
			this.emit('robot:error', error as Error);
			throw error;
		}
	}

	/**
	 * Stop the robot
	 */
	async stop(): Promise<void> {
		this.setStatus('stopped');
		this.scheduler.stopAll();
		this.memory.logEvent('robot:stopped', { name: this.config.robot.name });
		this.emit('robot:stopped');
	}

	/**
	 * Send a message to the agent
	 */
	async prompt(message: string): Promise<void> {
		try {
			this.setStatus('active');
			await this.agent.prompt(message);
		} catch (error) {
			this.setStatus('error');
			this.emit('robot:error', error as Error);
			throw error;
		} finally {
			this.setStatus('idle');
		}
	}

	/**
	 * Get recent conversation history
	 */
	getConversationHistory(limit: number = 10): any[] {
		return this.memory.conversation.getRecentMessages(limit);
	}

	/**
	 * Get robot configuration
	 */
	getConfig(): Readonly<RobotConfig> {
		return this.config;
	}

	/**
	 * Cleanup and shutdown
	 */
	async shutdown(): Promise<void> {
		// Stop scheduler first
		this.scheduler.stopAll();
		this.setStatus('stopped');

		// Close memory (must be done before removing listeners)
		this.memory.close();

		// Clean up scheduler
		this.scheduler.destroy();

		// Remove all event listeners
		this.removeAllListeners();
	}
}
