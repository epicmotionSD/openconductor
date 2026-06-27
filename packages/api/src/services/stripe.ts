import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Product IDs (will be created on first run)
export const PRODUCTS = {
  FEATURED_SERVER: {
    name: 'Featured Server',
    description: 'Top placement in search results, analytics dashboard, verified badge',
    price: 9900, // $99.00 in cents
    interval: 'month' as const,
  },
  PRO_SERVER: {
    name: 'Pro Server',
    description: 'Verified badge, priority in category listings',
    price: 2900, // $29.00 in cents
    interval: 'month' as const,
  },
};

export interface StripeProduct {
  productId: string;
  priceId: string;
}

// Cache for product/price IDs
let productCache: Record<string, StripeProduct> | null = null;

/**
 * Initialize Stripe products and prices (idempotent)
 */
export async function initializeStripeProducts(): Promise<Record<string, StripeProduct>> {
  if (productCache) return productCache;

  const results: Record<string, StripeProduct> = {};

  for (const [key, config] of Object.entries(PRODUCTS)) {
    // Check if product already exists by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['openconductor_key']:'${key}'`,
    });

    let product: Stripe.Product;
    let price: Stripe.Price;

    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      // Get the default price
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1,
      });
      price = prices.data[0];
    } else {
      // Create new product
      product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: {
          openconductor_key: key,
        },
      });

      // Create price
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: config.price,
        currency: 'usd',
        recurring: {
          interval: config.interval,
        },
        metadata: {
          openconductor_key: key,
        },
      });

      // Set as default price
      await stripe.products.update(product.id, {
        default_price: price.id,
      });
    }

    results[key] = {
      productId: product.id,
      priceId: price.id,
    };

    console.log(`✅ Stripe product ready: ${config.name} (${price.id})`);
  }

  productCache = results;
  return results;
}

/**
 * Create a checkout session for a server listing upgrade
 */
export async function createCheckoutSession(params: {
  priceId: string;
  serverId: string;
  serverSlug: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      server_id: params.serverId,
      server_slug: params.serverSlug,
    },
    subscription_data: {
      metadata: {
        server_id: params.serverId,
        server_slug: params.serverSlug,
      },
    },
  });

  return session;
}

/**
 * Create a billing portal session for managing subscriptions
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

/**
 * Get subscription status for a server
 */
export async function getServerSubscription(serverId: string): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.search({
    query: `metadata['server_id']:'${serverId}'`,
  });

  if (subscriptions.data.length === 0) return null;

  // Return the active subscription
  return subscriptions.data.find(s => s.status === 'active') || subscriptions.data[0];
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export default stripe;
