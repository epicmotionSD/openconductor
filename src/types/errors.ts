/**
 * OpenConductor Error Types
 *
 * Comprehensive error handling system for the OpenConductor platform.
 * Designed for enterprise-grade error tracking, reporting, and recovery.
 *
 * "The sovereign choice for regulated industries"
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
  | 'agent'
  | 'orchestration'
  | 'plugin'
  | 'api'
  | 'auth'
  | 'validation'
  | 'network'
  | 'system'
  | 'user';

/**
 * Base OpenConductor Error
 *
 * All errors in the OpenConductor system extend this base class
 */
export abstract class OpenConductorError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  public readonly metadata?: Record<string, any>;
  public readonly cause?: Error;
  public readonly recoverable: boolean;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: Record<string, any>;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
    this.metadata = options?.metadata;
    this.cause = options?.cause;
    this.recoverable = options?.recoverable ?? false;
    this.severity = options?.severity ?? 'medium';
    this.category = options?.category ?? 'system';
    this.context = options?.context ?? {};

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for serialization
   */
  toJSON(): ErrorJSON {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      metadata: this.metadata,
      recoverable: this.recoverable,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack,
      } : undefined,
    };
  }
}

/**
 * Agent Errors
 */
export class AgentError extends OpenConductorError {
  public readonly agentId?: string;
  public readonly agentType?: string;

  constructor(
    message: string,
    code: string,
    agentId?: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
      agentType?: string;
    }
  ) {
    super(message, code, 422, {
      ...options,
      category: 'agent',
      severity: options?.recoverable ? 'medium' : 'high'
    });
    this.agentId = agentId;
    this.agentType = options?.agentType;
  }
}

export class AgentNotFoundError extends AgentError {
  constructor(agentId: string, correlationId?: string) {
    super(
      `Agent not found: ${agentId}`,
      'AGENT_NOT_FOUND',
      agentId,
      { correlationId, recoverable: false }
    );
  }
}

export class AgentExecutionError extends AgentError {
  public readonly executionId?: string;

  constructor(
    message: string,
    agentId: string,
    executionId?: string,
    cause?: Error,
    correlationId?: string
  ) {
    super(
      message,
      'AGENT_EXECUTION_ERROR',
      agentId,
      { cause, correlationId, recoverable: true, metadata: { executionId } }
    );
    this.executionId = executionId;
  }
}

export class AgentTimeoutError extends AgentError {
  public readonly timeoutMs: number;

  constructor(agentId: string, timeoutMs: number, correlationId?: string) {
    super(
      `Agent execution timed out after ${timeoutMs}ms`,
      'AGENT_TIMEOUT',
      agentId,
      { correlationId, recoverable: true, metadata: { timeoutMs } }
    );
    this.timeoutMs = timeoutMs;
  }
}

export class AgentConfigurationError extends AgentError {
  constructor(message: string, agentId: string, correlationId?: string) {
    super(
      message,
      'AGENT_CONFIGURATION_ERROR',
      agentId,
      { correlationId, recoverable: false }
    );
  }
}

/**
 * Workflow Errors
 */
export class WorkflowError extends OpenConductorError {
  public readonly workflowId?: string;
  public readonly executionId?: string;

  constructor(
    message: string,
    code: string,
    workflowId?: string,
    executionId?: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
    }
  ) {
    super(message, code, 422, {
      ...options,
      category: 'orchestration',
      severity: options?.recoverable ? 'medium' : 'high'
    });
    this.workflowId = workflowId;
    this.executionId = executionId;
  }
}

/**
 * Orchestration Error (alias for WorkflowError for compatibility)
 */
export class OrchestrationError extends WorkflowError {
  public readonly stepId?: string;

  constructor(
    message: string,
    code: string,
    workflowId?: string,
    stepId?: string,
    executionId?: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
    }
  ) {
    super(message, code, workflowId, executionId, options);
    this.stepId = stepId;
  }
}

export class WorkflowNotFoundError extends WorkflowError {
  constructor(workflowId: string, correlationId?: string) {
    super(
      `Workflow not found: ${workflowId}`,
      'WORKFLOW_NOT_FOUND',
      workflowId,
      undefined,
      { correlationId, recoverable: false }
    );
  }
}

export class WorkflowExecutionError extends WorkflowError {
  public readonly stepId?: string;

  constructor(
    message: string,
    workflowId: string,
    executionId: string,
    stepId?: string,
    cause?: Error,
    correlationId?: string
  ) {
    super(
      message,
      'WORKFLOW_EXECUTION_ERROR',
      workflowId,
      executionId,
      { cause, correlationId, recoverable: true, metadata: { stepId } }
    );
    this.stepId = stepId;
  }
}

