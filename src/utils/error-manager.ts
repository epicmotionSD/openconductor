/**
 * ErrorManager Implementation
 * 
 * Enterprise-grade error handling and management for OpenConductor
 */

import { 
  OpenConductorError,
  ErrorSeverity,
  ErrorCategory,
  AgentError,
  OrchestrationError,
  ConfigurationError,
  PluginError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  SystemError
} from '../types/errors';
import { Logger } from './logger';

export class ErrorManager {
  private logger: Logger;
  private errorHandlers: Map<string, (error: OpenConductorError) => void> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupDefaultHandlers();
  }

  /**
   * Handle an error based on its type and severity
   */
  handleError(error: OpenConductorError): void {
    // Log the error
    this.logError(error);

    // Get specific handler for this error type
    const handler = this.errorHandlers.get(error.code) || this.errorHandlers.get('default');
    if (handler) {
      handler(error);
    }

    // For critical errors, consider system shutdown
    if (error.severity === 'critical') {
      this.handleCriticalError(error);
    }
  }

  /**
   * Register a custom error handler
   */
  registerHandler(errorCode: string, handler: (error: OpenConductorError) => void): void {
    this.errorHandlers.set(errorCode, handler);
  }

  /**
   * Create a standardized error from an unknown error
   */
  createError(
    code: string,
    message: string,
    category: ErrorCategory = 'system',
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>,
    cause?: Error
  ): OpenConductorError {
    return {
      code,
      message,
      category,
      severity,
      statusCode: 500,
      timestamp: new Date(),
      context: context || {},
      stack: new Error().stack,
      recoverable: severity !== 'critical',
      name: code,
      toJSON: function() {
        return {
          name: this.name,
          code: this.code,
          message: this.message,
          category: this.category,
          severity: this.severity,
          statusCode: this.statusCode,
          timestamp: this.timestamp,
          context: this.context,
          recoverable: this.recoverable
        };
      },
      cause: cause ? {
        name: cause.name,
        message: cause.message,
        stack: cause.stack
      } : undefined
    };
  }

  /**
   * Wrap and standardize native JavaScript errors
   */
  wrapError(error: Error, context?: Record<string, any>): OpenConductorError {
    return this.createError(
      'SYSTEM_UNKNOWN',
      error.message,
      'system',
      'high',
      context,
      error
    );
  }

  /**
   * Create specific error types
   */
  createAgentError(
    code: string,
    message: string,
    agentId: string,
    severity: ErrorSeverity = 'medium'
  ): AgentError {
    const baseError = this.createError(code, message, 'agent', severity);
    return {
      ...baseError,
      agentId,
      agentType: 'unknown', // Would be populated from agent registry
      toJSON: function() {
        return {
          ...baseError.toJSON(),
          agentId: this.agentId,
          agentType: this.agentType
        };
      }
    };
  }

  createOrchestrationError(
    code: string,
    message: string,
    workflowId?: string,
    stepId?: string,
    severity: ErrorSeverity = 'medium'
  ): OrchestrationError {
    const baseError = this.createError(code, message, 'orchestration', severity);
    return {
      ...baseError,
      workflowId,
      stepId,
      toJSON: function() {
        return {
          ...baseError.toJSON(),
          workflowId: this.workflowId,
          stepId: this.stepId
        };
      }
    };
  }

  createValidationError(
    field: string,
    value: any,
    rule: string,
    message?: string
  ): ValidationError {
    const baseError = this.createError(
      'VALIDATION_FAILED',
      message || `Validation failed for field '${field}'`,
      'validation',
      'low'
    );
    return {
      ...baseError,
      field,
      value,
      rule,
      toJSON: function() {
        return {
          ...baseError.toJSON(),
          field: this.field,
          value: this.value,
          rule: this.rule
        };
      }
    };
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverable(error: OpenConductorError): boolean {
    const nonRecoverableErrors = [
      'CONFIG_INVALID',
      'SYSTEM_OUT_OF_MEMORY',
      'SYSTEM_DISK_FULL',
      'AUTH_INVALID_TOKEN',
      'PLUGIN_SECURITY_VIOLATION'
    ];

    return !nonRecoverableErrors.includes(error.code) && error.severity !== 'critical';
  }

  /**
   * Get error metrics for monitoring
   */
  getErrorMetrics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  } {
    // In a real implementation, this would aggregate from stored metrics
    return {
      totalErrors: 0,
      errorsByCategory: {
        agent: 0,
        orchestration: 0,
        plugin: 0,
        api: 0,
        auth: 0,
        validation: 0,
        network: 0,
        system: 0,
        user: 0
      },
      errorsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };
  }

  /**
   * Event listener method for compatibility with conductor
   */
  on(event: string, callback: (error: any) => void): void {
    // Simple implementation - in production would use EventBus
    if (event === 'error') {
      this.registerHandler('default', callback);
    }
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up ErrorManager');
    this.errorHandlers.clear();
  }

  private setupDefaultHandlers(): void {
    // Default error handler
    this.errorHandlers.set('default', (error) => {
      // Default handling logic - could include retries, notifications, etc.
    });

    // Agent error handler
    this.errorHandlers.set('AGENT_EXECUTION_FAILED', (error) => {
      // Could trigger agent restart, fallback, or circuit breaker
    });

    // Orchestration error handler  
    this.errorHandlers.set('WORKFLOW_EXECUTION_FAILED', (error) => {
      // Could trigger workflow retry or compensation logic
    });
  }

  private logError(error: OpenConductorError): void {
    const logLevel = this.getLogLevel(error.severity);
    
    this.logger[logLevel](`${error.category.toUpperCase()}_ERROR: ${error.message}`, {
      code: error.code,
      category: error.category,
      severity: error.severity,
      context: error.context,
      stack: error.stack,
      cause: error.cause
    });
  }

  private getLogLevel(severity: ErrorSeverity): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warn';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'warn';
    }
  }

  private handleCriticalError(error: OpenConductorError): void {
    // For critical errors, we might want to:
    // 1. Send alerts to administrators
    // 2. Trigger graceful shutdown if necessary
    // 3. Save state for recovery
    // 4. Activate circuit breakers
    
    this.logger.error('CRITICAL ERROR DETECTED - System stability may be compromised', {
      error: error.code,
      message: error.message,
      context: error.context
    });
  }
}