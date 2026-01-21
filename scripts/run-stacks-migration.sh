#!/bin/bash
# Run stacks migration on production database

set -e

# Parse DATABASE_URL for psql
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    exit 1
fi

DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "🚀 Running stacks migration on production..."

PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "\timing" \
  -f packages/api/src/db/migrations/create-stacks-tables.sql

echo ""
echo "✅ Migration completed!"
echo ""
echo "Verifying stacks..."
PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT COUNT(*) as stack_count FROM stacks;"

echo ""
echo "🎉 Production database is ready!"
echo ""
echo "Next step: Deploy the API to Railway"
echo "  git add -A"
echo "  git commit -m 'feat: add stacks API endpoint'"
echo "  git push"
echo ""
