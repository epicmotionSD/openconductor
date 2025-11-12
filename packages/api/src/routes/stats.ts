import express from 'express';
import { z } from 'zod';
import { APIResponse, TrendingRequest, ServerCategory } from '@openconductor/shared';
import { statsService } from '../services/StatsService';
import { asyncHandler } from '../middleware/errorHandler';

export const statsRouter = express.Router();

const trendingSchema = z.object({
  period: z.enum(['24h', '7d', '30d']).optional().default('7d'),
  category: z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']).optional(),
  limit: z.string().optional().transform(str => str ? Math.min(parseInt(str), 50) : 10)
});

const popularSchema = z.object({
  category: z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']).optional(),
  limit: z.string().optional().transform(str => str ? Math.min(parseInt(str), 50) : 10)
});

function createAPIResponse<T>(data: T): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
}

/**
 * GET /stats/trending
 * Get trending servers (24h, 7d, 30d)
 */
statsRouter.get('/trending', asyncHandler(async (req, res) => {
  const params = trendingSchema.parse(req.query) as TrendingRequest;
  
  const result = await statsService.getTrending(params);
  
  res.json(createAPIResponse(result));
}));

/**
 * GET /stats/popular
 * Most popular servers by category
 */
statsRouter.get('/popular', asyncHandler(async (req, res) => {
  const { category, limit } = popularSchema.parse(req.query);
  
  const result = await statsService.getPopular(category, limit);
  
  res.json(createAPIResponse(result));
}));

/**
 * GET /stats/registry
 * Get overall registry statistics
 */
statsRouter.get('/registry', asyncHandler(async (req, res) => {
  const stats = await statsService.getRegistryStats();
  
  res.json(createAPIResponse(stats));
}));