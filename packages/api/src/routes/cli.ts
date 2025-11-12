import express from 'express';
import { z } from 'zod';
import { APIResponse, InstallEventRequest } from '@openconductor/shared';
import { registryService } from '../services/RegistryService';
import { statsService } from '../services/StatsService';
import { asyncHandler, createError } from '../middleware/errorHandler';

export const cliRouter = express.Router();

const installEventSchema = z.object({
  serverId: z.string().uuid('Invalid server ID'),
  version: z.string(),
  platform: z.enum(['darwin', 'linux', 'win32']),
  nodeVersion: z.string(),
  cliVersion: z.string(),
  fingerprint: z.string().optional()
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
 * GET /cli/config/:slug
 * Get installation config for CLI
 */
cliRouter.get('/config/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const config = await registryService.getCLIConfig(slug);
  
  if (!config) {
    throw createError('Server not found', 404);
  }
  
  res.json(createAPIResponse(config));
}));

/**
 * POST /cli/install-event
 * Track CLI installations (anonymous)
 */
cliRouter.post('/install-event', asyncHandler(async (req, res) => {
  const validatedData = installEventSchema.parse(req.body) as InstallEventRequest;
  
  // Track the install event
  await statsService.trackInstallEvent(validatedData.serverId, {
    version: validatedData.version,
    platform: validatedData.platform,
    nodeVersion: validatedData.nodeVersion,
    cliVersion: validatedData.cliVersion,
    fingerprint: validatedData.fingerprint
  });
  
  res.json(createAPIResponse({ success: true }));
}));