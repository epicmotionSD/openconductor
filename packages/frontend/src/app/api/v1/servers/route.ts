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

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'popularity';

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      conditions.push(`s.category = $${paramIndex++}`);
      params.push(category);
    }

    if (featured === 'true') {
      conditions.push(`s.featured = true`);
    }

    if (verified === 'true') {
      conditions.push(`s.verified = true`);
    }

    if (search) {
      conditions.push(`(s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR s.tagline ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'st.github_stars DESC NULLS LAST';
    if (sortBy === 'recent') {
      orderBy = 's.created_at DESC';
    } else if (sortBy === 'name') {
      orderBy = 's.name ASC';
    } else if (sortBy === 'installs') {
      orderBy = 'st.cli_installs DESC NULLS LAST';
    }

    // Add pagination params
    params.push(limit, offset);

    const sql = `
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
        s.verified,
        s.featured,
        st.github_stars,
        st.cli_installs,
        st.npm_downloads_total,
        st.github_last_commit_at,
        s.created_at
      FROM mcp_servers s
      LEFT JOIN server_stats st ON s.id = st.server_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const result = await pool.query(sql, params);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM mcp_servers s ${whereClause}`;
    const countResult = await pool.query(countSql, params.slice(0, params.length - 2));
    const total = parseInt(countResult.rows[0]?.total || '0');

    const servers = result.rows.map(row => ({
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
        installs: row.cli_installs || 0
      },
      packages: {
        npm: row.npm_package ? {
          name: row.npm_package,
          downloadsTotal: row.npm_downloads_total || 0
        } : undefined
      },
      verified: row.verified,
      featured: row.featured,
      createdAt: row.created_at
    }));

    return NextResponse.json({
      success: true,
      data: servers,
      meta: {
        total,
        limit,
        offset,
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
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
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
