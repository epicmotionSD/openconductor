#!/bin/bash

# Ecosystem Tracking Deployment Script
# Automates the deployment of ecosystem tracking across OpenConductor

set -e

echo "🚀 OpenConductor Ecosystem Tracking Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    echo -e "${RED}Error: Must run from OpenConductor root directory${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Checking environment variables...${NC}"
if [ -z "$ECOSYSTEM_DATABASE_URL" ]; then
    if [ -f ".env" ]; then
        source .env
    fi
    if [ -z "$SUPABASE_DATABASE_URL" ]; then
        echo -e "${RED}Error: ECOSYSTEM_DATABASE_URL or SUPABASE_DATABASE_URL not set${NC}"
        echo "Please set in .env file or environment"
        exit 1
    fi
    export ECOSYSTEM_DATABASE_URL=$SUPABASE_DATABASE_URL
fi
echo -e "${GREEN}✓ Environment variables configured${NC}"

echo ""
echo -e "${BLUE}Step 2: Creating ecosystem tracking files...${NC}"

# Create shared ecosystem config
mkdir -p packages/shared/src
cat > packages/shared/src/ecosystem-database-config.ts << 'EOFILE'
/**
 * Ecosystem Database Configuration
 * Shared configuration for tracking across all Sonnier Ventures products
 */

import { z } from 'zod';

// Ecosystem products enumeration
export enum EcosystemProduct {
  OPENCONDUCTOR = 'openconductor',
  FLEXABRAIN = 'flexabrain',
  FLEXASPORTS = 'flexasports',
  SPORTINTEL = 'sportintel',
  X3O_TRINITY = 'x3o_trinity'
}

// User journey stages
export enum UserJourneyStage {
  DISCOVERY = 'discovery',
  INSTALLATION = 'installation',
  ACTIVATION = 'activation',
  ENGAGEMENT = 'engagement',
  RETENTION = 'retention',
  EXPANSION = 'expansion'
}

// Event types for ecosystem tracking
export enum EcosystemEventType {
  SERVER_DISCOVERED = 'server_discovered',
  SERVER_INSTALLED = 'server_installed',
  CLI_COMMAND_RUN = 'cli_command_run',
  API_REQUEST = 'api_request',
  AGENT_CREATED = 'agent_created',
  AGENT_EXECUTED = 'agent_executed',
  ORACLE_PREDICTION = 'oracle_prediction',
  SENTINEL_ALERT = 'sentinel_alert',
  SAGE_ANALYSIS = 'sage_analysis',
  DFS_LINEUP_CREATED = 'dfs_lineup_created',
  PLAYER_ANALYZED = 'player_analyzed',
  CONTEST_ENTERED = 'contest_entered',
  PRODUCT_DISCOVERED = 'product_discovered',
  CROSS_PRODUCT_NAVIGATION = 'cross_product_navigation',
  ECOSYSTEM_SIGNUP = 'ecosystem_signup'
}

export interface EcosystemDatabaseConfig {
  primaryUrl: string;
  readReplicaUrl?: string;
  analyticsUrl?: string;
  cacheUrl?: string;
  poolSize: number;
  connectionTimeout: number;
  ssl: boolean;
}

export const defaultEcosystemDbConfig: EcosystemDatabaseConfig = {
  primaryUrl: process.env.ECOSYSTEM_DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '',
  readReplicaUrl: process.env.ECOSYSTEM_READ_REPLICA_URL,
  analyticsUrl: process.env.ECOSYSTEM_ANALYTICS_URL,
  cacheUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  poolSize: 20,
  connectionTimeout: 5000,
  ssl: process.env.NODE_ENV === 'production'
};
EOFILE

echo -e "${GREEN}✓ Ecosystem configuration created${NC}"

echo ""
echo -e "${BLUE}Step 3: Deploying database schema...${NC}"
PGPASSWORD=$(echo $ECOSYSTEM_DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
PGHOST=$(echo $ECOSYSTEM_DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
PGPORT=$(echo $ECOSYSTEM_DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
PGUSER=$(echo $ECOSYSTEM_DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
PGDATABASE=$(echo $ECOSYSTEM_DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGPASSWORD PGHOST PGPORT PGUSER PGDATABASE

# Create minimal schema for ecosystem servers
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE << 'EOSQL' > /dev/null 2>&1
-- Insert ecosystem servers into registry if they don't exist
INSERT INTO mcp_servers (slug, name, tagline, description, repository_url, repository_owner, repository_name, category, tags, verified, featured)
VALUES 
  ('flexasports-mcp', 
   'FlexaSports MCP', 
   '🏆 AI-Powered DFS Analytics Platform',
   'Professional daily fantasy sports analytics with explainable AI. Multi-sport coverage (NFL, NBA, MLB, NHL) with advanced lineup optimization.',
   'https://github.com/sonnierventures/flexasports-mcp',
   'sonnierventures',
   'flexasports-mcp',
   'api',
   ARRAY['sports', 'dfs', 'analytics', 'ai', 'ecosystem'],
   true,
   true),
  
  ('flexabrain-mcp',
   'FlexaBrain MCP',
   '🧠 Multi-Agent AI Orchestration System',
   'Enterprise multi-agent orchestration with Oracle (predictive), Sentinel (monitoring), and Sage (strategic) agents.',
   'https://github.com/sonnierventures/flexabrain-mcp',
   'sonnierventures',
   'flexabrain-mcp',
   'api',
   ARRAY['ai', 'agents', 'orchestration', 'ecosystem'],
   true,
   true),
  
  ('sportintel-mcp',
   'SportIntel MCP',
   '⚡ Sports Intelligence Engine',
   'Real-time sports data intelligence engine powering FlexaSports and enterprise clients.',
   'https://github.com/sonnierventures/sportintel-mcp',
   'sonnierventures',
   'sportintel-mcp',
   'api',
   ARRAY['sports', 'data', 'intelligence', 'ecosystem'],
   true,
   false),
  
  ('x3o-trinity-mcp',
   'X3O Trinity Dashboard MCP',
   '🎮 Enterprise Orchestration Dashboard',
   'Bloomberg Terminal-style interface for AI agent orchestration.',
   'https://github.com/sonnierventures/x3o-trinity-mcp',
   'sonnierventures',
   'x3o-trinity-mcp',
   'monitoring',
   ARRAY['dashboard', 'monitoring', 'enterprise', 'ecosystem'],
   true,
   false)
ON CONFLICT (slug) DO UPDATE SET
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  verified = EXCLUDED.verified,
  featured = EXCLUDED.featured;
EOSQL

echo -e "${GREEN}✓ Ecosystem servers added to registry${NC}"

echo ""
echo -e "${BLUE}Step 4: Verifying ecosystem servers...${NC}"
SERVERS_COUNT=$(psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -t -c "SELECT COUNT(*) FROM mcp_servers WHERE slug IN ('flexasports-mcp', 'flexabrain-mcp', 'sportintel-mcp', 'x3o-trinity-mcp');" 2>/dev/null | xargs)

if [ "$SERVERS_COUNT" -eq "4" ]; then
    echo -e "${GREEN}✓ All 4 ecosystem servers registered${NC}"
else
    echo -e "${YELLOW}⚠ $SERVERS_COUNT/4 ecosystem servers found${NC}"
fi

echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🌟 Ecosystem Setup Complete! 🌟${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ What's been deployed:${NC}"
echo "  • 4 Ecosystem servers added to registry"
echo "  • FlexaSports MCP - DFS Analytics"
echo "  • FlexaBrain MCP - Multi-Agent Orchestration"
echo "  • SportIntel MCP - Sports Intelligence"
echo "  • X3O Trinity MCP - Enterprise Dashboard"
echo ""
echo -e "${YELLOW}🚀 Try it out:${NC}"
echo -e "  ${BLUE}openconductor discover flexasports${NC}"
echo -e "  ${BLUE}openconductor discover flexabrain${NC}"
echo -e "  ${BLUE}openconductor install flexasports-mcp${NC}"
echo ""
echo -e "${MAGENTA}The Sonnier Ventures ecosystem is now live! 🎯${NC}"
