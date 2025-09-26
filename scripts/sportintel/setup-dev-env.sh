#!/bin/bash

# SportIntel Development Environment Setup Script
# Extends OpenConductor development environment with sports analytics tools

set -e

echo "🏟️  SportIntel Development Environment Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SPORTINTEL_ENV_FILE="$PROJECT_ROOT/.env.sportintel"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.sportintel.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_NODE_VERSION="18.0.0"
    
    if ! npx semver -r ">=$REQUIRED_NODE_VERSION" "$NODE_VERSION" &> /dev/null; then
        log_error "Node.js version $NODE_VERSION is not supported. Please upgrade to Node.js 18+."
        exit 1
    fi
    
    log_success "Node.js $NODE_VERSION is supported"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
    
    # Check Python (for ML components)
    if ! command -v python3 &> /dev/null; then
        log_warning "Python 3 is not installed. Some ML features may not work."
    else
        PYTHON_VERSION=$(python3 --version | sed 's/Python //')
        log_success "Python $PYTHON_VERSION is available"
    fi
    
    # Check Redis CLI (optional)
    if command -v redis-cli &> /dev/null; then
        log_success "Redis CLI is available"
    else
        log_warning "Redis CLI is not installed. Install it for debugging cache issues."
    fi
}

create_environment_file() {
    log_info "Creating SportIntel environment configuration..."
    
    if [ -f "$SPORTINTEL_ENV_FILE" ]; then
        log_warning "Environment file already exists. Creating backup..."
        cp "$SPORTINTEL_ENV_FILE" "$SPORTINTEL_ENV_FILE.backup.$(date +%s)"
    fi
    
    cat > "$SPORTINTEL_ENV_FILE" << 'EOF'
# SportIntel Development Environment Configuration
# Copy this file to .env.local and customize for your setup

# Environment
NODE_ENV=development
DEBUG=sportintel:*

# Database Configuration
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DATABASE=sportintel_dev
TIMESCALE_USERNAME=sportintel
TIMESCALE_PASSWORD=dev_password_change_me
TIMESCALE_SSL=false

# Redis Configuration  
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DATABASE=1
REDIS_MAX_MEMORY=512mb

# API Keys (Required for real data - use mock data if not available)
API_SPORTS_KEY=your_api_sports_key_here
MYSPORTS_USERNAME=your_mysports_username
MYSPORTS_PASSWORD=your_mysports_password

# Security
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
BCRYPT_ROUNDS=8

# Features
ENABLE_EXPLAINABLE_AI=true
ENABLE_REAL_TIME_PREDICTIONS=true
ENABLE_PORTFOLIO_OPTIMIZATION=true
ENABLE_ALERT_SYSTEM=true
ENABLE_PERFORMANCE_MONITORING=true

# Mock Data (Enable for development without API keys)
ENABLE_MOCK_DATA=true
MOCK_API_LATENCY=100
MOCK_ERROR_RATE=0

# Monitoring
PROMETHEUS_PORT=9090
HEALTH_CHECK_INTERVAL=60000

# Logging
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_TO_CONSOLE=true
ENABLE_PROFILER=true

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3003

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL_PLAYERS=60
CACHE_TTL_GAMES=30
CACHE_TTL_MARKET=10
CACHE_TTL_PREDICTIONS=300

# Testing
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/sportintel_test
TEST_REDIS_URL=redis://localhost:6379/3

# Alert Configuration (Optional)
# ALERT_EMAILS=dev@sportintel.ai,alerts@sportintel.ai
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
# ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
EOF
    
    log_success "Environment file created at $SPORTINTEL_ENV_FILE"
    log_warning "Please edit $SPORTINTEL_ENV_FILE and add your API keys"
}

