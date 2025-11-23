import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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
        s.install_command,
        s.config_example,
        s.docs_url,
        s.homepage_url,
        st.github_stars,
        st.cli_installs,
        st.npm_downloads_total,
        st.github_last_commit_at,
        s.created_at
      FROM mcp_servers s
      LEFT JOIN server_stats st ON s.id = st.server_id
      WHERE s.slug = $1
    `;

    const result = await pool.query(sql, [slug]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Server '${slug}' not found`
        }
      }, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const row = result.rows[0];
    const server = {
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
        stars: row.github_stars || 0,
        lastCommit: row.github_last_commit_at || new Date().toISOString()
      },
      stats: {
        stars: row.github_stars || 0,
        installs: row.cli_installs || 0,
        lastCommit: row.github_last_commit_at || new Date().toISOString()
      },
      installation: {
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined,
        docker: undefined
      },
      packages: {
        npm: row.npm_package ? {
          name: row.npm_package,
          downloadsTotal: row.npm_downloads_total || 0
        } : undefined
      },
      configuration: {
        example: row.config_example || {}
      },
      documentation: {
        docsUrl: row.docs_url,
        homepageUrl: row.homepage_url
      },
      verified: row.verified,
      featured: row.featured,
      createdAt: row.created_at
    };

    return NextResponse.json({
      success: true,
      data: server,
      meta: {
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error: any) {
    console.error('Error fetching server:', error);
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
