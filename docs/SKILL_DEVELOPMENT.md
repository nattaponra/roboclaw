# Skill Development Guide

Learn how to create custom skills for your RoboClaw robot.

## What is a Skill?

A skill is a plugin that adds specific functionality to your robot. Skills can:
- Respond to voice commands
- Process sensor data
- Control hardware
- Integrate with external services
- Store persistent data

## Basic Skill Structure

Every skill extends the `BaseSkill` class:

```typescript
import { BaseSkill, type SkillMetadata } from '@nattaponra/roboclaw-core';

export class MySkill extends BaseSkill {
  getMetadata(): SkillMetadata {
    return {
      name: 'my-skill',
      version: '1.0.0',
      description: 'Description of what this skill does',
      author: 'Your Name',
    };
  }

  async execute(input: any): Promise<any> {
    // Skill logic here
    return { success: true };
  }
}
```

## Skill Lifecycle

### 1. Initialization

```typescript
protected async onInitialize(): Promise<void> {
  // Called once when skill is registered
  this.context.log('Skill initializing...');
  
  // Load configuration
  const apiKey = this.config.apiKey;
  
  // Load persistent data
  const lastRun = await this.context.data.get('last_run');
  
  // Subscribe to events
  this.context.on('some_event', this.handleEvent.bind(this));
}
```

### 2. Execution

```typescript
async execute(input: any): Promise<any> {
  this.ensureInitialized();
  
  this.context.log(`Processing input: ${JSON.stringify(input)}`);
  
  // Do the work
  const result = await this.doSomething(input);
  
  // Emit events
  this.context.emit('task_completed', result);
  
  // Store data
  await this.context.data.set('last_result', result);
  
  return result;
}
```

### 3. Input Validation

```typescript
canHandle(input: any): boolean {
  if (!super.canHandle(input)) {
    return false;
  }
  
  // Check if input is valid for this skill
  if (typeof input !== 'string') {
    return false;
  }
  
  // Check for specific keywords
  return input.toLowerCase().includes('weather');
}
```

### 4. Cleanup

```typescript
protected async onClose(): Promise<void> {
  // Called when skill is unregistered or robot shuts down
  this.context.log('Cleaning up...');
  
  // Unsubscribe from events
  this.context.off('some_event', this.handleEvent);
  
  // Close connections, save state, etc.
}
```

## Using Skill Context

The `context` object provides access to robot capabilities:

### Logging

```typescript
this.context.log('Info message', 'info');
this.context.log('Warning message', 'warn');
this.context.log('Error message', 'error');
```

### Persistent Data

```typescript
// Save data
await this.context.data.set('counter', 42);

// Load data
const counter = await this.context.data.get('counter');

// Delete data
await this.context.data.delete('counter');
```

### Events

```typescript
// Emit events
this.context.emit('custom_event', { some: 'data' });

// Subscribe to events
this.context.on('robot_event', (data) => {
  console.log('Event received:', data);
});

// Unsubscribe
this.context.off('robot_event', handler);
```

### Access Robot

```typescript
// Access robot agent
const robot = this.context.robot;

// Access memory
const memory = robot.memory;
await memory.addConversation('user', 'Hello');

// Access scheduler
const scheduler = robot.scheduler;
scheduler.schedule('daily-task', '0 9 * * *', async () => {
  // Do something daily at 9am
});
```

## Example Skills

### Weather Skill

```typescript
import { BaseSkill, type SkillMetadata } from '@nattaponra/roboclaw-core';
import fetch from 'node-fetch';

export class WeatherSkill extends BaseSkill {
  private apiKey?: string;

  getMetadata(): SkillMetadata {
    return {
      name: 'weather',
      version: '1.0.0',
      description: 'Get weather information',
      author: 'RoboClaw',
    };
  }

  protected async onInitialize(): Promise<void> {
    this.apiKey = this.config.apiKey || process.env.WEATHER_API_KEY;
    
    if (!this.apiKey) {
      this.context.log('No API key configured', 'warn');
    }
  }

  canHandle(input: any): boolean {
    if (!super.canHandle(input)) return false;
    if (typeof input !== 'string') return false;
    
    const text = input.toLowerCase();
    return text.includes('weather') || 
           text.includes('temperature') ||
           text.includes('forecast');
  }

  async execute(input: string): Promise<any> {
    this.ensureInitialized();
    
    if (!this.apiKey) {
      return { error: 'Weather API key not configured' };
    }
    
    try {
      // Extract location from input (simplified)
      const location = this.extractLocation(input);
      
      // Fetch weather data
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${location}`
      );
      const data = await response.json();
      
      // Format response
      const result = {
        location: data.location.name,
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
      };
      
      this.context.emit('weather_fetched', result);
      
      return result;
    } catch (error) {
      this.context.log(`Weather API error: ${error}`, 'error');
      return { error: 'Failed to fetch weather' };
    }
  }

  private extractLocation(input: string): string {
    // Simple extraction - you'd want better NLP here
    const match = input.match(/in (.+?)(\?|$)/i);
    return match ? match[1].trim() : 'London';
  }
}
```

### Motion Detection Skill

```typescript
import { BaseSkill, type SkillMetadata } from '@nattaponra/roboclaw-core';

