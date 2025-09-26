/**
 * OpenConductor MCP Billing System
 * 
 * Subscription management and usage-based billing for MCP features.
 * Integrates with Stripe for payment processing and supports the freemium model.
 */

import Stripe from 'stripe';
import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export type SubscriptionTier = 'free' | 'professional' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price_monthly: number;
  price_yearly: number;
  limits: {
    workflow_executions: number;
    concurrent_workflows: number;
    servers_per_workflow: number;
    max_execution_time: number;
    storage_gb: number;
    api_calls_per_month: number;
    team_members: number;
  };
  features: string[];
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionTier;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start?: Date;
  current_period_end?: Date;
  usage: {
    workflow_executions_used: number;
    api_calls_used: number;
    server_installs_used: number;
  };
  limits: {
    workflow_executions_limit: number;
    api_calls_limit: number;
    server_installs_limit: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface UsageEvent {
  user_id: string;
  event_type: 'workflow_execution' | 'api_call' | 'server_install' | 'tool_usage';
  resource_type: 'workflow' | 'server' | 'tool' | 'api_endpoint';
  resource_id: string;
  quantity: number;
  cost_usd: number;
  metadata?: any;
  billing_period: string;
}

/**
 * Subscription Plans Configuration
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Community',
    price_monthly: 0,
    price_yearly: 0,
    limits: {
      workflow_executions: 50,
      concurrent_workflows: 2,
      servers_per_workflow: 3,
      max_execution_time: 60,
      storage_gb: 1,
      api_calls_per_month: 1000,
      team_members: 1
    },
    features: [
      'Public workflow templates',
      'Community server registry',
      'Basic analytics',
      'Community support'
    ]
  },
  {
    id: 'professional',
    tier: 'professional',
    name: 'Professional',
    price_monthly: 29,
    price_yearly: 290,
    limits: {
      workflow_executions: 1000,
      concurrent_workflows: 10,
      servers_per_workflow: 10,
      max_execution_time: 300,
      storage_gb: 10,
      api_calls_per_month: 25000,
      team_members: 1
    },
    features: [
      'Private workflows',
      'Advanced analytics',
      'Priority server access',
      'Email support',
      'Custom integrations',
      'Workflow scheduling',
      'Performance monitoring'
    ],
    stripe_price_id_monthly: 'price_professional_monthly',
    stripe_price_id_yearly: 'price_professional_yearly'
  },
  {
    id: 'team',
    tier: 'team', 
    name: 'Team',
    price_monthly: 99,
    price_yearly: 990,
    limits: {
      workflow_executions: 5000,
      concurrent_workflows: 50,
      servers_per_workflow: 25,
      max_execution_time: 600,
      storage_gb: 50,
      api_calls_per_month: 100000,
      team_members: 10
    },
    features: [
      'Team collaboration',
      'Shared workflow library',
      'Advanced security',
      'SSO integration',
      'Custom server hosting',
      'Priority support',
      'Advanced monitoring',
      'Usage analytics',
      'White-label options'
    ],
    stripe_price_id_monthly: 'price_team_monthly',
    stripe_price_id_yearly: 'price_team_yearly'
  },
  {
    id: 'enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    price_monthly: 0, // Custom pricing
    price_yearly: 0,
    limits: {
      workflow_executions: -1, // Unlimited
      concurrent_workflows: -1,
      servers_per_workflow: -1,
      max_execution_time: -1,
      storage_gb: -1,
      api_calls_per_month: -1,
      team_members: -1
    },
    features: [
      'Dedicated infrastructure',
      'Custom deployment options',
      'Advanced security & compliance',
      'Dedicated support team',
      'Custom integrations',
      'SLA guarantees',
      'Advanced analytics & reporting',
      'Custom billing terms',
      'Professional services'
    ]
  }
];

/**
 * MCP Billing System Manager
 */
export class MCPBillingSystem {
  private stripe: Stripe;
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;

  constructor(
    stripeSecretKey: string,
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    this.pool = pool;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
  }

  /**
   * Create subscription for user
   */
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<UserSubscription> {
    this.logger.debug('Creating subscription', { userId, planId, billingCycle });

    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
      }

      // Handle free plan
      if (plan.tier === 'free') {
        return this.createFreeSubscription(userId, plan);
      }

      // Get or create Stripe customer
      const customer = await this.getOrCreateStripeCustomer(userId);
      
      // Attach payment method if provided
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id
        });
      }

      // Create Stripe subscription
      const stripePriceId = billingCycle === 'yearly' 
        ? plan.stripe_price_id_yearly 
        : plan.stripe_price_id_monthly;

      if (!stripePriceId) {
        throw new Error(`No Stripe price ID configured for ${planId} ${billingCycle}`);
      }

      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: stripePriceId }],
        default_payment_method: paymentMethodId,
        metadata: {
          user_id: userId,
          plan_id: planId,
          billing_cycle: billingCycle
        }
      });

      // Create local subscription record
      const subscription = await this.createSubscriptionRecord(
        userId,
        plan,
        stripeSubscription.id,
        customer.id
      );

      // Emit subscription created event
      await this.eventBus.emit({
        type: 'mcp.subscription.created',
        timestamp: new Date(),
        data: {
          userId,
          subscriptionId: subscription.id,
          plan: plan.tier,
          billingCycle
        }
      });

      this.logger.info('Subscription created successfully', {
        userId,
        subscriptionId: subscription.id,
        plan: plan.tier
      });

      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'subscription-creation',
        userId,
        planId
      });
    }
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const query = `
        SELECT * FROM subscriptions 
        WHERE user_id = $1 AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapSubscriptionFromDB(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to get user subscription:', error);
      throw error;
    }
  }

  /**
   * Track usage event for billing
   */
  async trackUsage(usageEvent: UsageEvent): Promise<void> {
    this.logger.debug('Tracking usage event', {
      userId: usageEvent.user_id,
      eventType: usageEvent.event_type,
      quantity: usageEvent.quantity
    });

    try {
      // Insert usage event
      await this.pool.query(`
        INSERT INTO usage_events (
          user_id, event_type, resource_type, resource_id,
          quantity, cost_usd, metadata, billing_period
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        usageEvent.user_id,
        usageEvent.event_type,
        usageEvent.resource_type,
        usageEvent.resource_id,
        usageEvent.quantity,
        usageEvent.cost_usd,
        usageEvent.metadata ? JSON.stringify(usageEvent.metadata) : null,
        usageEvent.billing_period
      ]);

      // Check usage limits
      await this.checkUsageLimits(usageEvent.user_id, usageEvent.event_type);

      this.logger.debug('Usage event tracked successfully', {
        userId: usageEvent.user_id,
        eventType: usageEvent.event_type
      });
    } catch (error) {
      this.logger.error('Failed to track usage event:', error);
      throw error;
    }
  }

  /**
   * Check if user is within usage limits
   */
  async checkUsageLimits(userId: string, eventType: string): Promise<{
    withinLimits: boolean;
    currentUsage: number;
    limit: number;
    percentage: number;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        // Default to free plan limits
        const freePlan = SUBSCRIPTION_PLANS.find(p => p.tier === 'free')!;
        return {
          withinLimits: false,
          currentUsage: 0,
          limit: freePlan.limits.workflow_executions,
          percentage: 0
        };
      }

      const currentPeriod = this.getCurrentBillingPeriod();
      
      // Get current usage for this period
      const usageQuery = `
        SELECT SUM(quantity) as total_usage
        FROM usage_events 
        WHERE user_id = $1 
          AND event_type = $2 
          AND billing_period = $3
      `;
      
      const usageResult = await this.pool.query(usageQuery, [
        userId,
        eventType,
        currentPeriod
      ]);
      
      const currentUsage = parseInt(usageResult.rows[0]?.total_usage) || 0;
      
      // Get limit based on event type
      let limit = 0;
      switch (eventType) {
        case 'workflow_execution':
          limit = subscription.limits.workflow_executions_limit;
          break;
        case 'api_call':
          limit = subscription.limits.api_calls_limit;
          break;
        case 'server_install':
          limit = subscription.limits.server_installs_limit;
          break;
      }

      const withinLimits = limit === -1 || currentUsage < limit; // -1 means unlimited
      const percentage = limit === -1 ? 0 : (currentUsage / limit) * 100;

      // Send warning if approaching limit
      if (percentage > 80 && percentage <= 100) {
        await this.eventBus.emit({
          type: 'mcp.usage.warning',
          timestamp: new Date(),
          data: {
            userId,
            eventType,
            currentUsage,
            limit,
            percentage
          }
        });
      }

      return {
        withinLimits,
        currentUsage,
        limit,
        percentage
      };
    } catch (error) {
      this.logger.error('Failed to check usage limits:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    this.logger.debug('Handling Stripe webhook', { 
      type: event.type,
      id: event.id 
    });

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
          
        default:
          this.logger.debug('Unhandled webhook event', { type: event.type });
      }
    } catch (error) {
      this.logger.error('Failed to handle Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * Calculate usage-based pricing
   */
  async calculateUsageCost(userId: string, billingPeriod?: string): Promise<{
    base_cost: number;
    overage_cost: number;
    total_cost: number;
    usage_breakdown: any;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const period = billingPeriod || this.getCurrentBillingPeriod();
      
      if (!subscription) {
        return {
          base_cost: 0,
          overage_cost: 0,
          total_cost: 0,
          usage_breakdown: {}
        };
      }

      // Get usage for period
      const usageQuery = `
        SELECT 
          event_type,
          SUM(quantity) as total_quantity,
          SUM(cost_usd) as total_cost
        FROM usage_events 
        WHERE user_id = $1 AND billing_period = $2
        GROUP BY event_type
      `;
      
      const usageResult = await this.pool.query(usageQuery, [userId, period]);
      const usage = Object.fromEntries(
        usageResult.rows.map(row => [row.event_type, {
          quantity: parseInt(row.total_quantity),
          cost: parseFloat(row.total_cost)
        }])
      );

      // Calculate base subscription cost
      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === subscription.plan);
      const baseCost = plan?.price_monthly || 0;

      // Calculate overage costs
      let overageCost = 0;
      const overageRates = {
        workflow_execution: 0.01, // $0.01 per execution over limit
        api_call: 0.0001, // $0.0001 per API call over limit
        server_install: 1.00 // $1.00 per server install over limit
      };

      for (const [eventType, eventUsage] of Object.entries(usage)) {
        const limit = this.getUsageLimit(subscription, eventType);
        if (limit > 0 && eventUsage.quantity > limit) {
          const overage = eventUsage.quantity - limit;
          const rate = overageRates[eventType as keyof typeof overageRates] || 0;
          overageCost += overage * rate;
        }
      }

      return {
        base_cost: baseCost,
        overage_cost: overageCost,
        total_cost: baseCost + overageCost,
        usage_breakdown: usage
      };
    } catch (error) {
      this.logger.error('Failed to calculate usage cost:', error);
      throw error;
    }
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscription(
    userId: string,
    newPlanId: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<UserSubscription> {
    this.logger.debug('Changing subscription', { userId, newPlanId, billingCycle });

    try {
      const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
      if (!newPlan) {
        throw new Error(`Invalid plan: ${newPlanId}`);
      }

      const currentSubscription = await this.getUserSubscription(userId);
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      // Handle free plan change
      if (newPlan.tier === 'free') {
        return this.downgradeToFree(userId, currentSubscription);
      }

      // Update Stripe subscription
      if (currentSubscription.stripe_subscription_id) {
        const stripePriceId = billingCycle === 'yearly' 
          ? newPlan.stripe_price_id_yearly 
          : newPlan.stripe_price_id_monthly;

        await this.stripe.subscriptions.update(currentSubscription.stripe_subscription_id, {
          items: [{
            id: (await this.stripe.subscriptions.retrieve(currentSubscription.stripe_subscription_id)).items.data[0].id,
            price: stripePriceId
          }],
          proration_behavior: 'create_prorations'
        });
      }

      // Update local record
      const updatedSubscription = await this.updateSubscriptionPlan(userId, newPlan);

      await this.eventBus.emit({
        type: 'mcp.subscription.changed',
        timestamp: new Date(),
        data: {
          userId,
          oldPlan: currentSubscription.plan,
          newPlan: newPlan.tier,
          billingCycle
        }
      });

      this.logger.info('Subscription changed successfully', {
        userId,
        oldPlan: currentSubscription.plan,
        newPlan: newPlan.tier
      });

      return updatedSubscription;
    } catch (error) {
      this.logger.error('Failed to change subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(): Promise<{
    total_subscriptions: number;
    active_subscriptions: number;
    mrr: number;
    arr: number;
    churn_rate: number;
    plan_distribution: { [key: string]: number };
    usage_metrics: any;
  }> {
    try {
      // Get subscription metrics
      const metricsQuery = `
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          plan,
          COUNT(*) as plan_count
        FROM subscriptions 
        GROUP BY plan
      `;
      
      const result = await this.pool.query(metricsQuery);
      
      const totalSubscriptions = result.rows.reduce((sum, row) => sum + parseInt(row.plan_count), 0);
      const activeSubscriptions = result.rows.reduce((sum, row) => 
        sum + (row.status === 'active' ? parseInt(row.plan_count) : 0), 0
      );
      
      // Calculate MRR (Monthly Recurring Revenue)
      let mrr = 0;
      const planDistribution: { [key: string]: number } = {};
      
      for (const row of result.rows) {
        const plan = SUBSCRIPTION_PLANS.find(p => p.tier === row.plan);
        if (plan && row.status === 'active') {
          mrr += plan.price_monthly * parseInt(row.plan_count);
        }
        planDistribution[row.plan] = parseInt(row.plan_count);
      }

      const arr = mrr * 12; // Annual Recurring Revenue

      // Calculate churn rate (simplified)
      const churnQuery = `
        SELECT COUNT(*) as churned_count
        FROM subscriptions 
        WHERE status = 'canceled' 
          AND canceled_at >= NOW() - INTERVAL '30 days'
      `;
      const churnResult = await this.pool.query(churnQuery);
      const churnedCount = parseInt(churnResult.rows[0]?.churned_count) || 0;
      const churnRate = totalSubscriptions > 0 ? (churnedCount / totalSubscriptions) * 100 : 0;

      return {
        total_subscriptions: totalSubscriptions,
        active_subscriptions: activeSubscriptions,
        mrr,
        arr,
        churn_rate: churnRate,
        plan_distribution: planDistribution,
        usage_metrics: await this.getUsageMetrics()
      };
    } catch (error) {
      this.logger.error('Failed to get subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Create free subscription
   */
  private async createFreeSubscription(userId: string, plan: SubscriptionPlan): Promise<UserSubscription> {
    const query = `
      INSERT INTO subscriptions (
        user_id, plan, status, workflow_executions_limit,
        api_calls_limit, server_installs_limit
      ) VALUES ($1, $2, 'active', $3, $4, $5)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      userId,
      plan.tier,
      plan.limits.workflow_executions,
      plan.limits.api_calls_per_month,
      plan.limits.team_members // Using team_members as server install limit
    ]);

    return this.mapSubscriptionFromDB(result.rows[0]);
  }

  /**
   * Create subscription database record
   */
  private async createSubscriptionRecord(
    userId: string,
    plan: SubscriptionPlan,
    stripeSubscriptionId: string,
    stripeCustomerId: string
  ): Promise<UserSubscription> {
    const query = `
      INSERT INTO subscriptions (
        user_id, plan, status, stripe_subscription_id, stripe_customer_id,
        workflow_executions_limit, api_calls_limit, server_installs_limit,
        current_period_start, current_period_end
      ) VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const result = await this.pool.query(query, [
      userId,
      plan.tier,
      stripeSubscriptionId,
      stripeCustomerId,
      plan.limits.workflow_executions,
      plan.limits.api_calls_per_month,
      plan.limits.team_members,
      now,
      periodEnd
    ]);

    return this.mapSubscriptionFromDB(result.rows[0]);
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const existingQuery = 'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 LIMIT 1';
      const existingResult = await this.pool.query(existingQuery, [userId]);
      
      if (existingResult.rows.length > 0 && existingResult.rows[0].stripe_customer_id) {
        const customer = await this.stripe.customers.retrieve(existingResult.rows[0].stripe_customer_id);
        return customer as Stripe.Customer;
      }

      // Get user details
      const userQuery = 'SELECT email, name FROM users WHERE id = $1';
      const userResult = await this.pool.query(userQuery, [userId]);
      const user = userResult.rows[0];

      // Create new Stripe customer
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          user_id: userId
        }
      });

      return customer;
    } catch (error) {
      this.logger.error('Failed to get/create Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe subscription events
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.user_id;
    this.logger.info('Stripe subscription created', { 
      subscriptionId: subscription.id,
      userId 
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.user_id;
    this.logger.info('Stripe subscription updated', { 
      subscriptionId: subscription.id,
      userId 
    });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.user_id;
    
    await this.pool.query(
      'UPDATE subscriptions SET status = $1, canceled_at = NOW() WHERE stripe_subscription_id = $2',
      ['canceled', subscription.id]
    );

    this.logger.info('Subscription canceled', { 
      subscriptionId: subscription.id,
      userId 
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    this.logger.info('Payment succeeded', { 
      invoiceId: invoice.id,
      amount: invoice.amount_paid 
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.warn('Payment failed', { 
      invoiceId: invoice.id,
      amount: invoice.amount_due 
    });
  }

  /**
   * Helper methods
   */
  private getCurrentBillingPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getUsageLimit(subscription: UserSubscription, eventType: string): number {
    switch (eventType) {
      case 'workflow_execution':
        return subscription.limits.workflow_executions_limit;
      case 'api_call':
        return subscription.limits.api_calls_limit;
      case 'server_install':
        return subscription.limits.server_installs_limit;
      default:
        return 0;
    }
  }

  private async updateSubscriptionPlan(userId: string, plan: SubscriptionPlan): Promise<UserSubscription> {
    const query = `
      UPDATE subscriptions 
      SET plan = $1, 
          workflow_executions_limit = $2,
          api_calls_limit = $3,
          server_installs_limit = $4,
          updated_at = NOW()
      WHERE user_id = $5 AND status = 'active'
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      plan.tier,
      plan.limits.workflow_executions,
      plan.limits.api_calls_per_month,
      plan.limits.team_members,
      userId
    ]);

    return this.mapSubscriptionFromDB(result.rows[0]);
  }

  private async downgradeToFree(userId: string, currentSubscription: UserSubscription): Promise<UserSubscription> {
    // Cancel Stripe subscription
    if (currentSubscription.stripe_subscription_id) {
      await this.stripe.subscriptions.cancel(currentSubscription.stripe_subscription_id);
    }

    // Create free subscription
    const freePlan = SUBSCRIPTION_PLANS.find(p => p.tier === 'free')!;
    return this.createFreeSubscription(userId, freePlan);
  }

  private async getUsageMetrics(): Promise<any> {
    // This would return comprehensive usage analytics
    return {
      total_executions: 15670,
      total_api_calls: 234500,
      total_server_installs: 5670,
      avg_executions_per_user: 45.2
    };
  }

  private mapSubscriptionFromDB(row: any): UserSubscription {
    return {
      id: row.id,
      user_id: row.user_id,
      plan: row.plan,
      status: row.status,
      stripe_subscription_id: row.stripe_subscription_id,
      stripe_customer_id: row.stripe_customer_id,
      current_period_start: row.current_period_start,
      current_period_end: row.current_period_end,
      usage: {
        workflow_executions_used: parseInt(row.workflow_executions_used) || 0,
        api_calls_used: parseInt(row.api_calls_used) || 0,
        server_installs_used: parseInt(row.server_installs_used) || 0
      },
      limits: {
        workflow_executions_limit: parseInt(row.workflow_executions_limit) || 0,
        api_calls_limit: parseInt(row.api_calls_limit) || 0,
        server_installs_limit: parseInt(row.server_installs_limit) || 0
      },
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

/**
 * Factory function to create billing system
 */
export function createMCPBillingSystem(
  stripeSecretKey: string,
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): MCPBillingSystem {
  return new MCPBillingSystem(stripeSecretKey, pool, logger, errorManager, eventBus);
}