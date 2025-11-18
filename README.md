# OpenConductor

> The npm registry for Model Context Protocol servers

[![npm version](https://img.shields.io/npm/v/@openconductor/cli.svg)](https://www.npmjs.com/package/@openconductor/cli)
[![Downloads](https://img.shields.io/npm/dm/@openconductor/cli.svg)](https://www.npmjs.com/package/@openconductor/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Website](https://openconductor.ai) • [Documentation](#documentation) • [Discord](https://discord.gg/Ya5TPWeS) • [Submit a Server](/submit)

---

## What is OpenConductor?

OpenConductor is the missing registry and CLI for the Model Context Protocol. Find, install, and manage 60+ MCP servers with a professional developer experience.

```bash
npm install -g @openconductor/cli
openconductor discover "memory"
openconductor install openmemory
# ✓ Ready to use in Claude!
```

## Features

- **🔍 Smart Discovery** - Search 60+ MCP servers by category, tags, and popularity
- **⚡ One-Command Install** - Automatic configuration and port management
- **🤖 Auto-Discovery** - Daily GitHub sync adds new servers automatically
- **✅ Community Verified** - Automated validation with manual review
- **🌐 Cross-Platform** - Works on macOS, Windows, and Linux

## Quick Start

### Install the CLI

```bash
npm install -g @openconductor/cli
```

### Discover Servers

```bash
# Browse all servers
openconductor discover

# Search for specific servers
openconductor discover "database"

# Filter by category
openconductor discover --category memory
```

### Install Servers

```bash
# Install any server
openconductor install openmemory

# List installed servers
openconductor list

# Remove a server
openconductor remove openmemory
```

That's it! No config files to edit, no ports to manage, no manual restarts.

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
