/**
 * Comprehensive Database Seeding Script
 * Combines all server sources into a single comprehensive database seed
 *
 * Sources:
 * 1. seed-new-servers-2025.ts - Official and verified servers (2025 update)
 * 2. seed-additional-servers.json - High-value platform integrations
 * 3. seed-more-servers.json - Specialized categories (AI, Vector DBs, etc.)
 * 4. seed-specialized-servers.json - Domain-specific platforms
 */

import { DatabaseManager } from './connection';
import winston from 'winston';
import { readFileSync } from 'fs';
import { join } from 'path';
import { newServers2025 } from './seed-new-servers-2025.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

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

function loadJSONServers(filename: string): ServerData[] {
  try {
    const filePath = join(__dirname, filename);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.warn(`Could not load ${filename}:`, error);
    return [];
  }
}

function generateInstallCommand(server: ServerData): string {
  if (server.install_command) {
    return server.install_command;
  }

  if (server.npm_package) {
    return `npx -y ${server.npm_package}`;
  }

  if (server.pypi_package) {
    return `uvx ${server.pypi_package}`;
  }

  return `# See repository for installation instructions`;
}

function generateConfigExample(server: ServerData): any {
  if (server.config_example) {
    return server.config_example;
  }

  const serverKey = server.slug.replace('-mcp', '').replace(/-/g, '_');
  const command = server.npm_package || server.pypi_package || server.slug;

  return {
    mcpServers: {
      [serverKey]: {
        command: command,
        args: []
      }
    }
  };
}

function calculatePopularityScore(stats: any): number {
  if (!stats) return 0;

  const starWeight = 0.3;
  const installWeight = 0.7;

  const stars = stats.github_stars || 0;
  const installs = stats.cli_installs || 0;

  const normalizedStars = Math.log10(stars + 1);
  const normalizedInstalls = Math.log10(installs + 1);

  return Math.round((starWeight * normalizedStars + installWeight * normalizedInstalls) * 100) / 100;
}

export async function seedAllServers(db: DatabaseManager): Promise<void> {
  logger.info('Starting comprehensive database seeding');
  logger.info('Loading servers from all sources...');

  // Load servers from all sources
  const sources = [
    { name: 'seed-new-servers-2025.ts', servers: newServers2025 },
    { name: 'seed-additional-servers.json', servers: loadJSONServers('seed-additional-servers.json') },
    { name: 'seed-more-servers.json', servers: loadJSONServers('seed-more-servers.json') },
    { name: 'seed-specialized-servers.json', servers: loadJSONServers('seed-specialized-servers.json') }
  ];

  // Combine all servers
  const allServers: ServerData[] = [];
  const seenSlugs = new Set<string>();

  for (const source of sources) {
    logger.info(`Loading from ${source.name}: ${source.servers.length} servers`);

    for (const server of source.servers) {
      if (!seenSlugs.has(server.slug)) {
        allServers.push(server);
        seenSlugs.add(server.slug);
      } else {
        logger.warn(`Skipping duplicate server: ${server.slug} from ${source.name}`);
      }
    }
  }

  logger.info(`Total unique servers to seed: ${allServers.length}`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  try {
    for (const server of allServers) {
      try {
        // Check if server already exists (outside transaction)
        const existingServer = await db.query(
          'SELECT id FROM mcp_servers WHERE slug = $1',
          [server.slug]
        );

        if (existingServer.rows.length > 0) {
          logger.info(`Skipping existing server: ${server.name}`);
          skipCount++;
          continue;
        }

        // Use individual transaction for each server to avoid cascading failures
        await db.transaction(async (client) => {
          // Insert server with ON CONFLICT on slug and repository_url
          const serverResult = await client.query(`
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
            generateInstallCommand(server),
            JSON.stringify(generateConfigExample(server)),
            server.verified,
            server.featured
          ]);

          if (serverResult.rows.length === 0) {
            throw new Error('Server already exists (conflict)');
          }

          const serverId = serverResult.rows[0].id;

          // Insert server stats
          const stats = server.stats || {};
          await client.query(`
            INSERT INTO server_stats (
              server_id, github_stars, npm_downloads_weekly, npm_downloads_total,
              cli_installs, popularity_score, trending_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            serverId,
            stats.github_stars || 0,
            stats.npm_downloads_weekly || 0,
            stats.npm_downloads_total || 0,
            stats.cli_installs || 0,
            calculatePopularityScore(stats),
            Math.random() * 10 // Random trending score for initial seed
          ]);

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
        });

        successCount++;
        logger.info(`✓ Seeded server: ${server.name} (${server.slug})`);
      } catch (error: any) {
        // Skip errors from duplicate repository_url constraint
        if (error.message && error.message.includes('mcp_servers_repository_url_key')) {
          logger.warn(`⊘ Skipping ${server.name}: duplicate repository URL (${server.repository_url})`);
          skipCount++;
        } else if (error.message === 'Server already exists (conflict)') {
          logger.info(`Server already exists: ${server.name}`);
          skipCount++;
        } else {
          errorCount++;
          logger.error(`✗ Failed to seed server ${server.name}: ${error.message}`);
        }
      }
    }

    logger.info('\n=== Seeding Summary ===');
    logger.info(`Total servers processed: ${allServers.length}`);
    logger.info(`Successfully seeded: ${successCount}`);
    logger.info(`Skipped (duplicates): ${skipCount}`);
    logger.info(`Errors: ${errorCount}`);

    logger.info('\n✓ Database seeding completed successfully!');
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
      await seedAllServers(db);
      process.exit(0);
    } catch (error) {
      logger.error('Seed script failed:', error);
      process.exit(1);
    }
  }

  run();
}
