const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:epicmotionSD04%23@db.axuqrkhscyqmaglcdprd.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM mcp_servers');
    console.log('Total servers in database:', result.rows[0].count);
    
    const categories = await pool.query('SELECT category, COUNT(*) as count FROM mcp_servers GROUP BY category ORDER BY count DESC');
    console.log('\nBy category:');
    categories.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count}`);
    });
    
    const recent = await pool.query('SELECT name, category FROM mcp_servers ORDER BY created_at DESC LIMIT 10');
    console.log('\nMost recently added:');
    recent.rows.forEach(row => {
      console.log(`  ${row.name} (${row.category})`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

run();
