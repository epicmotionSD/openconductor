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
export declare function createErrorHandler(logger: Logger, errorManager: ErrorManager): (error: APIError, req: Request, res: Response, next: NextFunction) => void;
/**
 * Create async error wrapper for route handlers
 */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create custom error classes
 */
export declare class CustomAPIError extends Error implements APIError {
    statusCode: number;
    code: string;
    details?: any;
    field?: string;
    isOperational: boolean;
    constructor(statusCode: number, code: string, message: string, details?: any, field?: string);
}
export declare class ValidationError extends CustomAPIError {
    constructor(message: string, details?: any, field?: string);
}
export declare class NotFoundError extends CustomAPIError {
    constructor(resource: string, id?: string);
}
export declare class ConflictError extends CustomAPIError {
    constructor(message: string, details?: any);
}
export declare class PermissionError extends CustomAPIError {
    constructor(message?: string);
}
export declare class AgentExecutionError extends CustomAPIError {
    constructor(message: string, details?: any);
}
export declare class WorkflowExecutionError extends CustomAPIError {
    constructor(message: string, details?: any);
}
export declare class ToolExecutionError extends CustomAPIError {
    constructor(message: string, details?: any);
}
export declare class PluginError extends CustomAPIError {
    constructor(message: string, details?: any);
}
export declare class ConfigurationError extends CustomAPIError {
    constructor(message: string, details?: any);
}
//# sourceMappingURL=error-handler.d.ts.map