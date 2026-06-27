# OpenConductor Deployment Configuration

## Vercel Projects

| Project | URL | Code | Domains |
|---------|-----|------|---------|
| `openconductor-next` (frontend) | https://vercel.com/epicmotionsds-projects/openconductor-next | `packages/frontend/` | `openconductor.ai`, `www.openconductor.ai` |
| `openconductor-api` (backend) | https://vercel.com/epicmotionsds-projects/openconductor-api | `packages/api/` | `api.openconductor.ai` |

DNS is on Vercel-managed nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`), so subdomains attach via `vercel domains add <name>` with no registrar work.

## Backend (Supabase)

- **Project:** `ogaixeyzowluhajbauvq`
- **API Base:** `https://ogaixeyzowluhajbauvq.supabase.co`
- **Connection (pooler, transaction mode for serverless):** `aws-1-us-east-1.pooler.supabase.com:6543`
- **Connection (direct, for local dev):** `db.ogaixeyzowluhajbauvq.supabase.co:5432`

There is also a stale defunct project (`axuqrkhscyqmaglcdprd`) referenced in older docs and a previously-orphaned `api.openconductor.ai` CNAME — both cleaned up 2026-05-16. Do not point new traffic at the defunct project.

### Backend Routes (served by `openconductor-api`)

| Path family | Source | Purpose |
|-------------|--------|---------|
| `/v1/billing/*` | [packages/api/src/routes/billing.ts](packages/api/src/routes/billing.ts) | Marketplace subscription checkout (PRO_SERVER $29/mo, FEATURED_SERVER $99/mo), portal, webhook |
| `/functions/v1/*` | [packages/api/src/routes/sdk.ts](packages/api/src/routes/sdk.ts) | SDK-shaped endpoints: `billing-status/:userId`, `billing-check`, `billing-deduct`, `credit-packs`, `stripe-checkout-credits`, `usage-analytics/:userId` |
| `/v1/servers/*`, `/v1/agents/*`, etc. | [packages/api/src/server.ts](packages/api/src/server.ts) | Registry, agents, intelligence, templates, command-center |

Vercel rewrites for these paths live in [packages/api/vercel.json](packages/api/vercel.json); the function entry at [packages/api/api/[...path].js](packages/api/api/[...path].js) strips the `/api/` prefix only when present so both prefixed and direct paths route to the same Express app.

## Monetization Deployment Path

The SDK consumer flow is fully working:

1. Developer installs `@openconductor/mcp-sdk` and wraps a tool handler with `requirePayment({ credits: 5 })`.
2. In demo mode (no API key), the SDK mocks 9999 credits and logs every check — safe for examples and tests.
3. In production mode (with an API key), the SDK calls `https://api.openconductor.ai/functions/v1/billing-check` → atomic credit deduction in Postgres → `https://api.openconductor.ai/functions/v1/stripe-checkout-credits` for top-ups.
4. Stripe webhook (`checkout.session.completed` with `metadata.api_key_id`) credits the key atomically and logs a `'purchase'` transaction.

API keys are currently issued **manually** in the `api_keys` table — there's no self-serve flow yet (dashboard or `openconductor keys create` CLI command).

### Known stubs / aspirational paths (do not deploy or document as working)

- `openconductor deploy --monetize` ([packages/cli/src/commands/deploy.js](packages/cli/src/commands/deploy.js)) — pure `setTimeout` + `console.log` simulation. Prints "OpenConductor is live" without performing any deployment.
- `proxy.openconductor.ai` — host responds, all paths return 404. No proxy application deployed and no source in this repo.

## Required Vercel Environment Variables (production)

For `openconductor-api`:

| Variable | Source | Notes |
|----------|--------|-------|
| `STRIPE_SECRET_KEY` | Stripe dashboard | Test keys (`sk_test_*`) are fine; live keys when ready to take real money |
| `STRIPE_PUBLISHABLE_KEY` | Stripe dashboard | |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook config | Per-endpoint signing secret |
| `POSTGRES_URL` | Supabase → Connection Pooling → Transaction mode | Port 6543, includes `?sslmode=require&supa=base-pooler.x` |
| `SUPABASE_URL` | Supabase project URL | |
| `SUPABASE_ANON_KEY` | Supabase API settings | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API settings | Server-side only; never expose |
| `FRONTEND_URL` | `https://openconductor.ai` | Used for Stripe success/cancel URLs |

⚠️ When uploading env vars from a local `.env` file, do NOT include the surrounding quotes — Stripe rejects keys with trailing whitespace/newlines/quotes. A prior version of this deployment had `STRIPE_SECRET_KEY=...cyhtuDp\r\n"` baked into the value, which caused every `/api/v1/billing/products` call to 500 with `"Failed to fetch products"` for months.

## Security Notes

- 15 public tables in Supabase have RLS disabled, including `api_keys` and `credit_transactions`. Anyone with the `SUPABASE_ANON_KEY` can read or modify them via the Supabase client. Enable RLS + add policies before ANY public dashboard ships.
- API keys are stored as SHA-256 hashes in `api_keys.key_hash`. Raw keys are only returned at creation time — there's currently no UI for that, so they're created via SQL.

## Migration History

- **2026-01-22:** Migrated from `openconductor` (bricked) to `openconductor-next` for the frontend. Reason: "Provisioning integration failed" — no logs, unrecoverable. Apex domain transferred successfully.
- **2026-05-16:** Cleaned up stale DNS for `api.openconductor.ai` (CNAME → defunct `axuqrkhscyqmaglcdprd.supabase.co` plus orphaned ACME challenge). Added `_vercel TXT` verification record and attached `api.openconductor.ai` to the `openconductor-api` Vercel project.
- **2026-05-16:** Synced all Vercel production env vars from local `.env` to overwrite values that had `\r\n"` trailing garbage from a prior bad import. Stripe + Postgres + Supabase calls all started working on the next deploy.
- **2026-05-16:** Added `/functions/v1/*` route family to back the SDK's production-mode billing calls. Added `credit_transactions` table and `credits_balance` / `credits_granted` columns on `api_keys` via migration `002_add_sdk_credits.sql`.
