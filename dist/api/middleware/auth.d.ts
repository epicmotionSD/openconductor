/**
 * OpenConductor Authentication Middleware
 *
 * Comprehensive authentication system supporting multiple strategies:
 * - API Keys
 * - JWT Tokens
 * - OAuth2
 * - Basic Authentication
 */
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
import { AuthConfig } from '../../types/config';
declare global {
    namespace Express {
        interface Request {
            user?: any;
            apiKey?: string;
            apiVersion?: string;
            permissions?: string[];
        }
    }
}
export interface AuthContext {
    userId?: string;
    sessionId?: string;
    permissions: string[];
    metadata?: any;
}
/**
 * Create authentication middleware
 */
export declare function createAuthMiddleware(authConfig: AuthConfig, logger: Logger, errorManager: ErrorManager): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Generate JWT token (utility function)
 */
export declare function generateJWT(user: any, config: AuthConfig['jwt'], expiresIn?: string): string;
/**
 * Verify JWT token (utility function)
 */
export declare function verifyJWT(token: string, config: AuthConfig['jwt']): any;
//# sourceMappingURL=auth.d.ts.map