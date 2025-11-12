import express from 'express';
import { z } from 'zod';
import { APIResponse, SearchRequest } from '@openconductor/shared';
import { searchService } from '../services/SearchService';
import { asyncHandler } from '../middleware/errorHandler';

export const searchRouter = express.Router();

const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  filters: z.object({
    category: z.array(z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom'])).optional(),
    tags: z.array(z.string()).optional(),
    verified: z.boolean().optional()
  }).optional(),
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
 * GET /search
 * Advanced search with autocomplete support
 */
searchRouter.get('/', asyncHandler(async (req, res) => {
  const params = searchSchema.parse(req.query) as SearchRequest;
  
  const results = await searchService.search(params);
  
  // Log search for analytics
  await searchService.logSearch(params.q, results.total);
  
  res.json(createAPIResponse(results));
}));

/**
 * GET /search/autocomplete
 * Get autocomplete suggestions
 */
searchRouter.get('/autocomplete', asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Query parameter "q" is required'
      }
    });
  }
  
  const suggestions = await searchService.getAutocomplete(
    q, 
    limit ? parseInt(limit as string) : 5
  );
  
  res.json(createAPIResponse(suggestions));
}));

/**
 * GET /search/popular-terms
 * Get popular search terms
 */
searchRouter.get('/popular-terms', asyncHandler(async (req, res) => {
  const { limit } = req.query;
  
  const terms = await searchService.getPopularSearchTerms(
    limit ? parseInt(limit as string) : 10
  );
  
  res.json(createAPIResponse(terms));
}));

/**
 * GET /search/filters
 * Get available search filters with counts
 */
searchRouter.get('/filters', asyncHandler(async (req, res) => {
  const filters = await searchService.getSearchFilters();
  
  res.json(createAPIResponse(filters));
}));