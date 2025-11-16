#!/bin/bash

# Quick script to add a server to OpenConductor registry
# Usage: ./scripts/add-server.sh

set -e

echo "🚀 OpenConductor - Add Server to Registry"
echo "=========================================="
echo ""

# Database connection string
DB_URL="postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

# Prompt for required fields
read -p "Server slug (e.g., 'my-awesome-server'): " SLUG
read -p "Server name (e.g., 'My Awesome Server'): " NAME
read -p "Tagline: " TAGLINE
read -p "GitHub repo URL: " REPO_URL
read -p "Repository owner: " REPO_OWNER
read -p "Repository name: " REPO_NAME
read -p "Category (memory/filesystem/database/api/custom): " CATEGORY

# Optional fields
read -p "NPM package name (optional, press Enter to skip): " NPM_PACKAGE
read -p "Description (optional): " DESCRIPTION

# Defaults
VERIFIED="false"
FEATURED="false"

echo ""
echo "📝 Summary:"
echo "  Slug: $SLUG"
echo "  Name: $NAME"
echo "  Category: $CATEGORY"
echo "  Repo: $REPO_URL"
echo ""
read -p "Proceed with adding this server? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🔄 Adding server to database..."

# Build SQL query
SQL="INSERT INTO mcp_servers (
  slug, name, tagline, description,
  repository_url, repository_owner, repository_name,
  npm_package, category, verified, featured
) VALUES (
  '$SLUG',
  '$NAME',
  '$TAGLINE',
  '${DESCRIPTION:-$TAGLINE}',
  '$REPO_URL',
  '$REPO_OWNER',
  '$REPO_NAME',
  $([ -z "$NPM_PACKAGE" ] && echo "NULL" || echo "'$NPM_PACKAGE'"),
  '$CATEGORY',
  $VERIFIED,
  $FEATURED
) RETURNING id;"

# Execute insert
SERVER_ID=$(PGPASSWORD="29FHVZqmLEcx864X" psql -h aws-1-us-east-1.pooler.supabase.com -p 6543 -U postgres.fjmzvcipimpctqnhhfrr -d postgres -t -c "$SQL" | tr -d ' ')

if [ -z "$SERVER_ID" ]; then
    echo "❌ Failed to add server"
    exit 1
fi

echo "✅ Server added with ID: $SERVER_ID"

# Add stats
echo "📊 Adding initial stats..."
PGPASSWORD="29FHVZqmLEcx864X" psql -h aws-1-us-east-1.pooler.supabase.com -p 6543 -U postgres.fjmzvcipimpctqnhhfrr -d postgres -c "
INSERT INTO server_stats (server_id, github_stars, cli_installs)
VALUES ('$SERVER_ID', 0, 0);"

echo "✅ Stats added"
echo ""
echo "🎉 Server successfully added to registry!"
echo ""
echo "View it at: https://openconductor.ai/servers/$SLUG"
echo "API: https://openconductor.ai/api/v1/servers?query=$SLUG"
echo ""
