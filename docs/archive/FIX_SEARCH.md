# Search Discovery Issue - Fix

## Problem
`openconductor discover snowflake` shows the same 10 servers regardless of query.

## Root Cause
The search is working correctly in the API (`/v1/servers?q=snowflake` returns 3 results), but there may be caching issues or the production database needs the search vectors regenerated.

## Solution

### Option 1: Clear CLI Cache (Quick Fix)
The CLI might be caching results. Clear it:

```bash
# Find and clear CLI cache
rm -rf ~/.config/openconductor/cache 2>/dev/null
rm -rf ~/.openconductor/cache 2>/dev/null

# Try search again
openconductor discover snowflake
```

### Option 2: Update Production Database (If Needed)

If the production database doesn't have search_vector populated, run this SQL:

```sql
-- Ensure search_vector column exists and is populated
-- This should be automatic but can be manually triggered

-- Check if column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name='mcp_servers' AND column_name='search_vector';

-- If needed, regenerate search vectors (schema should auto-generate)
-- The column is defined as GENERATED ALWAYS so it should populate automatically
-- when rows are inserted/updated

-- Force update to regenerate (only if needed)
UPDATE mcp_servers SET updated_at = NOW();
```

### Option 3: Deploy Database Migration

The search_vector column is defined in `schema.sql` as:

```sql
search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C')
) STORED
```

This should be automatically populated when rows are inserted.

## Testing

Test the API directly:

```bash
# Should return Snowflake servers
curl "https://www.openconductor.ai/api/v1/servers?q=snowflake&limit=5"

# Should return BigQuery servers
curl "https://www.openconductor.ai/api/v1/servers?q=bigquery&limit=5"

# Should return Vector DB servers
curl "https://www.openconductor.ai/api/v1/servers?q=pinecone&limit=5"
```

## Verification Commands

```bash
# Test locally (should work)
curl "http://localhost:3001/v1/servers?q=snowflake&limit=5"

# Test production
curl "https://www.openconductor.ai/api/v1/servers?q=snowflake&limit=5"

# Test CLI
openconductor discover snowflake --limit 5
openconductor discover bigquery --limit 5
openconductor discover pinecone --limit 5
```

## Current Status

- ✅ Local DB: 191 servers, search working
- ✅ API endpoint: Correctly filtering by query
- ❓ Production DB: Need to verify search_vector is populated
- ❓ CLI: May be caching old results

## Next Steps

1. Clear CLI cache and retry
2. If still broken, check production database for search_vector column
3. If column missing, run database migration
4. If column exists but empty, run UPDATE to regenerate

## Quick Test

```bash
# This should show different results for each query:
openconductor discover memory
openconductor discover database
openconductor discover snowflake
```

If all three show the same 10 servers, it's a caching issue in the CLI or the production API.
