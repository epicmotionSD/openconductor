import express from 'express';
import { z } from 'zod';
import { 
  APIResponse,
  ListServersRequest,
  SearchRequest,
  SubmitServerRequest,
  UpdateServerRequest,
  InstallEventRequest,
  ServerCategory,
  ErrorCodes
} from '@openconductor/shared';
import { registryService } from '../services/RegistryService';
import { searchService } from '../services/SearchService';
import { statsService } from '../services/StatsService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireFeature } from '../config/features';

export const serversRouter = express.Router();

// Validation schemas
const listServersSchema = z.object({
  page: z.string().optional().transform(str => str ? parseInt(str) : 1),
  limit: z.string().optional().transform(str => str ? Math.min(parseInt(str), 500) : 20),
  category: z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']).optional(),
  tags: z.string().optional().transform(str => str ? str.split(',') : undefined),
  verified: z.string().optional().transform(str => str === 'true' ? true : str === 'false' ? false : undefined),
  q: z.string().optional(),
  sort: z.enum(['popular', 'trending', 'recent', 'stars', 'installs']).optional().default('popular'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});

const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  filters: z.object({
    category: z.array(z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom'])).optional(),
    tags: z.array(z.string()).optional(),
    verified: z.boolean().optional()
  }).optional(),
  limit: z.string().optional().transform(str => str ? Math.min(parseInt(str), 50) : 10)
});

const submitServerSchema = z.object({
  repositoryUrl: z.string().url('Invalid repository URL'),
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  npmPackage: z.string().optional()
});

const updateServerSchema = z.object({
  tagline: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  docsUrl: z.string().url().optional(),
  homepageUrl: z.string().url().optional()
});

const installEventSchema = z.object({
  serverId: z.string().uuid('Invalid server ID'),
  version: z.string(),
  platform: z.enum(['darwin', 'linux', 'win32']),
  nodeVersion: z.string(),
  cliVersion: z.string(),
  fingerprint: z.string().optional()
});

const trendingSchema = z.object({
  period: z.enum(['24h', '7d', '30d']).optional().default('7d'),
  category: z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']).optional(),
  limit: z.string().optional().transform(str => str ? Math.min(parseInt(str), 50) : 10)
});

const popularSchema = z.object({
  category: z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']).optional(),
  limit: z.string().optional().transform(str => str ? Math.min(parseInt(str), 50) : 10)
});

// Helper function to create API response
function createAPIResponse<T>(data: T, meta?: any): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...meta
    }
  };
}

// Mount sub-routers for different API sections (MUST be before /:identifier route)
import { searchRouter } from './search';
import { statsRouter } from './stats';
import { cliRouter } from './cli';
import { categoriesRouter } from './categories';
import { webhooksRouter } from './webhooks';

/**
 * GET /api/servers
 * List all MCP servers with filtering and pagination
 */
serversRouter.get('/', asyncHandler(async (req, res) => {
  const params = listServersSchema.parse(req.query) as ListServersRequest;

  const result = await registryService.listServers(params);

  res.json(createAPIResponse(result));
}));

// Mount specific route handlers before the catch-all /:identifier route
serversRouter.use('/search', searchRouter);
serversRouter.use('/stats', statsRouter);
serversRouter.use('/cli', cliRouter);
serversRouter.use('/categories', categoriesRouter);
serversRouter.use('/webhooks', webhooksRouter);

/**
 * GET /api/servers/:identifier
 * Get detailed information about a specific server by ID or slug
 */
serversRouter.get('/:identifier', asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  const server = await registryService.getServer(identifier);

  if (!server) {
    throw createError('Server not found', 404, ErrorCodes.NOT_FOUND);
  }

  // Track page view
  await statsService.trackPageView(server.id, req.get('User-Agent'), req.ip);

  res.json(createAPIResponse(server));
}));

/**
 * POST /api/servers
 * Submit a new MCP server for inclusion in the registry
 * Phase 2 Enterprise Feature - NOW ENABLED FOR LAUNCH!
 */
serversRouter.post('/', requireFeature('serverSubmission'), asyncHandler(async (req, res) => {
  const validatedData = submitServerSchema.parse(req.body);

  const result = await registryService.submitServer(validatedData as SubmitServerRequest);
  
  res.status(201).json(createAPIResponse(result));
}));

/**
 * PATCH /api/servers/:slug
 * Update server metadata
 * Phase 2 Enterprise Feature - NOW ENABLED FOR LAUNCH!
 */
serversRouter.patch('/:slug', requireFeature('adminControls'), asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const validatedData = updateServerSchema.parse(req.body);
  
  const server = await registryService.updateServer(slug, validatedData);
  
  if (!server) {
    throw createError('Server not found', 404, ErrorCodes.NOT_FOUND);
  }
  
  res.json(createAPIResponse(server));
}));

/**
 * PUT /api/servers/:slug/verify
 * Verify/unverify server (admin only)
 * Phase 2 Enterprise Feature - NOW ENABLED FOR LAUNCH!
 */
serversRouter.put('/:slug/verify', requireFeature('adminControls'), asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { verified = true } = req.body;
  
  const server = await registryService.verifyServer(slug, verified);
  
  if (!server) {
    throw createError('Server not found', 404, ErrorCodes.NOT_FOUND);
  }
  
  res.json(createAPIResponse({
    message: `Server ${verified ? 'verified' : 'unverified'} successfully`
  }));
}));

/**
 * PUT /api/servers/:slug/feature
 * Feature/unfeature server (admin only)
 * Phase 2 Feature - Hidden in Phase 1
 */
serversRouter.put('/:slug/feature', requireFeature('adminControls'), asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { featured = true } = req.body;
  
  const server = await registryService.featureServer(slug, featured);
  
  if (!server) {
    throw createError('Server not found', 404, ErrorCodes.NOT_FOUND);
  }
  
  res.json(createAPIResponse({
    message: `Server ${featured ? 'featured' : 'unfeatured'} successfully`
  }));
}));

/**
 * DELETE /api/servers/:slug
 * Delete server (admin only)
 * Phase 2 Feature - Hidden in Phase 1
 */
serversRouter.delete('/:slug', requireFeature('adminControls'), asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const deleted = await registryService.deleteServer(slug);
  
  if (!deleted) {
    throw createError('Server not found', 404, ErrorCodes.NOT_FOUND);
  }
  
  res.json(createAPIResponse({
    message: 'Server deleted successfully'
  }));
}));