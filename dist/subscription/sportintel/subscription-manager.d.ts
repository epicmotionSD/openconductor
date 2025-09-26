/**
 * SportIntel Subscription Manager
 *
 * Integrates with OpenConductor authentication and event system to provide
 * subscription management, billing, and feature access control.
 */
import { EventEmitter } from 'events';
import { EventBus } from '../../events/event-bus';
export declare enum SubscriptionTier {
    ROOKIE = "rookie",
    PRO = "pro",
    ELITE = "elite",
    CHAMPION = "champion"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    PAST_DUE = "past_due",
    CANCELED = "canceled",
    UNPAID = "unpaid",
    INCOMPLETE = "incomplete",
    INCOMPLETE_EXPIRED = "incomplete_expired",
    TRIALING = "trialing"
}
export interface SubscriptionPlan {
    tier: SubscriptionTier;
    name: string;
    price: number;
    yearlyPrice: number;
    features: SubscriptionFeatures;
    limits: SubscriptionLimits;
    description: string;
    popular?: boolean;
}
export interface SubscriptionFeatures {
    realTimePredictions: boolean;
    explainableAI: boolean;
    portfolioOptimization: boolean;
    alertSystem: boolean;
    historicalData: boolean;
    advancedMetrics: boolean;
    competitorAnalysis: boolean;
    weatherData: boolean;
    dfsIntegration: boolean;
    apiAccess: boolean;
    webhooks: boolean;
    customReports: boolean;
    prioritySupport: boolean;
    onboarding: boolean;
    customTraining: boolean;
    dedicatedAccount: boolean;
}
export interface SubscriptionLimits {
    dailyPredictions: number;
    monthlyPredictions: number;
    portfolios: number;
    alerts: number;
    apiCalls: number;
    webhookEndpoints: number;
    dataRetentionDays: number;
    teamMembers: number;
    sharedPortfolios: number;
}
export interface UserSubscription {
    id: string;
    userId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd?: Date;
    metadata: Record<string, any>;
    usage: SubscriptionUsage;
    createdAt: Date;
    updatedAt: Date;
}
export interface SubscriptionUsage {
    dailyPredictions: number;
    monthlyPredictions: number;
    apiCalls: number;
    dailyResetAt: Date;
    monthlyResetAt: Date;
    totalPredictions: number;
    totalApiCalls: number;
}
export interface BillingEvent {
    type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled' | 'payment.succeeded' | 'payment.failed' | 'trial.ended' | 'usage.exceeded';
    subscriptionId: string;
    userId: string;
    data: any;
    timestamp: Date;
}
/**
 * Subscription Manager - handles all subscription logic
 */
export declare class SportIntelSubscriptionManager extends EventEmitter {
    private logger;
    private config;
    private eventBus;
    private plans;
    private subscriptions;
    constructor(eventBus: EventBus);
    /**
     * Initialize subscription plans
     */
    private initializePlans;
    /**
     * Setup event handlers for OpenConductor integration
     */
    private setupEventHandlers;
    /**
     * Get all available subscription plans
     */
    getPlans(): SubscriptionPlan[];
    /**
     * Get specific plan by tier
     */
    getPlan(tier: SubscriptionTier): SubscriptionPlan | undefined;
    /**
     * Create new subscription for user
     */
    createSubscription(userId: string, tier: SubscriptionTier, trialDays?: number): Promise<UserSubscription>;
    /**
     * Get user's current subscription
     */
    getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
    /**
     * Update subscription
     */
    updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription>;
    /**
     * Cancel subscription
     */
    cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<UserSubscription>;
    /**
     * Check if user has access to feature
     */
    hasFeatureAccess(userId: string, feature: keyof SubscriptionFeatures): Promise<boolean>;
    /**
     * Check if user is within usage limits
     */
    checkUsageLimit(userId: string, limitType: keyof SubscriptionLimits): Promise<{
        allowed: boolean;
        remaining: number;
        limit: number;
    }>;
    /**
     * Increment usage counter
     */
    incrementUsage(userId: string, usageType: 'prediction' | 'api_call'): Promise<void>;
    /**
     * Get subscription analytics
     */
    getSubscriptionAnalytics(): Promise<any>;
    private handleUserAuthenticated;
    private handleUserCreated;
    private handleSubscriptionEvent;
    private handlePredictionRequested;
    private handleApiCalled;
    private emitBillingEvent;
}
export default SportIntelSubscriptionManager;
//# sourceMappingURL=subscription-manager.d.ts.map