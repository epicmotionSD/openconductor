/**
 * SportIntel Subscription Middleware
 *
 * Authentication and authorization middleware that integrates with OpenConductor
 * to enforce subscription-based access control and usage limits.
 */
import { Request, Response, NextFunction } from 'express';
import { SportIntelSubscriptionManager, SubscriptionFeatures, SubscriptionLimits } from './subscription-manager';
import { EventBus } from '../../events/event-bus';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        subscription?: any;
        features?: SubscriptionFeatures;
        limits?: SubscriptionLimits;
    };
}
interface MiddlewareOptions {
    requiredFeature?: keyof SubscriptionFeatures;
    usageType?: 'prediction' | 'api_call';
    adminOnly?: boolean;
    allowTrial?: boolean;
}
/**
 * Subscription-aware authentication and authorization middleware
 */
export declare class SportIntelSubscriptionMiddleware {
    private logger;
    private config;
    private subscriptionManager;
    private eventBus;
    constructor(subscriptionManager: SportIntelSubscriptionManager, eventBus: EventBus);
    /**
     * JWT Authentication Middleware
     * Verifies JWT token and loads user data
     */
    authenticate(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Feature Access Control Middleware
     * Checks if user has access to specific features
     */
    requireFeature(feature: keyof SubscriptionFeatures): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Usage Limit Middleware
     * Checks and enforces usage limits before allowing requests
     */
    enforceUsageLimit(limitType: keyof SubscriptionLimits, usageType?: 'prediction' | 'api_call'): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Subscription Status Middleware
     * Ensures user has active subscription
     */
    requireActiveSubscription(options?: MiddlewareOptions): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Admin Access Middleware
     * Restricts access to admin users only
     */
    requireAdmin(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Rate Limiting Middleware
     * Implements subscription-aware rate limiting
     */
    rateLimit(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Composite middleware for complete protection
     */
    protect(options?: MiddlewareOptions): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    /**
     * WebSocket Authentication for real-time features
     */
    authenticateWebSocket(): (socket: any, next: any) => Promise<any>;
    private extractToken;
    private getResetTime;
    private getRateLimitForSubscription;
    private isUserAdmin;
}
/**
 * Convenience functions for common middleware combinations
 */
export declare const createSubscriptionMiddleware: (subscriptionManager: SportIntelSubscriptionManager, eventBus: EventBus) => {
    auth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    subscription: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    explainableAI: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    realTimePredictions: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    apiAccess: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    webhooks: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    predictions: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    analytics: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    admin: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
    websocket: (socket: any, next: any) => Promise<any>;
    protect: (options: MiddlewareOptions) => ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
};
export default SportIntelSubscriptionMiddleware;
//# sourceMappingURL=subscription-middleware.d.ts.map