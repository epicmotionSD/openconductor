"use strict";
/**
 * OpenConductor Error Types
 *
 * Comprehensive error handling system for the OpenConductor platform.
 * Designed for enterprise-grade error tracking, reporting, and recovery.
 *
 * "The sovereign choice for regulated industries"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorUtils = exports.DEFAULT_ERROR_CONFIG = exports.AuditError = exports.ComplianceError = exports.LicenseError = exports.EnterpriseError = exports.DependencyError = exports.ConfigurationError = exports.CacheError = exports.DatabaseError = exports.SystemError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.APIError = exports.PluginSecurityError = exports.PluginLoadError = exports.PluginNotFoundError = exports.PluginError = exports.ToolConnectionError = exports.ToolExecutionError = exports.ToolNotFoundError = exports.ToolError = exports.WorkflowValidationError = exports.WorkflowExecutionError = exports.WorkflowNotFoundError = exports.OrchestrationError = exports.WorkflowError = exports.AgentConfigurationError = exports.AgentTimeoutError = exports.AgentExecutionError = exports.AgentNotFoundError = exports.AgentError = exports.OpenConductorError = void 0;
/**
 * Base OpenConductor Error
 *
 * All errors in the OpenConductor system extend this base class
 */
class OpenConductorError extends Error {
    code;
    statusCode;
    timestamp;
    correlationId;
    metadata;
    cause;
    recoverable;
    severity;
    category;
    context;
    constructor(message, code, statusCode = 500, options) {
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
    toJSON() {
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
exports.OpenConductorError = OpenConductorError;
/**
 * Agent Errors
 */
class AgentError extends OpenConductorError {
    agentId;
    agentType;
    constructor(message, code, agentId, options) {
        super(message, code, 422, {
            ...options,
            category: 'agent',
            severity: options?.recoverable ? 'medium' : 'high'
        });
        this.agentId = agentId;
        this.agentType = options?.agentType;
    }
}
exports.AgentError = AgentError;
class AgentNotFoundError extends AgentError {
    constructor(agentId, correlationId) {
        super(`Agent not found: ${agentId}`, 'AGENT_NOT_FOUND', agentId, { correlationId, recoverable: false });
    }
}
exports.AgentNotFoundError = AgentNotFoundError;
class AgentExecutionError extends AgentError {
    executionId;
    constructor(message, agentId, executionId, cause, correlationId) {
        super(message, 'AGENT_EXECUTION_ERROR', agentId, { cause, correlationId, recoverable: true, metadata: { executionId } });
        this.executionId = executionId;
    }
}
exports.AgentExecutionError = AgentExecutionError;
class AgentTimeoutError extends AgentError {
    timeoutMs;
    constructor(agentId, timeoutMs, correlationId) {
        super(`Agent execution timed out after ${timeoutMs}ms`, 'AGENT_TIMEOUT', agentId, { correlationId, recoverable: true, metadata: { timeoutMs } });
        this.timeoutMs = timeoutMs;
    }
}
exports.AgentTimeoutError = AgentTimeoutError;
class AgentConfigurationError extends AgentError {
    constructor(message, agentId, correlationId) {
        super(message, 'AGENT_CONFIGURATION_ERROR', agentId, { correlationId, recoverable: false });
    }
}
exports.AgentConfigurationError = AgentConfigurationError;
/**
 * Workflow Errors
 */
class WorkflowError extends OpenConductorError {
    workflowId;
    executionId;
    constructor(message, code, workflowId, executionId, options) {
        super(message, code, 422, {
            ...options,
            category: 'orchestration',
            severity: options?.recoverable ? 'medium' : 'high'
        });
        this.workflowId = workflowId;
        this.executionId = executionId;
    }
}
exports.WorkflowError = WorkflowError;
/**
 * Orchestration Error (alias for WorkflowError for compatibility)
 */
class OrchestrationError extends WorkflowError {
    stepId;
    constructor(message, code, workflowId, stepId, executionId, options) {
        super(message, code, workflowId, executionId, options);
        this.stepId = stepId;
    }
}
exports.OrchestrationError = OrchestrationError;
class WorkflowNotFoundError extends WorkflowError {
    constructor(workflowId, correlationId) {
        super(`Workflow not found: ${workflowId}`, 'WORKFLOW_NOT_FOUND', workflowId, undefined, { correlationId, recoverable: false });
    }
}
exports.WorkflowNotFoundError = WorkflowNotFoundError;
class WorkflowExecutionError extends WorkflowError {
    stepId;
    constructor(message, workflowId, executionId, stepId, cause, correlationId) {
        super(message, 'WORKFLOW_EXECUTION_ERROR', workflowId, executionId, { cause, correlationId, recoverable: true, metadata: { stepId } });
        this.stepId = stepId;
    }
}
exports.WorkflowExecutionError = WorkflowExecutionError;
class WorkflowValidationError extends WorkflowError {
    validationErrors;
    constructor(workflowId, validationErrors, correlationId) {
        const message = `Workflow validation failed: ${validationErrors.map(e => e.message).join(', ')}`;
        super(message, 'WORKFLOW_VALIDATION_ERROR', workflowId, undefined, { correlationId, recoverable: false, metadata: { validationErrors } });
        this.validationErrors = validationErrors;
    }
}
exports.WorkflowValidationError = WorkflowValidationError;
/**
 * Tool Errors
 */
class ToolError extends OpenConductorError {
    toolId;
    constructor(message, code, toolId, options) {
        super(message, code, 422, options);
        this.toolId = toolId;
    }
}
exports.ToolError = ToolError;
class ToolNotFoundError extends ToolError {
    constructor(toolId, correlationId) {
        super(`Tool not found: ${toolId}`, 'TOOL_NOT_FOUND', toolId, { correlationId, recoverable: false });
    }
}
exports.ToolNotFoundError = ToolNotFoundError;
class ToolExecutionError extends ToolError {
    operation;
    constructor(message, toolId, operation, cause, correlationId) {
        super(message, 'TOOL_EXECUTION_ERROR', toolId, { cause, correlationId, recoverable: true, metadata: { operation } });
        this.operation = operation;
    }
}
exports.ToolExecutionError = ToolExecutionError;
class ToolConnectionError extends ToolError {
    constructor(toolId, endpoint, cause, correlationId) {
        super(`Failed to connect to tool endpoint: ${endpoint}`, 'TOOL_CONNECTION_ERROR', toolId, { cause, correlationId, recoverable: true, metadata: { endpoint } });
    }
}
exports.ToolConnectionError = ToolConnectionError;
/**
 * Plugin Errors
 */
class PluginError extends OpenConductorError {
    pluginId;
    constructor(message, code, pluginId, options) {
        super(message, code, 422, options);
        this.pluginId = pluginId;
    }
}
exports.PluginError = PluginError;
class PluginNotFoundError extends PluginError {
    constructor(pluginId, correlationId) {
        super(`Plugin not found: ${pluginId}`, 'PLUGIN_NOT_FOUND', pluginId, { correlationId, recoverable: false });
    }
}
exports.PluginNotFoundError = PluginNotFoundError;
class PluginLoadError extends PluginError {
    constructor(pluginId, cause, correlationId) {
        super(`Failed to load plugin: ${pluginId}`, 'PLUGIN_LOAD_ERROR', pluginId, { cause, correlationId, recoverable: false });
    }
}
exports.PluginLoadError = PluginLoadError;
class PluginSecurityError extends PluginError {
    violation;
    constructor(pluginId, violation, correlationId) {
        super(`Plugin security violation: ${violation}`, 'PLUGIN_SECURITY_ERROR', pluginId, { correlationId, recoverable: false, metadata: { violation } });
        this.violation = violation;
    }
}
exports.PluginSecurityError = PluginSecurityError;
/**
 * API Errors
 */
class APIError extends OpenConductorError {
    constructor(message, code, statusCode = 500, options) {
        super(message, code, statusCode, options);
    }
}
exports.APIError = APIError;
class ValidationError extends APIError {
    field;
    value;
    rule;
    constructor(message, field, value, correlationId, rule) {
        super(message, 'VALIDATION_ERROR', 400, { correlationId, recoverable: false, metadata: { field, value, rule }, category: 'validation' });
        this.field = field;
        this.value = value;
        this.rule = rule;
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends APIError {
    constructor(message = 'Authentication required', correlationId) {
        super(message, 'AUTHENTICATION_ERROR', 401, { correlationId, recoverable: false });
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends APIError {
    requiredPermission;
    constructor(message = 'Insufficient permissions', requiredPermission, correlationId) {
        super(message, 'AUTHORIZATION_ERROR', 403, { correlationId, recoverable: false, metadata: { requiredPermission } });
        this.requiredPermission = requiredPermission;
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends APIError {
    resource;
    resourceId;
    constructor(resource, resourceId, correlationId) {
        const message = resource && resourceId
            ? `${resource} not found: ${resourceId}`
            : 'Resource not found';
        super(message, 'NOT_FOUND', 404, { correlationId, recoverable: false, metadata: { resource, resourceId } });
        this.resource = resource;
        this.resourceId = resourceId;
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends APIError {
    conflictingResource;
    constructor(message, conflictingResource, correlationId) {
        super(message, 'CONFLICT_ERROR', 409, { correlationId, recoverable: false, metadata: { conflictingResource } });
        this.conflictingResource = conflictingResource;
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends APIError {
    retryAfter;
    constructor(message = 'Rate limit exceeded', retryAfter, correlationId) {
        super(message, 'RATE_LIMIT_ERROR', 429, { correlationId, recoverable: true, metadata: { retryAfter } });
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
/**
 * System Errors
 */
class SystemError extends OpenConductorError {
    component;
    constructor(message, code, component, options) {
        super(message, code, 500, options);
        this.component = component;
    }
}
exports.SystemError = SystemError;
class DatabaseError extends SystemError {
    constructor(message, cause, correlationId) {
        super(message, 'DATABASE_ERROR', 'database', { cause, correlationId, recoverable: true });
    }
}
exports.DatabaseError = DatabaseError;
class CacheError extends SystemError {
    constructor(message, cause, correlationId) {
        super(message, 'CACHE_ERROR', 'cache', { cause, correlationId, recoverable: true });
    }
}
exports.CacheError = CacheError;
class ConfigurationError extends SystemError {
    configPath;
    constructor(message, configPath, correlationId) {
        super(message, 'CONFIGURATION_ERROR', 'config', { correlationId, recoverable: false, metadata: { configPath } });
        this.configPath = configPath;
    }
}
exports.ConfigurationError = ConfigurationError;
class DependencyError extends SystemError {
    dependency;
    constructor(message, dependency, cause, correlationId) {
        super(message, 'DEPENDENCY_ERROR', 'dependency', { cause, correlationId, recoverable: true, metadata: { dependency } });
        this.dependency = dependency;
    }
}
exports.DependencyError = DependencyError;
/**
 * Enterprise Errors
 */
class EnterpriseError extends OpenConductorError {
    constructor(message, code, options) {
        super(message, code, 422, options);
    }
}
exports.EnterpriseError = EnterpriseError;
class LicenseError extends EnterpriseError {
    constructor(message, correlationId) {
        super(message, 'LICENSE_ERROR', { correlationId, recoverable: false });
    }
}
exports.LicenseError = LicenseError;
class ComplianceError extends EnterpriseError {
    requirement;
    constructor(message, requirement, correlationId) {
        super(message, 'COMPLIANCE_ERROR', { correlationId, recoverable: false, metadata: { requirement } });
        this.requirement = requirement;
    }
}
exports.ComplianceError = ComplianceError;
class AuditError extends EnterpriseError {
    constructor(message, cause, correlationId) {
        super(message, 'AUDIT_ERROR', { cause, correlationId, recoverable: true });
    }
}
exports.AuditError = AuditError;
/**
 * Default Error Manager Configuration
 */
exports.DEFAULT_ERROR_CONFIG = {
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
class ErrorUtils {
    /**
     * Check if error is recoverable
     */
    static isRecoverable(error) {
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
        return recoverablePatterns.some(pattern => error.message.includes(pattern) ||
            error.code?.includes(pattern));
    }
    /**
     * Extract error code from error
     */
    static getErrorCode(error) {
        if (error instanceof OpenConductorError) {
            return error.code;
        }
        return error.code || 'UNKNOWN_ERROR';
    }
    /**
     * Create error context from request
     */
    static createContext(req, additional) {
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
    static sanitize(error) {
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
exports.ErrorUtils = ErrorUtils;
//# sourceMappingURL=errors.js.map