/**
 * OpenConductor MCP Integration Module
 * 
 * Central integration point for all MCP functionality.
 * Coordinates MCP server registry, workflows, and UI components.
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { MCPDatabaseSetup, createMCPDatabaseSetup } from './database-setup';
import { MCPServerRegistry, createMCPServerRegistry } from './server-registry';
import { 
  MCPSemanticSearchEngine, 
  OpenAIEmbeddingProvider,
  createSemanticSearchEngine 
} from './semantic-search-engine';

export interface MCPIntegrationConfig {
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
  openai?: {
    apiKey: string;
    model?: string;
  };
  features: {
    semanticSearch: boolean;
    communityFeatures: boolean;
    analytics: boolean;
    billing: boolean;
  };
}

/**
 * MCP Integration Manager
 * 
 * Orchestrates all MCP functionality and provides unified access
 */
export class MCPIntegration {
  private config: MCPIntegrationConfig;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private pool: Pool;

  // MCP components
  private databaseSetup: MCPDatabaseSetup;
  private serverRegistry: MCPServerRegistry;
  private semanticSearch: MCPSemanticSearchEngine | null = null;

  // State
  private isInitialized = false;
  private isStarted = false;

  constructor(
    config: MCPIntegrationConfig,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.config = config;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;

    // Initialize database connection
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.username,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Initialize MCP components
    this.databaseSetup = createMCPDatabaseSetup(config.database, logger);
    this.serverRegistry = createMCPServerRegistry(this.pool, logger, errorManager, eventBus);

    // Initialize semantic search if OpenAI key provided
    if (config.openai?.apiKey && config.features.semanticSearch) {
      const embeddingProvider = new OpenAIEmbeddingProvider(
        config.openai.apiKey,
        logger,
        config.openai.model
      );
      this.semanticSearch = createSemanticSearchEngine(
        this.pool,
        logger,
        errorManager,
        embeddingProvider
      );
    }

    this.logger.info('MCP Integration initialized', {
      features: config.features,
      semanticSearchEnabled: !!this.semanticSearch
    });
  }

  /**
   * Initialize MCP integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('MCP Integration already initialized');
      return;
    }

    this.logger.info('Initializing MCP Integration...');

    try {
      // Initialize database
      await this.databaseSetup.initialize();

      // Set up event listeners
      this.setupEventListeners();

      // Verify all components are healthy
      await this.verifyHealth();

      this.isInitialized = true;

      // Emit initialization event
      await this.eventBus.emit({
        type: 'mcp.integration.initialized',
        timestamp: new Date(),
        data: {
          features: this.config.features,
          semanticSearchEnabled: !!this.semanticSearch
        }
      });

      this.logger.info('MCP Integration initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP Integration:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'mcp-initialization'
      });
    }
  }

  /**
   * Start MCP integration services
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isStarted) {
      this.logger.warn('MCP Integration already started');
      return;
    }

    this.logger.info('Starting MCP Integration services...');

    try {
      // Start batch embedding processing if semantic search enabled
      if (this.semanticSearch) {
        this.startEmbeddingProcessor();
      }

      this.isStarted = true;

      // Emit start event
      await this.eventBus.emit({
        type: 'mcp.integration.started',
        timestamp: new Date(),
        data: {
          startedAt: new Date()
        }
      });

      this.logger.info('MCP Integration started successfully');
    } catch (error) {
      this.logger.error('Failed to start MCP Integration:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'mcp-startup'
      });
    }
  }

  /**
   * Stop MCP integration services
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.logger.info('Stopping MCP Integration...');

    try {
      // Close database connections
      await this.pool.end();
      await this.databaseSetup.close();

      this.isStarted = false;

      // Emit stop event
      await this.eventBus.emit({
        type: 'mcp.integration.stopped',
        timestamp: new Date(),
        data: {
          stoppedAt: new Date()
        }
      });

      this.logger.info('MCP Integration stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop MCP Integration:', error);
      throw error;
    }
  }

  /**
   * Get MCP integration health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      database: any;
      serverRegistry: any;
      semanticSearch: any;
    };
    metrics: {
      totalServers: number;
      totalWorkflows: number;
      totalExecutions: number;
    };
  }> {
    try {
      const [dbHealth, registryHealth] = await Promise.all([
        this.databaseSetup.getHealthStatus(),
        this.serverRegistry.getHealthStatus()
      ]);

      let searchHealth = null;
      if (this.semanticSearch) {
        searchHealth = await this.semanticSearch.getSearchAnalytics();
      }

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (!dbHealth.connected || registryHealth.status === 'unhealthy') {
        status = 'unhealthy';
      } else if (!dbHealth.vectorSupport || registryHealth.status === 'degraded') {
        status = 'degraded';
      }

      return {
        status,
        components: {
          database: dbHealth,
          serverRegistry: registryHealth,
          semanticSearch: searchHealth
        },
        metrics: {
          totalServers: registryHealth.metrics.total_servers,
          totalWorkflows: 0, // TODO: Implement workflow counting
          totalExecutions: 0  // TODO: Implement execution counting
        }
      };
    } catch (error) {
      this.logger.error('Failed to get MCP health status:', error);
      return {
        status: 'unhealthy',
        components: {
          database: { connected: false },
          serverRegistry: { status: 'unhealthy' },
          semanticSearch: null
        },
        metrics: {
          totalServers: 0,
          totalWorkflows: 0,
          totalExecutions: 0
        }
      };
    }
  }

  /**
   * Setup event listeners for MCP events
   */
  private setupEventListeners(): void {
    // Listen for server events
    this.eventBus.on('mcp.server.created', async (event: any) => {
      this.logger.info('MCP server created', event.data);
      
      // Update embeddings for new server if semantic search enabled
      if (this.semanticSearch && event.data.description) {
        try {
          await this.semanticSearch.updateServerEmbeddings(
            event.data.serverId,
            event.data.description,
            event.data.useCases
          );
        } catch (error) {
          this.logger.error('Failed to update embeddings for new server:', error);
        }
      }
    });

    // Listen for workflow events
    this.eventBus.on('mcp.workflow.created', (event: any) => {
      this.logger.info('MCP workflow created', event.data);
    });

    this.eventBus.on('mcp.workflow.execution.started', (event: any) => {
      this.logger.info('MCP workflow execution started', event.data);
    });

    // Listen for system events
    this.eventBus.on('system.maintenance.enabled', () => {
      this.logger.info('System maintenance mode enabled - pausing MCP operations');
    });
  }

