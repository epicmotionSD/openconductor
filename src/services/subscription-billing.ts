/**
 * Enterprise Subscription & Billing Service
 * 
 * Handles Trinity Agent subscription management and billing integration
 * Based on proven x3o.ai system with Stripe integration
 */

import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { Logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const logger = new Logger('SubscriptionBilling');

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  agentLimits: {
    oracle: number | null; // null = unlimited
    sentinel: number | null;
    sage: number | null;
  };
  features: string[];
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

export interface SubscriptionStatus {
  planType: 'trial' | 'professional' | 'team' | 'enterprise';
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
  usage: {
    oracle: { used: number; limit: number | null };
    sentinel: { used: number; limit: number | null };
    sage: { used: number; limit: number | null };
  };
  billingInfo: {
    customerId?: string;
    subscriptionId?: string;
    nextInvoiceAmount?: number;
    nextInvoiceDate?: Date;
  };
}

export class SubscriptionBillingService {
  private static readonly PLANS: Record<string, SubscriptionPlan> = {
    professional: {
      id: 'professional',
      name: 'Professional',
      description: 'Perfect for growing businesses',
      monthlyPrice: 299,
      yearlyPrice: 2990, // 16% discount
      agentLimits: {
        oracle: 1000,
        sentinel: 500,
        sage: 2000
      },
      features: [
        'All Trinity Agents included',
        '1,000 Oracle predictions/month',
        '500 Sentinel monitoring checks/month', 
        '2,000 Sage optimizations/month',
        'Standard support',
        'ROI tracking & analytics'
      ],
      stripePriceIds: {
        monthly: 'price_trinity_professional_monthly',
        yearly: 'price_trinity_professional_yearly'
      }
    },
    team: {
      id: 'team',
      name: 'Team',
      description: 'For growing teams and departments',
      monthlyPrice: 899,
      yearlyPrice: 8990, // 16% discount
      agentLimits: {
        oracle: 5000,
        sentinel: 2500,
        sage: 10000
      },
      features: [
        'Everything in Professional',
        '5,000 Oracle predictions/month',
        '2,500 Sentinel monitoring checks/month',
        '10,000 Sage optimizations/month',
        'Priority support',
        'Team collaboration features',
        'Advanced workflow automation'
      ],
      stripePriceIds: {
        monthly: 'price_trinity_team_monthly',
        yearly: 'price_trinity_team_yearly'
      }
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Unlimited power for large organizations',
      monthlyPrice: 2999,
      yearlyPrice: 29990, // 16% discount
      agentLimits: {
        oracle: null, // unlimited
        sentinel: null,
        sage: null
      },
      features: [
        'Unlimited Trinity Agent interactions',
        'Custom workflow development',
        'Dedicated customer success manager',
        'White-label options',
        'SSO integration',
        'SLA guarantees',
        'On-premises deployment option'
      ],
      stripePriceIds: {
        monthly: 'price_trinity_enterprise_monthly',
        yearly: 'price_trinity_enterprise_yearly'
      }
    }
  };

  /**
   * Get available subscription plans
   */
  static getAvailablePlans(): SubscriptionPlan[] {
    return Object.values(this.PLANS);
  }

  /**
   * Get specific plan details
   */
  static getPlan(planId: string): SubscriptionPlan | null {
    return this.PLANS[planId] || null;
  }

  /**
   * Create Stripe customer and start subscription
   */
  static async createSubscription(
    organizationId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    paymentMethodId: string
  ): Promise<{
    success: boolean;
    subscriptionId?: string;
    clientSecret?: string;
    error?: string;
  }> {
    try {
      const plan = this.getPlan(planId);
      if (!plan) {
        return { success: false, error: 'Invalid plan selected' };
      }

      // Get organization details
      const organization = await prisma.organizations.findUnique({
        where: { id: organizationId },
        include: { 
          users: { 
            where: { role: 'owner' },
            take: 1
          }
        }
      });

      if (!organization) {
        return { success: false, error: 'Organization not found' };
      }

      const owner = organization.users[0];
      if (!owner) {
        return { success: false, error: 'Organization owner not found' };
      }

      let customerId = organization.stripe_customer_id;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: owner.email,
          name: organization.name,
          metadata: {
            organizationId: organizationId,
            planId: planId
          }
        });
        customerId = customer.id;

        // Update organization with customer ID
        await prisma.organizations.update({
          where: { id: organizationId },
          data: { stripe_customer_id: customerId }
        });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const priceId = plan.stripePriceIds[billingCycle];
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          organizationId: organizationId,
          planId: planId,
          billingCycle: billingCycle
        }
      });

      // Update organization subscription status
      await prisma.organizations.update({
        where: { id: organizationId },
        data: {
          plan_type: planId as any,
          subscription_status: subscription.status as any,
          stripe_subscription_id: subscription.id,
          trial_ends_at: null // End trial when subscription starts
        }
      });

      // Create subscription items in database
      await this.createSubscriptionItems(organizationId, planId, subscription.id);

      logger.info(`Subscription created for organization ${organizationId}: ${subscription.id}`);

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret
      };
    } catch (error) {
      logger.error('Subscription creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription creation failed'
      };
    }
  }

  /**
   * Create subscription items in database
   */
  private static async createSubscriptionItems(
    organizationId: string,
    planId: string,
    stripeSubscriptionId: string
  ): Promise<void> {
    const plan = this.getPlan(planId)!;
    
    const agentTypes: Array<keyof typeof plan.agentLimits> = ['oracle', 'sentinel', 'sage'];
    
    for (const agentType of agentTypes) {
      await prisma.subscription_items.create({
        data: {
          organization_id: organizationId,
          agent_type: agentType,
          plan_name: plan.name,
          interaction_limit: plan.agentLimits[agentType],
          monthly_price: plan.monthlyPrice / 3, // Split equally among agents
          stripe_subscription_item_id: stripeSubscriptionId,
          is_active: true
        }
      });
    }
  }

  /**
   * Get subscription status for an organization
   */
  static async getSubscriptionStatus(organizationId: string): Promise<SubscriptionStatus> {
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId },
      include: {
        subscription_items: {
          where: { is_active: true }
        }
      }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Calculate current usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usage = await Promise.all(['oracle', 'sentinel', 'sage'].map(async (agentType) => {
      const used = await prisma.ai_interactions.count({
        where: {
          organization_id: organizationId,
          agent_type: agentType,
          created_at: {
            gte: startOfMonth
          }
        }
      });

      const subscriptionItem = organization.subscription_items.find(item => item.agent_type === agentType);
      const limit = subscriptionItem?.interaction_limit;

      return {
        agentType,
        used,
        limit
      };
    }));

    // Get billing info from Stripe if subscription exists
    let billingInfo: SubscriptionStatus['billingInfo'] = {};
    if (organization.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(organization.stripe_subscription_id);
        const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
          customer: organization.stripe_customer_id!
        });

        billingInfo = {
          customerId: organization.stripe_customer_id || undefined,
          subscriptionId: organization.stripe_subscription_id,
          nextInvoiceAmount: upcomingInvoice.amount_due,
          nextInvoiceDate: new Date(upcomingInvoice.period_end * 1000)
        };
      } catch (error) {
        logger.error('Failed to retrieve billing info:', error);
      }
    }

    return {
      planType: organization.plan_type as any,
      status: organization.subscription_status as any,
      currentPeriodEnd: organization.trial_ends_at, // This should be updated to track subscription period
      cancelAtPeriodEnd: false, // Would need to check Stripe subscription
      trialEndsAt: organization.trial_ends_at,
      usage: {
        oracle: { used: usage[0].used, limit: usage[0].limit },
        sentinel: { used: usage[1].used, limit: usage[1].limit },
        sage: { used: usage[2].used, limit: usage[2].limit }
      },
      billingInfo
    };
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    logger.info(`Processing Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Webhook processing failed for ${event.type}:`, error);
      throw error;
    }
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const organizationId = invoice.metadata?.organizationId;
    if (!organizationId) return;

    await prisma.organizations.update({
      where: { id: organizationId },
      data: {
        subscription_status: 'active'
      }
    });

    logger.info(`Payment succeeded for organization ${organizationId}`);
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const organizationId = invoice.metadata?.organizationId;
    if (!organizationId) return;

    await prisma.organizations.update({
      where: { id: organizationId },
      data: {
        subscription_status: 'past_due'
      }
    });

    logger.info(`Payment failed for organization ${organizationId}`);
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    await prisma.organizations.update({
      where: { id: organizationId },
      data: {
        subscription_status: subscription.status as any
      }
    });

    logger.info(`Subscription updated for organization ${organizationId}: ${subscription.status}`);
  }

  private static async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    await prisma.organizations.update({
      where: { id: organizationId },
      data: {
        subscription_status: 'canceled',
        stripe_subscription_id: null
      }
    });

    // Deactivate subscription items
    await prisma.subscription_items.updateMany({
      where: { organization_id: organizationId },
      data: { is_active: false }
    });

    logger.info(`Subscription canceled for organization ${organizationId}`);
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(
    organizationId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const organization = await prisma.organizations.findUnique({
        where: { id: organizationId }
      });

      if (!organization?.stripe_subscription_id) {
        return { success: false, error: 'No active subscription found' };
      }

      await stripe.subscriptions.update(organization.stripe_subscription_id, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      logger.info(`Subscription cancellation scheduled for organization ${organizationId}`);
      return { success: true };
    } catch (error) {
      logger.error('Subscription cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed'
      };
    }
  }

  /**
   * Update subscription plan
   */
  static async updateSubscription(
    organizationId: string,
    newPlanId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const newPlan = this.getPlan(newPlanId);
      if (!newPlan) {
        return { success: false, error: 'Invalid plan selected' };
      }

      const organization = await prisma.organizations.findUnique({
        where: { id: organizationId }
      });

      if (!organization?.stripe_subscription_id) {
        return { success: false, error: 'No active subscription found' };
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(organization.stripe_subscription_id);
      
      // Update subscription with new price
      await stripe.subscriptions.update(organization.stripe_subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPlan.stripePriceIds[billingCycle]
        }],
        proration_behavior: 'create_prorations'
      });

      // Update database
      await prisma.organizations.update({
        where: { id: organizationId },
        data: { plan_type: newPlanId as any }
      });

      // Update subscription items
      await prisma.subscription_items.updateMany({
        where: { organization_id: organizationId },
        data: { is_active: false }
      });

      await this.createSubscriptionItems(organizationId, newPlanId, organization.stripe_subscription_id);

      logger.info(`Subscription updated for organization ${organizationId} to plan ${newPlanId}`);
      return { success: true };
    } catch (error) {
      logger.error('Subscription update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Generate usage report for billing
   */
  static async generateUsageReport(organizationId: string, month: Date): Promise<{
    period: { start: Date; end: Date };
    usage: Array<{
      agentType: string;
      interactions: number;
      limit: number | null;
      overage: number;
      cost: number;
    }>;
    totalCost: number;
    roiMetrics: {
      totalSavings: number;
      roiMultiplier: number;
      efficiencyGain: number;
    };
  }> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Get usage for each agent type
    const usage = await Promise.all(['oracle', 'sentinel', 'sage'].map(async (agentType) => {
      const interactions = await prisma.ai_interactions.count({
        where: {
          organization_id: organizationId,
          agent_type: agentType,
          created_at: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const subscriptionItem = await prisma.subscription_items.findFirst({
        where: {
          organization_id: organizationId,
          agent_type: agentType,
          is_active: true
        }
      });

      const limit = subscriptionItem?.interaction_limit;
      const overage = limit ? Math.max(0, interactions - limit) : 0;
      const overageCost = overage * 0.10; // $0.10 per overage interaction

      return {
        agentType,
        interactions,
        limit,
        overage,
        cost: overageCost
      };
    }));

    const totalCost = usage.reduce((sum, item) => sum + item.cost, 0);

    // Calculate ROI metrics
    const roiMetrics = await this.calculateROIMetrics(organizationId, startOfMonth, endOfMonth);

    return {
      period: { start: startOfMonth, end: endOfMonth },
      usage,
      totalCost,
      roiMetrics
    };
  }

  private static async calculateROIMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSavings: number;
    roiMultiplier: number;
    efficiencyGain: number;
  }> {
    const totalSavings = await prisma.ai_interactions.aggregate({
      where: {
        organization_id: organizationId,
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        roi_impact: true
      }
    });

    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId },
      include: {
        subscription_items: {
          where: { is_active: true }
        }
      }
    });

    const monthlySubscriptionCost = organization?.subscription_items.reduce(
      (sum, item) => sum + item.monthly_price, 0
    ) || 0;

    const savings = totalSavings._sum.roi_impact || 0;
    const roiMultiplier = monthlySubscriptionCost > 0 ? savings / monthlySubscriptionCost : 0;
    const efficiencyGain = Math.min(95, Math.max(10, roiMultiplier * 15)); // Convert to efficiency percentage

    return {
      totalSavings: savings,
      roiMultiplier,
      efficiencyGain
    };
  }
}