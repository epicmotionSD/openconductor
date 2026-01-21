#!/usr/bin/env npx ts-node

/**
 * Manual Revenue Sniper Runner
 *
 * Usage:
 *   npx ts-node src/scripts/run-sniper.ts
 *
 * Or via npm script:
 *   npm run sniper
 */

import { Pool } from 'pg';
import { runRevenueSniper } from '../jobs/revenue-sniper-cron';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🎯 Revenue Sniper - Manual Run');
  console.log('================================\n');

  // Check for required env vars
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.APIFY_TOKEN) {
    console.error('❌ APIFY_TOKEN not set');
    console.log('   Get your token at: https://console.apify.com/account/integrations');
    process.exit(1);
  }

  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    // Run sniper
    const result = await runRevenueSniper(pool);

    // Print top opportunities
    if (result.breakouts.length > 0) {
      console.log('\n🔥 TOP BREAKOUT OPPORTUNITIES:');
      console.log('─'.repeat(50));
      result.breakouts.slice(0, 5).forEach((s, i) => {
        console.log(`${i + 1}. ${s.keyword}`);
        console.log(`   Growth: +${s.growthRate}% | Competition: ${s.competitionLevel}`);
        console.log(`   Action: ${s.recommendedAction.toUpperCase()}`);
        console.log('');
      });
    }

    if (result.rising.length > 0) {
      console.log('\n📈 TOP RISING OPPORTUNITIES:');
      console.log('─'.repeat(50));
      result.rising.slice(0, 5).forEach((s, i) => {
        console.log(`${i + 1}. ${s.keyword}`);
        console.log(`   Growth: +${s.growthRate}% | Competition: ${s.competitionLevel}`);
        console.log('');
      });
    }

    console.log('\n✅ Sniper run complete!');
    console.log(`   Pages generated: ${result.pagesGenerated}`);
    console.log(`   Pages queued for deploy: ${result.pagesDeployed}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
