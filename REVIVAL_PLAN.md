# OpenConductor Revival Plan v2.0
## Fast-Track to Monetization

**Updated: January 18, 2026**
**Goal: First MRR in 4 weeks, not 12**

---

## Executive Summary

OpenConductor has **1,000+ weekly npm downloads** and **220+ servers** in the registry. This is distribution infrastructure with proven traction. The original 12-week plan over-indexes on features and under-indexes on revenue.

**The Play:** Monetize the distribution, not the features. Charge maintainers for visibility, verification, and analytics - just like npm charges for private packages and org features.

**Target Revenue:**
- Week 4: $800/month MRR (5 featured + 10 pro listings)
- Month 2: $2,000/month MRR
- Month 3: $5,000/month MRR

---

## Market Context (Why Now)

From market research (January 2026):
- MCP marketplace projected at **$10.3B** with 34.6% CAGR
- Market is **EARLY** - almost zero competition for registry/discovery
- Apify developers earning **$500-2,000/month** per MCP server
- Pay-per-event models proven viable
- Cloudflare, Anthropic, Stripe heavily investing in MCP infrastructure

**OpenConductor's Moat:**
- First-mover on "npm for MCP servers" positioning
- Organic traction (no paid marketing yet)
- Multi-client support (Claude, Cursor, Cline, Windsurf)
- Badge system drives viral distribution

---

## Current State

**What's Working (Code Complete):**
- CLI tool with 8+ commands (install, discover, list, remove, update, stack, badge, achievements)
- Multi-client support
- Stacks system (pre-configured bundles)
- Badge system for maintainer marketing
- Web platform with discovery UI

**Database State:** Supabase connected and migrated on new project (ogaixeyzowluhajbauvq). Servers seeded (182/186) and pgvector enabled.

**What Needs Building for Monetization:**
1. Schema migrations (TODAY)
2. Re-seed MCP servers from GitHub
3. Stripe integration
4. Featured/Pro listing tiers
5. Basic maintainer analytics

---

## Phase 1: Foundation (Week 1)

### Day 1-2: Database & API

```
[x] Connect to Supabase (axuqrkhscyqmaglcdprd) ← DONE
[x] Review schema files:
    - packages/api/src/db/schema.sql
    - packages/api/src/db/schema-agents.sql (SKIP for now)
[x] Run core schema migration (servers, categories, installs, analytics)
[x] Re-seed servers from GitHub discovery
[x] Test API locally:
    - GET /v1/servers
    - GET /v1/servers/:slug
    - GET /v1/search?q=
```

### Day 3-4: Deploy Stack

```
[x] Deploy API to Vercel (openconductor-api)
[ ] Update DNS: api.openconductor.ai → openconductor-api.vercel.app (skipped for now)
[x] Update CLI API_BASE_URL (defaults + README)
[x] Test end-to-end: `openconductor discover filesystem`
[x] Deploy frontend to Vercel (openconductor-next)
[x] Verify discovery page loads (openconductor-next.vercel.app)
    - Blocked: Railway trial expired for openconductor-api (no longer needed if Vercel API remains stable)
```

### Day 5-7: CLI Release

```
[x] Test all commands against live API
[x] Publish CLI v1.3.5 to npm
[x] Verify badge generation works
[ ] Announce "OpenConductor is back" on X/Twitter
```

**Week 1 Success Metrics:**
- [ ] API responding < 200ms
- [ ] 190+ servers in registry
- [x] CLI install command working
- [ ] Frontend live at openconductor.ai

---

## Phase 2: Monetization Infrastructure (Week 2)

### Stripe Integration

```
[ ] Create Stripe account (if not exists)
[ ] Add stripe package to API
[ ] Create products:
    - "Featured Server" - $99/month
    - "Pro Server" - $29/month
[ ] Build subscription endpoints:
    - POST /api/v1/billing/checkout
    - POST /api/v1/billing/webhook
    - GET /api/v1/billing/portal
[ ] Create checkout flow in frontend
```

### Tier Implementation

**Featured Server ($99/month):**
```
[ ] Add `featured` boolean to mcp_servers table
[ ] Add `featured_until` timestamp
[ ] Modify search to boost featured servers
[ ] Add "Featured" badge to server cards
[ ] Create featured server carousel on homepage
```

