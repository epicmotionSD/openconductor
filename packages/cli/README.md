# OpenConductor CLI

> **Professional MCP Server Management**

The OpenConductor CLI is a powerful command-line tool for discovering, installing, and managing MCP (Model Context Protocol) servers. It provides a seamless workflow for AI agent developers to enhance their systems with production-ready capabilities.

## 🚀 Quick Start

```bash
# Install globally
npm install -g @openconductor/cli

# Discover MCP servers
openconductor discover "memory"

# Install a server
openconductor install mcp-memory

# List installed servers
openconductor list
```

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @openconductor/cli
```

### From Source (Current Method)

```bash
git clone https://github.com/epicmotionSD/openconductor.git
cd openconductor/packages/cli
pnpm install
pnpm link --global
```

### Verify Installation

```bash
openconductor --version
openconductor --help
```

## 🔧 Commands

### `openconductor discover [query]`

Search for MCP servers in the registry.

```bash
# Browse all servers
openconductor discover

# Search for memory servers  
openconductor discover "memory"

# Filter by category
openconductor discover --category database

# Filter by tags
openconductor discover --tags memory,semantic

# Show only verified servers
openconductor discover --verified

# Limit results
openconductor discover memory --limit 5
```

**Options:**
- `-c, --category <category>` - Filter by category (memory, filesystem, database, api, search, communication, monitoring, development, custom)
- `-t, --tags <tags...>` - Filter by tags
- `--verified` - Show only verified servers
- `-l, --limit <number>` - Number of results (max 50, default 10)

### `openconductor install <server>`

Install an MCP server to your Claude Desktop configuration.

```bash
# Basic installation
openconductor install mcp-memory

# Custom config file location
openconductor install postgres --config ./my-config.json

# Specify custom port
openconductor install github --port 8090

# Skip confirmation prompts
openconductor install filesystem --yes

# Preview changes without installing
openconductor install slack --dry-run

# Force reinstall if already exists
openconductor install mcp-memory --force
```

**Options:**
- `--config <path>` - Custom config file path
- `--port <port>` - Custom port number (1024-65535)
- `--force` - Force overwrite if server already exists
- `--dry-run` - Show what would be installed without making changes
- `-y, --yes` - Skip confirmation prompts

### `openconductor list`

List all installed MCP servers with status information.

```bash
# List all installed servers
openconductor list

# Use custom config file
openconductor list --config ./my-config.json

# Output as JSON
openconductor list --format json
```

**Options:**
- `--config <path>` - Custom config file path
- `--format <format>` - Output format (table, json)

### `openconductor remove <server>`

Remove an installed MCP server.

```bash
# Remove a server
openconductor remove mcp-memory

# Skip confirmation
openconductor remove postgres --yes

# Use custom config file
openconductor remove github --config ./my-config.json
```

**Options:**
- `--config <path>` - Custom config file path
- `-y, --yes` - Skip confirmation prompts

### `openconductor update [server]`

Update installed MCP servers to their latest versions.

```bash
# Update all servers
openconductor update

# Update specific server
openconductor update mcp-memory

# Use custom config file
openconductor update --config ./my-config.json
```

**Options:**
- `--config <path>` - Custom config file path

### `openconductor init`

Initialize OpenConductor configuration with setup wizard.

```bash
# Interactive setup
openconductor init

# Force overwrite existing config
openconductor init --force
```

**Options:**
- `-f, --force` - Overwrite existing configuration

### `openconductor analytics`

Manage anonymous analytics preferences.

```bash
# Show analytics information
openconductor analytics

# Enable analytics
openconductor analytics --enable

# Disable analytics
openconductor analytics --disable
```

**Options:**
- `--enable` - Enable anonymous usage tracking
- `--disable` - Disable anonymous usage tracking

### `openconductor stack list`

List all available curated stacks (collections of servers with system prompts).

```bash
# Show all available stacks
openconductor stack list
```

**Output:**

```text
📦 Available Stacks

⚡ Essential Stack
  Everything you need to get started
  5 servers | 103 installs
  Install: openconductor stack install essential

🧑‍💻 Coder Stack
  Build, debug, and deploy like a senior engineer
  6 servers | 42 installs
  Install: openconductor stack install coder

💡 Stacks include pre-configured system prompts for Claude Desktop
```

### `openconductor stack install <slug>`

Install a complete stack (all servers + system prompt).

```bash
# Install the Coder Stack
openconductor stack install coder

