# OpenConductor

**The npm for AI agent tools.** Install 190+ MCP servers without editing JSON configs.

[![npm version](https://img.shields.io/npm/v/@openconductor/cli.svg)](https://www.npmjs.com/package/@openconductor/cli)
[![Downloads](https://img.shields.io/npm/dm/@openconductor/cli.svg)](https://www.npmjs.com/package/@openconductor/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Website](https://openconductor.ai) • [Install](https://openconductor.ai/install) • [Discover](https://openconductor.ai/discover) • [Discord](https://discord.gg/Ya5TPWeS)

---

## The Problem → The Solution

**Before OpenConductor** (30+ minutes of JSON editing):
```bash
# Find the right package
npm search mcp-server-github

# Install it manually
npm install -g @modelcontextprotocol/server-github

# Edit Claude's config file
vi ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Add complex JSON configuration
# Deal with port conflicts, paths, environment variables...
# Restart Claude Desktop
# Debug why it's not working...
```

**After OpenConductor** (30 seconds):
```bash
npm install -g @openconductor/cli
openconductor install github-mcp
# ✓ Done. Works immediately in Claude Desktop.
```

---

## Why OpenConductor?

**The Problem:** Setting up MCP servers requires manually editing JSON config files, finding npm packages, managing ports, and debugging cryptic errors. It's 2010-era JavaScript dependency hell.

**The Solution:** OpenConductor is the npm for AI agent tools. One command installs, configures, and manages everything.

**The Result:** Go from idea to working AI agent in seconds, not hours.

### Key Features

- **🚀 One-Command Install** - No JSON editing, no config files, no debugging
- **📦 190+ Servers** - Largest registry of MCP servers (databases, APIs, memory, search, files)
- **⚡ Stacks** - Pre-configured workflows (Coder, Writer, Essential) with system prompts
- **🎯 Achievements** - Gamification system with 15 unlockable achievements
- **🏷️ Badges** - Installation badges for MCP server developers
- **✅ Verified** - All servers tested and validated
- **🌐 Cross-Platform** - Works on macOS, Windows, and Linux

## Quick Start

### 1. Install the CLI

```bash
npm install -g @openconductor/cli
```

### 2. Install a Stack (Recommended for First-Timers)

Stacks are pre-configured workflows that install multiple servers + give Claude a specialized persona.

```bash
# See available stacks
openconductor stack list

# Install Coder Stack (5 servers + system prompt)
openconductor stack install coder
# System prompt auto-copied to clipboard!
# Paste into Claude Desktop → Start coding
```

**Available Stacks:**
- 🧑‍💻 **Coder** - Build, debug, deploy (GitHub, Filesystem, PostgreSQL, Memory, Search)
- ✍️ **Writer** - Research, write, publish (Memory, Search, Filesystem, Brave)
- ⚡ **Essential** - Everything to get started (Filesystem, Memory, Search)

### 3. Or Install Individual Servers

```bash
# Browse 190+ servers
openconductor discover

# Search by keyword
openconductor discover "database"

# Install any server
openconductor install postgresql-mcp

# List installed servers
openconductor list

# Remove a server
openconductor remove postgresql-mcp
```

**That's it.** No JSON editing. No port debugging. No dependency hunting.

## Popular Servers

| Server | Category | Description | GitHub Stars |
|--------|----------|-------------|--------------|
| [OpenMemory](https://github.com/zhaoolee/openmemory) | Memory | Hierarchical memory for AI agents | ⭐ 1.6K |
| [GitHub MCP](https://github.com/modelcontextprotocol/servers) | API | Repository management | ⭐ 1.1K |
| [PostgreSQL MCP](https://github.com/modelcontextprotocol/servers) | Database | Secure database queries | ⭐ 654 |
| [Filesystem MCP](https://github.com/modelcontextprotocol/servers) | Files | Sandboxed file operations | ⭐ 892 |

[**Browse All Servers →**](https://openconductor.ai/discover)

## How It Works

1. **Discover** - Browse the registry via CLI or web interface
2. **Install** - One command installs and configures everything
3. **Use** - Server is immediately available in Claude Desktop
4. **Stay Updated** - Automatic discovery adds new servers daily

## Architecture

OpenConductor is built as a monorepo with three main packages:

```text
packages/
├── cli/         # Command-line interface
├── frontend/    # Next.js web application
└── api/         # Express.js backend API
```

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Express.js, PostgreSQL, TypeScript
- **CLI**: Node.js, Commander.js
- **Infrastructure**: Vercel (frontend), Railway (backend)

## Contributing

We welcome contributions! Here's how you can help:

### Submit Your Server

1. Visit [openconductor.ai/submit](https://openconductor.ai/submit)
2. Enter your GitHub repository URL
3. Our system will validate and add it automatically

Or add the `mcp-server` topic to your GitHub repo and we'll discover it.

### Improve the Platform

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Documentation

- **[Getting Started](docs/getting-started.md)** - Installation and first steps
- **[CLI Reference](docs/cli-reference.md)** - Complete command documentation
- **[API Documentation](docs/api.md)** - REST API endpoints
- **[Architecture](docs/architecture.md)** - System design and infrastructure
- **[Contributing](CONTRIBUTING.md)** - How to contribute

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/openconductor.git
cd openconductor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

This starts:

- Frontend at `http://localhost:3000`
- API at `http://localhost:3001`

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

## Deployment

### Frontend (Vercel)

The frontend automatically deploys to Vercel on push to `main`:

```bash
vercel --prod
```

### Backend (Railway)

The backend deploys to Railway:

```bash
railway up
```

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

## Community

- **Website**: [openconductor.ai](https://openconductor.ai)
- **Discord**: [Join our community](https://discord.gg/Ya5TPWeS)
- **GitHub Discussions**: [Share ideas](https://github.com/epicmotionSD/openconductor/discussions)
- **Issues**: [Report bugs](https://github.com/epicmotionSD/openconductor/issues)
- **Email**: [hello@openconductor.ai](mailto:hello@openconductor.ai)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built for the [Model Context Protocol](https://modelcontextprotocol.io) community.

Special thanks to:
- **Anthropic** for creating MCP
- **All MCP server maintainers** for building the ecosystem
- **Early OpenConductor users** for feedback and support

---

**⭐ Star this repo to support the project!**

Made with ❤️ by the OpenConductor team
