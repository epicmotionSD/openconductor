# OpenConductor Roadmap

## Empire Feature Update

- **Feature ID**: `OC-2026-PIVOT`
- **Project**: OpenConductor
- **Priority**: **P0** (Critical)
- **Title**: Pivot to MCP Monetization Infrastructure
- **Description**: Deprecate discovery-first UX and center product delivery around `requirePayment()` middleware plus zero-config proxy monetization for Vibe Coders.
- **Tags**: `#monetization` `#infrastructure-first` `#StripeForAI`

### Refactor Playbook: Stripe for AI

| Phase | Task | Objective |
| :--- | :--- | :--- |
| **1. UI/UX Gut** | Swap "Search" for "API Keys & Billing". | Signal shift from consumer directory to developer monetization tooling. |
| **2. Proxy Layer** | Deploy `proxy.openconductor.ai`. | Provide rate-limiting + billing enforcement with no dev-side config. |
| **3. CLI Update** | `openconductor deploy --monetize`. | One-command deployment to managed infra with payments enabled. |

### Notion Execution: Monetization Sprint

- **Play 11**: Launch "The MCP Tax" landing page (focus on $0 to $1 monetization).
- **Play 12**: Outreach to top 20 trending GitHub MCP repo owners for private beta.
- **Play 13**: Integrate OpenConductor billing into GodotForge CI/CD logs as a demo.

## Vision

OpenConductor is the **monetization infrastructure layer for the agentic internet** — an MCP-native platform evolving from registry roots into **Trust Stack + Billing Proxy** for autonomous AI agents.

