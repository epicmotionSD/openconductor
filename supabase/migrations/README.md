# Supabase migrations (manual-apply)

These migration files are **not** auto-applied. Apply them deliberately via the
Supabase MCP `apply_migration` tool or `psql` against the pooler connection.

## Pending

### `20260626000000_relax_mcp_servers_repository_url_unique.sql`
Drops the `UNIQUE` constraint on `mcp_servers.repository_url` so multiple servers
that share one monorepo (e.g. `modelcontextprotocol/servers`) can be registered.
Until applied, `npm run seed:supabase` skips ~20 servers and logs each one.
**After applying, re-run the seed** to insert the previously-skipped servers.

---

## Investigated and intentionally NOT created: "drop the `servers` table"

A drop-`servers`-table migration was requested, on the assumption that `servers`
is a stale duplicate of `mcp_servers`. **Live inspection disproved that.** Do
**not** drop `public.servers`. The two tables are different entities:

| table         | purpose                                   | rows | key columns |
|---------------|-------------------------------------------|------|-------------|
| `mcp_servers` | the public MCP registry (what the API reads) | 196  | `slug`, `repository_url`, `category`… |
| `servers`     | SDK/telemetry: instances that phoned home | 2    | `api_key_id` (FK → `api_keys`), `name`, `version`, `sdk_version`, `node_version`, `platform` |

`servers` has a foreign key to `api_keys` and a `UNIQUE (api_key_id, name)`
constraint — it is live telemetry, not registry data. Dropping it would destroy
data and break the FK relationship. No migration was written for it.
