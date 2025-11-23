#!/usr/bin/env npx tsx

/**
 * Link servers to stacks
 */

import { db } from '../src/db/connection.js';

// Define which servers belong to which stack
const STACK_CONFIGS = {
  essential: [
    'filesystem-mcp',      // Filesystem access
    'brave-search-mcp',    // Web search
    'fetch-mcp',           // HTTP requests
    'time-mcp',            // Time utilities
    'mcp-memory'           // Persistent memory
  ],
  coder: [
    'github-mcp',          // GitHub integration
    'postgresql-mcp',      // PostgreSQL database
    'filesystem-mcp',      // Filesystem access
    'mcp-memory',          // Persistent memory
    'sequential-thinking', // Sequential thinking
    'brave-search-mcp'     // Web search
  ],
  writer: [
    'brave-search-mcp',    // Web research
    'fetch-mcp',           // HTTP requests
    'filesystem-mcp',      // Filesystem access
    'mcp-memory',          // Persistent memory
    'google-drive-mcp'     // Google Drive
  ]
};

async function linkServers() {
  console.log('🔗 Linking servers to stacks...\n');

  try {
    for (const [stackSlug, serverSlugs] of Object.entries(STACK_CONFIGS)) {
      console.log(`\n📦 ${stackSlug} stack:`);

      // Get stack ID
      const stackResult = await db.query(
        'SELECT id, name FROM stacks WHERE slug = $1',
        [stackSlug]
      );

      if (stackResult.rows.length === 0) {
        console.log(`  ❌ Stack "${stackSlug}" not found`);
        continue;
      }

      const stack = stackResult.rows[0];
      console.log(`  Stack: ${stack.name}`);

      // Link each server
      for (let i = 0; i < serverSlugs.length; i++) {
        const serverSlug = serverSlugs[i];

        // Find server by slug
        const serverResult = await db.query(
          'SELECT id, name FROM mcp_servers WHERE slug = $1',
          [serverSlug]
        );

        if (serverResult.rows.length === 0) {
          console.log(`  ⚠️  Server "${serverSlug}" not found - skipping`);
          continue;
        }

        const server = serverResult.rows[0];

        // Insert into stack_servers (with conflict handling)
        await db.query(
          `INSERT INTO stack_servers (stack_id, server_id, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (stack_id, server_id) DO UPDATE
           SET sort_order = EXCLUDED.sort_order`,
          [stack.id, server.id, i]
        );

        console.log(`  ✅ ${i + 1}. ${server.name} (${serverSlug})`);
      }
    }

    console.log('\n\n📊 Final Stack Summary:\n');

    // Show summary
    const summaryResult = await db.query(`
      SELECT
        s.slug,
        s.name,
        COUNT(ss.server_id) as server_count
      FROM stacks s
      LEFT JOIN stack_servers ss ON s.id = ss.stack_id
      GROUP BY s.id, s.slug, s.name
      ORDER BY s.slug
    `);

    summaryResult.rows.forEach((row: any) => {
      console.log(`  ${row.name}: ${row.server_count} servers`);
    });

    console.log('\n✅ Server linking complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

linkServers();
