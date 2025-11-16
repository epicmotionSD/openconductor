import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../db/connection';
import type {
  EcosystemEvent,
  BatchEventsRequest,
  BatchEventsResponse,
  VelocityResponse,
  FunnelResponse,
  JourneyPatternsResponse,
  InstallVelocityMetric,
  DiscoveryMatrixEntry
} from '@openconductor/shared';

const router = Router();

/**
 * Track single ecosystem event
 * POST /v1/analytics/events
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const event: EcosystemEvent = req.body;

    // Validate required fields
    if (!event.event_id || !event.user_hash || !event.product || !event.event_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: event_id, user_hash, product, event_type'
      });
    }

    const db = DatabaseManager.getInstance();

    // Insert event
    await db.query(
      `
      INSERT INTO ecosystem_events (
        id, user_hash, session_id, product, event_type, server_slug, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        event.event_id,
        event.user_hash,
        event.session_id,
        event.product,
        event.event_type,
        event.metadata?.server_slug || null,
        JSON.stringify(event.metadata || {}),
        event.timestamp || new Date()
      ]
    );

    // Triggers will automatically update:
    // - install_velocity (if event_type = 'install')
    // - user_journeys (for all events)
    // - discovery_matrix (if event_type = 'ecosystem_referral')

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

/**
 * Track batch of events (offline sync)
 * POST /v1/analytics/events/batch
 */
router.post('/events/batch', async (req: Request, res: Response) => {
  try {
    const { events }: BatchEventsRequest = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required'
      });
    }

    const db = DatabaseManager.getInstance();
    let synced = 0;

    // Insert events in batch
    for (const event of events) {
      try {
        await db.query(
          `
          INSERT INTO ecosystem_events (
            id, user_hash, session_id, product, event_type, server_slug, metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
          `,
          [
            event.event_id,
            event.user_hash,
            event.session_id,
            event.product,
            event.event_type,
            event.metadata?.server_slug || null,
            JSON.stringify(event.metadata || {}),
            event.timestamp || new Date()
          ]
        );
        synced++;
      } catch (error) {
        console.error('Error syncing event:', event.event_id, error);
        // Continue with other events
      }
    }

    const response: BatchEventsResponse = {
      success: true,
      synced
    };

    res.json(response);
  } catch (error) {
    console.error('Error batch syncing events:', error);
    res.status(500).json({
      success: false,
      synced: 0,
      error: 'Batch sync failed'
    });
  }
});

/**
 * Get real-time install velocity
 * GET /v1/analytics/velocity/realtime
 */
router.get('/velocity/realtime', async (req: Request, res: Response) => {
  try {
    const { product = 'openconductor', hours = '24' } = req.query;
    const hoursInt = parseInt(hours as string);

    const db = DatabaseManager.getInstance();

    const result = await db.query(
      `
      SELECT
        product,
        date,
        hour,
        install_count,
        unique_users,
        LAG(install_count) OVER (ORDER BY date, hour) as previous_count,
        install_count - LAG(install_count) OVER (ORDER BY date, hour) as hourly_growth,
        CASE
          WHEN LAG(install_count) OVER (ORDER BY date, hour) > 0
          THEN ROUND(
            ((install_count - LAG(install_count) OVER (ORDER BY date, hour))::DECIMAL /
             LAG(install_count) OVER (ORDER BY date, hour)) * 100,
            2
          )
          ELSE 0
        END as growth_percentage
      FROM install_velocity
      WHERE product = $1
        AND (
          date > CURRENT_DATE - INTERVAL '2 days'
          OR (date = CURRENT_DATE - INTERVAL '1 day' AND hour >= EXTRACT(HOUR FROM NOW()))
        )
      ORDER BY date DESC, hour DESC
      LIMIT $2
      `,
      [product, hoursInt]
    );

    const metrics: InstallVelocityMetric[] = result.rows.map(row => ({
      product: row.product,
      date: row.date.toISOString().split('T')[0],
      hour: row.hour,
      install_count: row.install_count,
      unique_users: row.unique_users,
      hourly_growth: row.hourly_growth || 0,
      growth_percentage: parseFloat(row.growth_percentage) || 0
    }));

    const currentHour = metrics[0] || {
      product: product as string,
      date: new Date().toISOString().split('T')[0],
      hour: new Date().getHours(),
      install_count: 0,
      unique_users: 0
    };

    // Calculate overall growth rate
    const growthRate = metrics.length > 1 && metrics[1].install_count > 0
      ? ((metrics[0].install_count - metrics[1].install_count) / metrics[1].install_count) * 100
      : 0;

    const response: VelocityResponse = {
      success: true,
      data: {
        current_hour: currentHour,
        growth_rate: Math.round(growthRate * 100) / 100,
        trending: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
        history: metrics
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting velocity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get velocity metrics'
    });
  }
});

