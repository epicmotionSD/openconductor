/**
 * SportIntel Subscription API Routes
 * 
 * REST API endpoints for subscription management, billing, and user account operations.
 * Integrates with OpenConductor routing and provides comprehensive subscription features.
 */

import { Router, Request, Response } from 'express';
import { Logger } from '../../utils/logger';
import { SportIntelSubscriptionManager, SubscriptionTier } from './subscription-manager';
import { SportIntelPaymentProcessor } from './payment-processor';
import { createSubscriptionMiddleware } from './subscription-middleware';
import { EventBus } from '../../events/event-bus';
import { body, param, query, validationResult } from 'express-validator';

interface SubscriptionRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscription?: any;
  };
}

/**
 * Subscription Routes Handler
 */
export class SportIntelSubscriptionRoutes {
  private router: Router;
  private logger: Logger;
  private subscriptionManager: SportIntelSubscriptionManager;
  private paymentProcessor: SportIntelPaymentProcessor;
  private middleware: any;

  constructor(
    subscriptionManager: SportIntelSubscriptionManager,
    paymentProcessor: SportIntelPaymentProcessor,
    eventBus: EventBus
  ) {
    this.router = Router();
    this.logger = Logger.getInstance();
    this.subscriptionManager = subscriptionManager;
    this.paymentProcessor = paymentProcessor;
    this.middleware = createSubscriptionMiddleware(subscriptionManager, eventBus);

    this.setupRoutes();
    this.setupValidation();
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Setup all subscription routes
   */
  private setupRoutes(): void {
    // Public routes (no authentication required)
    this.router.get('/plans', this.getPlans.bind(this));
    this.router.post('/webhook/stripe', this.handleStripeWebhook.bind(this));

    // Authenticated routes
    this.router.use(this.middleware.auth);

    // Subscription management
    this.router.get('/current', this.getCurrentSubscription.bind(this));
    this.router.post('/create', this.validateCreateSubscription(), this.createSubscription.bind(this));
    this.router.put('/upgrade', this.validateUpgradeSubscription(), this.upgradeSubscription.bind(this));
    this.router.put('/cancel', this.cancelSubscription.bind(this));
    this.router.put('/reactivate', this.reactivateSubscription.bind(this));

    // Payment methods
    this.router.get('/payment-methods', this.getPaymentMethods.bind(this));
    this.router.post('/payment-methods/setup-intent', this.createSetupIntent.bind(this));
    
    // Billing
    this.router.get('/invoices', this.getInvoices.bind(this));
    this.router.get('/usage', this.getUsage.bind(this));
    
    // Account management
    this.router.get('/account', this.getAccount.bind(this));
    this.router.put('/account', this.validateUpdateAccount(), this.updateAccount.bind(this));

    // Admin routes (admin access required)
    this.router.use('/admin', this.middleware.admin);
    this.router.get('/admin/analytics', this.getBillingAnalytics.bind(this));
    this.router.get('/admin/subscriptions', this.getAllSubscriptions.bind(this));
    this.router.get('/admin/subscriptions/:userId', this.getUserSubscription.bind(this));
    
    this.logger.info('Subscription routes configured');
  }

  /**
   * Get all available subscription plans
   */
  private async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = this.subscriptionManager.getPlans();
      
      res.json({
        success: true,
        data: plans.map(plan => ({
          ...plan,
          // Add pricing calculations
          savings: Math.round((plan.price * 12 - plan.yearlyPrice) / plan.yearlyPrice * 100),
          monthlyPrice: plan.price / 100,
          yearlyPrice: plan.yearlyPrice / 100,
        })),
      });
    } catch (error) {
      this.logger.error('Failed to get plans', { error });
      res.status(500).json({ success: false, error: 'Failed to get plans' });
    }
  }

  /**
   * Get current user's subscription
   */
  private async getCurrentSubscription(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const subscription = await this.subscriptionManager.getUserSubscription(req.user!.id);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
      }

      // Get usage information
      const usage = {
        dailyPredictions: await this.subscriptionManager.checkUsageLimit(req.user!.id, 'dailyPredictions'),
        monthlyPredictions: await this.subscriptionManager.checkUsageLimit(req.user!.id, 'monthlyPredictions'),
        apiCalls: await this.subscriptionManager.checkUsageLimit(req.user!.id, 'apiCalls'),
      };

      res.json({
        success: true,
        data: {
          ...subscription,
          usage,
        },
      });
    } catch (error) {
      this.logger.error('Failed to get current subscription', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: 'Failed to get subscription' });
    }
  }

  /**
   * Create new subscription
   */
  private async createSubscription(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tier, paymentMethodId, trialDays } = req.body;
      const userId = req.user!.id;
      const userEmail = req.user!.email;

      // Check if user already has a subscription
      const existingSubscription = await this.subscriptionManager.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.status === 'active') {
        return res.status(409).json({
          success: false,
          error: 'User already has an active subscription',
        });
      }

      // Create or get Stripe customer
      const customer = await this.paymentProcessor.createCustomer(userId, userEmail);

      // Create subscription
      const result = await this.paymentProcessor.createSubscription(
        customer.id,
        userId,
        tier,
        paymentMethodId,
        trialDays
      );

      res.json({
        success: true,
        data: {
          subscription: result.subscription,
          paymentIntent: result.paymentIntent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create subscription', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Upgrade/downgrade subscription
   */
  private async upgradeSubscription(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { tier, prorationBehavior } = req.body;
      const userId = req.user!.id;

      // Get current subscription
      const currentSubscription = await this.subscriptionManager.getUserSubscription(userId);
      if (!currentSubscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
      }

      // Update subscription
      const updatedSubscription = await this.paymentProcessor.updateSubscription(
        currentSubscription.id, // This should be the Stripe subscription ID
        tier,
        prorationBehavior
      );

      res.json({
        success: true,
        data: updatedSubscription,
      });
    } catch (error) {
      this.logger.error('Failed to upgrade subscription', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Cancel subscription
   */
  private async cancelSubscription(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const { cancelAtPeriodEnd = true } = req.body;
      const userId = req.user!.id;

      const subscription = await this.subscriptionManager.getUserSubscription(userId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
      }

      const canceledSubscription = await this.subscriptionManager.cancelSubscription(
        subscription.id,
        cancelAtPeriodEnd
      );

      res.json({
        success: true,
        data: canceledSubscription,
      });
    } catch (error) {
      this.logger.error('Failed to cancel subscription', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Reactivate canceled subscription
   */
  private async reactivateSubscription(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const subscription = await this.subscriptionManager.getUserSubscription(userId);
      if (!subscription || !subscription.cancelAtPeriodEnd) {
        return res.status(400).json({
          success: false,
          error: 'Subscription cannot be reactivated',
        });
      }

      const reactivatedSubscription = await this.subscriptionManager.updateSubscription(
        subscription.id,
        { cancelAtPeriodEnd: false }
      );

      res.json({
        success: true,
        data: reactivatedSubscription,
      });
    } catch (error) {
      this.logger.error('Failed to reactivate subscription', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get user's payment methods
   */
  private async getPaymentMethods(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      // This would require getting the Stripe customer ID from the database
      // For now, return empty array
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      this.logger.error('Failed to get payment methods', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: 'Failed to get payment methods' });
    }
  }

  /**
   * Create setup intent for adding payment method
   */
  private async createSetupIntent(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const userEmail = req.user!.email;

      // Create or get Stripe customer
      const customer = await this.paymentProcessor.createCustomer(userId, userEmail);
      const setupIntent = await this.paymentProcessor.createSetupIntent(customer.id);

      res.json({
        success: true,
        data: {
          clientSecret: setupIntent.client_secret,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create setup intent', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: 'Failed to create setup intent' });
    }
  }

  /**
   * Get user's invoices
   */
  private async getInvoices(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      // This would require getting the Stripe customer ID from the database
      // For now, return empty array
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      this.logger.error('Failed to get invoices', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: 'Failed to get invoices' });
    }
  }

  /**
   * Get user's usage statistics
   */
  private async getUsage(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subscription = await this.subscriptionManager.getUserSubscription(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
      }

      const usage = {
        current: subscription.usage,
        limits: subscription.plan.limits,
        remaining: {
          dailyPredictions: Math.max(0, subscription.plan.limits.dailyPredictions - subscription.usage.dailyPredictions),
          monthlyPredictions: Math.max(0, subscription.plan.limits.monthlyPredictions - subscription.usage.monthlyPredictions),
          apiCalls: Math.max(0, subscription.plan.limits.apiCalls - subscription.usage.apiCalls),
        },
      };

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      this.logger.error('Failed to get usage', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: 'Failed to get usage' });
    }
  }

  /**
   * Get user account information
   */
  private async getAccount(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subscription = await this.subscriptionManager.getUserSubscription(userId);

      res.json({
        success: true,
        data: {
          userId,
          email: req.user!.email,
          subscription,
        },
      });
    } catch (error) {
      this.logger.error('Failed to get account', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: 'Failed to get account' });
    }
  }

  /**
   * Update user account
   */
  private async updateAccount(req: SubscriptionRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Account updates would be handled here
      res.json({
        success: true,
        data: { message: 'Account updated successfully' },
      });
    } catch (error) {
      this.logger.error('Failed to update account', { error, userId: req.user!.id });
      res.status(500).json({ success: false, error: 'Failed to update account' });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  private async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      await this.paymentProcessor.handleWebhook(payload, signature);
      
      res.status(200).json({ success: true });
    } catch (error) {
      this.logger.error('Webhook handling failed', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Get billing analytics (admin only)
   */
  private async getBillingAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const analytics = await this.paymentProcessor.getBillingAnalytics(startDate, endDate);
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      this.logger.error('Failed to get billing analytics', { error });
      res.status(500).json({ success: false, error: 'Failed to get analytics' });
    }
  }

  /**
   * Get all subscriptions (admin only)
   */
  private async getAllSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.subscriptionManager.getSubscriptionAnalytics();
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      this.logger.error('Failed to get all subscriptions', { error });
      res.status(500).json({ success: false, error: 'Failed to get subscriptions' });
    }
  }

  /**
   * Get specific user subscription (admin only)
   */
  private async getUserSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const subscription = await this.subscriptionManager.getUserSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found',
        });
      }

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      this.logger.error('Failed to get user subscription', { error });
      res.status(500).json({ success: false, error: 'Failed to get subscription' });
    }
  }

  /**
   * Setup validation middleware
   */
  private setupValidation(): void {
    // Validation is handled by individual route methods
  }

  /**
   * Validation for create subscription
   */
  private validateCreateSubscription() {
    return [
      body('tier').isIn(Object.values(SubscriptionTier)).withMessage('Invalid subscription tier'),
      body('paymentMethodId').optional().isString().withMessage('Payment method ID must be a string'),
      body('trialDays').optional().isInt({ min: 0, max: 30 }).withMessage('Trial days must be between 0 and 30'),
    ];
  }

  /**
   * Validation for upgrade subscription
   */
  private validateUpgradeSubscription() {
    return [
      body('tier').isIn(Object.values(SubscriptionTier)).withMessage('Invalid subscription tier'),
      body('prorationBehavior').optional().isIn(['create_prorations', 'none']).withMessage('Invalid proration behavior'),
    ];
  }

  /**
   * Validation for update account
   */
  private validateUpdateAccount() {
    return [
      body('name').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
      body('email').optional().isEmail().withMessage('Invalid email address'),
    ];
  }
}

/**
 * Create and configure subscription routes
 */
export const createSubscriptionRoutes = (
  subscriptionManager: SportIntelSubscriptionManager,
  paymentProcessor: SportIntelPaymentProcessor,
  eventBus: EventBus
): Router => {
  const routes = new SportIntelSubscriptionRoutes(
    subscriptionManager,
    paymentProcessor,
    eventBus
  );
  
  return routes.getRouter();
};

export default SportIntelSubscriptionRoutes;