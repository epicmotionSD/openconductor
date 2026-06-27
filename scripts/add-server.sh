#!/bin/bash

# Quick script to add a server to OpenConductor registry
# Usage: ./scripts/add-server.sh

set -e

echo "🚀 OpenConductor - Add Server to Registry"
echo "=========================================="
echo ""

# Database connection string (from environment variable)
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    exit 1
fi

# Parse connection string for psql
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

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
SERVER_ID=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$SQL" | tr -d ' ')

if [ -z "$SERVER_ID" ]; then
    echo "❌ Failed to add server"
    exit 1
fi

echo "✅ Server added with ID: $SERVER_ID"

# Add stats
echo "📊 Adding initial stats..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
INSERT INTO server_stats (server_id, github_stars, cli_installs)
VALUES ('$SERVER_ID', 0, 0);"

echo "✅ Stats added"
echo ""
echo "🎉 Server successfully added to registry!"
echo ""
echo "View it at: https://openconductor.ai/servers/$SLUG"
echo "API: https://openconductor.ai/api/v1/servers?query=$SLUG"
echo ""
