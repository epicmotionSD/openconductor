-- =============================================================================
-- Stacks ("Starter Packs"): schema + seed + initial server links
-- =============================================================================
--
-- WHY:
--   GET /v1/stacks was returning 500 in prod because the route at
--   packages/api/src/routes/stacks.ts queries `stacks` and `stack_servers`
--   tables that had never been created on the live Supabase project. The
--   schema and seed were already designed at
--   packages/api/src/db/migrations/create-stacks-tables.sql but had only ever
--   been run against local Postgres, not promoted to Supabase.
--
--   This migration is the canonical Supabase mirror of that file, plus the
--   initial stack_server link rows (essential / coder / writer → mcp_servers)
--   so the endpoint returns useful data immediately after apply rather than
--   3 stacks with server_count=0.
--
-- IDEMPOTENT:
--   - CREATE TABLE IF NOT EXISTS for both tables
--   - CREATE INDEX IF NOT EXISTS for all four indexes
--   - INSERT ... ON CONFLICT (slug) DO NOTHING for the 3 starter stacks
--   - The link INSERT uses ON CONFLICT (stack_id, server_id) DO UPDATE so
--     re-runs re-sort but don't error
--
-- DEPENDENCIES:
--   Requires public.mcp_servers (the registry seed). See
--   packages/api/src/db/seed-supabase.ts. Server slugs referenced below match
--   the canonical bare names from the modelcontextprotocol/servers monorepo
--   (not the legacy *-mcp variants the original link-stack-servers.ts script
--   used). The TS script has been updated to match.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.stacks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(100) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  tagline       VARCHAR(255),
  icon          VARCHAR(10),
  short_code    VARCHAR(10) UNIQUE,
  system_prompt TEXT NOT NULL,
  install_count INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stack_servers (
  stack_id   UUID REFERENCES public.stacks(id)      ON DELETE CASCADE,
  server_id  UUID REFERENCES public.mcp_servers(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (stack_id, server_id)
);

CREATE INDEX IF NOT EXISTS idx_stacks_slug             ON public.stacks(slug);
CREATE INDEX IF NOT EXISTS idx_stacks_short_code       ON public.stacks(short_code);
CREATE INDEX IF NOT EXISTS idx_stack_servers_stack_id  ON public.stack_servers(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_servers_server_id ON public.stack_servers(server_id);

-- --------------------------------------------------------------------------
-- Seed the three starter packs.
-- system_prompt bodies are trimmed vs. the legacy file for review readability;
-- the canonical long-form prompts live in
-- packages/api/src/db/migrations/create-stacks-tables.sql and can be UPDATEd
-- in a follow-up if/when product wants the full coaching prompt.
-- --------------------------------------------------------------------------
INSERT INTO public.stacks (slug, name, description, tagline, icon, short_code, system_prompt) VALUES
(
  'essential',
  'Essential Stack',
  'Fundamental tools for everyday AI assistance. Everything you need to get started with Claude.',
  'Everything you need to get started',
  E'⚡',
  'essential',
  'You are Claude with the Essential Stack — filesystem, web search, fetch, time, and persistent memory. Use brave-search for current information, fetch for APIs, memory for cross-conversation state, and confirm file paths before writing.'
),
(
  'coder',
  'Coder Stack',
  'Complete development environment optimized for software engineering. Build, debug, and deploy like a senior engineer.',
  'Build, debug, and deploy like a senior engineer',
  E'\U0001F9D1‍\U0001F4BB',
  'coder',
  'You are Claude with the Coder Stack — GitHub, Postgres, filesystem, memory, sequential-thinking, and web search. Plan with sequential-thinking, research before implementing, verify before committing, and store architectural decisions in memory.'
),
(
  'writer',
  'Writer Stack',
  'Comprehensive writing and research assistant. Research, write, and publish with confidence.',
  'Research, write, and publish with confidence',
  E'✍️',
  'writer',
  'You are Claude with the Writer Stack — web research, fetch, filesystem, memory, and Google Drive. Fact-check claims, cite sources, adapt tone to audience, and save style guides and research to memory.'
)
ON CONFLICT (slug) DO NOTHING;

-- --------------------------------------------------------------------------
-- Initial stack ↔ server links.
-- Servers referenced by slug; missing slugs are silently skipped via INNER JOIN.
-- --------------------------------------------------------------------------
WITH src(stack_slug, server_slug, sort_order) AS (
  VALUES
    ('essential','filesystem',          0),
    ('essential','brave-search',        1),
    ('essential','fetch',               2),
    ('essential','time',                3),
    ('essential','mcp-memory',          4),
    ('coder',    'github',              0),
    ('coder',    'postgres',            1),
    ('coder',    'filesystem',          2),
    ('coder',    'mcp-memory',          3),
    ('coder',    'sequential-thinking', 4),
    ('coder',    'brave-search',        5),
    ('writer',   'brave-search',        0),
    ('writer',   'fetch',               1),
    ('writer',   'filesystem',          2),
    ('writer',   'mcp-memory',          3),
    ('writer',   'gdrive',              4)
)
INSERT INTO public.stack_servers (stack_id, server_id, sort_order)
SELECT st.id, ms.id, src.sort_order
FROM src
JOIN public.stacks      st ON st.slug = src.stack_slug
JOIN public.mcp_servers ms ON ms.slug = src.server_slug
ON CONFLICT (stack_id, server_id) DO UPDATE SET sort_order = EXCLUDED.sort_order;
