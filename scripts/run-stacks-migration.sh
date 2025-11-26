#!/bin/bash
# Run stacks migration on production database

set -e

echo "🚀 Running stacks migration on production..."

PGPASSWORD="29FHVZqmLEcx864X" psql \
  -h aws-1-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.fjmzvcipimpctqnhhfrr \
  -d postgres \
  -c "\timing" \
  -f packages/api/src/db/migrations/create-stacks-tables.sql

echo ""
echo "✅ Migration completed!"
echo ""
echo "Verifying stacks..."
PGPASSWORD="29FHVZqmLEcx864X" psql \
  -h aws-1-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.fjmzvcipimpctqnhhfrr \
  -d postgres \
  -c "SELECT COUNT(*) as stack_count FROM stacks;"

echo ""
echo "🎉 Production database is ready!"
echo ""
echo "Next step: Deploy the API to Railway"
echo "  git add -A"
echo "  git commit -m 'feat: add stacks API endpoint'"
echo "  git push"
echo ""
