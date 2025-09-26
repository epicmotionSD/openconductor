"use strict";
/**
 * OpenConductor API Server
 *
 * Production-ready REST/WebSocket API server for remote agent communication,
 * real-time orchestration, and distributed AI agent coordination.
 *
 * "The Universal Conductor for Your AI Agents"
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenConductorServer = void 0;
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const ws_1 = require("ws");
const conductor_1 = require("./core/conductor");
const logger_1 = require("./utils/logger");
const config_manager_1 = require("./utils/config-manager");
const error_manager_1 = require("./utils/error-manager");
// API Route imports
const agents_1 = require("./api/routes/agents");
const workflows_1 = require("./api/routes/workflows");
const tools_1 = require("./api/routes/tools");
const plugins_1 = require("./api/routes/plugins");
const events_1 = require("./api/routes/events");
const system_1 = require("./api/routes/system");
const registry_1 = require("./api/routes/registry");
// Middleware imports
const auth_1 = require("./api/middleware/auth");
const validation_1 = require("./api/middleware/validation");
const logging_1 = require("./api/middleware/logging");
const error_handler_1 = require("./api/middleware/error-handler");
// WebSocket handler import
const handler_1 = require("./api/websocket/handler");
/**
 * OpenConductor API Server
 */
class OpenConductorServer {
    app;
    server;
    wss;
    conductor;
    logger;
    config;
    errorManager;
    wsHandler;
    isRunning = false;
    constructor(config) {
        // Initialize core services
        this.config = new config_manager_1.ConfigManager(config);
        this.logger = new logger_1.Logger(this.config.get('logging'));
        this.errorManager = new error_manager_1.ErrorManager(this.logger);
        this.conductor = new conductor_1.OpenConductor(this.config.getAll());
        // Initialize Express app
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        // Initialize WebSocket server
        this.wss = new ws_1.WebSocketServer({
            server: this.server,
            path: this.config.get('api.websocket.path', '/ws')
        });
        // Initialize WebSocket handler
        this.wsHandler = new handler_1.WebSocketHandler(this.wss, this.conductor, this.logger, this.errorManager);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupErrorHandling();
    }
    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.logger.info('Setting up API middleware...');
        // Security middleware
        this.app.use((0, helmet_1.default)({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            }
        }));
        // CORS configuration
        const corsConfig = this.config.get('api.server.cors');
        if (corsConfig.enabled) {
            this.app.use((0, cors_1.default)({
                origin: corsConfig.origins,
                methods: corsConfig.methods,
                allowedHeaders: corsConfig.allowedHeaders,
                credentials: corsConfig.credentials
            }));
        }
        // Compression
        this.app.use((0, compression_1.default)());
        // Rate limiting
        const rateLimitConfig = this.config.get('api.rateLimit');
        if (rateLimitConfig.enabled) {
            const limiter = (0, express_rate_limit_1.default)({
                windowMs: rateLimitConfig.windowMs,
                max: rateLimitConfig.maxRequests,
                skipSuccessfulRequests: rateLimitConfig.skipSuccessfulRequests,
                standardHeaders: true,
                legacyHeaders: false,
                message: {
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests from this IP'
                    }
                }
            });
            this.app.use('/api', limiter);
        }
        // Request parsing
        const requestConfig = this.config.get('api.request');
        this.app.use(express_1.default.json({
            limit: requestConfig.maxBodySize
        }));
        this.app.use(express_1.default.urlencoded({
            extended: true,
            limit: requestConfig.maxBodySize
        }));
        // Request logging
        this.app.use((0, logging_1.createLoggingMiddleware)(this.logger));
        // Request timeout
        this.app.use((req, res, next) => {
            req.setTimeout(requestConfig.timeout);
            next();
        });
        // API versioning
        const versionConfig = this.config.get('api.versioning');
        if (versionConfig.enabled) {
            this.app.use('/api', (req, res, next) => {
                const version = req.headers[versionConfig.headerName.toLowerCase()] ||
                    req.query.version ||
                    versionConfig.defaultVersion;
                req.apiVersion = version;
                next();
            });
        }
    }
    /**
     * Setup API routes
     */
    setupRoutes() {
        this.logger.info('Setting up API routes...');
        // Authentication middleware
        const authMiddleware = (0, auth_1.createAuthMiddleware)(this.config.get('auth'), this.logger, this.errorManager);
        // Validation middleware
        const validationMiddleware = (0, validation_1.createValidationMiddleware)(this.logger, this.errorManager);
        // Health check (no auth required)
        this.app.get('/health', async (req, res) => {
            try {
                const health = await this.conductor.getHealth();
                res.status(health.status === 'healthy' ? 200 : 503).json({
                    success: true,
                    data: health
                });
            }
            catch (error) {
                res.status(503).json({
                    success: false,
                    error: {
                        code: 'HEALTH_CHECK_FAILED',
                        message: 'Health check failed'
                    }
                });
            }
        });
        // API documentation (no auth required if enabled)
        const docsConfig = this.config.get('api.docs');
        if (docsConfig.enabled) {
            this.app.get(docsConfig.path, (req, res) => {
                res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${docsConfig.title}</title>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui.css" />
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-bundle.js"></script>
              <script>
                SwaggerUIBundle({
                  url: '/api/v1/openapi.json',
                  dom_id: '#swagger-ui',
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.presets.standalone
                  ]
                });
              </script>
            </body>
          </html>
        `);
            });
        }
        // API v1 routes
        const apiRouter = express_1.default.Router();
        // Apply authentication to all API routes
        apiRouter.use(authMiddleware);
        apiRouter.use(validationMiddleware);
        // Mount route handlers
        apiRouter.use('/agents', (0, agents_1.createAgentRoutes)(this.conductor, this.logger, this.errorManager));
        apiRouter.use('/workflows', (0, workflows_1.createWorkflowRoutes)(this.conductor, this.logger, this.errorManager));
        apiRouter.use('/tools', (0, tools_1.createToolRoutes)(this.conductor, this.logger, this.errorManager));
        apiRouter.use('/plugins', (0, plugins_1.createPluginRoutes)(this.conductor, this.logger, this.errorManager));
        apiRouter.use('/events', (0, events_1.createEventRoutes)(this.conductor, this.logger, this.errorManager));
        apiRouter.use('/registry', (0, registry_1.createRegistryRoutes)(this.conductor, this.logger, this.errorManager));
        apiRouter.use('/system', (0, system_1.createSystemRoutes)(this.conductor, this.logger, this.errorManager));
        // Mount API router
        this.app.use('/api/v1', apiRouter);
        // OpenAPI specification endpoint
        apiRouter.get('/openapi.json', (req, res) => {
            res.json(this.generateOpenAPISpec());
        });
        // 404 handler for API routes
        this.app.all('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ENDPOINT_NOT_FOUND',
                    message: `Endpoint ${req.method} ${req.path} not found`
                }
            });
        });
    }
    /**
     * Setup WebSocket handling
     */
    setupWebSocket() {
        this.logger.info('Setting up WebSocket server...');
        const wsConfig = this.config.get('api.websocket');
        if (!wsConfig.enabled) {
            this.logger.info('WebSocket server disabled');
            return;
        }
        // Initialize WebSocket handler
        this.wsHandler.initialize();
        this.logger.info(`WebSocket server configured on path: ${wsConfig.path}`);
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        this.logger.info('Setting up error handling...');
        // Global error handler
        this.app.use((0, error_handler_1.createErrorHandler)(this.logger, this.errorManager));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught exception:', error);
            this.errorManager.handleError(error);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            this.errorManager.handleError(new Error(`Unhandled rejection: ${reason}`));
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            this.logger.info('SIGTERM received, shutting down gracefully...');
            this.shutdown();
        });
        process.on('SIGINT', () => {
            this.logger.info('SIGINT received, shutting down gracefully...');
            this.shutdown();
        });
    }
    /**
     * Start the server
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Server is already running');
        }
        try {
            this.logger.info('Starting OpenConductor API Server...');
            // Initialize OpenConductor
            await this.conductor.initialize();
            await this.conductor.start();
            // Start HTTP server
            const serverConfig = this.config.get('api.server');
            await new Promise((resolve, reject) => {
                this.server.listen(serverConfig.port, serverConfig.host, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
            this.isRunning = true;
            this.logger.info(`OpenConductor API Server started successfully`);
            this.logger.info(`HTTP Server: http://${serverConfig.host}:${serverConfig.port}`);
            this.logger.info(`WebSocket Server: ws://${serverConfig.host}:${serverConfig.port}${this.config.get('api.websocket.path')}`);
            const docsConfig = this.config.get('api.docs');
            if (docsConfig.enabled) {
                this.logger.info(`API Documentation: http://${serverConfig.host}:${serverConfig.port}${docsConfig.path}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to start OpenConductor API Server:', error);
            throw error;
        }
    }
    /**
     * Stop the server
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        try {
            this.logger.info('Stopping OpenConductor API Server...');
            // Close WebSocket server
            if (this.wss) {
                this.wss.close();
                await this.wsHandler.shutdown();
            }
            // Close HTTP server
            await new Promise((resolve) => {
                this.server.close(() => {
                    resolve();
                });
            });
            // Stop OpenConductor
            await this.conductor.stop();
            this.isRunning = false;
            this.logger.info('OpenConductor API Server stopped successfully');
        }
        catch (error) {
            this.logger.error('Error stopping OpenConductor API Server:', error);
            throw error;
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        try {
            await this.stop();
            await this.conductor.shutdown();
            process.exit(0);
        }
        catch (error) {
            this.logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
    /**
     * Generate OpenAPI specification
     */
    generateOpenAPISpec() {
        const docsConfig = this.config.get('api.docs');
        const serverConfig = this.config.get('api.server');
        return {
            openapi: '3.0.3',
            info: {
                title: docsConfig.title,
                version: docsConfig.version,
                description: 'OpenConductor API - The Universal Conductor for Your AI Agents',
                contact: {
                    name: 'OpenConductor Team',
                    email: 'hello@openconductor.ai',
                    url: 'https://openconductor.ai'
                }
            },
            servers: [
                {
                    url: `http://${serverConfig.host}:${serverConfig.port}/api/v1`,
                    description: 'Development server'
                }
            ],
            paths: {
            // Will be populated by route handlers
            },
            components: {
                securitySchemes: {
                    ApiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'X-API-Key'
                    },
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer'
                    }
                }
            },
            security: [
                { ApiKeyAuth: [] },
                { BearerAuth: [] }
            ]
        };
    }
    /**
     * Get server info
     */
    getInfo() {
        return {
            isRunning: this.isRunning,
            config: this.config.getAll(),
            conductor: {
                version: this.conductor.version,
                instanceId: this.conductor.instanceId,
                uptime: this.conductor.uptime,
                isHealthy: this.conductor.isHealthy
            }
        };
    }
}
exports.OpenConductorServer = OpenConductorServer;
/**
 * Create and start the OpenConductor API Server
 */
async function createServer(config) {
    const server = new OpenConductorServer(config);
    await server.start();
    return server;
}
// Start server if this file is run directly
if (require.main === module) {
    (0, http_1.createServer)()
        .then((server) => {
        console.log('OpenConductor API Server started successfully');
    })
        .catch((error) => {
        console.error('Failed to start OpenConductor API Server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map