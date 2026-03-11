import { describe, it, expect, afterEach } from 'vitest';
import { RobotDatabase } from './database.js';
import { unlinkSync } from 'node:fs';

const TEST_DB_PATH = ':memory:'; // Use in-memory database for tests

describe('RobotDatabase', () => {
	let db: RobotDatabase;

	afterEach(() => {
		if (db) {
			db.close();
		}
	});

	it('should create database and initialize schema', () => {
		db = new RobotDatabase({ path: TEST_DB_PATH });

		// Verify tables exist
		const tables = db
			.prepare(
				`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
			)
			.all() as { name: string }[];

		const tableNames = tables.map((t) => t.name);

		expect(tableNames).toContain('conversations');
		expect(tableNames).toContain('user_preferences');
		expect(tableNames).toContain('faces');
		expect(tableNames).toContain('events');
	});

	it('should insert and retrieve data', () => {
		db = new RobotDatabase({ path: TEST_DB_PATH });

		// Insert a conversation message
		const stmt = db.prepare(`
			INSERT INTO conversations (role, content, timestamp)
			VALUES (?, ?, ?)
		`);

		stmt.run('user', 'Hello!', Date.now());

		// Retrieve it
		const result = db
			.prepare(`SELECT * FROM conversations WHERE role = ?`)
			.get('user') as any;

		expect(result.content).toBe('Hello!');
	});
});
