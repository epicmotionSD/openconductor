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
openconductor install openmemory

# List installed servers
openconductor list
```

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @openconductor/cli
```

### From Source

```bash
git clone https://github.com/openconductor/openconductor.git
cd openconductor/packages/cli
npm install
npm link
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
openconductor install openmemory

# Custom config file location
openconductor install postgres --config ./my-config.json

# Specify custom port
openconductor install github --port 8090

# Skip confirmation prompts
openconductor install filesystem --yes

# Preview changes without installing
openconductor install slack --dry-run

# Force reinstall if already exists
openconductor install openmemory --force
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
openconductor remove openmemory

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
openconductor update openmemory

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

## 🎯 Examples

### Discover and Install Workflow

```bash
# 1. Discover memory-related servers
openconductor discover memory

# 2. Install OpenMemory
openconductor install openmemory

# 3. Verify installation
openconductor list

# 4. Configure environment (if needed)
export OPENMEMORY_API_KEY=your_key_here

# 5. Restart Claude Desktop
```

### Managing Multiple Servers

```bash
# Install multiple servers
openconductor install openmemory
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
    "openmemory": {
      "command": "npx",
      "args": ["-y", "openmemory"],
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
ping api.openconductor.ai

# Use local API for development
export OPENCONDUCTOR_API_URL=http://localhost:3001/v1
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
git clone https://github.com/openconductor/openconductor.git
cd openconductor/packages/cli

# Install dependencies
npm install

# Link for global testing
npm link

# Test locally
openconductor discover
```

### Testing

```bash
# Run automated tests
./test-cli.sh

# Test against local API
export OPENCONDUCTOR_API_URL=http://localhost:3001/v1
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
- **API Documentation**: [https://docs.openconductor.ai](https://docs.openconductor.ai)
- **Model Context Protocol**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/openconductor/openconductor/issues)
- **Discord**: [OpenConductor Community](https://discord.gg/openconductor)
- **Email**: [support@openconductor.ai](mailto:support@openconductor.ai)

---

**Happy building with MCP servers! 🚀**