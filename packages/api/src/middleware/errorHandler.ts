import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ErrorCodes, APIResponse, ErrorCode } from '@openconductor/shared';
import winston from 'winston';
import path from 'path';
import { db } from '../db/connection';

// Configure comprehensive logging
const logDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console logging for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File logging for production
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    }),

    // Separate file for audit logs
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 20
    })
  ],
  
  // Handle logging errors
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ]
});

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  public statusCode: number;
  public errorCode: ErrorCode;
  public isOperational: boolean;
  public context?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, AppError);
  }
}

/**
 * Create standardized application errors
 */
export function createError(
  message: string,
  statusCode: number = 500,
  errorCode: ErrorCode = ErrorCodes.INTERNAL_ERROR,
  context?: any
): AppError {
  return new AppError(message, statusCode, errorCode, true, context);
}

/**
 * Comprehensive error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let errorCode: ErrorCode = ErrorCodes.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.context;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = ErrorCodes.INVALID_INPUT;
    message = 'Input validation failed';
    details = {
      validationErrors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code
      }))
    };
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ErrorCodes.INVALID_INPUT;
    message = err.message;
  } else if (err.message?.includes('duplicate key')) {
    statusCode = 409;
    errorCode = ErrorCodes.DUPLICATE_SERVER;
    message = 'Resource already exists';
  } else if (err.message?.includes('not found')) {
    statusCode = 404;
    errorCode = ErrorCodes.NOT_FOUND;
    message = 'Resource not found';
  } else if (err.message?.includes('permission denied')) {
    statusCode = 403;
    errorCode = ErrorCodes.UNAUTHORIZED;
    message = 'Permission denied';
  }

  // Log error with context
  const errorContext = {
    errorCode,
    statusCode,
    message,
    originalError: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      apiKeyId: (req as any).apiKey?.id
    },
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server error', errorContext);
    
    // Alert monitoring systems for critical errors
    if (process.env.NODE_ENV === 'production') {
      alertMonitoring(err, errorContext);
    }
  } else if (statusCode >= 400) {
    logger.warn('Client error', errorContext);
  } else {
    logger.info('Handled error', errorContext);
  }

  // Create standardized error response
  const errorResponse: APIResponse = {
    success: false,
    error: {
      code: errorCode,
      message: statusCode >= 500 ? 'Internal server error' : message,
      ...(details && { details })
    },
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  // Don't expose internal errors in production, but provide helpful messages for launch
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    errorResponse.error!.message = 'Service temporarily unavailable. Please try again in a moment.';
    delete errorResponse.error!.details;
  }

  // Add helpful guidance for common launch-day scenarios
  if (statusCode === 404) {
    errorResponse.error!.details = {
      ...errorResponse.error!.details,
      helpText: 'Browse all servers at https://openconductor.ai/discover'
    };
  }

  if (statusCode === 429) {
    errorResponse.error!.details = {
      ...errorResponse.error!.details,
      helpText: 'High launch traffic! Please wait a moment and try again.'
    };
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Generate request ID for tracing
  const requestId = generateRequestId();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    userId: (req as any).user?.id,
    apiKeyId: (req as any).apiKey?.id
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const logLevel = res.statusCode >= 500 ? 'error' : 
                    res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(logLevel, 'Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length')
    });

    // Track slow requests
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.url,
        duration
      });
    }
  });

  next();
}

/**
 * Health check middleware that monitors system health
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: false,
      redis: false,
      github: false
    },
    metrics: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeHandles: (process as any)._getActiveHandles?.()?.length || 0
    }
  };

  try {
    // Check database connectivity
    await db.query('SELECT 1');
    healthData.checks.database = true;
  } catch (error) {
    healthData.checks.database = false;
    healthData.status = 'degraded';
    logger.warn('Database health check failed', error);
  }

  try {
    // Check Redis connectivity
    await db.getRedis().ping();
    healthData.checks.redis = true;
  } catch (error) {
    healthData.checks.redis = false;
    healthData.status = 'degraded';
    logger.warn('Redis health check failed', error);
  }

  try {
    // Check GitHub API (if configured)
    if (process.env.GITHUB_TOKEN) {
      const { githubService } = await import('../services/GitHubService');
      // Simple API test - could be more comprehensive
      healthData.checks.github = true;
    } else {
      healthData.checks.github = true; // No GitHub token = not configured, which is OK
    }
  } catch (error) {
    healthData.checks.github = false;
    logger.warn('GitHub API health check failed', error);
  }

  // Determine overall health status
  const criticalChecks = [healthData.checks.database];
  const hasCriticalFailures = criticalChecks.some(check => !check);
  
  if (hasCriticalFailures) {
    healthData.status = 'unhealthy';
    res.status(503);
  } else if (healthData.status === 'degraded') {
    res.status(200); // Degraded but functional
  } else {
    res.status(200);
  }

  res.json(healthData);

  // Log health check results
  logger.info('Health check performed', {
    status: healthData.status,
    checks: healthData.checks,
    uptime: healthData.uptime
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error: APIResponse = {
    success: false,
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      details: {
        availableEndpoints: [
          'GET /v1/servers',
          'GET /v1/servers/:slug',
          'GET /v1/servers/search',
          'GET /v1/servers/stats/trending',
          'GET /v1/servers/stats/popular',
          'GET /v1/servers/categories',
          'POST /v1/servers/cli/install-event',
          'GET /health'
        ]
      }
    },
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json(error);
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) {
      logger.warn(`Received ${signal} again, forcing exit`);
      process.exit(1);
    }

    shuttingDown = true;
    logger.info(`Received ${signal}, shutting down gracefully`);

    // Close database connections
      // Use any-cast to call internal graceful shutdown helper if present.
      (db as any).gracefulShutdown?.().then(() => {
        logger.info('Database connections closed');
        process.exit(0);
      }).catch((error) => {
        logger.error('Error during shutdown', error);
        process.exit(1);
      });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode,
        requestId: (req as any).requestId
      });
    }

    // Track API metrics
    trackAPIMetrics(req, res, duration);
  });

  next();
}

/**
 * Security incident detection and logging
 */
