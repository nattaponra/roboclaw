import { describe, it, expect } from 'vitest';
import { ConfigSchema } from './schema.js';

describe('ConfigSchema', () => {
	it('should validate minimal config', () => {
		const minimalConfig = {
			robot: {
				name: 'Test Robot',
				platform: 'raspberry-pi-4',
			},
			llm: {
				provider: 'openai',
				model: 'gpt-4o-mini',
				api_key: 'test-key',
			},
		};

		const result = ConfigSchema.parse(minimalConfig);

		expect(result.robot.name).toBe('Test Robot');
		expect(result.llm.provider).toBe('openai');
	});

	it('should apply defaults', () => {
		const config = {
			robot: {
				name: 'Test Robot',
				platform: 'raspberry-pi-4',
			},
			llm: {
				provider: 'openai',
				model: 'gpt-4o-mini',
				api_key: 'test-key',
			},
		};

		const result = ConfigSchema.parse(config);

		expect(result.llm.temperature).toBe(0.7);
		expect(result.llm.max_tokens).toBe(2000);
		expect(result.memory.type).toBe('sqlite');
	});

	it('should reject invalid platform', () => {
		const invalidConfig = {
			robot: {
				name: 'Test Robot',
				platform: 'invalid-platform',
			},
			llm: {
				provider: 'openai',
				model: 'gpt-4o-mini',
				api_key: 'test-key',
			},
		};

		expect(() => ConfigSchema.parse(invalidConfig)).toThrow();
	});

	it('should reject invalid LLM provider', () => {
		const invalidConfig = {
			robot: {
				name: 'Test Robot',
				platform: 'raspberry-pi-4',
			},
			llm: {
				provider: 'invalid-provider',
				model: 'gpt-4o-mini',
				api_key: 'test-key',
			},
		};

		expect(() => ConfigSchema.parse(invalidConfig)).toThrow();
	});
});
