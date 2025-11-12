import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const verified = searchParams.get('verified');
    const limit = searchParams.get('limit') || '20';
    const page = searchParams.get('page') || '1';

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
        s.verified,
        s.featured,
        st.github_stars,
        st.cli_installs,
        s.created_at
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

    if (verified === 'true') {
      sql += ` AND s.verified = true`;
    }

    sql += ` ORDER BY st.github_stars DESC NULLS LAST, s.created_at DESC`;
    sql += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));

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
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined
      },
      verified: row.verified,
      featured: row.featured
    }));

    const countResult = await pool.query('SELECT COUNT(*) FROM mcp_servers WHERE 1=1');
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      success: true,
      data: {
        servers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
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
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error'
      }
    }, { status: 500 });
  }
}