  /**
   * Start background embedding processor
   */
  private startEmbeddingProcessor(): void {
    if (!this.semanticSearch) return;

    // Process embeddings every 5 minutes
    setInterval(async () => {
      try {
        const processed = await this.semanticSearch!.batchUpdateEmbeddings(20);
        if (processed > 0) {
          this.logger.info(`Processed ${processed} server embeddings`);
        }
      } catch (error) {
        this.logger.error('Failed to process embeddings batch:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.logger.info('Embedding processor started');
  }

  /**
   * Verify all components are healthy
   */
  private async verifyHealth(): Promise<void> {
    const health = await this.getHealthStatus();
    
    if (health.status === 'unhealthy') {
      throw new Error('MCP Integration health check failed');
    }

    if (health.status === 'degraded') {
      this.logger.warn('MCP Integration running in degraded mode', health.components);
    }
  }

  // Getters for component access

  get database(): Pool {
    return this.pool;
  }

  get servers(): MCPServerRegistry {
    return this.serverRegistry;
  }

  get search(): MCPSemanticSearchEngine | null {
    return this.semanticSearch;
  }

  get isReady(): boolean {
    return this.isInitialized && this.isStarted;
  }

  get features(): typeof this.config.features {
    return this.config.features;
  }
}

/**
 * Factory function to create MCP integration instance
 */
export function createMCPIntegration(
  config: MCPIntegrationConfig,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): MCPIntegration {
  return new MCPIntegration(config, logger, errorManager, eventBus);
}

/**
 * MCP Integration Plugin for OpenConductor Core
 */
export class MCPIntegrationPlugin {
  private mcpIntegration: MCPIntegration;

  constructor(mcpIntegration: MCPIntegration) {
    this.mcpIntegration = mcpIntegration;
  }

  /**
   * Plugin lifecycle methods
   */
  async onLoad(): Promise<void> {
    await this.mcpIntegration.initialize();
  }

  async onStart(): Promise<void> {
    await this.mcpIntegration.start();
  }

  async onStop(): Promise<void> {
    await this.mcpIntegration.stop();
  }

  /**
   * Plugin API methods
   */
  getAPI() {
    return {
      servers: this.mcpIntegration.servers,
      search: this.mcpIntegration.search,
      health: () => this.mcpIntegration.getHealthStatus(),
      features: this.mcpIntegration.features
    };
  }

  getHealthStatus() {
    return this.mcpIntegration.getHealthStatus();
  }
}