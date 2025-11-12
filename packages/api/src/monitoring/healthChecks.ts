import { Request, Response } from 'express';
import { db } from '../db/connection';
import { githubService } from '../services/GitHubService';
import { jobProcessor } from '../workers/JobProcessor';
import { githubSyncWorker } from '../workers/GitHubSyncWorker';
import { APIResponse } from '@openconductor/shared';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: HealthCheckResult[];
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    activeHandles: number;
    eventLoopDelay?: number;
  };
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

/**
 * Comprehensive health check system for production monitoring
 */
export class HealthMonitor {
  private static instance: HealthMonitor;
  private eventLoopStart = process.hrtime.bigint();

  private constructor() {}

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    logger.info('Starting comprehensive health check');

    const checks: HealthCheckResult[] = [];

    // Database health check
    checks.push(await this.checkDatabase());

    // Redis health check  
    checks.push(await this.checkRedis());

    // GitHub API health check
    checks.push(await this.checkGitHubAPI());

    // Background workers health check
    checks.push(await this.checkBackgroundWorkers());

    // API endpoints health check
    checks.push(await this.checkAPIEndpoints());

    // File system health check
    checks.push(await this.checkFileSystem());

    // Memory and performance check
    checks.push(await this.checkSystemResources());

    // Calculate overall status
    const summary = this.calculateSummary(checks);
    const overallStatus = this.determineOverallStatus(summary);

