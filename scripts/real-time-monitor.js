#!/usr/bin/env node

/**
 * OpenConductor Real-Time Analytics Monitor
 *
 * Displays real-time install metrics, growth rates, and top servers
 * Updates every 5 seconds with latest data from ecosystem analytics
 *
 * Usage:
 *   DATABASE_URL="your-postgres-url" node scripts/real-time-monitor.js
 *
 * Or with Supabase:
 *   node scripts/real-time-monitor.js
 */

const { Client } = require('pg');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

async function monitorInstalls() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!connectionString) {
    console.error(colorize('❌ Error: DATABASE_URL environment variable not set', 'red'));
    console.log(colorize('Set it with: export DATABASE_URL="your-postgres-connection-string"', 'gray'));
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log(colorize('\n🚀 OpenConductor Real-Time Analytics Monitor', 'blue'));
    console.log(colorize('━'.repeat(60), 'gray'));
    console.log(colorize('Press Ctrl+C to exit\n', 'gray'));
  } catch (error) {
    console.error(colorize('❌ Database connection failed:', 'red'), error.message);
    process.exit(1);
  }

  async function fetchData() {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    try {
      // Get last hour installs
      const lastHour = await client.query(`
        SELECT
          COUNT(*) as count,
          COUNT(DISTINCT user_hash) as unique_users
        FROM ecosystem_events
        WHERE product = 'openconductor'
        AND event_type = 'install'
        AND created_at >= NOW() - INTERVAL '1 hour'
      `);

      // Get current vs previous hour growth
      const growth = await client.query(`
        SELECT
          COALESCE(
            (SELECT install_count
             FROM install_velocity
             WHERE product = 'openconductor'
             ORDER BY date DESC, hour DESC
             LIMIT 1),
            0
          ) as current,
          COALESCE(
            (SELECT install_count
             FROM install_velocity
             WHERE product = 'openconductor'
             ORDER BY date DESC, hour DESC
             LIMIT 1 OFFSET 1),
            0
          ) as previous
      `);

      const current = parseInt(growth.rows[0]?.current) || 0;
      const previous = parseInt(growth.rows[0]?.previous) || 0;
      const growthCount = current - previous;
      const growthRate = previous > 0 ? ((growthCount / previous) * 100).toFixed(1) : '0.0';

      // Get top servers (24h)
      const topServers = await client.query(`
        SELECT
          server_slug,
          COUNT(*) as installs
        FROM ecosystem_events
        WHERE event_type = 'install'
        AND server_slug IS NOT NULL
        AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY server_slug
        ORDER BY installs DESC
        LIMIT 5
      `);

      // Get total users
      const totalUsers = await client.query(`
        SELECT COUNT(DISTINCT user_hash) as count
        FROM user_journeys
      `);

      // Get ecosystem referrals (24h)
      const ecosystemReferrals = await client.query(`
        SELECT
          metadata->>'destination' as destination,
          COUNT(*) as count
        FROM ecosystem_events
        WHERE event_type = 'ecosystem_referral'
        AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY metadata->>'destination'
        ORDER BY count DESC
      `);

      // Clear screen
      console.clear();

      // Header
      console.log(colorize('╔' + '═'.repeat(58) + '╗', 'blue'));
      console.log(colorize('║', 'blue') + colorize(' OpenConductor Real-Time Analytics'.padEnd(58), 'bright') + colorize('║', 'blue'));
      console.log(colorize('╚' + '═'.repeat(58) + '╝', 'blue'));
      console.log(colorize(`Last updated: ${timestamp}`, 'gray') + '\n');

      // Last Hour Metrics
      console.log(colorize('📊 LAST HOUR', 'bright'));
      console.log(colorize('─'.repeat(60), 'gray'));

      const hourInstalls = parseInt(lastHour.rows[0].count);
      const hourUsers = parseInt(lastHour.rows[0].unique_users);

      console.log(`   Installs: ${colorize(hourInstalls.toString().padStart(6), 'green')}`);
      console.log(`   Unique Users: ${colorize(hourUsers.toString().padStart(6), 'cyan')}`);

      // Growth rate with color coding
      const growthColor = growthCount > 0 ? 'green' : growthCount < 0 ? 'red' : 'yellow';
      const growthSign = growthCount > 0 ? '+' : '';
      console.log(`   Growth Rate: ${colorize(`${growthSign}${growthRate}%`, growthColor)} (${growthSign}${growthCount} installs)`);
      console.log();

      // Current Hour vs Previous
      console.log(colorize('⏱️  HOURLY COMPARISON', 'bright'));
      console.log(colorize('─'.repeat(60), 'gray'));
      console.log(`   Current Hour: ${colorize(current.toString().padStart(6), 'cyan')}`);
      console.log(`   Previous Hour: ${colorize(previous.toString().padStart(6), 'gray')}`);
      console.log();

      // Total Users
      const totalUserCount = parseInt(totalUsers.rows[0].count);
      console.log(colorize('👥 TOTAL ECOSYSTEM USERS', 'bright'));
      console.log(colorize('─'.repeat(60), 'gray'));
      console.log(`   Unique Users: ${colorize(totalUserCount.toString().padStart(6), 'magenta')}`);
      console.log();

      // Top Servers (24h)
      console.log(colorize('🔥 TOP SERVERS (24 HOURS)', 'bright'));
      console.log(colorize('─'.repeat(60), 'gray'));

      if (topServers.rows.length > 0) {
        topServers.rows.forEach((row, i) => {
          const rank = (i + 1).toString().padStart(2);
          const slug = (row.server_slug || 'unknown').padEnd(30);
          const installs = row.installs.toString().padStart(5);
          console.log(`   ${colorize(rank, 'gray')}. ${slug} ${colorize(installs, 'yellow')}`);
        });
      } else {
        console.log(colorize('   No installs in the last 24 hours', 'gray'));
      }
      console.log();

      // Ecosystem Referrals (24h)
      console.log(colorize('🔗 CROSS-PRODUCT DISCOVERY (24 HOURS)', 'bright'));
      console.log(colorize('─'.repeat(60), 'gray'));

      if (ecosystemReferrals.rows.length > 0) {
        ecosystemReferrals.rows.forEach((row) => {
          const dest = (row.destination || 'unknown').padEnd(20);
          const count = row.count.toString().padStart(5);
          console.log(`   → ${colorize(dest, 'cyan')} ${colorize(count, 'magenta')} discoveries`);
        });
      } else {
        console.log(colorize('   No ecosystem referrals yet', 'gray'));
      }
      console.log();

      // Footer
      console.log(colorize('─'.repeat(60), 'gray'));
      console.log(colorize('Refreshing every 5 seconds... Press Ctrl+C to exit', 'gray'));

    } catch (error) {
      console.error(colorize('❌ Error fetching data:', 'red'), error.message);
    }
  }

  // Initial fetch
  await fetchData();

  // Update every 5 seconds
  const interval = setInterval(fetchData, 5000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    client.end();
    console.log(colorize('\n\n👋 Monitor stopped. Goodbye!', 'blue'));
    process.exit(0);
  });
}

// Run monitor
monitorInstalls().catch(error => {
  console.error(colorize('Fatal error:', 'red'), error);
  process.exit(1);
});
