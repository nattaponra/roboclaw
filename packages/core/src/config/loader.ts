/**
 * Configuration loader - loads and validates YAML config files
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { ConfigSchema, type RobotConfig } from './schema.js';

/**
 * Load configuration from YAML file
 * @param configPath - Path to config.yaml file
 * @returns Validated configuration object
 * @throws Error if config is invalid or file not found
 */
export function loadConfig(configPath: string): RobotConfig {
	try {
		// Resolve absolute path
		const absolutePath = resolve(configPath);

		// Read file
		const fileContent = readFileSync(absolutePath, 'utf-8');

		// Parse YAML
		const rawConfig = yaml.load(fileContent);

		// Replace environment variables
		const configWithEnv = replaceEnvVariables(rawConfig);

		// Validate with Zod
		const validatedConfig = ConfigSchema.parse(configWithEnv);

		return validatedConfig;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Replace environment variable placeholders like ${VAR_NAME}
 * @param obj - Configuration object
 * @returns Object with env vars replaced
 */
function replaceEnvVariables(obj: any): any {
	if (typeof obj === 'string') {
		// Match ${VAR_NAME} pattern
		const envVarPattern = /\$\{([^}]+)\}/g;
		return obj.replace(envVarPattern, (_match, varName) => {
			const value = process.env[varName];
			if (value === undefined) {
				throw new Error(`Environment variable ${varName} is not set`);
			}
			return value;
		});
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => replaceEnvVariables(item));
	}

	if (obj !== null && typeof obj === 'object') {
		const result: any = {};
		for (const key in obj) {
			result[key] = replaceEnvVariables(obj[key]);
		}
		return result;
	}

	return obj;
}

/**
 * Validate configuration object without loading from file
 * @param config - Raw configuration object
 * @returns Validated configuration
 */
export function validateConfig(config: unknown): RobotConfig {
	return ConfigSchema.parse(config);
}
