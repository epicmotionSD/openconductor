import { db } from '../db/connection';
import { BackgroundJob } from '@openconductor/shared';
import { githubService } from '../services/GitHubService';
import { statsService } from '../services/StatsService';
import { statsCalculationEngine } from '../services/StatsCalculationEngine';
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

/**
 * Background job processing system for asynchronous tasks
 * Handles GitHub sync, stats updates, and other long-running operations
 */
export class JobProcessor {
  private static instance: JobProcessor;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private processingJob = false;

  private constructor() {}

  public static getInstance(): JobProcessor {
    if (!JobProcessor.instance) {
      JobProcessor.instance = new JobProcessor();
    }
    return JobProcessor.instance;
  }

  /**
   * Start the job processor
   */
  start(pollIntervalSeconds = 30): void {
    if (this.isRunning) {
      logger.warn('Job processor is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting background job processor', { pollIntervalSeconds });

    // Start processing immediately
    this.processJobs();

    // Then poll for new jobs
    this.intervalId = setInterval(() => {
      if (!this.processingJob) {
        this.processJobs();
      }
    }, pollIntervalSeconds * 1000);

    // Graceful shutdown handlers
    process.on('SIGINT', this.stop.bind(this));
    process.on('SIGTERM', this.stop.bind(this));
  }

  /**
   * Stop the job processor
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Background job processor stopped');
  }

  /**
   * Process all pending jobs
   */
  async processJobs(): Promise<void> {
    if (this.processingJob) {
      return; // Already processing
    }

    this.processingJob = true;

    try {
      const jobs = await this.getPendingJobs();
      
      if (jobs.length > 0) {
        logger.info(`Processing ${jobs.length} background jobs`);

        for (const job of jobs) {
          try {
            await this.processJob(job);
          } catch (error) {
            logger.error('Job processing failed', { 
              jobId: job.id, 
              jobType: job.jobType, 
              error: error.message 
            });
          }
        }
      }

    } catch (error) {
      logger.error('Job processing cycle failed', error);
    } finally {
      this.processingJob = false;
    }
  }

  /**
   * Process a single job
   */
  async processJob(job: BackgroundJob): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Mark job as processing
      await this.updateJobStatus(job.id, 'processing');
      
      logger.info('Processing job', { 
        jobId: job.id, 
        jobType: job.jobType,
        attempt: job.attempts + 1,
        maxAttempts: job.maxAttempts
      });

      let result;

      // Execute job based on type
      switch (job.jobType) {
        case 'github_sync':
          result = await this.handleGitHubSync(job.payload);
          break;

        case 'stats_calculation':
          result = await this.handleStatsCalculation(job.payload);
          break;

        case 'server_discovery':
          result = await this.handleServerDiscovery(job.payload);
          break;

        case 'cache_warm':
          result = await this.handleCacheWarming(job.payload);
          break;

        case 'analytics_snapshot':
          result = await this.handleAnalyticsSnapshot(job.payload);
          break;

        case 'cleanup':
          result = await this.handleCleanup(job.payload);
          break;

        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Mark job as completed
      await this.completeJob(job.id, result, Date.now() - startTime);
      
      logger.info('Job completed successfully', { 
        jobId: job.id, 
        jobType: job.jobType,
        duration: Date.now() - startTime
      });

    } catch (error) {
      await this.failJob(job.id, error.message, job.attempts + 1, job.maxAttempts);
      
      logger.error('Job failed', { 
        jobId: job.id, 
        jobType: job.jobType,
        attempt: job.attempts + 1,
        maxAttempts: job.maxAttempts,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Queue a new background job
   */
  async queueJob(
    jobType: string,
    payload: any,
    options: {
      priority?: number;
      maxAttempts?: number;
      scheduleAt?: Date;
    } = {}
  ): Promise<string> {
    try {
      const result = await db.query(`
        INSERT INTO background_jobs (
          job_type, payload, priority, max_attempts, scheduled_at
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        jobType,
        JSON.stringify(payload),
        options.priority || 0,
        options.maxAttempts || 3,
        options.scheduleAt || new Date()
      ]);

      const jobId = result.rows[0].id;
      
      logger.info('Job queued', { jobId, jobType, priority: options.priority });
      
      return jobId;

    } catch (error) {
      logger.error('Failed to queue job', { jobType, error: error.message });
      throw error;
    }
  }

  /**
   * Get job processing statistics
   */
  async getJobStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageProcessingTime: number;
  }> {
    try {
      const result = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          AVG(
            EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
          ) FILTER (WHERE status = 'completed' AND started_at IS NOT NULL) as avg_processing_time
        FROM background_jobs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      const row = result.rows[0];
      return {
        total: parseInt(row.total),
        pending: parseInt(row.pending),
        processing: parseInt(row.processing),
        completed: parseInt(row.completed),
        failed: parseInt(row.failed),
        averageProcessingTime: parseFloat(row.avg_processing_time) || 0
      };

    } catch (error) {
      logger.error('Failed to get job stats', error);
      return { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, averageProcessingTime: 0 };
    }
  }

  // Private job handlers

  private async handleGitHubSync(payload: any): Promise<any> {
    const { repositoryUrl, serverId } = payload;
    
    if (repositoryUrl) {
      const result = await githubService.syncServer(repositoryUrl);
      return { syncedServer: result.serverId, updated: result.updated };
    } else if (serverId) {
      // Force sync specific server
      const serverResult = await db.query('SELECT repository_url FROM mcp_servers WHERE id = $1', [serverId]);
      if (serverResult.rows.length > 0) {
        const result = await githubService.syncServer(serverResult.rows[0].repository_url);
        return { syncedServer: result.serverId, updated: result.updated };
      }
    }
    
    throw new Error('No repository URL or server ID provided for sync');
  }

  private async handleStatsCalculation(payload: any): Promise<any> {
    const { serverId, calculateAll } = payload;
    
    if (calculateAll) {
      // Calculate stats for all servers
      const result = await statsCalculationEngine.calculateAllScores();
      return { calculatedServers: result.updated, errors: result.errors };
    } else if (serverId) {
      // Calculate stats for specific server
      await statsService.updateServerStats(serverId);
      return { serverId, updated: true };
    }
    
    throw new Error('No serverId or calculateAll flag provided');
  }

  private async handleServerDiscovery(payload: any): Promise<any> {
    const { limit = 100 } = payload;
    
    // Discover new MCP servers from GitHub
    const repositories = await githubService.discoverMCPServers(limit);
    
    // Queue sync jobs for new repositories
    let queuedJobs = 0;
    for (const repoUrl of repositories) {
      try {
        // Check if already exists
        const existingResult = await db.query(
          'SELECT id FROM mcp_servers WHERE repository_url = $1',
          [repoUrl]
        );

        if (existingResult.rows.length === 0) {
          await this.queueJob('github_sync', { repositoryUrl: repoUrl }, { priority: 1 });
          queuedJobs++;
        }
      } catch (error) {
        logger.warn('Failed to queue sync for discovered repository', { repoUrl, error: error.message });
      }
    }

    return { 
      discovered: repositories.length, 
      newRepositories: queuedJobs 
    };
  }

  private async handleCacheWarming(payload: any): Promise<any> {
    const { patterns } = payload;
    
    // Warm critical caches
    const warmingTasks = [
      // Categories cache
      async () => {
        const categoriesResult = await db.query(`
          SELECT category, COUNT(*) as count
          FROM mcp_servers
          WHERE verified = true
          GROUP BY category
        `);
        return { categories: categoriesResult.rows.length };
      },

      // Popular servers cache
      async () => {
        await db.query(`
          SELECT s.*, st.popularity_score
          FROM mcp_servers s
          JOIN server_stats st ON s.id = st.server_id
          WHERE s.verified = true
          ORDER BY st.popularity_score DESC
          LIMIT 20
        `);
        return { popularServers: 20 };
      },

      // Trending servers cache  
      async () => {
        await db.query(`
          SELECT s.*, st.trending_score
          FROM mcp_servers s
          JOIN server_stats st ON s.id = st.server_id
          WHERE s.verified = true AND st.trending_score > 0
          ORDER BY st.trending_score DESC
          LIMIT 10
        `);
        return { trendingServers: 10 };
      }
    ];

    const results = await Promise.allSettled(warmingTasks.map(task => task()));
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    return { warmedCaches: successful, total: warmingTasks.length };
  }

  private async handleAnalyticsSnapshot(payload: any): Promise<any> {
    const snapshotCount = await statsCalculationEngine.createDailySnapshots();
    return { snapshotsCreated: snapshotCount };
  }

  private async handleCleanup(payload: any): Promise<any> {
    const { type } = payload;
    
    const cleanupTasks: Record<string, () => Promise<number>> = {
      'old_jobs': async () => {
        const result = await db.query(`
          DELETE FROM background_jobs 
          WHERE status = 'completed' 
            AND completed_at < NOW() - INTERVAL '7 days'
        `);
        return result.rowCount || 0;
      },

      'old_webhooks': async () => {
        const result = await db.query(`
          DELETE FROM github_webhook_logs 
          WHERE received_at < NOW() - INTERVAL '30 days'
        `);
        return result.rowCount || 0;
      },

      'old_analytics': async () => {
        const result = await db.query(`
          DELETE FROM server_analytics_snapshots 
          WHERE snapshot_date < NOW() - INTERVAL '90 days'
        `);
        return result.rowCount || 0;
      },

      'old_api_usage': async () => {
        const result = await db.query(`
          DELETE FROM api_usage 
          WHERE created_at < NOW() - INTERVAL '30 days'
        `);
        return result.rowCount || 0;
      }
    };

    if (type && cleanupTasks[type]) {
      const deletedCount = await cleanupTasks[type]();
      return { type, deletedRecords: deletedCount };
    } else {
      // Run all cleanup tasks
      const results: Record<string, number> = {};
      for (const [taskType, task] of Object.entries(cleanupTasks)) {
        try {
          results[taskType] = await task();
        } catch (error) {
          logger.warn(`Cleanup task ${taskType} failed`, error);
          results[taskType] = 0;
        }
      }
      return { cleanupResults: results };
    }
  }

  // Private database methods

  private async getPendingJobs(): Promise<BackgroundJob[]> {
    try {
      const result = await db.query(`
        SELECT * FROM background_jobs
        WHERE status = 'pending'
          AND attempts < max_attempts
          AND scheduled_at <= NOW()
        ORDER BY priority DESC, created_at ASC
        LIMIT 5
      `);

      return result.rows.map(row => this.transformJobRow(row));

    } catch (error) {
      logger.error('Failed to get pending jobs', error);
      return [];
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: string, 
    error?: string
  ): Promise<void> {
    const updateFields = ['status = $2', 'updated_at = NOW()'];
    const updateValues = [jobId, status];
    let paramIndex = 3;

    if (status === 'processing') {
      updateFields.push(`started_at = NOW()`);
      updateFields.push(`attempts = attempts + 1`);
    }

    if (status === 'completed' || status === 'failed') {
      updateFields.push(`completed_at = NOW()`);
    }

    if (error) {
      updateFields.push(`error = $${paramIndex++}`);
      updateValues.push(error);
    }

    await db.query(`
      UPDATE background_jobs SET ${updateFields.join(', ')}
      WHERE id = $1
    `, updateValues);
  }

  private async completeJob(
    jobId: string, 
    result: any, 
    processingTimeMs: number
  ): Promise<void> {
    await db.query(`
      UPDATE background_jobs SET
        status = 'completed',
        completed_at = NOW(),
        result = $2,
        updated_at = NOW()
      WHERE id = $1
    `, [jobId, JSON.stringify(result)]);

    logger.debug('Job marked as completed', { 
      jobId, 
      processingTimeMs, 
      result: typeof result 
    });
  }

  private async failJob(
    jobId: string,
    error: string,
    currentAttempts: number,
    maxAttempts: number
  ): Promise<void> {
    const status = currentAttempts >= maxAttempts ? 'failed' : 'pending';
    
    await db.query(`
      UPDATE background_jobs SET
        status = $2,
        error = $3,
        completed_at = CASE WHEN $4 >= $5 THEN NOW() ELSE NULL END,
        updated_at = NOW()
      WHERE id = $1
    `, [jobId, status, error, currentAttempts, maxAttempts]);

    if (status === 'failed') {
      logger.warn('Job permanently failed', { 
        jobId, 
        attempts: currentAttempts,
        maxAttempts,
        error 
      });
    } else {
      logger.info('Job will be retried', { 
        jobId, 
        attempt: currentAttempts,
        maxAttempts 
      });
    }
  }

  private transformJobRow(row: any): BackgroundJob {
    return {
      id: row.id,
      jobType: row.job_type,
      payload: row.payload,
      status: row.status,
      priority: row.priority,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      error: row.error,
      result: row.result,
      scheduledAt: row.scheduled_at,
      startedAt: row.started_at,
      completedAt: row.completed_at
    };
  }

  // Job scheduling helpers

  /**
   * Schedule recurring job (e.g., daily stats calculation)
   */
  async scheduleRecurringJob(
    jobType: string,
    payload: any,
    cronPattern: string
  ): Promise<void> {
    // Simple implementation - in production would use proper cron scheduling
    const scheduleMap: Record<string, number> = {
      'daily': 24 * 60 * 60 * 1000,    // 24 hours
      'hourly': 60 * 60 * 1000,        // 1 hour  
      'weekly': 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    const interval = scheduleMap[cronPattern];
    if (!interval) {
      throw new Error(`Unsupported cron pattern: ${cronPattern}`);
    }

    // Queue immediate job
    await this.queueJob(jobType, payload, { priority: 1 });

    // Schedule next occurrence
    const nextRun = new Date(Date.now() + interval);
    await this.queueJob(jobType, payload, { 
      priority: 1, 
      scheduleAt: nextRun 
    });

    logger.info('Recurring job scheduled', { jobType, cronPattern, nextRun });
  }

  /**
   * Cancel pending jobs of specific type
   */
  async cancelPendingJobs(jobType: string): Promise<number> {
    try {
      const result = await db.query(`
        DELETE FROM background_jobs
        WHERE job_type = $1 AND status = 'pending'
      `, [jobType]);

      const cancelledCount = result.rowCount || 0;
      
      if (cancelledCount > 0) {
        logger.info('Cancelled pending jobs', { jobType, count: cancelledCount });
      }

      return cancelledCount;

    } catch (error) {
      logger.error('Failed to cancel pending jobs', { jobType, error: error.message });
      return 0;
    }
  }

  /**
   * Get processor status
   */
  getStatus(): {
    running: boolean;
    uptime: number;
    currentlyProcessing: boolean;
    lastJobTime: Date | null;
  } {
    return {
      running: this.isRunning,
      uptime: this.isRunning ? process.uptime() : 0,
      currentlyProcessing: this.processingJob,
      lastJobTime: null // TODO: Track last job processing time
    };
  }

  /**
   * Force process all pending jobs immediately
   */
  async forceProcessPendingJobs(): Promise<{ processed: number; failed: number }> {
    logger.info('Force processing all pending jobs');
    
    const jobs = await this.getPendingJobs();
    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await this.processJob(job);
        processed++;
      } catch (error) {
        failed++;
      }
    }

    logger.info('Force processing completed', { processed, failed });
    return { processed, failed };
  }
}

/**
 * Job scheduler for setting up recurring tasks
 */
export class JobScheduler {
  private jobProcessor: JobProcessor;

  constructor() {
    this.jobProcessor = JobProcessor.getInstance();
  }

  /**
   * Set up all recurring jobs
   */
  async setupRecurringJobs(): Promise<void> {
    logger.info('Setting up recurring job schedule');

    try {
      // Daily stats calculation
      await this.jobProcessor.scheduleRecurringJob(
        'stats_calculation',
        { calculateAll: true },
        'daily'
      );

      // Hourly analytics snapshots
      await this.jobProcessor.scheduleRecurringJob(
        'analytics_snapshot',
        {},
        'hourly'
      );

      // Daily server discovery
      await this.jobProcessor.scheduleRecurringJob(
        'server_discovery',
        { limit: 100 },
        'daily'
      );

      // Weekly cleanup
      await this.jobProcessor.scheduleRecurringJob(
        'cleanup',
        { type: 'all' },
        'weekly'
      );

      // Daily cache warming
      await this.jobProcessor.scheduleRecurringJob(
        'cache_warm',
        { patterns: ['popular', 'trending', 'categories'] },
        'daily'
      );

      logger.info('Recurring jobs scheduled successfully');

    } catch (error) {
      logger.error('Failed to setup recurring jobs', error);
      throw error;
    }
  }
}

// Export singleton instances
export const jobProcessor = JobProcessor.getInstance();
export const jobScheduler = new JobScheduler();

// Auto-start job processor if environment variable is set
if (process.env.AUTO_START_JOB_PROCESSOR === 'true') {
  const pollInterval = parseInt(process.env.JOB_POLL_INTERVAL || '30');
  jobProcessor.start(pollInterval);
  
  // Setup recurring jobs
  jobScheduler.setupRecurringJobs().catch(error => {
    logger.error('Failed to setup recurring jobs on startup', error);
  });
  
  logger.info('Job processor auto-started', { pollInterval });
}