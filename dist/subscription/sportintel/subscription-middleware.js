"use strict";
/**
 * SportIntel Subscription Middleware
 *
 * Authentication and authorization middleware that integrates with OpenConductor
 * to enforce subscription-based access control and usage limits.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionMiddleware = exports.SportIntelSubscriptionMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../../utils/logger");
const development_config_1 = require("../../config/sportintel/development-config");
/**
 * Subscription-aware authentication and authorization middleware
 */
class SportIntelSubscriptionMiddleware {
    logger;
    config;
    subscriptionManager;
    eventBus;
    constructor(subscriptionManager, eventBus) {
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.subscriptionManager = subscriptionManager;
        this.eventBus = eventBus;
    }
    /**
     * JWT Authentication Middleware
     * Verifies JWT token and loads user data
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                const token = this.extractToken(req);
                if (!token) {
                    return res.status(401).json({ error: 'Authentication token required' });
                }
                const decoded = jsonwebtoken_1.default.verify(token, this.config.getSection('security').jwtSecret);
                // Load user subscription
                const subscription = await this.subscriptionManager.getUserSubscription(decoded.userId);
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    subscription,
                    features: subscription?.plan.features,
                    limits: subscription?.plan.limits,
                };
                // Emit authentication event
                this.eventBus.publish('user.authenticated', {
                    userId: req.user.id,
                    subscription: subscription?.plan.tier,
                });
                next();
            }
            catch (error) {
                this.logger.error('Authentication failed', { error: error.message });
                return res.status(401).json({ error: 'Invalid authentication token' });
            }
        };
    }
    /**
     * Feature Access Control Middleware
     * Checks if user has access to specific features
     */
    requireFeature(feature) {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const hasAccess = await this.subscriptionManager.hasFeatureAccess(req.user.id, feature);
            if (!hasAccess) {
                this.logger.warn('Feature access denied', {
                    userId: req.user.id,
                    feature,
                    subscription: req.user.subscription?.plan.tier
                });
                return res.status(403).json({
                    error: 'Feature not available in your subscription plan',
                    feature,
                    currentPlan: req.user.subscription?.plan.tier,
                    upgradeRequired: true,
                });
            }
            next();
        };
    }
    /**
     * Usage Limit Middleware
     * Checks and enforces usage limits before allowing requests
     */
    enforceUsageLimit(limitType, usageType) {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const usageCheck = await this.subscriptionManager.checkUsageLimit(req.user.id, limitType);
            if (!usageCheck.allowed) {
                this.logger.warn('Usage limit exceeded', {
                    userId: req.user.id,
                    limitType,
                    limit: usageCheck.limit,
                    remaining: usageCheck.remaining,
                });
                // Emit usage limit event
                this.eventBus.publish('usage.limit.exceeded', {
                    userId: req.user.id,
                    limitType,
                    limit: usageCheck.limit,
                    remaining: usageCheck.remaining,
                });
                return res.status(429).json({
                    error: 'Usage limit exceeded',
                    limitType,
                    limit: usageCheck.limit,
                    remaining: usageCheck.remaining,
                    resetTime: this.getResetTime(limitType, req.user.subscription),
                    upgradeRequired: true,
                });
            }
            // Increment usage counter after successful request
            if (usageType) {
                res.on('finish', async () => {
                    if (res.statusCode < 400) { // Only count successful requests
                        await this.subscriptionManager.incrementUsage(req.user.id, usageType);
                    }
                });
            }
            // Add usage info to response headers
            res.set({
                'X-Usage-Limit': usageCheck.limit.toString(),
                'X-Usage-Remaining': usageCheck.remaining.toString(),
                'X-Usage-Reset': this.getResetTime(limitType, req.user.subscription),
            });
            next();
        };
    }
    /**
     * Subscription Status Middleware
     * Ensures user has active subscription
     */
    requireActiveSubscription(options = {}) {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const subscription = req.user.subscription;
            if (!subscription) {
                return res.status(402).json({
                    error: 'Active subscription required',
                    subscriptionRequired: true,
                });
            }
            // Check subscription status
            const validStatuses = ['active'];
            if (options.allowTrial) {
                validStatuses.push('trialing');
            }
            if (!validStatuses.includes(subscription.status)) {
                return res.status(402).json({
                    error: 'Active subscription required',
                    currentStatus: subscription.status,
                    subscriptionRequired: true,
                });
            }
            // Check if subscription is canceled at period end
            if (subscription.cancelAtPeriodEnd && new Date() > new Date(subscription.currentPeriodEnd)) {
                return res.status(402).json({
                    error: 'Subscription has expired',
                    expiredAt: subscription.currentPeriodEnd,
                    subscriptionRequired: true,
                });
            }
            next();
        };
    }
    /**
     * Admin Access Middleware
     * Restricts access to admin users only
     */
    requireAdmin() {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            // Check if user has admin privileges (implementation specific)
            const isAdmin = await this.isUserAdmin(req.user.id);
            if (!isAdmin) {
                this.logger.warn('Admin access denied', { userId: req.user.id });
                return res.status(403).json({ error: 'Admin access required' });
            }
            next();
        };
    }
    /**
     * Rate Limiting Middleware
     * Implements subscription-aware rate limiting
     */
    rateLimit() {
        const rateLimitMap = new Map();
        return async (req, res, next) => {
            if (!req.user) {
                return next(); // Let authentication middleware handle this
            }
            const userId = req.user.id;
            const now = Date.now();
            const windowMs = 60 * 1000; // 1 minute window
            // Get rate limit based on subscription tier
            const maxRequests = this.getRateLimitForSubscription(req.user.subscription);
            // Clean expired entries
            for (const [key, value] of rateLimitMap.entries()) {
                if (now > value.resetTime) {
                    rateLimitMap.delete(key);
                }
            }
            // Check current user's rate limit
            const userLimit = rateLimitMap.get(userId);
            if (userLimit) {
                if (userLimit.count >= maxRequests) {
                    const resetIn = Math.ceil((userLimit.resetTime - now) / 1000);
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        maxRequests,
                        resetIn,
                        upgradeForHigherLimits: true,
                    });
                }
                userLimit.count++;
            }
            else {
                rateLimitMap.set(userId, {
                    count: 1,
                    resetTime: now + windowMs,
                });
            }
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': (maxRequests - (userLimit?.count || 1)).toString(),
                'X-RateLimit-Reset': new Date(rateLimitMap.get(userId)?.resetTime || now + windowMs).toISOString(),
            });
            next();
        };
    }
    /**
     * Composite middleware for complete protection
     */
    protect(options = {}) {
        const middlewares = [
            this.authenticate(),
            this.requireActiveSubscription(options),
            this.rateLimit(),
        ];
        if (options.requiredFeature) {
            middlewares.push(this.requireFeature(options.requiredFeature));
        }
        if (options.usageType) {
            const limitType = options.usageType === 'prediction' ? 'dailyPredictions' : 'apiCalls';
            middlewares.push(this.enforceUsageLimit(limitType, options.usageType));
        }
        if (options.adminOnly) {
            middlewares.push(this.requireAdmin());
        }
        return middlewares;
    }
    /**
     * WebSocket Authentication for real-time features
     */
    authenticateWebSocket() {
        return async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, this.config.getSection('security').jwtSecret);
                const subscription = await this.subscriptionManager.getUserSubscription(decoded.userId);
                socket.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    subscription,
                    features: subscription?.plan.features,
                };
                // Emit WebSocket authentication event
                this.eventBus.publish('websocket.authenticated', {
                    userId: socket.user.id,
                    socketId: socket.id,
                    subscription: subscription?.plan.tier,
                });
                next();
            }
            catch (error) {
                this.logger.error('WebSocket authentication failed', { error: error.message });
                next(new Error('Invalid authentication token'));
            }
        };
    }
    // Private helper methods
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        // Check query parameter as fallback
        return req.query.token || null;
    }
    getResetTime(limitType, subscription) {
        const now = new Date();
        switch (limitType) {
            case 'dailyPredictions':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            case 'monthlyPredictions':
            case 'apiCalls':
                return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        }
    }
    getRateLimitForSubscription(subscription) {
        if (!subscription)
            return 60; // Default rate limit
        switch (subscription.plan.tier) {
            case 'rookie': return 60; // 60 requests per minute
            case 'pro': return 120; // 120 requests per minute  
            case 'elite': return 300; // 300 requests per minute
            case 'champion': return 600; // 600 requests per minute
            default: return 60;
        }
    }
    async isUserAdmin(userId) {
        // Implementation would check admin status in database
        // For now, return false (no admin users)
        return false;
    }
}
exports.SportIntelSubscriptionMiddleware = SportIntelSubscriptionMiddleware;
/**
 * Convenience functions for common middleware combinations
 */
