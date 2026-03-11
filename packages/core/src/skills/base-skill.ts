/**
 * Base Skill class for all robot skills
 */

import type { SkillContext } from "./skill-context.js";

export interface SkillMetadata {
	/** Skill name */
	name: string;
	/** Skill version */
	version: string;
	/** Skill description */
	description: string;
	/** Author */
	author?: string;
	/** Dependencies (other skill names) */
	dependencies?: string[];
	/** Configuration schema */
	configSchema?: Record<string, any>;
}

export interface SkillConfig {
	/** Whether skill is enabled */
	enabled?: boolean;
	/** Skill-specific configuration */
	[key: string]: any;
}

/**
 * Base Skill abstract class
 * All skills should extend this class
 */
export abstract class BaseSkill {
	protected context!: SkillContext;
	protected config: SkillConfig = { enabled: true };
	protected initialized = false;

	/**
	 * Skill metadata
	 */
	abstract getMetadata(): SkillMetadata;

	/**
	 * Initialize the skill
	 * @param context - Skill context providing access to robot capabilities
	 * @param config - Skill configuration
	 */
	async initialize(context: SkillContext, config: SkillConfig = {}): Promise<void> {
		if (this.initialized) {
			throw new Error(`Skill ${this.getMetadata().name} already initialized`);
		}

		this.context = context;
		this.config = { ...this.config, ...config };

		if (this.config.enabled === false) {
			context.log("Skill is disabled", "info");
			return;
		}

		await this.onInitialize();
		this.initialized = true;

		context.log(`Initialized v${this.getMetadata().version}`, "info");
	}

	/**
	 * Execute the skill
	 * @param input - Input parameters
	 * @returns Execution result
	 */
	abstract execute(input?: any): Promise<any>;

	/**
	 * Check if skill can handle the given input
	 * @param input - Input to check
	 * @returns True if skill can handle
	 */
	canHandle(_input: any): boolean {
		return this.initialized && this.config.enabled !== false;
	}

	/**
	 * Get skill status
	 */
	getStatus(): {
		name: string;
		initialized: boolean;
		enabled: boolean;
	} {
		return {
			name: this.getMetadata().name,
			initialized: this.initialized,
			enabled: this.config.enabled !== false,
		};
	}

	/**
	 * Cleanup and shutdown the skill
	 */
	async close(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		await this.onClose();
		this.initialized = false;

		this.context.log("Closed", "info");
	}

	/**
	 * Hook called during initialization (override in subclass)
	 */
	protected async onInitialize(): Promise<void> {
		// Override in subclass if needed
	}

	/**
	 * Hook called during close (override in subclass)
	 */
	protected async onClose(): Promise<void> {
		// Override in subclass if needed
	}

	/**
	 * Helper to ensure skill is initialized
	 */
	protected ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error(`Skill ${this.getMetadata().name} not initialized`);
		}
	}
}
