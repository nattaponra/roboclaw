/**
 * Status command - check robot status
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "@nattaponra/roboclaw-core";
import { existsSync } from "node:fs";

export const statusCommand = new Command("status")
	.description("Check robot status")
	.option("-c, --config <path>", "Config file path", "config.yaml")
	.action(async (options) => {
		console.log(chalk.blue.bold("\n🤖 Robot Status\n"));

		// Check if config exists
		if (!existsSync(options.config)) {
			console.log(chalk.red("❌ No config file found"));
			console.log(chalk.white("Run 'roboclaw init' to create a new project\n"));
			return;
		}

		try {
			// Load configuration
			const config = await loadConfig(options.config);

			console.log(chalk.white("Configuration:"));
			console.log(chalk.white(`  Name: ${config.robot.name}`));
			console.log(chalk.white(`  Platform: ${config.robot.platform}`));
			console.log(chalk.white(`  LLM: ${config.llm.provider}/${config.llm.model}`));

			console.log(chalk.white("\nFeatures:"));
			console.log(
				chalk.white(
					`  Voice: ${config.features?.voice?.enabled ? "✅ enabled" : "❌ disabled"}`,
				),
			);
			console.log(
				chalk.white(
					`  Vision: ${config.features?.vision?.enabled ? "✅ enabled" : "❌ disabled"}`,
				),
			);

			console.log(chalk.white("\nMemory:"));
			console.log(chalk.white(`  Path: ${config.memory.path}`));

			if (config.communication?.mqtt?.enabled) {
				console.log(chalk.white("\nMQTT:"));
				console.log(chalk.white(`  Broker: ${config.communication.mqtt.broker}`));
			}

			console.log();
		} catch (error) {
			console.error(chalk.red(`❌ Error loading config: ${error}\n`));
			process.exit(1);
		}
	});
