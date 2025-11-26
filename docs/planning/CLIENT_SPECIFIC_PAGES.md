# Client-Specific Landing Pages Strategy

**Date**: November 23, 2025
**Status**: Future enhancement (post-launch)

---

## Overview

The main homepage now uses **universal value prop** positioning OpenConductor as platform-agnostic:
- "The npm for AI agent tools"
- "Works with Claude, Cursor, Cline, and more"

However, we should create **client-specific pages** for targeted marketing:

---

## Proposed Pages

### 1. `/claude` - Claude Desktop Users

**URL**: `https://openconductor.ai/claude`

**Headline**:
```
Set up Claude Desktop for
Coding, Writing, or Data
in 10 Seconds
```

**Value Props**:
- Install MCP servers without editing `claude_desktop_config.json`
- Pre-configured stacks with system prompts
- From 30 minutes of JSON hell to 10 seconds
- Works with Claude Desktop on macOS, Windows, Linux

**CTA**: "Install Coder Stack for Claude"

**Content**:
- Before/After comparison (manual JSON vs one command)
- Stack showcase (Coder, Writer, Essential)
- System prompts explained
- Screenshots of Claude Desktop integration

---

### 2. `/cursor` - Cursor IDE Users

**URL**: `https://openconductor.ai/cursor`

**Headline**:
```
Add AI Agents to Cursor
Without the Config Hell
```

**Value Props**:
- Install MCP tools that work with Cursor's AI features
- Database access, file operations, API integrations
- One command installation
- Developer-first experience

**CTA**: "Get Started with Cursor"

**Content**:
- How MCP servers enhance Cursor
- Developer-focused stacks
- Terminal-based workflow
- Code examples and demos

---

### 3. `/vscode` - VS Code Users

**URL**: `https://openconductor.ai/vscode`

**Headline**:
```
Supercharge VS Code
with AI Agent Tools
```

**Value Props**:
- MCP servers that integrate with VS Code AI extensions
- Works with Continue.dev, Cody, and other AI extensions
- Professional developer tooling
- Open source and extensible

**CTA**: "Install for VS Code"

**Content**:
- Compatible extensions listed
- Integration guides
- Developer-focused use cases
- Community examples

---

### 4. `/cline` - Cline Users

**URL**: `https://openconductor.ai/cline`

**Headline**:
```
Give Cline More Tools
in One Command
```

**Value Props**:
- Expand Cline's capabilities with MCP servers
- Database, filesystem, API access
- Install without config editing
- Community-verified tools

**CTA**: "Add Tools to Cline"

---

## SEO Strategy

Each page should:
- Target client-specific keywords (e.g., "Claude Desktop MCP servers")
- Include client logo/branding (with proper attribution)
- Have client-specific meta tags
- Rank for "{client} + MCP servers/tools/setup"

**Example Keywords**:
- Claude: "Claude Desktop MCP servers", "Claude Desktop setup", "Claude Desktop tools"
- Cursor: "Cursor AI tools", "Cursor MCP integration", "Cursor AI agents"
- VS Code: "VS Code AI tools", "VS Code MCP servers", "Continue.dev tools"

---

## Technical Implementation

### URL Structure
```
/claude     → Claude Desktop landing page
/cursor     → Cursor IDE landing page
/vscode     → VS Code landing page
/cline      → Cline landing page
```

### Components Needed
```tsx
// Shared component with props
<ClientLandingPage
  client="claude"
  headline="Set up Claude Desktop..."
  features={claudeFeatures}
  stacks={["coder", "writer", "essential"]}
  ctaText="Install Coder Stack for Claude"
/>
```

### Meta Tags (example for Claude)
```tsx
export const metadata = {
  title: "OpenConductor for Claude Desktop - Install MCP Servers in 10 Seconds",
  description: "Set up Claude Desktop with pre-configured stacks. Install MCP servers without editing JSON. Coder, Writer, and Essential stacks with system prompts.",
  keywords: ["Claude Desktop", "MCP servers", "Claude setup", "Claude tools", "system prompts"],
  openGraph: {
    title: "OpenConductor for Claude Desktop",
    description: "Install MCP servers without the JSON hell. Pre-configured stacks in 10 seconds.",
    images: ["/og-claude.png"],
  }
}
```

---

## Content Structure

Each page should have:

1. **Hero Section**
   - Client-specific headline
   - Client-specific value prop
   - Primary CTA

2. **Problem Statement**
   - Pain points specific to that client
   - Manual setup complexity
   - Time wasted on configuration

