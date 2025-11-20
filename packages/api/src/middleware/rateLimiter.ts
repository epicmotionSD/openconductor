import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { db, cache } from '../db/connection';
import { ErrorCodes } from '@openconductor/shared';
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

// Helper to create Redis store with fallback to memory store
function createRateLimitStore(prefix: string): any {
  try {
    const redis = db.getRedis();
    if (!redis || !redis.status || redis.status !== 'ready') {
      logger.warn(`Redis not available, using in-memory rate limiting for ${prefix}`);
      return undefined; // express-rate-limit will use default memory store
    }
    return new RedisStore({
      sendCommand: (...args: string[]) => (redis as any).call(...args) as Promise<any>,
      prefix,
    }) as any;
  } catch (error) {
    logger.warn(`Failed to create Redis store for ${prefix}, falling back to memory store:`, error);
    return undefined; // Fallback to in-memory store
  }
}

/**
 * Rate limiting configuration based on the technical specification
 */

// Anonymous users: 100 requests per 15 minutes
export const anonymousLimiter = rateLimit({
  store: createRateLimitStore('rl:anon:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT,
      message: 'Too many requests. Please try again later.',
      details: {
        limit: 100,
        windowMs: 15 * 60 * 1000,
        retryAfter: '15 minutes'
      }
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use IP address for anonymous users
    return req.ip;
  },
  onLimitReached: (req, res, options) => {
    logger.warn('Rate limit reached for anonymous user', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
  }
} as any);

// Authenticated users: 1000 requests per 15 minutes
export const authenticatedLimiter = rateLimit({
  store: createRateLimitStore('rl:auth:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT,
      message: 'Rate limit exceeded for authenticated users.',
      details: {
        limit: 1000,
        windowMs: 15 * 60 * 1000,
        retryAfter: '15 minutes'
      }
    }
  },
  keyGenerator: (req) => {
    // Use API key or user ID if available, fallback to IP
    return req.apiKey?.id || req.user?.id || req.ip;
  },
  onLimitReached: (req, res, options) => {
    logger.warn('Rate limit reached for authenticated user', {
      apiKeyId: req.apiKey?.id,
      userId: req.user?.id,
      ip: req.ip,
      endpoint: req.path
    });
  }
} as any);

// CLI install endpoint: 10 requests per minute (prevent abuse)
export const cliInstallLimiter = rateLimit({
  store: createRateLimitStore('rl:cli:'),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // requests per window
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT,
      message: 'Install rate limit exceeded. Please wait before trying again.',
      details: {
        limit: 10,
        windowMs: 60 * 1000,
        retryAfter: '1 minute'
      }
    }
  },
  keyGenerator: (req) => {
    // Use fingerprint if available, otherwise IP
    return req.body?.fingerprint || req.ip;
  },
  onLimitReached: (req, res, options) => {
    logger.warn('CLI install rate limit reached', {
      fingerprint: req.body?.fingerprint,
      ip: req.ip,
      platform: req.body?.platform
    });
  }
} as any);

// Search endpoint: 60 requests per minute
export const searchLimiter = rateLimit({
  store: createRateLimitStore('rl:search:'),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // requests per window
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT,
      message: 'Search rate limit exceeded.',
      details: {
        limit: 60,
        windowMs: 60 * 1000,
        retryAfter: '1 minute'
      }
    }
  },
  keyGenerator: (req) => {
    return req.apiKey?.id || req.user?.id || req.ip;
  }
} as any);

// Webhook endpoint: 1000 requests per hour (GitHub sends many webhooks)
export const webhookLimiter = rateLimit({
  store: createRateLimitStore('rl:webhook:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // requests per window
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT,
      message: 'Webhook rate limit exceeded.',
      details: {
        limit: 1000,
        windowMs: 60 * 60 * 1000,
        retryAfter: '1 hour'
      }
    }
  },
  keyGenerator: (req) => {
    // Use GitHub delivery ID or IP
    return req.get('X-GitHub-Delivery') || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for valid GitHub webhooks in production
    if (process.env.NODE_ENV === 'production') {
      const signature = req.get('X-Hub-Signature-256');
      return !!signature; // Trust GitHub's own rate limiting
    }
    return false;
  }
} as any);

