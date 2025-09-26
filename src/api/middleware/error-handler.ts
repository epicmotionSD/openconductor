/**
 * OpenConductor Error Handler Middleware
 * 
 * Comprehensive error handling with structured error responses
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  field?: string;
  isOperational?: boolean;
}

/**
 * Create error handler middleware
 */
export function createErrorHandler(
  logger: Logger,
  errorManager: ErrorManager
) {
  return (error: APIError, req: Request, res: Response, next: NextFunction) => {
    // If response already sent, delegate to default Express error handler
    if (res.headersSent) {
      return next(error);
    }

    const requestId = (req as any).requestId;
    const startTime = (req as any).startTime || Date.now();
    const duration = Date.now() - startTime;

    // Log error with context
    logger.error('Request error occurred', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: error.statusCode || 500,
      errorCode: error.code,
      errorMessage: error.message,
      errorStack: error.stack,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    // Handle specific error types
    const errorResponse = handleError(error, logger, errorManager);

    // Send error response
    res.status(errorResponse.statusCode).json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
        ...(errorResponse.details && { details: errorResponse.details }),
        ...(errorResponse.field && { field: errorResponse.field })
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: 'v1'
      }
    });

    // Report error to error manager if it's operational
    if (error.isOperational !== false) {
      const managedError = errorManager.createError(
        error.code || 'UNKNOWN_ERROR',
        error.message,
        'api',
        determineSeverity(errorResponse.statusCode),
        {
          requestId,
          method: req.method,
          url: req.url,
          userId: req.user?.id,
          statusCode: errorResponse.statusCode
        },
        error
      );

      errorManager.handleError(managedError);
    }
  };
}

/**
 * Handle different types of errors
 */
function handleError(
  error: APIError,
  logger: Logger,
  errorManager: ErrorManager
): {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
  field?: string;
} {
  // Pre-defined error with status code
  if (error.statusCode) {
    return {
      statusCode: error.statusCode,
      code: error.code || getDefaultErrorCode(error.statusCode),
      message: error.message,
      details: error.details,
      field: error.field
    };
  }

  // Validation errors (Joi)
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: (error as any).details?.map((detail: any) => ({
        field: detail.path?.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    };
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    };
  }

  // Database errors
  if (error.name === 'SequelizeError' || error.name === 'DatabaseError') {
    logger.error('Database error:', error);
    return {
      statusCode: 500,
      code: 'DATABASE_ERROR',
      message: 'Database operation failed'
    };
  }

  // Network/timeout errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'External service unavailable'
    };
  }

  if (error.code === 'ETIMEDOUT') {
    return {
      statusCode: 408,
      code: 'REQUEST_TIMEOUT',
      message: 'Request timeout'
    };
  }

  // Rate limiting errors
  if (error.message && error.message.includes('Too many requests')) {
    return {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests'
    };
  }

  // Agent execution errors
  if (error.name === 'AgentExecutionError') {
    return {
      statusCode: 422,
      code: 'AGENT_EXECUTION_ERROR',
      message: error.message || 'Agent execution failed',
      details: error.details
    };
  }

  // Workflow execution errors
  if (error.name === 'WorkflowExecutionError') {
    return {
      statusCode: 422,
      code: 'WORKFLOW_EXECUTION_ERROR',
      message: error.message || 'Workflow execution failed',
      details: error.details
    };
  }

  // Tool execution errors
  if (error.name === 'ToolExecutionError') {
    return {
      statusCode: 422,
      code: 'TOOL_EXECUTION_ERROR',
      message: error.message || 'Tool execution failed',
      details: error.details
    };
  }

  // Plugin errors
  if (error.name === 'PluginError') {
    return {
      statusCode: 422,
      code: 'PLUGIN_ERROR',
      message: error.message || 'Plugin operation failed',
      details: error.details
    };
  }

  // Configuration errors
  if (error.name === 'ConfigurationError') {
    return {
      statusCode: 500,
      code: 'CONFIGURATION_ERROR',
      message: 'System configuration error'
    };
  }

  // Permission errors
  if (error.name === 'PermissionError') {
    return {
      statusCode: 403,
      code: 'INSUFFICIENT_PERMISSIONS',
      message: error.message || 'Insufficient permissions'
    };
  }

  // Resource not found errors
  if (error.name === 'NotFoundError') {
    return {
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: error.message || 'Resource not found'
    };
  }

  // Conflict errors
  if (error.name === 'ConflictError') {
    return {
      statusCode: 409,
      code: 'RESOURCE_CONFLICT',
      message: error.message || 'Resource conflict'
    };
  }

  // Payload too large
  if (error.code === 'LIMIT_FILE_SIZE' || error.code === 'ENTITY_TOO_LARGE') {
    return {
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload too large'
    };
  }

  // Unsupported media type
  if (error.code === 'UNSUPPORTED_MEDIA_TYPE') {
    return {
      statusCode: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Unsupported media type'
    };
  }

  // Default internal server error
  logger.error('Unhandled error:', {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  });

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  };
}

