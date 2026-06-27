/**
 * seed-supabase.ts — Canonical OpenConductor registry seeder.
 *
 * This is THE seed script for the MCP server registry. It reads the single
 * source of truth (`seed-data/mcp-servers.json`) and writes it into the
 * Supabase `mcp_servers` table via the Supabase JS client (service-role auth).
 *
 *   npm run seed:supabase                 # insert servers that don't exist yet (safe, additive)
 *   npm run seed:supabase -- --dry-run    # report what WOULD change, write nothing
 *   npm run seed:supabase -- --update-existing  # also overwrite existing rows from the file
 *
 * Required env (packages/api/.env or .env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent: default mode only inserts missing slugs, so a second run is a no-op
 * ("0 new, N already present"). Exit code 0 on success, 1 on fatal error.
 *
 * NOTE: `mcp_servers.repository_url` currently has a UNIQUE constraint. Many
 * legitimate servers share one monorepo URL (e.g. modelcontextprotocol/servers),
 * so some inserts are skipped with a clear log line until that constraint is
 * relaxed. See supabase/migrations/*_relax_mcp_servers_repository_url_unique.sql.
 */

import { join } from 'path';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Env loading (robust to CWD: always resolve relative to packages/api)
// ---------------------------------------------------------------------------
const API_ROOT = join(__dirname, '..', '..');
dotenv.config({ path: join(API_ROOT, '.env.local') });
dotenv.config({ path: join(API_ROOT, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------
const log = (msg: string) => console.log(msg);
const info = (msg: string) => console.log(`  ${msg}`);
const warn = (msg: string) => console.warn(`  ⚠️  ${msg}`);
const err = (msg: string) => console.error(`  ✗ ${msg}`);

// ---------------------------------------------------------------------------
// Validation schema — mirrors the mcp_servers table's required columns + enum
// ---------------------------------------------------------------------------
const CATEGORY = z.enum([
  'memory', 'filesystem', 'database', 'api', 'search',
  'communication', 'monitoring', 'development', 'custom',
]);

const ServerSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  repository_url: z.string().min(1),
  repository_owner: z.string().min(1),
  repository_name: z.string().min(1),
  npm_package: z.string().nullable().optional(),
  pypi_package: z.string().nullable().optional(),
  category: CATEGORY,
  tags: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false),
  install_command: z.string().optional(),
  config_example: z.any().optional(),
});

type ServerRow = z.infer<typeof ServerSchema>;

const SEED_FILE = join(__dirname, 'seed-data', 'mcp-servers.json');

// Columns we actually write (everything else in the table is DB-managed or curated elsewhere).
function toInsertPayload(s: ServerRow) {
  const payload: Record<string, any> = {
    slug: s.slug,
    name: s.name,
    tagline: s.tagline ?? null,
    description: s.description ?? null,
    repository_url: s.repository_url,
    repository_owner: s.repository_owner,
    repository_name: s.repository_name,
    npm_package: s.npm_package ?? null,
    pypi_package: s.pypi_package ?? null,
    category: s.category,
    tags: s.tags ?? [],
    verified: s.verified ?? false,
    featured: s.featured ?? false,
  };
  if (s.install_command) payload.install_command = s.install_command;
  if (s.config_example) payload.config_example = s.config_example;
  return payload;
}

async function fetchExistingSlugs(supabase: SupabaseClient): Promise<Set<string>> {
  const slugs = new Set<string>();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('slug')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to read existing slugs: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data as any[]) slugs.add(r.slug);
    if (data.length < pageSize) break;
  }
  return slugs;
}

