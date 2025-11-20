import { DatabaseManager } from './connection';
import winston from 'winston';
import { newServers2025 } from './seed-new-servers-2025';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

function calculatePopularityScore(stats: { github_stars: number; cli_installs: number }): number {
  const starWeight = 0.3;
  const installWeight = 0.7;

  const normalizedStars = Math.log10(stats.github_stars + 1);
  const normalizedInstalls = Math.log10(stats.cli_installs + 1);

  return Math.round((starWeight * normalizedStars + installWeight * normalizedInstalls) * 100) / 100;
}

export async function addNewServers2025(db: DatabaseManager): Promise<void> {
  logger.info(`Starting to add ${newServers2025.length} new servers to database`);

  let addedCount = 0;
  let skippedCount = 0;

  try {
    await db.transaction(async (client) => {
      for (const serverData of newServers2025) {
        // Add default fields if missing
        const server = {
          install_command: null,
          config_example: null,
          stats: {
            github_stars: 0,
            npm_downloads_weekly: 0,
            npm_downloads_total: 0,
            cli_installs: 0
          },
          ...serverData
        };
        try {
          // Check if server already exists by slug or repository URL
          const existing = await client.query(
            'SELECT id FROM mcp_servers WHERE slug = $1 OR repository_url = $2',
            [server.slug, server.repository_url]
          );

          if (existing.rows.length > 0) {
            logger.info(`Skipping existing server: ${server.slug} (duplicate slug or repository URL)`);
            skippedCount++;
            continue;
          }

          // Insert server
          let serverId;
          try {
            const serverResult = await client.query(`
              INSERT INTO mcp_servers (
                slug, name, tagline, description, repository_url, repository_owner,
                repository_name, npm_package, category, tags, install_command,
                config_example, verified, featured
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              RETURNING id
            `, [
              server.slug,
              server.name,
              server.tagline,
              server.description,
              server.repository_url,
              server.repository_owner,
              server.repository_name,
              server.npm_package,
              server.category,
              server.tags,
              server.install_command || null,
              server.config_example ? JSON.stringify(server.config_example) : null,
              server.verified,
              server.featured
            ]);

            serverId = serverResult.rows[0].id;
          } catch (insertError: any) {
            // Handle duplicate key violations gracefully
            if (insertError.code === '23505') { // unique_violation
              logger.info(`Skipping ${server.slug}: ${insertError.constraint}`);
              skippedCount++;
              continue;
            }
            throw insertError;
          }

          // Insert server stats if provided
          if (server.stats) {
            await client.query(`
              INSERT INTO server_stats (
                server_id, github_stars, npm_downloads_weekly, npm_downloads_total,
                cli_installs, popularity_score, trending_score
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              serverId,
              server.stats.github_stars || 0,
              server.stats.npm_downloads_weekly || 0,
              server.stats.npm_downloads_total || 0,
              server.stats.cli_installs || 0,
              calculatePopularityScore({
                github_stars: server.stats.github_stars || 0,
                cli_installs: server.stats.cli_installs || 0
              }),
              Math.random() * 10 // Random trending score for demo
            ]);
          } else {
            // Insert default stats
            await client.query(`
              INSERT INTO server_stats (
                server_id, github_stars, npm_downloads_weekly, npm_downloads_total,
                cli_installs, popularity_score, trending_score
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              serverId,
              0, 0, 0, 0, 0, 0
            ]);
          }

          // Insert a sample version
          await client.query(`
            INSERT INTO server_versions (
              server_id, version, tag_name, is_latest, published_at
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            serverId,
            '1.0.0',
            'v1.0.0',
            true,
            new Date()
          ]);

          logger.info(`✅ Added server: ${server.name} (${server.slug})`);
          addedCount++;
        } catch (error) {
          logger.error(`Failed to add server ${server.slug}:`, error);
          throw error;
        }
      }
    });

    logger.info(`\n========================================`);
    logger.info(`Successfully added ${addedCount} new servers`);
    logger.info(`Skipped ${skippedCount} existing servers`);
    logger.info(`Total processed: ${newServers2025.length}`);
    logger.info(`========================================\n`);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

// CLI script runner
if (require.main === module) {
  const { DatabaseManager } = require('./connection');

  async function run() {
    const db = DatabaseManager.getInstance();

    try {
      await addNewServers2025(db);
      process.exit(0);
    } catch (error) {
      logger.error('Add new servers script failed:', error);
      process.exit(1);
    }
  }

  run();
}