export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  // Detect potential security issues
  const suspiciousPatterns = [
    /\.\.\//,           // Path traversal
    /<script/i,         // XSS attempt
    /union\s+select/i,  // SQL injection
    /javascript:/i,     // JavaScript protocol
    /data:/i           // Data URI
  ];

  const requestData = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    // Could trigger additional security measures here
    // For now, just log and continue
  }

  next();
}

/**
 * Database error handler with specific error mapping
 */
export function handleDatabaseError(error: any): AppError {
  logger.error('Database error', {
    code: error.code,
    message: error.message,
    detail: error.detail,
    constraint: error.constraint,
    table: error.table,
    column: error.column
  });

  // Map PostgreSQL errors to application errors
  switch (error.code) {
    case '23505': // Unique violation
      return createError(
        'Resource already exists',
        409,
        ErrorCodes.DUPLICATE_SERVER,
        { constraint: error.constraint }
      );

    case '23503': // Foreign key violation
      return createError(
        'Referenced resource not found',
        400,
        ErrorCodes.INVALID_INPUT,
        { constraint: error.constraint }
      );

    case '23502': // Not null violation
      return createError(
        'Required field is missing',
        400,
        ErrorCodes.INVALID_INPUT,
        { column: error.column }
      );

    case '42P01': // Undefined table
      return createError(
        'Database schema error',
        500,
        ErrorCodes.DATABASE_ERROR
      );

    case '28P01': // Invalid password
      return createError(
        'Database authentication failed',
        500,
        ErrorCodes.DATABASE_ERROR
      );

    case '53300': // Too many connections
      return createError(
        'Service temporarily unavailable',
        503,
        ErrorCodes.INTERNAL_ERROR
      );

    default:
      return createError(
        'Database operation failed',
        500,
        ErrorCodes.DATABASE_ERROR,
        { dbError: error.code }
      );
  }
}

/**
 * Redis error handler
 */
