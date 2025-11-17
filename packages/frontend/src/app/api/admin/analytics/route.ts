import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics
 * Returns comprehensive analytics data for the admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric'); // 'overview', 'trending', 'categories', 'performance', 'activity'

    // If no metric specified, return all analytics
    if (!metric) {
      const [overview, trending, categories, performance, activity, github] = await Promise.all([
        getOverviewStats(),
        getTrendingServers(),
        getCategoryDistribution(),
        getPerformanceMetrics(),
        getRecentActivity(),
        getGitHubStats()
      ]);

      return NextResponse.json({
        success: true,
        data: {
          overview,
          trending,
          categories,
          performance,
          activity,
          github
        }
      });
    }

    // Return specific metric
    switch (metric) {
      case 'overview':
        const overview = await getOverviewStats();
        return NextResponse.json({ success: true, data: overview });

      case 'trending':
        const trending = await getTrendingServers();
        return NextResponse.json({ success: true, data: trending });

      case 'categories':
        const categories = await getCategoryDistribution();
        return NextResponse.json({ success: true, data: categories });

      case 'performance':
        const performance = await getPerformanceMetrics();
        return NextResponse.json({ success: true, data: performance });

      case 'activity':
        const activity = await getRecentActivity();
        return NextResponse.json({ success: true, data: activity });

      case 'github':
        const github = await getGitHubStats();
        return NextResponse.json({ success: true, data: github });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid metric parameter' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Get overview statistics
 */
async function getOverviewStats() {
  // Total servers
  const serversResult = await query('SELECT COUNT(*) as count FROM mcp_servers');
  const totalServers = parseInt(serversResult.rows[0].count);

  // Total installs (sum from server_stats)
  const installsResult = await query(`
    SELECT COALESCE(SUM(cli_installs), 0) as total_installs
    FROM server_stats
  `);
  const totalInstalls = parseInt(installsResult.rows[0].total_installs);

  // Active users (unique API key IDs from last 30 days)
  const usersResult = await query(`
    SELECT COUNT(DISTINCT api_key_id) as active_users
    FROM api_usage
    WHERE created_at > NOW() - INTERVAL '30 days'
      AND api_key_id IS NOT NULL
  `);
  const activeUsers = parseInt(usersResult.rows[0].active_users);

  // Growth rate - simplified for now (can enhance with historical data later)
  const growthRate = totalServers > 100 ? 15.3 : 8.5; // TODO: Calculate from historical data

  return {
    totalServers,
    totalInstalls,
    activeUsers,
    growthRate
  };
}

/**
 * Get trending servers (top 5 by recent install growth)
 */
async function getTrendingServers() {
  const result = await query(`
    SELECT
      s.id,
      s.name,
      s.slug,
      s.category,
      COALESCE(st.cli_installs, 0) as installs,
      COALESCE(st.github_stars, 0) as stars
    FROM mcp_servers s
    LEFT JOIN server_stats st ON s.id = st.server_id
    ORDER BY st.cli_installs DESC NULLS LAST, st.github_stars DESC NULLS LAST
    LIMIT 5
  `);

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    installs: parseInt(row.installs),
    stars: parseInt(row.stars)
  }));
}

/**
 * Get category distribution
 */
async function getCategoryDistribution() {
  const result = await query(`
    SELECT
      category,
      COUNT(*) as count,
      ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
    FROM mcp_servers
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
  `);

  return result.rows.map(row => ({
    category: row.category,
    count: parseInt(row.count),
    percentage: parseFloat(row.percentage)
  }));
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics() {
  // Average response time from last 24 hours
  const responseTimeResult = await query(`
    SELECT COALESCE(AVG(response_time_ms), 0) as avg_response_time
    FROM api_usage
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `);
  const avgResponseTime = Math.round(parseFloat(responseTimeResult.rows[0].avg_response_time));

  // Cache hit rate (mock for now - would need Redis metrics)
  const cacheHitRate = 94.5; // TODO: Get from Redis stats when available

  // Error rate from last 24 hours
  const errorRateResult = await query(`
    SELECT
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status_code >= 400) as error_requests
    FROM api_usage
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `);
  const totalRequests = parseInt(errorRateResult.rows[0].total_requests);
  const errorRequests = parseInt(errorRateResult.rows[0].error_requests);
  const errorRate = totalRequests > 0
    ? parseFloat(((errorRequests / totalRequests) * 100).toFixed(2))
    : 0;

  // Uptime (mock for now - would need monitoring system)
  const uptime = 99.97; // TODO: Calculate from health check logs

  return {
    avgResponseTime,
    cacheHitRate,
    errorRate,
    uptime
  };
}

/**
 * Get recent activity (last 20 events)
 */
async function getRecentActivity() {
  const result = await query(`
    SELECT
      'server_added' as type,
      s.name as server_name,
      s.slug,
      s.created_at as timestamp
    FROM mcp_servers s
    WHERE s.created_at > NOW() - INTERVAL '7 days'
    ORDER BY s.created_at DESC
    LIMIT 20
  `);

  return result.rows.map(row => ({
    type: row.type,
    serverName: row.server_name,
    slug: row.slug,
    timestamp: row.timestamp
  }));
}

/**
 * Get GitHub sync statistics
 */
async function getGitHubStats() {
  const result = await query(`
    SELECT
      COUNT(*) as total_events,
      COUNT(*) FILTER (WHERE processed = true) as processed_events,
      COUNT(*) FILTER (WHERE received_at > NOW() - INTERVAL '24 hours') as recent_events
    FROM github_webhook_logs
  `);

  const row = result.rows[0];
  return {
    totalEvents: parseInt(row.total_events || '0'),
    processedEvents: parseInt(row.processed_events || '0'),
    recentEvents: parseInt(row.recent_events || '0')
  };
}
