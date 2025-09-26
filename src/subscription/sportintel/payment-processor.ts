/**
 * SportIntel Payment Processor
 * 
 * Handles payment processing, billing, and webhook events for subscription management.
 * Integrates with Stripe for payment processing and supports the $8.2M ARR business model.
 */

import Stripe from 'stripe';
import { Logger } from '../../utils/logger';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
import { 
  SportIntelSubscriptionManager, 
  SubscriptionTier, 
  SubscriptionStatus,
  BillingEvent 
} from './subscription-manager';
import { EventBus } from '../../events/event-bus';

interface PaymentMethodData {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

interface InvoiceData {
  id: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  dueDate: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  customerId: string;
  subscriptionId?: string;
}

/**
 * Payment Processor for SportIntel subscriptions
 */
export class SportIntelPaymentProcessor {
  private stripe: Stripe;
  private logger: Logger;
  private config: SportIntelConfigManager;
  private subscriptionManager: SportIntelSubscriptionManager;
  private eventBus: EventBus;
  private webhookEndpointSecret: string;

  constructor(subscriptionManager: SportIntelSubscriptionManager, eventBus: EventBus) {
    this.config = SportIntelConfigManager.getInstance();
    this.logger = Logger.getInstance();
    this.subscriptionManager = subscriptionManager;
    this.eventBus = eventBus;

    // Initialize Stripe
    const stripeConfig = this.getStripeConfig();
    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
    this.webhookEndpointSecret = stripeConfig.webhookSecret;

    this.logger.info('Payment processor initialized', {
      environment: this.config.getConfig().environment,
    });
  }

