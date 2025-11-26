#!/bin/bash

# Pull seed data from Supabase using REST API
# This exports data to JSON files that can be imported into local PostgreSQL

set -e

echo "📥 Pulling data from Supabase..."
echo ""

SUPABASE_URL="https://fjmzvcipimpctqnhhfrr.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbXp2Y2lwaW1wY3RxbmhoZnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjYzMTAsImV4cCI6MjA3NDk0MjMxMH0.zFLo3tHYMR9-ctFbGFNwquAfs6TWK0p1RzXICDXvj_E"

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
