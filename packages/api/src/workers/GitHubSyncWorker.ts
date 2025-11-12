import { githubService } from '../services/GitHubService';
import { statsService } from '../services/StatsService';
import { db } from '../db/connection';
import { BackgroundJob } from '@openconductor/shared';
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

export class GitHubSyncWorker {
  private static instance: GitHubSyncWorker;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): GitHubSyncWorker {
    if (!GitHubSyncWorker.instance) {
      GitHubSyncWorker.instance = new GitHubSyncWorker();
    }
    return GitHubSyncWorker.instance;
  }

  /**
   * Start the background sync worker
   */
  start(intervalMinutes = 60): void {
    if (this.isRunning) {
      logger.warn('GitHub sync worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting GitHub sync worker', { intervalMinutes });

    // Run immediately on startup
    this.runSyncCycle().catch(error => {
      logger.error('Initial sync failed', error);
    });

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.runSyncCycle().catch(error => {
        logger.error('Scheduled sync failed', error);
      });
    }, intervalMinutes * 60 * 1000);

    // Graceful shutdown handlers
    process.on('SIGINT', this.stop.bind(this));
    process.on('SIGTERM', this.stop.bind(this));
  }

  /**
   * Stop the background worker
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

    logger.info('GitHub sync worker stopped');
  }

  /**
   * Run a complete sync cycle
   */
  async runSyncCycle(): Promise<{ synced: number; errors: number; discovered: number }> {
    logger.info('Starting GitHub sync cycle');
    
    let synced = 0;
    let errors = 0;
    let discovered = 0;

    try {
      // 1. Process pending sync jobs
      const pendingJobs = await this.getPendingJobs();
      logger.info(`Processing ${pendingJobs.length} pending sync jobs`);

      for (const job of pendingJobs) {
        try {
          await this.processJob(job);
          synced++;
        } catch (error) {
          errors++;
          await this.markJobFailed(job.id, error.message);
        }
      }

      // 2. Sync existing servers (full refresh)
      await this.syncExistingServers();

      // 3. Discover new MCP servers (periodically)
      if (this.shouldRunDiscovery()) {
        const newServers = await this.discoverNewServers();
        discovered = newServers;
      }

      // 4. Update all server statistics
      const statsResult = await statsService.updateAllStats();
      logger.info('Stats update completed', statsResult);

      // 5. Cleanup old data
      await this.cleanupOldData();

      logger.info('GitHub sync cycle completed', { synced, errors, discovered });
      
      return { synced, errors, discovered };

    } catch (error) {
      logger.error('Sync cycle failed', error);
      throw error;
    }
  }

  /**
   * Sync all existing servers with their GitHub repositories
   */
  async syncExistingServers(): Promise<void> {
    try {
      const serversResult = await db.query(`
        SELECT id, repository_url, last_synced_at
        FROM mcp_servers
        WHERE repository_url IS NOT NULL
        ORDER BY 
          CASE WHEN last_synced_at IS NULL THEN 0 ELSE 1 END,
          last_synced_at ASC
        LIMIT 50
      `);

      logger.info(`Syncing ${serversResult.rows.length} existing servers`);

      for (const server of serversResult.rows) {
        try {
          // Rate limit: wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await githubService.syncServer(server.repository_url);
          logger.debug('Synced server', { serverId: server.id });
          
        } catch (error) {
          logger.error('Failed to sync server', { 
            serverId: server.id, 
            repositoryUrl: server.repository_url,
            error: error.message 
          });
        }
      }

    } catch (error) {
      logger.error('Failed to sync existing servers', error);
    }
  }

  /**
   * Discover new MCP servers from GitHub
   */
  async discoverNewServers(): Promise<number> {
    try {
      logger.info('Starting MCP server discovery');

      // Discover repositories with MCP-related content
      const repositories = await githubService.discoverMCPServers(100);
      let newServers = 0;

      for (const repoUrl of repositories) {
        try {
          // Check if we already track this repository
          const existingResult = await db.query(
            'SELECT id FROM mcp_servers WHERE repository_url = $1',
            [repoUrl]
          );

          if (existingResult.rows.length === 0) {
            // New repository - add to sync queue
            await this.queueSyncJob(repoUrl);
            newServers++;
            logger.info('Discovered new MCP server', { repoUrl });
          }

          // Rate limit discovery
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          logger.warn('Failed to process discovered repository', { 
            repoUrl, 
            error: error.message 
          });
        }
      }

      logger.info('Discovery completed', { newServers, totalChecked: repositories.length });
      return newServers;

    } catch (error) {
      logger.error('Server discovery failed', error);
      return 0;
    }
  }

  /**
   * Process a background job
   */
  async processJob(job: BackgroundJob): Promise<void> {
    await this.markJobProcessing(job.id);
    
    try {
      switch (job.jobType) {
        case 'github_sync':
          const payload = job.payload as { repositoryUrl: string };
          await githubService.syncServer(payload.repositoryUrl);
          break;

        case 'stats_update':
          await statsService.updateAllStats();
          break;

        case 'server_discovery':
          await this.discoverNewServers();
          break;

        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      await this.markJobCompleted(job.id);
      
    } catch (error) {
      await this.markJobFailed(job.id, error.message);
      throw error;
    }
  }

  // Private helper methods

  private async getPendingJobs(): Promise<BackgroundJob[]> {
    const result = await db.query(`
      SELECT * FROM background_jobs
      WHERE status = 'pending'
        AND attempts < max_attempts
        AND scheduled_at <= NOW()
      ORDER BY priority DESC, created_at ASC
      LIMIT 10
    `);

    return result.rows.map(row => ({
      id: row.id,
      jobType: row.job_type,
      payload: row.payload,
      status: row.status,
      priority: row.priority,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      scheduledAt: row.scheduled_at,
      createdAt: row.created_at
    }));
  }

  private async queueSyncJob(repositoryUrl: string, priority = 0): Promise<void> {
    await db.query(`
      INSERT INTO background_jobs (job_type, payload, priority, scheduled_at)
      VALUES ('github_sync', $1, $2, NOW())
    `, [JSON.stringify({ repositoryUrl }), priority]);
  }

  private async markJobProcessing(jobId: string): Promise<void> {
    await db.query(`
      UPDATE background_jobs 
      SET status = 'processing', started_at = NOW(), attempts = attempts + 1
      WHERE id = $1
    `, [jobId]);
  }

  private async markJobCompleted(jobId: string, result?: any): Promise<void> {
    await db.query(`
      UPDATE background_jobs 
      SET status = 'completed', completed_at = NOW(), result = $2
      WHERE id = $1
    `, [jobId, result ? JSON.stringify(result) : null]);
  }

  private async markJobFailed(jobId: string, error: string): Promise<void> {
    await db.query(`
      UPDATE background_jobs 
      SET status = 'failed', completed_at = NOW(), error = $2
      WHERE id = $1
    `, [jobId, error]);
  }

  private shouldRunDiscovery(): boolean {
    // Run discovery once per day (could be configurable)
    const lastDiscoveryKey = 'last_discovery_run';
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // TODO: Store last discovery time in cache/database
    // For now, run discovery every cycle
    return true;
  }

  private async cleanupOldData(): Promise<void> {
    try {
      // Clean up old webhook logs (keep 30 days)
      await db.query(`
        DELETE FROM github_webhook_logs 
        WHERE received_at < NOW() - INTERVAL '30 days'
      `);

      // Clean up old completed jobs (keep 7 days)
      await db.query(`
        DELETE FROM background_jobs 
        WHERE status = 'completed' 
          AND completed_at < NOW() - INTERVAL '7 days'
      `);

      // Clean up old analytics snapshots (keep 90 days)
      await db.query(`
        DELETE FROM server_analytics_snapshots 
        WHERE snapshot_date < NOW() - INTERVAL '90 days'
      `);

      logger.info('Old data cleanup completed');

    } catch (error) {
      logger.warn('Data cleanup failed', error);
    }
  }

  /**
   * Get sync worker status
   */
  getStatus(): { 
    running: boolean; 
    uptime: number;
    lastSyncTime: Date | null;
  } {
    return {
      running: this.isRunning,
      uptime: this.isRunning ? process.uptime() : 0,
      lastSyncTime: null // TODO: Track last sync time
    };
  }

  /**
   * Force sync of a specific server
   */
  async forceSyncServer(repositoryUrl: string): Promise<void> {
    logger.info('Force syncing server', { repositoryUrl });
    
    try {
      await githubService.syncServer(repositoryUrl);
      logger.info('Force sync completed', { repositoryUrl });
    } catch (error) {
      logger.error('Force sync failed', { repositoryUrl, error: error.message });
      throw error;
    }
  }

  /**
   * Queue a high-priority sync job
   */
  async queuePrioritySync(repositoryUrl: string): Promise<void> {
    await this.queueSyncJob(repositoryUrl, 100); // High priority
    logger.info('Priority sync job queued', { repositoryUrl });
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalJobs: number;
    pendingJobs: number;
    failedJobs: number;
    completedJobs: number;
    lastSyncTime: string | null;
  }> {
    try {
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
          MAX(completed_at) as last_sync_time
        FROM background_jobs
        WHERE job_type = 'github_sync'
          AND created_at > NOW() - INTERVAL '24 hours'
      `);

      const row = result.rows[0];
      return {
        totalJobs: parseInt(row.total_jobs),
        pendingJobs: parseInt(row.pending_jobs),
        failedJobs: parseInt(row.failed_jobs),
        completedJobs: parseInt(row.completed_jobs),
        lastSyncTime: row.last_sync_time
      };

    } catch (error) {
      logger.error('Failed to get sync stats', error);
      return {
        totalJobs: 0,
        pendingJobs: 0,
        failedJobs: 0,
        completedJobs: 0,
        lastSyncTime: null
      };
    }
  }
}

// Export singleton instance
export const githubSyncWorker = GitHubSyncWorker.getInstance();

// Auto-start worker if environment variable is set
if (process.env.AUTO_START_GITHUB_WORKER === 'true') {
  const intervalMinutes = parseInt(process.env.GITHUB_SYNC_INTERVAL || '60');
  githubSyncWorker.start(intervalMinutes);
  
  logger.info('GitHub sync worker auto-started', { intervalMinutes });
}