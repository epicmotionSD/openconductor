import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /v1/stacks
 * List all available stacks
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        s.id,
        s.slug,
        s.name,
        s.description,
        s.tagline,
        s.icon,
        s.short_code,
        s.install_count,
        s.created_at,
        COUNT(ss.server_id) as server_count
      FROM stacks s
      LEFT JOIN stack_servers ss ON s.id = ss.stack_id
      GROUP BY s.id
      ORDER BY s.slug
    `);

    res.json({
      success: true,
      data: {
        stacks: result.rows
      }
    });
  } catch (error) {
    throw createError('Failed to fetch stacks', 500, error);
  }
});

/**
 * GET /v1/stacks/:slug
 * Get a specific stack by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get stack info
    const stackResult = await db.query(`
      SELECT
        s.id,
        s.slug,
        s.name,
        s.description,
        s.tagline,
        s.icon,
        s.short_code,
        s.system_prompt,
        s.install_count,
        s.created_at
      FROM stacks s
      WHERE s.slug = $1
    `, [slug]);

    if (stackResult.rows.length === 0) {
      throw createError('Stack not found', 404);
    }

    const stack = stackResult.rows[0];

    // Get servers in this stack
    const serversResult = await db.query(`
      SELECT
        ms.id,
        ms.slug,
        ms.name,
        ms.description,
        ms.repository_url,
        ms.npm_package,
        ms.category,
        ms.tags,
        ss.sort_order,
        COALESCE(st.github_stars, 0) as github_stars
      FROM stack_servers ss
      JOIN mcp_servers ms ON ss.server_id = ms.id
      LEFT JOIN server_stats st ON ms.id = st.server_id
      WHERE ss.stack_id = $1
      ORDER BY ss.sort_order
    `, [stack.id]);

    res.json({
      success: true,
      data: {
        ...stack,
        servers: serversResult.rows
      }
    });
  } catch (error) {
    if (error.statusCode) throw error;
    throw createError('Failed to fetch stack', 500, error);
  }
});

/**
 * POST /v1/stacks/:slug/install
 * Track stack installation
 */
router.post('/:slug/install', async (req, res) => {
  try {
    const { slug } = req.params;

    // Increment install count
    const result = await db.query(`
      UPDATE stacks
      SET install_count = install_count + 1
      WHERE slug = $1
      RETURNING id, slug, name, install_count
    `, [slug]);

    if (result.rows.length === 0) {
      throw createError('Stack not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error.statusCode) throw error;
    throw createError('Failed to track stack installation', 500, error);
  }
});

/**
 * GET /v1/s/:code
 * Short URL redirect to stack
 */
router.get('/s/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(`
      SELECT slug
      FROM stacks
      WHERE short_code = $1
    `, [code]);

    if (result.rows.length === 0) {
      return res.redirect('/stacks');
    }

    // Redirect to full stack endpoint
    res.redirect(`/v1/stacks/${result.rows[0].slug}`);
  } catch (error) {
    res.redirect('/stacks');
  }
});

export default router;
