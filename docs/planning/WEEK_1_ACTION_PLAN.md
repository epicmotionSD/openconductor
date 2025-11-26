# Week 1 Action Plan: Launch Growth Flywheel

**Goal**: Ship badge system, starter packs, and submit first PRs
**Timeline**: 7 days
**Success Criteria**: 3 PRs submitted, 3 stacks live, badge generator working

---

## DAY 1: Fix Production & Badge System ✅

### Morning: Production Verification (2 hours)
- [ ] Check Vercel deployment status for v1.1.0
- [ ] Verify production API has 191 servers
  ```bash
  curl https://www.openconductor.ai/api/v1/servers?limit=200 | jq '.data.pagination.total'
  # Should return 191, not 93
  ```
- [ ] Test production endpoints:
  - [ ] Search: `/v1/servers?q=snowflake`
  - [ ] Categories: `/v1/servers/categories`
  - [ ] Trending: `/v1/servers/stats/trending`
  - [ ] Server detail: `/v1/servers/github-mcp`
- [ ] If broken: Deploy fix or seed production DB

### Afternoon: Badge Command (4 hours)
- [ ] Create `src/commands/badge.js` in CLI
- [ ] Implement badge generator:
  ```javascript
  // Generates markdown snippet for README
  openconductor badge <server-slug>
  ```
- [ ] Badge includes:
  - [ ] Shield.io badge with install count
  - [ ] Link to server detail page
  - [ ] Installation code snippet
- [ ] Test locally:
  ```bash
  openconductor badge github-mcp
  # Should output formatted markdown
  ```
- [ ] Commit and push

---

## DAY 2: Badge UI & Stack Database Schema

### Morning: Badge Generator UI (3 hours)
- [ ] Add "Get Install Badge" button to server detail pages
- [ ] Create modal/popup with:
  - [ ] Markdown preview
  - [ ] Copy to clipboard button
  - [ ] Badge customization options (style, color)
- [ ] Test on `/servers/github-mcp` page

### Afternoon: Stack Database Setup (3 hours)
- [ ] Create migration for stacks tables:
  ```sql
  -- packages/api/src/db/migrations/006_stacks.sql
  CREATE TABLE stacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    featured BOOLEAN DEFAULT false,
    installs INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE stack_servers (
    stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
    server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    PRIMARY KEY (stack_id, server_id)
  );
  ```
- [ ] Run migration locally
- [ ] Seed 3 initial stacks (see below)

---

## DAY 3: Stack Installation Command

### Morning: Stack CLI Command (4 hours)
- [ ] Create `src/commands/stack.js`
- [ ] Implement subcommands:
  ```bash
  openconductor stack list           # List all stacks
  openconductor stack show <name>    # View stack details
  openconductor stack install <name> # Install all servers in stack
  ```
- [ ] Stack install should:
  - [ ] Fetch stack from API
  - [ ] Install each server sequentially
  - [ ] Show progress (server 1/6, 2/6, etc.)
  - [ ] Handle errors gracefully

### Afternoon: Seed Initial Stacks (2 hours)
- [ ] Create `packages/api/src/db/seed-stacks.ts`
- [ ] Seed 3 stacks:

**Essential Stack**:
```typescript
{
  slug: 'essential',
  name: 'Essential Stack',
  tagline: 'The basics everyone needs',
  servers: ['openmemory', 'filesystem-mcp', 'brave-search-mcp', 'github-mcp']
}
```

**Coder Stack**:
```typescript
{
  slug: 'coder',
  name: 'Coder Stack',
  tagline: 'Turn Claude into your senior developer',
  servers: [
    'github-mcp',
    'filesystem-mcp',
    'postgresql-mcp',
    'openmemory',
    'docker-mcp',
    'aws-mcp'
  ]
}
```

**Writer Stack**:
```typescript
{
  slug: 'writer',
  name: 'Writer Stack',
  tagline: 'Claude as your research assistant',
  servers: [
    'openmemory',
    'brave-search-mcp',
    'perplexity',
    'notion-mcp',
    'google-drive-mcp'
  ]
}
```

