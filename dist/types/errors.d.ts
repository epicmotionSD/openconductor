/**
 * OpenConductor Error Types
 *
 * Comprehensive error handling system for the OpenConductor platform.
 * Designed for enterprise-grade error tracking, reporting, and recovery.
 *
 * "The sovereign choice for regulated industries"
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'agent' | 'orchestration' | 'plugin' | 'api' | 'auth' | 'validation' | 'network' | 'system' | 'user';
/**
 * Base OpenConductor Error
 *
 * All errors in the OpenConductor system extend this base class
 */
export declare abstract class OpenConductorError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly timestamp: Date;
    readonly correlationId?: string;
    readonly metadata?: Record<string, any>;
    readonly cause?: Error;
    readonly recoverable: boolean;
    readonly severity: ErrorSeverity;
    readonly category: ErrorCategory;
    readonly context: Record<string, any>;
    constructor(message: string, code: string, statusCode?: number, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
        severity?: ErrorSeverity;
        category?: ErrorCategory;
        context?: Record<string, any>;
    });
    /**
     * Convert error to JSON for serialization
     */
    toJSON(): ErrorJSON;
}
/**
 * Agent Errors
 */
export declare class AgentError extends OpenConductorError {
    readonly agentId?: string;
    readonly agentType?: string;
    constructor(message: string, code: string, agentId?: string, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
        agentType?: string;
    });
}
export declare class AgentNotFoundError extends AgentError {
    constructor(agentId: string, correlationId?: string);
}
export declare class AgentExecutionError extends AgentError {
    readonly executionId?: string;
    constructor(message: string, agentId: string, executionId?: string, cause?: Error, correlationId?: string);
}
export declare class AgentTimeoutError extends AgentError {
    readonly timeoutMs: number;
    constructor(agentId: string, timeoutMs: number, correlationId?: string);
}
export declare class AgentConfigurationError extends AgentError {
    constructor(message: string, agentId: string, correlationId?: string);
}
/**
 * Workflow Errors
 */
export declare class WorkflowError extends OpenConductorError {
    readonly workflowId?: string;
    readonly executionId?: string;
    constructor(message: string, code: string, workflowId?: string, executionId?: string, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
    });
}
/**
 * Orchestration Error (alias for WorkflowError for compatibility)
 */
export declare class OrchestrationError extends WorkflowError {
    readonly stepId?: string;
    constructor(message: string, code: string, workflowId?: string, stepId?: string, executionId?: string, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
    });
}
export declare class WorkflowNotFoundError extends WorkflowError {
    constructor(workflowId: string, correlationId?: string);
}
export declare class WorkflowExecutionError extends WorkflowError {
    readonly stepId?: string;
    constructor(message: string, workflowId: string, executionId: string, stepId?: string, cause?: Error, correlationId?: string);
}
export declare class WorkflowValidationError extends WorkflowError {
    readonly validationErrors: ValidationError[];
    constructor(workflowId: string, validationErrors: ValidationError[], correlationId?: string);
}
/**
 * Tool Errors
 */
export declare class ToolError extends OpenConductorError {
    readonly toolId?: string;
    constructor(message: string, code: string, toolId?: string, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
    });
}
export declare class ToolNotFoundError extends ToolError {
    constructor(toolId: string, correlationId?: string);
}
export declare class ToolExecutionError extends ToolError {
    readonly operation?: string;
    constructor(message: string, toolId: string, operation?: string, cause?: Error, correlationId?: string);
}
export declare class ToolConnectionError extends ToolError {
    constructor(toolId: string, endpoint: string, cause?: Error, correlationId?: string);
}
/**
 * Plugin Errors
 */
export declare class PluginError extends OpenConductorError {
    readonly pluginId?: string;
    constructor(message: string, code: string, pluginId?: string, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
    });
}
export declare class PluginNotFoundError extends PluginError {
    constructor(pluginId: string, correlationId?: string);
}
export declare class PluginLoadError extends PluginError {
    constructor(pluginId: string, cause?: Error, correlationId?: string);
}
export declare class PluginSecurityError extends PluginError {
    readonly violation: string;
    constructor(pluginId: string, violation: string, correlationId?: string);
}
/**
 * API Errors
 */
export declare class APIError extends OpenConductorError {
    constructor(message: string, code: string, statusCode?: number, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
        category?: ErrorCategory;
    });
}
export declare class ValidationError extends APIError {
    readonly field?: string;
    readonly value?: any;
    readonly rule?: string;
    constructor(message: string, field?: string, value?: any, correlationId?: string, rule?: string);
}
export declare class AuthenticationError extends APIError {
    constructor(message?: string, correlationId?: string);
}
export declare class AuthorizationError extends APIError {
    readonly requiredPermission?: string;
    constructor(message?: string, requiredPermission?: string, correlationId?: string);
}
export declare class NotFoundError extends APIError {
    readonly resource?: string;
    readonly resourceId?: string;
    constructor(resource?: string, resourceId?: string, correlationId?: string);
}
export declare class ConflictError extends APIError {
    readonly conflictingResource?: string;
    constructor(message: string, conflictingResource?: string, correlationId?: string);
}
export declare class RateLimitError extends APIError {
    readonly retryAfter?: number;
    constructor(message?: string, retryAfter?: number, correlationId?: string);
}
/**
 * System Errors
 */
