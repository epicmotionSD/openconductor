/**
 * SportIntel Subscription Manager
 * 
 * Integrates with OpenConductor authentication and event system to provide
 * subscription management, billing, and feature access control.
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
import { EventBus } from '../../events/event-bus';

export enum SubscriptionTier {
  ROOKIE = 'rookie',
  PRO = 'pro', 
  ELITE = 'elite',
  CHAMPION = 'champion'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing'
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // Monthly price in cents
  yearlyPrice: number; // Yearly price in cents (with discount)
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  description: string;
  popular?: boolean;
}

export interface SubscriptionFeatures {
  // Core Features
  realTimePredictions: boolean;
  explainableAI: boolean;
  portfolioOptimization: boolean;
  alertSystem: boolean;
  
  // Data Features  
  historicalData: boolean;
  advancedMetrics: boolean;
  competitorAnalysis: boolean;
  weatherData: boolean;
  
  // Integration Features
  dfsIntegration: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  customReports: boolean;
  
  // Support Features
  prioritySupport: boolean;
  onboarding: boolean;
  customTraining: boolean;
  dedicatedAccount: boolean;
}

export interface SubscriptionLimits {
  // Usage Limits
  dailyPredictions: number;
  monthlyPredictions: number;
  portfolios: number;
  alerts: number;
  
  // API Limits
  apiCalls: number;
  webhookEndpoints: number;
  
  // Data Retention
  dataRetentionDays: number;
  
  // Team Features
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
  // Current period usage
  dailyPredictions: number;
  monthlyPredictions: number;
  apiCalls: number;
  
  // Reset dates
  dailyResetAt: Date;
  monthlyResetAt: Date;
  
  // Historical usage
  totalPredictions: number;
  totalApiCalls: number;
}

export interface BillingEvent {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled' | 
        'payment.succeeded' | 'payment.failed' | 'trial.ended' | 'usage.exceeded';
  subscriptionId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

/**
 * Subscription Manager - handles all subscription logic
 */
export class SportIntelSubscriptionManager extends EventEmitter {
  private logger: Logger;
  private config: SportIntelConfigManager;
  private eventBus: EventBus;
  private plans: Map<SubscriptionTier, SubscriptionPlan>;
  private subscriptions: Map<string, UserSubscription>;

  constructor(eventBus: EventBus) {
    super();
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.eventBus = eventBus;
    this.plans = new Map();
    this.subscriptions = new Map();
    
    this.initializePlans();
    this.setupEventHandlers();
  }

