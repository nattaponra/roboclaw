/**
 * Common types used throughout the core package
 */

import type { AgentState } from '@mariozechner/pi-agent-core';

/**
 * Robot agent state extending base agent state
 */
export interface RobotAgentState extends AgentState {
	// Additional robot-specific state can be added here
}

/**
 * Robot status
 */
export type RobotStatus = 'idle' | 'active' | 'error' | 'stopped';

/**
 * Robot event types
 */
export interface RobotEvents {
	'robot:started': () => void;
	'robot:stopped': () => void;
	'robot:error': (error: Error) => void;
	'status:changed': (status: RobotStatus) => void;
}
