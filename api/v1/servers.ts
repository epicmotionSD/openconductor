import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Create PostgreSQL connection pool
const cleanConnectionString = (raw?: string) => {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    url.search = '';
    return url.toString();
  } catch {
    return raw;
  }
};

const directConnectionString = process.env.POSTGRES_HOST
  ? `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}?sslmode=require`
  : undefined;

const pool = new Pool({
  connectionString:
    cleanConnectionString(process.env.POSTGRES_URL_NON_POOLING) ||
    cleanConnectionString(process.env.POSTGRES_URL) ||
    directConnectionString,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const { query, q, category, verified, limit = '20', page = '1' } = req.query;
    const searchQuery = query || q;

    let sql = `
      SELECT
        s.id,
        s.slug,
        s.name,
        s.tagline,
        s.category,
        s.tags,
        s.repository_url,
        s.repository_owner,
        s.repository_name,
        s.npm_package,
        s.pypi_package,
        s.install_command,
        s.verified,
        s.featured,
        st.github_stars,
        st.cli_installs,
        s.created_at
      FROM public.mcp_servers s
      LEFT JOIN public.server_stats st ON s.id = st.server_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (searchQuery) {
      sql += ` AND (s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
      params.push(`%${searchQuery}%`);
      paramCount++;
    }

    if (category) {
      sql += ` AND s.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (verified === 'true') {
      sql += ` AND s.verified = true`;
    }

    sql += ` ORDER BY st.github_stars DESC NULLS LAST, s.created_at DESC`;
    sql += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(sql, params);

    const servers = result.rows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
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
      installation: {
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined,
        manual: row.install_command || undefined
      },
      packages: {
        npm: row.npm_package ? { name: row.npm_package } : undefined,
        pypi: row.pypi_package ? { name: row.pypi_package } : undefined
      },
      verified: row.verified,
      featured: row.featured
    }));

    const countResult = await pool.query('SELECT COUNT(*) FROM public.mcp_servers WHERE 1=1');
    const total = parseInt(countResult.rows[0].count);

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({
      success: true,
      data: {
        servers,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        },
        filters: {
          availableCategories: [],
          availableTags: []
        }
      },
      meta: {
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error: any) {
    console.error('Error fetching servers:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error'
      }
    });
  }
}
