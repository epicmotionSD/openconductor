#!/bin/bash

# Pull seed data from Supabase using REST API
# This exports data to JSON files that can be imported into local PostgreSQL

set -e

echo "📥 Pulling data from Supabase..."
echo ""

SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"
    exit 1
fi

OUTPUT_DIR="seed-data"
mkdir -p $OUTPUT_DIR

# List of tables to export
TABLES=(
    "mcp_servers"
    "server_stats"
    "server_versions"
    "discovery_sources"
)

echo "📊 Exporting tables..."
echo ""

for table in "${TABLES[@]}"; do
    echo "   Fetching: $table"
    curl -s "${SUPABASE_URL}/rest/v1/${table}?limit=10000" \
        -H "apikey: ${SUPABASE_KEY}" \
        -H "Content-Type: application/json" \
        > "${OUTPUT_DIR}/${table}.json"

    # Count records
    count=$(cat "${OUTPUT_DIR}/${table}.json" | jq '. | length' 2>/dev/null || echo "unknown")
    echo "      ✓ Exported $count records to ${OUTPUT_DIR}/${table}.json"
done

echo ""
echo "✅ Data exported successfully!"
echo ""
echo "📁 Files created in ${OUTPUT_DIR}/"
ls -lh ${OUTPUT_DIR}/
echo ""
echo "Next steps:"
echo "1. Run: ./fix-pg-auth.sh (if not done)"
echo "2. Run: ./import-seed-data.sh"
echo ""
