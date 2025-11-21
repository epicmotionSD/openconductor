import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '../../../../../lib/database';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Query to get all categories with server counts
    const result = await dbPool.query(`
      SELECT
        category,
        COUNT(*) as count
      FROM mcp_servers
      WHERE verified = true
      GROUP BY category
      ORDER BY category ASC
    `);

    const categories = result.rows.map(row => ({
      name: row.category,
      count: parseInt(row.count),
      emoji: getCategoryEmoji(row.category)
    }));

    return NextResponse.json({
      success: true,
      data: {
        categories,
        total: categories.length
      },
      meta: {
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
      }
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
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

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'memory': '🧠',
    'filesystem': '📁',
    'database': '🗄️',
    'api': '🔌',
    'search': '🔍',
    'communication': '💬',
    'monitoring': '📊',
    'development': '⚒️',
    'custom': '🔧'
  };
  return emojiMap[category] || '📦';
}
