import express from 'express';
import { APIResponse } from '@openconductor/shared';
import { asyncHandler, createError } from '../middleware/errorHandler';
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

export const discoveryRouter = express.Router();

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
 * POST /api/discovery/run
 * Run the automated GitHub discovery process
 * Called by cron job or manually by admins
 */
discoveryRouter.post('/run', asyncHandler(async (req, res) => {
  const startTime = Date.now();

  logger.info('Starting GitHub discovery process...');

  try {
    // Import the GitHubDiscoveryService dynamically to avoid circular dependencies
    const { GitHubDiscoveryService } = await import('../services/GitHubDiscoveryService');
    const discoveryService = new GitHubDiscoveryService();

    // Run daily discovery (searches GitHub, adds to queue)
    const discoveryResult = await discoveryService.runDailyDiscovery();

    logger.info('Discovery search completed:', {
      discovered: discoveryResult.discovered,
      queued: discoveryResult.queued
    });

    // Process the queue (validate and add servers)
    const processResult = await discoveryService.processQueue({ limit: 50 });

    const duration = Date.now() - startTime;

    logger.info('Discovery processing completed:', {
      duration: `${duration}ms`,
      processed: processResult.processed,
      added: processResult.added,
      failed: processResult.failed
    });

    res.json(createAPIResponse({
      message: 'Discovery completed successfully',
      discovered: discoveryResult.discovered,
      queued: discoveryResult.queued,
      processed: processResult.processed,
      added: processResult.added,
      failed: processResult.failed,
      duration
    }));

  } catch (error: any) {
    logger.error('Discovery process failed:', {
      error: error.message,
      stack: error.stack
    });

    throw createError(`Discovery failed: ${error.message}`, 500);
  }
}));

/**
 * GET /api/discovery/status
 * Get current discovery queue status and statistics
 */
discoveryRouter.get('/status', asyncHandler(async (req, res) => {
  try {
    const { GitHubDiscoveryService } = await import('../services/GitHubDiscoveryService');
    const discoveryService = new GitHubDiscoveryService();

    const stats = await discoveryService.getDiscoveryStats();

    res.json(createAPIResponse({
      queue: {
        pending: stats.queueStats.pending,
        processing: stats.queueStats.processing,
        completed: stats.queueStats.completed,
        failed: stats.queueStats.failed
      },
      recentActivity: stats.recentActivity,
      validationStats: stats.validationStats
    }));

  } catch (error: any) {
    logger.error('Failed to get discovery status:', error);
    throw createError(`Failed to get status: ${error.message}`, 500);
  }
}));

/**
 * GET /api/discovery/queue
 * Get pending items in discovery queue
 */
discoveryRouter.get('/queue', asyncHandler(async (req, res) => {
  try {
    const { GitHubDiscoveryService } = await import('../services/GitHubDiscoveryService');
    const discoveryService = new GitHubDiscoveryService();

    const limit = parseInt(req.query.limit as string) || 20;
    const queueItems = await discoveryService.getQueueItems({ limit });

    res.json(createAPIResponse({
      items: queueItems,
      total: queueItems.length
    }));

  } catch (error: any) {
    logger.error('Failed to get queue:', error);
    throw createError(`Failed to get queue: ${error.message}`, 500);
  }
}));

/**
 * POST /api/discovery/process
 * Manually trigger queue processing
 */
discoveryRouter.post('/process', asyncHandler(async (req, res) => {
  const limit = parseInt(req.body.limit) || 10;

  logger.info(`Manually processing queue (limit: ${limit})...`);

  try {
    const { GitHubDiscoveryService } = await import('../services/GitHubDiscoveryService');
    const discoveryService = new GitHubDiscoveryService();

    const result = await discoveryService.processQueue({ limit });

    logger.info('Queue processing completed:', result);

    res.json(createAPIResponse({
      message: 'Queue processing completed',
      ...result
    }));

  } catch (error: any) {
    logger.error('Queue processing failed:', error);
    throw createError(`Processing failed: ${error.message}`, 500);
  }
}));
