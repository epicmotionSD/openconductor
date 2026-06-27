-- =============================================================================
-- Migration 010 — Close the RLS + SECURITY DEFINER gap left by 009
-- =============================================================================
--
-- STATUS: ✅ APPLIED 2026-06-26 via Supabase MCP. All ERROR-level security
--         advisories cleared (rls_disabled_in_public 12→0, security_definer_view
--         1→0, security_definer_function_executable 4→0,
--         function_search_path_mutable 1→0). API still serves 200 (superuser
--         bypass intact, as predicted).
--
-- WHY:
--   Migration 009 (already applied 2026-06-26) cleared the RLS / SECURITY DEFINER
--   findings that existed when it was written. Since then, the schema has grown
--   (Board-of-Directors agent tables, ad/revenue analytics, billing, stacks,
--   templates, deployments) and one SECURITY DEFINER view was missed. This
--   migration closes the remaining advisor errors:
--     • 12 tables still showing rls_disabled_in_public (ERROR)
--     • 1 view  still showing security_definer_view (ERROR) — command_center_summary
--     • 2 funcs still showing security_definer_function_executable (WARN)
--     • 1 func  still showing function_search_path_mutable (WARN)
--
-- BLAST RADIUS (verified before drafting):
--   - The API connects via raw `pg` as `postgres` (Supabase pooler superuser),
--     which bypasses RLS. /v1/servers and /v1/stacks still served 200 after
--     migration 009 — same will be true after 010.
--   - No client in the repo uses `@supabase/supabase-js` with the anon key
--     (grep confirmed: only server-side service-role usage in
--     packages/api/src/db/seed-supabase.ts). So flipping these tables to
--     "no anon/auth access" does not break any existing read path.
--
-- POLICY DECISIONS (the why behind each table's treatment):
--
--   PUBLIC READ (anon + authenticated, USING (true)):
--     • stacks, stack_servers — public registry catalog, same model as mcp_servers
--     • templates             — 10 rows already; the data shape suggests a public
--                               browse-able catalog. If templates are actually
--                               user-private, drop the policy below before apply.
--
--   SERVICE-ROLE ONLY (RLS on, zero policies → deny anon+auth, allow service):
--     • agents, agent_sessions, agent_tasks, agent_decisions
--       Reason: internal Board-of-Directors agent runtime state. No frontend
--       reads these; the dashboards consume command_center_summary instead.
--     • ad_campaigns, ad_bleed_alerts, revenue_signals
--       Reason: marketing/financial telemetry, sensitive.
--     • credit_transactions
--       Reason: billing data, never anon-readable.
--     • deployments
--       Reason: until a user_id column / ownership model is verified, default
--       to deny. Promote to user-scoped in a follow-up if needed.
--
-- COMMAND_CENTER_SUMMARY:
--   The view aggregates 6 admin tables (agents, agent_tasks, agent_decisions,
--   revenue_signals, ad_bleed_alerts, deployments). After this migration:
--     - via service-role: returns real counts (as before)
--     - via anon/authenticated: returns all zeros (because the underlying tables
--       have no anon/auth policies). That's the desired safety property.
--
-- TRIGGER / RPC HARDENING:
--   compute_build_duration / handle_new_user are trigger helpers that should
--   NEVER be called directly through PostgREST. They must stay SECURITY DEFINER
--   so the trigger can write to tables the calling role doesn't directly own,
--   but we REVOKE EXECUTE from anon + authenticated so the
--   /rest/v1/rpc/{name} endpoints stop working for unprivileged callers.
--
--   update_updated_at_column has a mutable search_path — pin it to '' (empty)
--   so it can't be hijacked by a temp-schema function.
--
-- =============================================================================

-- ============================================================
-- 1. SECURITY DEFINER view → SECURITY INVOKER
-- ============================================================

DROP VIEW IF EXISTS public.command_center_summary;
CREATE VIEW public.command_center_summary
  WITH (security_invoker = true)
AS
SELECT
  (SELECT count(*) FROM public.agents
     WHERE status = 'active'::agent_status)                   AS active_agents,
  (SELECT count(*) FROM public.agent_tasks
     WHERE status = 'pending'::task_status)                   AS pending_tasks,
  (SELECT count(*) FROM public.agent_decisions
     WHERE approved = false)                                  AS pending_decisions,
  (SELECT count(*) FROM public.revenue_signals
     WHERE action_taken = false
       AND created_at > (now() - interval '24 hours'))        AS recent_signals,
  (SELECT count(*) FROM public.ad_bleed_alerts
     WHERE resolved = false)                                  AS active_alerts,
  (SELECT count(*) FROM public.deployments
     WHERE created_at > (now() - interval '24 hours'))        AS deployments_today,
  (SELECT COALESCE(sum(wasted_spend), 0::numeric)
     FROM public.ad_bleed_alerts
     WHERE resolved = false)                                  AS total_ad_bleed;

-- ============================================================
-- 2. Enable RLS on the 12 gap tables
-- ============================================================

ALTER TABLE public.stacks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stack_servers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_bleed_alerts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_signals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Policies
-- ============================================================

-- 3a. Public registry catalog (read-only for anon + authenticated)
CREATE POLICY "Public read stacks"
  ON public.stacks        FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read stack_servers"
  ON public.stack_servers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read templates"
  ON public.templates     FOR SELECT TO anon, authenticated USING (true);

-- 3b. Service-role-only tables: no policies = deny anon/auth (service_role
--     bypasses RLS by default). Explicit comment per table so future readers
--     don't "fix" the lack of a policy.
COMMENT ON TABLE public.agents              IS 'RLS: service-role only — internal BoD agent state';
COMMENT ON TABLE public.agent_sessions      IS 'RLS: service-role only — internal agent runtime';
COMMENT ON TABLE public.agent_tasks         IS 'RLS: service-role only — internal task queue';
COMMENT ON TABLE public.agent_decisions     IS 'RLS: service-role only — internal decision log';
COMMENT ON TABLE public.ad_campaigns        IS 'RLS: service-role only — marketing internal';
COMMENT ON TABLE public.ad_bleed_alerts     IS 'RLS: service-role only — internal alerts';
COMMENT ON TABLE public.revenue_signals     IS 'RLS: service-role only — financial telemetry';
COMMENT ON TABLE public.credit_transactions IS 'RLS: service-role only — billing data';
COMMENT ON TABLE public.deployments         IS 'RLS: service-role only (promote to user-scoped if needed)';

-- ============================================================
-- 4. Lock down SECURITY DEFINER trigger functions from direct RPC
-- ============================================================
--
-- These functions are TRIGGERs and must stay SECURITY DEFINER so they can
-- write to tables the trigger-firing role doesn't own (handle_new_user writes
-- to public.profiles when auth.users gets a new row; compute_build_duration
-- updates new.duration_seconds inside an UPDATE/INSERT trigger on builds).
-- They should never be called directly via /rest/v1/rpc/{name}.

REVOKE EXECUTE ON FUNCTION public.compute_build_duration() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()        FROM anon, authenticated, PUBLIC;

-- ============================================================
-- 5. Pin update_updated_at_column.search_path
-- ============================================================
--
-- The trigger function uses unqualified table references; pinning search_path
-- to '' is the canonical Supabase hardening (matches what 009 implicitly did
-- to compute_build_duration / handle_new_user via SET search_path TO '').

ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- =============================================================================
-- ITEMS DELIBERATELY NOT INCLUDED (out of scope for a DDL migration):
--   • The `vector` extension lives in public — Supabase recommends moving it
--     to a dedicated schema (`extensions` or similar). This requires a
--     coordinated rebuild of any vector index/column references and is
--     better handled as its own migration with a careful pre-flight.
--   • Supabase Auth → "Leaked password protection" — a dashboard toggle, not
--     SQL. Enable from the Supabase project settings UI when ready.
-- =============================================================================