// Admin endpoints: 100 requests per hour
export const adminLimiter = rateLimit({
  store: createRateLimitStore('rl:admin:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // requests per window
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMIT,
      message: 'Admin rate limit exceeded.',
      details: {
        limit: 100,
        windowMs: 60 * 60 * 1000,
        retryAfter: '1 hour'
      }
    }
  },
  keyGenerator: (req) => {
    return req.user?.id || req.apiKey?.id || req.ip;
  }
} as any);

/**
 * Dynamic rate limiter that adjusts based on server load
 */
export class DynamicRateLimiter {
  private static instance: DynamicRateLimiter;
  
  private baseLimit = 100;
  private currentMultiplier = 1.0;
  private lastAdjustment = Date.now();

  private constructor() {
    // Monitor server metrics every 5 minutes
    setInterval(() => {
      this.adjustLimits();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): DynamicRateLimiter {
    if (!DynamicRateLimiter.instance) {
      DynamicRateLimiter.instance = new DynamicRateLimiter();
    }
    return DynamicRateLimiter.instance;
  }

  /**
   * Get current rate limit for a user based on system load
   */
  getCurrentLimit(userType: 'anonymous' | 'authenticated' | 'premium'): number {
    const baseLimits = {
      anonymous: 100,
      authenticated: 1000,
      premium: 5000
    };

    return Math.floor(baseLimits[userType] * this.currentMultiplier);
  }

  /**
   * Adjust rate limits based on system metrics
   */
  private async adjustLimits(): Promise<void> {
    try {
      // Get system metrics (simplified - could use more sophisticated metrics)
      const metrics = await this.getSystemMetrics();
      
      let newMultiplier = 1.0;

      // Adjust based on CPU usage (if available)
      if (metrics.cpuUsage > 80) {
        newMultiplier *= 0.7; // Reduce limits by 30%
      } else if (metrics.cpuUsage < 30) {
        newMultiplier *= 1.2; // Increase limits by 20%
      }

      // Adjust based on error rate
      if (metrics.errorRate > 5) {
        newMultiplier *= 0.8; // Reduce limits by 20%
      }

      // Adjust based on response time
      if (metrics.avgResponseTime > 2000) {
        newMultiplier *= 0.9; // Reduce limits by 10%
      }

      // Apply bounds
      newMultiplier = Math.max(0.3, Math.min(2.0, newMultiplier));

      if (Math.abs(newMultiplier - this.currentMultiplier) > 0.1) {
        logger.info('Adjusting rate limits', {
          oldMultiplier: this.currentMultiplier,
          newMultiplier,
          metrics
        });
        
        this.currentMultiplier = newMultiplier;
        this.lastAdjustment = Date.now();
      }

    } catch (error) {
      logger.error('Failed to adjust rate limits', error);
    }
  }

  /**
   * Get basic system metrics
   */
  private async getSystemMetrics(): Promise<{
    cpuUsage: number;
    errorRate: number;
    avgResponseTime: number;
    activeConnections: number;
  }> {
    try {
      // Get error rate from recent API usage
      const errorResult = await db.query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status_code >= 400) as error_requests,
          AVG(response_time_ms) as avg_response_time
        FROM api_usage
        WHERE created_at > NOW() - INTERVAL '15 minutes'
      `);

      const row = errorResult.rows[0];
      const totalRequests = parseInt(row.total_requests) || 1;
      const errorRequests = parseInt(row.error_requests) || 0;
      const avgResponseTime = parseFloat(row.avg_response_time) || 0;

      return {
        cpuUsage: 0, // Would need system monitoring integration
        errorRate: (errorRequests / totalRequests) * 100,
        avgResponseTime,
        activeConnections: 0 // Would need connection pool monitoring
      };

    } catch (error) {
      logger.debug('Failed to get system metrics', error);
      return {
        cpuUsage: 0,
        errorRate: 0,
        avgResponseTime: 0,
        activeConnections: 0
      };
    }
  }
}

/**
 * API usage tracking middleware
 */
export const trackApiUsage = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  // Track when response finishes
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      
      await db.query(`
        INSERT INTO api_usage (
          api_key_id, ip_address, endpoint, method, 
          response_time_ms, status_code, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        req.apiKey?.id || null,
        req.ip,
        req.path,
        req.method,
        responseTime,
        res.statusCode,
        req.get('User-Agent') || null
      ]);

    } catch (error) {
      // Don't break the request if analytics fails
      logger.debug('API usage tracking failed', error);
    }
  });

  next();
};

