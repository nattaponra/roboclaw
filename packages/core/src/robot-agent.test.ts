import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotAgent } from './robot-agent.js';
import type { RobotConfig } from './config/schema.js';

describe('RobotAgent', () => {
	let agent: RobotAgent;
	let testConfig: RobotConfig;

	beforeEach(() => {
		testConfig = {
			robot: {
				name: 'Test Robot',
				description: 'A test robot',
				platform: 'raspberry-pi-4',
			},
			llm: {
				provider: 'openai',
				model: 'gpt-4o-mini',
				api_key: 'test-key',
				temperature: 0.7,
				max_tokens: 2000,
			},
			features: {},
			communication: {},
			memory: {
				type: 'sqlite',
				path: ':memory:',
				conversation_history_limit: 100,
				face_recognition_storage: './data/faces',
			},
			automation: {
				enabled: true,
			},
			skills: {
				builtin: [],
				custom: [],
			},
		};

		agent = new RobotAgent(testConfig);
	});

	afterEach(async () => {
		if (agent) {
			await agent.shutdown();
		}
	});

	it('should create robot agent with config', () => {
		expect(agent).toBeDefined();
		expect(agent.memory).toBeDefined();
		expect(agent.scheduler).toBeDefined();
		expect(agent.status).toBe('idle');
	});

	it('should have correct configuration', () => {
		const config = agent.getConfig();
		expect(config.robot.name).toBe('Test Robot');
		expect(config.llm.provider).toBe('openai');
	});

	it('should start and stop', async () => {
		const startPromise = new Promise((resolve) => {
			agent.once('robot:started', resolve);
		});

		await agent.start();
		await startPromise;

		expect(agent.status).toBe('active');

		const stopPromise = new Promise((resolve) => {
			agent.once('robot:stopped', resolve);
		});

		await agent.stop();
		await stopPromise;

		expect(agent.status).toBe('stopped');
	});

	it('should emit status changes', async () => {
		const statusChanges: string[] = [];

		agent.on('status:changed', (status) => {
			statusChanges.push(status);
		});

		await agent.start();
		await agent.stop();

		expect(statusChanges).toContain('active');
		expect(statusChanges).toContain('stopped');
	});

	it('should access memory system', () => {
		// Add a message
		agent.memory.conversation.addMessage({
			role: 'user',
			content: 'Test message',
			timestamp: Date.now(),
		});

		// Retrieve it
		const messages = agent.getConversationHistory(10);
		expect(messages.length).toBeGreaterThan(0);
		expect(messages[0].content).toBe('Test message');
	});

	it('should access scheduler', () => {
		let taskRan = false;

		agent.scheduler.schedule('test-task', 'Test Task', '*/5 * * * * *', () => {
			taskRan = true;
		});

		const task = agent.scheduler.getTask('test-task');
		expect(task).toBeDefined();
		expect(task?.name).toBe('Test Task');
	});

	it('should shutdown cleanly', async () => {
		await agent.start();
		await agent.shutdown();

		expect(agent.status).toBe('stopped');
	});
});
