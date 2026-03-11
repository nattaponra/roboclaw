#!/usr/bin/env node

/**
 * RoboClaw CLI
 * Command-line interface for managing RoboClaw robots
 */

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { startCommand } from "./commands/start.js";
import { skillCommand } from "./commands/skill.js";
import { statusCommand } from "./commands/status.js";

const program = new Command();

program
	.name("roboclaw")
	.description("CLI for RoboClaw robot platform")
	.version("0.1.0");

// Commands
program.addCommand(initCommand);
program.addCommand(startCommand);
program.addCommand(skillCommand);
program.addCommand(statusCommand);

// Parse arguments
program.parse(process.argv);
