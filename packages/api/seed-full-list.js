const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: "postgresql://postgres:epicmotionSD04%23@db.axuqrkhscyqmaglcdprd.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function seedFromFullList() {
  const servers = JSON.parse(fs.readFileSync('./src/db/mcp-servers-full-list.json', 'utf-8'));
  
  console.log(`Seeding ${servers.length} servers from mcp-servers-full-list.json`);
  
  let success = 0, skipped = 0, errors = 0;
  
  for (const server of servers) {
    try {
      // Check if exists
      const existing = await pool.query('SELECT id FROM mcp_servers WHERE slug = $1', [server.slug]);
      if (existing.rows.length > 0) {
        console.log(`⊘ Skip existing: ${server.name}`);
        skipped++;
        continue;
      }
      
      // Install command
      let installCmd = server.install_command;
      if (!installCmd) {
        if (server.npm_package) installCmd = `npx -y ${server.npm_package}`;
        else if (server.pypi_package) installCmd = `uvx ${server.pypi_package}`;
        else installCmd = '# See repository for installation';
      }
      
      // Config example
      const serverKey = server.slug.replace('-mcp', '').replace(/-/g, '_');
      const configExample = JSON.stringify({
        mcpServers: { [serverKey]: { command: server.npm_package || server.pypi_package || server.slug, args: [] } }
      });
      
      // Insert server
      const result = await pool.query(`
        INSERT INTO mcp_servers (
          slug, name, tagline, description, repository_url, repository_owner,
          repository_name, npm_package, pypi_package, category, tags, install_command,
          config_example, verified, featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `, [
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
        installCmd,
        configExample,
        server.verified,
        server.featured
      ]);
      
      if (result.rows.length > 0) {
        const serverId = result.rows[0].id;
        
        // Insert stats
        await pool.query(`
          INSERT INTO server_stats (server_id, github_stars, npm_downloads_weekly, npm_downloads_total, cli_installs, popularity_score, trending_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [serverId, 0, 0, 0, 0, 0, Math.random() * 10]);
        
        // Insert version
        await pool.query(`
          INSERT INTO server_versions (server_id, version, tag_name, is_latest, published_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [serverId, '1.0.0', 'v1.0.0', true, new Date()]);
        
        console.log(`✓ Seeded: ${server.name}`);
        success++;
      }
    } catch (err) {
      if (err.message.includes('duplicate') || err.message.includes('constraint')) {
        console.log(`⊘ Skip duplicate: ${server.name}`);
        skipped++;
      } else {
        console.error(`✗ Error on ${server.name}: ${err.message}`);
        errors++;
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Success: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  // Final count
  const final = await pool.query('SELECT COUNT(*) as count FROM mcp_servers');
  console.log(`\nTotal servers in database: ${final.rows[0].count}`);
  
  await pool.end();
}

seedFromFullList().catch(console.error);