/**
 * Get default error code for status code
 */
function getDefaultErrorCode(statusCode: number): string {
  const codeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    406: 'NOT_ACCEPTABLE',
    408: 'REQUEST_TIMEOUT',
    409: 'CONFLICT',
    410: 'GONE',
    411: 'LENGTH_REQUIRED',
    412: 'PRECONDITION_FAILED',
    413: 'PAYLOAD_TOO_LARGE',
    414: 'URI_TOO_LONG',
    415: 'UNSUPPORTED_MEDIA_TYPE',
    416: 'RANGE_NOT_SATISFIABLE',
    417: 'EXPECTATION_FAILED',
    418: 'IM_A_TEAPOT',
    421: 'MISDIRECTED_REQUEST',
    422: 'UNPROCESSABLE_ENTITY',
    423: 'LOCKED',
    424: 'FAILED_DEPENDENCY',
    425: 'TOO_EARLY',
    426: 'UPGRADE_REQUIRED',
    428: 'PRECONDITION_REQUIRED',
    429: 'TOO_MANY_REQUESTS',
    431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
    451: 'UNAVAILABLE_FOR_LEGAL_REASONS',
    500: 'INTERNAL_SERVER_ERROR',
    501: 'NOT_IMPLEMENTED',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
    505: 'HTTP_VERSION_NOT_SUPPORTED',
    506: 'VARIANT_ALSO_NEGOTIATES',
    507: 'INSUFFICIENT_STORAGE',
    508: 'LOOP_DETECTED',
    510: 'NOT_EXTENDED',
    511: 'NETWORK_AUTHENTICATION_REQUIRED'
  };

  return codeMap[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * Determine error severity based on status code
 */
function determineSeverity(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
  if (statusCode >= 500) {
    return 'critical';
  } else if (statusCode >= 400) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    'unknown'
  );
}

/**
 * Create async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error classes
 */
export class CustomAPIError extends Error implements APIError {
  statusCode: number;
  code: string;
  details?: any;
  field?: string;
  isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any,
    field?: string
  ) {
    super(message);
    this.name = 'CustomAPIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.field = field;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomAPIError {
  constructor(message: string, details?: any, field?: string) {
    super(400, 'VALIDATION_ERROR', message, details, field);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends CustomAPIError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(404, 'RESOURCE_NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CustomAPIError {
  constructor(message: string, details?: any) {
    super(409, 'RESOURCE_CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

export class PermissionError extends CustomAPIError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, 'INSUFFICIENT_PERMISSIONS', message);
    this.name = 'PermissionError';
  }
}

export class AgentExecutionError extends CustomAPIError {
  constructor(message: string, details?: any) {
    super(422, 'AGENT_EXECUTION_ERROR', message, details);
    this.name = 'AgentExecutionError';
  }
}

export class WorkflowExecutionError extends CustomAPIError {
  constructor(message: string, details?: any) {
    super(422, 'WORKFLOW_EXECUTION_ERROR', message, details);
    this.name = 'WorkflowExecutionError';
  }
}

export class ToolExecutionError extends CustomAPIError {
  constructor(message: string, details?: any) {
    super(422, 'TOOL_EXECUTION_ERROR', message, details);
    this.name = 'ToolExecutionError';
  }
}

export class PluginError extends CustomAPIError {
  constructor(message: string, details?: any) {
    super(422, 'PLUGIN_ERROR', message, details);
    this.name = 'PluginError';
  }
}

export class ConfigurationError extends CustomAPIError {
  constructor(message: string, details?: any) {
    super(500, 'CONFIGURATION_ERROR', message, details);
    this.name = 'ConfigurationError';
  }
}