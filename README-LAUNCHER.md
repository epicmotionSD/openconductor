# 🚀 OpenConductor Ecosystem Launcher

## Quick Start

```bash
# Launch the entire OpenConductor ecosystem
./launch-openconductor.sh
```

## Port Allocation

The launcher uses the following ports to avoid conflicts:

- **API Server**: `3005` (was 3002, but reserved)
- **Frontend**: `3006` (main application)
- **Admin Panel**: `3006/admin` (same frontend, admin routes)
- **OpenTelemetry**: `4319` (monitoring/tracing)

## Access Points

Once launched, access your OpenConductor ecosystem:

- 🌐 **Main App**: http://localhost:3006
- 🔧 **Admin Dashboard**: http://localhost:3006/admin
- 📡 **API**: http://localhost:3005/v1/servers
- 📊 **Launch Tracker**: `file://$(pwd)/launch-dashboard.html`

## Features

### ✅ Automated Services
- **API Server** with Phase 2 enterprise features
- **Frontend** with Next.js hot reload
- **GitHub Sync Worker** (60min intervals)
- **Background Job Processor** (30sec polling)
- **OpenTelemetry Tracing**

### ✅ Environment Configuration
- **Supabase Database** integration
- **Environment variables** properly set
- **Port conflict detection**
- **Graceful shutdown** (Ctrl+C)

### ✅ DevOps Best Practices
- **No hardcoded secrets** (using env vars)
- **Process management** with cleanup
- **Health checks** and monitoring
- **Immutable configuration**

## Manual Operations

### Individual Services

```bash
# API Server only (port 3005)
cd packages/api
PORT=3005 pnpm run dev

# Frontend only (port 3006)
cd packages/frontend
PORT=3006 pnpm run dev
```

### Database Operations

```bash
# Seed database with MCP servers
cd packages/api
npm run db:seed:127
```

## Troubleshooting

### Port Conflicts
If you get port conflicts, the launcher will detect and abort:
```
❌ Port 3005 is already in use
Cannot start OpenConductor - port conflicts detected
```

### Service Issues
Check individual service logs for detailed error information.

### Reset Environment
```bash
# Stop all Node processes
pkill -f "node\|tsx\|pnpm"

# Clear Next.js cache
rm -rf packages/frontend/.next

# Restart launcher
./launch-openconductor.sh
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│    API Server    │────│   Database      │
│   Port 3006     │    │    Port 3005     │    │   (Supabase)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │  OpenTelemetry   │
                    │   Port 4319      │
                    └──────────────────┘
```

## Environment Variables

The launcher sets these automatically:

```bash
OPENCONDUCTOR_PHASE=phase2
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3005
POSTGRES_URL=postgres://...
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4319/v1/traces
AUTO_START_GITHUB_WORKER=true
AUTO_START_JOB_PROCESSOR=true