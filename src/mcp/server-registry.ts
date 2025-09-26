/**
 * OpenConductor MCP Server Registry
 * 
 * Core module for managing MCP servers - the "npm for MCP servers" functionality.
 * Provides CRUD operations, discovery, installation, and community features.
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  author_id?: string;
  author_name?: string;
  
  // Technical details
  transport_type: 'stdio' | 'http_sse' | 'websocket';
  repository_url?: string;
  documentation_url?: string;
  npm_package?: string;
  docker_image?: string;
  
  // Installation & configuration
  installation_command?: string;
  configuration_schema?: any;
  environment_variables?: Record<string, any>;
  
  // Discovery metadata
  categories: string[];
  tags: string[];
  use_cases: string[];
  
  // AI embeddings for semantic search
  description_embedding?: number[];
  use_case_embedding?: number[];
  
  // Performance & quality metrics
  performance_tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  compatibility_score: number;
  avg_response_time_ms: number;
  success_rate: number;
  
  // Community metrics
  download_count: number;
  star_count: number;
  fork_count: number;
  rating_average: number;
  rating_count: number;
  
  // Version info
  version: string;
  latest_version?: string;
  last_updated?: Date;
  
  // Status & verification
  status: 'pending' | 'active' | 'deprecated' | 'archived';
  is_verified: boolean;
  is_featured: boolean;
  is_official: boolean;
  
  // Analytics
  weekly_downloads: number;
  monthly_active_users: number;
  
  // Enterprise features
  enterprise_tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  sla_tier: string;
  
  // Tools provided by this server
  tool_count?: number;
  tools?: MCPTool[];
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface MCPTool {
  id: string;
  server_id: string;
  name: string;
  display_name?: string;
  description?: string;
  
  // Tool specification
  input_schema?: any;
  output_schema?: any;
  examples?: any[];
  
  // AI embeddings
  description_embedding?: number[];
  
  // Usage analytics
  usage_count: number;
  avg_execution_time_ms: number;
  success_rate: number;
  last_used?: Date;
  
  // Metadata
  category?: string;
  tags: string[];
  
  created_at: Date;
  updated_at: Date;
}

export interface ServerSearchQuery {
  query?: string;
  categories?: string[];
  tags?: string[];
  use_cases?: string[];
  performance_tier?: string[];
  is_featured?: boolean;
  is_verified?: boolean;
  is_official?: boolean;
  min_rating?: number;
  sort_by?: 'relevance' | 'popularity' | 'rating' | 'downloads' | 'updated' | 'created';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ServerSearchResult {
  servers: MCPServer[];
  total_count: number;
  facets: {
    categories: { [key: string]: number };
    tags: { [key: string]: number };
    performance_tiers: { [key: string]: number };
  };
  query_info: {
    query?: string;
    semantic_search_used: boolean;
    execution_time_ms: number;
  };
}

export interface ServerInstallation {
  user_id: string;
  server_id: string;
  installation_method: 'npm' | 'docker' | 'manual';
  configuration?: any;
  status: 'installing' | 'installed' | 'failed' | 'uninstalled';
  installed_at?: Date;
  last_health_check?: Date;
  health_status?: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * MCP Server Registry - Core management class
 */
export class MCPServerRegistry {
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;

  constructor(
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.pool = pool;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
  }

