/**
 * OpenConductor API Server
 * 
 * Production-ready REST/WebSocket API server for remote agent communication,
 * real-time orchestration, and distributed AI agent coordination.
 * 
 * "The Universal Conductor for Your AI Agents"
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { OpenConductor } from './core/conductor';
import { Logger } from './utils/logger';
import { ConfigManager } from './utils/config-manager';
import { ErrorManager } from './utils/error-manager';

// API Route imports
import { createAgentRoutes } from './api/routes/agents';
import { createWorkflowRoutes } from './api/routes/workflows';
import { createToolRoutes } from './api/routes/tools';
import { createPluginRoutes } from './api/routes/plugins';
import { createEventRoutes } from './api/routes/events';
import { createSystemRoutes } from './api/routes/system';
import { createRegistryRoutes } from './api/routes/registry';

// Middleware imports
import { createAuthMiddleware } from './api/middleware/auth';
import { createValidationMiddleware } from './api/middleware/validation';
import { createLoggingMiddleware } from './api/middleware/logging';
import { createErrorHandler } from './api/middleware/error-handler';

// WebSocket handler import
import { WebSocketHandler } from './api/websocket/handler';

/**
 * OpenConductor API Server
 */
export class OpenConductorServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private conductor: OpenConductor;
  private logger: Logger;
  private config: ConfigManager;
  private errorManager: ErrorManager;
  private wsHandler: WebSocketHandler;
  private isRunning = false;

  constructor(config?: any) {
    // Initialize core services
    this.config = new ConfigManager(config);
    this.logger = new Logger(this.config.get('logging'));
    this.errorManager = new ErrorManager(this.logger);
    this.conductor = new OpenConductor(this.config.getAll());

    // Initialize Express app
    this.app = express();
    this.server = createServer(this.app);

    // Setup middleware and routes first
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();

    // Temporarily disable WebSocket for debugging
    const wsConfig = this.config.get('api.websocket');
    if (false) { // wsConfig.enabled
      this.wss = new WebSocketServer({
        server: this.server,
        path: wsConfig.path
      });

      // Initialize WebSocket handler
      this.wsHandler = new WebSocketHandler(
        this.wss,
        this.conductor,
        this.logger,
        this.errorManager
      );

      this.setupWebSocket();
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.logger.info('Setting up API middleware...');

    // Security middleware
    this.app.use(helmet({
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
      this.app.use(cors({
        origin: corsConfig.origins,
        methods: corsConfig.methods,
        allowedHeaders: corsConfig.allowedHeaders,
        credentials: corsConfig.credentials
      }));
    }

    // Compression
    this.app.use(compression());

    // Rate limiting
    const rateLimitConfig = this.config.get('api.rateLimit');
    if (rateLimitConfig.enabled) {
      const limiter = rateLimit({
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
    this.app.use(express.json({ 
      limit: requestConfig.maxBodySize 
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: requestConfig.maxBodySize 
    }));

    // Request logging
    this.app.use(createLoggingMiddleware(this.logger));

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
        req.apiVersion = version as string;
        next();
      });
    }
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    this.logger.info('Setting up API routes...');

    // Authentication middleware
    const authMiddleware = createAuthMiddleware(
      this.config.get('auth'),
      this.logger,
      this.errorManager
    );

    // Validation middleware
    const validationMiddleware = createValidationMiddleware(
      this.logger,
      this.errorManager
    );

    // Health check (no auth required)
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.conductor.getHealth();
        res.status(health.status === 'healthy' ? 200 : 503).json({
          success: true,
          data: health
        });
      } catch (error) {
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
    const apiRouter = express.Router();
    
    // Apply authentication to all API routes
    apiRouter.use(authMiddleware);
    apiRouter.use(validationMiddleware);

    // Mount route handlers
    apiRouter.use('/agents', createAgentRoutes(this.conductor, this.logger, this.errorManager));
    apiRouter.use('/workflows', createWorkflowRoutes(this.conductor, this.logger, this.errorManager));
    apiRouter.use('/tools', createToolRoutes(this.conductor, this.logger, this.errorManager));
    apiRouter.use('/plugins', createPluginRoutes(this.conductor, this.logger, this.errorManager));
    apiRouter.use('/events', createEventRoutes(this.conductor, this.logger, this.errorManager));
    apiRouter.use('/registry', createRegistryRoutes(this.conductor, this.logger, this.errorManager));
    apiRouter.use('/system', createSystemRoutes(this.conductor, this.logger, this.errorManager));

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
  private setupWebSocket(): void {
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
  private setupErrorHandling(): void {
    this.logger.info('Setting up error handling...');

    // Global error handler
    this.app.use(createErrorHandler(this.logger, this.errorManager));

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
  async start(): Promise<void> {
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
      await new Promise<void>((resolve, reject) => {
        this.server.listen(serverConfig.port, serverConfig.host, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
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

    } catch (error) {
      this.logger.error('Failed to start OpenConductor API Server:', error);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.logger.info('Stopping OpenConductor API Server...');

      // Close WebSocket server
      if (this.wss) {
        this.wss.close();
        if (this.wsHandler) {
          await this.wsHandler.shutdown();
        }
      }

      // Close HTTP server
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          resolve();
        });
      });

      // Stop OpenConductor
      await this.conductor.stop();

      this.isRunning = false;
      this.logger.info('OpenConductor API Server stopped successfully');

    } catch (error) {
      this.logger.error('Error stopping OpenConductor API Server:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.stop();
      await this.conductor.shutdown();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Generate OpenAPI specification
   */
  private generateOpenAPISpec(): any {
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
  getInfo(): any {
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

/**
 * Create and start the OpenConductor API Server
 */
export async function createServer(config?: any): Promise<OpenConductorServer> {
  const server = new OpenConductorServer(config);
  await server.start();
  return server;
}

// Start server if this file is run directly
if (require.main === module) {
  createServer()
    .then((server) => {
      console.log('OpenConductor API Server started successfully');
    })
    .catch((error) => {
      console.error('Failed to start OpenConductor API Server:', error);
      process.exit(1);
    });
}