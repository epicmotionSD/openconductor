# How to Manually Add Servers to OpenConductor Registry

There are three methods to add MCP servers to the OpenConductor registry:

---

## **Method 1: Add to Seed Script (Recommended for Bulk)**

Edit the seed file to add your servers, then run the seed script:

### 1. Add server data to seed.ts

File: `/packages/api/src/db/seed.ts`

```typescript
const sampleServers = [
  // ... existing servers ...
  {
    slug: 'my-new-server',           // URL-friendly identifier
    name: 'My New Server',           // Display name
    tagline: 'Short description',    // One-line description
    description: 'Full description of what this server does and its capabilities.',
    repository_url: 'https://github.com/owner/repo',
    repository_owner: 'owner',
    repository_name: 'repo',
    npm_package: '@scope/package-name', // or null if not on npm
    category: 'memory',              // memory, filesystem, database, api, custom
    tags: ['tag1', 'tag2', 'tag3'],
    install_command: 'npm install -g @scope/package-name',
    config_example: {
      mcpServers: {
        'my-server': {
          command: 'my-server-command',
          args: ['--option', 'value']
        }
      }
    },
    verified: false,                 // true for official/verified servers
    featured: false,                 // true to feature on homepage
    stats: {
      github_stars: 0,
      npm_downloads_weekly: 0,
      npm_downloads_total: 0,
      cli_installs: 0
    }
  }
];
```

### 2. Run the seed script

```bash
cd /home/roizen/projects/openconductor
POSTGRES_URL="postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres" node_modules/.bin/tsx packages/api/src/db/seed.ts
```

---

## **Method 2: Direct SQL Insert (Quick Single Server)**

Connect to the database and insert directly:

```bash
PGPASSWORD="29FHVZqmLEcx864X" psql -h aws-1-us-east-1.pooler.supabase.com -p 6543 -U postgres.fjmzvcipimpctqnhhfrr -d postgres
```

Then run:

```sql
-- Insert server
INSERT INTO mcp_servers (
  slug, name, tagline, description,
  repository_url, repository_owner, repository_name,
  npm_package, category, tags,
  install_command, config_example,
  verified, featured
) VALUES (
  'my-server',
  'My Server Name',
  'Short tagline',
  'Full description of the server and its capabilities.',
  'https://github.com/owner/repo',
  'owner',
  'repo',
  '@scope/package',
  'api',
  ARRAY['api', 'integration', 'automation'],
  'npm install -g @scope/package',
  '{"mcpServers": {"my-server": {"command": "my-server", "args": []}}}',
  false,
  false
) RETURNING id;

-- Insert stats (use the ID from above)
INSERT INTO server_stats (
  server_id,
  github_stars,
  npm_downloads_total,
  cli_installs
) VALUES (
  '<server-id-from-above>',
  100,
  500,
  25
);
```

---

## **Method 3: Create a Custom Seed Script**

Create a new file for your servers:

File: `/packages/api/src/db/add-my-servers.ts`

