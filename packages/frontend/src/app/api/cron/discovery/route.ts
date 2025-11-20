import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel Pro

/**
 * GET /api/cron/discovery
 * Automated daily discovery job triggered by Vercel Cron
 *
 * This endpoint should be called by Vercel Cron to run daily GitHub discovery.
 * In production, it's protected by Authorization header matching CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;

      if (!cronSecret) {
        console.error('CRON_SECRET not configured');
        return NextResponse.json({
          success: false,
          error: { code: 'CONFIG_ERROR', message: 'Cron secret not configured' }
        }, { status: 500 });
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('Unauthorized cron request');
        return NextResponse.json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid authorization' }
        }, { status: 401 });
      }
    }

    const startTime = Date.now();
    console.log('[CRON] Starting daily GitHub discovery...');

    // Call the backend API to run discovery
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${apiUrl}/api/discovery/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.API_KEY || ''
      }
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      throw new Error(`Backend discovery failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await backendResponse.json();
    const duration = Date.now() - startTime;

    console.log('[CRON] Discovery completed:', {
      duration: `${duration}ms`,
      discovered: result.data?.discovered || 0,
      queued: result.data?.queued || 0,
      processed: result.data?.processed || 0,
      added: result.data?.added || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Daily discovery completed',
        duration,
        ...result.data
      },
      meta: {
        timestamp: new Date().toISOString(),
        executionTime: duration
      }
    });

  } catch (error: any) {
    console.error('[CRON] Discovery failed:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'DISCOVERY_FAILED',
        message: error.message || 'Failed to run discovery'
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/cron/discovery
 * Manual trigger for testing (development only)
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_ALLOWED', message: 'Manual trigger not available in production' }
    }, { status: 403 });
  }

  // In development, just call GET
  return GET(request);
}
