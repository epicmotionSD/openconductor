"use strict";
/**
 * SportIntel Payment Processor
 *
 * Handles payment processing, billing, and webhook events for subscription management.
 * Integrates with Stripe for payment processing and supports the $8.2M ARR business model.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportIntelPaymentProcessor = void 0;
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = require("../../utils/logger");
const development_config_1 = require("../../config/sportintel/development-config");
const subscription_manager_1 = require("./subscription-manager");
/**
 * Payment Processor for SportIntel subscriptions
 */
class SportIntelPaymentProcessor {
    stripe;
    logger;
    config;
    subscriptionManager;
    eventBus;
    webhookEndpointSecret;
    constructor(subscriptionManager, eventBus) {
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.logger = logger_1.Logger.getInstance();
        this.subscriptionManager = subscriptionManager;
        this.eventBus = eventBus;
        // Initialize Stripe
        const stripeConfig = this.getStripeConfig();
        this.stripe = new stripe_1.default(stripeConfig.secretKey, {
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
    async createCustomer(userId, email, name) {
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
        }
        catch (error) {
            this.logger.error('Failed to create Stripe customer', { error, userId, email });
            throw new Error(`Failed to create customer: ${error.message}`);
        }
    }
    /**
     * Create subscription with payment method
     */
    async createSubscription(customerId, userId, tier, paymentMethodId, trialDays) {
        try {
            const plan = this.subscriptionManager.getPlan(tier);
            if (!plan) {
                throw new Error(`Invalid subscription tier: ${tier}`);
            }
            // Get or create Stripe price
            const priceId = await this.getOrCreateStripePrice(plan);
            // Create subscription parameters
            const subscriptionParams = {
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
            let paymentIntent;
            const latestInvoice = stripeSubscription.latest_invoice;
            if (latestInvoice?.payment_intent) {
                const pi = latestInvoice.payment_intent;
                paymentIntent = {
                    id: pi.id,
                    amount: pi.amount,
                    currency: pi.currency,
                    status: pi.status,
                    clientSecret: pi.client_secret,
                    customerId,
                    subscriptionId: stripeSubscription.id,
                };
            }
            return { subscription: stripeSubscription, paymentIntent };
        }
        catch (error) {
            this.logger.error('Failed to create subscription', { error, customerId, userId, tier });
            throw new Error(`Failed to create subscription: ${error.message}`);
        }
    }
    /**
     * Update subscription (upgrade/downgrade)
     */
    async updateSubscription(stripeSubscriptionId, newTier, prorationBehavior = 'create_prorations') {
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
        }
        catch (error) {
            this.logger.error('Failed to update subscription', { error, stripeSubscriptionId, newTier });
            throw new Error(`Failed to update subscription: ${error.message}`);
        }
    }
    /**
     * Cancel subscription
     */
    async cancelSubscription(stripeSubscriptionId, cancelAtPeriodEnd = true) {
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
        }
        catch (error) {
            this.logger.error('Failed to cancel subscription', { error, stripeSubscriptionId });
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }
    /**
     * Create setup intent for payment method
     */
    async createSetupIntent(customerId) {
        try {
            const setupIntent = await this.stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
                usage: 'off_session',
            });
            return setupIntent;
        }
        catch (error) {
            this.logger.error('Failed to create setup intent', { error, customerId });
            throw new Error(`Failed to create setup intent: ${error.message}`);
        }
    }
    /**
     * Get customer payment methods
     */
    async getPaymentMethods(customerId) {
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
        }
        catch (error) {
            this.logger.error('Failed to get payment methods', { error, customerId });
            throw new Error(`Failed to get payment methods: ${error.message}`);
        }
    }
    /**
     * Get customer invoices
     */
    async getInvoices(customerId, limit = 10) {
        try {
            const invoices = await this.stripe.invoices.list({
                customer: customerId,
                limit,
            });
            return invoices.data.map(invoice => ({
                id: invoice.id,
                subscriptionId: invoice.subscription,
                customerId: invoice.customer,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: invoice.status,
                dueDate: new Date(invoice.due_date * 1000),
                paidAt: invoice.status_transitions.paid_at
                    ? new Date(invoice.status_transitions.paid_at * 1000)
                    : undefined,
                hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
                invoicePdf: invoice.invoice_pdf || undefined,
            }));
        }
        catch (error) {
            this.logger.error('Failed to get invoices', { error, customerId });
            throw new Error(`Failed to get invoices: ${error.message}`);
        }
    }
    /**
     * Handle Stripe webhook events
     */
    async handleWebhook(payload, signature) {
        try {
            const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookEndpointSecret);
            this.logger.info('Stripe webhook received', { type: event.type, id: event.id });
            switch (event.type) {
                case 'customer.subscription.created':
                    await this.handleSubscriptionCreated(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'customer.subscription.trial_will_end':
                    await this.handleTrialWillEnd(event.data.object);
                    break;
                default:
                    this.logger.info('Unhandled webhook event type', { type: event.type });
            }
        }
        catch (error) {
            this.logger.error('Webhook handling failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Get billing analytics
     */
    async getBillingAnalytics(startDate, endDate) {
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
        }
        catch (error) {
            this.logger.error('Failed to get billing analytics', { error });
            throw new Error(`Failed to get billing analytics: ${error.message}`);
        }
    }
    // Private helper methods
    getStripeConfig() {
        const environment = this.config.getConfig().environment;
        return {
            secretKey: environment === 'production'
                ? process.env.STRIPE_SECRET_KEY
                : process.env.STRIPE_SECRET_KEY_TEST,
            publishableKey: environment === 'production'
                ? process.env.STRIPE_PUBLISHABLE_KEY
                : process.env.STRIPE_PUBLISHABLE_KEY_TEST,
            webhookSecret: environment === 'production'
                ? process.env.STRIPE_WEBHOOK_SECRET
                : process.env.STRIPE_WEBHOOK_SECRET_TEST,
        };
    }
    async getOrCreateStripePrice(plan) {
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
    async handleSubscriptionCreated(subscription) {
        const userId = subscription.metadata.userId;
        const tier = subscription.metadata.tier;
        if (userId && tier) {
            this.eventBus.publish('billing.subscription.created', {
                subscriptionId: subscription.id,
                userId,
                tier,
                status: subscription.status,
            });
        }
    }
    async handleSubscriptionUpdated(subscription) {
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
    async handleSubscriptionDeleted(subscription) {
        const userId = subscription.metadata.userId;
        if (userId) {
            const localSubscription = await this.subscriptionManager.getUserSubscription(userId);
            if (localSubscription) {
                await this.subscriptionManager.updateSubscription(localSubscription.id, {
                    status: subscription_manager_1.SubscriptionStatus.CANCELED,
                });
            }
            this.eventBus.publish('billing.subscription.canceled', {
                subscriptionId: subscription.id,
                userId,
            });
        }
    }
    async handlePaymentSucceeded(invoice) {
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        this.eventBus.publish('billing.payment.succeeded', {
            invoiceId: invoice.id,
            subscriptionId,
            customerId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
        });
    }
    async handlePaymentFailed(invoice) {
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        // Update subscription status to past_due
        if (subscriptionId) {
            try {
                const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata.userId;
                if (userId) {
                    const localSubscription = await this.subscriptionManager.getUserSubscription(userId);
                    if (localSubscription) {
                        await this.subscriptionManager.updateSubscription(localSubscription.id, {
                            status: subscription_manager_1.SubscriptionStatus.PAST_DUE,
                        });
                    }
                }
            }
            catch (error) {
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
    async handleTrialWillEnd(subscription) {
        const userId = subscription.metadata.userId;
        if (userId) {
            this.eventBus.publish('billing.trial.ending', {
                subscriptionId: subscription.id,
                userId,
                trialEnd: new Date(subscription.trial_end * 1000),
            });
        }
    }
    mapStripeStatus(stripeStatus) {
        switch (stripeStatus) {
            case 'active': return subscription_manager_1.SubscriptionStatus.ACTIVE;
            case 'past_due': return subscription_manager_1.SubscriptionStatus.PAST_DUE;
            case 'canceled': return subscription_manager_1.SubscriptionStatus.CANCELED;
            case 'unpaid': return subscription_manager_1.SubscriptionStatus.UNPAID;
            case 'incomplete': return subscription_manager_1.SubscriptionStatus.INCOMPLETE;
            case 'incomplete_expired': return subscription_manager_1.SubscriptionStatus.INCOMPLETE_EXPIRED;
            case 'trialing': return subscription_manager_1.SubscriptionStatus.TRIALING;
            default: return subscription_manager_1.SubscriptionStatus.CANCELED;
        }
    }
}
exports.SportIntelPaymentProcessor = SportIntelPaymentProcessor;
exports.default = SportIntelPaymentProcessor;
//# sourceMappingURL=payment-processor.js.map