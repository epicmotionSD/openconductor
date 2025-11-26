# Stacks API Documentation

**Base URL:** `https://api.openconductor.ai/v1`

The Stacks API provides endpoints for managing curated collections of MCP servers bundled with optimized system prompts.

---

## Overview

**What are Stacks?**

Stacks are curated collections of MCP servers designed for specific workflows (coding, writing, essential tools, etc.). Each stack includes:

1. **MCP Servers** - 3-6 pre-selected servers that work well together
2. **System Prompt** - Pre-written Claude Desktop custom instructions
3. **Metadata** - Name, description, icon, short code for sharing

**Use Cases:**
- CLI tool: `openconductor stack install coder`
- Frontend: Display available stacks on website
- Integrations: One-click stack installation
- Analytics: Track stack popularity

---

## Authentication

No authentication required for read operations. All stacks endpoints are publicly accessible.

---

## Endpoints

### 1. List All Stacks

**Endpoint:** `GET /v1/stacks`

**Description:** Returns a list of all available stacks with basic information.

**Request:**
```bash
curl https://api.openconductor.ai/v1/stacks
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stacks": [
      {
        "id": "e5f39526-76f6-4e4b-8a69-3c27f4d2c05a",
        "slug": "coder",
        "name": "Coder Stack",
        "description": "Complete development environment optimized for software engineering. Build, debug, and deploy like a senior engineer.",
        "tagline": "Build, debug, and deploy like a senior engineer",
        "icon": "🧑‍💻",
        "short_code": "coder",
        "install_count": 42,
        "created_at": "2025-11-22T04:12:42.955Z",
        "server_count": "6"
      },
      {
        "id": "9dec5f8f-80dd-4ab5-999f-21685198f53b",
        "slug": "essential",
        "name": "Essential Stack",
        "description": "Fundamental tools for everyday AI assistance. Everything you need to get started with Claude.",
        "tagline": "Everything you need to get started",
        "icon": "⚡",
        "short_code": "essential",
        "install_count": 103,
        "created_at": "2025-11-22T04:12:42.955Z",
        "server_count": "5"
      },
      {
        "id": "a9e7e05a-bb93-4045-8082-4017e3462b6f",
        "slug": "writer",
        "name": "Writer Stack",
        "description": "Comprehensive writing and research assistant. Research, write, and publish with confidence.",
        "tagline": "Research, write, and publish with confidence",
        "icon": "✍️",
        "short_code": "writer",
        "install_count": 67,
        "created_at": "2025-11-22T04:12:42.955Z",
        "server_count": "5"
      }
    ]
  }
}
```

**Response Fields:**
- `id` (string) - UUID of the stack
- `slug` (string) - URL-friendly identifier (use for API calls)
- `name` (string) - Display name
- `description` (string) - Detailed description
- `tagline` (string) - Short one-liner description
- `icon` (string) - Emoji icon for display
- `short_code` (string) - Code for short URLs (e.g., `/s/coder`)
- `install_count` (number) - Number of times installed
- `created_at` (string) - ISO 8601 timestamp
- `server_count` (string) - Number of servers in stack

---

### 2. Get Stack Details

**Endpoint:** `GET /v1/stacks/:slug`

**Description:** Returns complete details for a specific stack, including the list of servers and system prompt.

**Request:**
```bash
curl https://api.openconductor.ai/v1/stacks/coder
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "e5f39526-76f6-4e4b-8a69-3c27f4d2c05a",
    "slug": "coder",
    "name": "Coder Stack",
    "description": "Complete development environment optimized for software engineering. Build, debug, and deploy like a senior engineer.",
    "tagline": "Build, debug, and deploy like a senior engineer",
    "icon": "🧑‍💻",
    "short_code": "coder",
    "system_prompt": "You are Claude with the Coder Stack - an advanced development environment...",
    "install_count": 42,
    "created_at": "2025-11-22T04:12:42.955Z",
    "servers": [
      {
        "id": "3f7faba4-8484-4f3a-b72b-ee457ddd95f0",
        "slug": "github-mcp",
        "name": "GitHub MCP Server",
        "description": "Interact with GitHub repositories, issues, and pull requests",
        "repository_url": "https://github.com/modelcontextprotocol/servers",
        "npm_package": "@modelcontextprotocol/server-github",
        "category": "development",
        "tags": ["github", "git", "version-control"],
        "sort_order": 0,
        "github_stars": 1234
      },
      {
        "id": "8c2e1f9a-4b3d-4e6f-9a1b-2c3d4e5f6a7b",
        "slug": "postgresql-mcp",
        "name": "PostgreSQL MCP Server",
        "description": "Query and manage PostgreSQL databases",
        "repository_url": "https://github.com/modelcontextprotocol/servers",
        "npm_package": "@modelcontextprotocol/server-postgres",
        "category": "database",
        "tags": ["postgresql", "database", "sql"],
        "sort_order": 1,
        "github_stars": 856
      }
      // ... more servers
    ]
  }
}
```

**Response Fields:**
- All fields from list endpoint, plus:
- `system_prompt` (string) - Complete system prompt for Claude Desktop
- `servers` (array) - List of MCP servers in the stack
  - Each server includes: `id`, `slug`, `name`, `description`, `repository_url`, `npm_package`, `category`, `tags`, `sort_order`, `github_stars`

**Error Responses:**
```json
// Stack not found (404)
{
  "error": "Stack not found",
  "statusCode": 404
}
```

---

### 3. Track Stack Installation

**Endpoint:** `POST /v1/stacks/:slug/install`

