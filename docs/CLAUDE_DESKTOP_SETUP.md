# Claude Desktop Complete Orchestration Setup

**Complete AI Agent Orchestration** — OpenConductor CLI + Registry MCP + Stacks + Custom Servers

**Status**: ✅ Full orchestration ready!
**Updated**: November 26, 2025

---

## 🎯 What is Complete Orchestration?

Complete orchestration means Claude can:
1. **Discover** MCP servers via the Registry MCP
2. **Install** servers automatically via OpenConductor CLI
3. **Use** all installed servers in workflows
4. **Switch** between specialized modes using Stacks
5. **Combine** multiple tools seamlessly

**Before**: Manual JSON editing, one server at a time
**After**: Claude orchestrates your entire AI agent toolchain

---

## 📦 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Claude Desktop (Your AI Agent)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ OpenConductor Registry MCP                       │  │
│  │ • Discover 220+ servers                          │  │
│  │ • Search by category/keyword                     │  │
│  │ • Get install commands                           │  │
│  │ • Browse stacks                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ OpenConductor CLI (via shell MCP)                │  │
│  │ • Install servers: openconductor install github  │  │
│  │ • Install stacks: openconductor stack install... │  │
│  │ • Manage config automatically                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Your Installed MCP Servers                       │  │
│  │ • GitHub, Postgres, Filesystem, etc.             │  │
│  │ • Memory, Brave Search, Google Drive             │  │
│  │ • 220+ servers available                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install OpenConductor CLI

```bash
npm install -g @openconductor/cli
```

### Step 2: Install Registry MCP Server

```bash
npm install -g @openconductor/mcp-registry
```

### Step 3: Configure Claude Desktop

**Edit**: `~/.config/Claude/claude_desktop_config.json` (Linux/macOS)
**Or**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "/home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/mcp-registry/dist/index.js"
      ]
    }
  }
}
```

**Note**: Adjust the path to match your Node.js installation:
```bash
# Find your path
which node
npm root -g
```

### Step 4: Restart Claude Desktop

**Important**: Completely quit and reopen Claude Desktop

---

## 🎨 Complete Orchestration Workflows

### Workflow 1: Discover → Install → Use

**You**: "I need to work with GitHub repositories. What MCP servers are available?"

**Claude** (uses Registry MCP):
- Searches for GitHub servers
- Shows `@modelcontextprotocol/server-github`
- Provides install command

**You**: "Install it for me"

**Claude** (uses shell/terminal access):
```bash
openconductor install github
```

**Result**: GitHub server auto-configured in Claude Desktop

**You**: "List all my GitHub repositories"

**Claude** (uses GitHub MCP):
- Connects to GitHub API
- Lists your repositories

### Workflow 2: Stack Installation → Specialized Mode

**You**: "I want to become a senior software engineer assistant"

**Claude** (uses Registry MCP to find stacks):
- Shows Coder Stack
- Explains what's included

**You**: "Install the Coder Stack"

**Claude** (uses CLI):
```bash
openconductor stack install coder
```

**Result**: Installs:
- GitHub MCP
- PostgreSQL MCP
- Filesystem MCP
- Memory MCP
- Brave Search MCP
- **+ System Prompt**: "Act as senior software engineer..."

**You**: "Debug this TypeScript error in my codebase"

**Claude** (now in Coder mode):
- Uses Filesystem to read code
- Uses GitHub to check issues
- Uses Memory to remember context
- Uses Brave Search for docs
- Provides expert debugging

### Workflow 3: Multi-Server Orchestration

**You**: "Research competitors for my SaaS product and save findings to a document"

**Claude** orchestrates:
1. **Brave Search MCP**: Searches for competitors
2. **Web Fetch MCP**: Scrapes competitor websites
3. **Memory MCP**: Stores findings
4. **Filesystem MCP**: Creates `competitor-analysis.md`
5. **GitHub MCP**: Commits document to repo

All in one conversation!

---

## 🎯 Recommended Stacks for Claude

### For Software Development
```bash
openconductor stack install coder
```
**Includes**: github, postgres, filesystem, memory, brave-search
**System Prompt**: Senior software engineer mode

### For Content Creation
```bash
openconductor stack install writer
```
**Includes**: brave-search, filesystem, memory, google-drive
**System Prompt**: Professional writer and researcher

### For General Use
```bash
openconductor stack install essential
```
**Includes**: filesystem, brave-search, memory
**System Prompt**: Helpful AI assistant

---

## 🔧 Manual Server Installation

If you want to add individual servers:

### Using OpenConductor CLI (Recommended)

```bash
# Search for servers
openconductor search postgres

# Install a server
openconductor install postgres

# Install multiple servers
openconductor install github slack notion

# List installed servers
openconductor status

# Remove a server
openconductor remove postgres
```

### Manual JSON Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_token_here"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_URL": "postgresql://user:pass@localhost:5432/db"
      }
    }
  }
}
```

---

## 🧪 Testing Complete Orchestration

### Test 1: Discovery + Installation Flow

**Query**:
```
Show me MCP servers for working with Google Sheets
```

**Expected**:
- Registry MCP lists relevant servers
- Shows install commands
- Claude can execute installation if authorized

### Test 2: Stack Workflow

**Query**:
```
Install the Coder Stack and help me refactor my TypeScript project
```

**Expected**:
- Shows Coder Stack details
- Installs all servers
- Applies system prompt
- Uses multiple tools (filesystem, memory, search)

### Test 3: Multi-Server Orchestration

