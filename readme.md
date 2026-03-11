# 🤖 RoboClaw

**AI Robot Agent Platform for Raspberry Pi**

Build intelligent robots with voice interaction, computer vision, and AI capabilities - all configured through simple YAML files. No coding required for basic setups!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

---

## ✨ Features

### 🎤 Voice Interaction
- **Local STT** - Whisper.cpp for speech-to-text (works offline!)
- **Local TTS** - Piper for natural text-to-speech
- **Wake Word Detection** - Customizable activation phrases
- **Real-time Processing** - Low-latency voice interaction

### 👁️ Computer Vision
- **Object Detection** - YOLO integration for real-time detection
- **Face Recognition** - Remember and identify people
- **Vision LLM** - GPT-4V, Claude 3 integration for scene understanding
- **Camera Support** - Pi Camera and USB cameras

### 🤖 AI & LLM
- **Multi-Provider** - OpenAI, Anthropic, Google, Mistral, Groq
- **Local LLM** - Ollama support for privacy
- **Conversation Memory** - Persistent chat history with search
- **Context-Aware** - Remembers users, preferences, and past interactions

### 🏠 Home Automation
- **MQTT Integration** - Full Home Assistant support
- **Auto-Discovery** - Devices appear automatically in HA
- **Smart Home Control** - Control lights, switches, sensors
- **Scheduled Tasks** - Cron-based automation

### 🔧 Hardware
- **GPIO Control** - Motors, sensors, LEDs (config-driven)
- **Multiple Drivers** - L298N, TB6612 motors; HC-SR04, VL53L0X sensors
- **Plug-and-Play** - No GPIO knowledge required
- **Mock Drivers** - Test without hardware

### 🎯 Extensible
- **Skill System** - Plugin architecture for custom behaviors
- **Event-Driven** - React to robot events
- **TypeScript API** - Full type safety
- **Hot Reload** - Update skills without restart

---

## 🚀 Quick Start

### Installation

```bash
# Install RoboClaw CLI
npm install -g @nattaponra/roboclaw-cli

# Create a new robot project
roboclaw init my-robot
cd my-robot

# Configure your robot
nano config.yaml

# Start your robot
roboclaw start
```

### Example Configuration

```yaml
robot:
  name: "My Robot"
  platform: raspberry-pi-4

llm:
  provider: openai
  model: gpt-4
  api_key: ${OPENAI_API_KEY}

features:
  voice:
    enabled: true
    stt:
      engine: whisper
      model: base
    tts:
      engine: piper
      voice: en_US-lessac-medium

  vision:
    enabled: true
    object_detection:
      enabled: true

memory:
  path: "./data/memory.db"
```

---

## 📦 Architecture

RoboClaw is built as a monorepo with specialized packages:

### Core Packages

- **`@nattaponra/roboclaw-core`** - Agent core, memory, scheduler, skills
- **`@nattaponra/roboclaw-hardware`** - GPIO, motors, sensors, cameras
- **`@nattaponra/roboclaw-voice`** - STT/TTS with Whisper and Piper
- **`@nattaponra/roboclaw-vision`** - YOLO, face recognition, Vision LLM
- **`@nattaponra/roboclaw-communication`** - MQTT, Home Assistant, REST API
- **`@nattaponra/roboclaw-cli`** - Command-line interface

### Design Principles

- **Config-Driven** - YAML configuration for everything
- **Interface-Based** - Easy to swap implementations
- **Event-Driven** - Reactive architecture
- **Type-Safe** - Full TypeScript with strict mode
- **Testable** - Mock implementations for all drivers
- **Modular** - Use only what you need

---

## 📚 Documentation

### Getting Started
- [Quick Start Guide](./docs/getting-started.md)
- [Installation](./docs/installation.md)
- [Configuration Guide](./docs/configuration.md)

### Guides
- [Skill Development](./docs/skill-development.md)
- [Hardware Setup](./docs/hardware-setup.md)
- [Home Assistant Integration](./docs/homeassistant.md)
- [Voice Setup](./docs/voice-setup.md)
- [Vision Setup](./docs/vision-setup.md)

### API Reference
- [Core API](./packages/core/README.md)
- [Hardware API](./packages/hardware/README.md)
- [Voice API](./packages/voice/README.md)
- [Vision API](./packages/vision/README.md)
- [Communication API](./packages/communication/README.md)

### Examples
- [Minimal Robot](./examples/minimal/) - Simplest setup
- [Home Assistant Robot](./examples/homeassistant/) - Full HA integration
- [Voice Assistant](./examples/voice-assistant/) - Voice-controlled robot

---

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- TypeScript 5.7+

### Setup

```bash
# Clone the repository
git clone https://github.com/nattaponra/agent.git
cd agent

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Project Structure

```
agent/
├── packages/
│   ├── core/              # Core agent framework
│   ├── hardware/          # Hardware drivers
│   ├── voice/             # Voice I/O
│   ├── vision/            # Computer vision
│   ├── communication/     # MQTT & API
│   └── cli/               # CLI tool
├── examples/              # Example projects
├── docs/                  # Documentation
└── README.md
```

---

## 🎯 Use Cases

### Home Automation
- Voice-controlled smart home
- Security monitoring with face recognition
- Automated routines and notifications

### Personal Assistant
- Schedule management
- Reminders and alarms
- Information lookup

### Educational
- Learn robotics and AI
- Computer vision projects
- IoT integration

### Custom Robots
- Delivery robots
- Pet robots
- Telepresence robots

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Areas for Contribution

- New hardware drivers (motors, sensors)
- Additional voice/vision models
- Built-in skills
- Documentation improvements
- Bug fixes and testing

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- **pi-mono** by [@mariozechner](https://github.com/mariozechner) - LLM abstraction
- **Whisper.cpp** - Fast local speech recognition
- **Piper** - High-quality local TTS
- **YOLOv8** - State-of-the-art object detection
- **Home Assistant** - Open-source home automation

---

## 📧 Contact

- **Author**: Nattapon Ra
- **GitHub**: [@nattaponra](https://github.com/nattaponra)
- **Issues**: [GitHub Issues](https://github.com/nattaponra/agent/issues)

---

## 🌟 Star History

If you find RoboClaw useful, please consider giving it a star! ⭐

---

**Built with ❤️ for the Raspberry Pi and robotics community**