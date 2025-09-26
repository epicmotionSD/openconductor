/**
 * OpenConductor Request Logging Middleware
 *
 * Comprehensive request/response logging with performance metrics
 */
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../utils/logger';
export interface RequestLog {
    requestId: string;
    method: string;
    url: string;
    userAgent?: string;
    ip: string;
    userId?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    statusCode?: number;
    responseSize?: number;
    error?: any;
}
/**
 * Create request logging middleware
 */
export declare function createLoggingMiddleware(logger: Logger): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create access log middleware for file logging
 */
export declare function createAccessLogMiddleware(logger: Logger): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create security log middleware for security events
 */
export declare function createSecurityLogMiddleware(logger: Logger): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create audit log middleware for sensitive operations
 */
export declare function createAuditLogMiddleware(logger: Logger): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=logging.d.ts.map