import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

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
    const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;

    if (!slug) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing slug' } });
    }

    const result = await pool.query(
      `
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
        s.pypi_package,
        s.install_command,
        s.config_example,
        s.docs_url,
        s.homepage_url,
        s.verified,
        s.featured,
        st.github_stars,
        st.cli_installs,
        st.npm_downloads_weekly,
        st.npm_downloads_total,
        sv.version AS latest_version
      FROM public.mcp_servers s
      LEFT JOIN public.server_stats st ON s.id = st.server_id
      LEFT JOIN LATERAL (
        SELECT version
        FROM public.server_versions
        WHERE server_id = s.id
        ORDER BY created_at DESC NULLS LAST
        LIMIT 1
      ) sv ON true
      WHERE s.slug = $1 OR s.id::text = $1
      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Server not found' } });
    }

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    const row: any = result.rows[0];

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
        stars: row.github_stars || 0
      },
      stats: {
        stars: row.github_stars || 0,
        installs: row.cli_installs || 0,
        downloadsWeekly: row.npm_downloads_weekly || 0,
        downloadsTotal: row.npm_downloads_total || 0
      },
      installation: {
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined,
        manual: row.install_command || undefined,
        docker: undefined
      },
      packages: {
        npm: row.npm_package ? { name: row.npm_package } : undefined,
        pypi: row.pypi_package ? { name: row.pypi_package } : undefined,
        docker: undefined
      },
      configuration: {
        example: row.config_example || {}
      },
      versions: {
        latest: row.latest_version || '0.0.0'
      },
      documentation: {
        docsUrl: row.docs_url,
        homepageUrl: row.homepage_url
      },
      verified: row.verified,
      featured: row.featured
    };

    return res.status(200).json({
      success: true,
      data: server,
      meta: {
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error: any) {
    console.error('Error fetching server:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error'
      }
    });
  }
}
