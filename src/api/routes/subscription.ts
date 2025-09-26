/**
 * Subscription & Billing API Routes
 * 
 * Handles Trinity Agent subscription management, billing, and Stripe integration
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth';
import { SubscriptionBillingService } from '../../services/subscription-billing';
import { Logger } from '../../utils/logger';

const router = Router();
const logger = new Logger('SubscriptionAPI');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

/**
 * GET /api/subscription/plans
 * Get available Trinity Agent subscription plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = SubscriptionBillingService.getAvailablePlans();
    
    res.json({
      success: true,
      plans: plans.map(plan => ({
        ...plan,
        stripePriceIds: undefined // Don't expose Stripe IDs to frontend
      }))
    });
  } catch (error) {
    logger.error('Failed to get subscription plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription plans'
    });
  }
});

/**
 * GET /api/subscription/status
 * Get current subscription status for the organization
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.user;
    const status = await SubscriptionBillingService.getSubscriptionStatus(organizationId);
    
    res.json({
      success: true,
      subscription: status
    });
  } catch (error) {
    logger.error('Failed to get subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription status'
    });
  }
});

/**
 * POST /api/subscription/create-payment-intent
 * Create Stripe payment intent for subscription
 */
router.post('/create-payment-intent',
  requireAuth,
  [
    body('planId').isIn(['professional', 'team', 'enterprise']),
    body('billingCycle').isIn(['monthly', 'yearly'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { planId, billingCycle } = req.body;
    const { organizationId } = req.user;

    try {
      const plan = SubscriptionBillingService.getPlan(planId);
      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan selected'
        });
      }

      const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          organizationId,
          planId,
          billingCycle
        }
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        plan: {
          id: planId,
          name: plan.name,
          billingCycle
        }
      });
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment intent'
      });
    }
  }
);

/**
 * POST /api/subscription/subscribe
 * Create new subscription after successful payment
 */
router.post('/subscribe',
  requireAuth,
  [
    body('planId').isIn(['professional', 'team', 'enterprise']),
    body('billingCycle').isIn(['monthly', 'yearly']),
    body('paymentMethodId').isString().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { planId, billingCycle, paymentMethodId } = req.body;
    const { organizationId } = req.user;

    try {
      const result = await SubscriptionBillingService.createSubscription(
        organizationId,
        planId,
        billingCycle,
        paymentMethodId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        subscription: {
          id: result.subscriptionId,
          planId,
          billingCycle,
          status: 'active'
        }
      });
    } catch (error) {
      logger.error('Subscription creation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create subscription'
      });
    }
  }
);

/**
 * POST /api/subscription/update
 * Update existing subscription plan
 */
router.post('/update',
  requireAuth,
  [
    body('planId').isIn(['professional', 'team', 'enterprise']),
    body('billingCycle').isIn(['monthly', 'yearly'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { planId, billingCycle } = req.body;
    const { organizationId } = req.user;

    try {
      const result = await SubscriptionBillingService.updateSubscription(
        organizationId,
        planId,
        billingCycle
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Subscription updated successfully'
      });
    } catch (error) {
      logger.error('Subscription update failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription'
      });
    }
  }
);

/**
 * POST /api/subscription/cancel
 * Cancel subscription (at period end)
 */
router.post('/cancel',
  requireAuth,
  [body('cancelAtPeriodEnd').optional().isBoolean()],
  async (req, res) => {
    const { cancelAtPeriodEnd = true } = req.body;
    const { organizationId } = req.user;

    try {
      const result = await SubscriptionBillingService.cancelSubscription(
        organizationId,
        cancelAtPeriodEnd
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: cancelAtPeriodEnd 
          ? 'Subscription will be canceled at the end of the current period'
          : 'Subscription canceled immediately'
      });
    } catch (error) {
      logger.error('Subscription cancellation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  }
);

/**
 * GET /api/subscription/usage-report
 * Get usage report for billing period
 */
router.get('/usage-report',
  requireAuth,
  [query('month').optional().isISO8601()],
  async (req, res) => {
    const { organizationId } = req.user;
    const month = req.query.month ? new Date(req.query.month as string) : new Date();

    try {
      const report = await SubscriptionBillingService.generateUsageReport(organizationId, month);
      
      res.json({
        success: true,
        report
      });
    } catch (error) {
      logger.error('Failed to generate usage report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate usage report'
      });
    }
  }
);

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle the event
    await SubscriptionBillingService.handleStripeWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook signature verification failed'
    });
  }
});

/**
 * GET /api/subscription/customer-portal
 * Create Stripe customer portal session
 */
router.get('/customer-portal', requireAuth, async (req, res) => {
  const { organizationId } = req.user;

  try {
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId }
    });

    if (!organization?.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: 'No billing account found'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard/billing`
    });

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    logger.error('Failed to create customer portal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer portal session'
    });
  }
});

/**
 * GET /api/subscription/invoices
 * Get billing history/invoices
 */
router.get('/invoices',
  requireAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('starting_after').optional().isString()
  ],
  async (req, res) => {
    const { organizationId } = req.user;
    const limit = parseInt(req.query.limit as string) || 20;
    const startingAfter = req.query.starting_after as string;

    try {
      const organization = await prisma.organizations.findUnique({
        where: { id: organizationId }
      });

      if (!organization?.stripe_customer_id) {
        return res.json({
          success: true,
          invoices: [],
          hasMore: false
        });
      }

      const invoices = await stripe.invoices.list({
        customer: organization.stripe_customer_id,
        limit,
        starting_after: startingAfter
      });

      res.json({
        success: true,
        invoices: invoices.data.map(invoice => ({
          id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          created: new Date(invoice.created * 1000),
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
          invoiceUrl: invoice.hosted_invoice_url,
          pdfUrl: invoice.invoice_pdf
        })),
        hasMore: invoices.has_more
      });
    } catch (error) {
      logger.error('Failed to get invoices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve invoices'
      });
    }
  }
);

export default router;