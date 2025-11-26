# GitHub Algorithm Optimization — OpenConductor

## How GitHub's Algorithm Works

GitHub ranks repositories based on:

1. **Stars** — Primary signal (weighted heavily)
2. **Forks** — Shows utility/collaboration
3. **Recent activity** — Commits, issues, PRs in last 30 days
4. **Topic relevance** — Matching search queries
5. **README quality** — Length, formatting, images
6. **Community health** — Contributing guide, code of conduct, templates
7. **Release cadence** — Regular releases = active project
8. **Engagement** — Issues, discussions, comments

---

## Immediate Settings to Change

### 1. Repository Description (One Line)

**Current:** Check what's there
**Recommended:**
```
The npm for AI agent tools — Install MCP servers without editing JSON. 220+ servers, one command.
```

**Why:** Keywords + value prop + social proof in one line. Shows up in search results.

---

### 2. Topics (Tags)

Go to: Repository → About → Topics (gear icon)

**Add these topics (in order of importance):**

```
mcp
mcp-server
claude
model-context-protocol
ai-tools
cli
anthropic
ai-agents
cursor
typescript
developer-tools
automation
```

**Why:** Topics are GitHub's primary search index. `mcp` and `claude` are high-intent searches right now.

**Limit:** 20 topics max, but 8-12 is optimal.

---

### 3. Website URL

```
https://openconductor.ai
```

**Why:** Drives traffic, looks professional, helps with SEO backlinks.

---

### 4. Social Preview Image

Go to: Settings → Social Preview → Upload

**Specs:**
- Size: 1280x640 pixels
- Format: PNG or JPG
- Max: 5MB

**What to include:**
- OpenConductor logo
- Tagline: "The npm for AI Agent Tools"
- Terminal screenshot showing `openconductor install github`
- Dark background (matches dev aesthetic)

**Why:** This appears in Twitter/Slack/Discord link previews. First impression.

---

### 5. Enable Features

Go to: Settings → General → Features

**Enable:**
- [x] Issues
- [x] Discussions (important!)
- [x] Projects (optional)
- [x] Wiki (optional, can disable)
- [x] Sponsorships (if you want donations)

**Why:** Discussions create community engagement signals. GitHub weighs this.

---

### 6. Default Branch

Ensure it's `main` (not `master`). Modern standard.

---

## Community Health Files

GitHub shows a "Community Standards" checklist. Complete it.

### Files to Add in Root or `.github/` folder:

#### README.md ✅
(You have the rewritten version)

#### LICENSE
```
MIT License

Copyright (c) 2025 OpenConductor

Permission is hereby granted, free of charge, to any person obtaining a copy...
```
**Why:** MIT is standard for dev tools. Required for community trust.

#### CODE_OF_CONDUCT.md
```markdown
# Code of Conduct

## Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

## Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

Examples of unacceptable behavior:
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Enforcement

Project maintainers are responsible for clarifying standards and may take appropriate action in response to unacceptable behavior.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/).
```

#### CONTRIBUTING.md
```markdown
# Contributing to OpenConductor

Thanks for your interest in contributing! 🎉

## Quick Start

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/openconductor.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`
5. Make your changes
6. Test locally: `npm run build && npm link`
7. Submit a PR

## Adding a New Server to the Registry

1. Open `registry/servers.json`
2. Add your server entry following the existing format
3. Test the install: `openconductor install your-server`
4. Submit a PR with:
   - Server name and description
   - Link to the source repo
   - Any required environment variables

## Adding a New Stack

1. Open `registry/stacks.json`
2. Add your stack with:
   - Name and description
   - List of included servers
   - System prompt
3. Submit a PR

## Code Style

- TypeScript
- Prettier for formatting
- ESLint for linting
- Run `npm run lint` before submitting

## Questions?

Open a Discussion or Issue. We're friendly!
```

#### SECURITY.md
```markdown
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing:

**security@openconductor.ai**

Please do NOT open a public issue for security vulnerabilities.

## What We Consider Security Issues

- Code injection vulnerabilities
- Path traversal in file operations
- Malicious server submissions to the registry
- API key exposure

## Response Time

We aim to respond to security reports within 48 hours.

## Recognition

We appreciate responsible disclosure and will credit reporters in our changelog (unless you prefer to remain anonymous).
```

#### .github/ISSUE_TEMPLATE/bug_report.md
```markdown
---
name: Bug Report
about: Something isn't working
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Run '...'
2. See error

**Expected behavior**
What you expected to happen.

**Environment**
- OS: [e.g., macOS 14.0, Windows 11, Ubuntu 22.04]
- CLI Version: [run `openconductor --version`]
- Client: [Claude Desktop, Cursor, Cline, Windsurf]
- Node version: [run `node --version`]

**Error output**
```
Paste any error messages here
```

**Additional context**
Anything else that might help.
```

#### .github/ISSUE_TEMPLATE/feature_request.md
```markdown
---
name: Feature Request
about: Suggest an idea
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is this related to a problem?**
A clear description of the problem. Ex. I'm frustrated when...

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Any other context, screenshots, or examples.
```

#### .github/ISSUE_TEMPLATE/server_request.md
```markdown
---
name: Server Request
about: Request a new MCP server be added to the registry
title: '[SERVER] '
labels: server-request
assignees: ''
---

**Server Name**
The name of the MCP server.

**GitHub URL**
Link to the server's repository.

**Description**
What does this server do?

**Why should it be added?**
Why would this be useful for OpenConductor users?

**Have you tested it?**
Have you personally used this server? Did it work?
```

#### .github/PULL_REQUEST_TEMPLATE.md
```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] New server in registry
- [ ] New stack
- [ ] Documentation
- [ ] Other (describe)

## Testing

How did you test this?

## Checklist