export class WorkflowValidationError extends WorkflowError {
  public readonly validationErrors: ValidationError[];

  constructor(
    workflowId: string,
    validationErrors: ValidationError[],
    correlationId?: string
  ) {
    const message = `Workflow validation failed: ${validationErrors.map(e => e.message).join(', ')}`;
    super(
      message,
      'WORKFLOW_VALIDATION_ERROR',
      workflowId,
      undefined,
      { correlationId, recoverable: false, metadata: { validationErrors } }
    );
    this.validationErrors = validationErrors;
  }
}

/**
 * Tool Errors
 */
export class ToolError extends OpenConductorError {
  public readonly toolId?: string;

  constructor(
    message: string,
    code: string,
    toolId?: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
    }
  ) {
    super(message, code, 422, options);
    this.toolId = toolId;
  }
}

export class ToolNotFoundError extends ToolError {
  constructor(toolId: string, correlationId?: string) {
    super(
      `Tool not found: ${toolId}`,
      'TOOL_NOT_FOUND',
      toolId,
      { correlationId, recoverable: false }
    );
  }
}

export class ToolExecutionError extends ToolError {
  public readonly operation?: string;

  constructor(
    message: string,
    toolId: string,
    operation?: string,
    cause?: Error,
    correlationId?: string
  ) {
    super(
      message,
      'TOOL_EXECUTION_ERROR',
      toolId,
      { cause, correlationId, recoverable: true, metadata: { operation } }
    );
    this.operation = operation;
  }
}

export class ToolConnectionError extends ToolError {
  constructor(toolId: string, endpoint: string, cause?: Error, correlationId?: string) {
    super(
      `Failed to connect to tool endpoint: ${endpoint}`,
      'TOOL_CONNECTION_ERROR',
      toolId,
      { cause, correlationId, recoverable: true, metadata: { endpoint } }
    );
  }
}

/**
 * Plugin Errors
 */
export class PluginError extends OpenConductorError {
  public readonly pluginId?: string;

  constructor(
    message: string,
    code: string,
    pluginId?: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
    }
  ) {
    super(message, code, 422, options);
    this.pluginId = pluginId;
  }
}

export class PluginNotFoundError extends PluginError {
  constructor(pluginId: string, correlationId?: string) {
    super(
      `Plugin not found: ${pluginId}`,
      'PLUGIN_NOT_FOUND',
      pluginId,
      { correlationId, recoverable: false }
    );
  }
}

export class PluginLoadError extends PluginError {
  constructor(pluginId: string, cause?: Error, correlationId?: string) {
    super(
      `Failed to load plugin: ${pluginId}`,
      'PLUGIN_LOAD_ERROR',
      pluginId,
      { cause, correlationId, recoverable: false }
    );
  }
}

export class PluginSecurityError extends PluginError {
  public readonly violation: string;

  constructor(pluginId: string, violation: string, correlationId?: string) {
    super(
      `Plugin security violation: ${violation}`,
      'PLUGIN_SECURITY_ERROR',
      pluginId,
      { correlationId, recoverable: false, metadata: { violation } }
    );
    this.violation = violation;
  }
}

/**
 * API Errors
 */
export class APIError extends OpenConductorError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
      category?: ErrorCategory;
    }
  ) {
    super(message, code, statusCode, options);
  }
}

export class ValidationError extends APIError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly rule?: string;

  constructor(
    message: string,
    field?: string,
    value?: any,
    correlationId?: string,
    rule?: string
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      { correlationId, recoverable: false, metadata: { field, value, rule }, category: 'validation' }
    );
    this.field = field;
    this.value = value;
    this.rule = rule;
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required', correlationId?: string) {
    super(message, 'AUTHENTICATION_ERROR', 401, { correlationId, recoverable: false });
  }
}

export class AuthorizationError extends APIError {
  public readonly requiredPermission?: string;

  constructor(
    message: string = 'Insufficient permissions',
    requiredPermission?: string,
    correlationId?: string
  ) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      { correlationId, recoverable: false, metadata: { requiredPermission } }
    );
    this.requiredPermission = requiredPermission;
  }
}

export class NotFoundError extends APIError {
  public readonly resource?: string;
  public readonly resourceId?: string;

  constructor(
    resource?: string,
    resourceId?: string,
    correlationId?: string
  ) {
    const message = resource && resourceId 
      ? `${resource} not found: ${resourceId}`
      : 'Resource not found';
    super(
      message,
      'NOT_FOUND',
      404,
      { correlationId, recoverable: false, metadata: { resource, resourceId } }
    );
    this.resource = resource;
    this.resourceId = resourceId;
  }
}

