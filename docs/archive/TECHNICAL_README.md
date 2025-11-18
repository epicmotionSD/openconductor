# OpenConductor

> **The Enterprise Control Plane for AI Agent Systems**

OpenConductor is a production-ready platform for discovering, orchestrating, and monitoring MCP servers at scale. Built specifically for the Model Context Protocol (MCP), OpenConductor provides enterprise-grade infrastructure for managing AI agent ecosystems with professional tooling, automated workflows, and comprehensive analytics.

## 🚀 Quick Start

```bash
# Install the CLI
npm install -g @openconductor/cli

# Discover MCP servers
openconductor discover "memory"

# Install a server to Claude Desktop
openconductor install openmemory

# List installed servers  
openconductor list
```

## ✨ Enterprise Features

### 🔍 **Advanced Server Discovery**
- **Intelligent Search**: Full-text search with ranking, highlighting, and autocomplete
- **Smart Filtering**: Category-based browsing with verified server prioritization
- **Trending Analysis**: Growth velocity tracking with popularity algorithms
- **GitHub Integration**: Automated server discovery from repository topics

### ⚡ **Professional Installation**
- **Interactive CLI**: Progress tracking, requirement validation, and port management
- **Cross-Platform**: Native support for macOS, Windows, and Linux configurations
- **Automated Backup**: Configuration backup and restoration on every change
- **Dependency Resolution**: Smart package management with version conflict detection

### 🛠 **Enterprise Developer Experience**
- **SDK Integration**: Programmatic API access with retry logic and error handling
- **Analytics Tracking**: Anonymous usage analytics with privacy-first design
- **Professional UX**: Colored output, progress bars, and interactive prompts
- **Comprehensive Validation**: Input sanitization and security throughout

### 📊 **Production Infrastructure**
- **PostgreSQL Database**: Enterprise schema with 10 tables, indexes, and views
- **Redis Caching**: Multi-layer caching strategy with automatic invalidation
- **Background Processing**: Async job system for GitHub sync and stats updates
- **Rate Limiting**: Adaptive rate limiting with user behavior analysis
- **Comprehensive Monitoring**: Health checks, metrics, and audit logging

### 🚀 **GitHub Automation**
- **Webhook Processing**: Real-time repository updates and release tracking
- **Automated Discovery**: Continuous scanning for new MCP servers
- **Smart Categorization**: AI-powered category detection and metadata extraction
- **Version Management**: Automatic release tracking and update notifications

## 🏗️ Enterprise Architecture

OpenConductor now features a comprehensive enterprise architecture:

```
openconductor/
├── packages/
│   ├── api/          # Enterprise Node.js API with PostgreSQL + Redis
│   │   ├── services/ # Business logic layer (Registry, Search, Stats, GitHub)
│   │   ├── workers/  # Background job processing and GitHub sync
│   │   ├── routes/   # REST API endpoints (/servers, /search, /stats, /cli)
│   │   └── db/       # PostgreSQL schema with 10+ tables and analytics
│   ├── cli/          # Professional CLI with interactive commands
│   │   ├── commands/ # discover, install, list, remove, update, init
│   │   ├── lib/      # ApiClient, ConfigManager, Installer, PortManager
│   │   └── utils/    # Logging, validation, analytics
│   ├── frontend/     # Next.js web interface
│   └── shared/       # Comprehensive TypeScript types and schemas
```

**Enterprise Infrastructure:**
- **PostgreSQL Database**: 10 tables with full-text search, analytics, and statistics
- **Redis Caching**: Multi-layer caching with TTL management and rate limiting
- **Background Workers**: GitHub sync, stats calculation, and automated discovery
- **Authentication**: API key management and OAuth integration
- **Monitoring**: Health checks, metrics, logging, and error tracking

## 📦 Installation

### CLI (Recommended)

```bash
npm install -g @openconductor/cli
openconductor --help
```

### From Source

```bash
git clone https://github.com/yourusername/openconductor.git
cd openconductor
npm install
npm run build
```

