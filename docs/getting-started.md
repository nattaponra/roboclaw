# Getting Started with RoboClaw

This guide will help you set up RoboClaw and create your first AI-powered robot on a Raspberry Pi.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Creating Your First Robot](#creating-your-first-robot)
- [Understanding the Configuration](#understanding-the-configuration)
- [Running Your Robot](#running-your-robot)
- [Next Steps](#next-steps)

## Prerequisites

### Hardware Requirements

- **Raspberry Pi 4 or 5** (recommended: 4GB+ RAM)
- **MicroSD Card** (16GB+ recommended, Class 10)
- **Power Supply** (5V 3A for Pi 4, 5V 5A for Pi 5)
- **Internet Connection** (for initial setup and LLM API calls)

### Optional Hardware

- USB Microphone (for voice input)
- Speaker or audio output (for voice responses)
- Pi Camera Module (for vision capabilities)
- GPIO sensors/motors (for physical interaction)

### Software Requirements

- **Raspberry Pi OS** (Bullseye or later, 64-bit recommended)
- **Node.js 18+** and npm
- Basic terminal/SSH knowledge

## Installation

### Step 1: Set Up Your Raspberry Pi

1. **Install Raspberry Pi OS:**
   ```bash
   # Download Raspberry Pi Imager from raspberrypi.com
   # Flash Raspberry Pi OS (64-bit) to your SD card
   # Enable SSH during setup if needed
   ```

2. **Update your system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js 18+ (if not already installed):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   node --version  # Should be v18 or higher
   ```

### Step 2: Install RoboClaw

Install RoboClaw globally to access the CLI:

```bash
npm install -g @nattaponra/roboclaw
```

Verify installation:

```bash
roboclaw --version
```

## Creating Your First Robot

### Step 1: Initialize a New Project

Create a new directory and initialize a RoboClaw project:

```bash
mkdir my-robot
cd my-robot
roboclaw init
```

The interactive wizard will ask you:

1. **Project name** (default: current directory name)
2. **Template** (choose "minimal" for your first robot)
3. **LLM Provider** (OpenAI, Anthropic, Google, or OpenRouter)
4. **API Key** (your LLM provider API key)

This creates:
- `config.yaml` - Your robot's configuration file
- `package.json` - Node.js project file
- `.env` - Environment variables (API keys)
- `skills/` - Directory for custom skills

### Step 2: Install Dependencies

```bash
npm install
```

## Understanding the Configuration

The `config.yaml` file controls your robot's behavior. Here's the minimal configuration:

```yaml
# Basic robot configuration
robot:
  name: "MyRobot"
  description: "My first AI-powered robot"

# LLM configuration
llm:
  provider: "openai"  # or "anthropic", "google", "openrouter"
  model: "gpt-4"
  apiKey: "${OPENAI_API_KEY}"  # Loaded from .env
  temperature: 0.7
  maxTokens: 500

# Memory configuration (SQLite database)
memory:
  type: "sqlite"
  path: "./robot-memory.db"

# Skills configuration
skills:
  - name: "greeting"
    enabled: true
```

### Configuration Sections Explained

- **robot**: Basic metadata about your robot
- **llm**: AI model configuration (uses environment variables for API keys)
- **memory**: Conversation and data storage (SQLite by default)
- **skills**: Enabled skills/plugins for your robot

See [Configuration Reference](./configuration.md) for complete details.

## Running Your Robot

### Start Your Robot

```bash
roboclaw start
```

You should see:

```
[INFO] Loading configuration from config.yaml
[INFO] Initializing RobotAgent: MyRobot
[INFO] Connected to LLM provider: openai (gpt-4)
[INFO] Memory initialized: ./robot-memory.db
[INFO] Loaded skills: greeting
[INFO] Robot started successfully!
```

### Interact with Your Robot

With the minimal configuration, you can interact programmatically:

```javascript
// example.js
import { RobotAgent } from '@nattaponra/roboclaw';

const robot = await RobotAgent.fromConfig('./config.yaml');
await robot.start();

// Send a message
const response = await robot.chat('Hello, robot!');
console.log(response);

// The robot remembers context
const response2 = await robot.chat('What did I just say?');
console.log(response2);

await robot.stop();
```

Run it:

```bash
node example.js
```

### Check Status

In another terminal:

```bash
roboclaw status
```

This shows:
- Current configuration
- Enabled features (voice, vision, hardware, MQTT)
- Active skills
- Memory statistics

### Stop Your Robot

Press `Ctrl+C` in the terminal running `roboclaw start`, or:

```bash
# Send SIGTERM to gracefully shutdown
pkill -SIGTERM node
```

## Next Steps

### Add Voice Capabilities

Enable voice input/output by adding to your `config.yaml`:

```yaml
voice:
  enabled: true
  wakeWord: "hey robot"
  stt:
    provider: "whisper"
    model: "base"
  tts:
    provider: "piper"
    model: "en_US-lessac-medium"
```

See [Voice Setup Guide](./voice-setup.md) for installation details.

### Add Vision Capabilities

Enable camera and object detection:

```yaml
vision:
  enabled: true
  camera:
    device: 0
    resolution: [640, 480]
    fps: 30
  objectDetection:
    enabled: true
    provider: "yolo"
    model: "yolov8n"
```

See [Vision Setup Guide](./vision-setup.md) for installation details.

### Add Hardware Control

Control GPIO, motors, and sensors:

```yaml
hardware:
  enabled: true
  motors:
    - id: "left_motor"
      type: "l298n"
      pins:
        in1: 17
        in2: 27
        enable: 22
  sensors:
    - id: "distance_sensor"
      type: "hcsr04"
      pins:
        trigger: 23
        echo: 24
```

See [Hardware Setup Guide](./hardware-setup.md) for wiring details.

### Connect to Home Assistant

Integrate with your smart home:

```yaml
communication:
  mqtt:
    enabled: true
    broker: "mqtt://homeassistant.local:1883"
    username: "${MQTT_USERNAME}"
    password: "${MQTT_PASSWORD}"
  homeassistant:
    enabled: true
    discoveryPrefix: "homeassistant"
```

See [Home Assistant Integration Guide](./homeassistant.md) for setup.

### Create Custom Skills

Extend your robot with custom behaviors:

```bash
roboclaw skill add weather
```

This generates a skill template in `skills/weather-skill.ts`. See [Skill Development Guide](./SKILL_DEVELOPMENT.md) for details.

### Explore Examples

Check out complete example projects:

- **Minimal Example**: `examples/minimal/` - Simple LLM + memory setup
- **Home Assistant Example**: `examples/homeassistant/` - Full-featured with voice, vision, MQTT

### Join the Community

- **GitHub**: [github.com/nattaponra/roboclaw](https://github.com/nattaponra/roboclaw)
- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and share your robots

## Troubleshooting

### "Command not found: roboclaw"

The global install didn't add to PATH. Try:

```bash
npm bin -g  # Check where global packages are installed
export PATH="$PATH:$(npm bin -g)"  # Add to PATH
```

Or install locally and use npx:

```bash
npm install @nattaponra/roboclaw
npx roboclaw init
```

### "Permission denied" on GPIO

Add your user to the gpio group:

```bash
sudo usermod -a -G gpio $USER
# Log out and back in
```

### LLM API errors

Check your API key in `.env`:

```bash
cat .env
# Verify OPENAI_API_KEY or other keys are set correctly
```

Test API connectivity:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Memory/database errors

Check write permissions:

```bash
ls -la robot-memory.db
# Ensure your user can read/write
```

If corrupted, remove and restart:

```bash
rm robot-memory.db
roboclaw start  # Will recreate
```

### More Help

See complete troubleshooting guide or ask in GitHub Discussions.

---

**Ready to build?** Continue with:
- [Configuration Reference](./configuration.md) - All config options
- [Hardware Setup](./hardware-setup.md) - GPIO, motors, sensors
- [Voice Setup](./voice-setup.md) - Whisper and Piper installation
- [Vision Setup](./vision-setup.md) - YOLO and face recognition
- [Skill Development](./SKILL_DEVELOPMENT.md) - Create custom behaviors
