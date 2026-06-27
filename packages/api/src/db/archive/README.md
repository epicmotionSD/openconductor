# Archived seed / deploy scripts

Everything in this directory is **retired** and excluded from the TypeScript build
(`tsconfig.json` excludes `src/db/archive/**`). It is kept for historical reference
only. Some files have broken relative imports now that they have moved — that is
expected; they are not meant to run.

**The live registry seed is `../seed-supabase.ts`** (run `npm run seed:supabase`),
reading the single source of truth `../seed-data/mcp-servers.json`.

## What's here and why it was retired

| File | Was | Replaced by |
|------|-----|-------------|
| `seed.ts` | raw-pg seeder exporting `seedDatabase()` | seed-supabase.ts |
| `seed-127-servers.ts` | comprehensive 127-server raw-pg seeder | seed-supabase.ts |
| `seed-all-servers.ts` | "primary" consolidator (raw pg, wrote stats/versions) | seed-supabase.ts |
| `seed-new-servers-2025.ts` | 41-server data module (`newServers2025`) | merged into mcp-servers.json |
| `add-new-servers-2025.ts` | one-off updater using `newServers2025` | n/a |
| `seed-additional-servers.json` | 49 servers | merged into mcp-servers.json |
| `seed-more-servers.json` | 49 servers | merged into mcp-servers.json |
| `seed-specialized-servers.json` | 48 servers | merged into mcp-servers.json |
| `mcp-servers-full-list.json` | 30 servers | merged into mcp-servers.json |
| `servers.json` | 10 camelCase SQLite-sample servers | superseded |
| `top-50-servers.json` | export artifact | superseded |
| `count-seeds.js`, `seed-full-list.js`, `simple-migrate.js` | misc legacy utilities | n/a |

Also removed entirely (not archived): `seed.js` — a self-running **SQLite** seeder
(`packages/api/openconductor.db`, table `servers`) whose exported-`seedDatabase`
contract never actually existed, so its two importers (`connection.ts`,
`deploy-to-supabase.ts`) were already broken. Those callers now point at
`seed-supabase.ts`.