**Query**:
```
Research the top 5 MCP servers by popularity, save the findings to a markdown file, and commit it to my GitHub repo
```

**Expected Claude workflow**:
1. Uses Registry MCP to get trending servers
2. Uses Filesystem MCP to create file
3. Uses GitHub MCP to commit and push

---

## 📊 Current Configuration

**Installed CLI**: @openconductor/cli@latest
**Installed MCP Servers**:
- `openconductor-registry` - Discover and search 220+ servers
- `sportintel` (optional) - Sports data and analytics

**Available via CLI**: 220+ servers
**Available Stacks**: coder, writer, essential

**Config Location**: `~/.config/Claude/claude_desktop_config.json`
**CLI Config**: `~/.openconductor/config.json`

---

## 🎬 Demo Script for Complete Orchestration

```
[Open Claude Desktop]

"Hi Claude, I need to set up a complete development environment."

"What MCP servers do you recommend for software development?"
[Claude uses Registry MCP, shows Coder Stack]

"Install the Coder Stack for me"
[Claude uses CLI to install]

"Now help me analyze my GitHub repository structure"
[Claude uses GitHub MCP]

"Create a project roadmap document based on the issues"
[Claude uses GitHub + Filesystem + Memory]

"Commit the roadmap to the repo"
[Claude uses GitHub MCP]

"Perfect! Now search for best practices in TypeScript architecture"
[Claude uses Brave Search MCP]

[Demo shows complete orchestration of 5+ tools]
```

---

## 🐛 Troubleshooting

### Registry MCP not working

**Check**:
```bash
# Verify installation
npm list -g @openconductor/mcp-registry

# Test directly
node /path/to/mcp-registry/dist/index.js

# Check API
curl https://api.openconductor.ai/v1/servers
```

### CLI commands fail

**Check**:
```bash
# Verify CLI installation
openconductor --version

# Check permissions
ls -la ~/.openconductor/

# Verify Claude Desktop config
cat ~/.config/Claude/claude_desktop_config.json
```

### Servers not loading

**Check**:
```bash
# Restart Claude Desktop (required!)
pkill Claude
# Reopen Claude Desktop

# Check logs
tail -f ~/.config/claude/logs/mcp*.log
```

---

## 🔄 Updating Everything

```bash
# Update CLI
npm update -g @openconductor/cli

# Update Registry MCP
npm update -g @openconductor/mcp-registry

# Update all installed servers
openconductor update

# Restart Claude Desktop
```

---

## 🎯 Advanced Orchestration Patterns

### Pattern 1: Research → Document → Share

1. **Research** (Brave Search + Registry MCP)
2. **Analyze** (Claude reasoning)
3. **Document** (Filesystem MCP)
4. **Store** (Memory MCP for future reference)
5. **Share** (GitHub MCP or Google Drive MCP)

### Pattern 2: Code → Test → Deploy

1. **Search docs** (Brave Search MCP)
2. **Write code** (Filesystem MCP)
3. **Query database** (Postgres MCP)
4. **Commit changes** (GitHub MCP)
5. **Remember context** (Memory MCP)

### Pattern 3: Data → Insight → Report

1. **Fetch data** (API MCPs)
2. **Store findings** (Memory MCP)
3. **Analyze** (Claude reasoning + multiple data sources)
4. **Generate report** (Filesystem MCP)
5. **Share** (Google Drive or GitHub MCP)

---

## 📈 Performance Expectations

| Component | Response Time | Cache Duration |
|-----------|--------------|----------------|
| Registry MCP | <500ms | 5 minutes |
| CLI Install | 5-10 seconds | N/A |
| GitHub MCP | <1000ms | Per request |
| Filesystem MCP | <100ms | N/A |
| Memory MCP | <200ms | Persistent |

---

## 🎓 Learning Resources

**OpenConductor Docs**: https://openconductor.ai
**MCP Protocol**: https://modelcontextprotocol.io
**GitHub Repository**: https://github.com/epicmotionSD/openconductor
**Community Discord**: https://discord.gg/Ya5TPWeS

---

## 🌟 Best Practices

1. **Start with a Stack** - Get 5-7 servers configured instantly
2. **Use Registry MCP** - Let Claude discover tools as needed
3. **Enable Memory MCP** - Claude remembers context across sessions
4. **Combine Tools** - The power is in orchestration, not individual servers
5. **Update Regularly** - New servers added weekly

---

## 🎉 Complete Orchestration Checklist

- [ ] OpenConductor CLI installed globally
- [ ] Registry MCP configured in Claude Desktop
- [ ] At least one Stack installed (Coder, Writer, or Essential)
- [ ] Claude Desktop restarted after configuration
- [ ] Tested discovery workflow (search for servers)
- [ ] Tested installation workflow (install a server)
- [ ] Tested multi-server workflow (combine 3+ tools)
- [ ] Memory MCP enabled (for persistent context)
- [ ] Filesystem MCP enabled (for file operations)

---

## 🚀 You're Ready!

With complete orchestration, Claude can:
- ✅ Discover any of 220+ MCP servers
- ✅ Install servers automatically
- ✅ Use multiple tools in complex workflows
- ✅ Switch between specialized modes (Stacks)
- ✅ Remember context across conversations
- ✅ Orchestrate your entire AI agent toolchain

**Welcome to the future of AI agent orchestration!** 🎊

---

**Questions?**
- GitHub Issues: https://github.com/epicmotionSD/openconductor/issues
- Discord Community: https://discord.gg/Ya5TPWeS
- Email: hello@openconductor.ai
