#!/usr/bin/env npx tsx

/**
 * Run stacks migration
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../src/db/connection.js';

async function runMigration() {
  console.log('🔄 Running stacks migration...\n');

  try {
    // Read the migration SQL
    const migrationSQL = readFileSync(
      join(process.cwd(), 'src/db/migrations/create-stacks-tables.sql'),
      'utf-8'
    );

    // Execute the migration
    await db.query(migrationSQL);

    console.log('✅ Stacks tables created successfully!\n');

    // Verify the stacks were seeded
    const result = await db.query('SELECT slug, name, short_code FROM stacks ORDER BY slug');

    console.log('📋 Seeded stacks:');
    result.rows.forEach((stack: any) => {
      console.log(`  • ${stack.name} (${stack.slug}) - Short code: /${stack.short_code}`);
    });

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runMigration();