install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install main dependencies
    npm install
    
    # Install SportIntel-specific dependencies
    npm install --save \
        redis \
        ioredis \
        pg \
        @types/pg \
        timescale \
        @tensorflow/tfjs-node \
        ml-matrix \
        compromise \
        natural \
        sentiment \
        lodash \
        moment-timezone \
        uuid \
        joi \
        bcryptjs \
        jsonwebtoken \
        cors \
        helmet \
        express-rate-limit \
        compression \
        morgan \
        winston \
        winston-daily-rotate-file
    
    # Install development dependencies
    npm install --save-dev \
        @types/bcryptjs \
        @types/jsonwebtoken \
        @types/lodash \
        @types/uuid \
        @types/jest \
        @types/supertest \
        jest \
        supertest \
        ts-jest \
        nodemon \
        concurrently \
        wait-for-it \
        eslint-plugin-jest
    
    # Install Python dependencies for ML pipeline
    if command -v python3 &> /dev/null; then
        log_info "Installing Python ML dependencies..."
        
        # Create virtual environment
        python3 -m venv venv
        source venv/bin/activate
        
        pip install --upgrade pip
        pip install \
            pandas \
            numpy \
            scikit-learn \
            xgboost \
            lightgbm \
            shap \
            lime \
            joblib \
            fastapi \
            uvicorn \
            pydantic \
            redis \
            psycopg2-binary \
            python-dotenv \
            pytest \
            pytest-asyncio
        
        deactivate
        log_success "Python ML dependencies installed"
    fi
    
    log_success "Dependencies installed successfully"
}

setup_database() {
    log_info "Setting up development databases..."
    
    # Start Docker services
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        log_info "Starting Docker services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d timescaledb redis
        
        # Wait for services to be ready
        log_info "Waiting for databases to be ready..."
        
        # Wait for TimescaleDB
        timeout=60
        while ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T timescaledb pg_isready -U sportintel > /dev/null 2>&1; do
            sleep 1
            timeout=$((timeout - 1))
            if [ $timeout -eq 0 ]; then
                log_error "TimescaleDB failed to start within 60 seconds"
                exit 1
            fi
        done
        
        # Wait for Redis
        timeout=60
        while ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; do
            sleep 1
            timeout=$((timeout - 1))
            if [ $timeout -eq 0 ]; then
                log_error "Redis failed to start within 60 seconds"
                exit 1
            fi
        done
        
        log_success "Databases are ready"
        
        # Run database migrations
        log_info "Running database migrations..."
        npm run db:migrate:dev
        
        # Seed with test data
        log_info "Seeding database with test data..."
        npm run db:seed:dev
        
        log_success "Database setup complete"
    else
        log_warning "Docker compose file not found. Please set up databases manually."
    fi
}

create_development_scripts() {
    log_info "Creating development scripts..."
    
    # Create package.json scripts for SportIntel development
    cat > "$PROJECT_ROOT/package.sportintel.json" << 'EOF'
{
  "scripts": {
    "dev:sportintel": "concurrently \"npm run dev:server\" \"npm run dev:frontend\" \"npm run dev:ml\"",
    "dev:server": "nodemon --exec ts-node src/sportintel-server.ts",
    "dev:frontend": "cd frontend && npm start",
    "dev:ml": "source venv/bin/activate && python src/ml/sportintel/ml-server.py",
    "test:sportintel": "jest --config jest.sportintel.config.js",
    "test:watch": "jest --config jest.sportintel.config.js --watch",
    "test:integration": "jest --config jest.sportintel.config.js --testPathPattern=integration",
    "db:migrate:dev": "ts-node scripts/sportintel/migrate-database.ts",
    "db:seed:dev": "ts-node scripts/sportintel/seed-test-data.ts",
    "db:reset:dev": "npm run db:drop:dev && npm run db:migrate:dev && npm run db:seed:dev",
    "db:drop:dev": "ts-node scripts/sportintel/drop-database.ts",
    "cache:clear": "redis-cli -h localhost -p 6379 -n 1 FLUSHDB",
    "cache:monitor": "redis-cli -h localhost -p 6379 -n 1 MONITOR",
    "docker:up": "docker-compose -f docker-compose.sportintel.yml up -d",
    "docker:down": "docker-compose -f docker-compose.sportintel.yml down",
    "docker:logs": "docker-compose -f docker-compose.sportintel.yml logs -f",
    "docker:rebuild": "docker-compose -f docker-compose.sportintel.yml up -d --build",
    "lint:sportintel": "eslint 'src/sportintel/**/*.ts' 'src/agents/sportintel/**/*.ts'",
    "format:sportintel": "prettier --write 'src/sportintel/**/*.{ts,tsx}' 'src/agents/sportintel/**/*.{ts,tsx}'",
    "build:sportintel": "tsc --project tsconfig.sportintel.json",
    "start:prod": "node dist/sportintel-server.js",
    "health:check": "curl http://localhost:3001/health",
    "metrics": "curl http://localhost:9090/metrics"
  }
}
EOF

    # Create TypeScript config for SportIntel
    cat > "$PROJECT_ROOT/tsconfig.sportintel.json" << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@sportintel/*": ["sportintel/*"],
      "@agents/*": ["agents/*"],
      "@cache/*": ["cache/*"],
      "@config/*": ["config/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/sportintel/**/*.ts",
    "src/agents/sportintel/**/*.ts",
    "src/cache/sportintel/**/*.ts",
    "src/config/sportintel/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
EOF

    # Create Jest config for SportIntel testing
    cat > "$PROJECT_ROOT/jest.sportintel.config.js" << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/sportintel/**/*.test.ts',
    '**/sportintel/**/*.spec.ts',
    '**/agents/sportintel/**/*.test.ts',
    '**/cache/sportintel/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/sportintel/**/*.ts',
    'src/agents/sportintel/**/*.ts',
    'src/cache/sportintel/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts'
  ],
  coverageDirectory: 'coverage/sportintel',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/sportintel/setup.ts'],
  moduleNameMapping: {
    '^@sportintel/(.*)$': '<rootDir>/src/sportintel/$1',
    '^@agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@cache/(.*)$': '<rootDir>/src/cache/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true
};
EOF

    log_success "Development scripts created"
}

