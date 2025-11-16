import { Pool } from 'pg';

// Singleton database connection pool for optimal performance
class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      // Optimized connection pool settings for Vercel Edge Functions
      max: 3, // Maximum connections (Vercel Edge has connection limits)
      min: 1, // Minimum connections to maintain
      idleTimeoutMillis: 30000, // Close connections after 30s idle
      connectionTimeoutMillis: 5000, // Connection timeout
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  // Optimized server query with single database call
  public async getServers(options: {
    query?: string;
    category?: string;
    verified?: boolean;
    limit?: number;
    page?: number;
    includeUnverified?: boolean;
  }) {
    const { query, category, verified, limit = 20, page = 1, includeUnverified = false } = options;
    
    let sql = `
      WITH server_data AS (
        SELECT
          s.id,
          s.slug,
          s.name,
          s.tagline,
          s.description,
          s.category,
          s.tags,
          s.repository_url,
          s.repository_owner,
          s.repository_name,
          s.npm_package,
          s.install_command,
          s.verified,
          s.featured,
          s.created_at,
          s.updated_at,
          st.github_stars,
          st.cli_installs,
          COUNT(*) OVER() AS total_count
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (query) {
      sql += ` AND (s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
      params.push(`%${query}%`);
      paramCount++;
    }

    if (category) {
      sql += ` AND s.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (verified === true) {
      sql += ` AND s.verified = true`;
    }

    if (!includeUnverified && verified !== false) {
      sql += ` AND s.verified = true`;
    }

    sql += ` ORDER BY st.github_stars DESC NULLS LAST, s.created_at DESC`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, (page - 1) * limit);

    sql += `) SELECT * FROM server_data`;

    const result = await this.pool.query(sql, params);
    
    const servers = result.rows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      description: row.description,
      category: row.category,
      tags: row.tags || [],
      repository: {
        url: row.repository_url,
        owner: row.repository_owner,
        name: row.repository_name,
        stars: row.github_stars || 0
      },
      stats: {
        stars: row.github_stars || 0,
        installs: row.cli_installs || 0,
        lastCommit: new Date().toISOString()
      },
      packages: {
        npm: row.npm_package ? { name: row.npm_package } : null
      },
      installation: {
        cli: row.install_command || `openconductor install ${row.slug}`,
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined
      },
      verified: row.verified,
      featured: row.featured,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      servers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  // Connection health check
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
export const dbPool = db.getPool();