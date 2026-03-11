/**
 * Skill Context - provides access to robot capabilities
 */

import type { RobotAgent } from "../robot-agent.js";
import type { RobotConfig } from "../config/schema.js";

export interface SkillContext {
	/** Robot agent instance */
	robot: RobotAgent;
	
	/** Robot configuration */
	config: RobotConfig;
	
	/** Logger function */
	log: (message: string, level?: "info" | "warn" | "error") => void;
	
	/** Get/set persistent data for this skill */
	data: {
		get: (key: string) => Promise<any>;
		set: (key: string, value: any) => Promise<void>;
		delete: (key: string) => Promise<void>;
	};
	
	/** Emit events */
	emit: (event: string, data?: any) => void;
	
	/** Subscribe to events */
	on: (event: string, handler: (...args: any[]) => void) => void;
	
	/** Unsubscribe from events */
	off: (event: string, handler: (...args: any[]) => void) => void;
}

/**
 * Create a skill context for a skill
 */
export function createSkillContext(
	robot: RobotAgent,
	skillName: string,
	config: RobotConfig,
): SkillContext {
	return {
		robot,
		config,
		
		log: (message: string, level: "info" | "warn" | "error" = "info") => {
			const prefix = `[Skill:${skillName}]`;
			switch (level) {
				case "info":
					console.log(prefix, message);
					break;
				case "warn":
					console.warn(prefix, message);
					break;
				case "error":
					console.error(prefix, message);
					break;
			}
		},
		
		data: {
			get: async (key: string) => {
				// Store in robot preferences with skill namespace
				return robot.memory.getUserPreference("_system", `skill_${skillName}_${key}`);
			},
			set: async (key: string, value: any) => {
				await robot.memory.setUserPreference("_system", `skill_${skillName}_${key}`, value);
			},
			delete: async (key: string) => {
				// Just set to null to "delete"
				await robot.memory.setUserPreference("_system", `skill_${skillName}_${key}`, null);
			},
		},
		
		emit: (event: string, data?: any) => {
			robot.emit(`skill:${skillName}:${event}`, data);
		},
		
		on: (event: string, handler: (...args: any[]) => void) => {
			robot.on(`skill:${skillName}:${event}`, handler);
		},
		
		off: (event: string, handler: (...args: any[]) => void) => {
			robot.off(`skill:${skillName}:${event}`, handler);
		},
	};
}
