# RoboClaw Development Guide

Complete guide for developing RoboClaw locally on macOS or Linux.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [CLI Development](#cli-development)
- [Creating a Test Project](#creating-a-test-project)
- [Hot Reload / Watch Mode](#hot-reload--watch-mode)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js 18+** (check with `node --version`)
- **npm 9+** (check with `npm --version`)
- **Git**
- **Code editor** (VS Code recommended)

## Initial Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/nattaponra/roboclaw.git
cd roboclaw

# Install all dependencies (root + all workspaces)
npm install

# Build all packages
npm run build
```

### 2. Verify Installation

```bash
# Check all packages are linked
npm run build

# Run tests
npm test

# Try CLI
node packages/cli/dist/index.js --version
```

## Development Workflow

### File Structure

```
roboclaw/
├── packages/
│   ├── core/           # Core agent framework
│   │   ├── src/
│   │   ├── dist/       # Built output
│   │   └── package.json
│   ├── hardware/       # Hardware drivers
│   ├── voice/          # Voice (STT/TTS)
│   ├── vision/         # Vision (YOLO, face recognition)
│   ├── communication/  # MQTT, API
│   └── cli/            # CLI tool
├── examples/           # Example projects
├── docs/               # Documentation
└── package.json        # Root workspace config
```

### Development Commands

```bash
# Build all packages (from root)
npm run build

# Build specific package
cd packages/core
npm run build

# Watch mode (auto-rebuild on changes)
cd packages/core
npm run build -- --watch

# Run tests (all packages)
npm test

# Run tests for specific package
cd packages/core
npm test

# Run tests in watch mode
cd packages/core
npm test -- --watch

# Lint and format
npm run lint
npm run format

# Clean all built files
npm run clean
```

## Testing

### Run All Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Run Specific Package Tests

```bash
# Core package
cd packages/core
npm test

# Hardware package
cd packages/hardware
npm test

# Voice package
cd packages/voice
npm test
```

### Test Structure

```typescript
// Example test file: src/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { MyFeature } from './my-feature.js';

describe('MyFeature', () => {
  it('should work correctly', () => {
    const feature = new MyFeature();
    expect(feature.doSomething()).toBe(true);
  });
});
```

## CLI Development

### Run CLI Locally

```bash
# From root directory
node packages/cli/dist/index.js --help

# Or create alias
alias roboclaw-dev="node /Users/nattaponra/0xLabs/agent/packages/cli/dist/index.js"

# Then use
roboclaw-dev --help
roboclaw-dev status
```

### Test CLI Commands

```bash
# 1. Create test directory
mkdir ~/roboclaw-dev-test
cd ~/roboclaw-dev-test

# 2. Create config.yaml
cat > config.yaml << 'EOF'
robot:
  name: "DevRobot"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"
  temperature: 0.7
  max_tokens: 500

memory:
  type: "sqlite"
  path: "./robot-memory.db"

skills:
  builtin:
    - "greeting"
EOF

# 3. Set API key
export OPENAI_API_KEY=your-api-key-here

# 4. Test commands
node /path/to/roboclaw/packages/cli/dist/index.js status
node /path/to/roboclaw/packages/cli/dist/index.js skill list
```

## Creating a Test Project

### Quick Test Setup

```bash
# 1. Create test project
mkdir ~/my-robot-test
cd ~/my-robot-test

# 2. Create package.json with local links
cat > package.json << 'EOF'
{
  "name": "my-robot-test",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@nattaponra/roboclaw-core": "file:/Users/nattaponra/0xLabs/agent/packages/core",
    "@nattaponra/roboclaw-hardware": "file:/Users/nattaponra/0xLabs/agent/packages/hardware",
    "@nattaponra/roboclaw-voice": "file:/Users/nattaponra/0xLabs/agent/packages/voice",
    "@nattaponra/roboclaw-vision": "file:/Users/nattaponra/0xLabs/agent/packages/vision",
    "@nattaponra/roboclaw-communication": "file:/Users/nattaponra/0xLabs/agent/packages/communication"
  }
}
EOF

# 3. Install local packages
npm install

# 4. Create config
cat > config.yaml << 'EOF'
robot:
  name: "TestRobot"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"

memory:
  type: "sqlite"
  path: "./robot-memory.db"
EOF

# 5. Create test script
cat > test.js << 'EOF'
import { RobotAgent, loadConfig } from '@nattaponra/roboclaw-core';

const config = await loadConfig('./config.yaml');
const robot = new RobotAgent(config);

await robot.start();
console.log('Robot started:', robot.status);

// Test something
robot.memory.conversation.addMessage({
  role: 'user',
  content: 'Hello!',
  timestamp: Date.now()
});

const messages = robot.memory.conversation.getRecentMessages(5);
console.log('Messages:', messages);

await robot.stop();
EOF

# 6. Run test
export OPENAI_API_KEY=your-api-key
node test.js
```

### After Making Changes

```bash
# 1. Rebuild the package you changed
cd /Users/nattaponra/0xLabs/agent/packages/core
npm run build

# 2. Test project will use updated code automatically
cd ~/my-robot-test
node test.js
```

## Hot Reload / Watch Mode

### Watch Individual Package

```bash
# Terminal 1: Watch core package
cd packages/core
npm run build -- --watch

# Terminal 2: Watch hardware package
cd packages/hardware
npm run build -- --watch

# Terminal 3: Run your test
cd ~/my-robot-test
nodemon test.js  # Auto-restart on file changes
```

### Watch All Packages

```bash
# Install concurrently globally (one-time)
npm install -g concurrently

# From root directory
concurrently \
  "cd packages/core && npm run build -- --watch" \
  "cd packages/hardware && npm run build -- --watch" \
  "cd packages/voice && npm run build -- --watch" \
  "cd packages/vision && npm run build -- --watch" \
  "cd packages/communication && npm run build -- --watch" \
  "cd packages/cli && npm run build -- --watch"
```

Or add to root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --workspaces\""
  }
}
```

Then run:

```bash
npm run dev
```

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Test Script",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/test.js",
      "cwd": "${workspaceFolder}",
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/packages/cli/dist/index.js",
      "args": ["status"],
      "cwd": "${workspaceFolder}/examples/minimal",
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test", "--", "--run"],
      "cwd": "${workspaceFolder}/packages/core",
      "console": "integratedTerminal"
    }
  ]
}
```

### Using Chrome DevTools

```bash
# Run with inspector
node --inspect test.js

