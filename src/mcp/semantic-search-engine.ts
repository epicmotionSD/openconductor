/**
 * OpenConductor MCP Semantic Search Engine
 * 
 * AI-powered semantic search for MCP server discovery using vector embeddings.
 * Combines traditional text search with semantic understanding for better results.
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { MCPServer, ServerSearchQuery, ServerSearchResult } from './server-registry';

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface SemanticSearchQuery extends ServerSearchQuery {
  semantic_query?: string;
  use_semantic_search?: boolean;
  similarity_threshold?: number;
  hybrid_weight?: number; // Weight for combining semantic + text search (0-1)
  recommendation_context?: {
    user_id?: string;
    recent_interactions?: string[];
    skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    preferences?: Record<string, any>;
  };
}

export interface SemanticSearchResult extends ServerSearchResult {
  semantic_matches: {
    server_id: string;
    similarity_score: number;
    matched_field: 'description' | 'use_cases';
  }[];
  recommendations: {
    server_id: string;
    reason: string;
    confidence: number;
  }[];
}

/**
 * OpenAI Embedding Provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private logger: Logger;

  constructor(apiKey: string, logger: Logger, model: string = 'text-embedding-ada-002') {
    this.apiKey = apiKey;
    this.model = model;
    this.logger = logger;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: texts
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      this.logger.error('Failed to generate embeddings:', error);
      throw error;
    }
  }
}

/**
 * MCP Semantic Search Engine
 */
export class MCPSemanticSearchEngine {
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private embeddingProvider: EmbeddingProvider;

  constructor(
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    embeddingProvider: EmbeddingProvider
  ) {
    this.pool = pool;
    this.logger = logger;
    this.errorManager = errorManager;
    this.embeddingProvider = embeddingProvider;
  }

  /**
   * Perform semantic search for MCP servers
   */
  async semanticSearch(query: SemanticSearchQuery): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    this.logger.debug('Performing semantic search', { query: query.semantic_query });