export class ConflictError extends APIError {
  public readonly conflictingResource?: string;

  constructor(
    message: string,
    conflictingResource?: string,
    correlationId?: string
  ) {
    super(
      message,
      'CONFLICT_ERROR',
      409,
      { correlationId, recoverable: false, metadata: { conflictingResource } }
    );
    this.conflictingResource = conflictingResource;
  }
}

export class RateLimitError extends APIError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    correlationId?: string
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      { correlationId, recoverable: true, metadata: { retryAfter } }
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * System Errors
 */
export class SystemError extends OpenConductorError {
  public readonly component?: string;

  constructor(
    message: string,
    code: string,
    component?: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
    }
  ) {
    super(message, code, 500, options);
    this.component = component;
  }
}

export class DatabaseError extends SystemError {
  constructor(message: string, cause?: Error, correlationId?: string) {
    super(
      message,
      'DATABASE_ERROR',
      'database',
      { cause, correlationId, recoverable: true }
    );
  }
}

export class CacheError extends SystemError {
  constructor(message: string, cause?: Error, correlationId?: string) {
    super(
      message,
      'CACHE_ERROR',
      'cache',
      { cause, correlationId, recoverable: true }
    );
  }
}

export class ConfigurationError extends SystemError {
  public readonly configPath?: string;

  constructor(message: string, configPath?: string, correlationId?: string) {
    super(
      message,
      'CONFIGURATION_ERROR',
      'config',
      { correlationId, recoverable: false, metadata: { configPath } }
    );
    this.configPath = configPath;
  }
}

export class DependencyError extends SystemError {
  public readonly dependency: string;

  constructor(message: string, dependency: string, cause?: Error, correlationId?: string) {
    super(
      message,
      'DEPENDENCY_ERROR',
      'dependency',
      { cause, correlationId, recoverable: true, metadata: { dependency } }
    );
    this.dependency = dependency;
  }
}

/**
 * Enterprise Errors
 */
export class EnterpriseError extends OpenConductorError {
  constructor(
    message: string,
    code: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: Record<string, any>;
      recoverable?: boolean;
    }
  ) {
    super(message, code, 422, options);
  }
}

export class LicenseError extends EnterpriseError {
  constructor(message: string, correlationId?: string) {
    super(
      message,
      'LICENSE_ERROR',
      { correlationId, recoverable: false }
    );
  }
}

export class ComplianceError extends EnterpriseError {
  public readonly requirement: string;

  constructor(message: string, requirement: string, correlationId?: string) {
    super(
      message,
      'COMPLIANCE_ERROR',
      { correlationId, recoverable: false, metadata: { requirement } }
    );
    this.requirement = requirement;
  }
}

export class AuditError extends EnterpriseError {
  constructor(message: string, cause?: Error, correlationId?: string) {
    super(
      message,
      'AUDIT_ERROR',
      { cause, correlationId, recoverable: true }
    );
  }
}

/**
 * Error JSON Representation
 */
export interface ErrorJSON {
  name: string;
  message: string;
  code: string;
  statusCode: number;
  timestamp: Date;
  correlationId?: string;
  metadata?: Record<string, any>;
  recoverable: boolean;
  stack?: string;
  cause?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Error Handler Interface
 */
export interface ErrorHandler {
  // Error handling
  handle(error: Error, context?: ErrorContext): Promise<void>;
  
  // Error reporting
  report(error: Error, context?: ErrorContext): Promise<void>;
  
  // Error recovery
  recover?(error: Error, context?: ErrorContext): Promise<boolean>;
  
  // Error filtering
  shouldHandle(error: Error): boolean;
  shouldReport(error: Error): boolean;
}

/**
 * Error Context
 */
export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  agentId?: string;
  workflowId?: string;
  executionId?: string;
  requestId?: string;
  sessionId?: string;
  
  // Request context
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  
  // Environment context
  environment: string;
  service: string;
  version: string;
  instanceId: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Error Reporter Interface
 */
export interface ErrorReporter {
  // Report error
  report(error: Error, context?: ErrorContext): Promise<void>;
  
  // Report batch of errors
  reportBatch(errors: Array<{ error: Error; context?: ErrorContext }>): Promise<void>;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

/**
 * Error Recovery Strategy
 */
export interface ErrorRecoveryStrategy {
  name: string;
  canRecover(error: Error): boolean;
  recover(error: Error, context?: ErrorContext): Promise<boolean>;
  priority: number; // Higher number = higher priority
}

/**
 * Error Manager
 */
export interface ErrorManager {
  // Error handling
  handleError(error: Error, context?: ErrorContext): Promise<void>;
  
  // Error recovery
  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
  removeRecoveryStrategy(name: string): void;
  
