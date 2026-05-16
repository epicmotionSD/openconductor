import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db/connection';
import { stripe } from '../services/stripe';

const router = Router();

const CREDIT_PACKS = {
  starter:  { name: 'Starter Pack',  credits: 100,  price: 999,   perCredit: 0.0999, savings: 0,  bestFor: 'Testing and small projects' },
  pro:      { name: 'Pro Pack',      credits: 500,  price: 3999,  perCredit: 0.0799, savings: 20, bestFor: 'Growing projects', popular: true },
  business: { name: 'Business Pack', credits: 2000, price: 11999, perCredit: 0.0599, savings: 40, bestFor: 'Production workloads' },
} as const;

const TIER_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, business: 3, enterprise: 4 };

interface ApiKeyRow {
  id: string;
  user_id: string | null;
  tier: string;
  credits_balance: number;
  credits_granted: number;
  revoked_at: string | null;
}

interface AuthedRequest extends Request {
  apiKey: ApiKeyRow;
}

async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  const token = auth.slice(7).trim();
  if (!token) return res.status(401).json({ error: 'Empty bearer token' });

  const keyHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = await db.query(
    `SELECT id, user_id, tier, credits_balance, credits_granted, revoked_at
       FROM api_keys WHERE key_hash = $1`,
    [keyHash]
  );
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  const key = result.rows[0] as ApiKeyRow;
  if (key.revoked_at) {
    return res.status(401).json({ error: 'API key revoked' });
  }
  (req as AuthedRequest).apiKey = key;
  db.query('UPDATE api_keys SET last_used_at = now() WHERE id = $1', [key.id]).catch(() => {});
  next();
}

router.get('/billing-status/:userId', requireApiKey, async (req: Request, res: Response) => {
  const key = (req as AuthedRequest).apiKey;
  res.json({
    credits: key.credits_balance,
    tier: key.tier,
    active: !key.revoked_at,
  });
});

router.post('/billing-check', requireApiKey, async (req: Request, res: Response) => {
  const key = (req as AuthedRequest).apiKey;
  const { requirement } = req.body ?? {};
  const baseUrl = process.env.FRONTEND_URL || 'https://openconductor.ai';

  if (requirement && typeof requirement.credits === 'number') {
    const needed = requirement.credits;
    if (key.credits_balance >= needed) {
      return res.json({ allowed: true, credits: key.credits_balance, tier: key.tier });
    }
    return res.json({
      allowed: false,
      credits: key.credits_balance,
      tier: key.tier,
      reason: `Insufficient credits: need ${needed}, have ${key.credits_balance}`,
      actionUrl: `${baseUrl}/dashboard/credits`,
    });
  }

  if (requirement && typeof requirement.tier === 'string') {
    const userRank = TIER_RANK[key.tier] ?? 0;
    const neededRank = TIER_RANK[requirement.tier] ?? 0;
    if (userRank >= neededRank) {
      return res.json({ allowed: true, credits: key.credits_balance, tier: key.tier });
    }
    return res.json({
      allowed: false,
      credits: key.credits_balance,
      tier: key.tier,
      reason: `Subscription '${requirement.tier}' required (current: '${key.tier}')`,
      actionUrl: `${baseUrl}/pricing`,
    });
  }

  return res.json({ allowed: true, credits: key.credits_balance, tier: key.tier });
});

router.post('/billing-deduct', requireApiKey, async (req: Request, res: Response) => {
  const key = (req as AuthedRequest).apiKey;
  const { credits, tool, callId } = req.body ?? {};
  const amount = Number(credits);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid credits amount' });
  }

  try {
    const result = await db.transaction(async (client) => {
      if (callId) {
        const existing = await client.query(
          'SELECT 1 FROM credit_transactions WHERE call_id = $1',
          [callId]
        );
        if (existing.rows.length > 0) {
          const cur = await client.query(
            'SELECT credits_balance FROM api_keys WHERE id = $1',
            [key.id]
          );
          return { idempotent: true, remaining: cur.rows[0]?.credits_balance ?? 0 };
        }
      }
      const upd = await client.query(
        `UPDATE api_keys
            SET credits_balance = credits_balance - $1
          WHERE id = $2 AND credits_balance >= $1
        RETURNING credits_balance`,
        [amount, key.id]
      );
      if (upd.rows.length === 0) {
        return { insufficient: true };
      }
      await client.query(
        `INSERT INTO credit_transactions (api_key_id, kind, amount, tool, call_id)
         VALUES ($1, 'debit', $2, $3, $4)`,
        [key.id, -amount, tool ?? null, callId ?? null]
      );
      return { idempotent: false, remaining: upd.rows[0].credits_balance };
    });

    if ('insufficient' in result) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    res.json({ success: true, remaining: result.remaining, idempotent: result.idempotent });
  } catch (err: any) {
    console.error('billing-deduct error:', err);
    res.status(500).json({ error: 'Deduction failed' });
  }
});

