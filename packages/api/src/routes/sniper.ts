/**
 * Revenue Sniper API Routes
 *
 * Endpoints to trigger and monitor the Revenue Sniper
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { RevenueSniperCron, runRevenueSniper } from '../jobs/revenue-sniper-cron';

const router = Router();

let pool: Pool;

export function setSniperDatabase(dbPool: Pool) {
  pool = dbPool;
}

// ============================================
// TRIGGER ENDPOINTS
// ============================================

/**
 * POST /api/sniper/run
 * Manually trigger the Revenue Sniper
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    console.log('🎯 Manual sniper trigger received');

    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Run asynchronously
    const result = await runRevenueSniper(pool);

    res.json({
      success: true,
      message: 'Revenue Sniper completed',
      result: {
        analyzed: result.analyzed,
        breakouts: result.breakouts.length,
        rising: result.rising.length,
        pagesGenerated: result.pagesGenerated,
        pagesDeployed: result.pagesDeployed,
        timestamp: result.timestamp
      }
    });
  } catch (error: any) {
    console.error('Sniper error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sniper/run-async
 * Trigger sniper in background (returns immediately)
 */
router.post('/run-async', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Start in background
    runRevenueSniper(pool).catch(console.error);

    res.json({
      success: true,
      message: 'Revenue Sniper started in background',
      checkStatus: '/api/sniper/status'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STATUS ENDPOINTS
// ============================================

/**
 * GET /api/sniper/status
 * Get recent sniper run status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const result = await pool.query(`
      SELECT * FROM sniper_runs
      ORDER BY created_at DESC
      LIMIT 5
    `).catch(() => ({ rows: [] }));

    res.json({
      recentRuns: result.rows,
      lastRun: result.rows[0] || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sniper/breakouts
 * Get current breakout opportunities
 */
router.get('/breakouts', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const result = await pool.query(`
      SELECT data
      FROM revenue_signals
      WHERE signal_type = 'trend'
        AND data->>'category' = 'breakout'
        AND data->>'recommendedAction' = 'attack'
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY (data->>'growthRate')::int DESC
      LIMIT 20
    `).catch(() => ({ rows: [] }));

    res.json({
      count: result.rows.length,
      breakouts: result.rows.map(r => r.data)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sniper/opportunities
 * Get all attack opportunities (breakout + rising)
 */
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const result = await pool.query(`
      SELECT data
      FROM revenue_signals
      WHERE signal_type = 'trend'
        AND data->>'recommendedAction' = 'attack'
        AND created_at > NOW() - INTERVAL '48 hours'
      ORDER BY
        CASE WHEN data->>'category' = 'breakout' THEN 0 ELSE 1 END,
        (data->>'growthRate')::int DESC
      LIMIT 50
    `).catch(() => ({ rows: [] }));

    res.json({
      count: result.rows.length,
      opportunities: result.rows.map(r => r.data)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PAGES ENDPOINTS
// ============================================

/**
 * GET /api/sniper/pages
 * Get generated pages
 */
router.get('/pages', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const result = await pool.query(`
      SELECT keyword, slug, title, created_at, signal_data
      FROM generated_pages
      ORDER BY created_at DESC
      LIMIT 50
    `).catch(() => ({ rows: [] }));

    res.json({
      count: result.rows.length,
      pages: result.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sniper/pages/:slug
 * Get a specific generated page
 */
router.get('/pages/:slug', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { slug } = req.params;

    const result = await pool.query(`
      SELECT * FROM generated_pages WHERE slug = $1
    `, [slug]).catch(() => ({ rows: [] }));

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sniper/deploy-queue
 * Get pages pending deployment
 */
router.get('/deploy-queue', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const result = await pool.query(`
      SELECT slug, title, status, priority, created_at
      FROM deployment_queue
      WHERE status = 'pending'
      ORDER BY priority ASC, created_at ASC
      LIMIT 50
    `).catch(() => ({ rows: [] }));

    res.json({
      count: result.rows.length,
      queue: result.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
