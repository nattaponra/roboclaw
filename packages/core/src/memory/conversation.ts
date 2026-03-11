/**
 * Conversation memory management
 */

import type { RobotDatabase } from './database.js';

export interface Message {
	id?: number;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
	metadata?: Record<string, any>;
}

export class ConversationMemory {
	constructor(private db: RobotDatabase) {}

	/**
	 * Add a message to conversation history
	 */
	addMessage(message: Omit<Message, 'id'>): number {
		const stmt = this.db.prepare(`
			INSERT INTO conversations (role, content, timestamp, metadata)
			VALUES (?, ?, ?, ?)
		`);

		const info = stmt.run(
			message.role,
			message.content,
			message.timestamp,
			message.metadata ? JSON.stringify(message.metadata) : null
		);

		return info.lastInsertRowid as number;
	}

	/**
	 * Get recent conversation history
	 */
	getRecentMessages(limit: number = 100): Message[] {
		const stmt = this.db.prepare(`
			SELECT id, role, content, timestamp, metadata
			FROM conversations
			ORDER BY timestamp DESC
			LIMIT ?
		`);

		const rows = stmt.all(limit) as any[];

		return rows
			.map((row) => ({
				id: row.id,
				role: row.role,
				content: row.content,
				timestamp: row.timestamp,
				metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
			}))
			.reverse(); // Return in chronological order
	}

	/**
	 * Get messages within a time range
	 */
	getMessagesByTimeRange(startTime: number, endTime: number): Message[] {
		const stmt = this.db.prepare(`
			SELECT id, role, content, timestamp, metadata
			FROM conversations
			WHERE timestamp >= ? AND timestamp <= ?
			ORDER BY timestamp ASC
		`);

		const rows = stmt.all(startTime, endTime) as any[];

		return rows.map((row) => ({
			id: row.id,
			role: row.role,
			content: row.content,
			timestamp: row.timestamp,
			metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
		}));
	}

	/**
	 * Search messages by content
	 */
	searchMessages(query: string, limit: number = 50): Message[] {
		const stmt = this.db.prepare(`
			SELECT id, role, content, timestamp, metadata
			FROM conversations
			WHERE content LIKE ?
			ORDER BY timestamp DESC
			LIMIT ?
		`);

		const rows = stmt.all(`%${query}%`, limit) as any[];

		return rows.map((row) => ({
			id: row.id,
			role: row.role,
			content: row.content,
			timestamp: row.timestamp,
			metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
		}));
	}

	/**
	 * Clear old messages (keep only recent N messages)
	 */
	clearOldMessages(keepCount: number = 100): number {
		const stmt = this.db.prepare(`
			DELETE FROM conversations
			WHERE id NOT IN (
				SELECT id FROM conversations
				ORDER BY timestamp DESC
				LIMIT ?
			)
		`);

		const info = stmt.run(keepCount);
		return info.changes;
	}

	/**
	 * Get total message count
	 */
	getMessageCount(): number {
		const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM conversations`);
		const row = stmt.get() as { count: number };
		return row.count;
	}

	/**
	 * Clear all messages
	 */
	clearAll(): void {
		this.db.exec('DELETE FROM conversations');
	}
}
