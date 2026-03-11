/**
 * Scheduler for automated tasks
 */

import cron from 'node-cron';
import { EventEmitter } from 'node:events';

export interface ScheduledTask {
	id: string;
	name: string;
	pattern: string; // Cron pattern
	callback: () => void | Promise<void>;
	enabled: boolean;
}

export interface SchedulerEvents {
	'task:start': (taskId: string) => void;
	'task:complete': (taskId: string) => void;
	'task:error': (taskId: string, error: Error) => void;
}

/**
 * Scheduler for cron-based and event-based tasks
 */
export class Scheduler extends EventEmitter {
	private tasks: Map<string, { task: ScheduledTask; cronTask: cron.ScheduledTask }> = new Map();
	private eventHandlers: Map<string, Set<(...args: any[]) => void | Promise<void>>> = new Map();

	/**
	 * Schedule a task with cron pattern
	 * @param id - Unique task ID
	 * @param name - Human-readable task name
	 * @param pattern - Cron pattern (e.g., "0 8 * * *" for 8 AM daily)
	 * @param callback - Function to execute
	 * @returns Task ID
	 */
	schedule(
		id: string,
		name: string,
		pattern: string,
		callback: () => void | Promise<void>
	): string {
		if (this.tasks.has(id)) {
			throw new Error(`Task with ID "${id}" already exists`);
		}

		// Validate cron pattern
		if (!cron.validate(pattern)) {
			throw new Error(`Invalid cron pattern: ${pattern}`);
		}

		const task: ScheduledTask = {
			id,
			name,
			pattern,
			callback,
			enabled: true,
		};

		const wrappedCallback = async () => {
			if (!task.enabled) return;

			this.emit('task:start', id);

			try {
				await callback();
				this.emit('task:complete', id);
			} catch (error) {
				this.emit('task:error', id, error as Error);
			}
		};

		const cronTask = cron.schedule(pattern, wrappedCallback, {
			scheduled: true,
		});

		this.tasks.set(id, { task, cronTask });

		return id;
	}

	/**
	 * Cancel a scheduled task
	 */
	cancelTask(id: string): boolean {
		const entry = this.tasks.get(id);
		if (!entry) return false;

		entry.cronTask.stop();
		this.tasks.delete(id);

		return true;
	}

	/**
	 * Enable a task
	 */
	enableTask(id: string): boolean {
		const entry = this.tasks.get(id);
		if (!entry) return false;

		entry.task.enabled = true;
		entry.cronTask.start();

		return true;
	}

	/**
	 * Disable a task (pause without removing)
	 */
	disableTask(id: string): boolean {
		const entry = this.tasks.get(id);
		if (!entry) return false;

		entry.task.enabled = false;
		entry.cronTask.stop();

		return true;
	}

	/**
	 * Get task info
	 */
	getTask(id: string): ScheduledTask | undefined {
		const entry = this.tasks.get(id);
		return entry?.task;
	}

	/**
	 * List all tasks
	 */
	listTasks(): ScheduledTask[] {
		return Array.from(this.tasks.values()).map((entry) => entry.task);
	}

	/**
	 * Register an event handler
	 * @param event - Event name
	 * @param handler - Handler function
	 */
	override on(event: string, handler: (...args: any[]) => void): this {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, new Set());
		}

		this.eventHandlers.get(event)!.add(handler);

		super.on(event, handler);
		return this;
	}

	/**
	 * Trigger an event
	 * @param event - Event name
	 * @param args - Event arguments
	 */
	async trigger(event: string, ...args: any[]): Promise<void> {
		const handlers = this.eventHandlers.get(event);
		if (!handlers) return;

		for (const handler of handlers) {
			try {
				await handler(...args);
			} catch (error) {
				this.emit('task:error', event, error as Error);
			}
		}
	}

	/**
	 * Remove event handler
	 */
	override off(event: string, handler: (...args: any[]) => void): this {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.delete(handler);
		}

		super.off(event, handler);
		return this;
	}

	/**
	 * Stop all tasks
	 */
	stopAll(): void {
		for (const entry of this.tasks.values()) {
			entry.cronTask.stop();
		}
	}

	/**
	 * Destroy scheduler and cleanup
	 */
	destroy(): void {
		this.stopAll();
		this.tasks.clear();
		this.eventHandlers.clear();
		this.removeAllListeners();
	}
}
