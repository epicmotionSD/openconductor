/**
 * SportIntel Subscription API Routes
 *
 * REST API endpoints for subscription management, billing, and user account operations.
 * Integrates with OpenConductor routing and provides comprehensive subscription features.
 */
import { Router } from 'express';
import { SportIntelSubscriptionManager } from './subscription-manager';
import { SportIntelPaymentProcessor } from './payment-processor';
import { EventBus } from '../../events/event-bus';
/**
 * Subscription Routes Handler
 */
export declare class SportIntelSubscriptionRoutes {
    private router;
    private logger;
    private subscriptionManager;
    private paymentProcessor;
    private middleware;
    constructor(subscriptionManager: SportIntelSubscriptionManager, paymentProcessor: SportIntelPaymentProcessor, eventBus: EventBus);
    /**
     * Get router instance
     */
    getRouter(): Router;
    /**
     * Setup all subscription routes
     */
    private setupRoutes;
    /**
     * Get all available subscription plans
     */
    private getPlans;
    /**
     * Get current user's subscription
     */
    private getCurrentSubscription;
    /**
     * Create new subscription
     */
    private createSubscription;
    /**
     * Upgrade/downgrade subscription
     */
    private upgradeSubscription;
    /**
     * Cancel subscription
     */
    private cancelSubscription;
    /**
     * Reactivate canceled subscription
     */
    private reactivateSubscription;
    /**
     * Get user's payment methods
     */
    private getPaymentMethods;
    /**
     * Create setup intent for adding payment method
     */
    private createSetupIntent;
    /**
     * Get user's invoices
     */
    private getInvoices;
    /**
     * Get user's usage statistics
     */
    private getUsage;
    /**
     * Get user account information
     */
    private getAccount;
    /**
     * Update user account
     */
    private updateAccount;
    /**
     * Handle Stripe webhooks
     */
    private handleStripeWebhook;
    /**
     * Get billing analytics (admin only)
     */
    private getBillingAnalytics;
    /**
     * Get all subscriptions (admin only)
     */
    private getAllSubscriptions;
    /**
     * Get specific user subscription (admin only)
     */
    private getUserSubscription;
    /**
     * Setup validation middleware
     */
    private setupValidation;
    /**
     * Validation for create subscription
     */
    private validateCreateSubscription;
    /**
     * Validation for upgrade subscription
     */
    private validateUpgradeSubscription;
    /**
     * Validation for update account
     */
    private validateUpdateAccount;
}
/**
 * Create and configure subscription routes
 */
export declare const createSubscriptionRoutes: (subscriptionManager: SportIntelSubscriptionManager, paymentProcessor: SportIntelPaymentProcessor, eventBus: EventBus) => Router;
export default SportIntelSubscriptionRoutes;
//# sourceMappingURL=subscription-routes.d.ts.map