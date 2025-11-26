#!/usr/bin/env tsx

/**
 * Deploy All Servers to Production Supabase via REST API
 *
 * This script:
 * 1. Loads all seed data (191 servers)
 * 2. Uses Supabase REST API to insert/update servers
 * 3. Provides detailed logging and statistics
 *
 * Usage:
 *   # Dry run (no changes)
 *   npx tsx scripts/deploy-via-rest-api.ts --dry-run
 *
 *   # Deploy to production
 *   npx tsx scripts/deploy-via-rest-api.ts
 */

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

// Supabase REST API configuration
const SUPABASE_URL = "https://fjmzvcipimpctqnhhfrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbXp2Y2lwaW1wY3RxbmhoZnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjYzMTAsImV4cCI6MjA3NDk0MjMxMH0.zFLo3tHYMR9-ctFbGFNwquAfs6TWK0p1RzXICDXvj_E";

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

async function getExistingServers(): Promise<Set<string>> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/mcp_servers?select=slug&limit=1000`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch existing servers: ${response.statusText}`);
    }

    const servers = await response.json();
    return new Set(servers.map((s: any) => s.slug));
  } catch (error: any) {
    console.error('⚠️  Could not fetch existing servers:', error.message);
    return new Set();
  }
}

async function upsertServer(server: ServerData, isUpdate: boolean, dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    return true;
  }

  try {
    const payload = {
      slug: server.slug,
      name: server.name,
      tagline: server.tagline,
      description: server.description,
      repository_url: server.repository_url,
      repository_owner: server.repository_owner,
      repository_name: server.repository_name,
      npm_package: server.npm_package || null,
      pypi_package: server.pypi_package || null,
      category: server.category,
      tags: server.tags,
      install_command: server.install_command || null,
      config_example: server.config_example || null,
      verified: server.verified,
      featured: server.featured
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/mcp_servers`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return true;
  } catch (error: any) {
    console.error(`    Error: ${error.message}`);
    return false;
  }
}

async function deployToProduction(servers: ServerData[], dryRun: boolean) {
  console.log(`🚀 ${dryRun ? '[DRY RUN] ' : ''}Deploying to production Supabase...\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  try {
    // Get existing servers
    console.log('🔍 Checking existing servers...');
    const existingSlugs = await getExistingServers();
    console.log(`  Found ${existingSlugs.size} existing servers\n`);

    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    console.log('Processing servers...\n');

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < servers.length; i += batchSize) {
      const batch = servers.slice(i, i + batchSize);

      for (const server of batch) {
        const isUpdate = existingSlugs.has(server.slug);
        const success = await upsertServer(server, isUpdate, dryRun);

        if (success) {
          if (isUpdate) {
            updated++;
            console.log(`  🔄 ${dryRun ? 'Would update' : 'Updated'}: ${server.name} (${server.slug})`);
          } else {
            inserted++;
            console.log(`  ✅ ${dryRun ? 'Would insert' : 'Inserted'}: ${server.name} (${server.slug})`);
          }
        } else {
          errors++;
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < servers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
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
    const finalServers = await getExistingServers();
    console.log(`\n📊 Total servers in production: ${finalServers.size}`);

    if (!dryRun && finalServers.size >= 187) {
      console.log('\n🎉 SUCCESS! Production database now has 187+ servers!\n');
    } else if (dryRun) {
      console.log('\n✅ Dry run completed. Use without --dry-run flag to deploy.\n');
    } else {
      console.log(`\n⚠️  Warning: Expected 187+ servers, but database has ${finalServers.size}\n`);
    }

  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('OpenConductor Production Deployment (REST API)');
    console.log('='.repeat(60) + '\n');

    const servers = await loadAllServers();
    await deployToProduction(servers, isDryRun);

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
