/**
 * Memory system exports
 */

export { RobotDatabase, type DatabaseOptions } from './database.js';
export { ConversationMemory, type Message } from './conversation.js';
export { FaceDatabase, type FaceRecord } from './face-db.js';

/**
 * Main memory manager that combines all memory modules
 */
import { RobotDatabase } from './database.js';
import { ConversationMemory } from './conversation.js';
import { FaceDatabase } from './face-db.js';

export class RobotMemory {
	public readonly db: RobotDatabase;
	public readonly conversation: ConversationMemory;
	public readonly faces: FaceDatabase;

	constructor(dbPath: string) {
		this.db = new RobotDatabase({ path: dbPath });
		this.conversation = new ConversationMemory(this.db);
		this.faces = new FaceDatabase(this.db);
	}

	/**
	 * Get/set user preferences
	 */
	async setUserPreference(userId: string, key: string, value: any): Promise<void> {
		const stmt = this.db.prepare(`
			INSERT OR REPLACE INTO user_preferences (user_id, key, value, updated_at)
			VALUES (?, ?, ?, ?)
		`);

		stmt.run(userId, key, JSON.stringify(value), Date.now());
	}

	async getUserPreference(userId: string, key: string): Promise<any> {
		const stmt = this.db.prepare(`
			SELECT value FROM user_preferences
			WHERE user_id = ? AND key = ?
		`);

		const row = stmt.get(userId, key) as { value: string } | undefined;

		return row ? JSON.parse(row.value) : undefined;
	}

	/**
	 * Log an event
	 */
	logEvent(type: string, data: any): void {
		const stmt = this.db.prepare(`
			INSERT INTO events (type, data, timestamp)
			VALUES (?, ?, ?)
		`);

		stmt.run(type, JSON.stringify(data), Date.now());
	}

	/**
	 * Get events by type
	 */
	getEvents(type: string, limit: number = 100): Array<{ type: string; data: any; timestamp: number }> {
		const stmt = this.db.prepare(`
			SELECT type, data, timestamp
			FROM events
			WHERE type = ?
			ORDER BY timestamp DESC
			LIMIT ?
		`);

		const rows = stmt.all(type, limit) as any[];

		return rows.map((row) => ({
			type: row.type,
			data: JSON.parse(row.data),
			timestamp: row.timestamp,
		}));
	}

	/**
	 * Close database connection
	 */
	close(): void {
		this.db.close();
	}

	/**
	 * Optimize database
	 */
	optimize(): void {
		this.db.optimize();
	}
}
