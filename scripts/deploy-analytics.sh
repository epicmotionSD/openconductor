#!/bin/bash

# OpenConductor Ecosystem Analytics - Production Deployment Script
# This script deploys the complete analytics infrastructure

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  OpenConductor Ecosystem Analytics Deployment             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable not set${NC}"
    echo -e "${YELLOW}Set it with: export DATABASE_URL='your-postgres-url'${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Database URL configured"
echo ""

# Step 1: Run database migration
echo -e "${BLUE}━━━ Step 1: Running Database Migration ━━━${NC}"
echo ""

if psql "$DATABASE_URL" -f packages/api/src/db/migrations/002_ecosystem_analytics.sql; then
    echo -e "${GREEN}✓${NC} Database migration completed successfully"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

echo ""

# Step 2: Add FlexaSports to registry
echo -e "${BLUE}━━━ Step 2: Adding FlexaSports MCP Server ━━━${NC}"
echo ""

if psql "$DATABASE_URL" -f packages/api/scripts/add-flexasports-server.sql; then
    echo -e "${GREEN}✓${NC} FlexaSports server added to registry"
else
    echo -e "${RED}❌ FlexaSports setup failed${NC}"
    exit 1
fi

echo ""

# Step 3: Verify database setup
echo -e "${BLUE}━━━ Step 3: Verifying Database Setup ━━━${NC}"
echo ""

TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('ecosystem_events', 'user_journeys', 'discovery_matrix', 'install_velocity');")

if [ "$TABLES" -eq 4 ]; then
    echo -e "${GREEN}✓${NC} All 4 analytics tables verified"
else
    echo -e "${RED}❌ Expected 4 tables, found $TABLES${NC}"
    exit 1
fi

TRIGGERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE '%ecosystem%' OR trigger_name LIKE '%velocity%' OR trigger_name LIKE '%journey%';")

if [ "$TRIGGERS" -ge 3 ]; then
    echo -e "${GREEN}✓${NC} All triggers verified"
else
    echo -e "${YELLOW}⚠${NC}  Expected 3+ triggers, found $TRIGGERS"
fi

echo ""

# Step 4: Build packages
echo -e "${BLUE}━━━ Step 4: Building Packages ━━━${NC}"
echo ""

echo "Building shared package..."
cd packages/shared
if npm run build; then
    echo -e "${GREEN}✓${NC} Shared package built"
else
    echo -e "${RED}❌ Shared package build failed${NC}"
    exit 1
fi

cd ../..

echo "Building API..."
cd packages/api
if npm run build; then
    echo -e "${GREEN}✓${NC} API built"
else
    echo -e "${RED}❌ API build failed${NC}"
    exit 1
fi

cd ../..

echo ""

# Step 5: Deploy API
echo -e "${BLUE}━━━ Step 5: Deploying API to Production ━━━${NC}"
echo ""

echo -e "${YELLOW}Running: vercel deploy --prod${NC}"
echo ""

# Deploy API (this will deploy the entire project including frontend)
if vercel deploy --prod --yes; then
    echo -e "${GREEN}✓${NC} Production deployment completed"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""

# Step 6: Test analytics endpoints
echo -e "${BLUE}━━━ Step 6: Testing Analytics Endpoints ━━━${NC}"
echo ""

# Get the production URL from Vercel
PROD_URL=$(vercel ls openconductor --prod 2>/dev/null | grep "openconductor" | head -1 | awk '{print $2}')

if [ -z "$PROD_URL" ]; then
    echo -e "${YELLOW}⚠${NC}  Could not auto-detect production URL"
    echo -e "${YELLOW}Please test manually at: https://openconductor.ai/v1/analytics/health${NC}"
else
    echo "Testing health endpoint at: https://$PROD_URL/v1/analytics/health"

    if curl -s "https://$PROD_URL/v1/analytics/health" | grep -q "success"; then
        echo -e "${GREEN}✓${NC} Analytics API is healthy"
    else
        echo -e "${YELLOW}⚠${NC}  Health check did not return expected response"
    fi
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Start real-time monitoring:"
echo -e "   ${YELLOW}DATABASE_URL=\$DATABASE_URL node scripts/real-time-monitor.js${NC}"
echo ""
echo "2. Test analytics endpoints:"
echo -e "   ${YELLOW}curl https://api.openconductor.ai/v1/analytics/health${NC}"
echo -e "   ${YELLOW}curl https://api.openconductor.ai/v1/analytics/summary${NC}"
echo ""
echo "3. Monitor API logs for first events"
echo ""
echo "4. Publish updated CLI:"
echo -e "   ${YELLOW}cd packages/cli && npm publish${NC}"
echo ""
echo -e "${GREEN}Ready to track ecosystem growth! 🚀${NC}"
echo ""
