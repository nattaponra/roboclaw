# RoboClaw Quick Start Guide

## 🚀 30-Second Setup

```bash
# 1. Clone and setup
git clone https://github.com/nattaponra/roboclaw.git
cd roboclaw
npm install
npm run build

# 2. Run automated setup
./scripts/dev-setup.sh

# 3. Add your API key
cd ~/roboclaw-dev
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-...

# 4. Test it!
export OPENAI_API_KEY=sk-your-key
npm test
```

## 📋 Common Commands

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd packages/core && npm run build

# Watch mode (auto-rebuild)
cd packages/core && npm run build -- --watch
```

### Testing

```bash
# Run all tests
npm test

# Test specific package
cd packages/core && npm test

# Watch mode
npm test -- --watch
```

### CLI

```bash
# Using built CLI
node packages/cli/dist/index.js --help

# Or create alias
alias roboclaw-dev="node /path/to/roboclaw/packages/cli/dist/index.js"
roboclaw-dev status
```

## 🔧 Development Workflow

### Method 1: Manual (Simple)

```bash
# 1. Make changes to code
vim packages/core/src/my-feature.ts

# 2. Rebuild
cd packages/core && npm run build

# 3. Test
cd ~/roboclaw-dev && npm test
```

### Method 2: Watch Mode (Recommended)

```bash
# Terminal 1: Auto-rebuild on changes
cd packages/core
npm run build -- --watch

# Terminal 2: Auto-restart on changes
cd ~/roboclaw-dev
npm run dev  # Uses nodemon
```

### Method 3: VS Code (Best for Debugging)

1. Open RoboClaw in VS Code
2. Press F5 to start debugging
3. Set breakpoints in code
4. Use Debug Console

## 📁 Project Structure

```
roboclaw/
├── packages/
│   ├── core/              # Main robot agent
│   ├── hardware/          # Motors, sensors
│   ├── voice/             # STT/TTS
│   ├── vision/            # YOLO, face recognition
│   ├── communication/     # MQTT, API
│   └── cli/               # Command line tool
├── examples/
│   ├── minimal/           # Simple example
│   └── homeassistant/     # Full-featured example
├── docs/                  # Documentation
└── scripts/               # Dev scripts
```

## 🧪 Quick Test

Create `test.js` in any directory:

```javascript
import { RobotAgent, loadConfig } from '@nattaponra/roboclaw-core';

// Create config
const config = {
  robot: { name: "TestBot", platform: "raspberry-pi-4" },
  llm: {
    provider: "openai",
    model: "gpt-4",
    api_key: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    max_tokens: 500
  },
  memory: { type: "sqlite", path: "./test.db" }
};

// Create and start robot
const robot = new RobotAgent(config);
await robot.start();

// Use it
robot.memory.conversation.addMessage({
  role: 'user',
  content: 'Hello!',
  timestamp: Date.now()
});

console.log('Messages:', robot.memory.conversation.getRecentMessages(5));

await robot.stop();
```

Link to local packages in `package.json`:

```json
{
  "type": "module",
  "dependencies": {
    "@nattaponra/roboclaw-core": "file:/path/to/roboclaw/packages/core"
  }
}
```

Then run:

```bash
npm install
export OPENAI_API_KEY=sk-...
node test.js
```

## 🐛 Debugging

### Console Logging

```javascript
console.log('Debug:', variable);
```

### Node Inspector

```bash
node --inspect test.js
# Open chrome://inspect in Chrome
```

### VS Code Debugger

Press F5 or use `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug",
  "program": "${workspaceFolder}/test.js",
  "env": {
    "OPENAI_API_KEY": "sk-..."
  }
}
```

## 🔥 Hot Tips

### 1. Link Packages Globally (Optional)

```bash
# In package directory
cd packages/core
npm link

# In your project
cd ~/my-project
npm link @nattaponra/roboclaw-core
```

### 2. Use Environment File

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

```javascript
import 'dotenv/config';
// Now process.env.OPENAI_API_KEY is available
```

### 3. Quick Rebuild All

```bash
alias rbc='cd /path/to/roboclaw && npm run build'
```

### 4. Watch Multiple Packages

```bash
npm install -g concurrently

concurrently \
  "cd packages/core && npm run build -- --watch" \
  "cd packages/hardware && npm run build -- --watch"
```

### 5. Clean Slate

```bash
# Remove all node_modules and built files
rm -rf node_modules packages/*/node_modules packages/*/dist
npm install
npm run build
```

## 📚 Examples

### Minimal Robot

```yaml
# config.yaml
robot:
  name: "MyRobot"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"

memory:
  type: "sqlite"
  path: "./robot.db"
```

```javascript
// run.js
import { RobotAgent, loadConfig } from '@nattaponra/roboclaw-core';

const config = await loadConfig('./config.yaml');
const robot = new RobotAgent(config);

await robot.start();
console.log('Robot running!');

// Do stuff...

await robot.stop();
```

### With Voice & Vision

```yaml
robot:
  name: "SmartRobot"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"

features:
  voice:
    enabled: true
    stt:
      engine: "whisper"
      model: "base"
    tts:
      engine: "piper"
      voice: "en_US-lessac-medium"

  vision:
    enabled: true
    camera:
      type: "picamera"
    capabilities:
      object_detection:
        enabled: true
        model: "yolov8n"

memory:
  type: "sqlite"
  path: "./robot.db"
```

## ❓ Common Issues

### "Cannot find module"

```bash
# Rebuild packages
npm run build

# Reinstall dependencies
rm -rf node_modules
npm install
```

### "Permission denied"

```bash
# Make script executable
chmod +x script.sh

# Or run with node
node script.js
```

### "API key not found"

```bash
# Set environment variable
export OPENAI_API_KEY=sk-...

# Or use .env file
cp .env.example .env
# Edit .env
```

### Tests failing

```bash
# Run specific test
cd packages/core
npm test -- src/my-feature.test.ts

# Run with verbose output
npm test -- --reporter=verbose
```

## 📖 More Resources

- **Full Development Guide:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Documentation:** [docs/](./docs/)
- **Examples:** [examples/](./examples/)
- **API Reference:** Coming in Phase 9

## 🆘 Getting Help

1. Check documentation: `docs/`
2. Look at examples: `examples/`
3. Search issues: https://github.com/nattaponra/roboclaw/issues
4. Create new issue with details

---

**Ready to build robots! 🤖**
