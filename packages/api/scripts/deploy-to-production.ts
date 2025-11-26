#!/usr/bin/env tsx

/**
 * Deploy All Servers to Production Supabase
 *
 * This script:
 * 1. Loads all seed data (191 servers)
 * 2. Connects to production Supabase
 * 3. Inserts/updates servers with conflict handling
 * 4. Provides detailed logging and statistics
 *
 * Usage:
 *   # Dry run (no changes)
 *   npx tsx scripts/deploy-to-production.ts --dry-run
 *
 *   # Deploy to production
 *   npx tsx scripts/deploy-to-production.ts
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { newServers2025 } from '../src/db/seed-new-servers-2025.js';

interface ServerData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  repository_url: string;
  repository_owner: string;
  repository_name: string;
  npm_package?: string | null;
  pypi_package?: string | null;
  category: string;
  tags: string[];
  install_command?: string;
  config_example?: any;
  verified: boolean;
  featured: boolean;
  stats?: {
    github_stars?: number;
    npm_downloads_weekly?: number;
    npm_downloads_total?: number;
    cli_installs?: number;
  };
}

// Production Supabase connection
const PRODUCTION_DB_URL = process.env.PRODUCTION_POSTGRES_URL ||
  'postgresql://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

// Parse command line args
const isDryRun = process.argv.includes('--dry-run');

async function loadAllServers(): Promise<ServerData[]> {
  console.log('📂 Loading seed data from all sources...\n');

  const servers: ServerData[] = [];

  // 1. Load from seed-new-servers-2025.ts
  console.log('  Loading seed-new-servers-2025.ts...');
  servers.push(...newServers2025);
  console.log(`    ✓ Loaded ${newServers2025.length} servers`);

  // 2. Load from seed-additional-servers.json
  const additionalPath = join(process.cwd(), 'src/db/seed-additional-servers.json');
  console.log('  Loading seed-additional-servers.json...');
  const additional = JSON.parse(readFileSync(additionalPath, 'utf-8'));
  servers.push(...additional);
  console.log(`    ✓ Loaded ${additional.length} servers`);

  // 3. Load from seed-more-servers.json
  const morePath = join(process.cwd(), 'src/db/seed-more-servers.json');
  console.log('  Loading seed-more-servers.json...');
  const more = JSON.parse(readFileSync(morePath, 'utf-8'));
  servers.push(...more);
  console.log(`    ✓ Loaded ${more.length} servers`);

  // 4. Load from seed-specialized-servers.json
  const specializedPath = join(process.cwd(), 'src/db/seed-specialized-servers.json');
  console.log('  Loading seed-specialized-servers.json...');
  const specialized = JSON.parse(readFileSync(specializedPath, 'utf-8'));
  servers.push(...specialized);
  console.log(`    ✓ Loaded ${specialized.length} servers`);

  console.log(`\n📊 Total servers loaded: ${servers.length}\n`);

  return servers;
}

async function deployToProduction(servers: ServerData[], dryRun: boolean) {
  console.log(`🚀 ${dryRun ? '[DRY RUN] ' : ''}Deploying to production Supabase...\n`);

  const pool = new Pool({
    connectionString: PRODUCTION_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 30000
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to production database\n');

    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    console.log('Processing servers...\n');

    for (const server of servers) {
      try {
        if (!dryRun) {
          // Use UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
          const result = await pool.query(
            `
            INSERT INTO mcp_servers (
              slug, name, tagline, description,
              repository_url, repository_owner, repository_name,
              npm_package, pypi_package, category, tags,
              install_command, config_example, verified, featured,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
              NOW(), NOW()
            )
            ON CONFLICT (slug) DO UPDATE SET
              name = EXCLUDED.name,
              tagline = EXCLUDED.tagline,
              description = EXCLUDED.description,
              repository_url = EXCLUDED.repository_url,
              repository_owner = EXCLUDED.repository_owner,
              repository_name = EXCLUDED.repository_name,
              npm_package = EXCLUDED.npm_package,
              pypi_package = EXCLUDED.pypi_package,
              category = EXCLUDED.category,
              tags = EXCLUDED.tags,
              install_command = EXCLUDED.install_command,
              config_example = EXCLUDED.config_example,
              verified = EXCLUDED.verified,
              featured = EXCLUDED.featured,
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
            `,
            [
              server.slug,
              server.name,
              server.tagline,
              server.description,
              server.repository_url,
              server.repository_owner,
              server.repository_name,
              server.npm_package || null,
              server.pypi_package || null,
              server.category,
              server.tags,
              server.install_command || null,
              server.config_example ? JSON.stringify(server.config_example) : null,
              server.verified,
              server.featured
            ]
          );

          const wasInserted = result.rows[0]?.inserted;

          if (wasInserted) {
            inserted++;
            console.log(`  ✅ Inserted: ${server.name} (${server.slug})`);
          } else {
            updated++;
            console.log(`  🔄 Updated: ${server.name} (${server.slug})`);
          }

          // Insert/update stats if provided
          if (server.stats) {
            await pool.query(
              `
              INSERT INTO server_stats (
                server_id, github_stars, npm_downloads_weekly,
                npm_downloads_total, cli_installs, last_updated
              )
              SELECT id, $2, $3, $4, $5, NOW()
              FROM mcp_servers WHERE slug = $1
              ON CONFLICT (server_id) DO UPDATE SET
                github_stars = EXCLUDED.github_stars,
                npm_downloads_weekly = EXCLUDED.npm_downloads_weekly,
                npm_downloads_total = EXCLUDED.npm_downloads_total,
                cli_installs = EXCLUDED.cli_installs,
                last_updated = NOW()
              `,
              [
                server.slug,
                server.stats.github_stars || 0,
                server.stats.npm_downloads_weekly || 0,
                server.stats.npm_downloads_total || 0,
                server.stats.cli_installs || 0
              ]
            );
          }
        } else {
          // Dry run - just check if exists
          const result = await pool.query(
            'SELECT slug FROM mcp_servers WHERE slug = $1',
            [server.slug]
          );

          if (result.rows.length > 0) {
            console.log(`  🔄 Would update: ${server.name} (${server.slug})`);
            updated++;
          } else {
            console.log(`  ✅ Would insert: ${server.name} (${server.slug})`);
            inserted++;
          }
        }

      } catch (error: any) {
        errors++;
        console.error(`  ❌ Error with ${server.slug}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`${dryRun ? '[DRY RUN] ' : ''}Deployment Summary`);
    console.log('='.repeat(60));
    console.log(`Total servers processed: ${servers.length}`);
    console.log(`  ✅ Inserted: ${inserted}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    // Verify final count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM mcp_servers');
    const totalInDb = countResult.rows[0].total;
    console.log(`\n📊 Total servers in production: ${totalInDb}`);

    if (!dryRun && totalInDb >= 191) {
      console.log('\n🎉 SUCCESS! Production database now has 191+ servers!\n');
    } else if (dryRun) {
      console.log('\n✅ Dry run completed. Use without --dry-run flag to deploy.\n');
    } else {
      console.log(`\n⚠️  Warning: Expected 191 servers, but database has ${totalInDb}\n`);
    }

  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('OpenConductor Production Deployment');
    console.log('='.repeat(60) + '\n');

    const servers = await loadAllServers();
    await deployToProduction(servers, isDryRun);

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
