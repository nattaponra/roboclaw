# 🤖 RoboClaw

**AI Robot Agent Platform for Raspberry Pi**

Build intelligent robots with voice interaction, computer vision, and AI capabilities - all configured through simple YAML files.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)

---

## ✨ Features

- 🎤 **Voice Interaction** - Local STT (Whisper) + TTS (Piper) - works offline
- 👁️ **Computer Vision** - Object detection (YOLO), face recognition, scene understanding
- 🤖 **LLM Integration** - OpenAI, Claude, and more via pi-mono
- 🏠 **Home Assistant** - MQTT integration for smart home control
- 🧠 **Persistent Memory** - Remember conversations and recognize people
- 🔌 **Hardware Abstraction** - No GPIO knowledge required - config-driven setup
- 🎯 **Skill System** - Extensible plugin architecture for custom behaviors
- ⚙️ **Config-Driven** - YAML-based configuration with interactive setup wizard

---

## 🚀 Quick Start

### Prerequisites

- Raspberry Pi 4/5 (4GB+ RAM recommended)
- Raspberry Pi OS (64-bit)
- Node.js 20+
- Camera module or USB camera
- USB microphone and speaker

### Installation

```bash
# Install CLI globally
npm install -g @nattaponra/roboclaw-cli

# Create your robot project
roboclaw init my-robot

# Enter directory
cd my-robot

# Install dependencies
npm install

# Configure hardware (interactive wizard)
roboclaw setup

# Add your API keys to .env file
nano .env

# Start your robot!
roboclaw start
```

That's it! Your robot is now running and ready to interact.

---

## 📦 Packages

This is a monorepo containing multiple packages:

| Package | Description |
|---------|-------------|
| **[@nattaponra/roboclaw-core](./packages/core)** | Core agent, memory, scheduler, skills |
| **[@nattaponra/roboclaw-hardware](./packages/hardware)** | GPIO, camera, motor, sensor drivers |
| **[@nattaponra/roboclaw-voice](./packages/voice)** | Speech-to-text (Whisper) and text-to-speech (Piper) |
| **[@nattaponra/roboclaw-vision](./packages/vision)** | Object detection, face recognition, Vision LLM |
| **[@nattaponra/roboclaw-communication](./packages/communication)** | MQTT client and REST API |
| **[@nattaponra/roboclaw-cli](./packages/cli)** | Command-line interface tool |

---

## 📚 Documentation

- [Getting Started](./docs/getting-started.md) - Complete setup guide
- [API Reference](./docs/api-reference.md) - Programming APIs
- [Hardware Guide](./docs/hardware-guide.md) - Wiring diagrams and GPIO pins
- [Skill Development](./docs/skill-development.md) - Create custom robot skills
- [Configuration](./docs/configuration.md) - config.yaml reference
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions

---

## 🎯 Examples

Check out the [examples](./packages/examples) directory for complete projects:

- **[Minimal](./packages/examples/minimal)** - Basic voice-enabled robot
- **[Home Assistant](./packages/examples/home-assistant)** - Smart home robot with MQTT
- **[Security Bot](./packages/examples/security-bot)** - Patrol and motion detection
- **[Pet Robot](./packages/examples/pet-robot)** - Playful companion robot

---

## 🛠️ Development

### Setup Development Environment

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

# Lint and format
npm run lint
npm run format
```

### Project Structure

```
roboclaw/
├── packages/
│   ├── core/              # Core agent framework
│   ├── hardware/          # Hardware drivers
│   ├── voice/             # Voice I/O
│   ├── vision/            # Computer vision
│   ├── communication/     # MQTT & API
│   ├── cli/               # CLI tool
│   └── examples/          # Example projects
├── docs/                  # Documentation
├── scripts/               # Build and setup scripts
└── .github/               # CI/CD workflows
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Principles

- ✅ **SOLID principles** - Clean, maintainable code
- ✅ **Test coverage** - 70%+ unit test coverage
- ✅ **TypeScript** - Type-safe throughout
- ✅ **Documentation** - Well-documented APIs

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built on top of [pi-mono](https://github.com/badlogic/pi-mono) for LLM integration
- Powered by [Whisper](https://github.com/openai/whisper) for speech recognition
- Text-to-speech by [Piper](https://github.com/rhasspy/piper)
- Object detection using [YOLOv8](https://github.com/ultralytics/ultralytics)

---

## 📞 Support

- 📖 [Documentation](./docs)
- 💬 [GitHub Discussions](https://github.com/nattaponra/agent/discussions)
- 🐛 [Issue Tracker](https://github.com/nattaponra/agent/issues)

---

**Made with ❤️ for the Raspberry Pi robotics community**
