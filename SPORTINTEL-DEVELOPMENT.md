# SportIntel Development Guide

Welcome to SportIntel development! This guide covers setting up your development environment, understanding the architecture, and contributing to the project.

## Quick Start

```bash
# 1. Setup development environment
./scripts/sportintel/setup-dev-env.sh

# 2. Configure API keys (optional for development)
cp .env.sportintel .env.local
# Edit .env.local with your API keys

# 3. Start development servers
npm run dev:sportintel

# 4. Visit the application
open http://localhost:3000
```

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Database Management](#database-management)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js 18+** - JavaScript runtime
- **Docker & Docker Compose** - For local databases
- **Python 3.8+** - For ML pipeline components
- **Redis CLI** (optional) - For cache debugging
- **VS Code** (recommended) - With SportIntel extensions

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 10GB free space
- **OS**: macOS, Linux, or Windows with WSL2

## Environment Setup

### Automated Setup

The easiest way to get started is using our setup script:

```bash
# Clone the repository
git clone <repository-url>
cd openconductor

# Run automated setup
./scripts/sportintel/setup-dev-env.sh

# Follow the prompts and instructions
```

### Manual Setup

If you prefer manual setup or need to customize the process:

#### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (optional)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. Configure Environment

```bash
# Copy environment template
cp .env.sportintel .env.local

# Edit configuration
nano .env.local
```

#### 3. Start Databases

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.sportintel.yml up -d timescaledb redis

# Run migrations
npm run db:migrate:dev

# Seed with test data
npm run db:seed:dev
```

#### 4. Start Development Servers

```bash
# Start all services concurrently
npm run dev:sportintel

# Or start individually
npm run dev:server    # Backend API
npm run dev:frontend  # React frontend  
npm run dev:ml        # Python ML pipeline
```

## Architecture Overview

SportIntel extends OpenConductor with sports analytics capabilities:

```
┌─────────────────────────────────────────────┐
│                SportIntel                   │
├─────────────────┬───────────────────────────┤
│   Frontend      │      Backend              │
│ ┌─────────────┐ │ ┌───────────────────────┐ │
│ │ Terminal UI │ │ │  Trinity AI Agents    │ │
│ │ Bloomberg   │ │ │ ┌─────────────────────┐ │
│ │ Style       │ │ │ │ Oracle (Predict)    │ │
│ └─────────────┘ │ │ │ Sentinel (Monitor)  │ │
│                 │ │ │ Sage (Advisory)     │ │
│ ┌─────────────┐ │ │ └─────────────────────┘ │
│ │ WebSocket   │ │ │                       │ │
│ │ Real-time   │ │ │ ┌─────────────────────┐ │
│ │ Updates     │ │ │ │ MCP Servers         │ │
│ └─────────────┘ │ │ │ Sports Data         │ │
│                 │ │ │ ML Pipeline         │ │
│ ┌─────────────┐ │ │ │ Analytics           │ │
│ │ PWA         │ │ │ │ Alerts              │ │
│ │ Offline     │ │ │ └─────────────────────┘ │
│ │ Support     │ │ │                       │ │
│ └─────────────┘ │ └───────────────────────┘ │
└─────────────────┴───────────────────────────┘
┌─────────────────────────────────────────────┐
│           OpenConductor Platform            │
├─────────────────┬───────────────────────────┤
│   EventBus      │     Plugin System         │
│   AgentRuntime  │     Tool Registry         │
│   WebSocket     │     Config Manager        │
└─────────────────┴───────────────────────────┘
┌─────────────────────────────────────────────┐
│              Data Layer                     │
├─────────────────┬───────────────────────────┤
│  TimescaleDB    │      Redis Cache          │
│  Time Series    │      Multi-Layer          │
│  Sports Data    │      Cost Optimization    │
└─────────────────┴───────────────────────────┘
```

### Core Components

#### 1. Trinity AI Agents
- **Oracle Agent**: Predictions with explainable AI
- **Sentinel Agent**: Monitoring and alerts
- **Sage Agent**: Strategic advisory

#### 2. MCP (Model Context Protocol) Servers
- **Sports Data Server**: Multi-provider data integration
- **ML Pipeline Server**: Model training and inference
- **Analytics Server**: Performance analytics
- **Alerts Server**: Real-time notifications

#### 3. Data Management
- **TimescaleDB**: Time-series storage with compression
- **Redis**: Multi-layer intelligent caching
- **Cost Optimization**: $150/month target achieved

#### 4. Real-time Processing
- **Sub-200ms response times**
- **WebSocket integration**
- **Event-driven architecture**

## Development Workflow

### Daily Development

```bash
# Start your day
npm run docker:up           # Start databases
npm run dev:sportintel      # Start all dev servers

# Make changes, then test
npm run test:sportintel     # Run tests
npm run lint:sportintel     # Lint code

# Before committing
npm run test:sportintel -- --coverage
npm run build:sportintel    # Ensure builds work
```

### Development Commands

```bash
# Development server management
npm run dev:sportintel      # Start all servers
npm run dev:server          # Backend only
npm run dev:frontend        # Frontend only
npm run dev:ml              # ML pipeline only

# Testing
npm run test:sportintel     # Run all tests
npm run test:watch          # Watch mode
npm run test:integration    # Integration tests only

# Database management
npm run db:migrate:dev      # Run migrations
npm run db:seed:dev         # Seed test data
npm run db:reset:dev        # Reset everything
npm run cache:clear         # Clear Redis cache

# Code quality
npm run lint:sportintel     # Lint code
npm run format:sportintel   # Format code

# Docker management
npm run docker:up           # Start services
npm run docker:down         # Stop services
npm run docker:logs         # View logs
npm run docker:rebuild      # Rebuild containers

# Utilities
npm run health:check        # Health check
npm run metrics             # View metrics
```

### CLI Development Tools

SportIntel includes a comprehensive CLI tool for development:

```bash
# Install CLI globally (optional)
npm link

# Available commands
sportintel-dev init         # Initialize environment
sportintel-dev start        # Start dev servers
sportintel-dev test         # Run tests
sportintel-dev db migrate   # Database operations
sportintel-dev generate agent MyAgent  # Code generation
sportintel-dev lint --fix   # Lint and fix
sportintel-dev build        # Production build
sportintel-dev clean        # Clean artifacts
sportintel-dev info         # System information
```

## Testing

### Test Structure

```
src/test/sportintel/
├── setup.ts                # Jest configuration
├── utils/                  # Test utilities
├── fixtures/               # Test data
├── integration/            # Integration tests
└── unit/                   # Unit tests
```

### Running Tests

```bash
# All tests
npm run test:sportintel

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:sportintel -- --coverage

# Specific test file
npm test -- src/agents/sportintel/sports-oracle-agent.test.ts

# Integration tests only
npm run test:integration

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Writing Tests

Use the provided test utilities:

```typescript
import { SportIntelTestUtils } from '../../test/sportintel/setup';

describe('MyComponent', () => {
  it('should process player data', () => {
    const mockPlayer = SportIntelTestUtils.createMockPlayerData({
      name: 'Test Player',
      salary: 8000
    });
    
    // Your test code here
    expect(mockPlayer.salary).toBe(8000);
  });
});
```

## Database Management

### Database Structure

```sql
-- Core schemas
sportintel.*     -- Sports data (players, games, predictions)
analytics.*      -- Performance metrics and analysis
cache.*          -- Cache statistics and management
```

### Common Operations

```bash
# View database health
npm run db:health

# Reset everything (careful!)
npm run db:reset:dev

# View statistics
npm run db:stats

# Export schema documentation
ts-node scripts/sportintel/database-utils.ts export-schema
```

### Migrations

Create new migrations in `scripts/migrations/`:

```bash
# Create migration
touch scripts/migrations/$(date +%Y%m%d%H%M%S)_add_new_table.sql

# Run migrations
npm run db:migrate:dev
```

### Seeding Data

Test data is automatically seeded with realistic sports data:

- NFL teams and players
- Sample games and schedules
- Market data and predictions
- Performance metrics

## Configuration

### Environment Variables

SportIntel uses a hierarchical configuration system:

```bash
# Core environment
NODE_ENV=development
DEBUG=sportintel:*

# Database connections
TIMESCALE_HOST=localhost
TIMESCALE_DATABASE=sportintel_dev
REDIS_HOST=localhost

# API providers (optional for development)
API_SPORTS_KEY=your_key_here
MYSPORTS_USERNAME=your_username
MYSPORTS_PASSWORD=your_password

# Features (enable/disable functionality)
ENABLE_EXPLAINABLE_AI=true
ENABLE_REAL_TIME_PREDICTIONS=true
ENABLE_MOCK_DATA=true
```

### Configuration Management

```typescript
import { SportIntelConfigManager } from './config/sportintel/development-config';

const config = SportIntelConfigManager.getInstance();

// Get configuration sections
const dbConfig = config.getSection('database');
const features = config.getSection('features');

// Check feature flags
if (config.isFeatureEnabled('explainableAI')) {
  // Enable SHAP/LIME integration
}

// Environment checks
if (config.isDevelopment()) {
  // Development-specific logic
}
```

## Troubleshooting

### Common Issues

#### "Cannot connect to database"
```bash
# Check if Docker services are running
docker-compose -f docker-compose.sportintel.yml ps

# Restart services
npm run docker:down
npm run docker:up

# Check logs
npm run docker:logs
```

#### "Redis connection failed"
```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Clear cache if corrupted
npm run cache:clear
```

#### "Tests failing"
```bash
# Reset test database
NODE_ENV=testing npm run db:reset:dev

# Run with verbose output
npm run test:sportintel -- --verbose

# Check test setup
cat src/test/sportintel/setup.ts
```

#### "Port already in use"
```bash
# Kill processes using default ports
lsof -ti:3000,3001,5432,6379 | xargs kill -9

# Or use different ports
PORT=3002 npm run dev:frontend
```

#### "Mock data not loading"
```bash
# Enable mock mode
echo "ENABLE_MOCK_DATA=true" >> .env.local

# Check mock data files
ls -la test-data/
```

### Debug Mode

Enable comprehensive debugging:

```bash
# Debug everything
DEBUG=* npm run dev:sportintel

# Debug specific modules
DEBUG=sportintel:agents:* npm run dev:server
DEBUG=sportintel:cache:* npm run dev:server
DEBUG=sportintel:ml:* npm run dev:ml
```

### Performance Monitoring

```bash
# View real-time metrics
curl http://localhost:9090/metrics

# Health check
curl http://localhost:3001/health

# Cache statistics
redis-cli -h localhost -p 6379 info stats
```

## Contributing

### Code Style

- **TypeScript** with strict mode enabled
- **ESLint** and **Prettier** for formatting
- **Jest** for testing with >90% coverage
- **Conventional Commits** for commit messages

### Pull Request Process

1. **Fork and clone** the repository
2. **Create feature branch** from `develop`
3. **Make changes** with tests
4. **Run quality checks**:
   ```bash
   npm run lint:sportintel
   npm run test:sportintel -- --coverage
   npm run build:sportintel
   ```
5. **Submit pull request** with clear description

### Code Generation

Generate boilerplate code quickly:

```bash
# Generate new agent
npm run generate agent MyNewAgent

# Generate React component  
npm run generate component MyComponent

# Generate test file
npm run generate test MyModule
```

### Development Best Practices

- **Test-driven development** - Write tests first
- **Small, focused commits** - Easy to review and revert
- **Documentation** - Update docs with changes
- **Type safety** - Leverage TypeScript fully
- **Performance** - Monitor sub-200ms response times
- **Cost awareness** - Stay within $150/month budget

### Project Structure

```
openconductor/
├── src/
│   ├── agents/sportintel/          # Trinity AI agents
│   ├── cache/sportintel/           # Caching system
│   ├── config/sportintel/          # Configuration
│   ├── mcp/sportintel/             # MCP servers
│   ├── plugins/sportintel/         # Data plugins
│   ├── processing/sportintel/      # Real-time processing
│   ├── storage/sportintel/         # Data storage
│   └── test/sportintel/            # Test utilities
├── scripts/sportintel/             # Development scripts
├── frontend/                       # React frontend
├── docker-compose.sportintel.yml   # Docker services
└── docs/                          # Documentation
```

## Resources

### Documentation
- [OpenConductor Architecture](../ARCHITECTURE.md)
- [MCP Protocol Spec](../MCP.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [API Reference](http://localhost:3001/docs)

### External APIs
- [API-Sports Documentation](https://www.api-sports.io/documentation)
- [MySportsFeeds API](https://www.mysportsfeeds.com/data-feeds/api-docs/)
- [ESPN API Reference](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)

### Tools
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Redis Documentation](https://redis.io/documentation)
- [SHAP for Explainable AI](https://shap.readthedocs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Getting Help

- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Architecture and implementation questions
- **Slack/Discord** - Real-time development chat
- **Documentation** - Comprehensive guides and API docs

Happy coding! 🏟️⚡

---

*SportIntel: The Bloomberg Terminal for Sports Analytics*
*Built on OpenConductor with Trinity AI Architecture*