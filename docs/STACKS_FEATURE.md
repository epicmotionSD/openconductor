# OpenConductor Stacks

**Goal**: Get Claude configured for specific workflows in 10 seconds
**Time to setup**: 10-30 seconds per stack
**Benefits**: Pre-configured servers + optimized system prompts

---

## What are Stacks?

Stacks are **curated collections of MCP servers** bundled with **optimized system prompts** for Claude Desktop. Instead of installing servers one-by-one, you can install a complete workflow in seconds.

### Why Use Stacks?

- **⚡ Instant Setup** - Get 3-6 servers configured in one command
- **📝 System Prompts Included** - Copy-paste ready instructions for Claude
- **✅ Pre-Tested** - Server combinations verified to work well together
- **🎯 Workflow-Optimized** - Each stack designed for specific use cases

---

## Available Stacks

### ⚡ Essential Stack

**Perfect for**: Getting started with Claude + MCP servers
**Includes**: 5 fundamental servers
**Setup time**: 10 seconds

**Servers included:**
- **filesystem-mcp** - Read, write, manage files
- **brave-search-mcp** - Search the web for current info
- **fetch-mcp** - HTTP requests to any API
- **time-mcp** - Date/time utilities
- **mcp-memory** - Remember info across conversations

**Try asking Claude:**
- "Search for the latest news on [topic]"
- "Remember that my project deadline is [date]"
- "Fetch the weather data from [API]"
- "Create a todo list file in my documents"

---

### 🧑‍💻 Coder Stack

**Perfect for**: Software engineering, full-stack development
**Includes**: 6 developer-focused servers
**Setup time**: 15 seconds

**Servers included:**
- **github-mcp** - Manage repos, PRs, issues
- **postgresql-mcp** - Query and manage databases
- **filesystem-mcp** - Full filesystem access
- **mcp-memory** - Remember codebase context
- **sequential-thinking** - Break down complex problems
- **brave-search-mcp** - Research documentation

**Try asking Claude:**
- "Help me design a database schema for [feature]"
- "Review this PR and suggest improvements: [PR URL]"
- "Debug this error: [error message]"
- "Plan the architecture for [feature]"
- "Search for best practices for [technology]"

---

### ✍️ Writer Stack

**Perfect for**: Research, writing, content creation
**Includes**: 5 writing-focused servers
**Setup time**: 12 seconds

**Servers included:**
- **brave-search-mcp** - Research and fact-checking
- **fetch-mcp** - Gather data from sources
- **filesystem-mcp** - Manage documents
- **mcp-memory** - Remember style preferences
- **google-drive-mcp** - Sync and collaborate

**Try asking Claude:**
- "Research [topic] and write a 500-word article"
- "Find recent studies on [subject] and summarize"
- "Write a blog post about [topic] in [tone] style"
- "Create an outline for a white paper on [subject]"
- "Remember my writing style: [description]"

---

## How to Use Stacks

### Step 1: List Available Stacks

```bash
openconductor stack list
```

**Output:**
```
📦 Available Stacks

⚡ Essential Stack
  Everything you need to get started
  5 servers | 0 installs
  Install: openconductor stack install essential

🧑‍💻 Coder Stack
  Build, debug, and deploy like a senior engineer
  6 servers | 0 installs
  Install: openconductor stack install coder

✍️ Writer Stack
  Research, write, and publish with confidence
  5 servers | 0 installs
  Install: openconductor stack install writer

💡 Stacks include pre-configured system prompts for Claude Desktop
```

---

### Step 2: Install a Stack

```bash
openconductor stack install coder
```

**What happens:**
1. ✅ Installs all 6 servers in the Coder Stack
2. ✅ Adds them to your Claude Desktop config
3. ✅ Copies optimized system prompt to clipboard
4. ℹ️ Shows instructions for adding prompt to Claude