    try {
      let semanticResults: any[] = [];
      let semanticMatches: any[] = [];

      // Generate embedding for semantic search
      if (query.use_semantic_search && query.semantic_query) {
        const queryEmbedding = await this.embeddingProvider.generateEmbedding(query.semantic_query);
        const semanticData = await this.performVectorSearch(queryEmbedding, query);
        semanticResults = semanticData.results;
        semanticMatches = semanticData.matches;
      }

      // Perform traditional text search
      const textResults = await this.performTextSearch(query);

      // Combine and rank results
      const combinedResults = this.combineSearchResults(
        semanticResults,
        textResults.servers,
        query.hybrid_weight || 0.7
      );

      // Get recommendations if context provided
      let recommendations: any[] = [];
      if (query.recommendation_context) {
        recommendations = await this.generateRecommendations(
          query.recommendation_context,
          combinedResults.slice(0, 10)
        );
      }

      const executionTime = Date.now() - startTime;

      return {
        servers: combinedResults.slice(query.offset || 0, (query.offset || 0) + (query.limit || 20)),
        total_count: combinedResults.length,
        facets: textResults.facets,
        semantic_matches: semanticMatches,
        recommendations,
        query_info: {
          query: query.semantic_query || query.query,
          semantic_search_used: !!query.use_semantic_search,
          execution_time_ms: executionTime
        }
      };
    } catch (error) {
      this.logger.error('Failed to perform semantic search:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'semantic-search',
        query
      });
    }
  }

  /**
   * Update embeddings for a server
   */
  async updateServerEmbeddings(serverId: string, description?: string, useCases?: string[]): Promise<void> {
    this.logger.debug('Updating server embeddings', { serverId });

    try {
      const updates: any = {};

      if (description) {
        const descriptionEmbedding = await this.embeddingProvider.generateEmbedding(description);
        updates.description_embedding = `[${descriptionEmbedding.join(',')}]`;
      }

      if (useCases && useCases.length > 0) {
        const useCaseText = useCases.join('. ');
        const useCaseEmbedding = await this.embeddingProvider.generateEmbedding(useCaseText);
        updates.use_case_embedding = `[${useCaseEmbedding.join(',')}]`;
      }

      if (Object.keys(updates).length > 0) {
        const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [serverId, ...Object.values(updates)];

        await this.pool.query(
          `UPDATE mcp_servers SET ${fields} WHERE id = $1`,
          values
        );
      }

      this.logger.info('Server embeddings updated successfully', { serverId });
    } catch (error) {
      this.logger.error('Failed to update server embeddings:', error);
      throw error;
    }
  }

  /**
   * Batch update embeddings for multiple servers
   */
  async batchUpdateEmbeddings(limit: number = 50): Promise<number> {
    this.logger.info('Starting batch embedding update', { limit });

    try {
      // Get servers without embeddings
      const query = `
        SELECT id, description, use_cases 
        FROM mcp_servers 
        WHERE (description_embedding IS NULL OR use_case_embedding IS NULL)
          AND description IS NOT NULL
          AND status = 'active'
        LIMIT $1
      `;

      const result = await this.pool.query(query, [limit]);
      const servers = result.rows;

      if (servers.length === 0) {
        this.logger.info('No servers need embedding updates');
        return 0;
      }

      // Process in batches to avoid rate limits
      const batchSize = 10;
      let processed = 0;

      for (let i = 0; i < servers.length; i += batchSize) {
        const batch = servers.slice(i, i + batchSize);
        
        // Prepare texts for embedding
        const descriptions = batch.map(s => s.description || '');
        const useCaseTexts = batch.map(s => 
          Array.isArray(s.use_cases) ? s.use_cases.join('. ') : ''
        );

        // Generate embeddings in batch
        const [descEmbeddings, useCaseEmbeddings] = await Promise.all([
          this.embeddingProvider.generateEmbeddings(descriptions),
          this.embeddingProvider.generateEmbeddings(useCaseTexts)
        ]);

        // Update database
        for (let j = 0; j < batch.length; j++) {
          const server = batch[j];
          const descEmbedding = descEmbeddings[j];
          const useCaseEmbedding = useCaseEmbeddings[j];

          await this.pool.query(
            `UPDATE mcp_servers 
             SET description_embedding = $1, use_case_embedding = $2 
             WHERE id = $3`,
            [
              `[${descEmbedding.join(',')}]`,
              `[${useCaseEmbedding.join(',')}]`,
              server.id
            ]
          );
          processed++;
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.logger.info('Batch embedding update completed', { processed });
      return processed;
    } catch (error) {
      this.logger.error('Failed to batch update embeddings:', error);
      throw error;
    }
  }

  /**
   * Get similar servers based on another server
   */
  async getSimilarServers(serverId: string, limit: number = 10): Promise<MCPServer[]> {
    try {
      const query = `
        WITH target_server AS (
          SELECT description_embedding, use_case_embedding 
          FROM mcp_servers 
          WHERE id = $1
        )
        SELECT s.*, u.name as author_name,
               COUNT(t.id) as tool_count,
               GREATEST(
                 1 - (s.description_embedding <=> target.description_embedding),
                 1 - (s.use_case_embedding <=> target.use_case_embedding)
               ) as similarity_score
        FROM mcp_servers s
        LEFT JOIN users u ON s.author_id = u.id
        LEFT JOIN mcp_tools t ON s.id = t.server_id,
        target_server target
        WHERE s.id != $1 
          AND s.status = 'active'
          AND (s.description_embedding IS NOT NULL OR s.use_case_embedding IS NOT NULL)
        GROUP BY s.id, u.name, similarity_score
        ORDER BY similarity_score DESC
        LIMIT $2
      `;

      const result = await this.pool.query(query, [serverId, limit]);
      return result.rows.map(row => this.mapServerFromDB(row));
    } catch (error) {
      this.logger.error('Failed to get similar servers:', error);
      throw error;
    }
  }

  /**
   * Perform vector similarity search
   */
  private async performVectorSearch(
    queryEmbedding: number[],
    query: SemanticSearchQuery
  ): Promise<{ results: any[]; matches: any[] }> {
    try {
      const embeddingVector = `[${queryEmbedding.join(',')}]`;
      const threshold = query.similarity_threshold || 0.7;

      const searchQuery = `
        SELECT s.*, u.name as author_name,
               COUNT(t.id) as tool_count,
               GREATEST(
                 1 - (s.description_embedding <=> $1::vector),
                 1 - (s.use_case_embedding <=> $1::vector)
               ) as similarity_score,
               CASE 
                 WHEN (1 - (s.description_embedding <=> $1::vector)) > 
                      (1 - (s.use_case_embedding <=> $1::vector)) 
                 THEN 'description'
                 ELSE 'use_cases'
               END as matched_field
        FROM mcp_servers s
        LEFT JOIN users u ON s.author_id = u.id
        LEFT JOIN mcp_tools t ON s.id = t.server_id
        WHERE s.status = 'active'
          AND (s.description_embedding IS NOT NULL OR s.use_case_embedding IS NOT NULL)
          AND (
            (1 - (s.description_embedding <=> $1::vector)) > $2 OR
            (1 - (s.use_case_embedding <=> $1::vector)) > $2
          )
        GROUP BY s.id, u.name, similarity_score, matched_field
        ORDER BY similarity_score DESC
        LIMIT 50
      `;

      const result = await this.pool.query(searchQuery, [embeddingVector, threshold]);

      const results = result.rows.map(row => ({
        ...this.mapServerFromDB(row),
        similarity_score: parseFloat(row.similarity_score)
      }));

      const matches = result.rows.map(row => ({
        server_id: row.id,
        similarity_score: parseFloat(row.similarity_score),
        matched_field: row.matched_field
      }));

      return { results, matches };
    } catch (error) {
      this.logger.error('Failed to perform vector search:', error);
      throw error;
    }
  }

  /**
   * Perform traditional text search
   */
  private async performTextSearch(query: SemanticSearchQuery): Promise<ServerSearchResult> {
    // This would use the existing search functionality from server-registry
    // For now, return a simple implementation
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

      if (query.query) {
        conditions.push(`(
          s.name ILIKE $${paramCount} OR 
          s.display_name ILIKE $${paramCount} OR 
          s.description ILIKE $${paramCount}
        )`);
        values.push(`%${query.query}%`);
        paramCount++;
      }

      if (conditions.length > 0) {
        baseQuery += ` AND ${conditions.join(' AND ')}`;
      }

      const mainQuery = `
        SELECT s.*, u.name as author_name, 
               COUNT(t.id) as tool_count
        ${baseQuery}
        GROUP BY s.id, u.name
        ORDER BY s.star_count DESC, s.download_count DESC
        LIMIT 50
      `;

      const result = await this.pool.query(mainQuery, values);
      const servers = result.rows.map(row => this.mapServerFromDB(row));

      return {
        servers,
        total_count: servers.length,
        facets: { categories: {}, tags: {}, performance_tiers: {} },
        query_info: {
          query: query.query,
          semantic_search_used: false,
          execution_time_ms: 0
        }
      };
    } catch (error) {
      this.logger.error('Failed to perform text search:', error);
      throw error;
    }
  }

  /**
   * Combine semantic and text search results
   */
  private combineSearchResults(
    semanticResults: any[],
    textResults: MCPServer[],
    semanticWeight: number
  ): MCPServer[] {
    const combined = new Map<string, any>();

    // Add semantic results with weighted scores
    semanticResults.forEach(server => {
      combined.set(server.id, {
        ...server,
        combined_score: server.similarity_score * semanticWeight
      });
    });

    // Add text results with weighted scores
    textResults.forEach((server, index) => {
      const textScore = Math.max(0, (textResults.length - index) / textResults.length);
      const existing = combined.get(server.id);
      
      if (existing) {
        existing.combined_score += textScore * (1 - semanticWeight);
      } else {
        combined.set(server.id, {
          ...server,
          combined_score: textScore * (1 - semanticWeight)
        });
      }
    });

    // Sort by combined score and return
    return Array.from(combined.values())
      .sort((a, b) => b.combined_score - a.combined_score)
      .map(({ combined_score, similarity_score, ...server }) => server);
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    context: any,
    topServers: MCPServer[]
  ): Promise<any[]> {
    try {
      const recommendations = [];

      // Skill-level based recommendations
      if (context.skill_level) {
        const skillServerMap = {
          beginner: ['filesystem-server', 'web-search-server'],
          intermediate: ['postgres-server', 'api-server'],
          advanced: ['kubernetes-server', 'ml-server'],
          expert: ['custom-server', 'enterprise-server']
        };

        const suggestedNames = skillServerMap[context.skill_level] || [];
        const matchedServers = topServers.filter(s => suggestedNames.includes(s.name));

        matchedServers.forEach(server => {
          recommendations.push({
            server_id: server.id,
            reason: `Recommended for ${context.skill_level} users`,
            confidence: 0.8
          });
        });
      }

      // Popular/trending recommendations
      const popularServers = topServers
        .filter(s => s.download_count > 100 || s.star_count > 10)
        .slice(0, 3);

      popularServers.forEach(server => {
        if (!recommendations.find(r => r.server_id === server.id)) {
          recommendations.push({
            server_id: server.id,
            reason: 'Popular in the community',
            confidence: 0.6
          });
        }
      });

      return recommendations.slice(0, 5);
    } catch (error) {
      this.logger.error('Failed to generate recommendations:', error);
      return [];
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
   * Get search analytics for optimization
   */
  async getSearchAnalytics(): Promise<{
    total_searches: number;
    semantic_searches: number;
    avg_response_time: number;
    popular_queries: { query: string; count: number }[];
  }> {
    // This would integrate with analytics tracking
    // For now, return mock data
    return {
      total_searches: 1000,
      semantic_searches: 750,
      avg_response_time: 150,
      popular_queries: [
        { query: 'file system', count: 50 },
        { query: 'database', count: 45 },
        { query: 'web search', count: 30 }
      ]
    };
  }
}

/**
 * Factory function to create semantic search engine
 */
export function createSemanticSearchEngine(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  embeddingProvider: EmbeddingProvider
): MCPSemanticSearchEngine {
  return new MCPSemanticSearchEngine(pool, logger, errorManager, embeddingProvider);
}