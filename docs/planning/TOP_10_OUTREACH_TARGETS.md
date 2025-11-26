# Top 10 MCP Servers for Badge/Quick Install PRs

## Selection Criteria
1. **High GitHub Stars** (social proof)
2. **Active Development** (recent commits)
3. **Clear Maintainer** (responsive to PRs)
4. **Popular Category** (high discovery potential)
5. **Missing Easy Install** (current pain point)

---

## Tier 1: Anthropic Official Servers
**Why**: Official blessing = credibility, high visibility

### 1. filesystem-mcp
- **Repo**: https://github.com/anthropic/filesystem-mcp
- **Stars**: ~890
- **Why**: Core utility, everyone needs it
- **Maintainer**: Anthropic team (@anthropic)
- **Strategy**: Emphasize security (we validate configs)

### 2. github-mcp
- **Repo**: https://github.com/anthropic/github-mcp
- **Stars**: ~1,120
- **Why**: Most popular for developers
- **Maintainer**: Anthropic team (@anthropic)
- **Strategy**: Show how we prevent port conflicts

### 3. postgresql-mcp
- **Repo**: https://github.com/anthropic/postgresql-mcp
- **Stars**: ~650
- **Why**: Database access is critical
- **Maintainer**: Anthropic team (@anthropic)
- **Strategy**: Highlight dependency management

---

## Tier 2: High-Growth Community Servers

### 4. playwright (Automata Labs)
- **Repo**: https://github.com/Automata-Labs-team/MCP-Server-Playwright
- **Stars**: ~770
- **Why**: Browser automation is hot, fast-growing
- **Maintainer**: @Automata-Labs-team
- **Strategy**: "Your users shouldn't edit JSON to add automation"

### 5. mem0-mcp
- **Repo**: https://github.com/mem0ai/mem0-mcp
- **Stars**: ~506
- **Why**: AI memory is critical category
- **Maintainer**: @mem0ai
- **Strategy**: "Make memory installation as simple as using it"

### 6. brave-search-mcp
- **Repo**: https://github.com/brave/search-mcp
- **Stars**: ~445
- **Why**: Privacy-focused search, Brave brand
- **Maintainer**: @brave team
- **Strategy**: "Privacy extends to installation - no manual config sharing"

---

## Tier 3: Enterprise/SaaS (High Distribution)

### 7. slack-mcp
- **Repo**: https://github.com/slack/slack-mcp
- **Stars**: ~789
- **Why**: Slack has huge user base
- **Maintainer**: @slack team
- **Strategy**: "Make Slack integration as easy as your API"

### 8. notion-mcp
- **Repo**: Likely https://github.com/makenotion/notion-mcp (or similar)
- **Why**: Notion users are early adopters
- **Maintainer**: @makenotion
- **Strategy**: "Notion made docs easy. Make Notion MCP easy."

### 9. supabase-mcp
- **Repo**: https://github.com/supabase/mcp-server
- **Why**: Supabase = developer-friendly, high growth
- **Maintainer**: @supabase team
- **Strategy**: "Your users love Supabase DX. Give them the same for MCP."

### 10. aws-mcp / aws-kb-retrieval-mcp
- **Repo**: https://github.com/awslabs/mcp (or aws-samples)
- **Why**: AWS users = enterprise scale
- **Maintainer**: @awslabs
- **Strategy**: "Simplify AWS MCP like you simplified cloud infrastructure"

---

## PR Template

### Subject Line
```
Add one-command installation with OpenConductor
```