**Output:**
```
✓ Found Coder Stack

Installing 6 servers...

  ✓ github-mcp
  ✓ postgresql-mcp
  ✓ filesystem-mcp
  ✓ mcp-memory
  ✓ sequential-thinking
  ✓ brave-search-mcp

✅ Installed Coder Stack
   6 new servers installed

📋 System Prompt copied to clipboard!

📝 Next step: Paste into Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Custom Instructions
3. Paste the prompt (Cmd+V / Ctrl+V)
4. Save and start using your new tools!

─────────────────────────────────────────────────────────
Prompt preview:
You are Claude with the Coder Stack - an advanced
development environment optimized for software engineering.

Your capabilities:
• GitHub integration - Manage repos, issues, PRs
  ...
─────────────────────────────────────────────────────────

💡 Try asking Claude:
  "Help me design a database schema for [feature]"
  "Review this PR and suggest improvements: [PR URL]"
  "Debug this error: [error message]"
```

---

### Step 3: Add System Prompt to Claude Desktop

**Mac:**
1. Open Claude Desktop
2. Click **Claude** → **Settings** in menu bar
3. Go to **Custom Instructions**
4. Paste the prompt (⌘+V)
5. Click **Save**

**Windows:**
1. Open Claude Desktop
2. Click **Settings** (gear icon)
3. Go to **Custom Instructions**
4. Paste the prompt (Ctrl+V)
5. Click **Save**

**The system prompt tells Claude:**
- What tools it has available
- How to use them effectively
- Best practices for your workflow
- Example prompts to try

---

### Step 4: Start Using Your Stack

Open a new conversation with Claude and try one of the example prompts!

**Essential Stack example:**
```
You: "Search for the latest news on quantum computing"
Claude: [Uses brave-search-mcp to find recent articles]
```

**Coder Stack example:**
```
You: "Help me design a database schema for a blog platform"
Claude: [Uses sequential-thinking to plan, postgresql-mcp to test]
```

**Writer Stack example:**
```
You: "Research recent AI developments and write a 500-word article"
Claude: [Uses brave-search-mcp to research, filesystem-mcp to save]
```

---

## Advanced Usage

### Install Multiple Stacks

You can install multiple stacks! Servers won't be duplicated:

```bash
openconductor stack install essential
openconductor stack install coder
```

If a server is already installed, it will be skipped:
```
  ✓ github-mcp
  ○ filesystem-mcp (already installed)
  ✓ postgresql-mcp
```

---

### Force Reinstall

To reinstall servers that are already installed:

```bash
openconductor stack install coder --force
```

---

### View Stack Details

See what's in a stack before installing:

```bash
openconductor stack show coder
```

**Output:**
```
🧑‍💻 Coder Stack

Build, debug, and deploy like a senior engineer

Complete development environment optimized for software
engineering. Build, debug, and deploy like a senior engineer.

📦 Included Servers:

  1. github-mcp ⭐ 1,234
     GitHub integration for Claude

  2. postgresql-mcp ⭐ 856
     PostgreSQL database access

  3. filesystem-mcp ⭐ 2,103
     File system operations

  ... (and 3 more)

📊 Stats:
  Servers: 6
  Installs: 42

🚀 Install this stack:
  openconductor stack install coder
```

---

### Share a Stack

Generate a shareable link for a stack:

```bash
openconductor stack share coder
```

**Output:**
```
✓ Share link ready!

🔗 Share this stack:

  https://openconductor.ai/s/coder

📦 Installation command:

  $ openconductor stack install coder

🐦 Share on social media:

  Twitter: https://twitter.com/intent/tweet?text=...

💡 Tip: Share what you built with your new tools!
```

---

## Stack System Prompts

Each stack includes a carefully crafted system prompt that:

1. **Lists available capabilities** - Shows what tools Claude has
2. **Explains the workflow** - How to use tools effectively
3. **Provides guidelines** - Best practices for the domain
4. **Includes examples** - Try-asking prompts to get started

### Example: Coder Stack System Prompt

