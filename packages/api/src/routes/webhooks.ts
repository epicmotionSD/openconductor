import express from 'express';
import { z } from 'zod';
import { APIResponse, GitHubWebhookPayload } from '@openconductor/shared';
import { githubService } from '../services/GitHubService';
import { githubSyncWorker } from '../workers/GitHubSyncWorker';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireFeature } from '../config/features';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export const webhooksRouter = express.Router();

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

// Middleware to capture raw body for signature verification
export const captureRawBody = (req: any, res: any, next: any) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      req.body = JSON.parse(data);
      next();
    });
  } else {
    next();
  }
};

/**
 * POST /webhooks/github
 * Receive and process GitHub webhook events
 * Phase 2 Enterprise Feature - NOW ENABLED FOR LAUNCH!
 */
webhooksRouter.post('/github', requireFeature('githubWebhooks'), captureRawBody, asyncHandler(async (req, res) => {
  const eventType = req.get('X-GitHub-Event');
  const signature = req.get('X-Hub-Signature-256');
  const delivery = req.get('X-GitHub-Delivery');
  
  if (!eventType) {
    throw createError('Missing X-GitHub-Event header', 400);
  }

  // Verify webhook signature in production
  if (process.env.NODE_ENV === 'production') {
    const isValid = githubService.verifyWebhookSignature(req.rawBody, signature);
    if (!isValid) {
      logger.warn('Invalid webhook signature', { delivery, eventType });
      throw createError('Invalid webhook signature', 401);
    }
  }

  try {
    // Process the webhook event
    await githubService.processWebhook(eventType, req.body);
    
    logger.info('GitHub webhook processed successfully', {
      eventType,
      delivery,
      repository: req.body.repository?.full_name
    });

    res.json(createAPIResponse({
      message: 'Webhook processed successfully',
      eventType,
      delivery
    }));

  } catch (error) {
    logger.error('Webhook processing failed', {
      eventType,
      delivery,
      error: error.message
    });

    // Still return 200 to prevent GitHub from retrying
    res.json(createAPIResponse({
      message: 'Webhook received but processing failed',
      eventType,
      error: error.message
    }));
  }
}));

/**
 * GET /webhooks/github/status
 * Get webhook processing status and statistics
 * Phase 2 Enterprise Feature - NOW ENABLED FOR LAUNCH!
 */
webhooksRouter.get('/github/status', requireFeature('webhookStatus'), asyncHandler(async (req, res) => {
  const stats = await githubSyncWorker.getSyncStats();
  const workerStatus = githubSyncWorker.getStatus();
  
  res.json(createAPIResponse({
    worker: workerStatus,
    stats: stats,
    lastUpdate: new Date().toISOString()
  }));
}));

/**
 * POST /webhooks/github/test
 * Test webhook processing (development only)
 */
webhooksRouter.post('/github/test', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError('Test endpoint not available in production', 403);
  }

  const { eventType = 'push', repository } = req.body;
  
  if (!repository) {
    throw createError('Repository information is required for testing', 400);
  }

  // Create a mock payload
  const mockPayload = {
    action: 'test',
    repository: {
      full_name: repository,
      html_url: `https://github.com/${repository}`,
      owner: { login: repository.split('/')[0] },
      name: repository.split('/')[1],
      stargazers_count: 100,
      default_branch: 'main'
    }
  };

  try {
    await githubService.processWebhook(eventType, mockPayload);
    
    res.json(createAPIResponse({
      message: 'Test webhook processed',
      eventType,
      repository
    }));

  } catch (error) {
    throw createError(`Test webhook failed: ${error.message}`, 500);
  }
}));

/**
 * POST /webhooks/github/force-sync
 * Force sync a specific repository (admin only)
 * Phase 2 Feature - Hidden in Phase 1 launch
 */
webhooksRouter.post('/github/force-sync', requireFeature('adminControls'), asyncHandler(async (req, res) => {
  const { repositoryUrl } = req.body;
  
  if (!repositoryUrl) {
    throw createError('Repository URL is required', 400);
  }

  try {
    await githubSyncWorker.forceSyncServer(repositoryUrl);
    
    res.json(createAPIResponse({
      message: 'Force sync completed',
      repositoryUrl
    }));

  } catch (error) {
    throw createError(`Force sync failed: ${error.message}`, 500);
  }
}));