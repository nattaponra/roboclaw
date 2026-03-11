/**
 * SQLite database wrapper for robot memory
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface DatabaseOptions {
	path: string;
	readonly?: boolean;
}

export class RobotDatabase {
	private db: Database.Database;

	constructor(options: DatabaseOptions) {
		// Ensure directory exists (skip for in-memory databases)
		if (options.path !== ':memory:') {
			const dir = dirname(options.path);
			mkdirSync(dir, { recursive: true });
		}

		// Open database
		this.db = new Database(options.path, {
			readonly: options.readonly ?? false,
			fileMustExist: false,
		});

		// Enable WAL mode for better concurrency
		this.db.pragma('journal_mode = WAL');

		// Initialize schema
		this.initializeSchema();
	}

	/**
	 * Initialize database schema
	 */
	private initializeSchema(): void {
		// Conversations table
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS conversations (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				role TEXT NOT NULL,
				content TEXT NOT NULL,
				timestamp INTEGER NOT NULL,
				metadata TEXT
			)
		`);

		// Create index on timestamp for efficient queries
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_conversations_timestamp 
			ON conversations(timestamp DESC)
		`);

		// User preferences table
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS user_preferences (
				user_id TEXT NOT NULL,
				key TEXT NOT NULL,
				value TEXT NOT NULL,
				updated_at INTEGER NOT NULL,
				PRIMARY KEY (user_id, key)
			)
		`);

		// Faces table for face recognition
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS faces (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				encoding BLOB NOT NULL,
				image_path TEXT,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			)
		`);

		// Create index on face name
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_faces_name 
			ON faces(name)
		`);

		// Events/logs table
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS events (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				type TEXT NOT NULL,
				data TEXT NOT NULL,
				timestamp INTEGER NOT NULL
			)
		`);

		// Create index on event type and timestamp
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_events_type_timestamp 
			ON events(type, timestamp DESC)
		`);
	}

	/**
	 * Get the underlying database instance
	 */
	getDb(): Database.Database {
		return this.db;
	}

	/**
	 * Execute a SQL statement
	 */
	exec(sql: string): void {
		this.db.exec(sql);
	}

	/**
	 * Prepare a SQL statement
	 */
	prepare(sql: string): Database.Statement {
		return this.db.prepare(sql);
	}

	/**
	 * Run a transaction
	 */
	transaction<T>(fn: () => T): T {
		const txn = this.db.transaction(fn);
		return txn();
	}

	/**
	 * Close the database
	 */
	close(): void {
		this.db.close();
	}

	/**
	 * Optimize database (vacuum and analyze)
	 */
	optimize(): void {
		this.db.exec('VACUUM');
		this.db.exec('ANALYZE');
	}
}
