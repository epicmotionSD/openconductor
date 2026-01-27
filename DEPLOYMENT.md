# OpenConductor Deployment Configuration

## Vercel Project
- **Project Name:** `openconductor-next`
- **Project URL:** https://vercel.com/epicmotionsds-projects/openconductor-next
- **Production Domain:** https://openconductor.ai

## Domains
- `openconductor.ai` (primary)
- `www.openconductor.ai` (redirect)

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

## Migration History
- **2026-01-22:** Migrated from `openconductor` (bricked) to `openconductor-next`
  - Reason: "Provisioning integration failed" - no logs, unrecoverable
  - Domain transferred successfully