```typescript
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

const newServers = [
  {
    slug: 'server-1',
    name: 'Server 1',
    // ... full server object
  },
  // Add more servers here
];

async function addServers(db: DatabaseManager) {
  logger.info('Adding new servers to registry...');

  for (const server of newServers) {
    try {
      // Insert server
      const result = await db.query(
        `INSERT INTO mcp_servers (
          slug, name, tagline, description,
          repository_url, repository_owner, repository_name,
          npm_package, category, tags,
          install_command, config_example,
          verified, featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          tagline = EXCLUDED.tagline,
          description = EXCLUDED.description
        RETURNING id`,
        [
          server.slug, server.name, server.tagline, server.description,
          server.repository_url, server.repository_owner, server.repository_name,
          server.npm_package, server.category, server.tags,
          server.install_command, JSON.stringify(server.config_example),
          server.verified, server.featured
        ]
      );

      const serverId = result.rows[0].id;

      // Insert or update stats
      await db.query(
        `INSERT INTO server_stats (
          server_id, github_stars, npm_downloads_total, cli_installs
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (server_id) DO UPDATE SET
          github_stars = EXCLUDED.github_stars,
          npm_downloads_total = EXCLUDED.npm_downloads_total,
          cli_installs = EXCLUDED.cli_installs`,
        [
          serverId,
          server.stats.github_stars,
          server.stats.npm_downloads_total,
          server.stats.cli_installs
        ]
      );

      logger.info(`✓ Added server: ${server.name}`);
    } catch (error) {
      logger.error(`✗ Failed to add ${server.name}:`, error.message);
    }
  }
}

async function run() {
  const db = DatabaseManager.getInstance();
  try {
    await addServers(db);
    logger.info('All servers added successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to add servers:', error);
    process.exit(1);
  }
}

run();
```

Run it:

```bash
POSTGRES_URL="postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres" node_modules/.bin/tsx packages/api/src/db/add-my-servers.ts
```

---

## **Required Fields**

When adding a server, these fields are **required**:

- `slug` - Unique URL identifier (lowercase, hyphens)
- `name` - Display name
- `repository_url` - GitHub repository URL
- `repository_owner` - GitHub username/org
- `repository_name` - Repository name
- `category` - One of: `memory`, `filesystem`, `database`, `api`, `custom`

## **Optional Fields**

- `tagline` - Short one-liner
- `description` - Full description (recommended)
- `npm_package` - NPM package name
- `tags` - Array of tags
- `install_command` - Installation command
- `config_example` - Claude Desktop config example (JSON)
- `docs_url` - Documentation URL
- `homepage_url` - Homepage URL
- `verified` - Verified badge (default: false)
- `featured` - Featured on homepage (default: false)

## **Valid Categories**

- `memory` - Memory & State Management
- `filesystem` - File System Operations
- `database` - Database Integrations
- `api` - API & Web Services
- `search` - Search Engines
- `communication` - Communication (Slack, Email, etc.)
- `monitoring` - Monitoring & Analytics
- `development` - Development Tools
- `custom` - Custom/Other

---

## **Quick Example: Add a Single Server**

```bash
# Method 2 - Direct SQL (fastest for single server)
PGPASSWORD="29FHVZqmLEcx864X" psql -h aws-1-us-east-1.pooler.supabase.com -p 6543 -U postgres.fjmzvcipimpctqnhhfrr -d postgres -c "
INSERT INTO mcp_servers (slug, name, tagline, repository_url, repository_owner, repository_name, category, verified)
VALUES ('my-mcp', 'My MCP Server', 'Does amazing things', 'https://github.com/me/my-mcp', 'me', 'my-mcp', 'api', false)
RETURNING id;
"
```

Then add stats using the returned ID:

```bash
PGPASSWORD="29FHVZqmLEcx864X" psql -h aws-1-us-east-1.pooler.supabase.com -p 6543 -U postgres.fjmzvcipimpctqnhhfrr -d postgres -c "
INSERT INTO server_stats (server_id, github_stars, cli_installs)
VALUES ('<id-from-above>', 0, 0);
"
```

---

## **Verify Server Was Added**

Check the registry:

```bash
PGPASSWORD="29FHVZqmLEcx864X" psql -h aws-1-us-east-1.pooler.supabase.com -p 6543 -U postgres.fjmzvcipimpctqnhhfrr -d postgres -c "SELECT slug, name, category FROM mcp_servers ORDER BY created_at DESC LIMIT 5;"
```

Test the API:

```bash
curl "https://openconductor.ai/api/v1/servers?limit=20" | jq '.data.servers[] | {name, slug}'
```

---

## **Bulk Import from JSON**

If you have servers in JSON format, create a script to import them:

```typescript
import fs from 'fs';
import { DatabaseManager } from './connection';

const servers = JSON.parse(fs.readFileSync('servers.json', 'utf-8'));

async function importServers() {
  const db = DatabaseManager.getInstance();

  for (const server of servers) {
    // Insert logic here
  }
}

importServers();
```