# Or with break on start
node --inspect-brk test.js

# Open chrome://inspect in Chrome
# Click "inspect" on your script
```

### Using console.log

```typescript
// In your code
console.log('Debug:', { variable, anotherVar });

// Or use debug library
import debug from 'debug';
const log = debug('roboclaw:myfeature');

log('Something happened:', data);
```

Run with debug output:

```bash
DEBUG=roboclaw:* node test.js
```

## Common Tasks

### Add New Feature to Core

```bash
# 1. Create feature file
cd packages/core/src
touch my-feature.ts

# 2. Write code
cat > my-feature.ts << 'EOF'
export class MyFeature {
  doSomething(): boolean {
    return true;
  }
}
EOF

# 3. Export from index
echo "export * from './my-feature.js';" >> index.ts

# 4. Write tests
touch my-feature.test.ts
cat > my-feature.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { MyFeature } from './my-feature.js';

describe('MyFeature', () => {
  it('should work', () => {
    const feature = new MyFeature();
    expect(feature.doSomething()).toBe(true);
  });
});
EOF

# 5. Build and test
npm run build
npm test
```

### Add New CLI Command

```bash
# 1. Create command file
cd packages/cli/src/commands
touch my-command.ts

# 2. Implement command
cat > my-command.ts << 'EOF'
import { Command } from 'commander';

export function registerMyCommand(program: Command): void {
  program
    .command('my-command')
    .description('Description of my command')
    .action(async () => {
      console.log('My command executed!');
    });
}
EOF

# 3. Register in main CLI
# Edit src/index.ts and add:
# import { registerMyCommand } from './commands/my-command.js';
# registerMyCommand(program);

# 4. Build and test
npm run build
node dist/index.js my-command
```

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update

# Update in specific workspace
cd packages/core
npm update
```

### Add New Package to Monorepo

```bash
# 1. Create package directory
mkdir packages/my-package
cd packages/my-package

# 2. Initialize package
npm init -y

# 3. Update package.json
cat > package.json << 'EOF'
{
  "name": "@nattaponra/roboclaw-my-package",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "vitest --run"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
EOF

# 4. Copy tsconfig files from another package
cp ../core/tsconfig.json .
cp ../core/tsconfig.build.json .

# 5. Create src directory
mkdir src
touch src/index.ts

# 6. Install and build
npm install
npm run build

# 7. Add to root workspace (already auto-detected)
```

## Troubleshooting

### Build Errors

**Error: "Cannot find module"**

```bash
# Rebuild all packages
npm run build

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
npm install
npm run build
```

**Error: "Duplicate identifier"**

Check for type conflicts. Make sure each package's `tsconfig.json` is correct.

### Test Errors

**Error: "Cannot find test files"**

Tests must end with `.test.ts` or `.spec.ts`

**Error: "Timeout"**

Increase timeout in test:

```typescript
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Module Resolution Issues

**Error: "Module not found" in test project**

```bash
# Rebuild the package
cd /Users/nattaponra/0xLabs/agent/packages/core
npm run build

# Reinstall in test project
cd ~/my-robot-test
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

**Error: "Cannot find name X"**

Install types:

```bash
npm install --save-dev @types/node
```

**Error: "Module X is not listed in package.json dependencies"**

Add to package.json dependencies or devDependencies, then:

```bash
npm install
```

### Git Issues

**Ignoring build files:**

`.gitignore` should have:

```
node_modules/
dist/
*.log
.env
*.db
*.db-shm
*.db-wal
```

## Best Practices

1. **Always build before testing changes in test projects**
   ```bash
   npm run build && cd ~/my-robot-test && node test.js
   ```

2. **Use watch mode during active development**
   ```bash
   npm run build -- --watch
   ```

3. **Write tests for new features**
   ```bash
   # Create .test.ts file alongside your code
   # Run tests before committing
   npm test
   ```

4. **Use TypeScript strict mode**
   ```json
   {
     "compilerOptions": {
       "strict": true
     }
   }
   ```

5. **Keep packages independent**
   - Avoid circular dependencies
   - Each package should have clear responsibility

6. **Document as you go**
   - Add JSDoc comments
   - Update README files
   - Keep examples up to date

## Quick Reference

```bash
# Development cycle
cd packages/core
npm run build -- --watch    # Terminal 1
cd ~/my-robot-test
nodemon test.js             # Terminal 2

# Test cycle
npm test -- --watch         # Auto-run tests

# Debug
node --inspect test.js      # Chrome DevTools
# Or use VS Code debugger

# Clean slate
rm -rf node_modules dist
npm install
npm run build

# Check everything works
npm run build && npm test && node packages/cli/dist/index.js --version
```

---

**Happy Coding! 🚀**

For questions or issues:
- GitHub Issues: https://github.com/nattaponra/roboclaw/issues
- Documentation: docs/
- Examples: examples/