router.get('/credit-packs', async (_req: Request, res: Response) => {
  const packs: Record<string, any> = {};
  for (const [k, p] of Object.entries(CREDIT_PACKS)) {
    packs[k] = { ...p, price: p.price / 100 };
  }
  res.json({ packs });
});

router.post('/stripe-checkout-credits', requireApiKey, async (req: Request, res: Response) => {
  const key = (req as AuthedRequest).apiKey;
  const { pack, successUrl, cancelUrl } = req.body ?? {};
  const packConfig = CREDIT_PACKS[pack as keyof typeof CREDIT_PACKS];
  if (!packConfig) {
    return res.status(400).json({ error: `Invalid pack: ${pack}` });
  }
  const baseUrl = process.env.FRONTEND_URL || 'https://openconductor.ai';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: packConfig.name,
            description: `${packConfig.credits} OpenConductor credits`,
          },
          unit_amount: packConfig.price,
        },
        quantity: 1,
      }],
      metadata: {
        api_key_id: key.id,
        credit_pack: pack,
        credits: String(packConfig.credits),
      },
      success_url: successUrl || `${baseUrl}/dashboard?credits=success`,
      cancel_url: cancelUrl || `${baseUrl}/dashboard?credits=cancelled`,
    });
    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('stripe-checkout-credits error:', err);
    res.status(500).json({ error: 'Checkout creation failed' });
  }
});

router.get('/usage-analytics/:userId', requireApiKey, async (req: Request, res: Response) => {
  const key = (req as AuthedRequest).apiKey;
  const periodRaw = parseInt(String(req.query.period ?? '30'), 10);
  const period = Number.isFinite(periodRaw) && periodRaw > 0 && periodRaw <= 365 ? periodRaw : 30;

  const txResult = await db.query(
    `SELECT id, kind, amount, tool, created_at
       FROM credit_transactions
      WHERE api_key_id = $1
        AND created_at > now() - ($2 || ' days')::interval
      ORDER BY created_at DESC`,
    [key.id, String(period)]
  );
  const transactions = txResult.rows;

  let totalUsed = 0;
  let totalPurchased = 0;
  const byTool = new Map<string, { calls: number; credits: number }>();
  for (const t of transactions) {
    if (t.kind === 'debit') {
      totalUsed += -t.amount;
      if (t.tool) {
        const e = byTool.get(t.tool) ?? { calls: 0, credits: 0 };
        e.calls += 1;
        e.credits += -t.amount;
        byTool.set(t.tool, e);
      }
    } else if (t.kind === 'purchase' || t.kind === 'grant') {
      totalPurchased += t.amount;
    }
  }

  const topTools = Array.from(byTool, ([tool, v]) => ({ tool, ...v }))
    .sort((a, b) => b.credits - a.credits)
    .slice(0, 10);

  const timeline: Array<{ date: string; used: number; purchased: number }> = [];
  const now = new Date();
  for (let i = period - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayKey = day.toISOString().split('T')[0];
    let used = 0, purchased = 0;
    for (const t of transactions) {
      const ts = (t.created_at as Date).toISOString();
      if (!ts.startsWith(dayKey)) continue;
      if (t.kind === 'debit') used += -t.amount;
      else if (t.kind === 'purchase' || t.kind === 'grant') purchased += t.amount;
    }
    timeline.push({ date: dayKey, used, purchased });
  }

  const burnRate = totalUsed > 0 ? totalUsed / period : 0;
  const daysRemaining = burnRate > 0 ? Math.floor(key.credits_balance / burnRate) : null;

  res.json({
    period: `${period}d`,
    summary: {
      totalUsed,
      totalPurchased,
      netChange: totalPurchased - totalUsed,
      burnRate,
      daysRemaining,
      toolCount: byTool.size,
      transactionCount: transactions.length,
    },
    topTools,
    usageTimeline: timeline,
    recentTransactions: transactions.slice(0, 10).map((t: any) => ({
      id: t.id,
      type: t.kind,
      amount: t.amount,
      tool: t.tool,
      timestamp: (t.created_at as Date).toISOString(),
    })),
  });
});

export default router;
