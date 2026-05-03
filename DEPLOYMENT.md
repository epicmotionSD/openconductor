# OpenConductor Deployment Configuration

## Vercel Project
- **Project Name:** `openconductor-next`
- **Project URL:** https://vercel.com/epicmotionsds-projects/openconductor-next
- **Production Domain:** https://openconductor.ai

## Domains
- `openconductor.ai` (primary)
- `www.openconductor.ai` (redirect)
- `proxy.openconductor.ai` (managed monetization proxy)

## Backend (Supabase)
- **Project:** `axuqrkhscyqmaglcdprd`
- **API Base:** `https://axuqrkhscyqmaglcdprd.supabase.co`
- **Edge Functions:** `https://axuqrkhscyqmaglcdprd.supabase.co/functions/v1/`

### Edge Functions
| Function | Purpose |
|----------|---------|
| `stripe-webhook` | Handles Stripe billing webhooks |
| `telemetry-ingest` | Ingests SDK telemetry events |
| `provision-key` | Provisions new API keys |
| `usage-aggregator` | Aggregates usage stats (cron) |

## Monetization Deployment Path

- Primary flow: `openconductor deploy --monetize`
- Effect: enables `requirePayment()` middleware path and routes traffic through `https://proxy.openconductor.ai`
- Use `--dry-run` to validate deployment plan without applying changes

## Migration History
- **2026-01-22:** Migrated from `openconductor` (bricked) to `openconductor-next`
  - Reason: "Provisioning integration failed" - no logs, unrecoverable
  - Domain transferred successfully