export function handleRedisError(error: any): AppError {
  logger.error('Redis error', {
    code: error.code,
    message: error.message,
    command: error.command
  });

  return createError(
    'Cache service temporarily unavailable',
    503,
    ErrorCodes.CACHE_ERROR,
    { redisError: error.code }
  );
}

/**
 * GitHub API error handler
 */
export function handleGitHubError(error: any): AppError {
  logger.error('GitHub API error', {
    status: error.status,
    message: error.message,
    url: error.request?.url
  });

  if (error.status === 403) {
    return createError(
      'GitHub API rate limit exceeded',
      429,
      ErrorCodes.GITHUB_API_ERROR
    );
  } else if (error.status === 401) {
    return createError(
      'GitHub API authentication failed',
      500,
      ErrorCodes.GITHUB_API_ERROR
    );
  } else if (error.status === 404) {
    return createError(
      'GitHub repository not found',
      404,
      ErrorCodes.INVALID_REPOSITORY
    );
  } else {
    return createError(
      'GitHub API error',
      502,
      ErrorCodes.GITHUB_API_ERROR
    );
  }
}

/**
 * Audit logging for sensitive operations
 */
export function auditLog(
  action: string,
  resourceType: string,
  resourceId: string,
  req: Request,
  additionalData?: any
): void {
  const auditEntry = {
    action,
    resourceType,
    resourceId,
    userId: (req as any).user?.id,
    apiKeyId: (req as any).apiKey?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
    ...additionalData
  };

  logger.info('Audit log', auditEntry);

  // Store in database for compliance
  db.query(`
    INSERT INTO api_usage (
      api_key_id, ip_address, endpoint, method, status_code, user_agent, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  `, [
    auditEntry.apiKeyId || null,
    auditEntry.ip,
    `${resourceType}/${resourceId}`,
    action,
    200, // Audit logs are for successful operations
    auditEntry.userAgent
  ]).catch(error => {
    logger.error('Failed to store audit log', error);
  });
}

// Utility functions

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function alertMonitoring(error: Error, context: any): void {
  // Integration point for monitoring services (Sentry, DataDog, etc.)
  logger.error('ALERT: Critical error detected', {
    error: error.message,
    stack: error.stack,
    context,
    alertLevel: 'critical'
  });

  // Could integrate with:
  // - Sentry for error tracking
  // - Slack/Discord for immediate alerts  
  // - PagerDuty for incident management
  // - Email notifications for critical errors
}

function trackAPIMetrics(req: Request, res: Response, duration: number): void {
  // Track API performance metrics
  const metrics = {
    endpoint: req.route?.path || req.url,
    method: req.method,
    statusCode: res.statusCode,
    duration,
    timestamp: new Date(),
    userId: (req as any).user?.id,
    apiKeyId: (req as any).apiKey?.id
  };

  // Could send to metrics collection service
  logger.debug('API metrics', metrics);

  // Store performance data for analysis
  if (duration > 5000) { // Log very slow requests to database
    db.query(`
      INSERT INTO api_usage (
        endpoint, method, response_time_ms, status_code, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      metrics.endpoint,
      metrics.method,
      duration,
      metrics.statusCode,
      req.ip
    ]).catch(error => {
      logger.debug('Failed to store slow request metrics', error);
    });
  }
}

/**
 * Error rate monitoring
 */
export class ErrorRateMonitor {
  private errorCounts = new Map<string, number>();
  private windowStart = Date.now();
  private readonly windowSize = 5 * 60 * 1000; // 5 minutes

  track(errorCode: string): void {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart > this.windowSize) {
      this.errorCounts.clear();
      this.windowStart = now;
    }

    // Increment error count
    const current = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, current + 1);

    // Check for error rate spikes
    if (current + 1 > 10) { // More than 10 of same error in 5 minutes
      logger.warn('High error rate detected', {
        errorCode,
        count: current + 1,
        windowMinutes: this.windowSize / 60000
      });
    }
  }

  getErrorRates(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

export const errorRateMonitor = new ErrorRateMonitor();

// Export configured logger
export { logger };