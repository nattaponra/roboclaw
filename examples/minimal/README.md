# Minimal RoboClaw Example

This is the simplest possible RoboClaw robot configuration.

## Features

- Basic LLM integration (OpenAI GPT-4)
- Memory system
- Greeting skill
- No voice or vision (minimal dependencies)

## Setup

1. Install dependencies:
```bash
npm install @nattaponra/roboclaw-core
```

2. Set your OpenAI API key:
```bash
export OPENAI_API_KEY=your-api-key-here
```

3. Run the robot:
```bash
npx roboclaw start
```

## Usage

The robot will initialize with:
- Conversation memory stored in `./data/memory.db`
- Built-in greeting skill enabled
- LLM-powered responses via OpenAI

## Configuration

Edit `config.yaml` to customize:
- Robot name and description
- LLM provider (OpenAI, Anthropic, or local Ollama)
- Memory settings
- Enable/disable features

## Next Steps

To add more capabilities:
- Enable voice: Set `features.voice.enabled: true`
- Enable vision: Set `features.vision.enabled: true`
- Add custom skills in `./skills/` directory
- Set up MQTT for Home Assistant integration