**Description:** Increments the install count for a stack. Used for analytics.

**Request:**
```bash
curl -X POST https://api.openconductor.ai/v1/stacks/coder/install
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "e5f39526-76f6-4e4b-8a69-3c27f4d2c05a",
    "slug": "coder",
    "name": "Coder Stack",
    "install_count": 43
  }
}
```

**Notes:**
- No authentication required
- Anonymous tracking only
- Call this endpoint after successful stack installation
- Safe to call multiple times (idempotent increment)

**Error Responses:**
```json
// Stack not found (404)
{
  "error": "Stack not found",
  "statusCode": 404
}
```

---

### 4. Short URL Redirect

**Endpoint:** `GET /v1/s/:code`

**Description:** Redirects short codes to full stack endpoints. Used for sharing.

**Request:**
```bash
curl -L https://api.openconductor.ai/v1/s/coder
```

**Behavior:**
- Redirects to: `/v1/stacks/coder`
- HTTP 302 redirect
- If code not found, redirects to `/stacks`

**Example:**
```bash
# Short URL
https://openconductor.ai/s/coder

# Redirects to
https://api.openconductor.ai/v1/stacks/coder
```

---

## Server Configuration

Each server in a stack includes information needed to install it:

**Server Object:**
```json
{
  "id": "3f7faba4-8484-4f3a-b72b-ee457ddd95f0",
  "slug": "github-mcp",
  "name": "GitHub MCP Server",
  "description": "Interact with GitHub repositories, issues, and pull requests",
  "repository_url": "https://github.com/modelcontextprotocol/servers",
  "npm_package": "@modelcontextprotocol/server-github",
  "category": "development",
  "tags": ["github", "git", "version-control"],
  "sort_order": 0,
  "github_stars": 1234
}
```

**Getting Install Configuration:**

Use the servers endpoint to get installation config:
```bash
curl https://api.openconductor.ai/v1/servers/github-mcp/install
```

See [API Documentation](./API.md) for full servers API reference.

---

## Usage Examples

### Frontend Integration

**Display available stacks on homepage:**
```javascript
async function loadStacks() {
  const response = await fetch('https://api.openconductor.ai/v1/stacks');
  const { data } = await response.json();

  return data.stacks.map(stack => ({
    id: stack.slug,
    name: stack.name,
    tagline: stack.tagline,
    icon: stack.icon,
    serverCount: stack.server_count,
    installs: stack.install_count
  }));
}
```

**Show stack details:**
```javascript
async function getStackDetails(slug) {
  const response = await fetch(`https://api.openconductor.ai/v1/stacks/${slug}`);
  const { data } = await response.json();

  return {
    name: data.name,
    description: data.description,
    servers: data.servers.map(s => ({
      name: s.name,
      description: s.description,
      stars: s.github_stars
    })),
    systemPrompt: data.system_prompt
  };
}
```

---

### CLI Integration

**Install a stack:**
```javascript
import { ApiClient } from './api-client.js';
import { ConfigManager } from './config-manager.js';

async function installStack(stackSlug) {
  const api = new ApiClient();
  const config = new ConfigManager();

  // 1. Fetch stack details
  const response = await api.client.get(`/stacks/${stackSlug}`);
  const stack = response.data;

  // 2. Install each server
  for (const server of stack.servers) {
    const installConfig = await api.client.get(
      `/servers/${server.slug}/install`
    );
    await config.addServer(server.slug, installConfig.data.config);
  }

  // 3. Track installation
  await api.client.post(`/stacks/${stackSlug}/install`);

  // 4. Return system prompt
  return stack.system_prompt;
}
```

---

### Analytics Dashboard

**Track stack popularity:**
```javascript
async function getStackStats() {
  const response = await fetch('https://api.openconductor.ai/v1/stacks');
  const { data } = await response.json();

  const stats = data.stacks.map(stack => ({
    name: stack.name,
    installs: stack.install_count,
    servers: parseInt(stack.server_count)
  }));

  // Sort by popularity
  stats.sort((a, b) => b.installs - a.installs);

  return stats;
}
```

---

## Database Schema

**Stacks Table:**
```sql
CREATE TABLE stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tagline VARCHAR(255),
  icon VARCHAR(10),
  short_code VARCHAR(10) UNIQUE,
  system_prompt TEXT NOT NULL,
  install_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Stack-Server Relationship:**
```sql
CREATE TABLE stack_servers (
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (stack_id, server_id)
);
```

---

## Rate Limits

- **Read operations** (GET): 100 requests/minute per IP
- **Write operations** (POST): 10 requests/minute per IP
- **Burst limit**: 200 requests/minute

Standard rate limits apply. See main [API Documentation](./API.md) for details.

---

## Error Handling

All errors follow the standard API error format:

```json
{
  "error": "Error message",
  "statusCode": 404,
  "details": "Optional additional context"
}
```

**Common Error Codes:**
- `404` - Stack not found
- `500` - Internal server error
- `429` - Rate limit exceeded

---

## Changelog

**v1.0.0** (November 2025)
- Initial stacks API release
- 3 stacks: Essential, Coder, Writer
- List, details, install tracking endpoints
- Short URL support

---

## Support

**Documentation:**
- User Guide: [STACKS_FEATURE.md](./STACKS_FEATURE.md)
- Main API Docs: [API.md](./API.md)

**Contact:**
- Issues: [github.com/epicmotionSD/openconductor/issues](https://github.com/epicmotionSD/openconductor/issues)
- Email: hello@openconductor.ai
- Twitter: [@openconductor](https://twitter.com/openconductor)
