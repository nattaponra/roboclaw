/**
 * Greeting Skill - responds to greetings
 */

import { BaseSkill, type SkillMetadata } from "../base-skill.js";

export class GreetingSkill extends BaseSkill {
	private greetings = ["hello", "hi", "hey", "greetings", "good morning", "good evening"];
	private responses = [
		"Hello! How can I help you today?",
		"Hi there! What can I do for you?",
		"Hey! Nice to see you!",
		"Greetings! How may I assist you?",
	];

	getMetadata(): SkillMetadata {
		return {
			name: "greeting",
			version: "1.0.0",
			description: "Responds to greetings with friendly messages",
			author: "RoboClaw",
		};
	}

	canHandle(input: any): boolean {
		if (!super.canHandle(input)) {
			return false;
		}

		if (typeof input !== "string") {
			return false;
		}

		const lowerInput = input.toLowerCase();
		return this.greetings.some((greeting) => lowerInput.includes(greeting));
	}

	async execute(input: string): Promise<string> {
		this.ensureInitialized();

		this.context.log(`Processing greeting: ${input}`);

		// Pick a random response
		const response =
			this.responses[Math.floor(Math.random() * this.responses.length)];

		this.context.emit("greeting", { input, response });

		return response;
	}

	protected async onInitialize(): Promise<void> {
		// Load custom responses from config if available
		if (this.config.responses && Array.isArray(this.config.responses)) {
			this.responses = this.config.responses;
		}

		// Load custom greetings from config if available
		if (this.config.greetings && Array.isArray(this.config.greetings)) {
			this.greetings = this.config.greetings;
		}
	}
}