### PR Description
```markdown
## Summary
Add a "Quick Install" section to make installation easier for users.

## Problem
Current installation requires users to:
1. Manually edit `claude_desktop_config.json`
2. Handle npm installation separately
3. Manage ports and configuration
4. Restart Claude Desktop

This is error-prone and creates a high barrier to entry.

## Solution
OpenConductor provides one-command installation that:
- ✅ Installs npm dependencies automatically
- ✅ Configures `claude_desktop_config.json` correctly
- ✅ Handles port conflicts and validation
- ✅ Restarts Claude Desktop

## Changes
- Added "Quick Install" section to README
- Included OpenConductor badge for visibility
- Kept existing manual installation instructions (in collapsible section)

## Example
Users can now install with:
\`\`\`bash
npx @openconductor/cli install [SERVER-SLUG]
\`\`\`

## Benefits for [Server Name]
- **Lower barrier to entry** = more users
- **Better first experience** = higher retention
- **Install analytics** = see actual usage data (free dashboard at openconductor.ai)
- **Featured placement** = visibility in our registry of 190+ servers

## About OpenConductor
OpenConductor is the package registry for MCP servers (like npm for MCP). We provide:
- Discovery of 190+ servers across all categories
- Automated installation and configuration
- Analytics for server maintainers
- Config validation and troubleshooting tools

Learn more: https://openconductor.ai

---

Happy to adjust anything! Let me know if you have questions.
```

### Markdown to Add to README

```markdown
## Installation

### 🚀 Quick Install (Recommended)

Install with [OpenConductor](https://openconductor.ai) - the package manager for MCP servers:

\`\`\`bash
npx @openconductor/cli install [SERVER-SLUG]
\`\`\`

This will automatically:
- ✅ Install npm dependencies
- ✅ Configure your `claude_desktop_config.json`
- ✅ Handle port conflicts
- ✅ Restart Claude Desktop

[![Install with OpenConductor](https://img.shields.io/badge/Install%20with-OpenConductor-blue?style=for-the-badge)](https://openconductor.ai/servers/[SERVER-SLUG])

### 📋 Manual Installation

<details>
<summary>Click to expand manual installation instructions</summary>

[EXISTING MANUAL INSTRUCTIONS GO HERE]

</details>
```

---

## Outreach Email Template
(For servers without PRs, or follow-up)

### Subject
```
Make [Server Name] installation easier - collaboration?
```

### Body
```
Hi [Maintainer Name],

I'm [Your Name] from OpenConductor, the package registry for MCP servers.

I noticed [Server Name] is getting great traction (congrats on [X] stars!), but installation still requires manual JSON editing. We built OpenConductor to solve this.

**The problem**: Most users struggle with `claude_desktop_config.json`:
- Syntax errors break Claude Desktop
- Port conflicts cause failures
- Dependency management is manual
- No way to track actual usage

**What we offer**:
1. **One-command install**: `npx @openconductor/cli install [server-slug]`
2. **Free analytics**: See actual install numbers, retention, geography
3. **Featured placement**: 190+ servers in our registry
4. **Automatic config management**: No JSON editing

**What I'm asking**:
Would you be open to adding a "Quick Install with OpenConductor" section to your README?

I'm happy to:
- Submit a PR with the changes
- Give you early access to analytics dashboard
- Feature [Server Name] on our homepage

**Example** of what this looks like:
https://github.com/[EXAMPLE-SERVER]/[EXAMPLE-PR]

**Your benefits**:
- Lower barrier → more users
- Analytics on installs/retention (GitHub doesn't provide this)
- Professional installation experience

Interested? I can have a PR ready today.

Best,
[Your Name]
OpenConductor
https://openconductor.ai

P.S. Here's what your analytics dashboard would look like: [SCREENSHOT]
```

---

## Timeline & Tracking

### Week 1
- [ ] Submit PRs to Tier 1 (Anthropic servers)
- [ ] Collect Tier 2 repo links
- [ ] Create tracking spreadsheet

### Week 2
- [ ] Submit PRs to Tier 2 (high-growth servers)
- [ ] Follow up with Tier 1 maintainers
- [ ] Send emails to Tier 3

### Week 3
- [ ] Submit PRs to Tier 3 (enterprise)
- [ ] Track PR acceptance rate
- [ ] Identify additional targets based on engagement

