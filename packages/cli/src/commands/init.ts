/**
 * Init command - initialize a new RoboClaw project
 */

import { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { EXAMPLE_MINIMAL_CONFIG } from "@nattaponra/roboclaw-core";

export const initCommand = new Command("init")
	.description("Initialize a new RoboClaw project")
	.option("-d, --dir <directory>", "Project directory", ".")
	.option("-n, --name <name>", "Robot name")
	.option("--skip-prompts", "Skip interactive prompts")
	.action(async (options) => {
		console.log(chalk.blue.bold("\n🤖 RoboClaw Project Initialization\n"));

		// Get project configuration
		const config = await getProjectConfig(options);

		// Create project structure
		const spinner = ora("Creating project structure...").start();

		try {
			await createProjectStructure(config);
			spinner.succeed("Project structure created");

			console.log(chalk.green("\n✅ Project initialized successfully!\n"));
			console.log(chalk.white("Next steps:"));
			console.log(chalk.white(`  1. cd ${config.dir}`));
			console.log(chalk.white("  2. Edit config.yaml to configure your robot"));
			console.log(chalk.white("  3. Run: roboclaw start\n"));
		} catch (error) {
			spinner.fail("Failed to create project");
			console.error(chalk.red(`Error: ${error}`));
			process.exit(1);
		}
	});

async function getProjectConfig(options: any) {
	if (options.skipPrompts) {
		return {
			dir: options.dir || ".",
			name: options.name || "my-robot",
			template: "minimal",
		};
	}

	const name =
		options.name ||
		(await input({
			message: "Robot name:",
			default: "my-robot",
		}));

	const dir =
		options.dir ||
		(await input({
			message: "Project directory:",
			default: ".",
		}));

	const template = await select({
		message: "Choose a template:",
		choices: [
			{ name: "Minimal (basic config)", value: "minimal" },
			{ name: "Full (all features)", value: "full" },
			{ name: "Home Assistant (with MQTT)", value: "homeassistant" },
		],
		default: "minimal",
	});

	return { name, dir, template };
}

async function createProjectStructure(config: any) {
	const { dir, name, template } = config;

	// Create directories
	await mkdir(join(dir, "skills"), { recursive: true });
	await mkdir(join(dir, "data"), { recursive: true });
	await mkdir(join(dir, "logs"), { recursive: true });

	// Create config file
	const configContent = generateConfig(name, template);
	await writeFile(join(dir, "config.yaml"), configContent);

	// Create .gitignore
	const gitignoreContent = `
data/
logs/
node_modules/
*.log
.env
`.trim();
	await writeFile(join(dir, ".gitignore"), gitignoreContent);

	// Create README
	const readmeContent = generateReadme(name);
	await writeFile(join(dir, "README.md"), readmeContent);

	// Create example skill
	const exampleSkillContent = generateExampleSkill();
	await writeFile(join(dir, "skills", "example-skill.ts"), exampleSkillContent);
}

function generateConfig(name: string, template: string): string {
	const baseConfig = EXAMPLE_MINIMAL_CONFIG;
	
	// Customize based on template
	let config = baseConfig.replace("My Robot", name);

	if (template === "homeassistant") {
		config += `\n
# Home Assistant Integration
communication:
  mqtt:
    enabled: true
    broker: "mqtt://localhost"
    port: 1883
  homeassistant:
    enabled: true
    discovery_prefix: "homeassistant"
    device_name: "${name}"
`;
	}

	return config;
}

function generateReadme(name: string): string {
	return `# ${name}

RoboClaw Robot Project

## Getting Started

1. Configure your robot by editing \`config.yaml\`
2. Start the robot: \`roboclaw start\`
3. Add custom skills in the \`skills/\` directory

## Commands

- \`roboclaw start\` - Start the robot
- \`roboclaw status\` - Check robot status
- \`roboclaw skill list\` - List available skills
- \`roboclaw skill add <name>\` - Add a new skill

## Documentation

Visit https://github.com/nattaponra/agent for full documentation.
`;
}

function generateExampleSkill(): string {
	return `import { BaseSkill, type SkillMetadata } from '@nattaponra/roboclaw-core';

export class ExampleSkill extends BaseSkill {
  getMetadata(): SkillMetadata {
    return {
      name: 'example',
      version: '1.0.0',
      description: 'An example skill',
    };
  }

  async execute(input: any): Promise<any> {
    this.context.log('Example skill executed!');
    return { success: true };
  }
}
`;
}
