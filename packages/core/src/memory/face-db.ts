/**
 * Face recognition database
 */

import type { RobotDatabase } from './database.js';

export interface FaceRecord {
	id?: number;
	name: string;
	encoding: Buffer;
	imagePath?: string;
	createdAt: number;
	updatedAt: number;
}

export class FaceDatabase {
	constructor(private db: RobotDatabase) {}

	/**
	 * Register a new face
	 */
	registerFace(face: Omit<FaceRecord, 'id' | 'createdAt' | 'updatedAt'>): number {
		const now = Date.now();

		const stmt = this.db.prepare(`
			INSERT INTO faces (name, encoding, image_path, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
		`);

		const info = stmt.run(face.name, face.encoding, face.imagePath || null, now, now);

		return info.lastInsertRowid as number;
	}

	/**
	 * Update face encoding
	 */
	updateFace(name: string, encoding: Buffer, imagePath?: string): void {
		const stmt = this.db.prepare(`
			UPDATE faces
			SET encoding = ?, image_path = ?, updated_at = ?
			WHERE name = ?
		`);

		stmt.run(encoding, imagePath || null, Date.now(), name);
	}

	/**
	 * Get face by name
	 */
	getFaceByName(name: string): FaceRecord | undefined {
		const stmt = this.db.prepare(`
			SELECT id, name, encoding, image_path, created_at, updated_at
			FROM faces
			WHERE name = ?
		`);

		const row = stmt.get(name) as any;

		if (!row) return undefined;

		return {
			id: row.id,
			name: row.name,
			encoding: row.encoding,
			imagePath: row.image_path,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}

	/**
	 * Get all registered faces
	 */
	getAllFaces(): FaceRecord[] {
		const stmt = this.db.prepare(`
			SELECT id, name, encoding, image_path, created_at, updated_at
			FROM faces
			ORDER BY name ASC
		`);

		const rows = stmt.all() as any[];

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			encoding: row.encoding,
			imagePath: row.image_path,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));
	}

	/**
	 * Delete face by name
	 */
	deleteFace(name: string): boolean {
		const stmt = this.db.prepare(`DELETE FROM faces WHERE name = ?`);
		const info = stmt.run(name);
		return info.changes > 0;
	}

	/**
	 * Check if face exists
	 */
	faceExists(name: string): boolean {
		const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM faces WHERE name = ?`);
		const row = stmt.get(name) as { count: number };
		return row.count > 0;
	}

	/**
	 * Get face count
	 */
	getFaceCount(): number {
		const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM faces`);
		const row = stmt.get() as { count: number };
		return row.count;
	}

	/**
	 * Clear all faces
	 */
	clearAll(): void {
		this.db.exec('DELETE FROM faces');
	}
}
