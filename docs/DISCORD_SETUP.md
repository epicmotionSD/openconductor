# Discord Community Setup Guide

## Overview

Launch the OpenConductor Discord community to support developers, gather feedback, and build an engaged user base around MCP servers and Trust Stack.

**Target:** 200+ members by end of Q1 2026

## Server Structure

### Channels

#### **WELCOME & INFO**
- `#welcome` — Auto-greeting with onboarding instructions
- `#rules` — Community guidelines (see below)
- `#announcements` — Official updates from the team (admin-only posting)
- `#changelog` — Automated updates from GitHub releases

#### **GENERAL**
- `#general` — Open discussion about MCP, AI agents, OpenConductor
- `#introductions` — New member introductions
- `#show-and-tell` — Share your MCP servers and projects
- `#questions` — General Q&A

#### **TECHNICAL**
- `#mcp-servers` — Building and using MCP servers
- `#sdk-help` — @openconductor/mcp-sdk questions and debugging
- `#trust-stack` — On-chain agent registration, ERC-8004, governance
- `#integrations` — Claude Desktop, Cursor, Cline, Windsurf setup

#### **DEVELOPMENT**
- `#contributors` — For active contributors to openconductor repos
- `#bug-reports` — Issues and bug tracking (links to GitHub)
- `#feature-requests` — Suggest new features
- `#pull-requests` — Automated notifications from GitHub

#### **COMMUNITY**
- `#off-topic` — General chat, memes, casual conversation
- `#resources` — Useful links, tutorials, external resources
- `#events` — Virtual meetups, AMAs, hackathons

#### **VOICE**
- `Office Hours` — Weekly drop-in sessions with maintainers
- `General Voice` — Open voice chat
- `Screen Share` — For demos and pair programming

---

## Roles & Permissions

### **Roles**

| Role | Color | Permissions | How to Get |
|------|-------|-------------|------------|
| `@Team` | Red | Admin access | OpenConductor core team |
| `@Contributors` | Blue | Post in #contributors, highlight in mentions | Merged PR to any openconductor repo |
| `@Verified Builders` | Green | Post in #show-and-tell emphasized | Published MCP server in registry |
| `@Early Adopters` | Purple | Special badge | Joined in first 100 members |
| `@Member` | Gray | Standard permissions | Default role for all members |

### **Key Permissions**

- Only `@Team` can post in `#announcements` and `#changelog`
- `@Contributors` can pin messages in `#development` channels
- `@Verified Builders` can embed links and upload files in all channels
- Rate limits: 5 messages per 10 seconds for new members (first 24 hours)

---

## Community Guidelines (for #rules)

```markdown
# OpenConductor Community Guidelines

Welcome to the OpenConductor Discord! This is a space for developers building with MCP servers, exploring Trust Stack, and contributing to the agentic internet infrastructure.

## Code of Conduct

1. **Be Respectful** — No harassment, hate speech, or personal attacks
2. **Stay On Topic** — Keep discussions relevant to channels
3. **No Spam** — Don't post promotional content without permission
4. **No Illegal Content** — No piracy, unauthorized code, or malicious tools
5. **Ask Before DM** — Request permission before direct messaging members

## Channel Guide

- **#questions** — General Q&A, "how do I...?" questions
- **#sdk-help** — SDK-specific debugging and implementation questions
- **#show-and-tell** — Share your projects, get feedback
- **#bug-reports** — Report issues (include error logs, OS, versions)
- **#off-topic** — Everything else

## Getting Help

1. Search existing messages first (Ctrl+F or Cmd+F)
2. Check the docs: https://github.com/epicmotionSD/openconductor
3. Ask in the relevant channel with context (error messages, code snippets, what you tried)
4. Be patient — we're all volunteers

## Contributing

Want the `@Contributors` role?
1. Browse issues: https://github.com/epicmotionSD/openconductor/issues
2. Submit a PR (even fixing typos counts!)
3. Ping `@Team` in #contributors once merged

## Resources

- Website: https://openconductor.ai
- Portal: https://x3o.ai
- Registry: https://openconductor.ai/discover
- npm: https://www.npmjs.com/package/@openconductor/mcp-sdk
- Docs: https://github.com/epicmotionSD/openconductor

Questions? Ask in #questions or tag `@Team`.

*Violating guidelines may result in warnings, muted status, or ban depending on severity.*
```

---

## Welcome Message (#welcome)

Configure a bot (MEE6, Dyno, or Carl-bot) to send this message when users join:

