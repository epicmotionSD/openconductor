"use strict";
/**
 * ErrorManager Implementation
 *
 * Enterprise-grade error handling and management for OpenConductor
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorManager = void 0;
class ErrorManager {
    logger;
    errorHandlers = new Map();
    constructor(logger) {
        this.logger = logger;
        this.setupDefaultHandlers();
    }
    /**
     * Handle an error based on its type and severity
     */
    handleError(error) {
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
    registerHandler(errorCode, handler) {
        this.errorHandlers.set(errorCode, handler);
    }
    /**
     * Create a standardized error from an unknown error
     */
    createError(code, message, category = 'system', severity = 'medium', context, cause) {
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
            toJSON: function () {
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
    wrapError(error, context) {
        return this.createError('SYSTEM_UNKNOWN', error.message, 'system', 'high', context, error);
    }
    /**
     * Create specific error types
     */
    createAgentError(code, message, agentId, severity = 'medium') {
        const baseError = this.createError(code, message, 'agent', severity);
        return {
            ...baseError,
            agentId,
            agentType: 'unknown', // Would be populated from agent registry
            toJSON: function () {
                return {
                    ...baseError.toJSON(),
                    agentId: this.agentId,
                    agentType: this.agentType
                };
            }
        };
    }
    createOrchestrationError(code, message, workflowId, stepId, severity = 'medium') {
        const baseError = this.createError(code, message, 'orchestration', severity);
        return {
            ...baseError,
            workflowId,
            stepId,
            toJSON: function () {
                return {
                    ...baseError.toJSON(),
                    workflowId: this.workflowId,
                    stepId: this.stepId
                };
            }
        };
    }
    createValidationError(field, value, rule, message) {
        const baseError = this.createError('VALIDATION_FAILED', message || `Validation failed for field '${field}'`, 'validation', 'low');
        return {
            ...baseError,
            field,
            value,
            rule,
            toJSON: function () {
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
    isRecoverable(error) {
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
    getErrorMetrics() {
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
    on(event, callback) {
        // Simple implementation - in production would use EventBus
        if (event === 'error') {
            this.registerHandler('default', callback);
        }
    }
    /**
     * Cleanup method for graceful shutdown
     */
    async cleanup() {
        this.logger.info('Cleaning up ErrorManager');
        this.errorHandlers.clear();
    }
    setupDefaultHandlers() {
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
    logError(error) {
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
    getLogLevel(severity) {
        switch (severity) {
            case 'low': return 'info';
            case 'medium': return 'warn';
            case 'high': return 'error';
            case 'critical': return 'error';
            default: return 'warn';
        }
    }
    handleCriticalError(error) {
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
exports.ErrorManager = ErrorManager;
//# sourceMappingURL=error-manager.js.map