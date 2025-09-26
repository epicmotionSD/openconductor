/**
 * ErrorManager Implementation
 *
 * Enterprise-grade error handling and management for OpenConductor
 */
import { OpenConductorError, ErrorSeverity, ErrorCategory, AgentError, OrchestrationError, ValidationError } from '../types/errors';
import { Logger } from './logger';
export declare class ErrorManager {
    private logger;
    private errorHandlers;
    constructor(logger: Logger);
    /**
     * Handle an error based on its type and severity
     */
    handleError(error: OpenConductorError): void;
    /**
     * Register a custom error handler
     */
    registerHandler(errorCode: string, handler: (error: OpenConductorError) => void): void;
    /**
     * Create a standardized error from an unknown error
     */
    createError(code: string, message: string, category?: ErrorCategory, severity?: ErrorSeverity, context?: Record<string, any>, cause?: Error): OpenConductorError;
    /**
     * Wrap and standardize native JavaScript errors
     */
    wrapError(error: Error, context?: Record<string, any>): OpenConductorError;
    /**
     * Create specific error types
     */
    createAgentError(code: string, message: string, agentId: string, severity?: ErrorSeverity): AgentError;
    createOrchestrationError(code: string, message: string, workflowId?: string, stepId?: string, severity?: ErrorSeverity): OrchestrationError;
    createValidationError(field: string, value: any, rule: string, message?: string): ValidationError;
    /**
     * Check if an error is recoverable
     */
    isRecoverable(error: OpenConductorError): boolean;
    /**
     * Get error metrics for monitoring
     */
    getErrorMetrics(): {
        totalErrors: number;
        errorsByCategory: Record<ErrorCategory, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
    };
    /**
     * Event listener method for compatibility with conductor
     */
    on(event: string, callback: (error: any) => void): void;
    /**
     * Cleanup method for graceful shutdown
     */
    cleanup(): Promise<void>;
    private setupDefaultHandlers;
    private logError;
    private getLogLevel;
    private handleCriticalError;
}
//# sourceMappingURL=error-manager.d.ts.map