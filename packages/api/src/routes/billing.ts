import { Router, Request, Response } from 'express';
import { 
  stripe, 
  initializeStripeProducts, 
  createCheckoutSession, 
  createPortalSession,
  getServerSubscription,
  constructWebhookEvent,
  PRODUCTS
} from '../services/stripe';
import { db } from '../db/connection';

const router = Router();

// Cache for Stripe products
let stripeProducts: Record<string, { productId: string; priceId: string }> | null = null;

/**
 * GET /api/v1/billing/products
 * Get available subscription products
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    if (!stripeProducts) {
      stripeProducts = await initializeStripeProducts();
    }

    const products = Object.entries(PRODUCTS).map(([key, config]) => ({
      key,
      name: config.name,
      description: config.description,
      price: config.price / 100, // Convert cents to dollars
      interval: config.interval,
      priceId: stripeProducts![key]?.priceId,
    }));

    res.json({ products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * POST /api/v1/billing/checkout
 * Create a checkout session for a server upgrade
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { tier, serverId, serverSlug, email } = req.body;

    if (!tier || !serverId || !serverSlug) {
      return res.status(400).json({ 
        error: 'Missing required fields: tier, serverId, serverSlug' 
      });
    }

    // Initialize products if needed
    if (!stripeProducts) {
      stripeProducts = await initializeStripeProducts();
    }

    const product = stripeProducts[tier];
    if (!product) {
      return res.status(400).json({ error: `Invalid tier: ${tier}` });
    }

    // Verify server exists
    const serverResult = await db.query(
      'SELECT id, name, slug FROM mcp_servers WHERE id = $1 OR slug = $2',
      [serverId, serverSlug]
    );

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const server = serverResult.rows[0];
    const baseUrl = process.env.FRONTEND_URL || 'https://openconductor.ai';

    const session = await createCheckoutSession({
      priceId: product.priceId,
      serverId: server.id,
      serverSlug: server.slug,
      customerEmail: email,
      successUrl: `${baseUrl}/servers/${server.slug}?checkout=success`,
      cancelUrl: `${baseUrl}/servers/${server.slug}?checkout=cancelled`,
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/v1/billing/portal
 * Create a billing portal session for managing subscriptions
 */
router.post('/portal', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://openconductor.ai';

    const session = await createPortalSession({
      customerId,
      returnUrl: `${baseUrl}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * GET /api/v1/billing/subscription/:serverId
 * Get subscription status for a server
 */
router.get('/subscription/:serverId', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    const subscription = await getServerSubscription(serverId);

    if (!subscription) {
      return res.json({ 
        hasSubscription: false,
        tier: 'free'
      });
    }

    // Determine tier from price
    const priceId = typeof subscription.items.data[0].price === 'string' 
      ? subscription.items.data[0].price 
      : subscription.items.data[0].price.id;

    let tier = 'unknown';
    if (stripeProducts) {
      for (const [key, product] of Object.entries(stripeProducts)) {
        if (product.priceId === priceId) {
          tier = key;
          break;
        }
      }
    }

    res.json({
      hasSubscription: true,
      tier,
      status: subscription.status,
      currentPeriodEnd: (subscription as any).current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * POST /api/v1/billing/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    // Note: req.body must be raw buffer for signature verification
    event = constructWebhookEvent(req.body, signature);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const serverId = session.metadata?.server_id;
        const serverSlug = session.metadata?.server_slug;
        
        console.log(`✅ Checkout completed for server: ${serverSlug} (${serverId})`);
        
        // Update server tier in database
        if (serverId) {
          // Determine tier from line items
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          
          let tier = 'PRO_SERVER';
          if (stripeProducts) {
            for (const [key, product] of Object.entries(stripeProducts)) {
              if (product.priceId === priceId) {
                tier = key;
                break;
              }
            }
          }

          await db.query(
            `UPDATE mcp_servers 
             SET tier = $1, 
                 stripe_customer_id = $2, 
                 stripe_subscription_id = $3,
                 updated_at = NOW()
             WHERE id = $4`,
            [tier, session.customer, session.subscription, serverId]
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const serverId = subscription.metadata?.server_id;
        
        console.log(`📝 Subscription updated for server: ${serverId}`);
        
        if (serverId) {
          await db.query(
            `UPDATE mcp_servers 
             SET subscription_status = $1, updated_at = NOW()
             WHERE id = $2`,
            [subscription.status, serverId]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const serverId = subscription.metadata?.server_id;
        
        console.log(`❌ Subscription cancelled for server: ${serverId}`);
        
        if (serverId) {
          await db.query(
            `UPDATE mcp_servers 
             SET tier = 'free', 
                 subscription_status = 'cancelled',
                 stripe_subscription_id = NULL,
                 updated_at = NOW()
             WHERE id = $1`,
            [serverId]
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`⚠️ Payment failed for customer: ${invoice.customer}`);
        // Could send notification email here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
