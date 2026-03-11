/**
 * Configuration schema using Zod for runtime validation
 */

import { z } from 'zod';

// Robot configuration
export const RobotConfigSchema = z.object({
	name: z.string().min(1, 'Robot name is required'),
	description: z.string().optional(),
	platform: z.enum(['raspberry-pi-4', 'raspberry-pi-5'], {
		errorMap: () => ({ message: 'Platform must be raspberry-pi-4 or raspberry-pi-5' }),
	}),
});

// LLM configuration
export const LLMConfigSchema = z.object({
	provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'groq'], {
		errorMap: () => ({ message: 'Provider must be one of: openai, anthropic, google, mistral, groq' }),
	}),
	model: z.string().min(1, 'Model name is required'),
	api_key: z.string().min(1, 'API key is required'),
	temperature: z.number().min(0).max(2).default(0.7),
	max_tokens: z.number().positive().default(2000),
});

// Voice configuration
export const VoiceConfigSchema = z.object({
	enabled: z.boolean(),
	stt: z
		.object({
			engine: z.literal('whisper'),
			model: z.enum(['tiny', 'base', 'small', 'medium', 'large']).default('base'),
			language: z.enum(['th', 'en']).default('en'),
		})
		.optional(),
	tts: z
		.object({
			engine: z.literal('piper'),
			voice: z.string(),
		})
		.optional(),
	microphone: z
		.object({
			type: z.enum(['usb', 'i2s']),
			device: z.string(),
			sample_rate: z.number().positive().default(16000),
		})
		.optional(),
	speaker: z
		.object({
			type: z.enum(['usb', 'i2s']),
			device: z.string(),
		})
		.optional(),
});

// Vision configuration
export const VisionConfigSchema = z.object({
	enabled: z.boolean(),
	camera: z
		.object({
			type: z.enum(['picamera', 'usb', 'mock']),
			resolution: z.tuple([z.number().positive(), z.number().positive()]).default([1280, 720]),
			fps: z.number().positive().default(30),
		})
		.optional(),
	capabilities: z
		.object({
			object_detection: z
				.object({
					enabled: z.boolean(),
					model: z.enum(['yolov8n', 'yolov8s', 'yolov8m']).default('yolov8n'),
					confidence: z.number().min(0).max(1).default(0.5),
				})
				.optional(),
			face_recognition: z
				.object({
					enabled: z.boolean(),
					tolerance: z.number().min(0).max(1).default(0.6),
				})
				.optional(),
			scene_understanding: z
				.object({
					enabled: z.boolean(),
					provider: z.enum(['openai', 'anthropic']).default('openai'),
				})
				.optional(),
			motion_detection: z
				.object({
					enabled: z.boolean(),
					sensitivity: z.number().min(0).max(1).default(0.8),
				})
				.optional(),
		})
		.optional(),
});

// Movement configuration
export const MovementConfigSchema = z.object({
	enabled: z.boolean(),
	motor_driver: z.enum(['l298n', 'tb6612', 'mock']),
	motors: z
		.object({
			left: z.object({
				pwm_pin: z.number().int().min(0),
				in1_pin: z.number().int().min(0),
				in2_pin: z.number().int().min(0),
				max_speed: z.number().int().min(0).max(255).default(255),
			}),
			right: z.object({
				pwm_pin: z.number().int().min(0),
				in1_pin: z.number().int().min(0),
				in2_pin: z.number().int().min(0),
				max_speed: z.number().int().min(0).max(255).default(255),
			}),
		})
		.optional(),
	safety: z
		.object({
			min_distance: z.number().positive().default(20),
			max_speed: z.number().int().min(0).max(255).default(180),
		})
		.optional(),
});

// Sensor configuration
export const SensorConfigSchema = z.object({
	distance: z
		.object({
			enabled: z.boolean(),
			type: z.enum(['hcsr04', 'vl53l0x', 'mock']),
			trigger_pin: z.number().int().min(0).optional(),
			echo_pin: z.number().int().min(0).optional(),
			max_distance: z.number().positive().default(400),
		})
		.optional(),
});

// MQTT configuration
export const MQTTConfigSchema = z.object({
	enabled: z.boolean(),
	broker: z.string().default('localhost'),
	port: z.number().int().min(1).max(65535).default(1883),
	client_id: z.string().default('roboclaw_robot'),
	username: z.string().optional(),
	password: z.string().optional(),
	topics: z
		.object({
			command: z.string().default('roboclaw/command'),
			status: z.string().default('roboclaw/status'),
			sensor: z.string().default('roboclaw/sensor'),
		})
		.optional(),
	homeassistant: z
		.object({
			discovery: z.boolean().default(true),
			prefix: z.string().default('homeassistant'),
		})
		.optional(),
});

// API configuration
export const APIConfigSchema = z.object({
	enabled: z.boolean().default(false),
	port: z.number().int().min(1).max(65535).default(3000),
	host: z.string().default('0.0.0.0'),
});

// Communication configuration
export const CommunicationConfigSchema = z.object({
	mqtt: MQTTConfigSchema.optional(),
	api: APIConfigSchema.optional(),
});

// Memory configuration
export const MemoryConfigSchema = z.object({
	type: z.literal('sqlite'),
	path: z.string().default('./data/memory.db'),
	conversation_history_limit: z.number().int().positive().default(100),
	face_recognition_storage: z.string().default('./data/faces'),
});

// Automation configuration
export const AutomationConfigSchema = z.object({
	enabled: z.boolean().default(true),
});

// Skills configuration
export const SkillsConfigSchema = z.object({
	builtin: z.array(z.string()).default([]),
	custom: z.array(z.string()).default([]),
});

// Features configuration
export const FeaturesConfigSchema = z.object({
	voice: VoiceConfigSchema.optional(),
	vision: VisionConfigSchema.optional(),
	movement: MovementConfigSchema.optional(),
	sensors: SensorConfigSchema.optional(),
});

// Main configuration schema
export const ConfigSchema = z.object({
	robot: RobotConfigSchema,
	llm: LLMConfigSchema,
	features: FeaturesConfigSchema.default({}),
	communication: CommunicationConfigSchema.default({}),
	memory: MemoryConfigSchema.default({ type: 'sqlite' }),
	automation: AutomationConfigSchema.default({ enabled: true }),
	skills: SkillsConfigSchema.default({ builtin: [], custom: [] }),
});

// Export types
export type RobotConfig = z.infer<typeof ConfigSchema>;
export type LLMConfig = z.infer<typeof LLMConfigSchema>;
export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;
export type VisionConfig = z.infer<typeof VisionConfigSchema>;
export type MovementConfig = z.infer<typeof MovementConfigSchema>;
export type SensorConfig = z.infer<typeof SensorConfigSchema>;
export type CommunicationConfig = z.infer<typeof CommunicationConfigSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
export type AutomationConfig = z.infer<typeof AutomationConfigSchema>;
export type SkillsConfig = z.infer<typeof SkillsConfigSchema>;