  /**
   * Create a new MCP server entry
   */
  async createServer(server: Partial<MCPServer>, authorId?: string): Promise<MCPServer> {
    this.logger.debug('Creating MCP server', { name: server.name, authorId });

    try {
      // Check if server with same name already exists
      const existingServer = await this.getServerByName(server.name!);
      if (existingServer) {
        throw new Error(`Server with name '${server.name}' already exists`);
      }

      const serverData = {
        ...server,
        id: undefined, // Let database generate UUID
        author_id: authorId,
        status: server.status || 'pending',
        performance_tier: server.performance_tier || 'standard',
        compatibility_score: server.compatibility_score || 0,
        avg_response_time_ms: server.avg_response_time_ms || 0,
        success_rate: server.success_rate || 0,
        download_count: 0,
        star_count: 0,
        fork_count: 0,
        rating_average: 0,
        rating_count: 0,
        weekly_downloads: 0,
        monthly_active_users: 0,
        is_verified: server.is_verified || false,
        is_featured: server.is_featured || false,
        is_official: server.is_official || false,
        enterprise_tier: server.enterprise_tier || 'basic',
        sla_tier: server.sla_tier || 'community'
      };

      const query = `
        INSERT INTO mcp_servers (
          name, display_name, description, author_id, transport_type,
          repository_url, documentation_url, npm_package, docker_image,
          installation_command, configuration_schema, environment_variables,
          categories, tags, use_cases, performance_tier, compatibility_score,
          avg_response_time_ms, success_rate, version, status, is_verified,
          is_featured, is_official, enterprise_tier, sla_tier
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        RETURNING *
      `;

      const values = [
        serverData.name,
        serverData.display_name,
        serverData.description,
        serverData.author_id,
        serverData.transport_type,
        serverData.repository_url,
        serverData.documentation_url,
        serverData.npm_package,
        serverData.docker_image,
        serverData.installation_command,
        serverData.configuration_schema ? JSON.stringify(serverData.configuration_schema) : null,
        serverData.environment_variables ? JSON.stringify(serverData.environment_variables) : null,
        serverData.categories || [],
        serverData.tags || [],
        serverData.use_cases || [],
        serverData.performance_tier,
        serverData.compatibility_score,
        serverData.avg_response_time_ms,
        serverData.success_rate,
        serverData.version,
        serverData.status,
        serverData.is_verified,
        serverData.is_featured,
        serverData.is_official,
        serverData.enterprise_tier,
        serverData.sla_tier
      ];

      const result = await this.pool.query(query, values);
      const createdServer = this.mapServerFromDB(result.rows[0]);

      // Emit server creation event
      await this.eventBus.emit({
        type: 'mcp.server.created',
        timestamp: new Date(),
        data: {
          serverId: createdServer.id,
          name: createdServer.name,
          authorId: authorId
        }
      });

      this.logger.info('MCP server created successfully', {
        serverId: createdServer.id,
        name: createdServer.name
      });

      return createdServer;
    } catch (error) {
      this.logger.error('Failed to create MCP server:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'server-creation',
        serverName: server.name
      });
    }
  }

  /**
   * Get server by ID
   */
  async getServer(serverId: string, includeTools: boolean = false): Promise<MCPServer | null> {
    this.logger.debug('Getting MCP server', { serverId, includeTools });

    try {
      const query = `
        SELECT s.*, u.name as author_name,
               COUNT(t.id) as tool_count
        FROM mcp_servers s
        LEFT JOIN users u ON s.author_id = u.id
        LEFT JOIN mcp_tools t ON s.id = t.server_id
        WHERE s.id = $1
        GROUP BY s.id, u.name
      `;

      const result = await this.pool.query(query, [serverId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const server = this.mapServerFromDB(result.rows[0]);

      if (includeTools) {
        server.tools = await this.getServerTools(serverId);
      }

      return server;
    } catch (error) {
      this.logger.error('Failed to get MCP server:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'server-retrieval',
        serverId
      });
    }
  }

  /**
   * Get server by name
   */
  async getServerByName(name: string): Promise<MCPServer | null> {
    try {
      const query = `
        SELECT s.*, u.name as author_name,
               COUNT(t.id) as tool_count
        FROM mcp_servers s
        LEFT JOIN users u ON s.author_id = u.id
        LEFT JOIN mcp_tools t ON s.id = t.server_id
        WHERE s.name = $1
        GROUP BY s.id, u.name
      `;

      const result = await this.pool.query(query, [name]);
      return result.rows.length > 0 ? this.mapServerFromDB(result.rows[0]) : null;
    } catch (error) {
      this.logger.error('Failed to get server by name:', error);
      throw error;
    }
  }

  /**
   * Update server
   */
  async updateServer(serverId: string, updates: Partial<MCPServer>, authorId?: string): Promise<MCPServer> {
    this.logger.debug('Updating MCP server', { serverId, updates, authorId });

    try {
      const existingServer = await this.getServer(serverId);
      if (!existingServer) {
        throw new Error(`Server not found: ${serverId}`);
      }

      // Check authorization
      if (authorId && existingServer.author_id !== authorId) {
        throw new Error('Unauthorized to update this server');
      }

      // Build dynamic update query
      const fields = [];
      const values = [];
      let paramCount = 1;

      const updateableFields = [
        'display_name', 'description', 'transport_type', 'repository_url',
        'documentation_url', 'npm_package', 'docker_image', 'installation_command',
        'configuration_schema', 'environment_variables', 'categories', 'tags',
        'use_cases', 'performance_tier', 'version', 'status', 'is_featured'
      ];

      for (const field of updateableFields) {
        if (updates.hasOwnProperty(field)) {
          fields.push(`${field} = $${paramCount}`);
          values.push(updates[field as keyof MCPServer]);
          paramCount++;
        }
      }

      if (fields.length === 0) {
        return existingServer; // No updates to apply
      }

      fields.push('updated_at = NOW()');
      values.push(serverId);

      const query = `
        UPDATE mcp_servers 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await this.pool.query(query, values);
      const updatedServer = this.mapServerFromDB(result.rows[0]);

      // Emit update event
      await this.eventBus.emit({
        type: 'mcp.server.updated',
        timestamp: new Date(),
        data: {
          serverId: updatedServer.id,
          name: updatedServer.name,
          updates: Object.keys(updates)
        }
      });

      this.logger.info('MCP server updated successfully', {
        serverId: updatedServer.id,
        name: updatedServer.name
      });

      return updatedServer;
    } catch (error) {
      this.logger.error('Failed to update MCP server:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'server-update',
        serverId
      });
    }
  }

  /**
   * Delete server
   */
  async deleteServer(serverId: string, authorId?: string): Promise<void> {
    this.logger.debug('Deleting MCP server', { serverId, authorId });

    try {
      const server = await this.getServer(serverId);
      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }

      // Check authorization
      if (authorId && server.author_id !== authorId) {
        throw new Error('Unauthorized to delete this server');
      }

      await this.pool.query('DELETE FROM mcp_servers WHERE id = $1', [serverId]);

      // Emit deletion event
      await this.eventBus.emit({
        type: 'mcp.server.deleted',
        timestamp: new Date(),
        data: {
          serverId,
          name: server.name,
          authorId
        }
      });

      this.logger.info('MCP server deleted successfully', {
        serverId,
        name: server.name
      });
    } catch (error) {
      this.logger.error('Failed to delete MCP server:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'server-deletion',
        serverId
      });
    }
  }

  /**
   * Search servers with advanced filtering and semantic search
   */
  async searchServers(searchQuery: ServerSearchQuery): Promise<ServerSearchResult> {
    const startTime = Date.now();
    this.logger.debug('Searching MCP servers', searchQuery);

    try {
      let baseQuery = `
        FROM mcp_servers s
        LEFT JOIN users u ON s.author_id = u.id
        LEFT JOIN mcp_tools t ON s.id = t.server_id
        WHERE s.status = 'active'
      `;
      
      const conditions = [];
      const values = [];
      let paramCount = 1;

      // Text search
      if (searchQuery.query) {
        conditions.push(`(
          s.name ILIKE $${paramCount} OR 
          s.display_name ILIKE $${paramCount} OR 
          s.description ILIKE $${paramCount} OR
          $${paramCount + 1} = ANY(s.tags) OR
          $${paramCount + 1} = ANY(s.categories) OR
          $${paramCount + 1} = ANY(s.use_cases)
        )`);
        values.push(`%${searchQuery.query}%`, searchQuery.query);
        paramCount += 2;
      }

      // Category filter
      if (searchQuery.categories?.length) {
        conditions.push(`s.categories && $${paramCount}`);
        values.push(searchQuery.categories);
        paramCount++;
      }

      // Tags filter
      if (searchQuery.tags?.length) {
        conditions.push(`s.tags && $${paramCount}`);
        values.push(searchQuery.tags);
        paramCount++;
      }

      // Performance tier filter
      if (searchQuery.performance_tier?.length) {
        conditions.push(`s.performance_tier = ANY($${paramCount})`);
        values.push(searchQuery.performance_tier);
        paramCount++;
      }

      // Boolean filters
      if (searchQuery.is_featured !== undefined) {
        conditions.push(`s.is_featured = $${paramCount}`);
        values.push(searchQuery.is_featured);
        paramCount++;
      }

      if (searchQuery.is_verified !== undefined) {
        conditions.push(`s.is_verified = $${paramCount}`);
        values.push(searchQuery.is_verified);
        paramCount++;
      }

      if (searchQuery.is_official !== undefined) {
        conditions.push(`s.is_official = $${paramCount}`);
        values.push(searchQuery.is_official);
        paramCount++;
      }

      // Rating filter
      if (searchQuery.min_rating !== undefined) {
        conditions.push(`s.rating_average >= $${paramCount}`);
        values.push(searchQuery.min_rating);
        paramCount++;
      }

      if (conditions.length > 0) {
        baseQuery += ` AND ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT s.id) as count ${baseQuery}`;
      const countResult = await this.pool.query(countQuery, values);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build main query with sorting
      let orderBy = 'ORDER BY ';
      switch (searchQuery.sort_by) {
        case 'popularity':
          orderBy += 's.download_count DESC, s.star_count DESC';
          break;
        case 'rating':
          orderBy += 's.rating_average DESC, s.rating_count DESC';
          break;
        case 'downloads':
          orderBy += 's.download_count DESC';
          break;
        case 'updated':
          orderBy += 's.updated_at DESC';
          break;
        case 'created':
          orderBy += 's.created_at DESC';
          break;
        default:
          orderBy += 's.is_featured DESC, s.star_count DESC, s.download_count DESC';
      }

      const mainQuery = `
        SELECT s.*, u.name as author_name, 
               COUNT(t.id) as tool_count
        ${baseQuery}
        GROUP BY s.id, u.name
        ${orderBy}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(searchQuery.limit || 20, searchQuery.offset || 0);

      const result = await this.pool.query(mainQuery, values);
      const servers = result.rows.map(row => this.mapServerFromDB(row));

      // Get facets for filtering UI
      const facets = await this.getSearchFacets(baseQuery, values.slice(0, -2));

      const executionTime = Date.now() - startTime;

      this.logger.info('MCP server search completed', {
        query: searchQuery.query,
        totalResults: totalCount,
        executionTime
      });

      return {
        servers,
        total_count: totalCount,
        facets,
        query_info: {
          query: searchQuery.query,
          semantic_search_used: false, // TODO: Implement semantic search
          execution_time_ms: executionTime
        }
      };
    } catch (error) {
      this.logger.error('Failed to search MCP servers:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'server-search',
        query: searchQuery
      });
    }
  }

  /**
   * Get server tools
   */
  async getServerTools(serverId: string): Promise<MCPTool[]> {
    try {
      const query = `
        SELECT * FROM mcp_tools 
        WHERE server_id = $1 
        ORDER BY usage_count DESC, name ASC
      `;
      
      const result = await this.pool.query(query, [serverId]);
      return result.rows.map(row => this.mapToolFromDB(row));
    } catch (error) {
      this.logger.error('Failed to get server tools:', error);
      throw error;
    }
  }

  /**
   * Add tool to server
   */
  async addTool(serverId: string, tool: Partial<MCPTool>): Promise<MCPTool> {
    this.logger.debug('Adding tool to MCP server', { serverId, toolName: tool.name });

    try {
      const query = `
        INSERT INTO mcp_tools (
          server_id, name, display_name, description, input_schema,
          output_schema, examples, category, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        serverId,
        tool.name,
        tool.display_name,
        tool.description,
        tool.input_schema ? JSON.stringify(tool.input_schema) : null,
        tool.output_schema ? JSON.stringify(tool.output_schema) : null,
        tool.examples ? JSON.stringify(tool.examples) : null,
        tool.category,
        tool.tags || []
      ];

      const result = await this.pool.query(query, values);
      return this.mapToolFromDB(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to add tool to server:', error);
      throw error;
    }
  }

  /**
   * Get search facets for filtering UI
   */
  private async getSearchFacets(baseQuery: string, values: any[]): Promise<any> {
    try {
      // Get category facets
      const categoryQuery = `
        SELECT unnest(categories) as category, COUNT(*) as count
        ${baseQuery}
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `;
      const categoryResult = await this.pool.query(categoryQuery, values);
      const categories = Object.fromEntries(
        categoryResult.rows.map(row => [row.category, parseInt(row.count)])
      );

      // Get tag facets  
      const tagQuery = `
        SELECT unnest(tags) as tag, COUNT(*) as count
        ${baseQuery}
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 15
      `;
      const tagResult = await this.pool.query(tagQuery, values);
      const tags = Object.fromEntries(
        tagResult.rows.map(row => [row.tag, parseInt(row.count)])
      );

      // Get performance tier facets
      const tierQuery = `
        SELECT performance_tier, COUNT(*) as count
        ${baseQuery}
        GROUP BY performance_tier
        ORDER BY count DESC
      `;
      const tierResult = await this.pool.query(tierQuery, values);
      const performance_tiers = Object.fromEntries(
        tierResult.rows.map(row => [row.performance_tier, parseInt(row.count)])
      );

      return {
        categories,
        tags,
        performance_tiers
      };
    } catch (error) {
      this.logger.error('Failed to get search facets:', error);
      return { categories: {}, tags: {}, performance_tiers: {} };
    }
  }

  /**
   * Map database row to MCPServer object
   */
  private mapServerFromDB(row: any): MCPServer {
    return {
      id: row.id,
      name: row.name,
      display_name: row.display_name,
      description: row.description,
      author_id: row.author_id,
      author_name: row.author_name,
      transport_type: row.transport_type,
      repository_url: row.repository_url,
      documentation_url: row.documentation_url,
      npm_package: row.npm_package,
      docker_image: row.docker_image,
      installation_command: row.installation_command,
      configuration_schema: row.configuration_schema,
      environment_variables: row.environment_variables,
      categories: row.categories || [],
      tags: row.tags || [],
      use_cases: row.use_cases || [],
      description_embedding: row.description_embedding,
      use_case_embedding: row.use_case_embedding,
      performance_tier: row.performance_tier,
      compatibility_score: parseFloat(row.compatibility_score) || 0,
      avg_response_time_ms: parseInt(row.avg_response_time_ms) || 0,
      success_rate: parseFloat(row.success_rate) || 0,
      download_count: parseInt(row.download_count) || 0,
      star_count: parseInt(row.star_count) || 0,
      fork_count: parseInt(row.fork_count) || 0,
      rating_average: parseFloat(row.rating_average) || 0,
      rating_count: parseInt(row.rating_count) || 0,
      version: row.version,
      latest_version: row.latest_version,
      last_updated: row.last_updated,
      status: row.status,
      is_verified: row.is_verified,
      is_featured: row.is_featured,
      is_official: row.is_official,
      weekly_downloads: parseInt(row.weekly_downloads) || 0,
      monthly_active_users: parseInt(row.monthly_active_users) || 0,
      enterprise_tier: row.enterprise_tier,
      sla_tier: row.sla_tier,
      tool_count: parseInt(row.tool_count) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Map database row to MCPTool object
   */
  private mapToolFromDB(row: any): MCPTool {
    return {
      id: row.id,
      server_id: row.server_id,
      name: row.name,
      display_name: row.display_name,
      description: row.description,
      input_schema: row.input_schema,
      output_schema: row.output_schema,
      examples: row.examples,
      description_embedding: row.description_embedding,
      usage_count: parseInt(row.usage_count) || 0,
      avg_execution_time_ms: parseInt(row.avg_execution_time_ms) || 0,
      success_rate: parseFloat(row.success_rate) || 1.0,
      last_used: row.last_used,
      category: row.category,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Get health status of the registry
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      total_servers: number;
      active_servers: number;
      pending_servers: number;
      total_tools: number;
      avg_response_time: number;
    };
  }> {
    try {
      const metricsQuery = `
        SELECT 
          COUNT(s.id) as total_servers,
          COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_servers,
          COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_servers,
          COUNT(t.id) as total_tools,
          AVG(s.avg_response_time_ms) as avg_response_time
        FROM mcp_servers s
        LEFT JOIN mcp_tools t ON s.id = t.server_id
      `;

      const result = await this.pool.query(metricsQuery);
      const metrics = result.rows[0];

      const status = metrics.active_servers > 0 ? 'healthy' : 'degraded';

      return {
        status,
        metrics: {
          total_servers: parseInt(metrics.total_servers) || 0,
          active_servers: parseInt(metrics.active_servers) || 0,
          pending_servers: parseInt(metrics.pending_servers) || 0,
          total_tools: parseInt(metrics.total_tools) || 0,
          avg_response_time: parseFloat(metrics.avg_response_time) || 0
        }
      };
    } catch (error) {
      this.logger.error('Failed to get registry health status:', error);
      return {
        status: 'unhealthy',
        metrics: {
          total_servers: 0,
          active_servers: 0,
          pending_servers: 0,
          total_tools: 0,
          avg_response_time: 0
        }
      };
    }
  }
}

/**
 * Factory function to create MCP server registry instance
 */
export function createMCPServerRegistry(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): MCPServerRegistry {
  return new MCPServerRegistry(pool, logger, errorManager, eventBus);
}