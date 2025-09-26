/**
 * OpenConductor MCP Billing API Routes
 * 
 * REST endpoints for subscription management, usage tracking, and billing
 * Integrates with Stripe for payment processing
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
import { EventBus } from '../../types/events';
import { 
  asyncHandler, 
  NotFoundError,
  ValidationError,
  UnauthorizedError
} from '../middleware/error-handler';
import { APIResponse } from '../../types/api';
import { 
  MCPBillingSystem,
  SUBSCRIPTION_PLANS,
  createMCPBillingSystem 
} from '../../mcp/billing-system';

/**
 * Create MCP billing routes
 */
export function createMCPBillingRoutes(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): Router {
  const router = Router();
  
  // Initialize billing system (requires Stripe key)
  let billingSystem: MCPBillingSystem | null = null;
  if (process.env.STRIPE_SECRET_KEY) {
    billingSystem = createMCPBillingSystem(
      process.env.STRIPE_SECRET_KEY,
      pool,
      logger,
      errorManager,
      eventBus
    );
  }

  /**
   * GET /mcp/billing/plans - Get available subscription plans
   */
  router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
    logger.debug('Getting subscription plans');

    try {
      const response: APIResponse<typeof SUBSCRIPTION_PLANS> = {
        success: true,
        data: SUBSCRIPTION_PLANS,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get subscription plans:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/billing/subscription - Get user's current subscription
   */
  router.get('/subscription', asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    logger.debug('Getting user subscription', { userId });

    try {
      if (!billingSystem) {
        throw new Error('Billing system not configured');
      }

      const subscription = await billingSystem.getUserSubscription(userId);
      
      if (!subscription) {
        // Return default free plan
        const freePlan = SUBSCRIPTION_PLANS.find(p => p.tier === 'free')!;
        return res.json({
          success: true,
          data: {
            plan: freePlan,
            usage: {
              workflow_executions_used: 0,
              api_calls_used: 0,
              server_installs_used: 0
            },
            limits: freePlan.limits,
            status: 'active'
          },
          metadata: {
            timestamp: new Date(),
            version: 'v1',
            requestId: (req as any).requestId
          }
        });
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === subscription.plan);
      const usageCost = await billingSystem.calculateUsageCost(userId);

      const response: APIResponse<any> = {
        success: true,
        data: {
          subscription,
          plan,
          usage_cost: usageCost,
          billing_info: {
            next_billing_date: subscription.current_period_end,
            amount: plan?.price_monthly || 0
          }
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get user subscription:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/billing/subscription - Create or update subscription
   */
  router.post('/subscription', asyncHandler(async (req: Request, res: Response) => {
    const { plan_id, billing_cycle = 'monthly', payment_method_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!billingSystem) {
      throw new Error('Billing system not configured');
    }

    logger.debug('Creating/updating subscription', { 
      userId, 
      planId: plan_id, 
      billingCycle: billing_cycle 
    });

    try {
      const subscription = await billingSystem.createSubscription(
        userId,
        plan_id,
        payment_method_id,
        billing_cycle
      );

      const response: APIResponse<any> = {
        success: true,
        data: subscription,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Subscription created/updated successfully', {
        userId,
        subscriptionId: subscription.id,
        plan: subscription.plan
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to create/update subscription:', error);
      throw error;
    }
  }));

  /**
   * PUT /mcp/billing/subscription - Change subscription plan
   */
  router.put('/subscription', asyncHandler(async (req: Request, res: Response) => {
    const { plan_id, billing_cycle = 'monthly' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!billingSystem) {
      throw new Error('Billing system not configured');
    }

    logger.debug('Changing subscription plan', { 
      userId, 
      newPlanId: plan_id, 
      billingCycle: billing_cycle 
    });

    try {
      const subscription = await billingSystem.changeSubscription(
        userId,
        plan_id,
        billing_cycle
      );

      const response: APIResponse<any> = {
        success: true,
        data: subscription,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Subscription plan changed successfully', {
        userId,
        subscriptionId: subscription.id,
        newPlan: subscription.plan
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to change subscription plan:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/billing/usage - Get usage statistics
   */
  router.get('/usage', asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!billingSystem) {
      throw new Error('Billing system not configured');
    }

    logger.debug('Getting usage statistics', { userId, period });

    try {
      const usageCost = await billingSystem.calculateUsageCost(userId, period as string);
      const subscription = await billingSystem.getUserSubscription(userId);
      
      // Get usage limits status
      const limitsStatus = await Promise.all([
        billingSystem.checkUsageLimits(userId, 'workflow_execution'),
        billingSystem.checkUsageLimits(userId, 'api_call'), 
        billingSystem.checkUsageLimits(userId, 'server_install')
      ]);

      const response: APIResponse<any> = {
        success: true,
        data: {
          usage_cost: usageCost,
          subscription,
          limits_status: {
            workflow_executions: limitsStatus[0],
            api_calls: limitsStatus[1],
            server_installs: limitsStatus[2]
          },
          billing_period: period || getCurrentBillingPeriod()
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get usage statistics:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/billing/webhooks - Stripe webhook handler
   */
  router.post('/webhooks', asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!billingSystem || !webhookSecret) {
      throw new Error('Billing system or webhook secret not configured');
    }

    logger.debug('Handling Stripe webhook');

    try {
      // Verify webhook signature
      const event = billingSystem.stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      // Handle the event
      await billingSystem.handleStripeWebhook(event);

      logger.info('Stripe webhook handled successfully', { 
        type: event.type,
        id: event.id 
      });

      res.json({ received: true });
    } catch (error) {
      logger.error('Failed to handle Stripe webhook:', error);
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  }));

  /**
   * GET /mcp/billing/analytics - Get billing analytics (admin only)
   */
  router.get('/analytics', asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add admin role check
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      throw new UnauthorizedError('Admin access required');
    }

    if (!billingSystem) {
      throw new Error('Billing system not configured');
    }

    logger.debug('Getting billing analytics');

    try {
      const analytics = await billingSystem.getSubscriptionAnalytics();

      const response: APIResponse<any> = {
        success: true,
        data: analytics,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get billing analytics:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/billing/usage/track - Track usage event
   */
  router.post('/usage/track', asyncHandler(async (req: Request, res: Response) => {
    const { event_type, resource_type, resource_id, quantity = 1 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!billingSystem) {
      throw new Error('Billing system not configured');
    }

    logger.debug('Tracking usage event', { 
      userId, 
      eventType: event_type, 
      resourceType: resource_type,
      quantity 
    });

    try {
      const usageEvent = {
        user_id: userId,
        event_type,
        resource_type,
        resource_id,
        quantity,
        cost_usd: calculateEventCost(event_type, quantity),
        billing_period: getCurrentBillingPeriod(),
        metadata: req.body.metadata || {}
      };

      await billingSystem.trackUsage(usageEvent);

      // Check if user is within limits
      const limitsCheck = await billingSystem.checkUsageLimits(userId, event_type);

      const response: APIResponse<any> = {
        success: true,
        data: {
          event_tracked: true,
          usage_status: limitsCheck,
          cost: usageEvent.cost_usd
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to track usage event:', error);
      throw error;
    }
  }));

  return router;
}

/**
 * Calculate cost for usage event
 */
function calculateEventCost(eventType: string, quantity: number): number {
  const rates = {
    workflow_execution: 0.01, // $0.01 per execution
    api_call: 0.0001, // $0.0001 per API call
    server_install: 0.00, // Free installs
    tool_usage: 0.001 // $0.001 per tool usage
  };

  return (rates[eventType as keyof typeof rates] || 0) * quantity;
}

/**
 * Get current billing period (YYYY-MM format)
 */
function getCurrentBillingPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}