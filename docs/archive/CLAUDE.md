# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenConductor is an npm-like registry and CLI for MCP (Model Context Protocol) servers. It provides discovery, installation, and management of MCP servers through a professional CLI, web interface, and REST API.

**Key Value Proposition**: Makes installing MCP servers as easy as `npm install` - one command installation with automatic configuration, port management, and Claude Desktop integration.

## Monorepo Structure

This is a **pnpm workspace** monorepo with 4 packages:

```
packages/
├── shared/      # TypeScript types and schemas shared across packages
├── api/         # Express API server (PostgreSQL + Redis backend)
├── cli/         # CLI tool for discovering/installing MCP servers
└── frontend/    # Next.js web interface for server discovery
```

**Important**: Packages have dependencies on each other (e.g., `cli` and `api` depend on `shared`). Always build `shared` first when building from scratch.

## Common Commands

### Development
```bash
# Start both frontend and API dev servers
pnpm run dev
# Frontend: http://localhost:3000
# API: http://localhost:3001

# Start individual packages
cd packages/frontend && npm run dev
cd packages/api && npm run dev
cd packages/cli && npm run dev
```

### Building
```bash
# Build all packages (builds in correct dependency order)
pnpm run build

# Build individual packages (build shared first!)
pnpm run build:shared    # Must run first
pnpm run build:api
pnpm run build:frontend
pnpm run build:cli
```

### Database Operations
```bash
# Deploy database schema to Supabase
cd packages/api
pnpm run db:migrate

# Seed database with MCP servers
pnpm run db:seed
```

### Testing
```bash
# API tests
cd packages/api
pnpm test              # Run tests in watch mode
pnpm run test:run      # Run tests once

# Type checking
cd packages/api && pnpm run type-check
cd packages/frontend && pnpm run type-check
```

### CLI Testing
```bash
# Link CLI globally for local testing
cd packages/cli
npm link

# Test CLI commands
openconductor discover
openconductor install openmemory --dry-run
```

## Architecture Details

### API (`packages/api`)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Supabase) with 10+ tables for servers, stats, analytics
- **Cache**: Redis for rate limiting and caching
- **Structure**:
  - `routes/` - REST API endpoints (`/v1/servers`, `/v1/search`, etc.)
  - `services/` - Business logic (Registry, Search, Stats, GitHub sync)
  - `workers/` - Background jobs for GitHub webhooks and stats calculation
  - `middleware/` - Authentication, rate limiting, error handling
  - `db/` - Database schema and migrations
  - `server.ts` - Main Express application

**Key Services**:
- **RegistryService**: Server CRUD operations and listing
- **SearchService**: Full-text search with PostgreSQL
- **StatsService**: Trending analysis and popularity metrics
- **GitHubService**: Automated server discovery via GitHub API

### CLI (`packages/cli`)
- **Framework**: Pure Node.js (ES modules) with Commander.js
- **Entry Point**: `bin/openconductor.js` → `src/cli.ts`
- **Structure**:
  - `commands/` - CLI commands (discover, install, list, remove, update, init)
  - `lib/` - Core functionality (ApiClient, ConfigManager, Installer, PortManager)
  - `utils/` - Logging, validation, analytics helpers
  - `config/` - Configuration management

**Key Components**:
- **ApiClient**: Communicates with OpenConductor API
- **ConfigManager**: Manages `claude_desktop_config.json` files
- **Installer**: Handles MCP server installation workflow
- **PortManager**: Automatic port allocation and conflict resolution

### Frontend (`packages/frontend`)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel (see `vercel.json`)
- **Features**: Server discovery, search, filtering, installation instructions

### Shared (`packages/shared`)
- TypeScript types and interfaces used across all packages
- Server schemas, API response types, configuration types
- Must be built before other packages that depend on it

## Environment Setup

### Required Environment Variables
Create `.env` in project root and `packages/api/.env`:

```bash
# GitHub API token for automated server discovery
GITHUB_TOKEN=your_github_pat

# PostgreSQL database (Supabase recommended)
SUPABASE_DATABASE_URL=postgres://postgres.[ref]:[password]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

**Note**: See `.env.example` for detailed setup instructions.

## Key Concepts

### MCP Server Registry
The registry maintains a database of MCP servers discovered from GitHub repositories tagged with `mcp-server` topic. Servers include:
- Metadata (name, description, category, tags)
- Installation details (npm package, command, arguments)
- Statistics (stars, installs, trending velocity)
- Configuration templates for Claude Desktop

### Installation Flow
1. User runs `openconductor install <server-name>`
2. CLI fetches server config from API (`/v1/servers/cli/config/:slug`)
3. CLI installs npm package (if needed)
4. CLI updates `claude_desktop_config.json` with server configuration
5. CLI allocates available port automatically
6. CLI creates backup of previous config

### GitHub Sync
- Automated webhook processing for repository updates
- Background workers scan GitHub for new MCP servers
- Stats calculation runs periodically to update trending metrics

## Development Workflow

### Adding New API Endpoints
1. Add route handler in `packages/api/src/routes/`
2. Implement business logic in `packages/api/src/services/`
3. Add types to `packages/shared/src/` if needed
4. Update API tests in `packages/api/src/**/*.test.ts`

### Adding New CLI Commands
1. Create command file in `packages/cli/src/commands/`
2. Register command in `packages/cli/src/cli.ts`
3. Add helper functions to `packages/cli/src/lib/` if needed
4. Test with `npm link` before publishing

### Database Schema Changes
1. Update schema in `packages/api/src/db/schema.sql`
2. Create migration script if needed
3. Run `pnpm run db:migrate` to deploy
4. Update seed data in `packages/api/src/db/seed.ts` if needed

## Deployment

- **API**: Vercel serverless functions (auto-deployed from main branch)
- **Frontend**: Vercel (auto-deployed from main branch)
- **CLI**: Published to npm as `@openconductor/cli`
- **Database**: Supabase PostgreSQL (managed hosting)

## Important Notes

- This is a **pnpm workspace** - use `pnpm` for package management, not `npm install` at root
- The CLI uses **ES modules** (`"type": "module"` in package.json)
- Build order matters: `shared` → `api`/`cli`/`frontend`
- The project uses **Claude Desktop** config files located at platform-specific paths:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`
