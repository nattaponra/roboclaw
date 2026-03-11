/**
 * @package @nattaponra/roboclaw-core
 * @description Core agent framework for RoboClaw robot platform
 */

export const VERSION = '0.1.0';

// Robot Agent
export { RobotAgent } from './robot-agent.js';

// Configuration
export * from './config/schema.js';
export { loadConfig, validateConfig } from './config/loader.js';
export { DEFAULT_CONFIG, EXAMPLE_MINIMAL_CONFIG, EXAMPLE_FULL_CONFIG } from './config/defaults.js';

// Memory
export * from './memory/index.js';

// Scheduler
export * from './scheduler/index.js';

// Types
export * from './types/index.js';

// Skills
export * from './skills/index.js';
