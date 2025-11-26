# OpenConductor Registry MCP - Quick Start

Get up and running with the OpenConductor Registry MCP server in 5 minutes.

## Prerequisites

- Node.js 18 or higher
- Claude Desktop installed
- npm or pnpm

## Installation

### Option 1: Using OpenConductor CLI (Easiest)

```bash
# Install the OpenConductor CLI
npm install -g @openconductor/cli

# Install the registry MCP server
openconductor install openconductor-registry

# That's it! Restart Claude Desktop and you're ready.
```

### Option 2: Manual Installation

```bash
# Install globally
npm install -g @openconductor/mcp-registry

# Find the installation path
npm list -g @openconductor/mcp-registry
# Note the path (usually /usr/local/lib/node_modules/@openconductor/mcp-registry)
```

## Configuration

### Find your Claude Desktop config file

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Add the MCP server

Edit the config file and add:

```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "/path/to/node_modules/@openconductor/mcp-registry/dist/index.js"
      ]
    }
  }
}
```

**macOS/Linux global path example**:
```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "/usr/local/lib/node_modules/@openconductor/mcp-registry/dist/index.js"
      ]
    }
  }
}
```

**Windows global path example**:
```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\@openconductor\\mcp-registry\\dist\\index.js"
      ]
    }
  }
}
```

### Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

## Testing

Open Claude Desktop and try these prompts:

1. **Discover servers**:
   ```
   Show me the available MCP servers for working with databases
   ```

2. **Search**:
   ```
   Search for MCP servers related to GitHub
   ```

3. **Get details**:
   ```
   Tell me about the openmemory server
   ```

4. **Trending**:
   ```
   What are the most popular MCP servers right now?
   ```

5. **Categories**:
   ```
   Show me the breakdown of MCP servers by category
   ```

## Troubleshooting

### Server not found

If Claude says the tools aren't available:

1. Check the path in your config file is correct
2. Verify the package is installed: `npm list -g @openconductor/mcp-registry`
3. Make sure you restarted Claude Desktop
4. Check Claude Desktop logs for errors

### API errors

If you see API errors:

1. Check your internet connection
2. Verify the OpenConductor API is accessible: `curl https://api.openconductor.ai/v1/servers`
3. Check for rate limiting (unlikely with normal use)

### Path issues on Windows

On Windows, make sure to:
- Use double backslashes (`\\`) in the path
- Or use forward slashes (`/`)
- Verify the path exists in File Explorer

## Advanced Configuration

### Custom API endpoint

To use a local or custom API:

```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENCONDUCTOR_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Development Mode

### Run from source

```bash
# Clone the repository
git clone https://github.com/epicmotionSD/openconductor.git
cd openconductor/packages/mcp-servers/openconductor-registry

# Install dependencies
npm install

# Build
npm run build

# Test with inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### Watch mode

```bash
# In one terminal
npm run dev

# In another terminal
npx @modelcontextprotocol/inspector node dist/index.js
```

## Example Usage

Here are some real-world examples:

### Finding a database server
```
User: I need to connect to a PostgreSQL database from Claude
Claude: [Uses discover_servers with category="database"]
Claude: I found several database-related MCP servers. The most popular for PostgreSQL is...
```

### Exploring the ecosystem
```
User: What categories of MCP servers exist?
Claude: [Uses get_category_stats]
Claude: There are servers in 15 categories including database, memory, filesystem...
```

### Getting installation help
```
User: How do I install the GitHub MCP server?
Claude: [Uses get_server_details with slug="github"]
Claude: To install the GitHub MCP server, run: openconductor install github
```

## Next Steps

- Browse all servers at [openconductor.ai](https://openconductor.ai)
- Join our [Discord community](https://discord.gg/Ya5TPWeS)
- Check out the [full documentation](README.md)
- Star us on [GitHub](https://github.com/epicmotionSD/openconductor)

## Support

- **Issues**: [GitHub Issues](https://github.com/epicmotionSD/openconductor/issues)
- **Discord**: [Community Chat](https://discord.gg/Ya5TPWeS)
- **Email**: hello@openconductor.ai

---

Made with ❤️ by OpenConductor