create_vscode_config() {
    log_info "Creating VS Code configuration..."
    
    mkdir -p "$PROJECT_ROOT/.vscode"
    
    # Launch configuration
    cat > "$PROJECT_ROOT/.vscode/launch.json" << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug SportIntel Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/sportintel-server.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/.env.sportintel",
      "runtimeArgs": ["-r", "ts-node/register"],
      "sourceMaps": true,
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "Debug SportIntel Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--config",
        "jest.sportintel.config.js",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "NODE_ENV": "testing"
      },
      "envFile": "${workspaceFolder}/.env.sportintel"
    },
    {
      "name": "Debug Current Test File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--config",
        "jest.sportintel.config.js",
        "--runInBand",
        "${relativeFile}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
EOF

    # Tasks configuration
    cat > "$PROJECT_ROOT/.vscode/tasks.json" << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start SportIntel Development",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev:sportintel"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "Run SportIntel Tests",
      "type": "shell",
      "command": "npm",
      "args": ["run", "test:sportintel"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Docker Up",
      "type": "shell",
      "command": "npm",
      "args": ["run", "docker:up"],
      "group": "build"
    },
    {
      "label": "Docker Down",
      "type": "shell",
      "command": "npm",
      "args": ["run", "docker:down"],
      "group": "build"
    }
  ]
}
EOF

    # Extensions recommendations
    cat > "$PROJECT_ROOT/.vscode/extensions.json" << 'EOF'
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-python.python",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer",
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "streetsidesoftware.code-spell-checker",
    "gruntfuggly.todo-tree",
    "pkief.material-icon-theme"
  ]
}
EOF

    log_success "VS Code configuration created"
}

print_summary() {
    log_success "SportIntel Development Environment Setup Complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit $SPORTINTEL_ENV_FILE and add your API keys"
    echo "2. Run: npm run docker:up (to start databases)"
    echo "3. Run: npm run dev:sportintel (to start development servers)"
    echo "4. Visit: http://localhost:3000 (SportIntel frontend)"
    echo "5. Visit: http://localhost:3001/health (API health check)"
    echo ""
    echo "🔧 Available Commands:"
    echo "  npm run dev:sportintel     - Start all development servers"
    echo "  npm run test:sportintel    - Run tests"
    echo "  npm run docker:up          - Start databases"
    echo "  npm run cache:clear        - Clear Redis cache"
    echo "  npm run db:reset:dev       - Reset and seed database"
    echo ""
    echo "📚 Documentation:"
    echo "  - API: http://localhost:3001/docs"
    echo "  - Metrics: http://localhost:9090/metrics"
    echo "  - Logs: tail -f logs/sportintel.log"
    echo ""
    log_warning "Remember to configure your API keys in $SPORTINTEL_ENV_FILE"
}

# Main execution
main() {
    echo "Starting SportIntel development environment setup..."
    
    check_prerequisites
    create_environment_file
    install_dependencies
    setup_database
    create_development_scripts
    create_vscode_config
    print_summary
    
    log_success "Setup completed successfully! 🏟️"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi