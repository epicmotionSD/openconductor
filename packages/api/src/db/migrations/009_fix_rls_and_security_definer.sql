-- Migration 009: Fix Supabase security linter errors
-- Fixes: 3 SECURITY DEFINER views + 15 tables missing RLS
-- Run via Supabase SQL Editor (Dashboard → SQL Editor → paste → Run)

BEGIN;

-- ============================================================
-- 1. Fix SECURITY DEFINER views → SECURITY INVOKER
--    Supabase defaults views to security_definer. Recreate
--    with security_invoker = true so RLS of the *querying*
--    user is enforced, not the view creator.
-- ============================================================

DROP VIEW IF EXISTS servers_with_stats;
CREATE VIEW servers_with_stats
  WITH (security_invoker = true)
AS
SELECT
  s.*,
  st.github_stars,
  st.github_forks,
  st.github_watchers,
  st.github_open_issues,
  st.github_last_commit_at,
  st.npm_downloads_weekly,
  st.npm_downloads_total,
  st.cli_installs,
  st.page_views,
  st.upvotes,
  st.popularity_score,
  st.trending_score,
  v.version   AS latest_version,
  v.published_at AS latest_release_at
FROM mcp_servers s
LEFT JOIN server_stats st ON s.id = st.server_id
LEFT JOIN server_versions v ON s.id = v.server_id AND v.is_latest = true;

DROP VIEW IF EXISTS popular_servers;
CREATE VIEW popular_servers
  WITH (security_invoker = true)
AS
SELECT
  s.*,
  st.popularity_score,
  st.github_stars,
  st.cli_installs
FROM mcp_servers s
JOIN server_stats st ON s.id = st.server_id
WHERE s.verified = true
ORDER BY st.popularity_score DESC;

DROP VIEW IF EXISTS trending_servers;
CREATE VIEW trending_servers
  WITH (security_invoker = true)
AS
SELECT
  s.*,
  st.trending_score,
  st.popularity_score,
  st.github_stars,
  st.cli_installs
FROM mcp_servers s
JOIN server_stats st ON s.id = st.server_id
WHERE s.verified = true AND st.trending_score > 0
ORDER BY st.trending_score DESC;

-- ============================================================
-- 2. Enable Row Level Security on all public tables
-- ============================================================

ALTER TABLE mcp_servers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_stats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_versions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_dependencies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_embeddings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_webhook_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage                ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_hourly         ENABLE ROW LEVEL SECURITY;

-- The linter also flagged `public.servers` — enable if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'servers'
  ) THEN
    EXECUTE 'ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ============================================================
-- 3. RLS Policies
--
-- Strategy:
--   • Public registry data  → anon + authenticated can SELECT
--   • User-scoped data      → users CRUD their own rows
--   • Internal/admin tables → service_role only (no anon/auth)
--
-- Note: service_role bypasses RLS by default in Supabase.
-- ============================================================

--------------------------------------------------------------
-- 3a. PUBLIC REGISTRY (read-only for anon + authenticated)
--------------------------------------------------------------

-- mcp_servers
CREATE POLICY "Public read servers"
  ON mcp_servers FOR SELECT
  TO anon, authenticated
  USING (true);

-- server_stats
CREATE POLICY "Public read server_stats"
  ON server_stats FOR SELECT
  TO anon, authenticated
  USING (true);

-- server_versions
CREATE POLICY "Public read server_versions"
  ON server_versions FOR SELECT
  TO anon, authenticated
  USING (true);

-- server_dependencies
CREATE POLICY "Public read server_dependencies"
  ON server_dependencies FOR SELECT
  TO anon, authenticated
  USING (true);

-- server_embeddings
CREATE POLICY "Public read server_embeddings"
  ON server_embeddings FOR SELECT
  TO anon, authenticated
  USING (true);

-- server_analytics_snapshots
CREATE POLICY "Public read analytics_snapshots"
  ON server_analytics_snapshots FOR SELECT
  TO anon, authenticated
  USING (true);

--------------------------------------------------------------
-- 3b. USER-SCOPED TABLES
--------------------------------------------------------------

-- user_interactions: users see & manage their own
CREATE POLICY "Users read own interactions"
  ON user_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own interactions"
  ON user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own interactions"
  ON user_interactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- server_reviews: anyone can read, users manage their own
CREATE POLICY "Public read reviews"
  ON server_reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users insert own reviews"
  ON server_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own reviews"
  ON server_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own reviews"
  ON server_reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

--------------------------------------------------------------
-- 3c. INTERNAL / ADMIN TABLES (service_role only)
--     No policies for anon/authenticated = deny all.
--     service_role bypasses RLS automatically.
--------------------------------------------------------------

-- github_webhook_logs  — no policies (service_role only)
-- api_usage            — no policies (service_role only)
-- api_keys             — no policies (service_role only)
-- background_jobs      — no policies (service_role only)
-- telemetry_events     — no policies (service_role only)
-- telemetry_hourly     — no policies (service_role only)

--------------------------------------------------------------
-- 3d. `servers` table (if it exists, treat as public read)
--------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'servers'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read servers_legacy" ON public.servers FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

COMMIT;