# Force reinstall servers
openconductor stack install essential --force
```

**What happens:**

1. Installs all servers in the stack
2. Adds them to Claude Desktop config
3. Copies optimized system prompt to clipboard
4. Shows instructions for adding prompt to Claude

**Options:**

- `-f, --force` - Force reinstall servers that are already installed

### `openconductor stack show <slug>`

View details about a specific stack before installing.

```bash
# Show details for Coder Stack
openconductor stack show coder
```

**Output:**

```text
🧑‍💻 Coder Stack

Build, debug, and deploy like a senior engineer

📦 Included Servers:
  1. github-mcp ⭐ 1,234
  2. postgresql-mcp ⭐ 856
  3. filesystem-mcp ⭐ 2,103
  ... (and 3 more)

📊 Stats:
  Servers: 6
  Installs: 42

🚀 Install this stack:
  openconductor stack install coder
```

### `openconductor stack share <slug>`

Generate a shareable URL for a stack.

```bash
# Create share link for Coder Stack
openconductor stack share coder
```

**Output:**

```text
🔗 Share this stack:
  https://openconductor.ai/s/coder

📦 Installation command:
  $ openconductor stack install coder
```

## 🎯 Examples

### Discover and Install Workflow

```bash
# 1. Discover memory-related servers
openconductor discover memory

# 2. Install MCP Memory
openconductor install mcp-memory

# 3. Verify installation
openconductor list

# 4. Configure environment (if needed for the server)
export MCP_SERVER_API_KEY=your_key_here

# 5. Restart Claude Desktop
```

### Managing Multiple Servers

```bash
# Install multiple servers
openconductor install mcp-memory
openconductor install filesystem-mcp
openconductor install github-mcp

# Check status
openconductor list

# Update all
openconductor update

# Remove one
openconductor remove filesystem-mcp
```

### Custom Configuration

```bash
# Use custom config location
export CLAUDE_CONFIG_PATH="/path/to/custom/config.json"

# Or specify per command
openconductor install postgres --config ./custom-config.json
openconductor list --config ./custom-config.json
```

## 📁 Configuration

OpenConductor automatically detects your Claude Desktop configuration location:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`  
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Configuration Structure

```json
{
  "mcpServers": {
    "mcp-memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "PORT": "8080"
      }
    },
    "filesystem": {
      "command": "filesystem-mcp",
      "args": ["--root", "./workspace"],
      "env": {
        "PORT": "8081"
      }
    }
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**❌ "Server not found"**
```bash
# Check spelling and search registry
openconductor discover your-server-name

# List all available servers
openconductor discover
```

**❌ "Permission denied"**
```bash
# macOS/Linux: Use sudo for global installations
sudo openconductor install server-name

# Windows: Run as Administrator
```

**❌ "Port already in use"**
```bash
# Specify custom port
openconductor install server-name --port 8090

# Check current allocations
openconductor list
```

**❌ "Registry unreachable"**
```bash
# Check internet connection
ping openconductor.ai

# Use local API for development
export OPENCONDUCTOR_API_URL=https://openconductor-api.vercel.app/v1
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
export DEBUG=true
openconductor install problematic-server
```

### Reset Configuration

```bash
# Backup and reset configuration
openconductor init --force

# Or manually backup
cp ~/.config/claude/claude_desktop_config.json ~/backup-config.json
```

## 🛠️ Development

### Local Development

```bash
# Clone repository
git clone https://github.com/epicmotionSD/openconductor.git
cd openconductor/packages/cli

# Install dependencies
pnpm install

# Link for global testing
pnpm link --global

# Test locally
openconductor discover
```

### Testing

```bash
# Run automated tests
./test-cli.sh

# Test against local API
export OPENCONDUCTOR_API_URL=https://openconductor-api.vercel.app/v1
openconductor discover --limit 5
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test: `./test-cli.sh`
4. Submit a pull request

## 📊 Analytics

OpenConductor CLI collects anonymous usage data to improve the user experience. This includes:

- ✅ Commands used (discover, install, etc.)
- ✅ Installation success/failure rates  
- ✅ Popular MCP servers
- ✅ Error frequency

**What we DON'T collect:**
- ❌ Personal information
- ❌ File paths or contents
- ❌ Environment variables
- ❌ Server configurations

### Privacy Controls

```bash
# Disable analytics
openconductor analytics --disable

# Enable analytics  
openconductor analytics --enable

# View analytics status
openconductor analytics
```

## 🔗 Related Projects

- **OpenConductor Registry**: [https://openconductor.ai](https://openconductor.ai)
- **GitHub Repository**: [https://github.com/epicmotionSD/openconductor](https://github.com/epicmotionSD/openconductor)
- **Model Context Protocol**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/epicmotionSD/openconductor/issues)
- **Website**: [https://openconductor.ai](https://openconductor.ai)
- **Email**: hello@openconductor.ai

---

**Happy building with MCP servers! 🚀**