- [ ] I've tested my changes locally
- [ ] I've updated documentation if needed
- [ ] I've followed the code style guidelines
- [ ] My changes don't break existing functionality
```

---

## Release Strategy

GitHub weighs release activity. Here's how to do it right:

### Semantic Versioning
```
MAJOR.MINOR.PATCH
1.0.0 → 1.0.1 (bug fix)
1.0.1 → 1.1.0 (new feature)
1.1.0 → 2.0.0 (breaking change)
```

### Release Cadence
- **Weekly:** Bug fixes and new servers
- **Bi-weekly:** New features
- **Monthly:** Major improvements

### Creating a Release

1. Update `package.json` version
2. Commit: `git commit -m "chore: bump version to x.x.x"`
3. Tag: `git tag vx.x.x`
4. Push: `git push && git push --tags`
5. Go to GitHub → Releases → "Draft new release"
6. Select tag, write release notes

### Release Notes Template
```markdown
## What's New

### ✨ Features
- Added 15 new servers to registry
- New `coder` stack with enhanced system prompt

### 🐛 Bug Fixes
- Fixed config detection on Windows
- Resolved JSON parsing edge case

### 📦 New Servers
- `notion` - Notion API integration
- `linear` - Linear project management
- `figma` - Figma design access

### 🔧 Improvements
- Faster server installation
- Better error messages

---

**Full Changelog:** https://github.com/epicmotionSD/openconductor/compare/v1.0.0...v1.1.0
```

---

## README Optimization for Algorithm

GitHub's search indexes README content. Optimize for:

### Keywords to Include Naturally
```
MCP server
Model Context Protocol
Claude Desktop
Cursor
AI tools
AI agents
CLI
developer tools
one command
no config
JSON
typescript
```

### Badges (Top of README)

```markdown
[![npm version](https://img.shields.io/npm/v/@openconductor/cli.svg)](https://www.npmjs.com/package/@openconductor/cli)
[![npm downloads](https://img.shields.io/npm/dw/@openconductor/cli.svg)](https://www.npmjs.com/package/@openconductor/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/epicmotionSD/openconductor.svg)](https://github.com/epicmotionSD/openconductor/stargazers)
```

### Structure That Ranks Well

1. **Logo/Banner** — Visual hook
2. **Badges** — Social proof
3. **One-liner** — Immediate value prop
4. **Quick Start** — Within first scroll
5. **Demo GIF** — Shows, doesn't tell
6. **Features** — Scannable
7. **Installation** — Copy-paste ready
8. **Usage examples** — Real commands
9. **Contributing** — Shows community
10. **License** — Trust signal

---

## Engagement Signals

GitHub tracks these for ranking:

### Stars ⭐
- Ask users to star if they find it useful
- Add to README: "If this helps you, consider starring the repo!"
- Tweet about milestones (100 stars, 500 stars)

### Watch 👁️
- Enable Discussions to give people a reason to watch
- Post updates in Discussions, not just releases

### Forks 🍴
- Make contributing easy
- Good first issues labeled
- Clear CONTRIBUTING.md

### Issues 🎫
- Respond quickly (within 24 hours)
- Label issues properly
- Close stale issues
- Thank reporters

### Discussions 💬
- Enable GitHub Discussions
- Seed with initial threads:
  - "Introduce yourself"
  - "What servers do you want?"
  - "Show what you've built"
  - "Questions & Help"

### Pull Requests
- Review quickly
- Be welcoming to first-time contributors
- Merge good PRs fast

---

## GitHub Actions (CI/CD)

Having CI shows the project is maintained. Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Test
        run: npm test
```

**Why:** Green checkmarks on PRs look professional. Shows active maintenance.

---

## Sponsorship (Optional)

Enable GitHub Sponsors for additional engagement:

1. Go to Settings → Sponsors
2. Set up tiers:
   - $5/month — Thanks + name in README
   - $25/month — Priority support
   - $100/month — Logo in README

**Why:** Even without sponsors, having it enabled shows legitimacy.

---

## Quick Checklist

### Immediate (Today)
- [ ] Update repository description
- [ ] Add all 12 topics
- [ ] Set website URL
- [ ] Upload social preview image
- [ ] Enable Discussions

### This Week
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Add CONTRIBUTING.md
- [ ] Add SECURITY.md
- [ ] Add issue templates
- [ ] Add PR template
- [ ] Create first GitHub Release
- [ ] Add badges to README

### Ongoing
- [ ] Respond to issues within 24 hours
- [ ] Release weekly (even small updates)
- [ ] Post in Discussions
- [ ] Label "good first issue" for easy wins
- [ ] Thank contributors publicly

---

## Tracking Success

### GitHub Insights
Go to: Insights → Traffic

Track:
- **Unique visitors** — How many people see the repo
- **Clones** — How many download
- **Referring sites** — Where traffic comes from

### Milestones to Celebrate (Tweet These)
- 100 stars ⭐
- 500 stars ⭐⭐
- 1,000 stars ⭐⭐⭐
- 100 forks
- First external PR merged
- 1,000 npm weekly downloads

---

## Common Mistakes to Avoid

1. **Empty README** — Instant bounce
2. **No description** — Won't show in search
3. **No topics** — Won't be discovered
4. **No license** — Companies won't use it
5. **Stale issues** — Looks abandoned
6. **No releases** — Looks inactive
7. **Complex contribution process** — Kills community

---

## The Algorithm Game

GitHub's trending is calculated by:

```
Trending Score = (Stars in last 24h) + (Forks in last 24h) + (Activity bonus)
```

To trend on launch day:
1. Coordinate stars (ask supporters to star at the same time)
2. Get a few early forks
3. Have a PR merged that day
4. Post in Discussions
5. Respond to any issues immediately

---

Ship it 🚀