export class MotionDetectionSkill extends BaseSkill {
  private lastMotion?: Date;

  getMetadata(): SkillMetadata {
    return {
      name: 'motion-detection',
      version: '1.0.0',
      description: 'Detect and respond to motion',
      author: 'RoboClaw',
    };
  }

  protected async onInitialize(): Promise<void> {
    // Subscribe to sensor events
    this.context.on('sensor:motion', this.handleMotion.bind(this));
    
    // Load last motion time
    const lastMotionStr = await this.context.data.get('last_motion');
    if (lastMotionStr) {
      this.lastMotion = new Date(lastMotionStr);
    }
  }

  async execute(input: any): Promise<any> {
    this.ensureInitialized();
    
    // Manual check
    return {
      lastMotion: this.lastMotion,
      timeSinceMotion: this.lastMotion 
        ? Date.now() - this.lastMotion.getTime()
        : null,
    };
  }

  private async handleMotion(data: any): Promise<void> {
    this.context.log('Motion detected!');
    
    this.lastMotion = new Date();
    await this.context.data.set('last_motion', this.lastMotion.toISOString());
    
    // Emit event for other skills
    this.context.emit('motion_alert', {
      timestamp: this.lastMotion,
      sensor: data.sensor,
    });
  }

  protected async onClose(): Promise<void> {
    this.context.off('sensor:motion', this.handleMotion);
  }
}
```

## Configuration

Skills can accept configuration via `config.yaml`:

```yaml
skills:
  custom:
    - name: weather
      config:
        apiKey: ${WEATHER_API_KEY}
        defaultLocation: "London"
    
    - name: motion-detection
      config:
        sensitivity: high
        alertThreshold: 60000  # 1 minute
```

Access config in your skill:

```typescript
protected async onInitialize(): Promise<void> {
  const sensitivity = this.config.sensitivity || 'medium';
  const threshold = this.config.alertThreshold || 30000;
}
```

## Testing Skills

Create tests for your skills:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherSkill } from './weather-skill.js';
import { createSkillContext } from '@nattaponra/roboclaw-core';

describe('WeatherSkill', () => {
  let skill: WeatherSkill;
  let context: any;

  beforeEach(async () => {
    // Create mock context
    context = createMockContext();
    
    skill = new WeatherSkill();
    await skill.initialize(context, { apiKey: 'test-key' });
  });

  it('should handle weather queries', () => {
    expect(skill.canHandle('What is the weather?')).toBe(true);
    expect(skill.canHandle('Hello')).toBe(false);
  });

  it('should fetch weather data', async () => {
    const result = await skill.execute('What is the weather in London?');
    expect(result).toHaveProperty('temperature');
    expect(result).toHaveProperty('condition');
  });
});
```

## Best Practices

1. **Keep skills focused** - One skill, one responsibility
2. **Use descriptive names** - Clear metadata
3. **Handle errors gracefully** - Don't crash the robot
4. **Log appropriately** - Use context.log for debugging
5. **Clean up resources** - Implement onClose properly
6. **Test thoroughly** - Write unit tests
7. **Document configuration** - Clear README for your skill
8. **Emit events** - Let other skills react to your actions

## Publishing Skills

To share your skills with the community:

1. Create a separate NPM package
2. Export your skill class
3. Document usage and configuration
4. Publish to NPM

```json
{
  "name": "@yourname/roboclaw-skill-weather",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "peerDependencies": {
    "@nattaponra/roboclaw-core": "^0.1.0"
  }
}
```

Users can then install and use:

```bash
npm install @yourname/roboclaw-skill-weather
```

```yaml
# config.yaml
skills:
  custom:
    - name: weather
      package: "@yourname/roboclaw-skill-weather"
```

## Next Steps

- Browse [example skills](../examples/)
- Check out [built-in skills](../packages/core/src/skills/builtin/)
- Join the community to share your skills!
