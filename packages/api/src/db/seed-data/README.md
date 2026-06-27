# Registry seed data

**Source of truth: `mcp-servers.json`.**

This file is the single, canonical list of MCP servers that the registry is
seeded with. To add or edit a server, edit `mcp-servers.json` — nothing else.

- The seed script `../seed-supabase.ts` reads **only** this file and upserts it
  into the Supabase `mcp_servers` table.
- Run it from the repo root with `npm run seed:supabase`
  (or `npm run seed:supabase:dry` for a no-write preview).

## Record shape

Each entry conforms to the `mcp_servers` table. Required fields:

```jsonc
{
  "slug": "github",                       // UNIQUE identity of the entry
  "name": "GitHub MCP",
  "tagline": "Repository management",     // nullable
  "description": "…",                     // nullable
  "repository_url": "https://github.com/owner/repo",
  "repository_owner": "owner",
  "repository_name": "repo",
  "npm_package": "@scope/pkg",            // nullable
  "pypi_package": null,                    // nullable
  "category": "api",                       // one of the server_category enum values
  "tags": ["github", "git"],
  "verified": true,
  "featured": false
  // optional: "install_command", "config_example"
}
```

`category` must be one of: `memory`, `filesystem`, `database`, `api`, `search`,
`communication`, `monitoring`, `development`, `custom`. Anything else is rejected
by the seed script's validation and logged (the row is skipped, not fatal).

Entries are sorted alphabetically by `slug` and de-duplicated by `slug`.

## History

This file was consolidated from five legacy sources that previously each fed a
different seeding script: `seed-new-servers-2025.ts`, `seed-additional-servers.json`,
`seed-more-servers.json`, `seed-specialized-servers.json`, and
`mcp-servers-full-list.json`. Those originals now live in `../archive/`.
