# Seeding the registry

The OpenConductor registry (`mcp_servers` table in Supabase) is seeded from a
single source of truth and one script. Everything else is archived.

## TL;DR

```bash
# from the repo root
npm run seed:supabase:dry     # preview — reports what would change, writes nothing
npm run seed:supabase         # additive — inserts servers that don't exist yet
```

## Source of truth

`packages/api/src/db/seed-data/mcp-servers.json`

This is the canonical, alphabetically-sorted, slug-deduplicated list of servers.
**Add or edit servers here and nowhere else.** See
`packages/api/src/db/seed-data/README.md` for the record shape and the
`category` enum values.

## The script

`packages/api/src/db/seed-supabase.ts` — runnable via:

| command (repo root)            | what it does |
|--------------------------------|--------------|
| `npm run seed:supabase`        | inserts only servers whose `slug` isn't already in `mcp_servers` (safe, additive, idempotent) |
| `npm run seed:supabase:dry`    | dry run: reports new / existing / skipped, writes nothing |
| `… -- --update-existing`       | also overwrites existing rows from the file (use with care) |

From inside `packages/api` the same script is `npm run db:seed` /
`npm run db:seed:dry`.

It is idempotent: a second `seed:supabase` run reports `0 new, N already present`.

## Required environment

In `packages/api/.env` (or `.env.local`):

```
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

The script authenticates with the **service-role** key via `@supabase/supabase-js`
(not raw Postgres credentials). If either var is missing it prints a one-line
instruction and exits 1. These keys are documented in `.env.example`.

## Known constraint: shared monorepos

`mcp_servers.repository_url` currently has a `UNIQUE` constraint. Many real
servers share one monorepo URL (e.g. `modelcontextprotocol/servers` hosts ~18
servers), so the seed **skips** those rows and logs each one. To seed them, apply:

```
supabase/migrations/20260626000000_relax_mcp_servers_repository_url_unique.sql
```

(via the Supabase MCP `apply_migration`, or `psql` against the pooler), then
re-run `npm run seed:supabase`.

## Retired flows (do not use)

The following were the old, conflicting seed paths. They are archived under
`packages/api/src/db/archive/` (and `scripts/import-seed-data.sh` is deprecated
in place). See `packages/api/src/db/archive/README.md`.

- `seed.js` — **deleted**. Wrote 10 sample servers to a local **SQLite** db.
- `seed-all-servers.ts` — old raw-Postgres consolidator.
- `seed-additional/more/specialized-servers.json`, `seed-new-servers-2025.ts`,
  `mcp-servers-full-list.json` — merged into `seed-data/mcp-servers.json`.
- `scripts/import-seed-data.sh` — imported JSON into a **local Postgres** cache.
