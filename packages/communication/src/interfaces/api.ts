/**
 * REST API Server interface
 */

export interface APIConfig {
	/** Server port */
	port: number;
	/** Host address */
	host?: string;
	/** Enable CORS */
	cors?: boolean;
	/** API key for authentication */
	apiKey?: string;
	/** Rate limiting */
	rateLimit?: {
		windowMs: number;
		max: number;
	};
	/** Additional options */
	options?: Record<string, unknown>;
}

export interface APIRoute {
	/** HTTP method */
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	/** Route path */
	path: string;
	/** Route handler */
	handler: (req: APIRequest) => Promise<APIResponse> | APIResponse;
	/** Require authentication */
	protected?: boolean;
}

export interface APIRequest {
	/** Request method */
	method: string;
	/** Request path */
	path: string;
	/** Query parameters */
	query: Record<string, string>;
	/** Request body */
	body?: any;
	/** Request headers */
	headers: Record<string, string>;
	/** Route parameters */
	params: Record<string, string>;
}

export interface APIResponse {
	/** HTTP status code */
	status: number;
	/** Response body */
	body?: any;
	/** Response headers */
	headers?: Record<string, string>;
}

export interface APIServer {
	/**
	 * Initialize and start the API server
	 */
	start(config: APIConfig): Promise<void>;

	/**
	 * Register a route
	 * @param route - Route configuration
	 */
	registerRoute(route: APIRoute): void;

	/**
	 * Register multiple routes
	 * @param routes - Array of routes
	 */
	registerRoutes(routes: APIRoute[]): void;

	/**
	 * Remove a route
	 * @param method - HTTP method
	 * @param path - Route path
	 */
	removeRoute(method: string, path: string): void;

	/**
	 * Get server info
	 */
	getInfo(): {
		port: number;
		host: string;
		running: boolean;
		routes: number;
	};

	/**
	 * Check if server is running
	 */
	isRunning(): boolean;

	/**
	 * Stop the server
	 */
	stop(): Promise<void>;
}