As AI agent in 2026, enterprises need infrastructure to verify, govern, and insure agent operations. OpenConductor provides the plumbing. [x3o.ai](https://x3o.ai) is the first production deployment — autonomous AI agents running on Trust Stack.

**OpenConductor = engine. x3o.ai = proof. Trust Stack = moat.**

---

## Current Status (May 2026)

### MCP Monetization Infrastructure — Operational ✅ (proxy/CLI pending)

Verified by end-to-end probe on 2026-05-16. The SDK's default `apiUrl` now reaches a live backend; `requirePayment()` deducts credits from Postgres and fails closed with the right JSON-RPC errors when balance or tier is insufficient.

- **SDK `@openconductor/mcp-sdk@1.4.0`** ✅ — Published to npm. Demo mode and production mode both verified end-to-end. Source lives in separate repo `epicmotionSD/mcp-sdk`. JSON-RPC errors: `PaymentRequiredError` -32011, `InsufficientCreditsError` -32012, `SubscriptionRequiredError` -32013.
- **Backend** ✅ — Live at `https://api.openconductor.ai`. Two route families:
  - `/v1/billing/*` ([packages/api/src/routes/billing.ts](packages/api/src/routes/billing.ts)) — marketplace subscription checkout (PRO_SERVER $29/mo, FEATURED_SERVER $99/mo) + Stripe webhook.
  - `/functions/v1/*` ([packages/api/src/routes/sdk.ts](packages/api/src/routes/sdk.ts)) — SDK-shaped endpoints: `billing-status/:userId`, `billing-check`, `billing-deduct` (atomic + idempotent via `call_id`), `credit-packs`, `stripe-checkout-credits`, `usage-analytics/:userId`.
- **Credits storage** ✅ — `api_keys.credits_balance` + `credit_transactions` table ([packages/api/src/db/migrations/002_add_sdk_credits.sql](packages/api/src/db/migrations/002_add_sdk_credits.sql)). Bearer-token auth: SHA-256 hash → `api_keys.key_hash` lookup. New keys default to 100 free credits.
- **Credit pack purchases** ✅ — Stripe webhook (`checkout.session.completed` with `metadata.api_key_id`) atomically grants credits and logs a `'purchase'` transaction. Three packs: starter (100/$9.99), pro (500/$39.99), business (2000/$119.99).
- **Clients supported**: Claude Desktop, Cursor, Cline, Windsurf (demo or production via real API key).
- **`proxy.openconductor.ai`** ❌ — Host responds, all paths return 404. No proxy application deployed. No source code in this repo.
- **CLI `openconductor deploy --monetize`** ⚠️ — Stub only ([packages/cli/src/commands/deploy.js](packages/cli/src/commands/deploy.js) — `setTimeout` + `console.log`). Prints "OpenConductor is live" without performing any deployment.

**Remaining gaps:** (1) Deploy something real behind `proxy.openconductor.ai` or remove the references. (2) Replace CLI `deploy --monetize` stub with a real deployer or remove the flag. (3) Ship an API-key self-serve flow (dashboard or CLI) — currently keys are issued manually in Postgres. (4) Enable RLS + policies on the 15 public Supabase tables flagged by the advisor (`api_keys`, `credit_transactions`, etc. currently world-readable with the anon key).

### Trust Stack Layer 1: Registry — Live on Testnet ✅

**ERC-8004 Agent Identity Registry**
- Contract: `0xf8d7044d657b602194fb5745c614beb35d5d898a` (Base Sepolia)
- Explorer: [BaseScan](https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a)
- First agent registered: Token ID #1

**Subgraph Indexer** ✅
- Deployed: [The Graph Studio](https://thegraph.com/studio/subgraph/openconductor/)
- Indexes: Agent registrations, attestations, trust scores, tier upgrades
- GraphQL API for querying on-chain agent data

**Agent Registration UI** ✅
- Live at: [openconductor.ai/register](https://openconductor.ai/register)
- Wallet integration (MetaMask, Coinbase, WalletConnect)
- On-chain metadata storage

### Empire MCP Server — Operational ✅
- **Trinity AI Architecture**: Oracle (analysis), Sentinel (security), Sage (knowledge)
- **Full DevOps Integration**: Vercel deployments, Supabase backend, GitHub operations
- **Billing & Monetization**: Stripe integration, credits checkout, `requirePayment` middleware

### x3o.ai Production Deployment — Live ✅

**Trinity AI Agents (Token ID #1)**
- **Platform**: White-label salon booking with AI revenue recovery
- **Use Case**: Autonomous agents handling customer conversations and bookings
- **Scale**: Multi-tenant SaaS, $297/mo per salon, $1,500 one-time sprint offers
- **Results**: $1,800-$3,100/month revenue recovery per salon
- **Trust Stack Integration**: First registered agent demonstrating compliance infrastructure

**Why This Matters:**
- Proof that autonomous agents need identity and governance
- Real revenue from AI agents operating 24/7
- Reference implementation for enterprises evaluating Trust Stack
- Demonstrates EU AI Act compliance in production

### Ecosystem — In Development 🔜
- **SportIntel**: Bloomberg Terminal-style sports analytics — MVP complete, ready for beta
- **KeLatic**: Production booking dashboard for KeLatic Hair Lounge

---

## 2026 Roadmap

### Q1 2026 — Ship & Connect 🔥

**Goal**: Make everything that's built *usable and connected*. Ship what's ready, wire the infrastructure to the portal, prove the flywheel.

| Milestone | Status | Details |
|-----------|--------|---------|
| ERC-8004 Spec | ✅ Complete | Agent identity standard for on-chain registration |
| Testnet Deploy | ✅ Complete | Base Sepolia deployment with first agent |
| Subgraph Indexer | ✅ Complete | The Graph Studio — on-chain data queryable via GraphQL |
| Registration UI | ✅ Complete | Wallet-connected agent registration flow |
| CLI 1.0 | ✅ Complete | 220+ servers indexed, ecosystem intelligence platform |
| SDK v1.4.0 | ✅ Code Complete | Zero-config demo mode — `npx @openconductor/mcp-sdk demo` |
| Empire MCP Server | ✅ Complete | Trinity AI agents operational in Claude Desktop |
| Stripe Billing | ✅ Complete | Subscription checkout + credit-pack checkout + webhook credit grants |
| Monetization Pivot (OC-2026-PIVOT) | 🚧 In Progress | Backend + SDK done; proxy + CLI deployer still pending |
| SDK npm Publish | ✅ Complete | v1.4.0 published to npm with zero-config demo mode |
| `api.openconductor.ai` Live | ✅ Complete | Production endpoint serving `/v1/billing/*` and `/functions/v1/*` |
| SDK → Backend Wired | ✅ Complete | Production-mode `requirePayment()` deducts real credits from Postgres |
| `proxy.openconductor.ai` | ❌ Not Started | Host responds, all paths 404 — no application deployed |
| CLI `deploy --monetize` real impl | ❌ Not Started | Currently a stub printing fake success |
| API Key Self-Serve | ❌ Not Started | Keys must be issued manually in DB; needs dashboard or CLI flow |
| RLS Hardening | ❌ Not Started | 15 public tables incl. `api_keys` + `credit_transactions` have RLS disabled |
| x3o.ai Trinity AI Registration | 🔜 In Progress | Register Trinity AI agents as Token ID #1 (Week 1-2) |
| Enterprise Marketing Launch | 🔜 Planned | LinkedIn content, founding cohort outreach, case study (Week 2-3) |
| SportIntel Beta | 🔜 Planned | Word-of-mouth beta at Progressive Rail |
| KeLatic Live Dashboard | 🔜 Planned | Production booking dashboard for KeLatic Hair Lounge |

**Q1 Targets:**

| Metric | Current | Q1 Target |
|--------|---------|-----------|
| Registered agents (on-chain) | 1 | 25+ |
| Founding cohort signups | 0 | 10+ |
| Enterprise pilot customers | 0 | 2-3 |
| LinkedIn followers | 0 | 500+ |
| GitHub stars (all repos) | ~10 | 50+ |
| MRR | ~$0 | $1,700 |

---

### Q2 2026 — Govern & Grow

**Goal**: Go to mainnet. Ship Layer 2 governance. Scale from pilots to production contracts.

| Milestone | Status | Details |
|-----------|--------|---------|
| Base Mainnet Deploy | 🔜 Planned | Production ERC-8004 deployment |
| AP2 Policy Engine | 🔜 Planned | Permission management for agent operations |
| Team Workspaces | 🔜 Planned | Multi-user agent management |
| Attestation Framework | 🔜 Planned | Third-party verification system |
| Founding Cohort Complete | 🔜 Planned | 50 companies locked in with early pricing |

**Target**: $5K MRR (3-5 production contracts)

---

### Q3 2026 — Underwrite & Comply

**Goal**: Ship Layer 3 risk infrastructure. Position for EU AI Act compliance (August 2026 deadline).

| Milestone | Status | Details |
|-----------|--------|---------|
| Risk Scoring | 🔜 Planned | Algorithmic trust score computation |
| ISO 42001 Tooling | 🔜 Planned | AI management system compliance |
| Insurance API | 🔜 Planned | Agent operation insurance integration |
| Audit Trails | 🔜 Planned | Immutable operation logging |

**Target**: $25K MRR (10-15 production contracts)

---

### Q4 2026 — Scale & Raise

**Goal**: Complete Trust Stack. Scale proxy monetization. Prepare for Series A.

| Milestone | Status | Details |
|-----------|--------|---------|
| Multi-chain | 🔜 Planned | Ethereum, Arbitrum, Optimism support |
| Enterprise SSO | 🔜 Planned | SAML/OIDC integration |
| Global Proxy Footprint | 🔜 Planned | Multi-region `proxy.openconductor.ai` for low-latency billing enforcement |
| SDK 2.0 | 🔜 Planned | Full Trust Stack SDK |

**Target**: $50K MRR (25-30 contracts) → Series A positioning

---

## Revenue Model

| Stream | Source | Monetization | Priority |
|--------|--------|--------------|----------|
| **Trust Stack Enterprise** | Agent registration fees, attestations, governance | Per-agent + annual contracts | 🔥 PRIMARY |
| **x3o.ai Subscriptions** | Dashboard access, Trinity AI chat, multi-agent management | Tiered plans ($49-$499/mo) | HIGH |
| **OpenConductor Pro** | Proxy controls, premium analytics, billing insights | Subscription ($99-$299/mo) | HIGH |
| **SDK Monetization** | `requirePayment` middleware + proxy commissions | Usage-based revenue share | 🔥 PRIMARY |
| **Enterprise Workspaces** | Team features, SSO, compliance tooling | Annual contracts ($25K-$100K) | HIGH |

---

## Regulatory Context

### EU AI Act (Effective August 2026)
- High-risk AI systems require identity tracking
- Audit trails mandatory for enterprise AI
- Trust Stack provides compliant infrastructure before the deadline

### Why Now
- **6 months until EU AI Act enforcement** — August 2026 deadline is imminent
- AI agents are proliferating faster than governance
- Enterprises need verifiable agent identities to operate in EU market
- Insurance companies need risk assessment data before providing coverage
- **No one else is building the compliance layer at the protocol level**
- OpenConductor has first-mover advantage with ERC-8004 standard already live
- Founding cohort locks in early pricing before market realizes urgency

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Trust Stack                          │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Proof      │ Production deployments          │
│                      │ x3o.ai Trinity AI        ✅     │
│                      │ (Token ID #1)                   │
├──────────────────────┼──────────────────────────────────┤
│  Layer 3: Underwriter│ Risk scoring, ISO 42001         │
│                      │ Insurance integration    Q3 '26 │
├──────────────────────┼──────────────────────────────────┤
│  Layer 2: Governor   │ AP2 policy engine               │
│                      │ Permission management    Q2 '26 │
├──────────────────────┼──────────────────────────────────┤
│  Layer 1: Registry   │ ERC-8004 Agent Identity  ✅     │
│                      │ Subgraph Indexer         ✅     │
│                      │ Registration UI          ✅     │
└─────────────────────────────────────────────────────────┘
```

**Flywheel:**
1. Builder needs monetization fast → deploys with `openconductor deploy --monetize`
2. Proxy enforces payments and throttling → revenue starts immediately
3. Usage grows → billing analytics + governance features become critical
4. Team adopts Trust Stack identity/compliance layers for enterprise deals
5. New builders onboard via proof of revenue + compliance readiness

---

## Technology

- **Blockchain**: Base (Coinbase L2) — ERC-8004 standard
- **Indexer**: The Graph (Subgraph Studio)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Frontend**: Next.js on Vercel
- **AI**: Trinity Architecture (Oracle, Sentinel, Sage) via MCP
- **Billing**: Stripe (subscriptions, credits, usage-based)
- **SDK**: `@openconductor/mcp-sdk` — zero-config demo mode

---

## Links

- **Website**: [openconductor.ai](https://openconductor.ai)
- **Production Deployment**: [x3o.ai](https://x3o.ai) (Trinity AI - Token ID #1)
- **Proxy**: [proxy.openconductor.ai](https://proxy.openconductor.ai)
- **Register Agent**: [openconductor.ai/register](https://openconductor.ai/register)
- **Contract**: [BaseScan](https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a)
- **Subgraph**: [The Graph Studio](https://thegraph.com/studio/subgraph/openconductor/)
- **npm**: [@openconductor/mcp-sdk](https://www.npmjs.com/package/@openconductor/mcp-sdk)

---

*Last updated: May 2, 2026*
