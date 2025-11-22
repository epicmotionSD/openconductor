import { DatabaseManager } from './connection';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

// Sample MCP servers data for seeding
const sampleServers = [
  {
    slug: 'openmemory',
    name: 'OpenMemory',
    tagline: 'Hierarchical memory for AI agents',
    description: 'Hierarchical memory management system for AI agents with long-term persistent storage and semantic search capabilities.',
    repository_url: 'https://github.com/openai/openmemory',
    repository_owner: 'openai',
    repository_name: 'openmemory',
    npm_package: 'openmemory',
    category: 'memory',
    tags: ['memory', 'storage', 'semantic-search', 'AI'],
    install_command: 'npm install -g openmemory',
    config_example: {
      mcpServers: {
        openmemory: {
          command: 'openmemory',
          args: ['--port', '8080']
        }
      }
    },
    verified: true,
    featured: true,
    stats: {
      github_stars: 1640,
      npm_downloads_weekly: 2100,
      npm_downloads_total: 15420,
      cli_installs: 847
    }
  },
  {
    slug: 'filesystem-mcp',
    name: 'Filesystem MCP',
    tagline: 'Secure file operations for AI agents',
    description: 'Secure file system operations for AI agents with sandboxed access to read, write, and manage files.',
    repository_url: 'https://github.com/anthropic/filesystem-mcp',
    repository_owner: 'anthropic',
    repository_name: 'filesystem-mcp',
    npm_package: '@anthropic/filesystem-mcp',
    category: 'filesystem',
    tags: ['filesystem', 'files', 'security', 'sandbox'],
    install_command: 'npm install -g @anthropic/filesystem-mcp',
    config_example: {
      mcpServers: {
        filesystem: {
          command: 'filesystem-mcp',
          args: ['--root', './workspace']
        }
      }
    },
    verified: true,
    featured: false,
    stats: {
      github_stars: 892,
      npm_downloads_weekly: 1200,
      npm_downloads_total: 8340,
      cli_installs: 523
    }
  },
  {
    slug: 'postgresql-mcp',
    name: 'PostgreSQL MCP',
    tagline: 'Database integration for PostgreSQL',
    description: 'Database integration for PostgreSQL with secure query execution and schema management capabilities.',
    repository_url: 'https://github.com/anthropic/postgresql-mcp',
    repository_owner: 'anthropic',
    repository_name: 'postgresql-mcp',
    npm_package: '@anthropic/postgresql-mcp',
    category: 'database',
    tags: ['database', 'postgresql', 'SQL', 'schema'],
    install_command: 'npm install -g @anthropic/postgresql-mcp',
    config_example: {
      mcpServers: {
        postgres: {
          command: 'postgresql-mcp',
          args: ['--connection', 'postgresql://user:pass@localhost/db']
        }
      }
    },
    verified: true,
    featured: false,
    stats: {
      github_stars: 654,
      npm_downloads_weekly: 580,
      npm_downloads_total: 4230,
      cli_installs: 298
    }
  },
  {
    slug: 'github-mcp',
    name: 'GitHub MCP',
    tagline: 'GitHub integration for repository management',
    description: 'GitHub integration for repository management, issue tracking, and pull request operations.',
    repository_url: 'https://github.com/anthropic/github-mcp',
    repository_owner: 'anthropic',
    repository_name: 'github-mcp',
    npm_package: '@anthropic/github-mcp',
    category: 'api',
    tags: ['github', 'git', 'repositories', 'API'],
    install_command: 'npm install -g @anthropic/github-mcp',
    config_example: {
      mcpServers: {
        github: {
          command: 'github-mcp',
          args: ['--token', '${GITHUB_TOKEN}']
        }
      }
    },
    verified: true,
    featured: true,
    stats: {
      github_stars: 1123,
      npm_downloads_weekly: 1400,
      npm_downloads_total: 9870,
      cli_installs: 672
    }
  },
  {
    slug: 'slack-mcp',
    name: 'Slack MCP',
    tagline: 'Slack workspace integration',
    description: 'Slack workspace integration for messaging, channel management, and team communication automation.',
    repository_url: 'https://github.com/slack/slack-mcp',
    repository_owner: 'slack',
    repository_name: 'slack-mcp',
    npm_package: '@slack/mcp-server',
    category: 'communication',
    tags: ['slack', 'messaging', 'team', 'communication'],
    install_command: 'npm install -g @slack/mcp-server',
    config_example: {
      mcpServers: {
        slack: {
          command: 'slack-mcp',
          args: ['--token', '${SLACK_BOT_TOKEN}']
        }
      }
    },
    verified: true,
    featured: false,
    stats: {
      github_stars: 789,
      npm_downloads_weekly: 820,
      npm_downloads_total: 5670,
      cli_installs: 445
    }
  },
  {
    slug: 'brave-search-mcp',
    name: 'Brave Search MCP',
    tagline: 'Privacy-focused web search',
    description: 'Web search capabilities powered by Brave Search API with privacy-focused results and ad-free searching.',
    repository_url: 'https://github.com/brave/search-mcp',
    repository_owner: 'brave',
    repository_name: 'search-mcp',
    npm_package: '@brave/search-mcp',
    category: 'search',
    tags: ['search', 'web', 'privacy', 'brave'],
    install_command: 'npm install -g @brave/search-mcp',
    config_example: {
      mcpServers: {
        search: {
          command: 'brave-search-mcp',
          args: ['--api-key', '${BRAVE_API_KEY}']
        }
      }
    },
    verified: true,
    featured: false,
    stats: {
      github_stars: 445,
      npm_downloads_weekly: 450,
      npm_downloads_total: 3210,
      cli_installs: 234
    }
  },
  {
    slug: 'google-drive-mcp',
    name: 'Google Drive MCP',
    tagline: 'Google Drive file management',
    description: 'Google Drive integration for file management, sharing, and collaborative document operations.',
    repository_url: 'https://github.com/google/drive-mcp',
    repository_owner: 'google',
    repository_name: 'drive-mcp',
    npm_package: '@google/drive-mcp',
    category: 'filesystem',
    tags: ['google-drive', 'cloud', 'documents', 'collaboration'],
    install_command: 'npm install -g @google/drive-mcp',
    config_example: {
      mcpServers: {
        drive: {
          command: 'google-drive-mcp',
          args: ['--credentials', './google-credentials.json']
        }
      }
    },
    verified: true,
    featured: false,
    stats: {
      github_stars: 623,
      npm_downloads_weekly: 650,
      npm_downloads_total: 4560,
      cli_installs: 321
    }
  },
  {
    slug: 'mem0-mcp',
    name: 'Mem0 MCP',
    tagline: 'Advanced memory layer for LLMs',
    description: 'Advanced memory layer for Large Language Models with persistent context and intelligent retrieval.',
    repository_url: 'https://github.com/mem0ai/mem0-mcp',
    repository_owner: 'mem0ai',
    repository_name: 'mem0-mcp',
    npm_package: 'mem0-mcp',
    category: 'memory',
    tags: ['memory', 'LLM', 'context', 'retrieval'],
    install_command: 'npm install -g mem0-mcp',
    config_example: {
      mcpServers: {
        mem0: {
          command: 'mem0-mcp',
          args: ['--config', './mem0-config.json']
        }
      }
    },
    verified: false,
    featured: false,
    stats: {
      github_stars: 890,
      npm_downloads_weekly: 920,
      npm_downloads_total: 6780,
      cli_installs: 456
    }
  },
  {
    slug: 'zep-memory-mcp',
    name: 'Zep Memory MCP',
    tagline: 'Conversational memory for AI',
    description: 'Conversational memory for AI applications with session management and long-term memory persistence.',
    repository_url: 'https://github.com/getzep/zep-mcp',
    repository_owner: 'getzep',
    repository_name: 'zep-mcp',
    npm_package: '@getzep/mcp-server',
    category: 'memory',
    tags: ['memory', 'conversation', 'session', 'persistence'],
    install_command: 'npm install -g @getzep/mcp-server',
    config_example: {
      mcpServers: {
        zep: {
          command: 'zep-mcp',
          args: ['--api-key', '${ZEP_API_KEY}']
        }
      }
    },
    verified: false,
    featured: false,
    stats: {
      github_stars: 620,
      npm_downloads_weekly: 530,
      npm_downloads_total: 3890,
      cli_installs: 267
    }
  },
  {
    slug: 'mongodb-mcp',
    name: 'MongoDB MCP',
    tagline: 'MongoDB database integration',
    description: 'MongoDB database integration with document operations, aggregation pipelines, and schema validation.',
    repository_url: 'https://github.com/mongodb/mcp-server',
    repository_owner: 'mongodb',
    repository_name: 'mcp-server',
    npm_package: '@mongodb/mcp-server',
    category: 'database',
    tags: ['mongodb', 'database', 'documents', 'aggregation'],
    install_command: 'npm install -g @mongodb/mcp-server',
    config_example: {
      mcpServers: {
        mongodb: {
          command: 'mongodb-mcp',
          args: ['--uri', 'mongodb://localhost:27017/mydb']
        }
      }
    },
    verified: false,
    featured: false,
    stats: {
      github_stars: 432,
      npm_downloads_weekly: 320,
      npm_downloads_total: 2340,
      cli_installs: 178
    }
  }
];