export declare class SystemError extends OpenConductorError {
    readonly component?: string;
    constructor(message: string, code: string, component?: string, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
    });
}
export declare class DatabaseError extends SystemError {
    constructor(message: string, cause?: Error, correlationId?: string);
}
export declare class CacheError extends SystemError {
    constructor(message: string, cause?: Error, correlationId?: string);
}
export declare class ConfigurationError extends SystemError {
    readonly configPath?: string;
    constructor(message: string, configPath?: string, correlationId?: string);
}
export declare class DependencyError extends SystemError {
    readonly dependency: string;
    constructor(message: string, dependency: string, cause?: Error, correlationId?: string);
}
/**
 * Enterprise Errors
 */
export declare class EnterpriseError extends OpenConductorError {
    constructor(message: string, code: string, options?: {
        cause?: Error;
        correlationId?: string;
        metadata?: Record<string, any>;
        recoverable?: boolean;
    });
}
export declare class LicenseError extends EnterpriseError {
    constructor(message: string, correlationId?: string);
}
export declare class ComplianceError extends EnterpriseError {
    readonly requirement: string;
    constructor(message: string, requirement: string, correlationId?: string);
}
export declare class AuditError extends EnterpriseError {
    constructor(message: string, cause?: Error, correlationId?: string);
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
    handle(error: Error, context?: ErrorContext): Promise<void>;
    report(error: Error, context?: ErrorContext): Promise<void>;
    recover?(error: Error, context?: ErrorContext): Promise<boolean>;
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
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
    environment: string;
    service: string;
    version: string;
    instanceId: string;
    metadata?: Record<string, any>;
}
/**
 * Error Reporter Interface
 */
export interface ErrorReporter {
    report(error: Error, context?: ErrorContext): Promise<void>;
    reportBatch(errors: Array<{
        error: Error;
        context?: ErrorContext;
    }>): Promise<void>;
    healthCheck(): Promise<boolean>;
}
/**
 * Error Recovery Strategy
 */
export interface ErrorRecoveryStrategy {
    name: string;
    canRecover(error: Error): boolean;
    recover(error: Error, context?: ErrorContext): Promise<boolean>;
    priority: number;
}
/**
 * Error Manager
 */
export interface ErrorManager {
    handleError(error: Error, context?: ErrorContext): Promise<void>;
    addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
    removeRecoveryStrategy(name: string): void;
    addReporter(reporter: ErrorReporter): void;
    removeReporter(reporter: ErrorReporter): void;
    addHandler(handler: ErrorHandler): void;
    removeHandler(handler: ErrorHandler): void;
    getErrorMetrics(): Promise<ErrorMetrics>;
    configure(config: ErrorManagerConfig): void;
}
/**
 * Error Metrics
 */
export interface ErrorMetrics {
    timestamp: Date;
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByCode: Record<string, number>;
    errorsByComponent: Record<string, number>;
    errorRate: number;
    recoveryRate: number;
    averageHandlingTime: number;
    averageReportingTime: number;
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
    enableGlobalHandler: boolean;
    logAllErrors: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableReporting: boolean;
    reportingThreshold: 'all' | 'warn' | 'error';
    enableRecovery: boolean;
    maxRecoveryAttempts: number;
    recoveryTimeout: number;
    ignorePatterns: string[];
    ignoreErrorCodes: string[];
    enableRateLimit: boolean;
    maxErrorsPerMinute: number;
    enableAlerting: boolean;
    alertingRules: Array<{
        condition: string;
        threshold: number;
        timeWindow: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
}
/**
 * Default Error Manager Configuration
 */
export declare const DEFAULT_ERROR_CONFIG: ErrorManagerConfig;
/**
 * Utility functions for error handling
 */
export declare class ErrorUtils {
    /**
     * Check if error is recoverable
     */
    static isRecoverable(error: Error): boolean;
    /**
     * Extract error code from error
     */
    static getErrorCode(error: Error): string;
    /**
     * Create error context from request
     */
    static createContext(req?: any, additional?: Partial<ErrorContext>): ErrorContext;
    /**
     * Sanitize error for logging (remove sensitive data)
     */
    static sanitize(error: Error): ErrorJSON;
}
//# sourceMappingURL=errors.d.ts.map