/**
 * Skill command - manage robot skills
 */

import { Command } from "commander";
import chalk from "chalk";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export const skillCommand = new Command("skill")
	.description("Manage robot skills");

// List skills
skillCommand
	.command("list")
	.description("List available skills")
	.action(() => {
		console.log(chalk.blue.bold("\n📦 Available Skills\n"));
		console.log(chalk.white("Built-in:"));
		console.log(chalk.white("  - greeting (responds to greetings)"));
		console.log(chalk.white("\nCustom skills should be placed in ./skills/ directory\n"));
	});

// Create new skill
skillCommand
	.command("add <name>")
	.description("Create a new skill")
	.option("-d, --dir <directory>", "Skills directory", "./skills")
	.action(async (name, options) => {
		console.log(chalk.blue.bold(`\n📦 Creating skill: ${name}\n`));

		const skillContent = generateSkillTemplate(name);
		const filePath = join(options.dir, `${name}-skill.ts`);

		try {
			await writeFile(filePath, skillContent);
			console.log(chalk.green(`✅ Skill created: ${filePath}\n`));
		} catch (error) {
			console.error(chalk.red(`❌ Failed to create skill: ${error}\n`));
			process.exit(1);
		}
	});

function generateSkillTemplate(name: string): string {
	const className = name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("");

	return `import { BaseSkill, type SkillMetadata } from '@nattaponra/roboclaw-core';

/**
 * ${className}Skill
 */
export class ${className}Skill extends BaseSkill {
  getMetadata(): SkillMetadata {
    return {
      name: '${name}',
      version: '1.0.0',
      description: 'Description of ${name} skill',
      author: 'Your Name',
    };
  }

  canHandle(input: any): boolean {
    if (!super.canHandle(input)) {
      return false;
    }

    // TODO: Add logic to determine if this skill can handle the input
    return true;
  }

  async execute(input: any): Promise<any> {
    this.ensureInitialized();

    this.context.log(\`Executing ${name} skill with input: \${JSON.stringify(input)}\`);

    // TODO: Implement skill logic here

    return { success: true, result: 'TODO: Implement' };
  }

  protected async onInitialize(): Promise<void> {
    // TODO: Add initialization logic if needed
    this.context.log('Skill initialized');
  }

  protected async onClose(): Promise<void> {
    // TODO: Add cleanup logic if needed
    this.context.log('Skill closed');
  }
}
`;
}
