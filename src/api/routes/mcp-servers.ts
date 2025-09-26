/**
 * OpenConductor MCP Server Registry API Routes
 * 
 * REST endpoints for MCP server management - discovery, installation, community features
 * Following the established OpenConductor API patterns
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
import { EventBus } from '../../types/events';
import { 
  asyncHandler, 
  NotFoundError, 
  ConflictError,
  ValidationError,
  UnauthorizedError
} from '../middleware/error-handler';
import { APIResponse } from '../../types/api';
import { 
  MCPServerRegistry,
  MCPServer,
  ServerSearchQuery,
  createMCPServerRegistry 
} from '../../mcp/server-registry';
import { 
  MCPSemanticSearchEngine,
  OpenAIEmbeddingProvider,
  SemanticSearchQuery,
  createSemanticSearchEngine 
} from '../../mcp/semantic-search-engine';

/**
 * Create MCP server management routes
 */
export function createMCPServerRoutes(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): Router {
  const router = Router();
  
  // Initialize MCP services
  const serverRegistry = createMCPServerRegistry(pool, logger, errorManager, eventBus);
  
  // Initialize semantic search if OpenAI API key is available
  let semanticSearch: MCPSemanticSearchEngine | null = null;
  if (process.env.OPENAI_API_KEY) {
    const embeddingProvider = new OpenAIEmbeddingProvider(
      process.env.OPENAI_API_KEY,
      logger
    );
    semanticSearch = createSemanticSearchEngine(pool, logger, errorManager, embeddingProvider);
  }

  /**
   * GET /mcp/servers - List and search MCP servers
   */
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'popularity', 
      order = 'desc',
      search,
      semantic_search,
      categories,
      tags,
      use_cases,
      performance_tier,
      is_featured,
      is_verified,
      is_official,
      min_rating,
      use_semantic = 'false'
    } = req.query;

    logger.debug('Listing/searching MCP servers', {
      page, limit, search, semantic_search, categories, tags,
      userId: req.user?.id
    });

    try {
      const searchQuery: SemanticSearchQuery = {
        query: search as string,
        semantic_query: semantic_search as string,
        use_semantic_search: use_semantic === 'true' && !!semanticSearch,
        categories: categories ? (categories as string).split(',') : undefined,
        tags: tags ? (tags as string).split(',') : undefined,
        use_cases: use_cases ? (use_cases as string).split(',') : undefined,
        performance_tier: performance_tier ? (performance_tier as string).split(',') : undefined,
        is_featured: is_featured ? is_featured === 'true' : undefined,
        is_verified: is_verified ? is_verified === 'true' : undefined,
        is_official: is_official ? is_official === 'true' : undefined,
        min_rating: min_rating ? parseFloat(min_rating as string) : undefined,
        sort_by: sort as any,
        sort_order: order as 'asc' | 'desc',
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        recommendation_context: req.user ? {
          user_id: req.user.id,
          skill_level: req.user.skill_level || 'intermediate'
        } : undefined
      };

      let result;
      if (searchQuery.use_semantic_search && semanticSearch) {
        result = await semanticSearch.semanticSearch(searchQuery);
      } else {
        result = await serverRegistry.searchServers(searchQuery);
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const totalPages = Math.ceil(result.total_count / limitNum);

      const response: APIResponse<any> = {
        success: true,
        data: {
          servers: result.servers,
          facets: result.facets,
          semantic_matches: (result as any).semantic_matches || [],
          recommendations: (result as any).recommendations || []
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId,
          executionTime: result.query_info.execution_time_ms
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total_count,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrevious: pageNum > 1
        }
      };

      logger.info('MCP servers retrieved successfully', {
        count: result.servers.length,
        total: result.total_count,
        semanticSearch: searchQuery.use_semantic_search,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to list MCP servers:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/servers/:id - Get specific MCP server
   */
  router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { include_tools = 'false', include_similar = 'false' } = req.query;
    
    logger.debug('Getting MCP server', { 
      serverId: id, 
      includeTools: include_tools,
      includeSimilar: include_similar,
      userId: req.user?.id 
    });

    try {
      const server = await serverRegistry.getServer(id, include_tools === 'true');
      
      if (!server) {
        throw new NotFoundError('MCP Server', id);
      }

      let similarServers = [];
      if (include_similar === 'true' && semanticSearch) {
        similarServers = await semanticSearch.getSimilarServers(id, 5);
      }

      const response: APIResponse<any> = {
        success: true,
        data: {
          server,
          similar_servers: similarServers
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      // Track server view interaction
      if (req.user?.id) {
        await trackInteraction(pool, req.user.id, id, 'view', 'server');
      }

      logger.info('MCP server retrieved successfully', {
        serverId: id,
        serverName: server.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get MCP server:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/servers - Create new MCP server
   */
  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const serverData = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('Authentication required to create servers');
    }

    logger.debug('Creating MCP server', { 
      serverName: serverData.name,
      userId 
    });

    try {
      // Validate required fields
      if (!serverData.name || !serverData.display_name || !serverData.transport_type) {
        throw new ValidationError('Missing required fields: name, display_name, transport_type');
      }

      const server = await serverRegistry.createServer(serverData, userId);

      // Update embeddings for semantic search
      if (semanticSearch && serverData.description) {
        await semanticSearch.updateServerEmbeddings(
          server.id,
          serverData.description,
          serverData.use_cases
        );
      }

      const response: APIResponse<MCPServer> = {
        success: true,
        data: server,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP server created successfully', {
        serverId: server.id,
        serverName: server.name,
        userId
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create MCP server:', error);
      
      if (error.message?.includes('already exists')) {
        throw new ConflictError(`Server with name '${serverData.name}' already exists`);
      }
      
      throw error;
    }
  }));

  /**
   * PUT /mcp/servers/:id - Update MCP server
   */
  router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.id;
    
    logger.debug('Updating MCP server', { 
      serverId: id, 
      updates, 
      userId 
    });

    try {
      const server = await serverRegistry.updateServer(id, updates, userId);

      // Update embeddings if description or use_cases changed
      if (semanticSearch && (updates.description || updates.use_cases)) {
        await semanticSearch.updateServerEmbeddings(
          id,
          updates.description,
          updates.use_cases
        );
      }

      const response: APIResponse<MCPServer> = {
        success: true,
        data: server,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP server updated successfully', {
        serverId: id,
        serverName: server.name,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to update MCP server:', error);
      throw error;
    }
  }));

  /**
   * DELETE /mcp/servers/:id - Delete MCP server
   */
  router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    logger.debug('Deleting MCP server', { serverId: id, userId });

    try {
      await serverRegistry.deleteServer(id, userId);

      const response: APIResponse<void> = {
        success: true,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP server deleted successfully', {
        serverId: id,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to delete MCP server:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/servers/:id/install - Install MCP server for user
   */
  router.post('/:id/install', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { installation_method = 'npm', configuration } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    logger.debug('Installing MCP server', { 
      serverId: id, 
      method: installation_method,
      userId 
    });

    try {
      const server = await serverRegistry.getServer(id);
      if (!server) {
        throw new NotFoundError('MCP Server', id);
      }

      // Record installation
      await pool.query(`
        INSERT INTO user_interactions (
          user_id, resource_id, resource_type, interaction_type, 
          outcome, metadata
        ) VALUES ($1, $2, 'server', 'install', 'success', $3)
        ON CONFLICT (user_id, resource_id, resource_type, interaction_type) 
        DO UPDATE SET metadata = $3, timestamp = NOW()
      `, [
        userId,
        id,
        JSON.stringify({ 
          installation_method,
          configuration: configuration || {},
          server_name: server.name
        })
      ]);

      // Update server download count
      await pool.query(
        'UPDATE mcp_servers SET download_count = download_count + 1 WHERE id = $1',
        [id]
      );

      const response: APIResponse<any> = {
        success: true,
        data: {
          server_id: id,
          installation_method,
          status: 'installed',
          installed_at: new Date(),
          configuration: configuration || {}
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP server installed successfully', {
        serverId: id,
        serverName: server.name,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to install MCP server:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/servers/:id/star - Star/unstar MCP server
   */
  router.post('/:id/star', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { starred = true } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    logger.debug('Starring/unstarring MCP server', { 
      serverId: id, 
      starred,
      userId 
    });

    try {
      if (starred) {
        await pool.query(`
          INSERT INTO server_stars (user_id, server_id) 
          VALUES ($1, $2) 
          ON CONFLICT (user_id, server_id) DO NOTHING
        `, [userId, id]);
      } else {
        await pool.query(
          'DELETE FROM server_stars WHERE user_id = $1 AND server_id = $2',
          [userId, id]
        );
      }

      // Get updated star count
      const result = await pool.query(
        'SELECT star_count FROM mcp_servers WHERE id = $1',
        [id]
      );

      const starCount = result.rows[0]?.star_count || 0;

      const response: APIResponse<any> = {
        success: true,
        data: {
          server_id: id,
          starred,
          star_count: starCount
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP server star updated successfully', {
        serverId: id,
        starred,
        starCount,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to update server star:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/servers/:id/rate - Rate MCP server
   */
  router.post('/:id/rate', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rating, review_title, review_text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    logger.debug('Rating MCP server', { 
      serverId: id, 
      rating,
      hasReview: !!review_text,
      userId 
    });

    try {
      await pool.query(`
        INSERT INTO server_ratings (
          user_id, server_id, rating, review_title, review_text
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, server_id) 
        DO UPDATE SET 
          rating = $3, 
          review_title = $4, 
          review_text = $5,
          updated_at = NOW()
      `, [userId, id, rating, review_title, review_text]);

      // Update server rating average
      const avgResult = await pool.query(`
        UPDATE mcp_servers 
        SET 
          rating_average = (
            SELECT AVG(rating)::NUMERIC(3,2) 
            FROM server_ratings 
            WHERE server_id = $1
          ),
          rating_count = (
            SELECT COUNT(*) 
            FROM server_ratings 
            WHERE server_id = $1
          )
        WHERE id = $1
        RETURNING rating_average, rating_count
      `, [id]);

      const { rating_average, rating_count } = avgResult.rows[0];

      const response: APIResponse<any> = {
        success: true,
        data: {
          server_id: id,
          user_rating: rating,
          server_rating_average: parseFloat(rating_average),
          server_rating_count: parseInt(rating_count)
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP server rated successfully', {
        serverId: id,
        rating,
        avgRating: rating_average,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to rate MCP server:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/servers/:id/tools - Get server tools
   */
  router.get('/:id/tools', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Getting MCP server tools', { serverId: id });

    try {
      const tools = await serverRegistry.getServerTools(id);

      const response: APIResponse<any> = {
        success: true,
        data: {
          server_id: id,
          tools,
          tool_count: tools.length
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get server tools:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/servers/:id/tools - Add tool to server
   */
  router.post('/:id/tools', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const toolData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    logger.debug('Adding tool to MCP server', { 
      serverId: id, 
      toolName: toolData.name,
      userId 
    });

    try {
      // Verify user owns the server
      const server = await serverRegistry.getServer(id);
      if (!server) {
        throw new NotFoundError('MCP Server', id);
      }

      if (server.author_id !== userId) {
        throw new UnauthorizedError('Not authorized to modify this server');
      }

      const tool = await serverRegistry.addTool(id, toolData);

      const response: APIResponse<any> = {
        success: true,
        data: tool,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Tool added to MCP server successfully', {
        serverId: id,
        toolId: tool.id,
        toolName: tool.name,
        userId
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to add tool to server:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/servers/analytics - Get registry analytics
   */
  router.get('/analytics/overview', asyncHandler(async (req: Request, res: Response) => {
    logger.debug('Getting MCP registry analytics');

    try {
      const healthStatus = await serverRegistry.getHealthStatus();
      
      let searchAnalytics = null;
      if (semanticSearch) {
        searchAnalytics = await semanticSearch.getSearchAnalytics();
      }

      const response: APIResponse<any> = {
        success: true,
        data: {
          registry_health: healthStatus,
          search_analytics: searchAnalytics
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get registry analytics:', error);
      throw error;
    }
  }));

  return router;
}

/**
 * Helper function to track user interactions
 */
async function trackInteraction(
  pool: Pool,
  userId: string,
  resourceId: string,
  interactionType: string,
  resourceType: string,
  outcome: string = 'success'
): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO user_interactions (
        user_id, resource_id, resource_type, interaction_type, outcome
      ) VALUES ($1, $2, $3, $4, $5)
    `, [userId, resourceId, resourceType, interactionType, outcome]);
  } catch (error) {
    // Log but don't fail the main operation
    console.error('Failed to track interaction:', error);
  }
}

/**
 * Generate unique server ID
 */
function generateServerId(): string {
  return `mcp_server_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}