export async function seedDatabase(db: DatabaseManager): Promise<void> {
  logger.info('Starting database seeding');

  try {
    await db.transaction(async (client) => {
      // Insert servers
      for (const server of sampleServers) {
        // Insert server
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
          server.install_command,
          JSON.stringify(server.config_example),
          server.verified,
          server.featured
        ]);

        const serverId = serverResult.rows[0].id;

        // Insert server stats
        await client.query(`
          INSERT INTO server_stats (
            server_id, github_stars, npm_downloads_weekly, npm_downloads_total, 
            cli_installs, popularity_score, trending_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          serverId,
          server.stats.github_stars,
          server.stats.npm_downloads_weekly,
          server.stats.npm_downloads_total,
          server.stats.cli_installs,
          calculatePopularityScore(server.stats),
          Math.random() * 10 // Random trending score for demo
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

        logger.info(`Seeded server: ${server.name}`);
      }
    });

    logger.info(`Successfully seeded ${sampleServers.length} servers with stats and versions`);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

function calculatePopularityScore(stats: { github_stars: number; cli_installs: number }): number {
  // Simple popularity calculation - can be made more sophisticated
  const starWeight = 0.3;
  const installWeight = 0.7;
  
  const normalizedStars = Math.log10(stats.github_stars + 1);
  const normalizedInstalls = Math.log10(stats.cli_installs + 1);
  
  return Math.round((starWeight * normalizedStars + installWeight * normalizedInstalls) * 100) / 100;
}

// CLI script runner
if (require.main === module) {
  const { DatabaseManager } = require('./connection');
  
  async function run() {
    const db = DatabaseManager.getInstance();

    try {
      // Skip migrations as schema already exists
      // await db.migrate();
      await seedDatabase(db);
      process.exit(0);
    } catch (error) {
      logger.error('Seed script failed:', error);
      process.exit(1);
    }
  }
  
  run();
}