/** Insert rows one batch; on batch failure, retry per-row so one bad row can't sink the rest. */
async function insertRows(
  supabase: SupabaseClient,
  rows: ServerRow[],
  updateExisting: boolean,
): Promise<{ written: number; skipped: { slug: string; reason: string }[] }> {
  let written = 0;
  const skipped: { slug: string; reason: string }[] = [];

  const writeOne = async (s: ServerRow): Promise<void> => {
    const payload = toInsertPayload(s);
    const q = updateExisting
      ? supabase.from('mcp_servers').upsert(payload, { onConflict: 'slug', ignoreDuplicates: false })
      : supabase.from('mcp_servers').insert(payload);
    const { error } = await q;
    if (error) {
      const reason =
        error.code === '23505' && /repository_url/.test(error.message)
          ? 'duplicate repository_url (UNIQUE constraint — shared monorepo)'
          : error.message;
      skipped.push({ slug: s.slug, reason });
      return;
    }
    written++;
  };

  // Try in chunks first for speed, fall back to per-row on any chunk error.
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const payloads = chunk.map(toInsertPayload);
    const q = updateExisting
      ? supabase.from('mcp_servers').upsert(payloads, { onConflict: 'slug', ignoreDuplicates: false })
      : supabase.from('mcp_servers').insert(payloads);
    const { error } = await q;
    if (!error) {
      written += chunk.length;
    } else {
      // Isolate the offenders.
      for (const s of chunk) await writeOne(s);
    }
  }
  return { written, skipped };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const updateExisting = process.argv.includes('--update-existing');

  log('\n=== OpenConductor registry seed (Supabase) ===');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    err('Missing Supabase credentials.');
    err('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `packages/api/.env.local`. See `.env.example`.');
    process.exit(1);
  }

  // Load + validate source data.
  let raw: any[];
  try {
    raw = JSON.parse(readFileSync(SEED_FILE, 'utf-8'));
  } catch (e: any) {
    err(`Could not read source of truth ${SEED_FILE}: ${e.message}`);
    process.exit(1);
    return;
  }

  const valid: ServerRow[] = [];
  const malformed: { slug: string; reason: string }[] = [];
  for (const r of raw) {
    const parsed = ServerSchema.safeParse(r);
    if (parsed.success) valid.push(parsed.data);
    else malformed.push({ slug: r?.slug ?? '(no-slug)', reason: parsed.error.issues[0]?.message ?? 'invalid' });
  }

  log(`Reading ${raw.length} servers from seed-data/mcp-servers.json`);
  info(`Valid: ${valid.length}   Malformed (skipped): ${malformed.length}`);
  for (const m of malformed) warn(`malformed ${m.slug}: ${m.reason}`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Determine new vs existing.
  let existing: Set<string>;
  try {
    existing = await fetchExistingSlugs(supabase);
  } catch (e: any) {
    err(e.message);
    process.exit(1);
    return;
  }
  const toInsert = valid.filter((s) => !existing.has(s.slug));
  const alreadyPresent = valid.filter((s) => existing.has(s.slug));

  log(`\nLive mcp_servers currently has ${existing.size} rows.`);
  log(
    `Plan: insert ${toInsert.length} new, ` +
      `${updateExisting ? `update ${alreadyPresent.length} existing` : `skip ${alreadyPresent.length} already present`}` +
      (dryRun ? '  [DRY RUN — no writes]' : ''),
  );

  if (dryRun) {
    if (toInsert.length) {
      info('Would insert (sample): ' + toInsert.slice(0, 15).map((s) => s.slug).join(', ') +
        (toInsert.length > 15 ? ` …(+${toInsert.length - 15})` : ''));
    }
    log('\nDry run complete. No changes written.');
    process.exit(0);
    return;
  }

  // In default (additive) mode we only touch new rows; in --update-existing we
  // also re-write the rows already present.
  const work = updateExisting ? valid : toInsert;
  if (work.length === 0) {
    log(`\n✓ Nothing to do. 0 new, ${alreadyPresent.length} already present. Registry is up to date.`);
    process.exit(0);
    return;
  }

  log(`\nWriting ${work.length} rows…`);
  const { written, skipped } = await insertRows(supabase, work, updateExisting);

  // Summary
  log('\n=== Summary ===');
  info(`Source servers (valid):   ${valid.length}`);
  info(`Inserted/updated:         ${written}`);
  info(`Already present (skipped):${updateExisting ? ' n/a (update mode)' : ` ${alreadyPresent.length}`}`);
  info(`Skipped (write errors):   ${skipped.length}`);
  info(`Malformed (validation):   ${malformed.length}`);
  if (skipped.length) {
    const repoConflicts = skipped.filter((s) => /repository_url/.test(s.reason));
    if (repoConflicts.length) {
      warn(`${repoConflicts.length} skipped due to repository_url UNIQUE (shared monorepos). ` +
        `Apply the relax-constraint migration to seed these. Affected: ` +
        repoConflicts.slice(0, 20).map((s) => s.slug).join(', ') +
        (repoConflicts.length > 20 ? ` …(+${repoConflicts.length - 20})` : ''));
    }
    for (const s of skipped.filter((x) => !/repository_url/.test(x.reason))) err(`skipped ${s.slug}: ${s.reason}`);
  }

  const fatal = skipped.some((s) => !/repository_url/.test(s.reason) && !/duplicate key/.test(s.reason));
  // repository_url skips are expected/known; treat the run as successful so CI/idempotency holds.
  log(skipped.length ? '\n✓ Seed completed with known skips.' : '\n✓ Seed completed cleanly.');
  process.exit(fatal ? 1 : 0);
}

main().catch((e) => {
  err(`Fatal: ${e?.message ?? e}`);
  process.exit(1);
});
