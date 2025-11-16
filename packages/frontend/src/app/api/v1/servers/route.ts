import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/database';

// Force dynamic rendering for this route
// Updated: 2025-11-14 - All 59 servers now verified
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const verified = searchParams.get('verified');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    // Use optimized database service
    const result = await db.getServers({
      query: query || undefined,
      category: category || undefined,
      verified: verified === 'true' ? true : undefined,
      limit,
      page,
      includeUnverified: false // Public endpoint only shows verified
    });

    return NextResponse.json({
      success: true,
      data: {
        servers: result.servers,
        pagination: result.pagination,
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