  /**
   * Initialize subscription plans
   */
  private initializePlans(): void {
    const plans: SubscriptionPlan[] = [
      {
        tier: SubscriptionTier.ROOKIE,
        name: 'Rookie',
        price: 1900, // $19/month
        yearlyPrice: 19800, // $198/year (15% discount)
        description: 'Perfect for casual DFS players getting started',
        features: {
          realTimePredictions: true,
          explainableAI: false,
          portfolioOptimization: true,
          alertSystem: true,
          historicalData: false,
          advancedMetrics: false,
          competitorAnalysis: false,
          weatherData: true,
          dfsIntegration: true,
          apiAccess: false,
          webhooks: false,
          customReports: false,
          prioritySupport: false,
          onboarding: true,
          customTraining: false,
          dedicatedAccount: false,
        },
        limits: {
          dailyPredictions: 50,
          monthlyPredictions: 1000,
          portfolios: 3,
          alerts: 10,
          apiCalls: 0,
          webhookEndpoints: 0,
          dataRetentionDays: 30,
          teamMembers: 1,
          sharedPortfolios: 0,
        },
      },
      {
        tier: SubscriptionTier.PRO,
        name: 'Pro',
        price: 4900, // $49/month
        yearlyPrice: 49000, // $490/year (17% discount)
        description: 'Advanced analytics for serious DFS competitors',
        popular: true,
        features: {
          realTimePredictions: true,
          explainableAI: true,
          portfolioOptimization: true,
          alertSystem: true,
          historicalData: true,
          advancedMetrics: true,
          competitorAnalysis: true,
          weatherData: true,
          dfsIntegration: true,
          apiAccess: true,
          webhooks: false,
          customReports: true,
          prioritySupport: true,
          onboarding: true,
          customTraining: false,
          dedicatedAccount: false,
        },
        limits: {
          dailyPredictions: 200,
          monthlyPredictions: 5000,
          portfolios: 10,
          alerts: 50,
          apiCalls: 10000,
          webhookEndpoints: 0,
          dataRetentionDays: 180,
          teamMembers: 3,
          sharedPortfolios: 5,
        },
      },
      {
        tier: SubscriptionTier.ELITE,
        name: 'Elite',
        price: 14900, // $149/month
        yearlyPrice: 149000, // $1,490/year (16% discount)
        description: 'Professional-grade tools for high-volume players',
        features: {
          realTimePredictions: true,
          explainableAI: true,
          portfolioOptimization: true,
          alertSystem: true,
          historicalData: true,
          advancedMetrics: true,
          competitorAnalysis: true,
          weatherData: true,
          dfsIntegration: true,
          apiAccess: true,
          webhooks: true,
          customReports: true,
          prioritySupport: true,
          onboarding: true,
          customTraining: true,
          dedicatedAccount: false,
        },
        limits: {
          dailyPredictions: 1000,
          monthlyPredictions: 25000,
          portfolios: 50,
          alerts: 200,
          apiCalls: 100000,
          webhookEndpoints: 5,
          dataRetentionDays: 365,
          teamMembers: 10,
          sharedPortfolios: 25,
        },
      },
      {
        tier: SubscriptionTier.CHAMPION,
        name: 'Champion',
        price: 49900, // $499/month  
        yearlyPrice: 499000, // $4,990/year (17% discount)
        description: 'Enterprise solution for teams and organizations',
        features: {
          realTimePredictions: true,
          explainableAI: true,
          portfolioOptimization: true,
          alertSystem: true,
          historicalData: true,
          advancedMetrics: true,
          competitorAnalysis: true,
          weatherData: true,
          dfsIntegration: true,
          apiAccess: true,
          webhooks: true,
          customReports: true,
          prioritySupport: true,
          onboarding: true,
          customTraining: true,
          dedicatedAccount: true,
        },
        limits: {
          dailyPredictions: -1, // Unlimited
          monthlyPredictions: -1, // Unlimited
          portfolios: -1, // Unlimited
          alerts: -1, // Unlimited
          apiCalls: -1, // Unlimited
          webhookEndpoints: 25,
          dataRetentionDays: -1, // Unlimited
          teamMembers: -1, // Unlimited
          sharedPortfolios: -1, // Unlimited
        },
      },
    ];

    plans.forEach(plan => this.plans.set(plan.tier, plan));
    this.logger.info('Subscription plans initialized', { planCount: plans.length });
  }

  /**
   * Setup event handlers for OpenConductor integration
   */
  private setupEventHandlers(): void {
    // Listen to OpenConductor authentication events
    this.eventBus.subscribe('user.authenticated', this.handleUserAuthenticated.bind(this));
    this.eventBus.subscribe('user.created', this.handleUserCreated.bind(this));
    
    // Listen to subscription events
    this.eventBus.subscribe('subscription.*', this.handleSubscriptionEvent.bind(this));
    
    // Listen to usage events
    this.eventBus.subscribe('prediction.requested', this.handlePredictionRequested.bind(this));
    this.eventBus.subscribe('api.called', this.handleApiCalled.bind(this));
    
    this.logger.info('Subscription event handlers setup complete');
  }

  /**
   * Get all available subscription plans
   */
  getPlans(): SubscriptionPlan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Get specific plan by tier
   */
  getPlan(tier: SubscriptionTier): SubscriptionPlan | undefined {
    return this.plans.get(tier);
  }