## 🔧 Usage

### Discover MCP Servers

```bash
# Browse all servers
openconductor discover

# Search for memory servers
openconductor discover "memory"

# Filter by category
openconductor discover --category filesystem

# Show only verified servers
openconductor discover --verified
```

### Install MCP Servers

```bash
# Install to Claude Desktop (default)
openconductor install openmemory

# Install to custom config file
openconductor install postgres --config ./my-config.json

# Force overwrite existing installation
openconductor install github --force

# Preview changes without installing
openconductor install slack --dry-run
```

### Manage Installations

```bash
# List installed servers
openconductor list

# Show configuration details
openconductor config --show

# Validate configuration
openconductor config --validate

# Edit configuration file
openconductor config --edit
```

## 🌟 Featured MCP Servers

| Server | Category | Description |
|--------|----------|-------------|
| **OpenMemory** | Memory | Hierarchical memory with semantic search |
| **GitHub MCP** | API | Repository management and automation |
| **PostgreSQL MCP** | Database | Secure database queries and introspection |
| **Filesystem MCP** | Filesystem | Sandboxed file system access |
| **Slack MCP** | API | Workspace messaging and channels |
| **Brave Search MCP** | API | Web search capabilities |

[See all 20+ servers →](https://openconductor.ai/discover)

## 🚀 Development

### Prerequisites

**Required:**
- Node.js 18+ (20+ recommended)
- PostgreSQL 13+ (or Supabase account)
- Redis 6+ (optional for development)

**Optional:**
- Docker for container testing
- GitHub token for webhook integration

### Enterprise Local Development

```bash
# Clone and install all dependencies
git clone https://github.com/yourusername/openconductor.git
cd openconductor
pnpm install

# Set up environment variables
cp packages/api/.env.example packages/api/.env
# Edit .env with your database credentials

# Deploy database schema
cd packages/api
pnpm run db:migrate

# Start all development servers
pnpm run dev
# API: http://localhost:3001 (with Supabase)
# Frontend: http://localhost:3000
```

### Production Database Setup

#### Option 1: Supabase (Recommended)
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Copy connection details to .env file
# 3. Deploy schema
cd packages/api
POSTGRES_URL="your-supabase-url" pnpm run db:migrate
```

#### Option 2: Self-hosted PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb openconductor

# Deploy schema
cd packages/api
DB_HOST=localhost DB_NAME=openconductor pnpm run db:migrate
```

### CLI Development

```bash
# Link CLI globally for testing
cd packages/cli
npm link

# Test CLI commands
openconductor discover --limit 5
openconductor install openmemory --dry-run

# Run CLI test suite
./test-cli.sh
```

### Testing

```bash
# Run API tests
cd packages/api
pnpm test

# Run CLI tests
cd packages/cli
./test-cli.sh

# Run integration tests
pnpm test:integration
```

### Building for Production

```bash
# Build all packages
pnpm run build

# Build specific components
pnpm run build:api      # API server
pnpm run build:cli      # CLI tool
pnpm run build:frontend # Web interface
```

## 📖 API Reference

### Enterprise CLI Commands

#### `openconductor discover [query]`
Search and browse MCP servers with interactive UI.

**Options:**
- `-c, --category <category>` - Filter by category (memory, filesystem, database, api, search, communication, monitoring, development, custom)
- `-t, --tags <tags...>` - Filter by multiple tags
- `--verified` - Show only verified servers
- `-l, --limit <number>` - Number of results (max 50, default: 10)

**Examples:**
```bash
openconductor discover                    # Browse all servers
openconductor discover "memory"          # Search for memory servers
openconductor discover --category api    # Filter by API category
openconductor discover --verified        # Show only verified servers
```

#### `openconductor install <server>`
Install MCP server with progress tracking and validation.

**Options:**
- `--config <path>` - Custom config file path
- `--port <port>` - Custom port number (1024-65535)
- `--force` - Force overwrite existing installation
- `--dry-run` - Preview changes without installing
- `-y, --yes` - Skip confirmation prompts

**Examples:**
```bash
openconductor install openmemory          # Interactive installation
openconductor install postgres --port 8090  # Custom port
openconductor install github --dry-run    # Preview installation
```

#### `openconductor list`
List installed servers with status monitoring.

**Options:**
- `--config <path>` - Custom config file path
- `--format <format>` - Output format (table, json)

#### `openconductor remove <server>`
Remove installed server with confirmation and cleanup.

**Options:**
- `--config <path>` - Custom config file path
- `-y, --yes` - Skip confirmation prompts

#### `openconductor update [server]`
Update servers to latest versions.

**Options:**
- `--config <path>` - Custom config file path

#### `openconductor init`
Initialize configuration with setup wizard.

**Options:**
- `-f, --force` - Overwrite existing configuration

#### `openconductor analytics`
Manage anonymous analytics preferences.

**Options:**
- `--enable` - Enable anonymous usage tracking
- `--disable` - Disable anonymous usage tracking

### Enterprise HTTP API

**Base URL:** `https://api.openconductor.ai/v1`

#### Server Discovery & Search

**`GET /v1/servers`**
List servers with advanced filtering, sorting, and pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (max: 100, default: 20)
- `category` - Server category filter
- `tags` - Array of tags (AND logic)
- `verified` - Verification status filter
- `q` - Full-text search query
- `sort` - Sort by (popular, trending, recent, stars, installs)
- `order` - Sort order (asc, desc)

**`GET /v1/servers/:slug`**
Get comprehensive server details with stats, versions, and dependencies.

**`GET /v1/servers/search`**
Advanced search with highlighting and suggestions.

**Query Parameters:**
- `q` - Search query (required)
- `filters` - JSON object with category, tags, verified filters
- `limit` - Max results (default: 10, max: 50)

**`GET /v1/servers/search/autocomplete`**
Get search autocomplete suggestions.

**Query Parameters:**
- `q` - Query prefix
- `limit` - Max suggestions (default: 5)

#### Statistics & Analytics

**`GET /v1/servers/stats/trending`**
Get trending servers with growth metrics.

**Query Parameters:**
- `period` - Time period (24h, 7d, 30d)
- `category` - Category filter
- `limit` - Max results (default: 10)

**`GET /v1/servers/stats/popular`**
Most popular servers by category.

**Query Parameters:**
- `category` - Category filter
- `limit` - Max results (default: 10)

**`GET /v1/servers/categories`**
List all categories with counts and featured servers.

#### CLI Integration

**`GET /v1/servers/cli/config/:slug`**
Get installation configuration for CLI.

**`POST /v1/servers/cli/install-event`**
Track CLI installations (anonymous).

#### GitHub Integration

**`POST /v1/servers/webhooks/github`**
GitHub webhook endpoint for automated sync.

**`GET /v1/servers/webhooks/github/status`**
Webhook processing statistics.

#### Health & Monitoring

**`GET /health`**
Comprehensive health check with service status.

**`GET /health/live`**
Kubernetes liveness probe.

**`GET /health/ready`**
Kubernetes readiness probe.

**`GET /metrics`**
Prometheus metrics endpoint.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding MCP Servers

To add your MCP server to the registry:

1. Ensure your repository has the `mcp-server` topic
2. Include proper installation instructions in README
3. Provide configuration examples
4. Submit a pull request with server details

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website:** [openconductor.ai](https://openconductor.ai)
- **Documentation:** [docs.openconductor.ai](https://docs.openconductor.ai)
- **Discord:** [OpenConductor Community](https://discord.gg/Ya5TPWeS)
- **Twitter/X:** [@SDexecution](https://x.com/SDexecution)

## 🙏 Acknowledgments

Built for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) community. Special thanks to:

- Anthropic for creating MCP
- All MCP server maintainers
- The AI agent development community

---

**OpenConductor** - Making AI agent systems as easy to manage as containers.