```
Welcome to OpenConductor, @username! 👋

**Quick Start:**
1. Read the rules in #rules
2. Introduce yourself in #introductions
3. Check out #announcements for latest updates
4. Ask questions in #questions

**What's OpenConductor?**
- MCP Server Registry with 220+ servers
- Trust Stack — on-chain identity for AI agents
- SDK for building production MCP servers

**Useful Links:**
- Browse servers: https://openconductor.ai/discover
- Install CLI: `npx @openconductor/cli install`
- SDK docs: https://www.npmjs.com/package/@openconductor/mcp-sdk

Need help? Just ask in #questions!
```

---

## Onboarding Flow

### First 48 Hours Post-Launch

1. **Seed Content** — Post 5-10 messages in key channels before inviting members
   - #general: "What MCP servers are you using?"
   - #show-and-tell: Share Empire MCP Server
   - #sdk-help: "Pro tip: SDK v1.4.0 has zero-config demo mode!"

2. **Invite Early Adopters**
   - GitHub stargazers from openconductor/registry
   - npm users who installed @openconductor/mcp-sdk (if possible via email)
   - Twitter followers (if you have an X account)

3. **Weekly Office Hours**
   - Every Friday 3pm ET in voice channel
   - Answer questions, demo features, roadmap discussions

### Growth Strategy

| Week | Action | Target Members |
|------|--------|----------------|
| 1    | Launch + invite GitHub/npm users | 25 |
| 2    | Reddit posts (r/ClaudeAI, r/MachineLearning) | 75 |
| 3    | Blog post + Twitter announcement | 125 |
| 4    | First community event (AMA or workshop) | 200 |

---

## Custom Invite Link

To get `discord.gg/openconductor`:

1. Server needs **Level 2 Server Boost** (requires 7 boosts)
2. Go to **Server Settings → Vanity URL**
3. Claim `openconductor`

**Alternative (before boost):** Use a short invite link like `discord.gg/ABCD123` and update the ROADMAP.md once vanity URL is available.

---

## Integrations

### GitHub Webhook

Connect GitHub to `#pull-requests` and `#changelog`:

1. Install Discord Webhook app in GitHub repo
2. Create webhook in `#pull-requests` channel
3. Configure events: Pull requests, Issues, Releases
4. Webhook URL: `https://discord.com/api/webhooks/...`

### RSS Feed (#announcements)

Use a bot to auto-post from:
- OpenConductor blog (if you create one)
- GitHub releases: https://github.com/epicmotionSD/openconductor/releases.atom

---

## Moderation Tools

### Recommended Bots

1. **MEE6** — Welcome messages, auto-roles, XP leveling
2. **Carl-bot** — Reaction roles, auto-moderation
3. **GitHub** — Official GitHub notifications bot
4. **Statbot** — Server stats and analytics

### Auto-Mod Rules

- Prevent spam links from new accounts (< 10 min old)
- Block common scam phrases ("free Nitro", "discord.gift")
- Flag excessive caps (>70% caps in message)
- Rate limit: 5 messages per 10 seconds for new members

---

## Launch Checklist

- [ ] Create Discord server
- [ ] Set up channel structure (above)
- [ ] Configure roles and permissions
- [ ] Add welcome message bot (MEE6 or Dyno)
- [ ] Post community guidelines in #rules
- [ ] Seed 5-10 messages in key channels
- [ ] Set up GitHub webhook for #pull-requests
- [ ] Create first invite link (before vanity URL available)
- [ ] Invite first 10-20 early adopters (GitHub contributors, Twitter followers)
- [ ] Announce on Twitter/X (if applicable)
- [ ] Update ROADMAP.md with actual invite link
- [ ] Post in #announcements: "First 100 members get @Early Adopters role!"
- [ ] Schedule first Office Hours session

---

## Success Metrics

| Metric | Week 1 | Week 2 | Week 3 | Week 4 | Q1 End |
|--------|--------|--------|--------|--------|--------|
| Total Members | 25 | 75 | 125 | 200 | 200+ |
| Active Members (7d) | 10 | 25 | 40 | 60 | 75+ |
| Messages per Day | 10 | 25 | 50 | 75 | 100+ |
| Office Hours Attendees | 3 | 5 | 8 | 12 | 15+ |

**Active Member = posted or reacted in the last 7 days**

---

## Post-Launch

### Week 2-3 Actions

1. First AMA with core team
2. Share SDK v1.4.0 tutorial in #sdk-help
3. Highlight cool community projects in #show-and-tell
4. Create first GitHub issue labeled "good-first-issue" and share in #contributors

### Week 4 Actions

1. Host first community call (voice chat)
2. Share Q1 roadmap progress
3. Run poll: "What feature do you want most in Q2?"
4. Recognize top contributors with special role or shoutout

---

*Created: February 11, 2026*
*Last Updated: February 11, 2026*
