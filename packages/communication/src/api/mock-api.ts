import { EventEmitter } from "node:events";
import type {
	APIServer,
	APIConfig,
	APIRoute,
	APIRequest,
	APIResponse,
} from "../interfaces/api.js";

/**
 * Mock API Server for testing
 */
export class MockAPIServer extends EventEmitter implements APIServer {
	private config?: APIConfig;
	private running = false;
	private routes: Map<string, APIRoute> = new Map();
	private requestHistory: Array<{
		request: APIRequest;
		response: APIResponse;
		timestamp: number;
	}> = [];

	async start(config: APIConfig): Promise<void> {
		if (this.running) {
			throw new Error("Server already running");
		}

		this.config = config;

		// Simulate server startup
		await this.delay(100);

		this.running = true;
		this.emit("start", { port: config.port, host: config.host });
	}

	registerRoute(route: APIRoute): void {
		const key = `${route.method}:${route.path}`;
		this.routes.set(key, route);
		this.emit("route:registered", route);
	}

	registerRoutes(routes: APIRoute[]): void {
		for (const route of routes) {
			this.registerRoute(route);
		}
	}

	removeRoute(method: string, path: string): void {
		const key = `${method}:${path}`;
		this.routes.delete(key);
		this.emit("route:removed", { method, path });
	}

	getInfo(): {
		port: number;
		host: string;
		running: boolean;
		routes: number;
	} {
		return {
			port: this.config?.port || 0,
			host: this.config?.host || "localhost",
			running: this.running,
			routes: this.routes.size,
		};
	}

	isRunning(): boolean {
		return this.running;
	}

	async stop(): Promise<void> {
		if (!this.running) {
			return;
		}

		this.running = false;
		this.routes.clear();
		this.emit("stop");

		// Simulate server shutdown
		await this.delay(50);
	}

	// Helper methods
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Test helpers
	public async simulateRequest(request: APIRequest): Promise<APIResponse> {
		if (!this.running) {
			throw new Error("Server not running");
		}

		const key = `${request.method}:${request.path}`;
		const route = this.routes.get(key);

		if (!route) {
			const response: APIResponse = {
				status: 404,
				body: { error: "Route not found" },
			};
			this.requestHistory.push({ request, response, timestamp: Date.now() });
			return response;
		}

		// Check authentication if protected
		if (route.protected && this.config?.apiKey) {
			const authHeader = request.headers["authorization"];
			if (!authHeader || !authHeader.includes(this.config.apiKey)) {
				const response: APIResponse = {
					status: 401,
					body: { error: "Unauthorized" },
				};
				this.requestHistory.push({ request, response, timestamp: Date.now() });
				return response;
			}
		}

		// Call handler
		const response = await route.handler(request);
		this.requestHistory.push({ request, response, timestamp: Date.now() });
		this.emit("request", { request, response });

		return response;
	}

	public getRequestHistory(): Array<{
		request: APIRequest;
		response: APIResponse;
		timestamp: number;
	}> {
		return [...this.requestHistory];
	}

	public clearRequestHistory(): void {
		this.requestHistory = [];
	}

	public getRoutes(): APIRoute[] {
		return Array.from(this.routes.values());
	}
}
