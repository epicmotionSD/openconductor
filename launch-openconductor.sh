#!/bin/bash

# OpenConductor Ecosystem Launcher
# Avoids ports 3001, 3002 (reserved), 3004, 4318 (in use)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# OpenConductor Configuration
export OPENCONDUCTOR_API_PORT=3005
export OPENCONDUCTOR_FRONTEND_PORT=3006
export OPENCONDUCTOR_ADMIN_PORT=3007
export OPENCONDUCTOR_OTEL_PORT=4319

echo -e "${BLUE}🚀 OpenConductor Ecosystem Launcher${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Environment setup
export OPENCONDUCTOR_PHASE=phase2
export NODE_ENV=development
export NEXT_PUBLIC_API_URL=http://localhost:${OPENCONDUCTOR_API_PORT}

# Database configuration (using existing Supabase)
export POSTGRES_URL="postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

# OpenTelemetry configuration
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:${OPENCONDUCTOR_OTEL_PORT}/v1/traces

# Worker configuration
export AUTO_START_GITHUB_WORKER=true
export GITHUB_SYNC_INTERVAL=60
export AUTO_START_JOB_PROCESSOR=true
export JOB_POLL_INTERVAL=30

echo -e "${YELLOW}📋 OpenConductor Port Allocation:${NC}"
echo -e "   API Server:    http://localhost:${OPENCONDUCTOR_API_PORT}"
echo -e "   Frontend:      http://localhost:${OPENCONDUCTOR_FRONTEND_PORT}"
echo -e "   Admin Panel:   http://localhost:${OPENCONDUCTOR_FRONTEND_PORT}/admin"
echo -e "   OpenTelemetry: http://localhost:${OPENCONDUCTOR_OTEL_PORT}"
echo ""

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Check all required ports
echo -e "${YELLOW}🔍 Checking port availability...${NC}"
for port in $OPENCONDUCTOR_API_PORT $OPENCONDUCTOR_FRONTEND_PORT $OPENCONDUCTOR_OTEL_PORT; do
    if ! check_port $port; then
        echo -e "${RED}Cannot start OpenConductor - port conflicts detected${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All ports available${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down OpenConductor ecosystem...${NC}"
    # Kill all background processes started by this script
    jobs -p | xargs -r kill
    wait
    echo -e "${GREEN}✅ OpenConductor ecosystem stopped${NC}"
}

trap cleanup EXIT INT TERM

# Start API Server
echo -e "${BLUE}🔧 Starting API Server on port ${OPENCONDUCTOR_API_PORT}...${NC}"
cd packages/api
PORT=${OPENCONDUCTOR_API_PORT} pnpm run dev &
API_PID=$!
cd ../..

# Wait for API to start
sleep 3

# Start Frontend
echo -e "${BLUE}🌐 Starting Frontend on port ${OPENCONDUCTOR_FRONTEND_PORT}...${NC}"
cd packages/frontend
PORT=${OPENCONDUCTOR_FRONTEND_PORT} pnpm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for services to start
sleep 5

echo ""
echo -e "${GREEN}🎉 OpenConductor Ecosystem Started Successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Access Points:${NC}"
echo -e "   🌐 Main App:       http://localhost:${OPENCONDUCTOR_FRONTEND_PORT}"
echo -e "   🔧 Admin Panel:    http://localhost:${OPENCONDUCTOR_FRONTEND_PORT}/admin"
echo -e "   📡 API:           http://localhost:${OPENCONDUCTOR_API_PORT}/v1/servers"
echo -e "   📈 Launch Dashboard: file://$(pwd)/launch-dashboard.html"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Keep script running and show logs
wait