/**
 * Custom rate limit handler for specific endpoints
 */
export const createCustomRateLimiter = (options: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: any) => string;
  skipIf?: (req: any) => boolean;
  message?: string;
}) => {
  const opts: any = {
    store: createRateLimitStore('rl:custom:'),
    windowMs: options.windowMs,
    max: options.max,
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    skip: options.skipIf || (() => false),
    message: {
      success: false,
      error: {
        code: ErrorCodes.RATE_LIMIT,
        message: options.message || 'Rate limit exceeded',
        details: {
          limit: options.max,
          windowMs: options.windowMs,
          retryAfter: Math.ceil(options.windowMs / 1000) + ' seconds'
        }
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  };

  opts.onLimitReached = (req: any, res: any, optsLocal: any) => {
    logger.warn('Custom rate limit reached', {
      ip: req.ip,
      endpoint: req.path,
      limit: optsLocal.max,
      windowMs: optsLocal.windowMs
    });
  };

  return rateLimit(opts) as any;
};


/**
 * Intelligent rate limiter that adapts to user behavior
 */
export class AdaptiveRateLimiter {
  private userProfiles = new Map<string, UserProfile>();

  constructor() {
    // Clean up old profiles every hour
    setInterval(() => {
      this.cleanupProfiles();
    }, 60 * 60 * 1000);
  }

  /**
   * Get adaptive rate limit for user
   */
  async getAdaptiveLimit(userId: string, baseLimit: number): Promise<number> {
    const profile = await this.getUserProfile(userId);
    
    // Adjust limit based on user behavior
    let multiplier = 1.0;

    // Reward good behavior
    if (profile.errorRate < 1) {
      multiplier *= 1.2; // +20% for low error rate
    }

    if (profile.avgResponseTime < 500) {
      multiplier *= 1.1; // +10% for efficient usage
    }

    // Penalize bad behavior
    if (profile.errorRate > 10) {
      multiplier *= 0.7; // -30% for high error rate
    }

    if (profile.burstiness > 0.8) {
      multiplier *= 0.8; // -20% for bursty traffic
    }

    // Account tenure bonus
    const accountAgeMonths = (Date.now() - profile.firstSeen) / (1000 * 60 * 60 * 24 * 30);
    if (accountAgeMonths > 6) {
      multiplier *= 1.1; // +10% for long-term users
    }

    return Math.floor(baseLimit * Math.max(0.5, Math.min(2.0, multiplier)));
  }

  /**
   * Record API usage for behavior analysis
   */
  async recordUsage(
    userId: string, 
    endpoint: string, 
    responseTime: number, 
    statusCode: number
  ): Promise<void> {
    try {
      let profile = this.userProfiles.get(userId);
      
      if (!profile) {
        profile = {
          userId,
          firstSeen: Date.now(),
          totalRequests: 0,
          errorCount: 0,
          totalResponseTime: 0,
          errorRate: 0,
          avgResponseTime: 0,
          burstiness: 0,
          lastRequestTime: 0,
          requestTimes: [],
          endpoints: new Set()
        };
        this.userProfiles.set(userId, profile);
      }

      // Update profile
      profile.totalRequests++;
      profile.totalResponseTime += responseTime;
      profile.lastRequestTime = Date.now();
      profile.endpoints.add(endpoint);
      
      if (statusCode >= 400) {
        profile.errorCount++;
      }

      // Track request timing for burstiness calculation
      profile.requestTimes.push(Date.now());
      if (profile.requestTimes.length > 20) {
        profile.requestTimes = profile.requestTimes.slice(-20); // Keep last 20
      }

      // Calculate derived metrics
      profile.errorRate = (profile.errorCount / profile.totalRequests) * 100;
      profile.avgResponseTime = profile.totalResponseTime / profile.totalRequests;
      profile.burstiness = this.calculateBurstiness(profile.requestTimes);

    } catch (error) {
      logger.debug('Failed to record usage for adaptive rate limiting', error);
    }
  }

  /**
   * Calculate burstiness score (0 = steady, 1 = very bursty)
   */
  private calculateBurstiness(requestTimes: number[]): number {
    if (requestTimes.length < 5) {
      return 0;
    }

    // Calculate intervals between requests
    const intervals = requestTimes
      .slice(1)
      .map((time, i) => time - requestTimes[i]);

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation as burstiness measure
    return avgInterval > 0 ? Math.min(1, stdDev / avgInterval) : 0;
  }

  /**
   * Get or create user profile
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      // Load from database or create new
      try {
        const result = await db.query(`
          SELECT 
            COUNT(*) as total_requests,
            COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
            AVG(response_time_ms) as avg_response_time,
            MIN(created_at) as first_seen
          FROM api_usage
          WHERE api_key_id = $1 OR ip_address = $1
        `, [userId]);

        const row = result.rows[0];
        profile = {
          userId,
          firstSeen: row.first_seen ? new Date(row.first_seen).getTime() : Date.now(),
          totalRequests: parseInt(row.total_requests) || 0,
          errorCount: parseInt(row.error_count) || 0,
          totalResponseTime: (parseInt(row.total_requests) || 0) * (parseFloat(row.avg_response_time) || 0),
          errorRate: row.total_requests > 0 ? (parseInt(row.error_count) / parseInt(row.total_requests)) * 100 : 0,
          avgResponseTime: parseFloat(row.avg_response_time) || 0,
          lastRequestTime: Date.now(),
          requestTimes: [],
          burstiness: 0,
          endpoints: new Set()
        };

      } catch (error) {
        // Create default profile
        profile = {
          userId,
          firstSeen: Date.now(),
          totalRequests: 0,
          errorCount: 0,
          totalResponseTime: 0,
          errorRate: 0,
          avgResponseTime: 0,
          lastRequestTime: Date.now(),
          requestTimes: [],
          burstiness: 0,
          endpoints: new Set()
        };
      }

      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Clean up old user profiles
   */
  private cleanupProfiles(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [userId, profile] of this.userProfiles.entries()) {
      if (profile.lastRequestTime < oneDayAgo) {
        this.userProfiles.delete(userId);
      }
    }

    logger.debug(`Cleaned up rate limiter profiles, ${this.userProfiles.size} active profiles remaining`);
  }
}

interface UserProfile {
  userId: string;
  firstSeen: number;
  totalRequests: number;
  errorCount: number;
  totalResponseTime: number;
  errorRate: number;
  avgResponseTime: number;
  lastRequestTime: number;
  requestTimes: number[];
  burstiness: number;
  endpoints: Set<string>;
}

// Export singleton instance
export const adaptiveRateLimiter = new AdaptiveRateLimiter();

/**
 * Rate limit status endpoint
 */
export async function getRateLimitStatus(req: any, res: any) {
  try {
    const userId = req.apiKey?.id || req.user?.id || req.ip;
    const userType = req.apiKey ? 'authenticated' : 'anonymous';
    
    const currentLimit = await adaptiveRateLimiter.getAdaptiveLimit(userId, userType === 'authenticated' ? 1000 : 100);
    
    // Get current usage from Redis
    const redis = db.getRedis();
    const key = `rl:${userType === 'authenticated' ? 'auth' : 'anon'}:${userId}`;
    const currentUsage = await redis.get(key) || 0;

    res.json({
      success: true,
      data: {
        userType,
        currentLimit,
        currentUsage: parseInt(currentUsage.toString()),
        remaining: Math.max(0, currentLimit - parseInt(currentUsage.toString())),
        resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
        adaptive: true
      }
    });

  } catch (error) {
    logger.error('Failed to get rate limit status', error);
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Failed to get rate limit status'
      }
    });
  }
}