    const healthData: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
        eventLoopDelay: this.getEventLoopDelay()
      },
      summary
    };

    const totalTime = Date.now() - startTime;
    logger.info(`Health check completed in ${totalTime}ms`, { 
      status: overallStatus,
      summary 
    });

    return healthData;
  }

  /**
   * Quick health check for load balancer
   */
  async quickHealthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      // Just check database connectivity
      await db.query('SELECT 1');
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Readiness check for Kubernetes/container orchestration
   */
  async readinessCheck(): Promise<{
    ready: boolean;
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    const services = {
      database: false,
      redis: false,
      github: false
    };

    try {
      // Check critical services
      await db.query('SELECT 1');
      services.database = true;
    } catch (error) {
      logger.warn('Database not ready', error);
    }

    try {
      await db.getRedis().ping();
      services.redis = true;
    } catch (error) {
      logger.warn('Redis not ready', error);
    }

    // GitHub is optional for basic functionality
    services.github = true;

    const ready = services.database && services.redis;

    return {
      ready,
      services,
      timestamp: new Date().toISOString()
    };
  }

  // Private health check methods

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await db.query('SELECT 1');
      
      // Test actual table access
      const result = await db.query('SELECT COUNT(*) FROM mcp_servers');
      const serverCount = parseInt(result.rows[0].count);
      
      // Check for recent activity
      const recentActivity = await db.query(`
        SELECT COUNT(*) as recent_requests
        FROM api_usage 
        WHERE created_at > NOW() - INTERVAL '5 minutes'
      `);

      const responseTime = Date.now() - startTime;

      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          serverCount,
          recentRequests: parseInt(recentActivity.rows[0]?.recent_requests || '0'),
          connectionPool: {
            total: db.getPool().totalCount,
            idle: db.getPool().idleCount,
            waiting: db.getPool().waitingCount
          }
        }
      };

    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const redis = db.getRedis();
      
      // Test connectivity
      await redis.ping();
      
      // Test set/get operation
      const testKey = 'health-check-' + Date.now();
      await redis.set(testKey, 'ok', 'EX', 10);
      const testValue = await redis.get(testKey);
      await redis.del(testKey);

      if (testValue !== 'ok') {
        throw new Error('Cache read/write test failed');
      }

      // Get Redis info
      const info = await redis.info('memory');
      const responseTime = Date.now() - startTime;

      return {
        service: 'redis',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          connected: true,
          memoryUsage: this.parseRedisMemory(info)
        }
      };

    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkGitHubAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      if (!process.env.GITHUB_TOKEN) {
        return {
          service: 'github',
          status: 'degraded',
          responseTime: 0,
          details: { configured: false, message: 'No GitHub token configured' }
        };
      }

      // Test GitHub API with rate limit check
      const rateLimit = await githubService.checkRateLimit?.() || { remaining: 0, total: 5000 };
      
      const responseTime = Date.now() - startTime;

      return {
        service: 'github',
        status: rateLimit.remaining > 100 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          configured: true,
          rateLimit: {
            remaining: rateLimit.remaining,
            total: rateLimit.total,
            resetTime: rateLimit.resetTime
          }
        }
      };

    } catch (error) {
      return {
        service: 'github',
        status: 'degraded', // GitHub issues shouldn't mark system as unhealthy
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkBackgroundWorkers(): Promise<HealthCheckResult> {
    try {
      const jobProcessorStatus = jobProcessor.getStatus();
      const syncWorkerStatus = githubSyncWorker.getStatus();
      const jobStats = await jobProcessor.getJobStats();

      const status = 
        jobProcessorStatus.running && syncWorkerStatus.running ? 'healthy' :
        jobProcessorStatus.running || syncWorkerStatus.running ? 'degraded' : 'unhealthy';

      return {
        service: 'background-workers',
        status,
        details: {
          jobProcessor: jobProcessorStatus,
          syncWorker: syncWorkerStatus,
          jobStats: {
            pending: jobStats.pending,
            failed: jobStats.failed,
            averageProcessingTime: jobStats.averageProcessingTime
          }
        }
      };

    } catch (error) {
      return {
        service: 'background-workers',
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  private async checkAPIEndpoints(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test critical API endpoints internally
      const testResults = await Promise.allSettled([
        // Test servers endpoint
        db.query('SELECT COUNT(*) FROM mcp_servers LIMIT 1'),
        
        // Test search functionality
        db.query(`
          SELECT id FROM mcp_servers 
          WHERE search_vector @@ plainto_tsquery('english', 'test')
          LIMIT 1
        `),
        
        // Test stats endpoint
        db.query('SELECT COUNT(*) FROM server_stats LIMIT 1')
      ]);

      const successCount = testResults.filter(r => r.status === 'fulfilled').length;
      const responseTime = Date.now() - startTime;

      return {
        service: 'api-endpoints',
        status: successCount === testResults.length ? 'healthy' : 'degraded',
        responseTime,
        details: {
          endpointTests: {
            total: testResults.length,
            successful: successCount,
            failed: testResults.length - successCount
          }
        }
      };

    } catch (error) {
      return {
        service: 'api-endpoints',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkFileSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Check if we can write to temp directory
      const testFile = path.join('/tmp', `health-check-${Date.now()}.txt`);
      await fs.writeFile(testFile, 'health check');
      await fs.readFile(testFile, 'utf8');
      await fs.unlink(testFile);

      // Check log directory
      const logDir = path.join(process.cwd(), 'logs');
      try {
        await fs.access(logDir);
      } catch (error) {
        await fs.mkdir(logDir, { recursive: true });
      }

      const responseTime = Date.now() - startTime;

      return {
        service: 'filesystem',
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          writeable: true,
          logDirectory: logDir
        }
      };

    } catch (error) {
      return {
        service: 'filesystem',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheckResult> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Memory thresholds (in MB)
      const memoryMB = memUsage.heapUsed / 1024 / 1024;
      const memoryLimitMB = parseInt(process.env.MEMORY_LIMIT || '512');

      // CPU usage percentage (simplified)
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (memoryMB > memoryLimitMB * 0.9) {
        status = 'unhealthy'; // >90% memory usage
      } else if (memoryMB > memoryLimitMB * 0.7) {
        status = 'degraded'; // >70% memory usage
      }

      return {
        service: 'system-resources',
        status,
        details: {
          memory: {
            heapUsed: memoryMB,
            heapTotal: memUsage.heapTotal / 1024 / 1024,
            limit: memoryLimitMB,
            percentage: (memoryMB / memoryLimitMB) * 100
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
            percentage: cpuPercent
          },
          uptime: process.uptime(),
          platform: process.platform,
          nodeVersion: process.version
        }
      };

    } catch (error) {
      return {
        service: 'system-resources',
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Helper methods

  private calculateSummary(checks: HealthCheckResult[]) {
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length
    };

    return summary;
  }

  private determineOverallStatus(summary: { healthy: number; degraded: number; unhealthy: number }): 'healthy' | 'degraded' | 'unhealthy' {
    if (summary.unhealthy > 0) {
      return 'unhealthy';
    } else if (summary.degraded > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private getEventLoopDelay(): number {
    const now = process.hrtime.bigint();
    const delay = Number(now - this.eventLoopStart) / 1000000; // Convert to milliseconds
    this.eventLoopStart = now;
    return delay;
  }

  private parseRedisMemory(info: string): any {
    const lines = info.split('\r\n');
    const memory: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key === 'used_memory_human') {
          memory.used = value;
        } else if (key === 'used_memory_peak_human') {
          memory.peak = value;
        }
      }
    }
    
    return memory;
  }
}

/**
 * Production health check endpoint
 */
export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const healthData = await healthMonitor.performHealthCheck();

    // Set appropriate HTTP status
    let statusCode = 200;
    if (healthData.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    } else if (healthData.status === 'degraded') {
      statusCode = 200; // OK but degraded
    }

    const response: APIResponse<SystemHealth> = {
      success: healthData.status !== 'unhealthy',
      data: healthData,
      meta: {
        requestId: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Health check failed', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check system failure'
      },
      meta: {
        requestId: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  }
}

/**
 * Simple liveness check for Kubernetes
 */
export async function livenessHandler(req: Request, res: Response): Promise<void> {
  // Very basic check - just ensure the process is running and responsive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

/**
 * Readiness check for Kubernetes
 */
export async function readinessHandler(req: Request, res: Response): Promise<void> {
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const readiness = await healthMonitor.readinessCheck();

    const statusCode = readiness.ready ? 200 : 503;

    res.status(statusCode).json({
      ready: readiness.ready,
      services: readiness.services,
      timestamp: readiness.timestamp
    });

  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Metrics endpoint for Prometheus/monitoring
 */
export async function metricsHandler(req: Request, res: Response): Promise<void> {
  try {
    // Get system metrics
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Get database metrics
    const dbStats = await db.query(`
      SELECT 
        COUNT(*) as total_servers,
        COUNT(*) FILTER (WHERE verified = true) as verified_servers,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_servers_24h
      FROM mcp_servers
    `);

    const apiStats = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_requests,
        AVG(response_time_ms) as avg_response_time
      FROM api_usage
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);

    // Format as Prometheus metrics
    const metrics = [
      `# HELP openconductor_uptime_seconds Server uptime in seconds`,
      `# TYPE openconductor_uptime_seconds counter`,
      `openconductor_uptime_seconds ${uptime}`,
      
      `# HELP openconductor_memory_usage_bytes Memory usage in bytes`,
      `# TYPE openconductor_memory_usage_bytes gauge`,
      `openconductor_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}`,
      `openconductor_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}`,
      `openconductor_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      
      `# HELP openconductor_servers_total Total number of servers`,
      `# TYPE openconductor_servers_total gauge`,
      `openconductor_servers_total ${dbStats.rows[0]?.total_servers || 0}`,
      
      `# HELP openconductor_servers_verified Number of verified servers`,
      `# TYPE openconductor_servers_verified gauge`,
      `openconductor_servers_verified ${dbStats.rows[0]?.verified_servers || 0}`,
      
      `# HELP openconductor_api_requests_total Total API requests`,
      `# TYPE openconductor_api_requests_total counter`,
      `openconductor_api_requests_total ${apiStats.rows[0]?.total_requests || 0}`,
      
      `# HELP openconductor_api_errors_total Total API errors`,
      `# TYPE openconductor_api_errors_total counter`, 
      `openconductor_api_errors_total ${apiStats.rows[0]?.error_requests || 0}`,
      
      `# HELP openconductor_api_response_time_ms Average API response time`,
      `# TYPE openconductor_api_response_time_ms gauge`,
      `openconductor_api_response_time_ms ${apiStats.rows[0]?.avg_response_time || 0}`,
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.send(metrics);

  } catch (error) {
    logger.error('Metrics collection failed', error);
    res.status(500).send('# Metrics collection failed');
  }
}

// Export singleton
export const healthMonitor = HealthMonitor.getInstance();