/**
 * Get cross-product discovery funnel
 * GET /v1/analytics/funnel/cross-product
 */
router.get('/funnel/cross-product', async (req: Request, res: Response) => {
  try {
    const db = DatabaseManager.getInstance();

    const result = await db.query(`
      SELECT
        source_product,
        destination_product,
        discovery_count,
        conversion_count,
        ROUND((conversion_count::DECIMAL / NULLIF(discovery_count, 0)) * 100, 2) as conversion_rate,
        last_updated
      FROM discovery_matrix
      ORDER BY discovery_count DESC
    `);

    const funnel: DiscoveryMatrixEntry[] = result.rows.map(row => ({
      source_product: row.source_product,
      destination_product: row.destination_product,
      discovery_count: row.discovery_count,
      conversion_count: row.conversion_count,
      conversion_rate: parseFloat(row.conversion_rate) || 0,
      last_updated: new Date(row.last_updated)
    }));

    // Calculate insights
    const totalDiscoveries = funnel.reduce((sum, row) => sum + row.discovery_count, 0);
    const avgConversionRate = funnel.length > 0
      ? funnel.reduce((sum, row) => sum + row.conversion_rate, 0) / funnel.length
      : 0;

    const response: FunnelResponse = {
      success: true,
      data: {
        funnel,
        insights: {
          total_discoveries: totalDiscoveries,
          avg_conversion_rate: avgConversionRate.toFixed(2),
          top_path: funnel[0] || null
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get funnel data'
    });
  }
});

/**
 * Get user journey patterns
 * GET /v1/analytics/journeys/patterns
 */
router.get('/journeys/patterns', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const limitInt = parseInt(limit as string);

    const db = DatabaseManager.getInstance();

    const result = await db.query(
      `
      SELECT
        conversion_path,
        COUNT(*) as frequency,
        ROUND(AVG(total_interactions), 2) as avg_interactions,
        ROUND(
          EXTRACT(EPOCH FROM (MAX(last_seen_at) - MIN(first_seen_at))) / 3600,
          2
        ) as avg_journey_hours
      FROM user_journeys
      WHERE array_length(conversion_path, 1) > 0
      GROUP BY conversion_path
      ORDER BY frequency DESC
      LIMIT $1
      `,
      [limitInt]
    );

    const patterns = result.rows.map(row => ({
      conversion_path: row.conversion_path,
      frequency: parseInt(row.frequency),
      avg_interactions: parseFloat(row.avg_interactions) || 0,
      avg_journey_hours: parseFloat(row.avg_journey_hours) || 0
    }));

    const response: JourneyPatternsResponse = {
      success: true,
      data: {
        patterns,
        most_common_path: patterns[0]?.conversion_path || []
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting journey patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get journey patterns'
    });
  }
});

/**
 * Get ecosystem analytics summary
 * GET /v1/analytics/summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const db = DatabaseManager.getInstance();

    const result = await db.query(`
      SELECT * FROM ecosystem_analytics_summary
      ORDER BY total_events DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        product: row.product,
        total_users: parseInt(row.total_users),
        total_events: parseInt(row.total_events),
        total_installs: parseInt(row.total_installs),
        total_discoveries: parseInt(row.total_discoveries),
        total_referrals: parseInt(row.total_referrals),
        last_event_at: new Date(row.last_event_at)
      }))
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics summary'
    });
  }
});

/**
 * Health check endpoint
 * GET /v1/analytics/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const db = DatabaseManager.getInstance();

    // Check if tables exist
    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name IN ('ecosystem_events', 'user_journeys', 'discovery_matrix', 'install_velocity')
    `);

    const tablesExist = parseInt(result.rows[0].count) === 4;

    res.json({
      success: true,
      healthy: tablesExist,
      tables_found: parseInt(result.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      healthy: false,
      error: error.message
    });
  }
});

export default router;