**Pro Server ($29/month):**
```
[ ] Add `verified` boolean to mcp_servers table
[ ] Add `tier` enum (free, pro, featured)
[ ] Add verified badge to server cards
[ ] Priority sorting within category listings
```

### Basic Analytics Dashboard

```
[ ] Track installs per server (already have CLI telemetry?)
[ ] Track page views per server
[ ] Track search appearances
[ ] Build simple dashboard:
    - /dashboard/[server-slug]
    - Show: installs, views, search rank
    - CTA: "Upgrade to Featured for 10x visibility"
```

**Week 2 Success Metrics:**
- [ ] Stripe checkout working
- [ ] Featured/Pro tiers purchasable
- [ ] Basic analytics visible to maintainers

---

## Phase 3: Outreach & First Revenue (Week 3)

### Maintainer Outreach Campaign

```
[ ] Export list of top 50 servers by GitHub stars
[ ] Find maintainer emails from GitHub profiles
[ ] Send personalized emails:

Subject: Your MCP server got [X] installs this month

Hey [Name],

I'm the creator of OpenConductor - the npm registry for MCP servers.

Your server [server-name] has been installed [X] times through our CLI 
this month. Nice work!

I wanted to let you know we just launched Featured Listings. For $99/month, 
your server gets:
- Top placement in search results
- Featured badge on your server card  
- Homepage carousel placement
- Analytics dashboard showing installs/views

Early adopters get 50% off the first 3 months ($49/month).

Interested? Reply to this email or upgrade here: [link]

- Shawn
OpenConductor

[ ] Follow up sequence (Day 3, Day 7)
[ ] Track responses in simple spreadsheet
```

### Social Proof Campaign

```
[ ] Post install stats on X/Twitter weekly
[ ] Create "Top 10 MCP Servers This Week" content
[ ] Reach out to Anthropic devrel team
[ ] Post in MCP Discord/communities
[ ] Write "State of MCP Servers" blog post with data
```

### Badge Adoption Push

```
[ ] Email maintainers with badge embed code
[ ] Create "Add to README" one-click copy
[ ] Track badge click-through rates
[ ] Feature servers with badges in search
```

**Week 3 Success Metrics:**
- [ ] 50 maintainers contacted
- [ ] 10+ responses/conversations
- [ ] 2-3 verbal commitments

---

## Phase 4: Scale & Optimize (Week 4)

### Close First Customers

```
[ ] Follow up with interested maintainers
[ ] Offer founding member pricing ($49/month locked in)
[ ] Process first payments
[ ] Onboard featured servers
```

### Optimize Conversion

```
[ ] A/B test pricing page copy
[ ] Add testimonials from early adopters
[ ] Create case study: "Server X got 10x installs after featuring"
[ ] Add urgency: "Only 10 featured slots available"
```

### Expand Tiers (if demand exists)

```
[ ] "Starter Analytics" - $9/month (just analytics, no featuring)
[ ] "Agency" - $299/month (manage multiple servers)
[ ] "Enterprise" - Custom pricing (private registry)
```

**Week 4 Success Metrics:**
- [ ] 5 featured listings ($495/month)
- [ ] 10 pro listings ($290/month)
- [ ] Total MRR: ~$800/month
- [ ] Pipeline for Month 2: $2,000/month

---

## Technical Architecture (Simplified)

### Current (Get Working First)
```
Frontend (Next.js) → API (Express) → Supabase (PostgreSQL)
                                   ↓
CLI → API ─────────────────────────┘
```

### Phase 2 Addition
```
Frontend → API → Supabase
              ↓
           Stripe (billing)
              ↓
CLI → API ────┘
```

### Future (Only If Needed)
```
+ Redis for caching (if latency issues)
+ Edge functions (if global latency matters)
+ Background workers (if health checks needed)
```

---

## Database Schema Additions for Monetization