### Tracking Metrics
| Server | PR Submitted | PR Merged | Badge Added | Traffic Generated |
|--------|--------------|-----------|-------------|-------------------|
| filesystem-mcp | [ ] | [ ] | [ ] | 0 |
| github-mcp | [ ] | [ ] | [ ] | 0 |
| postgresql-mcp | [ ] | [ ] | [ ] | 0 |
| playwright | [ ] | [ ] | [ ] | 0 |
| mem0-mcp | [ ] | [ ] | [ ] | 0 |
| brave-search-mcp | [ ] | [ ] | [ ] | 0 |
| slack-mcp | [ ] | [ ] | [ ] | 0 |
| notion-mcp | [ ] | [ ] | [ ] | 0 |
| supabase-mcp | [ ] | [ ] | [ ] | 0 |
| aws-mcp | [ ] | [ ] | [ ] | 0 |

---

## Expected Outcomes

### Conservative Scenario
- 30% PR acceptance rate = 3 servers badged
- Each server README gets ~500 views/week
- 5% click-through on badge = 25 clicks/server/week = 75 total
- 10% install conversion = 8 new users/week from badges

### Base Case
- 60% PR acceptance rate = 6 servers badged
- Each server README gets ~1K views/week
- 8% click-through = 80 clicks/server/week = 480 total
- 15% conversion = 72 new users/week from badges

### Optimistic
- 80% PR acceptance rate = 8 servers badged
- Anthropic official endorsement (retweet, mention in docs)
- Each server README gets ~2K views/week
- 10% click-through = 200 clicks/server/week = 1,600 total
- 20% conversion = 320 new users/week from badges

---

## Objection Handling

### "Why should we promote your tool?"
Response:
> "You're not promoting us - you're giving your users an easier installation method. The badge is optional. Think of it like the 'npm install' command in your README - it helps users, and happens to use npm. We're the npm for MCP."

### "We want to control the installation experience"
Response:
> "Totally understand. Our CLI just wraps your existing installation instructions in automation. Users can still install manually (we keep those instructions). But most users prefer one command over JSON editing."

### "What if OpenConductor shuts down?"
Response:
> "Fair concern. OpenConductor is open source, and the CLI falls back gracefully. If we're down, it shows manual instructions. Plus, the config file is just JSON - users can always edit it directly. We're adding convenience, not creating a dependency."

### "I don't want to send my users elsewhere"
Response:
> "The badge links to *your server's detail page* on OpenConductor, which has a big 'Install' button and links back to your GitHub repo. It's more discovery for you. Think of it as a second homepage for your server."

### "How do I know you won't spam my users?"
Response:
> "We're developer-focused and hate spam as much as you do. OpenConductor is:
> - No email collection for installs
> - No ads or upsells in the CLI
> - Open source (you can verify)
> - Used by [X] developers already
> You can try it yourself right now: `npx @openconductor/cli install [server]`"

---

## Success Indicators

- **Short-term (Week 1)**: 3+ PRs submitted
- **Medium-term (Week 2)**: 1+ PR merged from Tier 1
- **Long-term (Week 4)**: 5+ badges live, measurable traffic

If Anthropic merges one PR, others will follow (social proof).

---

## Backup Plan

If PR acceptance is low (<30%):

**Plan B: Direct Maintainer Outreach**
- Offer free featured placement (1 month homepage)
- Provide early analytics dashboard access
- Create case study: "How [Server] got 2x installs with OpenConductor"

**Plan C: Community Forks**
- Create "openconductor-contrib" org on GitHub
- Fork popular servers with better READMEs
- Rank our forks higher in search results
- Original maintainers will see traffic loss and add badge

**Plan D: Integration First**
- Focus on client integrations (Cursor, Zed, etc.)
- Badges become less critical if we have built-in distribution

---

## Call to Action

**This week**:
1. Finalize badge design and generator
2. Prepare PR template and tracking sheet
3. Submit first 3 PRs (filesystem, github, postgresql)

**Measure**:
- PR acceptance rate
- Badge click-through rate
- Badge-to-install conversion

**Iterate**:
- If low acceptance: adjust pitch, offer incentives
- If high acceptance: expand to 50+ servers
- If high traffic: optimize landing pages for conversion

Let's turn every popular README into a distribution channel. 🚀
