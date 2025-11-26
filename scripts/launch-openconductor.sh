#!/bin/bash

# OpenConductor Launch Script
# Starts the full OpenConductor platform with all services

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Launching OpenConductor Platform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env files exist
echo "🔍 Checking configuration..."
if [ ! -f "packages/api/.env" ]; then
    echo "❌ packages/api/.env not found"
    echo "Please create it from packages/api/.env.example"
    exit 1
fi
echo "✅ API configuration found"

if [ ! -f "packages/frontend/.env.local" ]; then
    echo "⚠️  Frontend .env.local not found (optional)"
else
    echo "✅ Frontend configuration found"
fi
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Check database connection
echo "🔍 Checking database connection..."
DB_PORT=$(grep "^DB_PORT=" packages/api/.env | cut -d'=' -f2 | tr -d '"')
DB_HOST=$(grep "^DB_HOST=" packages/api/.env | cut -d'=' -f2 | tr -d '"')
DB_NAME=$(grep "^DB_NAME=" packages/api/.env | cut -d'=' -f2 | tr -d '"')

if [ -z "$DB_PORT" ]; then
    DB_PORT="5432"
fi

if [ -z "$DB_HOST" ]; then
    DB_HOST="localhost"
fi

if command -v pg_isready &> /dev/null; then
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
        echo "✅ PostgreSQL is running on $DB_HOST:$DB_PORT"
    else
        echo "⚠️  PostgreSQL connection check failed"
        echo "   Attempting to connect to: $DB_HOST:$DB_PORT"
        echo "   Database will be checked when API starts..."
    fi
else
    echo "⚠️  pg_isready not found, skipping database check"
    echo "   Database will be checked when API starts..."
fi
echo ""

# Display service information
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Services Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Frontend:  http://localhost:3000"
echo "🔌 API:       http://localhost:3002"
echo "🗄️  Database:  $DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tip: The OpenConductor CLI is available separately:"
echo "   npm install -g @openconductor/cli"
echo "   openconductor search postgres"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run dev servers
npm run dev
