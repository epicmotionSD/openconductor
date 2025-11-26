# OpenConductor Services Architecture

This document explains the different components of the OpenConductor platform and what runs where.

## Platform Services (Started by `npm start`)

These are the core platform services that run together:

### 1. Frontend (Port 3000)
- **Location**: `packages/frontend/`
- **Tech**: Next.js 14
- **Purpose**: Web interface for browsing and discovering MCP servers
- **URL**: http://localhost:3000
- **Started by**: `npm run dev` (via concurrently)

### 2. API Server (Port 3002)
- **Location**: `packages/api/`
- **Tech**: Express.js + TypeScript
- **Purpose**: REST API for MCP server registry
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
- **Purpose**: Command-line tool for discovering and installing MCP servers
- **Usage**:
  ```bash
  openconductor search postgres
  openconductor install filesystem
  openconductor list
  ```
- **Note**: This is a CLI tool, NOT a running service

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

# Search for MCP servers
openconductor search database

# Install an MCP server
openconductor install postgres-mcp

# List installed servers
openconductor list
```

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
- **API**: Backend service that powers the web interface
- **CLI**: Command-line tool for developers to install MCP servers

## Development

- **Start all services**: `npm start`
- **Build all packages**: `npm run build`
- **Install dependencies**: `npm run install:all`
- **Clean everything**: `npm run clean`
