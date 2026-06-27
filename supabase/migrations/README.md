# Supabase migrations (manual-apply)

These migration files are **not** auto-applied. Apply them deliberately via the
Supabase MCP `apply_migration` tool or `psql` against the pooler connection.

## Applied (2026-06-26)

### `20260626000000_relax_mcp_servers_repository_url_unique.sql` ✅

Dropped the `UNIQUE` constraint on `mcp_servers.repository_url`. `slug` is now
the sole identity. `mcp_servers` rebuilt to 216 rows; the full
`modelcontextprotocol/servers` catalog (18 servers) is now registered.

### `20260626000001_create_stacks_tables.sql` ✅

Created `public.stacks` + `public.stack_servers`, seeded the 3 starter packs
(essential / coder / writer) and the 16 stack-server links. `GET /v1/stacks`
went from HTTP 500 → HTTP 200 with `server_count` 6/5/5.

### Migration 009 (applied verbatim from `packages/api/src/db/migrations/009_fix_rls_and_security_definer.sql`) ✅

- Recreated 3 views (`servers_with_stats`, `popular_servers`, `trending_servers`)
  with `security_invoker = true`.
- Enabled RLS on 14 tables in the registry / billing / telemetry domains.
- Added 14 policies: public-read for catalog tables; user-scoped for
  `user_interactions` / `server_reviews`; service-role-only (no policies) for
  `api_keys`, `api_usage`, `background_jobs`, `github_webhook_logs`,
  `telemetry_events`, `telemetry_hourly`.
- API still serves 200 (raw `pg` superuser bypasses RLS).

## Pending

### `20260626000002_close_rls_and_security_definer_gap.sql` ⚠️ NOT APPLIED

Closes the gap migration 009 didn't cover:

- RLS on 12 more tables (`stacks`, `stack_servers`, `templates`, the 4 BoD
  agent tables, ad/revenue analytics, `credit_transactions`, `deployments`).
- Public-read policies for `stacks` / `stack_servers` / `templates`; the rest
  are service-role only.
- Recreates `command_center_summary` as `security_invoker = true`.
- `REVOKE EXECUTE` on `compute_build_duration` and `handle_new_user` from
  anon/authenticated (they stay `SECURITY DEFINER` for trigger use, but the
  direct `/rest/v1/rpc/{name}` calls get locked).
- Pins `update_updated_at_column.search_path` to `''`.

Review the per-table reasoning in the migration header before applying. If
`public.templates` is *not* meant to be public-readable, drop the
"Public read templates" policy block before running.

---

## Investigated and intentionally NOT created: "drop the `servers` table"

A drop-`servers`-table migration was requested, on the assumption that `servers`
is a stale duplicate of `mcp_servers`. **Live inspection disproved that.** Do
**not** drop `public.servers`. The two tables are different entities:

| table         | purpose                                      | rows | key columns                                                                                       |
|---------------|----------------------------------------------|------|---------------------------------------------------------------------------------------------------|
| `mcp_servers` | the public MCP registry (what the API reads) | 216  | `slug`, `category`… (`repository_url` no longer UNIQUE)                                           |
| `servers`     | SDK/telemetry: instances that phoned home    | 2    | `api_key_id` (FK → `api_keys`), `name`, `version`, `sdk_version`, `node_version`, `platform`      |

`servers` has a foreign key to `api_keys` and a `UNIQUE (api_key_id, name)`
constraint — it is live telemetry, not registry data. Dropping it would destroy
data and break the FK relationship. No migration was written for it.
