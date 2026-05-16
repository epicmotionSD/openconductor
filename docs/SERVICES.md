# OpenConductor Services Architecture

This document explains the different components of the OpenConductor platform and what runs where.

## Platform Services (Started by `npm start`)

These are the core platform services that run together:

### 1. Frontend (Port 3000)
- **Location**: `packages/frontend/`
- **Tech**: Next.js 14
- **Purpose**: Web interface for API keys, billing, deployment flows, and Trust Stack surfaces
- **URL**: http://localhost:3000
- **Started by**: `npm run dev` (via concurrently)

### 2. API Server (Port 3002)
- **Location**: `packages/api/`
- **Tech**: Express.js + TypeScript
- **Purpose**: REST API for billing, key provisioning, usage metering, and registry access
- **URL**: http://localhost:3002
- **Started by**: `npm run dev` (via concurrently)

### 3. Database (Port 5434)
- **Tech**: PostgreSQL
- **Purpose**: Store MCP server metadata, stats, and user data
- **Connection**: Configured in `packages/api/.env`
- **Setup**: Run `./setup-openconductor-db.sh`

## Standalone Tools (NOT started by `npm start`)

These are published packages that users install separately:

### 1. OpenConductor CLI
- **Location**: `packages/cli/`
- **Installation**: `npm install -g @openconductor/cli`
- **Purpose**: Command-line tool for MCP server discovery, installation, and management across Claude Desktop / Cursor / Cline / Windsurf
- **Usage**:
  ```bash
  openconductor discover postgres
  openconductor stack install coder
  openconductor install filesystem
  openconductor list
  ```
- **Note**: This is a CLI tool, NOT a running service. The `openconductor deploy --monetize` command exists but is currently a stub — do not document it as working until it's implemented.

### 2. OpenConductor Registry MCP Server
- **Location**: `packages/mcp-servers/openconductor-registry/`
- **Installation**: `npm install -g @openconductor/mcp-registry`
- **Purpose**: MCP server that lets Claude search the OpenConductor registry
- **Usage**: Add to Claude Desktop config
- **Note**: This is an MCP server for Claude Desktop, NOT a platform service

### 3. SportIntel MCP Server
- **Location**: `packages/mcp-servers/sportintel/`
- **Installation**: `npm install -g @openconductor/sportintel`
- **Purpose**: MCP server for sports data and analytics
- **Usage**: Add to Claude Desktop config
- **Note**: This is an MCP server for Claude Desktop, NOT a platform service

## Quick Start

### Running the Platform
```bash
# Start frontend + API + database
npm start

# Or manually
./scripts/launch-openconductor.sh
```

### Using the CLI (Separate Install)
```bash
# Install globally
npm install -g @openconductor/cli

# Discover MCP servers
openconductor discover database

# Install a single MCP server
openconductor install postgres-mcp

# Or install a curated stack with a matching system prompt
openconductor stack install coder

# List installed servers
openconductor list
```

### Monetizing an MCP Server You're Building

Use the SDK, not the CLI — the `requirePayment()` middleware deducts credits from the hosted billing API at `api.openconductor.ai` on every paid tool call.

```bash
npm install @openconductor/mcp-sdk
```

```ts
import { requirePayment } from '@openconductor/mcp-sdk';

const analyze = requirePayment({ credits: 5 }, { toolName: 'analyze-data' })(
  async (input) => ({ summary: await summarize(input.text) })
);
```

In demo mode (no API key set) the SDK mocks 9999 credits and logs every check; in production mode (with `OPENCONDUCTOR_API_KEY`) it deducts real credits from Postgres.

### Using MCP Servers in Claude Desktop
```bash
# Install an MCP server package
npm install -g @openconductor/mcp-registry

# Add to ~/.config/claude-desktop/config.json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "openconductor-registry"
    }
  }
}
```

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│ OpenConductor Platform (npm start)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   API Server │  │  PostgreSQL  │ │
│  │   :3000      │──│   :3002      │──│   :5434      │ │
│  │   Next.js    │  │   Express    │  │   Database   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Standalone Tools (npm install -g)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ OpenConductor CLI│  │  MCP Servers     │            │
│  │ (Command Line)   │  │  (For Claude)    │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Common Confusion

**Q: Why doesn't the CLI start when I run `npm start`?**
A: The CLI is a standalone tool that users install globally. It's not a service that runs alongside the platform.

**Q: Do I need to run the MCP servers?**
A: No. The MCP server packages are meant to be installed by end users who want to use them with Claude Desktop. The platform itself doesn't run them.

**Q: What's the difference between the API and the CLI?**
A:
- **API**: Backend service for billing, API keys, usage metering, and registry data
- **CLI**: Command-line tool for discovering and installing MCP servers into Claude Desktop / Cursor / Cline / Windsurf
- **SDK** (`@openconductor/mcp-sdk`): library MCP server authors use to add `requirePayment()` to their tool handlers — this is the actual monetization surface, not the CLI

## Development

- **Start all services**: `npm start`
- **Build all packages**: `npm run build`
- **Install dependencies**: `npm run install:all`
- **Clean everything**: `npm run clean`
