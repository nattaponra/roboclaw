/**
 * Start command - start the robot
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig, RobotAgent } from "@nattaponra/roboclaw-core";
import { existsSync } from "node:fs";

export const startCommand = new Command("start")
	.description("Start the RoboClaw robot")
	.option("-c, --config <path>", "Config file path", "config.yaml")
	.option("-d, --daemon", "Run as daemon")
	.action(async (options) => {
		console.log(chalk.blue.bold("\n🤖 Starting RoboClaw Robot\n"));

		// Check if config exists
		if (!existsSync(options.config)) {
			console.error(
				chalk.red(`❌ Config file not found: ${options.config}`),
			);
			console.log(
				chalk.white("Run 'roboclaw init' to create a new project"),
			);
			process.exit(1);
		}

		const spinner = ora("Loading configuration...").start();

		try {
			// Load configuration
			const config = await loadConfig(options.config);
			spinner.text = "Initializing robot...";

			// Create robot agent (initialization happens in constructor)
			const robot = new RobotAgent(config);
			
			spinner.succeed("Robot initialized");

			console.log(chalk.green(`\n✅ ${config.robot.name} is running!\n`));
			console.log(chalk.white("Press Ctrl+C to stop\n"));

			// Handle graceful shutdown
			const shutdown = async () => {
				console.log(chalk.yellow("\n\n🛑 Shutting down..."));
				await robot.shutdown();
				console.log(chalk.green("✅ Robot stopped\n"));
				process.exit(0);
			};

			process.on("SIGINT", shutdown);
			process.on("SIGTERM", shutdown);

			// Keep process alive
			if (!options.daemon) {
				await new Promise(() => {});
			}
		} catch (error) {
			spinner.fail("Failed to start robot");
			console.error(chalk.red(`\nError: ${error}`));
			process.exit(1);
		}
	});