const createSubscriptionMiddleware = (subscriptionManager, eventBus) => {
    const middleware = new SportIntelSubscriptionMiddleware(subscriptionManager, eventBus);
    return {
        // Basic authentication
        auth: middleware.authenticate(),
        // Subscription required
        subscription: middleware.requireActiveSubscription(),
        // Feature-specific protection
        explainableAI: middleware.protect({ requiredFeature: 'explainableAI' }),
        realTimePredictions: middleware.protect({ requiredFeature: 'realTimePredictions' }),
        apiAccess: middleware.protect({ requiredFeature: 'apiAccess', usageType: 'api_call' }),
        webhooks: middleware.protect({ requiredFeature: 'webhooks' }),
        // Usage-limited endpoints
        predictions: middleware.protect({ usageType: 'prediction' }),
        analytics: middleware.protect({ requiredFeature: 'advancedMetrics' }),
        // Admin endpoints
        admin: middleware.protect({ adminOnly: true }),
        // WebSocket authentication
        websocket: middleware.authenticateWebSocket(),
        // Full protection with options
        protect: (options) => middleware.protect(options),
    };
};
exports.createSubscriptionMiddleware = createSubscriptionMiddleware;
exports.default = SportIntelSubscriptionMiddleware;
//# sourceMappingURL=subscription-middleware.js.map