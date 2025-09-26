/**
 * SportIntel Payment Processor
 *
 * Handles payment processing, billing, and webhook events for subscription management.
 * Integrates with Stripe for payment processing and supports the $8.2M ARR business model.
 */
import Stripe from 'stripe';
import { SportIntelSubscriptionManager, SubscriptionTier } from './subscription-manager';
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
export declare class SportIntelPaymentProcessor {
    private stripe;
    private logger;
    private config;
    private subscriptionManager;
    private eventBus;
    private webhookEndpointSecret;
    constructor(subscriptionManager: SportIntelSubscriptionManager, eventBus: EventBus);
    /**
     * Create Stripe customer for user
     */
    createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer>;
    /**
     * Create subscription with payment method
     */
    createSubscription(customerId: string, userId: string, tier: SubscriptionTier, paymentMethodId?: string, trialDays?: number): Promise<{
        subscription: Stripe.Subscription;
        paymentIntent?: PaymentIntent;
    }>;
    /**
     * Update subscription (upgrade/downgrade)
     */
    updateSubscription(stripeSubscriptionId: string, newTier: SubscriptionTier, prorationBehavior?: 'create_prorations' | 'none'): Promise<Stripe.Subscription>;
    /**
     * Cancel subscription
     */
    cancelSubscription(stripeSubscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<Stripe.Subscription>;
    /**
     * Create setup intent for payment method
     */
    createSetupIntent(customerId: string): Promise<Stripe.SetupIntent>;
    /**
     * Get customer payment methods
     */
    getPaymentMethods(customerId: string): Promise<PaymentMethodData[]>;
    /**
     * Get customer invoices
     */
    getInvoices(customerId: string, limit?: number): Promise<InvoiceData[]>;
    /**
     * Handle Stripe webhook events
     */
    handleWebhook(payload: string | Buffer, signature: string): Promise<void>;
    /**
     * Get billing analytics
     */
    getBillingAnalytics(startDate: Date, endDate: Date): Promise<any>;
    private getStripeConfig;
    private getOrCreateStripePrice;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private handleTrialWillEnd;
    private mapStripeStatus;
}
export default SportIntelPaymentProcessor;
//# sourceMappingURL=payment-processor.d.ts.map