  /**
   * Create new subscription for user
   */
  async createSubscription(userId: string, tier: SubscriptionTier, trialDays?: number): Promise<UserSubscription> {
    const plan = this.plans.get(tier);
    if (!plan) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    const now = new Date();
    const subscription: UserSubscription = {
      id: `sub_${userId}_${Date.now()}`,
      userId,
      plan,
      status: trialDays ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      trialEnd: trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined,
      metadata: {},
      usage: {
        dailyPredictions: 0,
        monthlyPredictions: 0,
        apiCalls: 0,
        dailyResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        monthlyResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        totalPredictions: 0,
        totalApiCalls: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(subscription.id, subscription);

    // Emit subscription created event
    await this.emitBillingEvent({
      type: 'subscription.created',
      subscriptionId: subscription.id,
      userId,
      data: { tier, trialDays },
      timestamp: now,
    });

    this.logger.info('Subscription created', { 
      subscriptionId: subscription.id, 
      userId, 
      tier,
      trialDays 
    });

    return subscription;
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    // In a real implementation, this would query the database
    for (const subscription of this.subscriptions.values()) {
      if (subscription.userId === userId && subscription.status === SubscriptionStatus.ACTIVE) {
        return subscription;
      }
    }
    return undefined;
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    const updatedSubscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, updatedSubscription);

    // Emit subscription updated event
    await this.emitBillingEvent({
      type: 'subscription.updated',
      subscriptionId,
      userId: subscription.userId,
      data: updates,
      timestamp: new Date(),
    });

    this.logger.info('Subscription updated', { subscriptionId, updates });

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<UserSubscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    const updates: Partial<UserSubscription> = {
      cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? subscription.status : SubscriptionStatus.CANCELED,
    };

    const updatedSubscription = await this.updateSubscription(subscriptionId, updates);

    // Emit subscription canceled event
    await this.emitBillingEvent({
      type: 'subscription.canceled',
      subscriptionId,
      userId: subscription.userId,
      data: { cancelAtPeriodEnd },
      timestamp: new Date(),
    });

    return updatedSubscription;
  }

  /**
   * Check if user has access to feature
   */
  async hasFeatureAccess(userId: string, feature: keyof SubscriptionFeatures): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    return subscription.plan.features[feature];
  }