```sql
-- Add to mcp_servers table
ALTER TABLE mcp_servers ADD COLUMN tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE mcp_servers ADD COLUMN featured BOOLEAN DEFAULT false;
ALTER TABLE mcp_servers ADD COLUMN featured_until TIMESTAMP;
ALTER TABLE mcp_servers ADD COLUMN verified BOOLEAN DEFAULT false;
ALTER TABLE mcp_servers ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE mcp_servers ADD COLUMN stripe_subscription_id VARCHAR(255);

-- Analytics table
CREATE TABLE server_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id),
  event_type VARCHAR(50), -- 'install', 'view', 'search_appearance', 'badge_click'
  event_date DATE,
  count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast analytics queries
CREATE INDEX idx_analytics_server_date ON server_analytics(server_id, event_date);

-- Billing events
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id),
  stripe_event_id VARCHAR(255),
  event_type VARCHAR(50),
  amount_cents INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Pricing Strategy

### Tier Comparison

| Feature | Free | Pro ($29/mo) | Featured ($99/mo) |
|---------|------|--------------|-------------------|
| Listed in registry | ✅ | ✅ | ✅ |
| CLI installable | ✅ | ✅ | ✅ |
| Badge embed | ✅ | ✅ | ✅ |
| Verified badge | ❌ | ✅ | ✅ |
| Analytics dashboard | ❌ | ✅ | ✅ |
| Priority in category | ❌ | ✅ | ✅ |
| Search boost | ❌ | ❌ | ✅ |
| Homepage carousel | ❌ | ❌ | ✅ |
| "Featured" badge | ❌ | ❌ | ✅ |

### Launch Pricing (First 20 customers)

- Featured: $49/month (50% off, locked for 12 months)
- Pro: $19/month (35% off, locked for 12 months)

---

## Kill List (Removed from Original Plan)

These are OUT of scope for the 4-week sprint:

1. ~~Enterprise agent system (Atlas/Nova/Pulse/Apex)~~ - Zero customers asking
2. ~~Doctor command~~ - Nice-to-have, not revenue
3. ~~Private/Team Registries~~ - Enterprise feature, no enterprise customers yet
4. ~~VS Code extension~~ - Distribution play, not monetization
5. ~~Raycast extension~~ - Same
6. ~~Product Hunt launch~~ - Vanity metrics, not revenue
7. ~~Server health monitoring~~ - Over-engineering
8. ~~One-click install links~~ - Cool but not urgent
9. ~~AI recommendations~~ - Premature optimization
10. ~~OpenTelemetry/observability~~ - Add when you have paying customers

---

## Future Phases (Post-Revenue)

### Month 2-3: Scale What Works
- Double down on outreach if Featured converts
- Add more analytics features if Pro converts
- Consider "Starter Analytics" tier at $9/month

### Month 4-6: Expand Revenue Streams
- Consulting/implementation services ($500-2,000/project)
- "Deploy to Apify" integration (pay-per-event)
- Sponsored search results
- API access tier for agents

### Month 7-12: Platform Play
- Private registries for enterprises
- Team features
- SSO/SAML
- Custom domains

---

## Success Metrics

### Week 1
- [ ] API live and responding
- [ ] 190+ servers accessible
- [ ] CLI working end-to-end

### Week 2
- [ ] Stripe integration complete
- [ ] Checkout flow working
- [ ] Basic analytics visible

### Week 3
- [ ] 50 maintainers contacted
- [ ] 10+ interested responses
- [ ] 2-3 verbal commitments

### Week 4
- [ ] First paying customers
- [ ] $500+ MRR
- [ ] Repeatable outreach process

### Month 2
- [ ] $2,000 MRR
- [ ] 20+ paying servers
- [ ] Testimonials/case studies

### Month 3
- [ ] $5,000 MRR
- [ ] Word-of-mouth referrals
- [ ] Inbound interest from maintainers

---

## Immediate Next Steps

**TODAY:**
1. Run schema migrations on Supabase
2. Re-seed servers from GitHub
3. Get API responding locally

**THIS WEEK:**
1. Deploy API + Frontend
2. CLI v1.4.0 to npm
3. Announce comeback on X/Twitter

**NEXT WEEK:**
1. Stripe integration
2. Featured/Pro tiers
3. Start maintainer outreach

---

## Resources

- **Supabase Project:** axuqrkhscyqmaglcdprd
- **GitHub:** github.com/openconductor/openconductor
- **npm:** @openconductor/cli
- **Domain:** openconductor.ai

---

## Questions Resolved

1. **Database**: Fresh migration, re-seed from GitHub ✅
2. **Enterprise agents**: Mothballed - revisit with paying customers
3. **Monetization timing**: NOW (Week 2-3)
4. **Pricing**: $29 Pro / $99 Featured (with launch discounts)

---

*Updated: January 18, 2026*
*Focus: Revenue in 4 weeks*
*Author: Shawn + Claude collaboration*
