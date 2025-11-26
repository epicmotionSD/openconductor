# OpenConductor Starter Packs

## Overview
Curated collections of MCP servers for specific use cases. Makes onboarding instant and shareable.

## Core Starter Packs

### 1. 🧑‍💻 Coder Stack
**Tagline**: "Turn Claude into your senior developer"

**Servers**:
- `github-mcp` - GitHub repo management, PRs, issues
- `filesystem-mcp` - Secure file operations
- `postgresql-mcp` - Database queries and migrations
- `docker-mcp` - Container management
- `aws-mcp` - AWS infrastructure
- `openmemory` - Remember your codebase context

**Use Case**: Full-stack development, DevOps automation

**Install Command**:
\`\`\`bash
openconductor install --stack coder
# or
openconductor stack install coder
\`\`\`

---

### 2. ✍️ Writer Stack
**Tagline**: "Claude as your research assistant and editor"

**Servers**:
- `openmemory` - Long-term memory for projects
- `brave-search-mcp` - Web research
- `perplexity` - AI-powered search
- `notion-mcp` - Note-taking and docs
- `google-drive-mcp` - Document management
- `wordpress-mcp` - Publishing to WordPress

**Use Case**: Content creation, research, blogging

**Install Command**:
\`\`\`bash
openconductor install --stack writer
\`\`\`

---

### 3. 📊 Data Analyst Stack
**Tagline**: "Claude for data science and analytics"

**Servers**:
- `snowflake-mcp` - Data warehouse queries
- `bigquery-mcp` - Google BigQuery analytics
- `postgresql-mcp` - SQL database access
- `databricks-mcp` - Spark and ML workflows
- `datadog` - Monitoring and metrics
- `openmemory` - Remember analysis context

**Use Case**: Data analysis, BI, ML workflows

**Install Command**:
\`\`\`bash
openconductor install --stack data-analyst
\`\`\`

---

### 4. 🎨 Designer Stack
**Tagline**: "AI design workflow automation"

**Servers**:
- `figma-mcp` - Design file access
- `cloudinary` - Image optimization
- `github-mcp` - Design system versioning
- `notion-mcp` - Design docs
- `slack-mcp` - Team collaboration

**Use Case**: Design systems, creative workflows

**Install Command**:
\`\`\`bash
openconductor install --stack designer
\`\`\`

---

### 5. 📈 Entrepreneur Stack
**Tagline**: "Run your startup with AI"

**Servers**:
- `github-mcp` - Code and project management
- `stripe-mcp` - Payment processing
- `slack-mcp` - Team communication
- `notion-mcp` - Documentation
- `google-drive-mcp` - File storage
- `mailgun-mcp` - Email automation
- `plaid-mcp` - Financial data
- `openmemory` - Business context

**Use Case**: Startup operations, automation

**Install Command**:
\`\`\`bash
openconductor install --stack entrepreneur
\`\`\`

---

### 6. 🔬 Researcher Stack
**Tagline**: "Academic and scientific research"

**Servers**:
- `arxiv-mcp` - Academic papers
- `pubmed-mcp` - Medical research
- `semantic-scholar-mcp` - Citation graphs
- `wolfram-alpha-mcp` - Computational knowledge
- `openmemory` - Research notes
- `notion-mcp` - Paper organization

**Use Case**: Academic research, literature reviews

**Install Command**:
\`\`\`bash
openconductor install --stack researcher
\`\`\`

---

### 7. 💼 Business Intelligence Stack
**Tagline**: "Data-driven decision making"

**Servers**:
- `snowflake-mcp` - Data warehouse
- `bigquery-mcp` - Analytics
- `datadog` - Monitoring
- `stripe-mcp` - Revenue data
- `google-sheets-mcp` - Reporting
- `slack-mcp` - Alerts and sharing

**Use Case**: Business analytics, dashboards

**Install Command**:
\`\`\`bash
openconductor install --stack business-intelligence
\`\`\`

---

### 8. 🎮 Essential Stack
**Tagline**: "The basics everyone needs"

**Servers**:
- `openmemory` - Long-term memory
- `filesystem-mcp` - File operations
- `brave-search-mcp` - Web search
- `github-mcp` - GitHub access

**Use Case**: General purpose, getting started

**Install Command**:
\`\`\`bash
openconductor install --stack essential
\`\`\`

---

## Implementation

### CLI Commands

\`\`\`bash
# List all stacks
openconductor stacks list

# View stack details
openconductor stack show coder

# Install a stack
openconductor stack install coder

# Create custom stack
openconductor stack create my-stack --add github-mcp postgresql-mcp

# Share custom stack
openconductor stack export my-stack > my-stack.json
openconductor stack import my-stack.json

# Install from URL (community sharing)
openconductor stack install https://openconductor.ai/stacks/coder
\`\`\`

### Web Interface

#### Stack Gallery Page (`/stacks`)
- Grid view of all stacks
- Filter by use case
- "1-click install" buttons
- Community-created stacks

#### Stack Detail Page (`/stacks/coder`)
- Full server list with descriptions
- Installation instructions
- Success stories / testimonials
- "Use this stack" CTA
- Share buttons (Twitter, LinkedIn)

### Data Structure

\`\`\`typescript
interface Stack {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  servers: string[]; // slugs
  category: 'development' | 'content' | 'data' | 'business' | 'research' | 'essential';
  author: 'openconductor' | 'community';
  featured: boolean;
  installs: number;
  likes: number;
  tags: string[];
}
\`\`\`

### Database Schema

\`\`\`sql
CREATE TABLE stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline TEXT,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50),
  author VARCHAR(50) DEFAULT 'openconductor',
  featured BOOLEAN DEFAULT false,
  installs INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stack_servers (
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (stack_id, server_id)
);

CREATE TABLE stack_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  user_id UUID, -- nullable, for anonymous tracking
  installed_at TIMESTAMP DEFAULT NOW(),
  platform VARCHAR(50),
  cli_version VARCHAR(50)
);
\`\`\`

## Virality Mechanisms

### 1. Social Sharing
After installing a stack:
\`\`\`
✅ Installed 6 servers from "Coder Stack"

💡 Share your setup:
📋 Copy shareable link: https://openconductor.ai/stacks/coder
🐦 Tweet: "Just set up Claude for coding with @openconductor's Coder Stack"
\`\`\`

### 2. Custom Stack Sharing
\`\`\`bash
$ openconductor stack export my-stack

✅ Stack exported to my-stack.json

📤 Share with others:
  openconductor stack import https://openconductor.ai/stacks/share/abc123

🔗 Share link: https://openconductor.ai/stacks/share/abc123
\`\`\`

### 3. "Built with OpenConductor" Badge
For social media posts:
\`\`\`
I automated my entire workflow with Claude using the Coder Stack from @openconductor

🔧 6 MCP servers installed in 10 seconds
✨ No config file editing
🚀 Instant AI development environment

Try it: https://openconductor.ai/stacks/coder
\`\`\`

## Marketing Angles

### Developer Marketing
- **Reddit**: "I built a CLI that sets up Claude for coding in 10 seconds"
- **Hacker News**: "Show HN: OpenConductor - npm for MCP servers with curated stacks"
- **Twitter**: "Stop editing claude_desktop_config.json. Use stacks instead."

### Content Marketing
- Blog: "How to Turn Claude into Your Senior Developer (Coder Stack)"
- YouTube: "Setting up Claude for Data Analysis in 60 seconds"
- Tutorial: "Building Your Custom AI Workflow with Stacks"

### Community Engagement
- Discord: "Share your custom stacks"
- GitHub: "Awesome MCP Stacks" repository
- Twitter: Weekly "Stack of the Week" spotlight

## Success Metrics

### Adoption
- % of users who install via stack vs individual servers
- Most popular stack by installs
- Stack completion rate (% who install all servers in stack)

### Sharing
- # of custom stacks created
- # of shared stack links clicked
- Social media mentions with stack links

### Retention
- Users who install 2+ stacks (power users)
- Users who create custom stacks (advocates)
- Stack-to-individual-server ratio

## Network Effect Loop

1. **User installs stack** → Fast onboarding
2. **User shares stack** → Brings friends
3. **User creates custom stack** → Adds value to platform
4. **Popular custom stacks** → Attract more users
5. **More users** → More stack creators
6. **More stacks** → More use cases covered
7. **Back to step 1**

## Monetization Potential (Future)

- **Pro Stacks**: Premium server collections ($9/mo)
- **Stack Analytics**: For stack creators to see adoption
- **Private Stacks**: Teams can create/share internal stacks
- **Stack Marketplace**: Community can sell curated stacks

## Immediate Action Items

1. **This Week**:
   - Build `openconductor stack install coder` command
   - Create landing page at `/stacks`
   - Seed 3 core stacks (Essential, Coder, Writer)

2. **Next Week**:
   - Launch on Twitter/Reddit with demo video
   - Add "Share your setup" prompts to CLI
   - Create sharable stack links

3. **Month 1**:
   - Add 5 more stacks (Data, Designer, Entrepreneur, Researcher, BI)
   - Enable community stack creation
   - Track viral coefficient (users referred per user)

---

**Bottom Line**: Stacks transform OpenConductor from "another package manager" to "the fastest way to set up AI workflows." Users will share stacks, not individual servers.