  /**
   * Check if user is within usage limits
   */
  async checkUsageLimit(userId: string, limitType: keyof SubscriptionLimits): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    const limit = subscription.plan.limits[limitType];
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1 }; // Unlimited
    }

    let used = 0;
    switch (limitType) {
      case 'dailyPredictions':
        used = subscription.usage.dailyPredictions;
        break;
      case 'monthlyPredictions':
        used = subscription.usage.monthlyPredictions;
        break;
      case 'apiCalls':
        used = subscription.usage.apiCalls;
        break;
      default:
        used = 0;
    }

    const remaining = Math.max(0, limit - used);
    return { allowed: remaining > 0, remaining, limit };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(userId: string, usageType: 'prediction' | 'api_call'): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return;
    }

    const now = new Date();

    // Reset counters if needed
    if (now > subscription.usage.dailyResetAt) {
      subscription.usage.dailyPredictions = 0;
      subscription.usage.dailyResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    if (now > subscription.usage.monthlyResetAt) {
      subscription.usage.monthlyPredictions = 0;
      subscription.usage.apiCalls = 0;
      subscription.usage.monthlyResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Increment counters
    switch (usageType) {
      case 'prediction':
        subscription.usage.dailyPredictions++;
        subscription.usage.monthlyPredictions++;
        subscription.usage.totalPredictions++;
        break;
      case 'api_call':
        subscription.usage.apiCalls++;
        subscription.usage.totalApiCalls++;
        break;
    }

    // Update subscription
    await this.updateSubscription(subscription.id, { usage: subscription.usage });

    // Check if usage limits exceeded
    const dailyLimit = await this.checkUsageLimit(userId, 'dailyPredictions');
    const monthlyLimit = await this.checkUsageLimit(userId, 'monthlyPredictions');

    if (!dailyLimit.allowed || !monthlyLimit.allowed) {
      await this.emitBillingEvent({
        type: 'usage.exceeded',
        subscriptionId: subscription.id,
        userId,
        data: { usageType, dailyLimit, monthlyLimit },
        timestamp: now,
      });
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(): Promise<any> {
    const analytics = {
      totalSubscriptions: this.subscriptions.size,
      byTier: {} as Record<SubscriptionTier, number>,
      byStatus: {} as Record<SubscriptionStatus, number>,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      churnRate: 0,
      averageRevenuePerUser: 0,
    };

    for (const subscription of this.subscriptions.values()) {
      // Count by tier
      analytics.byTier[subscription.plan.tier] = (analytics.byTier[subscription.plan.tier] || 0) + 1;
      
      // Count by status
      analytics.byStatus[subscription.status] = (analytics.byStatus[subscription.status] || 0) + 1;
      
      // Calculate revenue (only for active subscriptions)
      if (subscription.status === SubscriptionStatus.ACTIVE) {
        analytics.monthlyRevenue += subscription.plan.price;
      }
    }

    analytics.yearlyRevenue = analytics.monthlyRevenue * 12;
    analytics.averageRevenuePerUser = analytics.totalSubscriptions > 0 
      ? analytics.monthlyRevenue / analytics.totalSubscriptions 
      : 0;

    return analytics;
  }

  // Private event handlers

  private async handleUserAuthenticated(event: any): Promise<void> {
    const { userId } = event.data;
    
    // Check if user has active subscription
    const subscription = await this.getUserSubscription(userId);
    if (subscription) {
      this.logger.info('User authenticated with active subscription', { userId, tier: subscription.plan.tier });
    } else {
      this.logger.info('User authenticated without subscription', { userId });
    }
  }

  private async handleUserCreated(event: any): Promise<void> {
    const { userId } = event.data;
    
    // Auto-create trial subscription for new users
    try {
      await this.createSubscription(userId, SubscriptionTier.PRO, 14); // 14-day trial
      this.logger.info('Trial subscription created for new user', { userId });
    } catch (error) {
      this.logger.error('Failed to create trial subscription', { userId, error });
    }
  }

  private async handleSubscriptionEvent(event: any): Promise<void> {
    this.logger.info('Subscription event received', { type: event.type, data: event.data });
    // Handle Stripe webhook events or internal subscription events
  }

  private async handlePredictionRequested(event: any): Promise<void> {
    const { userId } = event.data;
    
    // Check if user can make prediction
    const dailyLimit = await this.checkUsageLimit(userId, 'dailyPredictions');
    const monthlyLimit = await this.checkUsageLimit(userId, 'monthlyPredictions');

    if (!dailyLimit.allowed || !monthlyLimit.allowed) {
      this.logger.warn('Prediction request blocked - usage limit exceeded', { 
        userId, 
        dailyLimit, 
        monthlyLimit 
      });
      
      // Emit usage limit exceeded event
      this.eventBus.publish('usage.limit.exceeded', {
        userId,
        limitType: 'predictions',
        dailyLimit,
        monthlyLimit,
      });
      return;
    }

    // Increment usage
    await this.incrementUsage(userId, 'prediction');
  }

  private async handleApiCalled(event: any): Promise<void> {
    const { userId } = event.data;
    await this.incrementUsage(userId, 'api_call');
  }

  private async emitBillingEvent(event: BillingEvent): Promise<void> {
    // Emit to internal event bus
    this.eventBus.publish(`billing.${event.type}`, event);
    
    // Emit to class event emitter for external listeners
    this.emit('billing-event', event);
    
    this.logger.info('Billing event emitted', { type: event.type, subscriptionId: event.subscriptionId });
  }
}

export default SportIntelSubscriptionManager;