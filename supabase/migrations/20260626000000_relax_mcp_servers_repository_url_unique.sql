-- =============================================================================
-- Relax the UNIQUE constraint on mcp_servers.repository_url
-- =============================================================================
--
-- WHY:
--   The registry indexes individual MCP servers, but many legitimate servers
--   live inside a single shared monorepo. The clearest example is the official
--   `https://github.com/modelcontextprotocol/servers` repo, which hosts ~18
--   distinct servers (filesystem, git, memory, fetch, time, slack, gdrive, …).
--   Other shared repos: awslabs/mcp, cloudflare/mcp-server-cloudflare,
--   e2b-dev/mcp-server.
--
--   The original schema declared `repository_url VARCHAR(500) NOT NULL UNIQUE`.
--   That makes it impossible to register more than one server per monorepo, so
--   the canonical seed (seed-data/mcp-servers.json) is forced to skip ~20 real
--   servers on every run. `slug` is already UNIQUE and is the true identity of a
--   registry entry, so the repository_url UNIQUE constraint is both wrong and
--   harmful here.
--
-- WHAT THIS DOES:
--   Drops the UNIQUE constraint on repository_url. The column stays NOT NULL and
--   keeps its non-unique index (idx_servers_repository covers owner/name lookups;
--   we also add a plain index on repository_url for sync queries). After this,
--   re-run `npm run seed:supabase` to insert the previously-skipped servers.
--
-- SAFETY:
--   Non-destructive. No rows are deleted; only the constraint is removed.
--   Reversible by re-adding the constraint IF the table contains no duplicate
--   repository_url values (it will once the full seed runs, so reversal is not
--   advised after seeding).
--
-- APPLY (run by Shawn, not auto-applied):
--   Via Supabase MCP:  apply_migration  with this file's contents, OR
--   Via psql/pooler:   psql "$SUPABASE_POOLER_URL" -f \
--     supabase/migrations/20260626000000_relax_mcp_servers_repository_url_unique.sql
-- =============================================================================

ALTER TABLE public.mcp_servers
  DROP CONSTRAINT IF EXISTS mcp_servers_repository_url_key;

-- Keep a (non-unique) index so repository_url lookups in the GitHub sync workers
-- stay fast.
CREATE INDEX IF NOT EXISTS idx_mcp_servers_repository_url
  ON public.mcp_servers (repository_url);
