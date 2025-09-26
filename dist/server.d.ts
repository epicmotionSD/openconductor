/**
 * OpenConductor API Server
 *
 * Production-ready REST/WebSocket API server for remote agent communication,
 * real-time orchestration, and distributed AI agent coordination.
 *
 * "The Universal Conductor for Your AI Agents"
 */
/**
 * OpenConductor API Server
 */
export declare class OpenConductorServer {
    private app;
    private server;
    private wss;
    private conductor;
    private logger;
    private config;
    private errorManager;
    private wsHandler;
    private isRunning;
    constructor(config?: any);
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup WebSocket handling
     */
    private setupWebSocket;
    /**
     * Setup error handling
     */
    private setupErrorHandling;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Generate OpenAPI specification
     */
    private generateOpenAPISpec;
    /**
     * Get server info
     */
    getInfo(): any;
}
/**
 * Create and start the OpenConductor API Server
 */
export declare function createServer(config?: any): Promise<OpenConductorServer>;
//# sourceMappingURL=server.d.ts.map