- [ ] Run seed script
- [ ] Test locally: `openconductor stack install essential`

---

## DAY 4: Stacks Landing Page

### Morning: Frontend Stack Page (3 hours)
- [ ] Create `/stacks` page in frontend
- [ ] Grid layout showing all stacks
- [ ] Each stack card shows:
  - [ ] Icon/emoji
  - [ ] Name and tagline
  - [ ] Number of servers
  - [ ] Install command
  - [ ] "View Details" button
- [ ] Link from homepage

### Afternoon: Stack Detail Page (3 hours)
- [ ] Create `/stacks/[slug]` dynamic page
- [ ] Show:
  - [ ] Stack name, tagline, description
  - [ ] Full server list with descriptions
  - [ ] Installation instructions
  - [ ] Total install count
  - [ ] "Install This Stack" CTA button
- [ ] Test with `/stacks/coder`

---

## DAY 5: PR Preparation & First Submissions

### Morning: Finalize PR Template (1 hour)
- [ ] Review `TOP_10_OUTREACH_TARGETS.md`
- [ ] Customize template for each target
- [ ] Prepare markdown snippets with correct slugs:
  - [ ] filesystem-mcp
  - [ ] github-mcp
  - [ ] postgresql-mcp

### Afternoon: Submit First 3 PRs (4 hours)
- [ ] **PR #1**: anthropic/filesystem-mcp
  - [ ] Fork repo
  - [ ] Add "Quick Install" section to README
  - [ ] Add OpenConductor badge
  - [ ] Submit PR with template
  - [ ] Track in spreadsheet

- [ ] **PR #2**: anthropic/github-mcp
  - [ ] Same process
  - [ ] Customize message for GitHub integration

- [ ] **PR #3**: anthropic/postgresql-mcp
  - [ ] Same process
  - [ ] Emphasis on dependency management

### Evening: Track & Follow Up
- [ ] Create tracking spreadsheet:
  ```
  Server | Repo | PR Link | Status | Response | Notes
  ```
- [ ] Set reminders to follow up in 2 days

---

## DAY 6: Marketing Content Creation

### Morning: Demo Video (3 hours)
- [ ] Record 60-second screen recording:
  - [ ] "Installing Claude for coding in 10 seconds"
  - [ ] Show: `openconductor stack install coder`
  - [ ] Show: Claude Desktop with all tools working
- [ ] Upload to YouTube
- [ ] Create GIF for social media

### Afternoon: Blog Post (3 hours)
- [ ] Write announcement post:
  ```
  Title: "Stop Editing JSON Files: Introducing Stacks for Claude"

  Sections:
  1. The problem (JSON hell)
  2. The solution (stacks)
  3. Demo (video embed)
  4. Get started (install command)
  5. What's next (doctor command preview)
  ```
- [ ] Publish to blog
- [ ] Share draft on Discord for feedback

---

## DAY 7: Launch Preparation & Social

### Morning: Product Hunt Submission (2 hours)
- [ ] Create Product Hunt listing:
  - [ ] Title: "OpenConductor - npm for MCP Servers with Curated Stacks"
  - [ ] Tagline: "Install AI agent tools in seconds, not hours"
  - [ ] Description highlighting stacks
  - [ ] Demo video
  - [ ] Screenshots
- [ ] Schedule for Tuesday launch (best day)

### Midday: Social Media Content (2 hours)
- [ ] Write Twitter thread:
  ```
  🧵 Stop manually editing claude_desktop_config.json

  I built OpenConductor - the package manager for MCP servers.

  Now with "Stacks" - pre-configured tool collections:

  🧑‍💻 Coder Stack - 6 tools for development
  ✍️ Writer Stack - 5 tools for research
  📊 Data Stack - 6 tools for analytics

  One command. 10 seconds. No JSON.

  [Demo video]

  Try it: `openconductor stack install coder`

  Here's how it works... [1/8]
  ```
- [ ] Prepare Reddit posts for:
  - [ ] r/programming
  - [ ] r/LocalLLaMA
  - [ ] r/ClaudeAI
  - [ ] r/MachineLearning

