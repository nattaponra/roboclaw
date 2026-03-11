/**
 * Skill Manager - loads and manages robot skills
 */

import type { RobotAgent } from "../robot-agent.js";
import type { RobotConfig } from "../config/schema.js";
import { BaseSkill } from "./base-skill.js";
import { createSkillContext } from "./skill-context.js";

export class SkillManager {
	private robot: RobotAgent;
	private config: RobotConfig;
	private skills: Map<string, BaseSkill> = new Map();

	constructor(robot: RobotAgent, config: RobotConfig) {
		this.robot = robot;
		this.config = config;
	}

	/**
	 * Register a skill
	 * @param skill - Skill instance
	 * @param skillConfig - Skill configuration
	 */
	async registerSkill(
		skill: BaseSkill,
		skillConfig?: any,
	): Promise<void> {
		const metadata = skill.getMetadata();
		
		if (this.skills.has(metadata.name)) {
			throw new Error(`Skill ${metadata.name} already registered`);
		}

		// Check dependencies
		if (metadata.dependencies) {
			for (const dep of metadata.dependencies) {
				if (!this.skills.has(dep)) {
					throw new Error(
						`Skill ${metadata.name} depends on ${dep} which is not registered`,
					);
				}
			}
		}

		// Create skill context
		const context = createSkillContext(
			this.robot,
			metadata.name,
			this.config,
		);

		// Initialize skill
		await skill.initialize(context, skillConfig);

		this.skills.set(metadata.name, skill);
		this.robot.emit("skill:registered", metadata.name);
	}

	/**
	 * Unregister a skill
	 * @param skillName - Skill name
	 */
	async unregisterSkill(skillName: string): Promise<void> {
		const skill = this.skills.get(skillName);
		if (!skill) {
			return;
		}

		await skill.close();
		this.skills.delete(skillName);
		this.robot.emit("skill:unregistered", skillName);
	}

	/**
	 * Get a skill by name
	 * @param skillName - Skill name
	 */
	getSkill(skillName: string): BaseSkill | undefined {
		return this.skills.get(skillName);
	}

	/**
	 * Get all registered skills
	 */
	getAllSkills(): BaseSkill[] {
		return Array.from(this.skills.values());
	}

	/**
	 * Get skill names
	 */
	getSkillNames(): string[] {
		return Array.from(this.skills.keys());
	}

	/**
	 * Execute a skill by name
	 * @param skillName - Skill name
	 * @param input - Input parameters
	 */
	async executeSkill(skillName: string, input?: any): Promise<any> {
		const skill = this.skills.get(skillName);
		
		if (!skill) {
			throw new Error(`Skill ${skillName} not found`);
		}

		if (!skill.canHandle(input)) {
			throw new Error(`Skill ${skillName} cannot handle this input`);
		}

		this.robot.emit("skill:execute:start", skillName, input);

		try {
			const result = await skill.execute(input);
			this.robot.emit("skill:execute:success", skillName, result);
			return result;
		} catch (error) {
			this.robot.emit("skill:execute:error", skillName, error);
			throw error;
		}
	}

	/**
	 * Find skills that can handle the input
	 * @param input - Input to check
	 */
	findSkillsForInput(input: any): BaseSkill[] {
		return Array.from(this.skills.values()).filter((skill) =>
			skill.canHandle(input),
		);
	}

	/**
	 * Get status of all skills
	 */
	getStatus(): Record<string, any> {
		const status: Record<string, any> = {};
		
		for (const [name, skill] of this.skills.entries()) {
			status[name] = skill.getStatus();
		}

		return status;
	}

	/**
	 * Close all skills
	 */
	async closeAll(): Promise<void> {
		for (const skill of this.skills.values()) {
			await skill.close();
		}

		this.skills.clear();
	}
}