  // Error reporting
  addReporter(reporter: ErrorReporter): void;
  removeReporter(reporter: ErrorReporter): void;
  
  // Error handlers
  addHandler(handler: ErrorHandler): void;
  removeHandler(handler: ErrorHandler): void;
  
  // Error metrics
  getErrorMetrics(): Promise<ErrorMetrics>;
  
  // Configuration
  configure(config: ErrorManagerConfig): void;
}

/**
 * Error Metrics
 */
export interface ErrorMetrics {
  timestamp: Date;
  
  // Error counts
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorsByComponent: Record<string, number>;
  
  // Error rates
  errorRate: number; // Errors per minute
  recoveryRate: number; // Percentage of errors recovered
  
  // Response metrics
  averageHandlingTime: number;
  averageReportingTime: number;
  
  // Trends
  errorTrend: Array<{
    timestamp: Date;
    count: number;
    rate: number;
  }>;
}

/**
 * Error Manager Configuration
 */
export interface ErrorManagerConfig {
  // Global error handling
  enableGlobalHandler: boolean;
  logAllErrors: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Error reporting
  enableReporting: boolean;
  reportingThreshold: 'all' | 'warn' | 'error';
  
  // Error recovery
  enableRecovery: boolean;
  maxRecoveryAttempts: number;
  recoveryTimeout: number;
  
  // Error filtering
  ignorePatterns: string[];
  ignoreErrorCodes: string[];
  
  // Rate limiting
  enableRateLimit: boolean;
  maxErrorsPerMinute: number;
  
  // Alerting
  enableAlerting: boolean;
  alertingRules: Array<{
    condition: string;
    threshold: number;
    timeWindow: number; // Minutes
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

/**
 * Default Error Manager Configuration
 */
export const DEFAULT_ERROR_CONFIG: ErrorManagerConfig = {
  enableGlobalHandler: true,
  logAllErrors: true,
  logLevel: 'error',
  enableReporting: true,
  reportingThreshold: 'error',
  enableRecovery: true,
  maxRecoveryAttempts: 3,
  recoveryTimeout: 30000,
  ignorePatterns: [],
  ignoreErrorCodes: [],
  enableRateLimit: true,
  maxErrorsPerMinute: 100,
  enableAlerting: true,
  alertingRules: [
    {
      condition: 'errorRate > 10',
      threshold: 10,
      timeWindow: 5,
      severity: 'high',
    },
    {
      condition: 'recoveryRate < 0.8',
      threshold: 0.8,
      timeWindow: 15,
      severity: 'medium',
    },
  ],
};

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: Error): boolean {
    if (error instanceof OpenConductorError) {
      return error.recoverable;
    }
    
    // Common recoverable error patterns
    const recoverablePatterns = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'RATE_LIMIT',
      'SERVICE_UNAVAILABLE',
    ];
    
    return recoverablePatterns.some(pattern => 
      error.message.includes(pattern) || 
      (error as any).code?.includes(pattern)
    );
  }
  
  /**
   * Extract error code from error
   */
  static getErrorCode(error: Error): string {
    if (error instanceof OpenConductorError) {
      return error.code;
    }
    
    return (error as any).code || 'UNKNOWN_ERROR';
  }
  
  /**
   * Create error context from request
   */
  static createContext(req?: any, additional?: Partial<ErrorContext>): ErrorContext {
    return {
      correlationId: req?.headers?.['x-correlation-id'] || additional?.correlationId,
      userId: req?.user?.id || additional?.userId,
      requestId: req?.id || additional?.requestId,
      method: req?.method || additional?.method,
      url: req?.url || additional?.url,
      headers: req?.headers || additional?.headers,
      body: req?.body || additional?.body,
      environment: process.env.NODE_ENV || 'development',
      service: 'openconductor',
      version: '1.0.0',
      instanceId: process.env.INSTANCE_ID || 'default',
      ...additional,
    };
  }
  
  /**
   * Sanitize error for logging (remove sensitive data)
   */
  static sanitize(error: Error): ErrorJSON {
    const errorJson = error instanceof OpenConductorError 
      ? error.toJSON() 
      : {
          name: error.name,
          message: error.message,
          code: ErrorUtils.getErrorCode(error),
          statusCode: 500,
          timestamp: new Date(),
          recoverable: ErrorUtils.isRecoverable(error),
          stack: error.stack,
        };
    
    // Remove sensitive information
    if (errorJson.metadata) {
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
      for (const field of sensitiveFields) {
        if (errorJson.metadata[field]) {
          errorJson.metadata[field] = '[REDACTED]';
        }
      }
    }
    
    return errorJson;
  }
}