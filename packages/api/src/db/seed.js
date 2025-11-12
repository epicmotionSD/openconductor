const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'openconductor.db');
const db = new Database(dbPath);

// Sample MCP servers data
const servers = [
  {
    name: 'OpenMemory',
    slug: 'openmemory',
    description: 'Hierarchical memory management system for AI agents with long-term persistent storage and semantic search capabilities.',
    repository: 'https://github.com/openai/openmemory',
    npmPackage: 'openmemory',
    category: 'memory',
    tags: ['memory', 'storage', 'semantic-search', 'AI'],
    stats: {
      githubStars: 1640,
      downloads: 15420,
      lastUpdated: new Date('2024-11-10').toISOString(),
    },
    installation: {
      npm: 'npm install -g openmemory',
      manual: 'git clone https://github.com/openai/openmemory'
    },
    configExample: {
      mcpServers: {
        openmemory: {
          command: 'openmemory',
          args: ['--port', '8080']
        }
      }
    },
    verified: true
  },
  {
    name: 'Filesystem MCP',
    slug: 'filesystem-mcp',
    description: 'Secure file system operations for AI agents with sandboxed access to read, write, and manage files.',
    repository: 'https://github.com/anthropic/filesystem-mcp',
    npmPackage: '@anthropic/filesystem-mcp',
    category: 'filesystem',
    tags: ['filesystem', 'files', 'security', 'sandbox'],
    stats: {
      githubStars: 892,
      downloads: 8340,
      lastUpdated: new Date('2024-11-08').toISOString(),
    },
    installation: {
      npm: 'npm install -g @anthropic/filesystem-mcp',
      manual: 'Download from GitHub releases'
    },
    configExample: {
      mcpServers: {
        filesystem: {
          command: 'filesystem-mcp',
          args: ['--root', './workspace']
        }
      }
    },
    verified: true
  },
  {
    name: 'PostgreSQL MCP',
    slug: 'postgresql-mcp',
    description: 'Database integration for PostgreSQL with secure query execution and schema management capabilities.',
    repository: 'https://github.com/anthropic/postgresql-mcp',
    npmPackage: '@anthropic/postgresql-mcp',
    category: 'database',
    tags: ['database', 'postgresql', 'SQL', 'schema'],
    stats: {
      githubStars: 654,
      downloads: 4230,
      lastUpdated: new Date('2024-11-05').toISOString(),
    },
    installation: {
      npm: 'npm install -g @anthropic/postgresql-mcp',
      docker: 'docker pull anthropic/postgresql-mcp'
    },
    configExample: {
      mcpServers: {
        postgres: {
          command: 'postgresql-mcp',
          args: ['--connection', 'postgresql://user:pass@localhost/db']
        }
      }
    },
    verified: true
  },
  {
    name: 'GitHub MCP',
    slug: 'github-mcp',
    description: 'GitHub integration for repository management, issue tracking, and pull request operations.',
    repository: 'https://github.com/anthropic/github-mcp',
    npmPackage: '@anthropic/github-mcp',
    category: 'api',
    tags: ['github', 'git', 'repositories', 'API'],
    stats: {
      githubStars: 1123,
      downloads: 9870,
      lastUpdated: new Date('2024-11-09').toISOString(),
    },
    installation: {
      npm: 'npm install -g @anthropic/github-mcp',
      manual: 'Clone and build from source'
    },
    configExample: {
      mcpServers: {
        github: {
          command: 'github-mcp',
          args: ['--token', '${GITHUB_TOKEN}']
        }
      }
    },
    verified: true
  },
  {
    name: 'Slack MCP',
    slug: 'slack-mcp',
    description: 'Slack workspace integration for messaging, channel management, and team communication automation.',
    repository: 'https://github.com/slack/slack-mcp',
    npmPackage: '@slack/mcp-server',
    category: 'api',
    tags: ['slack', 'messaging', 'team', 'communication'],
    stats: {
      githubStars: 789,
      downloads: 5670,
      lastUpdated: new Date('2024-11-07').toISOString(),
    },
    installation: {
      npm: 'npm install -g @slack/mcp-server',
      manual: 'Download from Slack developer portal'
    },
    configExample: {
      mcpServers: {
        slack: {
          command: 'slack-mcp',
          args: ['--token', '${SLACK_BOT_TOKEN}']
        }
      }
    },
    verified: true
  },
  {
    name: 'Brave Search MCP',
    slug: 'brave-search-mcp',
    description: 'Web search capabilities powered by Brave Search API with privacy-focused results and ad-free searching.',
    repository: 'https://github.com/brave/search-mcp',
    npmPackage: '@brave/search-mcp',
    category: 'api',
    tags: ['search', 'web', 'privacy', 'brave'],
    stats: {
      githubStars: 445,
      downloads: 3210,
      lastUpdated: new Date('2024-11-06').toISOString(),
    },
    installation: {
      npm: 'npm install -g @brave/search-mcp',
      manual: 'Build from source'
    },
    configExample: {
      mcpServers: {
        search: {
          command: 'brave-search-mcp',
          args: ['--api-key', '${BRAVE_API_KEY}']
        }
      }
    },
    verified: true
  },
  {
    name: 'Google Drive MCP',
    slug: 'google-drive-mcp',
    description: 'Google Drive integration for file management, sharing, and collaborative document operations.',
    repository: 'https://github.com/google/drive-mcp',
    npmPackage: '@google/drive-mcp',
    category: 'filesystem',
    tags: ['google-drive', 'cloud', 'documents', 'collaboration'],
    stats: {
      githubStars: 623,
      downloads: 4560,
      lastUpdated: new Date('2024-11-04').toISOString(),
    },
    installation: {
      npm: 'npm install -g @google/drive-mcp',
      manual: 'OAuth setup required'
    },
    configExample: {
      mcpServers: {
        drive: {
          command: 'google-drive-mcp',
          args: ['--credentials', './google-credentials.json']
        }
      }
    },
    verified: true
  },
  {
    name: 'Mem0 MCP',
    slug: 'mem0-mcp',
    description: 'Advanced memory layer for Large Language Models with persistent context and intelligent retrieval.',
    repository: 'https://github.com/mem0ai/mem0-mcp',
    npmPackage: 'mem0-mcp',
    category: 'memory',
    tags: ['memory', 'LLM', 'context', 'retrieval'],
    stats: {
      githubStars: 890,
      downloads: 6780,
      lastUpdated: new Date('2024-11-03').toISOString(),
    },
    installation: {
      npm: 'npm install -g mem0-mcp',
      docker: 'docker pull mem0/mcp-server'
    },
    configExample: {
      mcpServers: {
        mem0: {
          command: 'mem0-mcp',
          args: ['--config', './mem0-config.json']
        }
      }
    },
    verified: false
  },
  {
    name: 'Zep Memory MCP',
    slug: 'zep-memory-mcp',
    description: 'Conversational memory for AI applications with session management and long-term memory persistence.',
    repository: 'https://github.com/getzep/zep-mcp',
    npmPackage: '@getzep/mcp-server',
    category: 'memory',
    tags: ['memory', 'conversation', 'session', 'persistence'],
    stats: {
      githubStars: 620,
      downloads: 3890,
      lastUpdated: new Date('2024-11-02').toISOString(),
    },
    installation: {
      npm: 'npm install -g @getzep/mcp-server',
      docker: 'docker pull getzep/mcp'
    },
    configExample: {
      mcpServers: {
        zep: {
          command: 'zep-mcp',
          args: ['--api-key', '${ZEP_API_KEY}']
        }
      }
    },
    verified: false
  },
  {
    name: 'MongoDB MCP',
    slug: 'mongodb-mcp',
    description: 'MongoDB database integration with document operations, aggregation pipelines, and schema validation.',
    repository: 'https://github.com/mongodb/mcp-server',
    npmPackage: '@mongodb/mcp-server',
    category: 'database',
    tags: ['mongodb', 'database', 'documents', 'aggregation'],
    stats: {
      githubStars: 432,
      downloads: 2340,
      lastUpdated: new Date('2024-11-01').toISOString(),
    },
    installation: {
      npm: 'npm install -g @mongodb/mcp-server',
      manual: 'Requires MongoDB connection'
    },
    configExample: {
      mcpServers: {
        mongodb: {
          command: 'mongodb-mcp',
          args: ['--uri', 'mongodb://localhost:27017/mydb']
        }
      }
    },
    verified: false
  }
];

// Insert servers into database
const insertServer = db.prepare(`
  INSERT OR REPLACE INTO servers (
    id, name, slug, description, repository, npm_package, category, tags,
    github_stars, downloads, last_updated, installation, config_example, verified
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  console.log('🌱 Seeding database with MCP servers...');
  
  const insertMany = db.transaction((servers) => {
    for (const server of servers) {
      const id = `mcp-${server.slug}`;
      insertServer.run(
        id,
        server.name,
        server.slug,
        server.description,
        server.repository,
        server.npmPackage || null,
        server.category,
        JSON.stringify(server.tags),
        server.stats.githubStars,
        server.stats.downloads,
        server.stats.lastUpdated,
        JSON.stringify(server.installation),
        JSON.stringify(server.configExample),
        server.verified ? 1 : 0
      );
    }
  });

  insertMany(servers);
  console.log(`✅ Successfully seeded ${servers.length} MCP servers`);
  
} catch (error) {
  console.error('❌ Database seeding failed:', error);
  process.exit(1);
} finally {
  db.close();
}