3. **Solution Demo**
   - Terminal demo showing installation
   - Before/After comparison
   - Client-specific config file shown

4. **Features Grid**
   - Features relevant to that client
   - Integration points
   - Supported tools

5. **Stack Showcase** (if relevant)
   - Pre-configured workflows
   - System prompts explained
   - Use case examples

6. **Testimonials** (future)
   - Users of that specific client
   - Real experiences
   - GitHub stars/social proof

7. **FAQ**
   - Client-specific questions
   - Integration details
   - Troubleshooting

8. **CTA**
   - Get started with client
   - Link to docs
   - Link to discover page

---

## Priority

**Post-launch priority:**

1. **P0** (Launch first): Universal homepage ✅ (Done)
2. **P1** (Week 2-3): `/claude` page (biggest user base)
3. **P2** (Week 4): `/cursor` page (developer-focused)
4. **P3** (Month 2): `/vscode` and `/cline` pages

---

## Benefits

**Why client-specific pages matter:**

1. **Better SEO**: Rank for "{client} + tools/setup" searches
2. **Higher Conversion**: Tailored messaging resonates more
3. **Clear Value**: Users see exactly how it helps their workflow
4. **Ad Targeting**: Can run ads targeting specific client users
5. **Partnerships**: Show each client you support them specifically

---

## Example Copy (Claude Page)

```markdown
# Set up Claude Desktop for Coding in 10 Seconds

Stop editing `claude_desktop_config.json` manually.

OpenConductor installs all the MCP servers you need + gives Claude
a specialized persona with system prompts.

## Before OpenConductor (30+ minutes)

1. Find MCP server packages on GitHub
2. npm install each one globally
3. Open ~/Library/Application Support/Claude/claude_desktop_config.json
4. Add complex JSON configuration for each server
5. Deal with syntax errors, port conflicts
6. Restart Claude Desktop
7. Debug why servers don't work
8. Repeat for each server...

## After OpenConductor (10 seconds)

```bash
npm install -g @openconductor/cli
openconductor stack install coder
# ✓ 5 MCP servers installed
# ✓ System prompt copied to clipboard
# ✓ Paste into Claude Desktop → Start coding
```

Done. Claude is now a senior engineer.

## What You Get

**Coder Stack** (5 servers):
- GitHub integration (manage repos, PRs, issues)
- Filesystem access (read/write code files)
- PostgreSQL (query databases)
- Memory (remember context across chats)
- Brave Search (look up documentation)

**System Prompt**: Turns Claude into a senior engineer who can:
- Review your code and suggest improvements
- Debug errors and explain solutions
- Write production-ready code
- Follow best practices and patterns

## Works on All Platforms

- ✅ macOS (M1/M2/Intel)
- ✅ Windows (WSL2 + native)
- ✅ Linux (all distros)

## Free & Open Source

MIT licensed. No limits. No tracking. Built for developers.

[Install Coder Stack] [Browse All Servers]
```

---

## Implementation Timeline

**After Product Hunt launch:**

**Week 1-2**: Focus on core product, bug fixes, user feedback

**Week 2-3**: Create `/claude` page
- Design mockups
- Write copy
- Create Claude-specific assets
- SEO optimization
- Deploy and test

**Week 4**: Create `/cursor` page
- Similar process
- Developer-focused messaging

**Month 2**: Additional pages as needed

---

## Analytics to Track

For each client-specific page:
- **Traffic**: Organic search, referrals, direct
- **Conversion**: Click "Get Started" → Install CLI
- **Keywords**: What searches bring users
- **Bounce Rate**: Are users staying?
- **Time on Page**: Are they reading?

Compare performance across pages to optimize.

---

## Future Enhancements

**Once pages are live:**

1. **Client-specific badges** in GitHub READMEs
   - "Install for Claude Desktop"
   - "Works with Cursor"
   - etc.

2. **Client-specific analytics** for MCP developers
   - "Your server was installed by 100 Claude users"
   - "50 Cursor developers use your tool"

3. **Client-specific stacks**
   - "Cursor Developer Stack"
   - "VS Code AI Stack"
   - etc.

4. **Partnership outreach** to each client
   - Anthropic (Claude)
   - Anysphere (Cursor)
   - Microsoft (VS Code)
   - Show them the dedicated page

---

## Notes

- Homepage stays universal (current state) ✅
- Client pages are for targeted acquisition
- All pages link back to core /discover and /install
- Consistent branding across all pages
- Each page is standalone but part of ecosystem

---

**Status**: Planned for post-launch
**Owner**: To be assigned
**Target**: Week 2-3 post-launch for `/claude` page
