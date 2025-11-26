import { Pool, PoolClient } from 'pg';
import { cache, db } from './connection';
import { 
  MCPServer, 
  ServerSummary, 
  ServerCategory,
  ListServersRequest,
  ListServersResponse,
  SearchRequest,
  SearchResponse,
  TrendingRequest,
  TrendingResponse,
  CLIConfigResponse,
  Version,
  ServerDependency,
  ServerReview,
  BackgroundJob,
  APIUsage,
  CACHE_TTL
} from '@openconductor/shared';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Base repository class
abstract class BaseRepository<T> {
  protected pool: Pool;
  protected tableName: string;

  constructor(tableName: string) {
    this.pool = db.getPool();
    this.tableName = tableName;
  }

  protected async query(text: string, params?: any[]): Promise<any> {
    return db.query(text, params);
  }

  protected async transaction<TResult>(
    callback: (client: PoolClient) => Promise<TResult>
  ): Promise<TResult> {
    return db.transaction(callback);
  }

  protected generateCacheKey(...parts: string[]): string {
    return cache.generateKey(...parts);
  }
}

// MCP Server Repository
export class MCPServerRepository extends BaseRepository<MCPServer> {
  constructor() {
    super('mcp_servers');
  }

  async findById(id: string): Promise<MCPServer | null> {
    const cacheKey = this.generateCacheKey('server', id);
    const cached = await cache.get<MCPServer>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const result = await this.query(`
        SELECT 
          s.*,
          st.github_stars,
          st.github_forks,
          st.github_watchers,
          st.github_open_issues,
          st.github_last_commit_at,
          st.github_created_at,
          st.npm_downloads_weekly,
          st.npm_downloads_total,
          st.npm_version,
          st.cli_installs,
          st.page_views,
          st.upvotes,
          st.popularity_score,
          st.trending_score,
          v.version as latest_version,
          v.published_at as latest_release_at
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        LEFT JOIN server_versions v ON s.id = v.server_id AND v.is_latest = true
        WHERE s.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const server = this.transformToMCPServer(result.rows[0]);
      await cache.set(cacheKey, server, CACHE_TTL.SERVER_DETAIL);
      return server;
      
    } catch (error) {
      logger.error('Error finding server by ID', { id, error });
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<MCPServer | null> {
    const cacheKey = this.generateCacheKey('server', 'slug', slug);
    const cached = await cache.get<MCPServer>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const result = await this.query(`
        SELECT 
          s.*,
          st.github_stars,
          st.github_forks,
          st.github_watchers,
          st.github_open_issues,
          st.github_last_commit_at,
          st.github_created_at,
          st.npm_downloads_weekly,
          st.npm_downloads_total,
          st.npm_version,
          st.cli_installs,
          st.page_views,
          st.upvotes,
          st.popularity_score,
          st.trending_score,
          v.version as latest_version,
          v.published_at as latest_release_at
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        LEFT JOIN server_versions v ON s.id = v.server_id AND v.is_latest = true
        WHERE s.slug = $1
      `, [slug]);

      if (result.rows.length === 0) {
        return null;
      }

      const server = this.transformToMCPServer(result.rows[0]);
      await cache.set(cacheKey, server, CACHE_TTL.SERVER_DETAIL);
      return server;
      
    } catch (error) {
      logger.error('Error finding server by slug', { slug, error });
      throw error;
    }
  }

  async list(params: ListServersRequest): Promise<ListServersResponse> {
    const {
      page = 1,
      limit = 20,
      category,
      tags,
      verified,
      q,
      sort = 'popular',
      order = 'desc'
    } = params;

    const offset = (page - 1) * limit;
    const cacheKey = this.generateCacheKey('servers', 'list', JSON.stringify(params));
    const cached = await cache.get<ListServersResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Build WHERE clause
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (category) {
        whereConditions.push(`s.category = $${paramIndex++}`);
        queryParams.push(category);
      }

      if (tags && tags.length > 0) {
        whereConditions.push(`s.tags && $${paramIndex++}::text[]`);
        queryParams.push(tags);
      }

      if (verified !== undefined) {
        whereConditions.push(`s.verified = $${paramIndex++}`);
        queryParams.push(verified);
      }

      if (q) {
        // Use ILIKE for robust search that works without search_vector column
        // Search across name, tagline, description, slug, and tags
        whereConditions.push(`(
          s.name ILIKE $${paramIndex} OR
          s.tagline ILIKE $${paramIndex} OR
          s.description ILIKE $${paramIndex} OR
          s.slug ILIKE $${paramIndex} OR
          EXISTS (SELECT 1 FROM unnest(s.tags) AS tag WHERE tag ILIKE $${paramIndex})
        )`);
        queryParams.push(`%${q}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Save WHERE clause params for COUNT query
      const whereParams = [...queryParams];

      // Build ORDER BY clause
      let orderClause = '';

      // When searching, prioritize relevance
      if (q) {
        // Add the raw search term as a parameter for exact matching
        queryParams.push(q);
        const searchParamIndex = paramIndex++;

        // Order by: exact matches first, then partial matches, then by popularity
        orderClause = `
          CASE
            WHEN LOWER(s.name) = LOWER($${searchParamIndex}) THEN 1
            WHEN LOWER(s.slug) = LOWER($${searchParamIndex}) THEN 2
            WHEN LOWER(s.name) LIKE LOWER($${searchParamIndex}) || '%' THEN 3
            ELSE 4
          END ASC,
          st.popularity_score DESC
        `;
      } else {
        switch (sort) {
          case 'popular':
            orderClause = `st.popularity_score ${order.toUpperCase()}`;
            break;
          case 'trending':
            orderClause = `st.trending_score ${order.toUpperCase()}`;
            break;
          case 'recent':
            orderClause = `s.created_at ${order.toUpperCase()}`;
            break;
          case 'stars':
            orderClause = `st.github_stars ${order.toUpperCase()}`;
            break;
          case 'installs':
            orderClause = `st.cli_installs ${order.toUpperCase()}`;
            break;
          default:
            orderClause = `st.popularity_score DESC`;
        }
      }

      // Count total (use WHERE params only, not ORDER BY params)
      const countResult = await this.query(`
        SELECT COUNT(*)
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        ${whereClause}
      `, whereParams);

      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const result = await this.query(`
        SELECT
          s.id, s.slug, s.name, s.tagline, s.category, s.tags,
          s.repository_url, s.repository_owner, s.repository_name,
          s.npm_package, s.docker_image, s.verified, s.featured,
          st.github_stars, st.cli_installs, st.github_last_commit_at
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        ${whereClause}
        ORDER BY ${orderClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, [...queryParams, limit, offset]);

      const servers = result.rows.map(this.transformToServerSummary);

      // Get filter data (categories and tags)
      const categoriesResult = await this.query(`
        SELECT category, COUNT(*) as count
        FROM mcp_servers
        WHERE verified = true
        GROUP BY category
        ORDER BY count DESC
      `);

      const tagsResult = await this.query(`
        SELECT UNNEST(tags) as tag, COUNT(*) as count
        FROM mcp_servers
        WHERE verified = true
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 50
      `);

      const response: ListServersResponse = {
        servers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          availableCategories: categoriesResult.rows.map(row => ({
            category: row.category,
            count: parseInt(row.count)
          })),
          availableTags: tagsResult.rows.map(row => ({
            tag: row.tag,
            count: parseInt(row.count)
          }))
        }
      };

      await cache.set(cacheKey, response, CACHE_TTL.SERVER_LIST);
      return response;
      
    } catch (error) {
      logger.error('Error listing servers', { params, error });
      throw error;
    }
  }

  async search(params: SearchRequest): Promise<SearchResponse> {
    const { q, filters, limit = 10 } = params;
    
    const cacheKey = this.generateCacheKey('search', JSON.stringify(params));
    const cached = await cache.get<SearchResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      let whereConditions = [`s.search_vector @@ plainto_tsquery('english', $1)`];
      let queryParams: any[] = [q];
      let paramIndex = 2;

      if (filters?.category && filters.category.length > 0) {
        whereConditions.push(`s.category = ANY($${paramIndex++}::server_category[])`);
        queryParams.push(filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        whereConditions.push(`s.tags && $${paramIndex++}::text[]`);
        queryParams.push(filters.tags);
      }

      if (filters?.verified !== undefined) {
        whereConditions.push(`s.verified = $${paramIndex++}`);
        queryParams.push(filters.verified);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const result = await this.query(`
        SELECT 
          s.id, s.slug, s.name, s.tagline, s.category, s.tags,
          s.repository_url, s.repository_owner, s.repository_name,
          s.npm_package, s.docker_image, s.verified, s.featured,
          st.github_stars, st.cli_installs, st.github_last_commit_at,
          ts_rank(s.search_vector, plainto_tsquery('english', $1)) as rank,
          ts_headline('english', s.description, plainto_tsquery('english', $1)) as highlight
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        ${whereClause}
        ORDER BY rank DESC
        LIMIT $${paramIndex++}
      `, [...queryParams, limit]);

      const searchResults = result.rows.map(row => ({
        server: this.transformToServerSummary(row),
        highlights: {
          description: row.highlight
        },
        score: parseFloat(row.rank)
      }));

      // Get total count
      const countResult = await this.query(`
        SELECT COUNT(*)
        FROM mcp_servers s
        ${whereClause}
      `, queryParams.slice(0, -1)); // Remove limit parameter

      const response: SearchResponse = {
        results: searchResults,
        suggestions: [], // Can be enhanced with query suggestions
        total: parseInt(countResult.rows[0].count)
      };

      await cache.set(cacheKey, response, CACHE_TTL.SEARCH_RESULTS);
      return response;
      
    } catch (error) {
      logger.error('Error searching servers', { params, error });
      throw error;
    }
  }

  async getTrending(params: TrendingRequest): Promise<TrendingResponse> {
    const { period = '7d', category, limit = 10 } = params;
    
    const cacheKey = this.generateCacheKey('trending', JSON.stringify(params));
    const cached = await cache.get<TrendingResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      let whereConditions = ['s.verified = true', 'st.trending_score > 0'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (category) {
        whereConditions.push(`s.category = $${paramIndex++}`);
        queryParams.push(category);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const result = await this.query(`
        SELECT 
          s.id, s.slug, s.name, s.tagline, s.category, s.tags,
          s.repository_url, s.repository_owner, s.repository_name,
          s.npm_package, s.docker_image, s.verified, s.featured,
          st.github_stars, st.cli_installs, st.github_last_commit_at,
          st.trending_score
        FROM mcp_servers s
        JOIN server_stats st ON s.id = st.server_id
        ${whereClause}
        ORDER BY st.trending_score DESC
        LIMIT $${paramIndex++}
      `, [...queryParams, limit]);

      const trendingServers = result.rows.map(row => ({
        ...this.transformToServerSummary(row),
        trendingScore: parseFloat(row.trending_score),
        growth: {
          stars: 0, // Would need historical data
          installs: 0, // Would need historical data  
          percentage: 0 // Would need historical data
        }
      }));

      const response: TrendingResponse = {
        servers: trendingServers,
        period
      };

      await cache.set(cacheKey, response, CACHE_TTL.TRENDING);
      return response;
      
    } catch (error) {
      logger.error('Error getting trending servers', { params, error });
      throw error;
    }
  }

  async create(serverData: any): Promise<MCPServer> {
    try {
      return await this.transaction(async (client) => {
        // Insert server
        const serverResult = await client.query(`
          INSERT INTO mcp_servers (
            slug, name, tagline, description, repository_url, repository_owner,
            repository_name, npm_package, category, tags, install_command,
            config_example, verified, featured
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id
        `, [
          serverData.slug,
          serverData.name,
          serverData.tagline,
          serverData.description,
          serverData.repository_url,
          serverData.repository_owner,
          serverData.repository_name,
          serverData.npm_package,
          serverData.category,
          serverData.tags,
          serverData.install_command,
          JSON.stringify(serverData.config_example),
          serverData.verified || false,
          serverData.featured || false
        ]);

        const serverId = serverResult.rows[0].id;

        // Insert initial stats
        await client.query(`
          INSERT INTO server_stats (server_id, popularity_score, trending_score)
          VALUES ($1, 0, 0)
        `, [serverId]);

        // Clear cache
        await cache.flush();

        return await this.findById(serverId);
      });
    } catch (error) {
      logger.error('Error creating server', { serverData, error });
      throw error;
    }
  }

  async update(id: string, updateData: Partial<any>): Promise<MCPServer | null> {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      await this.query(`
        UPDATE mcp_servers 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
      `, [id, ...values]);

      // Clear cache
      const server = await this.findById(id);
      if (server) {
        await cache.del(this.generateCacheKey('server', id));
        await cache.del(this.generateCacheKey('server', 'slug', server.slug));
      }

      return server;
    } catch (error) {
      logger.error('Error updating server', { id, updateData, error });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.query('DELETE FROM mcp_servers WHERE id = $1', [id]);
      
      // Clear cache
      await cache.flush(); // Clear all cache since we don't know all related keys
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting server', { id, error });
      throw error;
    }
  }

  private transformToMCPServer(row: any): MCPServer {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      description: row.description,
      repository: {
        url: row.repository_url,
        owner: row.repository_owner,
        name: row.repository_name,
        branch: row.default_branch || 'main',
        stars: row.github_stars || 0,
        forks: row.github_forks || 0,
        openIssues: row.github_open_issues || 0,
        lastCommit: row.github_last_commit_at || new Date().toISOString(),
        createdAt: row.github_created_at || new Date().toISOString()
      },
      packages: {
        npm: row.npm_package ? {
          name: row.npm_package,
          version: row.npm_version || '1.0.0',
          downloadsWeekly: row.npm_downloads_weekly || 0,
          downloadsTotal: row.npm_downloads_total || 0
        } : undefined,
        docker: row.docker_image ? {
          image: row.docker_image,
          tags: ['latest']
        } : undefined
      },
      category: row.category,
      subcategory: row.subcategory,
      tags: row.tags || [],
      installation: {
        cli: `openconductor install ${row.slug}`,
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined,
        docker: row.docker_image ? `docker pull ${row.docker_image}` : undefined,
        manual: row.install_command
      },
      configuration: {
        schema: row.config_schema,
        example: row.config_example || {}
      },
      documentation: {
        readme: '', // Would be fetched from GitHub
        readmeUrl: row.readme_url || `${row.repository_url}/blob/main/README.md`,
        docsUrl: row.docs_url,
        homepageUrl: row.homepage_url
      },
      versions: {
        latest: row.latest_version || '1.0.0',
        all: [] // Would be populated from server_versions table
      },
      dependencies: [], // Would be populated from server_dependencies table
      stats: {
        popularity: row.popularity_score || 0,
        trending: row.trending_score || 0,
        installs: row.cli_installs || 0,
        pageViews: row.page_views || 0,
        upvotes: row.upvotes || 0
      },
      verified: row.verified,
      featured: row.featured,
      deprecated: row.deprecated || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSyncedAt: row.last_synced_at
    };
  }

  private transformToServerSummary(row: any): ServerSummary {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      category: row.category,
      tags: row.tags || [],
      repository: {
        url: row.repository_url,
        owner: row.repository_owner,
        name: row.repository_name
      },
      stats: {
        stars: row.github_stars || 0,
        installs: row.cli_installs || 0,
        lastCommit: row.github_last_commit_at || new Date().toISOString()
      },
      installation: {
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined,
        docker: row.docker_image ? `docker pull ${row.docker_image}` : undefined
      },
      verified: row.verified,
      featured: row.featured
    };
  }
}

// Stats Repository
export class StatsRepository extends BaseRepository<any> {
  constructor() {
    super('server_stats');
  }

  async updateStats(serverId: string, stats: any): Promise<void> {
    try {
      await this.query(`
        UPDATE server_stats SET
          github_stars = $2,
          github_forks = $3,
          github_watchers = $4,
          github_open_issues = $5,
          github_last_commit_at = $6,
          npm_downloads_weekly = $7,
          npm_downloads_total = $8,
          npm_version = $9,
          cli_installs = $10,
          page_views = $11,
          upvotes = $12,
          popularity_score = $13,
          trending_score = $14,
          updated_at = NOW()
        WHERE server_id = $1
      `, [
        serverId,
        stats.github_stars,
        stats.github_forks,
        stats.github_watchers,
        stats.github_open_issues,
        stats.github_last_commit_at,
        stats.npm_downloads_weekly,
        stats.npm_downloads_total,
        stats.npm_version,
        stats.cli_installs,
        stats.page_views,
        stats.upvotes,
        stats.popularity_score,
        stats.trending_score
      ]);
      
      // Clear related cache
      await cache.del(this.generateCacheKey('server', serverId));
    } catch (error) {
      logger.error('Error updating server stats', { serverId, stats, error });
      throw error;
    }
  }
}

// Singleton instances
export const mcpServerRepository = new MCPServerRepository();
export const statsRepository = new StatsRepository();

// Legacy compatibility - keeping the old interface
export class ServerRepository {
  async getAllServers(): Promise<ServerSummary[]> {
    const result = await mcpServerRepository.list({ limit: 1000, page: 1 });
    return result.servers;
  }

  async getServerBySlug(slug: string): Promise<MCPServer | null> {
    return mcpServerRepository.findBySlug(slug);
  }

  async searchServers(query?: string, category?: string): Promise<ServerSummary[]> {
    const result = await mcpServerRepository.search({ 
      q: query || '',
      filters: category ? { category: [category as ServerCategory] } : undefined,
      limit: 1000
    });
    return result.results.map(r => r.server);
  }
}