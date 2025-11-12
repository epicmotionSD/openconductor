#!/bin/bash
# Generate Claude Desktop MCP Configuration
# This script reads .env and generates a personalized MCP config

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
TEMPLATE_FILE="$PROJECT_ROOT/claude_desktop_config.template.json"
CLAUDE_CONFIG_DIR="$HOME/.config/claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo "🔧 OpenConductor MCP Configuration Generator"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    echo "   Please create .env file with required variables."
    exit 1
fi

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Error: Template file not found at $TEMPLATE_FILE"
    echo "   Please ensure claude_desktop_config.template.json exists."
    exit 1
fi

# Load environment variables
echo "📖 Loading environment variables from .env..."
set -a
source "$ENV_FILE"
set +a

# Validate required variables
MISSING_VARS=()
[ -z "$GITHUB_TOKEN" ] && MISSING_VARS+=("GITHUB_TOKEN")
[ -z "$DATABASE_URL" ] && MISSING_VARS+=("DATABASE_URL")
[ -z "$REDIS_URL" ] && MISSING_VARS+=("REDIS_URL")

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

echo "✅ All required variables found"
echo ""

# Create Claude config directory if it doesn't exist
if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "📁 Creating Claude config directory: $CLAUDE_CONFIG_DIR"
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

# Backup existing config
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    BACKUP_FILE="$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Backing up existing config to: $BACKUP_FILE"
    cp "$CLAUDE_CONFIG_FILE" "$BACKUP_FILE"
fi

# Generate config by substituting environment variables
echo "🔨 Generating MCP configuration..."

# Read template and substitute variables
CONFIG_CONTENT=$(cat "$TEMPLATE_FILE")

# Substitute all environment variables
CONFIG_CONTENT="${CONFIG_CONTENT//\$\{GITHUB_TOKEN\}/$GITHUB_TOKEN}"
CONFIG_CONTENT="${CONFIG_CONTENT//\$\{DATABASE_URL\}/$DATABASE_URL}"
CONFIG_CONTENT="${CONFIG_CONTENT//\$\{REDIS_URL\}/$REDIS_URL}"

# Handle optional SUPABASE_DATABASE_URL
if [ -n "$SUPABASE_DATABASE_URL" ]; then
    CONFIG_CONTENT="${CONFIG_CONTENT//\$\{SUPABASE_DATABASE_URL\}/$SUPABASE_DATABASE_URL}"
    echo "✅ Supabase database configured"
else
    # If SUPABASE_DATABASE_URL is not set, use DATABASE_URL as fallback
    CONFIG_CONTENT="${CONFIG_CONTENT//\$\{SUPABASE_DATABASE_URL\}/$DATABASE_URL}"
    echo "⚠️  Supabase database not configured, using local DATABASE_URL"
fi

# Update paths to use actual project root
CONFIG_CONTENT="${CONFIG_CONTENT//\/home\/roizen\/projects\/openconductor/$PROJECT_ROOT}"

# Write to Claude config file
echo "$CONFIG_CONTENT" > "$CLAUDE_CONFIG_FILE"

echo "✅ Configuration written to: $CLAUDE_CONFIG_FILE"
echo ""

# Summary
echo "📊 Configuration Summary"
echo "========================"
echo "GitHub Token: ${GITHUB_TOKEN:0:10}..."
echo "Database URL: $DATABASE_URL"
echo "Redis URL: $REDIS_URL"
[ -n "$SUPABASE_DATABASE_URL" ] && echo "Supabase URL: ${SUPABASE_DATABASE_URL:0:30}..."
echo ""

# Validate JSON
if command -v jq &> /dev/null; then
    if jq empty "$CLAUDE_CONFIG_FILE" 2>/dev/null; then
        echo "✅ Configuration JSON is valid"
    else
        echo "❌ Warning: Generated JSON may be invalid"
        echo "   Please check $CLAUDE_CONFIG_FILE manually"
    fi
else
    echo "⚠️  'jq' not found - skipping JSON validation"
    echo "   Install jq to enable validation: sudo apt install jq"
fi

echo ""
echo "🎉 MCP Configuration Complete!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop to load the new configuration"
echo "2. Test MCP servers by asking Claude to:"
echo "   - List files in OpenConductor packages"
echo "   - Query the database"
echo "   - Check Redis connection"
echo ""
echo "📖 For more information, see MCP_SETUP.md"
