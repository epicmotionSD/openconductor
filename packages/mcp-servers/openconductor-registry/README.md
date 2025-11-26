# OpenConductor Registry MCP Server

Discover and search 190+ MCP servers **and pre-configured stacks** directly in Claude through the Model Context Protocol.

> Bring the power of OpenConductor's MCP registry directly into your AI conversations

## Features

- **📦 Stacks Discovery** - Browse pre-configured server collections for specific use cases (NEW!)
- **🔍 Smart Discovery** - Browse all available MCP servers with filtering by category
- **🔎 Full-Text Search** - Find servers by name, description, or tags
- **📊 Trending Servers** - See what's popular in the community
- **📈 Category Stats** - Understand the MCP ecosystem at a glance
- **📝 Detailed Info** - Get installation instructions and configuration details

## Installation

### Using OpenConductor CLI (Recommended)

```bash
npm install -g @openconductor/cli
openconductor install openconductor-registry
```

### Manual Installation with Claude Desktop

1. Install the package:
```bash
npm install -g @openconductor/mcp-registry
```

2. Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "/path/to/global/node_modules/@openconductor/mcp-registry/dist/index.js"
      ]
    }
  }
}
```

3. Restart Claude Desktop

## Available Tools

### `discover_servers`
Browse MCP servers with optional filtering.

**Parameters:**
- `query` (optional): Search term to filter servers
- `category` (optional): Filter by category (e.g., "database", "memory", "filesystem")
- `limit` (optional): Maximum results to return (default: 10)

**Example:**
```
Use the discover_servers tool to find memory-related MCP servers
```

### `search_servers`
Search for servers by name, description, or tags.

**Parameters:**
- `query` (required): Search term
- `limit` (optional): Maximum results (default: 10)

**Example:**
```
Search for MCP servers related to PostgreSQL
```

### `get_server_details`
Get detailed information about a specific server.

**Parameters:**
- `slug` (required): Server slug identifier (e.g., "openmemory")

**Example:**
```
Get details about the openmemory server
```

### `get_trending_servers`
Get the most popular servers based on stars and installs.

**Parameters:**
- `limit` (optional): Number of servers to return (default: 10)

**Example:**
```
Show me the trending MCP servers
```

### `get_category_stats`
Get statistics about all server categories.

**Parameters:** None

**Example:**
```
Show me the breakdown of MCP servers by category
```

### `list_stacks` 🆕
List all available pre-configured stacks.

**Parameters:**
- `limit` (optional): Maximum number of stacks to return (default: 10)

**Example:**
```
Show me the available MCP server stacks
```

### `get_stack_details` 🆕
Get detailed information about a specific stack including servers and system prompt overview.

**Parameters:**
- `slug` (required): The stack slug (e.g., "coder", "writer", "essential")

**Example:**
```
Tell me about the Coder Stack
```

### `share_stack` 🆕
Generate shareable URLs and installation instructions for a stack.

**Parameters:**
- `slug` (required): The stack slug to share

**Example:**
```
How can I share the Essential Stack with my team?
```

## Usage Examples

Once installed in Claude Desktop, you can ask questions like:

**Stacks:**
- "Show me the available stacks"
- "Tell me about the Coder Stack"
- "What's included in the Writer Stack?"
- "How can I share the Essential Stack with my team?"

**Servers:**
- "What MCP servers are available for working with databases?"
- "Show me the most popular MCP servers"
- "Find servers that help with memory management"
- "Get details about the GitHub MCP server"
- "What categories of MCP servers exist?"

## API Endpoint

By default, this MCP server connects to the OpenConductor API at:
```
https://api.openconductor.ai
```

You can override this by setting the `OPENCONDUCTOR_API_URL` environment variable:

```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": ["..."],
      "env": {
        "OPENCONDUCTOR_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Development

### Build from source

```bash
git clone https://github.com/epicmotionSD/openconductor.git
cd openconductor/packages/mcp-servers/openconductor-registry
npm install
npm run build
```

### Testing locally

```bash
# Build the server
npm run build

# Test with MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Use Cases

### For Developers
- Discover MCP servers without leaving Claude
- Get installation instructions instantly
- Explore servers by category or functionality
- Find trending servers the community is using

### For AI Agents
- Programmatically discover available tools
- Self-configure based on task requirements
- Learn about the MCP ecosystem autonomously

### For OpenConductor
- Drive traffic to the registry
- Increase server discovery and installation
- Create network effects across the ecosystem

## Architecture

This MCP server is a lightweight proxy that connects to the OpenConductor REST API:

```
Claude Desktop
    ↓
OpenConductor Registry MCP Server
    ↓
OpenConductor API (api.openconductor.ai)
    ↓
PostgreSQL Database (120+ servers)
```

## Contributing

Contributions are welcome! Please see the main [OpenConductor repository](https://github.com/epicmotionSD/openconductor) for contribution guidelines.

## Related Projects

- **[OpenConductor CLI](https://www.npmjs.com/package/@openconductor/cli)** - Command-line tool for managing MCP servers
- **[OpenConductor Web](https://openconductor.ai)** - Web interface for browsing servers
- **[OpenConductor API](https://api.openconductor.ai)** - REST API powering the ecosystem

## License

MIT License - see [LICENSE](../../../LICENSE) for details

## Support

- **Issues**: [GitHub Issues](https://github.com/epicmotionSD/openconductor/issues)
- **Discord**: [Join our community](https://discord.gg/Ya5TPWeS)
- **Email**: hello@openconductor.ai

---

Built for the [Anthropic Model Context Protocol Challenge](https://www.anthropic.com/mcp)

Made with ❤️ by the OpenConductor team
