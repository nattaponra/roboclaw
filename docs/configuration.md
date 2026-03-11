# Configuration Reference

Complete reference for RoboClaw's `config.yaml` file. All configuration options are validated using Zod schemas at runtime.

## Table of Contents

- [Basic Structure](#basic-structure)
- [Robot Section](#robot-section)
- [LLM Section](#llm-section)
- [Features Section](#features-section)
  - [Voice](#voice)
  - [Vision](#vision)
  - [Movement](#movement)
  - [Sensors](#sensors)
- [Communication Section](#communication-section)
  - [MQTT](#mqtt)
  - [API](#api)
- [Memory Section](#memory-section)
- [Automation Section](#automation-section)
- [Skills Section](#skills-section)
- [Environment Variables](#environment-variables)
- [Complete Example](#complete-example)

## Basic Structure

```yaml
robot:      # Robot metadata and platform
llm:        # AI model configuration
features:   # Optional capabilities (voice, vision, movement, sensors)
communication:  # MQTT, Home Assistant, REST API
memory:     # Database and storage
automation: # Scheduled tasks
skills:     # Built-in and custom skills
```

## Robot Section

**Required**. Defines basic robot metadata and target platform.

```yaml
robot:
  name: string          # Required. Robot identifier
  description: string   # Optional. Human-readable description
  platform: string      # Required. 'raspberry-pi-4' or 'raspberry-pi-5'
```

### Example

```yaml
robot:
  name: "HomeAssistant"
  description: "AI-powered home automation robot"
  platform: "raspberry-pi-4"
```

### Validation

- `name`: Must be non-empty string
- `platform`: Must be exactly `raspberry-pi-4` or `raspberry-pi-5`

## LLM Section

**Required**. Configures the AI language model.

```yaml
llm:
  provider: string      # Required. One of: openai, anthropic, google, mistral, groq
  model: string         # Required. Model identifier (e.g., 'gpt-4', 'claude-3-opus')
  api_key: string       # Required. API key (use ${VAR} for environment variables)
  temperature: number   # Optional. 0.0-2.0, default 0.7
  max_tokens: number    # Optional. Positive integer, default 2000
```

### Supported Providers

| Provider | Models | API Key Env Var |
|----------|--------|----------------|
| `openai` | gpt-4, gpt-4-turbo, gpt-3.5-turbo | `OPENAI_API_KEY` |
| `anthropic` | claude-3-opus, claude-3-sonnet, claude-3-haiku | `ANTHROPIC_API_KEY` |
| `google` | gemini-pro, gemini-ultra | `GOOGLE_API_KEY` |
| `mistral` | mistral-medium, mistral-small | `MISTRAL_API_KEY` |
| `groq` | mixtral-8x7b, llama2-70b | `GROQ_API_KEY` |

### Example

```yaml
llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"
  temperature: 0.7
  max_tokens: 500
```

### Validation

- `provider`: Must be one of the supported providers
- `model`: Must be non-empty string
- `api_key`: Must be non-empty string (supports env var substitution)
- `temperature`: Must be between 0.0 and 2.0
- `max_tokens`: Must be positive integer

## Features Section

**Optional**. Enable advanced capabilities. If omitted, only LLM + memory are active.

### Voice

Enable voice input/output with speech-to-text and text-to-speech.

```yaml
features:
  voice:
    enabled: boolean      # Required. Enable voice features

    stt:                  # Optional. Speech-to-text configuration
      engine: "whisper"   # Required. Currently only 'whisper' supported
      model: string       # Optional. 'tiny', 'base', 'small', 'medium', 'large'. Default: 'base'
      language: string    # Optional. 'en' or 'th'. Default: 'en'

    tts:                  # Optional. Text-to-speech configuration
      engine: "piper"     # Required. Currently only 'piper' supported
      voice: string       # Required. Piper voice identifier (e.g., 'en_US-lessac-medium')

    microphone:           # Optional. Microphone configuration
      type: string        # Required. 'usb' or 'i2s'
      device: string      # Required. Device identifier (e.g., 'hw:1,0' or 'plughw:1,0')
      sample_rate: number # Optional. Default: 16000

    speaker:              # Optional. Speaker configuration
      type: string        # Required. 'usb' or 'i2s'
      device: string      # Required. Device identifier (e.g., 'hw:0,0' or 'plughw:0,0')
```

#### Example

```yaml
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
      device: "plughw:0,0"
```

See [Voice Setup Guide](./voice-setup.md) for installation details.

### Vision

Enable camera, object detection, face recognition, and scene understanding.

```yaml
features:
  vision:
    enabled: boolean      # Required. Enable vision features

    camera:               # Optional. Camera configuration
      type: string        # Required. 'picamera', 'usb', or 'mock'
      resolution: [w, h]  # Optional. [width, height]. Default: [1280, 720]
      fps: number         # Optional. Frames per second. Default: 30

    capabilities:         # Optional. Vision capabilities

      object_detection:   # Optional. Detect objects with YOLO
        enabled: boolean
        model: string     # Optional. 'yolov8n', 'yolov8s', 'yolov8m'. Default: 'yolov8n'
        confidence: number # Optional. 0.0-1.0. Default: 0.5

      face_recognition:   # Optional. Recognize faces
        enabled: boolean
        tolerance: number # Optional. 0.0-1.0. Default: 0.6

      scene_understanding: # Optional. Describe images with Vision LLM
        enabled: boolean
        provider: string  # Optional. 'openai' or 'anthropic'. Default: 'openai'

      motion_detection:   # Optional. Detect movement
        enabled: boolean
        sensitivity: number # Optional. 0.0-1.0. Default: 0.8
```

#### Example

```yaml
features:
  vision:
    enabled: true
    camera:
      type: "picamera"
      resolution: [640, 480]
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
```

See [Vision Setup Guide](./vision-setup.md) for installation details.

### Movement

Enable motor control for wheeled robots.

```yaml
features:
  movement:
    enabled: boolean      # Required. Enable movement features
    motor_driver: string  # Required. 'l298n', 'tb6612', or 'mock'

    motors:               # Optional. Motor pin configuration
      left:
        pwm_pin: number   # Required. GPIO pin for PWM
        in1_pin: number   # Required. GPIO pin for IN1
        in2_pin: number   # Required. GPIO pin for IN2
        max_speed: number # Optional. 0-255. Default: 255
      right:
        pwm_pin: number
        in1_pin: number
        in2_pin: number
        max_speed: number

    safety:               # Optional. Safety limits
      min_distance: number # Optional. cm. Stop if obstacle closer. Default: 20
      max_speed: number   # Optional. 0-255. Speed limit. Default: 180
```

#### Example

```yaml
features:
  movement:
    enabled: true
    motor_driver: "l298n"
    motors:
      left:
        pwm_pin: 12
        in1_pin: 17
        in2_pin: 27
        max_speed: 200
      right:
        pwm_pin: 13
        in1_pin: 22
        in2_pin: 23
        max_speed: 200
    safety:
      min_distance: 20
      max_speed: 180
```

See [Hardware Setup Guide](./hardware-setup.md) for wiring details.

### Sensors

Enable distance and other sensors.

```yaml
features:
  sensors:
    distance:             # Optional. Distance sensor configuration
      enabled: boolean
      type: string        # Required. 'hcsr04', 'vl53l0x', or 'mock'
      trigger_pin: number # Optional. GPIO pin for trigger (HC-SR04)
      echo_pin: number    # Optional. GPIO pin for echo (HC-SR04)
      max_distance: number # Optional. cm. Default: 400
```

#### Example

```yaml
features:
  sensors:
    distance:
      enabled: true
      type: "hcsr04"
      trigger_pin: 23
      echo_pin: 24
      max_distance: 400
```

See [Hardware Setup Guide](./hardware-setup.md) for sensor details.

## Communication Section

**Optional**. Enable MQTT, Home Assistant integration, and REST API.

### MQTT

Connect to MQTT broker for IoT integration.

```yaml
communication:
  mqtt:
    enabled: boolean      # Required. Enable MQTT
    broker: string        # Optional. Broker URL. Default: 'localhost'
    port: number          # Optional. 1-65535. Default: 1883
    client_id: string     # Optional. Default: 'roboclaw_robot'
    username: string      # Optional. MQTT username
    password: string      # Optional. MQTT password (use ${VAR})

    topics:               # Optional. Custom topic names
      command: string     # Optional. Default: 'roboclaw/command'
      status: string      # Optional. Default: 'roboclaw/status'
      sensor: string      # Optional. Default: 'roboclaw/sensor'

    homeassistant:        # Optional. Home Assistant integration
      discovery: boolean  # Optional. Enable auto-discovery. Default: true
      prefix: string      # Optional. Discovery prefix. Default: 'homeassistant'
```

#### Example

```yaml
communication:
  mqtt:
    enabled: true
    broker: "mqtt://homeassistant.local"
    port: 1883
    client_id: "my_robot"
    username: "${MQTT_USERNAME}"
    password: "${MQTT_PASSWORD}"
    topics:
      command: "robot/command"
      status: "robot/status"
      sensor: "robot/sensor"
    homeassistant:
      discovery: true
      prefix: "homeassistant"
```

See [Home Assistant Integration Guide](./homeassistant.md) for setup.

### API

Enable REST API server.

```yaml
communication:
  api:
    enabled: boolean      # Optional. Enable REST API. Default: false
    port: number          # Optional. 1-65535. Default: 3000
    host: string          # Optional. Bind address. Default: '0.0.0.0'
```

#### Example

```yaml
communication:
  api:
    enabled: true
    port: 8080
    host: "0.0.0.0"
```

#### API Endpoints

When enabled, the following endpoints are available:

- `POST /chat` - Send message to robot
- `GET /status` - Get robot status
- `POST /skills/execute` - Execute a skill
- `GET /memory/conversations` - Get conversation history

## Memory Section

**Optional**. Configure persistent storage. Defaults to SQLite.

```yaml
memory:
  type: "sqlite"        # Required. Currently only 'sqlite' supported
  path: string          # Optional. Database path. Default: './data/memory.db'
  conversation_history_limit: number  # Optional. Max messages. Default: 100
  face_recognition_storage: string    # Optional. Face embeddings path. Default: './data/faces'
```

### Example

```yaml
memory:
  type: "sqlite"
  path: "./robot-memory.db"
  conversation_history_limit: 200
  face_recognition_storage: "./faces"
```

### Database Schema

The SQLite database includes tables for:
- `conversations` - Chat history with timestamps
- `faces` - Face recognition embeddings and names
- `user_preferences` - Key-value storage
- `events` - System events and logs

## Automation Section

**Optional**. Enable scheduled tasks via cron.

```yaml
automation:
  enabled: boolean      # Optional. Enable automation. Default: true
```

### Example

```yaml
automation:
  enabled: true
```

When enabled, skills can register cron schedules:

```typescript
class MySkill extends BaseSkill {
  async onRegister() {
    this.context.scheduler.schedule('check-weather', '0 8 * * *', async () => {
      // Runs daily at 8:00 AM
      await this.checkWeather();
    });
  }
}
```

## Skills Section

**Optional**. Enable built-in and custom skills.

```yaml
skills:
  builtin: string[]     # Optional. Built-in skill names. Default: []
  custom: string[]      # Optional. Custom skill paths. Default: []
```

### Built-in Skills

- `greeting` - Responds to greetings and introductions

### Example

```yaml
skills:
  builtin:
    - "greeting"
  custom:
    - "./skills/weather-skill.js"
    - "./skills/motion-detection-skill.js"
```

### Custom Skills

Custom skills are loaded from file paths relative to the config file. See [Skill Development Guide](./SKILL_DEVELOPMENT.md) for details.

## Environment Variables

Use `${VARIABLE_NAME}` syntax to reference environment variables in any string field:

```yaml
llm:
  api_key: "${OPENAI_API_KEY}"

communication:
  mqtt:
    username: "${MQTT_USERNAME}"
    password: "${MQTT_PASSWORD}"
```

Store secrets in `.env` file:

```bash
# .env
OPENAI_API_KEY=sk-...
MQTT_USERNAME=robot
MQTT_PASSWORD=secret123
```

The config loader automatically loads `.env` files using the `dotenv` pattern.

## Complete Example

Full-featured configuration with all capabilities:

```yaml
# Robot configuration
robot:
  name: "SmartRobot"
  description: "AI-powered robot with voice, vision, and mobility"
  platform: "raspberry-pi-4"

# LLM configuration
llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"
  temperature: 0.7
  max_tokens: 1000

# Features
features:
  # Voice capabilities
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
      device: "plughw:0,0"

  # Vision capabilities
  vision:
    enabled: true
    camera:
      type: "picamera"
      resolution: [640, 480]
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

  # Movement capabilities
  movement:
    enabled: true
    motor_driver: "l298n"
    motors:
      left:
        pwm_pin: 12
        in1_pin: 17
        in2_pin: 27
        max_speed: 200
      right:
        pwm_pin: 13
        in1_pin: 22
        in2_pin: 23
        max_speed: 200
    safety:
      min_distance: 20
      max_speed: 180

  # Sensor capabilities
  sensors:
    distance:
      enabled: true
      type: "hcsr04"
      trigger_pin: 23
      echo_pin: 24
      max_distance: 400

# Communication
communication:
  mqtt:
    enabled: true
    broker: "mqtt://homeassistant.local"
    port: 1883
    client_id: "smart_robot"
    username: "${MQTT_USERNAME}"
    password: "${MQTT_PASSWORD}"
    topics:
      command: "robot/command"
      status: "robot/status"
      sensor: "robot/sensor"
    homeassistant:
      discovery: true
      prefix: "homeassistant"
  api:
    enabled: true
    port: 3000
    host: "0.0.0.0"

# Memory
memory:
  type: "sqlite"
  path: "./robot-memory.db"
  conversation_history_limit: 200
  face_recognition_storage: "./faces"

# Automation
automation:
  enabled: true

# Skills
skills:
  builtin:
    - "greeting"
  custom:
    - "./skills/weather-skill.js"
    - "./skills/motion-detection-skill.js"
```

---

**Next Steps:**
- [Hardware Setup Guide](./hardware-setup.md) - GPIO wiring and hardware
- [Voice Setup Guide](./voice-setup.md) - Install Whisper and Piper
- [Vision Setup Guide](./vision-setup.md) - Install YOLO and dependencies
- [Home Assistant Integration](./homeassistant.md) - MQTT and auto-discovery
- [Skill Development Guide](./SKILL_DEVELOPMENT.md) - Create custom skills