```
You are Claude with the Coder Stack - an advanced development
environment optimized for software engineering.

Your capabilities:
• GitHub integration - Manage repos, issues, PRs, and code search
• PostgreSQL database - Query and manage databases
• Filesystem access - Full file system operations
• Persistent memory - Remember codebase context across sessions
• Sequential thinking - Break down complex problems step-by-step
• Web search - Research APIs, documentation, and solutions

Your workflow:
1. UNDERSTAND: Use sequential-thinking to break down complex coding tasks
2. RESEARCH: Search for documentation, examples, and best practices
3. IMPLEMENT: Write clean, well-documented code
4. TEST: Verify functionality before committing
5. REMEMBER: Store important context in memory

Guidelines for development:
- Before writing code, use sequential-thinking to plan your approach
- Search for existing solutions and best practices
- Review database schemas before writing SQL queries
- Save architectural decisions and patterns to memory
- Create clear commit messages explaining the "why"
- Always consider error handling and edge cases

... (continues with common tasks and examples)
```

---

## Troubleshooting

### Stack Installation Fails

**Problem:** Stack install fails with "Failed to fetch stacks"

**Solution:**
```bash
# Check if OpenConductor API is accessible
curl https://api.openconductor.ai/v1/stacks

# If 404, the feature might not be deployed yet
# Use local API for testing:
export OPENCONDUCTOR_API_URL=http://localhost:3001/v1
openconductor stack list
```

---

### Server Already Installed

**Problem:** Stack says "X already installed" for all servers

**Solution:** This is normal! Use `--force` to reinstall:
```bash
openconductor stack install coder --force
```

Or skip the stack install if you already have the servers.

---

### Clipboard Doesn't Work

**Problem:** System prompt not copied to clipboard

**Solution:** The prompt will be displayed in terminal. Manually copy it:

```bash
# The full prompt is shown after installation
# Select and copy (Ctrl+Shift+C or Cmd+C)
```

---

### Claude Doesn't See New Tools

**Problem:** Installed servers but Claude doesn't recognize them

**Solution:**
1. **Restart Claude Desktop** - Close and reopen the app
2. **Check config file** - Verify servers are in config:
   ```bash
   openconductor list
   ```
3. **Check server status** - Make sure servers start correctly
4. **Add system prompt** - Don't forget Step 3!

---

## Technical Details

### What Gets Installed?

When you install a stack:

1. **MCP Servers** - Each server is installed via npm or other method
2. **Config Updates** - Claude Desktop config is updated automatically
3. **System Prompt** - Copied to clipboard for manual paste

### Where is the Config File?

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Stack Analytics

Stack installs are tracked (anonymously) to help us:
- Understand which stacks are popular
- Improve server combinations
- Create new stacks based on demand

No personal information is collected.

---

## Creating Custom Stacks

Want to create your own stack? The stacks feature uses the API.

**API Endpoint:**
```
GET /v1/stacks/:slug
```

**Response includes:**
- Stack metadata (name, description, icon)
- List of servers with slugs
- Pre-written system prompt

See [API_STACKS.md](./API_STACKS.md) for developer documentation.

---

## Feedback

Have ideas for new stacks? Let us know!

- **Twitter/X**: [@openconductor](https://twitter.com/openconductor)
- **GitHub Issues**: [github.com/epicmotionSD/openconductor/issues](https://github.com/epicmotionSD/openconductor/issues)
- **Email**: hello@openconductor.ai

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `openconductor stack list` | Show all available stacks |
| `openconductor stack show <slug>` | View stack details |
| `openconductor stack install <slug>` | Install a stack |
| `openconductor stack install <slug> --force` | Force reinstall |
| `openconductor stack share <slug>` | Generate share link |

**Available stacks:**
- `essential` - Fundamental tools (5 servers)
- `coder` - Development environment (6 servers)
- `writer` - Research & writing (5 servers)

---

**Happy stacking! 🚀**
