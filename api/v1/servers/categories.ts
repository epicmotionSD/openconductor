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
    const result = await pool.query(
      `
      SELECT category, COUNT(*)::int AS count
      FROM public.mcp_servers
      GROUP BY category
      ORDER BY category
      `
    );

    const categories = result.rows.map((row: any) => ({
      category: row.category,
      count: row.count
    }));

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({
      success: true,
      data: { categories },
      meta: {
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error'
      }
    });
  }
}
