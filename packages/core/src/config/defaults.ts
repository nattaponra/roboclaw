/**
 * Default configuration values
 */

import type { RobotConfig } from './schema.js';

/**
 * Minimal default configuration
 */
export const DEFAULT_CONFIG: Partial<RobotConfig> = {
	robot: {
		name: 'RoboClaw Robot',
		description: 'AI-powered robot',
		platform: 'raspberry-pi-4',
	},
	llm: {
		provider: 'openai',
		model: 'gpt-4o-mini',
		api_key: '',
		temperature: 0.7,
		max_tokens: 2000,
	},
	features: {
		voice: {
			enabled: false,
		},
		vision: {
			enabled: false,
		},
		movement: {
			enabled: false,
			motor_driver: 'mock',
		},
		sensors: {},
	},
	communication: {
		mqtt: {
			enabled: false,
			broker: 'localhost',
			port: 1883,
			client_id: 'roboclaw_robot',
		},
		api: {
			enabled: false,
			port: 3000,
			host: '0.0.0.0',
		},
	},
	memory: {
		type: 'sqlite',
		path: './data/memory.db',
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

/**
 * Example minimal configuration
 */
export const EXAMPLE_MINIMAL_CONFIG = `robot:
  name: "My Robot"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4o-mini"
  api_key: "\${OPENAI_API_KEY}"

features:
  voice:
    enabled: true
    stt:
      engine: "whisper"
      model: "base"
      language: "en"
    tts:
      engine: "piper"
      voice: "en_US-lessac-medium"

communication:
  mqtt:
    enabled: false

memory:
  type: "sqlite"
  path: "./data/memory.db"
`;

/**
 * Example full configuration with all features
 */
export const EXAMPLE_FULL_CONFIG = `robot:
  name: "Home Assistant Robot"
  description: "AI-powered home assistant"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4o"
  api_key: "\${OPENAI_API_KEY}"
  temperature: 0.7
  max_tokens: 2000

features:
  voice:
    enabled: true
    stt:
      engine: "whisper"
      model: "base"
      language: "en"
    tts:
      engine: "piper"
      voice: "en_US-lessac-medium"
    microphone:
      type: "usb"
      device: "plughw:1,0"
      sample_rate: 16000
    speaker:
      type: "usb"
      device: "plughw:2,0"

  vision:
    enabled: true
    camera:
      type: "picamera"
      resolution: [1280, 720]
      fps: 30
    capabilities:
      object_detection:
        enabled: true
        model: "yolov8n"
        confidence: 0.5
      face_recognition:
        enabled: true
        tolerance: 0.6
      scene_understanding:
        enabled: true
        provider: "openai"
      motion_detection:
        enabled: true
        sensitivity: 0.8

  movement:
    enabled: true
    motor_driver: "l298n"
    motors:
      left:
        pwm_pin: 12
        in1_pin: 23
        in2_pin: 24
        max_speed: 255
      right:
        pwm_pin: 13
        in1_pin: 25
        in2_pin: 8
        max_speed: 255
    safety:
      min_distance: 20
      max_speed: 180

  sensors:
    distance:
      enabled: true
      type: "hcsr04"
      trigger_pin: 17
      echo_pin: 27
      max_distance: 400

communication:
  mqtt:
    enabled: true
    broker: "localhost"
    port: 1883
    client_id: "roboclaw_robot"
    topics:
      command: "roboclaw/command"
      status: "roboclaw/status"
      sensor: "roboclaw/sensor"
    homeassistant:
      discovery: true
      prefix: "homeassistant"

  api:
    enabled: false
    port: 3000
    host: "0.0.0.0"

memory:
  type: "sqlite"
  path: "./data/memory.db"
  conversation_history_limit: 100
  face_recognition_storage: "./data/faces"

automation:
  enabled: true

skills:
  builtin:
    - "greet-user"
  custom:
    - "./skills/custom-skill.ts"
`;
