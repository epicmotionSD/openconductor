# Copilot Instructions — OpenConductor

## Big picture
- Monorepo with platform services plus standalone tools. Platform = Next.js frontend + Express API + Postgres; tools = CLI + MCP servers. See [SERVICES.md](SERVICES.md).
- Core packages live under [packages/](packages/):
  - [packages/frontend](packages/frontend) (Next.js 14 UI)
  - [packages/api](packages/api) (Express API)
  - [packages/cli](packages/cli) (CLI tool)
  - [packages/shared](packages/shared) (shared TS types/schemas)
  - [packages/mcp-servers](packages/mcp-servers) (standalone MCP server packages)

## Critical workflows
- Dev (frontend + API): `npm run dev` at repo root (uses concurrently). See [package.json](package.json).
- Start platform stack: `npm start` → scripts/launch-openconductor.sh (also aliased as `npm run launch`). See [package.json](package.json).
- Build order matters: run `npm run build:shared` before `build:api`, `build:frontend`, or `build:cli`. See [package.json](package.json).
- Full dependency install across packages: `npm run install:all`. See [package.json](package.json).
- Tests: `npm test` (Jest). See [package.json](package.json).

## Service boundaries & data flow
- API serves registry/search data to frontend; CLI consumes API endpoints for install/search flows. See [SERVICES.md](SERVICES.md).
- Platform ports (local): frontend :3000, API :3002, Postgres :5434. See [SERVICES.md](SERVICES.md).
- CLI and MCP servers are **not** platform services; they are separate globally installed tools. See [SERVICES.md](SERVICES.md).

## Project-specific conventions
- Shared types live in [packages/shared](packages/shared); update these when changing API/CLI contract surfaces.
- CLI commands are implemented in [packages/cli/src/commands](packages/cli/src/commands) and registered in [packages/cli/src/cli.ts](packages/cli/src/cli.ts).
- API routes and business logic live under [packages/api/src/routes](packages/api/src/routes) and [packages/api/src/services](packages/api/src/services).

## External integrations
- API expects a PostgreSQL connection configured via `packages/api/.env` (Supabase commonly used). See [SERVICES.md](SERVICES.md).
- CLI interacts with Claude Desktop config files on the user’s machine (platform-specific paths). See [docs/archive/CLAUDE.md](docs/archive/CLAUDE.md).