### Afternoon: Launch Checklist (2 hours)
- [ ] Verify all endpoints working in production
- [ ] Test full user journey:
  - [ ] Visit openconductor.ai
  - [ ] Browse to /stacks
  - [ ] Click "Install Coder Stack"
  - [ ] Copy command
  - [ ] Run: `openconductor stack install coder`
  - [ ] Verify Claude Desktop config updated
- [ ] Monitor error logs
- [ ] Prepare for traffic spike

### Evening: Hacker News Submission (1 hour)
- [ ] Submit to HN:
  ```
  Title: "Show HN: OpenConductor – npm for MCP servers with curated stacks"
  URL: https://openconductor.ai
  ```
- [ ] Monitor comments and respond
- [ ] Cross-post to relevant subreddits

---

## Success Metrics for Week 1

### Minimum Viable Success
- [ ] 3 PRs submitted
- [ ] 3 stacks installable
- [ ] Badge generator working
- [ ] 50+ new users from launch

### Target Success
- [ ] 1 PR merged (from Anthropic)
- [ ] 100+ stack installs
- [ ] Product Hunt featured
- [ ] 200+ new users

### Stretch Goals
- [ ] 2 PRs merged
- [ ] Product Hunt #1 in AI/Dev Tools
- [ ] 500+ new users
- [ ] HN front page

---

## Daily Standup Questions

Ask yourself each evening:

1. **Shipped**: What did I ship today?
2. **Blocked**: What's blocking progress?
3. **Next**: What's the most important task tomorrow?
4. **Metrics**: How many users today? Conversion rate?

---

## Contingency Plans

### If PRs Get Rejected
- **Backup**: Focus on community servers (mem0, playwright, brave-search)
- **Alternative**: Create "awesome-mcp-servers" repo with badged servers
- **Nuclear option**: Fork popular servers with better READMEs

### If Production is Broken
- **Immediate**: Point CLI to localhost, deploy fix
- **Short-term**: Seed production DB manually
- **Long-term**: Add monitoring and health checks

### If Stacks Don't Work
- **Debug**: Test each server install individually
- **Fallback**: Ship badge system only, delay stacks to Week 2
- **Pivot**: Focus on doctor command instead

---

## Week 1 Deliverables Checklist

### Code Shipped
- [ ] Badge generator command
- [ ] Badge UI on server pages
- [ ] Stack install command
- [ ] Stack database schema
- [ ] 3 stacks seeded
- [ ] Stacks landing page
- [ ] Stack detail pages

### Content Created
- [ ] Demo video (60 seconds)
- [ ] Blog post announcement
- [ ] Twitter thread
- [ ] Reddit posts (4x)
- [ ] Product Hunt listing
- [ ] HN submission

### Outreach Done
- [ ] 3 PRs to Anthropic servers
- [ ] Tracking spreadsheet created
- [ ] Follow-up emails scheduled

### Infrastructure
- [ ] Production API verified/fixed
- [ ] All endpoints tested
- [ ] Error monitoring set up
- [ ] Analytics dashboard (basic)

---

## End of Week 1 Review

### Questions to Answer
1. How many PRs were merged? (Target: 1)
2. How many stacks were installed? (Target: 100)
3. How many new users? (Target: 200)
4. What's the biggest blocker for Week 2?
5. What worked better than expected?
6. What should we kill or defer?

### Prepare for Week 2
- [ ] Prioritize doctor command or expand stacks?
- [ ] More PR outreach or focus on conversion?
- [ ] Double down on what worked
- [ ] Schedule calls with interested maintainers

---

## Resources & Links

- **Code**: `/packages/cli/src/commands/`
- **Docs**: `/BADGE_SYSTEM.md`, `/STARTER_PACKS.md`
- **Tracking**: Google Sheets (create Week 1 tracking sheet)
- **Analytics**: openconductor.ai/admin (set up)
- **Support**: Discord #dev-updates channel

---

**Remember**: Perfect is the enemy of shipped. Week 1 is about momentum, not perfection. Ship fast, gather feedback, iterate.

Let's build the flywheel. 🚀