  /**
   * Create Stripe customer for user
   */
  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          source: 'sportintel',
        },
      });

      this.logger.info('Stripe customer created', { customerId: customer.id, userId, email });
      
      // Emit customer created event
      this.eventBus.publish('billing.customer.created', {
        customerId: customer.id,
        userId,
        email,
      });

      return customer;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer', { error, userId, email });
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Create subscription with payment method
   */
  async createSubscription(
    customerId: string,
    userId: string,
    tier: SubscriptionTier,
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<{ subscription: Stripe.Subscription; paymentIntent?: PaymentIntent }> {
    try {
      const plan = this.subscriptionManager.getPlan(tier);
      if (!plan) {
        throw new Error(`Invalid subscription tier: ${tier}`);
      }

      // Get or create Stripe price
      const priceId = await this.getOrCreateStripePrice(plan);

      // Create subscription parameters
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          userId,
          tier,
          source: 'sportintel',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      // Add trial period if specified
      if (trialDays && trialDays > 0) {
        subscriptionParams.trial_period_days = trialDays;
      }

      // Add payment method if provided
      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      // Create Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.create(subscriptionParams);

      this.logger.info('Stripe subscription created', {
        subscriptionId: stripeSubscription.id,
        customerId,
        userId,
        tier,
        trialDays,
      });

      // Create local subscription record
      await this.subscriptionManager.createSubscription(userId, tier, trialDays);

      // Handle payment intent if immediate payment required
      let paymentIntent: PaymentIntent | undefined;
      const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;
      
      if (latestInvoice?.payment_intent) {
        const pi = latestInvoice.payment_intent as Stripe.PaymentIntent;
        paymentIntent = {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          clientSecret: pi.client_secret!,
          customerId,
          subscriptionId: stripeSubscription.id,
        };
      }

      return { subscription: stripeSubscription, paymentIntent };
    } catch (error) {
      this.logger.error('Failed to create subscription', { error, customerId, userId, tier });
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    stripeSubscriptionId: string,
    newTier: SubscriptionTier,
    prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
  ): Promise<Stripe.Subscription> {
    try {
      const newPlan = this.subscriptionManager.getPlan(newTier);
      if (!newPlan) {
        throw new Error(`Invalid subscription tier: ${newTier}`);
      }

      // Get current subscription
      const currentSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      const currentItem = currentSubscription.items.data[0];

      // Get or create new price
      const newPriceId = await this.getOrCreateStripePrice(newPlan);

      // Update subscription
      const updatedSubscription = await this.stripe.subscriptions.update(stripeSubscriptionId, {
        items: [{
          id: currentItem.id,
          price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
        metadata: {
          ...currentSubscription.metadata,
          tier: newTier,
        },
      });

      this.logger.info('Subscription updated', {
        subscriptionId: stripeSubscriptionId,
        newTier,
        prorationBehavior,
      });

      // Update local subscription
      const userId = currentSubscription.metadata.userId;
      if (userId) {
        const localSubscription = await this.subscriptionManager.getUserSubscription(userId);
        if (localSubscription) {
          await this.subscriptionManager.updateSubscription(localSubscription.id, {
            plan: newPlan,
          });
        }
      }

      return updatedSubscription;
    } catch (error) {
      this.logger.error('Failed to update subscription', { error, stripeSubscriptionId, newTier });
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    stripeSubscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    try {
      const canceledSubscription = await this.stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
        metadata: {
          canceled_at: new Date().toISOString(),
        },
      });

      this.logger.info('Subscription canceled', {
        subscriptionId: stripeSubscriptionId,
        cancelAtPeriodEnd,
      });

      // Update local subscription
      const userId = canceledSubscription.metadata.userId;
      if (userId) {
        const localSubscription = await this.subscriptionManager.getUserSubscription(userId);
        if (localSubscription) {
          await this.subscriptionManager.cancelSubscription(localSubscription.id, cancelAtPeriodEnd);
        }
      }

      return canceledSubscription;
    } catch (error) {
      this.logger.error('Failed to cancel subscription', { error, stripeSubscriptionId });
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Create setup intent for payment method
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      return setupIntent;
    } catch (error) {
      this.logger.error('Failed to create setup intent', { error, customerId });
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethodData[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card',
        last4: pm.card?.last4 || '',
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
      }));
    } catch (error) {
      this.logger.error('Failed to get payment methods', { error, customerId });
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  /**
   * Get customer invoices
   */
  async getInvoices(customerId: string, limit: number = 10): Promise<InvoiceData[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        subscriptionId: invoice.subscription as string,
        customerId: invoice.customer as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status as any,
        dueDate: new Date(invoice.due_date! * 1000),
        paidAt: invoice.status_transitions.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000) 
          : undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
      }));
    } catch (error) {
      this.logger.error('Failed to get invoices', { error, customerId });
      throw new Error(`Failed to get invoices: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: string | Buffer, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookEndpointSecret
      );

      this.logger.info('Stripe webhook received', { type: event.type, id: event.id });

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;
        
        default:
          this.logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      this.logger.error('Webhook handling failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get billing analytics
   */
  async getBillingAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      // Get subscription analytics from subscription manager
      const subscriptionAnalytics = await this.subscriptionManager.getSubscriptionAnalytics();

      // Get payment analytics from Stripe
      const charges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000),
        },
        limit: 100,
      });

      const paymentAnalytics = {
        totalRevenue: charges.data.reduce((sum, charge) => sum + charge.amount, 0),
        successfulPayments: charges.data.filter(c => c.status === 'succeeded').length,
        failedPayments: charges.data.filter(c => c.status === 'failed').length,
        refunds: charges.data.reduce((sum, charge) => sum + charge.amount_refunded, 0),
      };

      return {
        subscriptions: subscriptionAnalytics,
        payments: paymentAnalytics,
        period: { startDate, endDate },
      };
    } catch (error) {
      this.logger.error('Failed to get billing analytics', { error });
      throw new Error(`Failed to get billing analytics: ${error.message}`);
    }
  }

  // Private helper methods

  private getStripeConfig() {
    const environment = this.config.getConfig().environment;
    
    return {
      secretKey: environment === 'production'
        ? process.env.STRIPE_SECRET_KEY!
        : process.env.STRIPE_SECRET_KEY_TEST!,
      publishableKey: environment === 'production'
        ? process.env.STRIPE_PUBLISHABLE_KEY!
        : process.env.STRIPE_PUBLISHABLE_KEY_TEST!,
      webhookSecret: environment === 'production'
        ? process.env.STRIPE_WEBHOOK_SECRET!
        : process.env.STRIPE_WEBHOOK_SECRET_TEST!,
    };
  }

  private async getOrCreateStripePrice(plan: any): Promise<string> {
    // In a real implementation, you would cache price IDs
    // For now, create prices on demand (not recommended for production)
    
    const price = await this.stripe.prices.create({
      currency: 'usd',
      unit_amount: plan.price,
      recurring: { interval: 'month' },
      product_data: {
        name: `SportIntel ${plan.name}`,
        description: plan.description,
      },
      metadata: {
        tier: plan.tier,
        source: 'sportintel',
      },
    });

    return price.id;
  }

  // Webhook event handlers

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    const tier = subscription.metadata.tier as SubscriptionTier;

    if (userId && tier) {
      this.eventBus.publish('billing.subscription.created', {
        subscriptionId: subscription.id,
        userId,
        tier,
        status: subscription.status,
      });
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;

    if (userId) {
      // Update local subscription status
      const localSubscription = await this.subscriptionManager.getUserSubscription(userId);
      if (localSubscription) {
        await this.subscriptionManager.updateSubscription(localSubscription.id, {
          status: this.mapStripeStatus(subscription.status),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
      }

      this.eventBus.publish('billing.subscription.updated', {
        subscriptionId: subscription.id,
        userId,
        status: subscription.status,
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;

    if (userId) {
      const localSubscription = await this.subscriptionManager.getUserSubscription(userId);
      if (localSubscription) {
        await this.subscriptionManager.updateSubscription(localSubscription.id, {
          status: SubscriptionStatus.CANCELED,
        });
      }

      this.eventBus.publish('billing.subscription.canceled', {
        subscriptionId: subscription.id,
        userId,
      });
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    this.eventBus.publish('billing.payment.succeeded', {
      invoiceId: invoice.id,
      subscriptionId,
      customerId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    // Update subscription status to past_due
    if (subscriptionId) {
      try {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.userId;
        
        if (userId) {
          const localSubscription = await this.subscriptionManager.getUserSubscription(userId);
          if (localSubscription) {
            await this.subscriptionManager.updateSubscription(localSubscription.id, {
              status: SubscriptionStatus.PAST_DUE,
            });
          }
        }
      } catch (error) {
        this.logger.error('Failed to update subscription status after payment failure', { error });
      }
    }

    this.eventBus.publish('billing.payment.failed', {
      invoiceId: invoice.id,
      subscriptionId,
      customerId,
      amount: invoice.amount_due,
      currency: invoice.currency,
    });
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;

    if (userId) {
      this.eventBus.publish('billing.trial.ending', {
        subscriptionId: subscription.id,
        userId,
        trialEnd: new Date(subscription.trial_end! * 1000),
      });
    }
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active': return SubscriptionStatus.ACTIVE;
      case 'past_due': return SubscriptionStatus.PAST_DUE;
      case 'canceled': return SubscriptionStatus.CANCELED;
      case 'unpaid': return SubscriptionStatus.UNPAID;
      case 'incomplete': return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired': return SubscriptionStatus.INCOMPLETE_EXPIRED;
      case 'trialing': return SubscriptionStatus.TRIALING;
      default: return SubscriptionStatus.CANCELED;
    }
  }
}

export default SportIntelPaymentProcessor;