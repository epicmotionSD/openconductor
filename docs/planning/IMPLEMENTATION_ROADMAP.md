# OpenConductor x Apify: Implementation Roadmap
## Technical Execution Plan

This document translates the strategic vision into actionable engineering tasks, organized by the three phases outlined in the strategic alignment plan.

---

## Phase 1: Smart Registry Actor (Weeks 1-4)

**Goal**: Port existing OpenConductor registry to Apify Actor with basic PPE search events

### 1.1 Project Setup

#### Task 1.1.1: Create Apify Actor Package Structure
```bash
# Create new package in monorepo
mkdir -p packages/apify-actor
cd packages/apify-actor

# Initialize with Apify template
npm init
npm install apify@^3.0.0 axios@^1.6.2
```

**Files to Create**:
- `packages/apify-actor/package.json`
- `packages/apify-actor/src/main.js` (Actor entry point)
- `packages/apify-actor/Dockerfile` (Actor container config)
- `packages/apify-actor/.actor/actor.json` (Actor metadata)
- `packages/apify-actor/.actor/INPUT_SCHEMA.json` (Input validation)

**Acceptance Criteria**:
- [ ] Package builds successfully
- [ ] Can run locally with `apify run`
- [ ] Input schema validates correctly

---

#### Task 1.1.2: Define Actor Input/Output Schemas

**Input Schema** (`packages/apify-actor/.actor/INPUT_SCHEMA.json`):
```json
{
  "title": "OpenConductor Deployer Input",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "event": {
      "title": "Event Type",
      "type": "string",
      "description": "The operation to perform",
      "enum": ["search", "validate", "deploy", "config"],
      "default": "search",
      "editor": "select"
    },
    "query": {
      "title": "Search Query",
      "type": "string",
      "description": "Natural language or keyword search query",
      "editor": "textfield"
    },
    "slug": {
      "title": "Server Slug",
      "type": "string",
      "description": "Server identifier for validate/deploy events",
      "editor": "textfield"
    },
    "category": {
      "title": "Category Filter",
      "type": "string",
      "description": "Filter by category",
      "enum": ["", "memory", "filesystem", "database", "api", "search", "communication", "monitoring", "development", "custom"],
      "editor": "select"
    },
    "verified": {
      "title": "Verified Only",
      "type": "boolean",
      "description": "Return only verified servers",
      "default": false,
      "editor": "checkbox"
    },
    "limit": {
      "title": "Result Limit",
      "type": "integer",
      "description": "Maximum number of results",
      "default": 10,
      "minimum": 1,
      "maximum": 100,
      "editor": "number"
    },
    "apifyToken": {
      "title": "Apify API Token",
      "type": "string",
      "description": "Your Apify API token (required for deploy event)",
      "editor": "textfield",
      "isSecret": true
    }
  },
  "required": ["event"]
}
```

**Output Schema**: Always returns:
```json
{
  "success": true|false,
  "event": "search|validate|deploy",
  "cost": 0.02,
  "data": { /* event-specific data */ },
  "meta": {
    "executionTime": 1234,
    "cached": true|false,
    "version": "1.0.0"
  },
  "error": { /* if success=false */ }
}
```

**Acceptance Criteria**:
- [ ] Schema passes Apify validation
- [ ] Input editor renders correctly in Apify Console
- [ ] Secret fields are properly masked

---

### 1.2 Core Registry Logic

#### Task 1.2.1: Port API Client to Actor

**Source**: `packages/cli/src/lib/api-client.js`
**Target**: `packages/apify-actor/src/lib/registry-client.js`

**Changes Needed**:
1. Replace `axios` with Apify's `gotScraping` (better for Actor environment)
2. Remove CLI-specific error handling
3. Add Apify Key-Value Store caching
4. Return structured Actor output format

**Example Implementation**:
```javascript
import { Actor } from 'apify';
import { gotScraping } from 'got-scraping';

export class RegistryClient {
  constructor() {
    this.baseURL = process.env.OPENCONDUCTOR_API_URL || 'https://api.openconductor.ai/v1';
  }

  async searchServers(params) {
    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = await Actor.getValue(cacheKey);

    if (cached && Date.now() - cached.timestamp < 3600000) {
      return { ...cached.data, meta: { cached: true } };
    }

    const response = await gotScraping({
      url: `${this.baseURL}/servers`,
      searchParams: params,
      responseType: 'json'
    });

    await Actor.setValue(cacheKey, {
      data: response.body.data,
      timestamp: Date.now()
    });

    return { ...response.body.data, meta: { cached: false } };
  }
}
```

**Acceptance Criteria**:
- [ ] All API methods ported (search, getServer, getCategories)
- [ ] Caching reduces execution time by >70%
- [ ] Error handling returns proper Actor output format

---

#### Task 1.2.2: Implement PPE Event Tracking

**Location**: `packages/apify-actor/src/main.js`

**PPE Event Definitions** (Phase 1 only):
```javascript
const PPE_EVENTS = {
  search_basic: 0.02,
  search_semantic: 0.05,  // Future: AI-powered search
  generate_config: 0.01
};

async function chargeEvent(eventName) {
  await Actor.addPayPerEvent({
    eventName,
    eventValue: PPE_EVENTS[eventName]
  });

  console.log(`[PPE] Charged $${PPE_EVENTS[eventName]} for ${eventName}`);
}
```

**Event Flow**:
```javascript
import { Actor } from 'apify';
import { RegistryClient } from './lib/registry-client.js';

await Actor.init();

const input = await Actor.getInput();
const client = new RegistryClient();
const startTime = Date.now();

try {
  let result;

  switch (input.event) {
    case 'search':
      await chargeEvent('search_basic');
      result = await client.searchServers({
        q: input.query,
        category: input.category,
        verified: input.verified,
        limit: input.limit
      });
      break;

    case 'config':
      await chargeEvent('generate_config');
      result = await client.getCLIConfig(input.slug);
      break;

    default:
      throw new Error(`Unknown event: ${input.event}`);
  }

  await Actor.pushData({
    success: true,
    event: input.event,
    cost: PPE_EVENTS[input.event === 'search' ? 'search_basic' : input.event],
    data: result,
    meta: {
      executionTime: Date.now() - startTime,
      cached: result.meta?.cached || false,
      version: '1.0.0'
    }
  });

} catch (error) {
  console.error('[ERROR]', error);

  await Actor.pushData({
    success: false,
    event: input.event,
    cost: 0,  // Don't charge for errors
    error: {
      message: error.message,
      type: error.name
    },
    meta: {
      executionTime: Date.now() - startTime
    }
  });
}

await Actor.exit();
```

**Acceptance Criteria**:
- [ ] PPE charges appear in Apify Console transaction log
- [ ] No charge on error conditions
- [ ] Execution completes in <2 seconds for cached requests

---

### 1.3 Deployment & Publishing

#### Task 1.3.1: Create Dockerfile

**Location**: `packages/apify-actor/Dockerfile`

```dockerfile
FROM apify/actor-node:20

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional \
 && echo "Installed NPM packages:" \
 && (npm list --only=prod --no-optional --all || true) \
 && echo "Node version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

# Copy source code
COPY . ./

# Run the Actor
CMD npm start
```

**Acceptance Criteria**:
- [ ] Image builds successfully
- [ ] Image size < 200MB
- [ ] Runs with Node.js 20

---

#### Task 1.3.2: Write Actor README

**Location**: `packages/apify-actor/README.md`

**Required Sections**:
1. **What is OpenConductor**: Brief intro to MCP ecosystem
2. **What does this Actor do**: Discovery + deployment capabilities
3. **Input parameters**: Detailed explanation of each field
4. **Output format**: Example responses
5. **Pricing**: PPE event costs clearly listed
6. **MCP Integration**: How to use with `apify-mcp-server`
7. **Examples**: 3-5 common use cases with code snippets
8. **FAQ**: Common questions

**MCP Integration Example**:
```json
{
  "mcpServers": {
    "openconductor": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-apify",
        "--actor-id",
        "your-username/openconductor-deployer"
      ],
      "env": {
        "APIFY_API_TOKEN": "your-apify-token"
      }
    }
  }
}
```

**Acceptance Criteria**:
- [ ] README passes Apify Store quality review
- [ ] Includes video demo or GIF
- [ ] Links to OpenConductor main site

---

#### Task 1.3.3: Submit to Apify Store

**Pre-submission Checklist**:
- [ ] Actor runs successfully for 10 test cases
- [ ] No credentials or secrets in code
- [ ] All environment variables documented
- [ ] Screenshots prepared (3-5 images)
- [ ] Category selected: "AI & Machine Learning"
- [ ] Tags added: mcp, ai-agents, claude, registry, discovery
- [ ] Pricing model: Pay-Per-Event
- [ ] Event prices configured in Console

**Submission Steps**:
1. Push to Apify: `apify push`
2. Test in Apify Console
3. Click "Publish to Store"
4. Fill out listing form
5. Submit for review

**Expected Timeline**: 3-5 business days for approval

**Acceptance Criteria**:
- [ ] Actor approved and listed publicly
- [ ] Store listing has >4.5★ rating target
- [ ] First 10 users successfully run Actor

---

## Phase 2: Validation Layer (Weeks 5-8)

**Goal**: Add server health checking with `validate_server` PPE event

### 2.1 Validation Protocol Design

#### Task 2.1.1: Define Validation Criteria

**What makes an MCP server "valid"?**
1. **Repository accessible**: GitHub repo exists and is public
2. **Installation possible**: Has `package.json` or `Dockerfile`
3. **MCP compliant**: Responds to `tools/list` request
4. **Tools enumeration**: Returns at least 1 tool
5. **Response time**: Responds within 10 seconds

**Validation Levels**:
- **Basic**: Repository exists, has installation method (free, cached)
- **Standard**: Basic + installs successfully ($0.05)
- **Full**: Standard + responds to tools/list ($0.10)

---

#### Task 2.1.2: Research Docker-in-Docker Approach

**Challenge**: Apify Actors run in Docker containers. Can we spawn nested containers?

**Option A: Docker-in-Docker (DinD)**
```javascript
import { execSync } from 'child_process';

async function validateServer(repoUrl) {
  // Clone repo
  execSync(`git clone ${repoUrl} /tmp/mcp-server`);

  // Build Docker container
  execSync('docker build -t mcp-test /tmp/mcp-server');

  // Run and test
  const result = execSync('docker run --rm mcp-test tools/list');
  return JSON.parse(result);
}
```

**Pros**: Full isolation, accurate testing
**Cons**: Requires privileged mode, slow (60+ seconds)

**Option B: Direct Node.js Execution (Recommended)**
```javascript
import { spawn } from 'child_process';
import path from 'path';

async function validateServer(repoUrl, npmPackage) {
  // Install package in temporary directory
  const tempDir = '/tmp/mcp-validation';
  execSync(`mkdir -p ${tempDir}`);
  execSync(`npm install ${npmPackage}`, { cwd: tempDir });

  // Spawn MCP server process
  const serverProcess = spawn('npx', ['-y', npmPackage], {
    cwd: tempDir,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Send tools/list request via stdio
  serverProcess.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }) + '\n');

  // Wait for response (with 10s timeout)
  const response = await waitForResponse(serverProcess.stdout, 10000);

  serverProcess.kill();

  return response;
}
```

**Pros**: Faster (10-20 seconds), works in Apify environment
**Cons**: Less isolated, npm-only (no Docker images)

**Decision**: Start with Option B (faster, simpler), add Option A in Phase 4 if needed

---

### 2.2 Implementation

#### Task 2.2.1: Create Validation Module

**Location**: `packages/apify-actor/src/lib/validator.js`

```javascript
import { Actor } from 'apify';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class ServerValidator {
  constructor() {
    this.tempDir = '/tmp/mcp-validation';
  }

  async validate(server) {
    const startTime = Date.now();
    const results = {
      slug: server.slug,
      timestamp: new Date().toISOString(),
      checks: {},
      status: 'unknown',
      tools: []
    };

    try {
      // Check 1: Repository accessible
      results.checks.repositoryAccessible = await this.checkRepository(server.repository.url);

      // Check 2: Has installation method
      results.checks.hasInstallMethod = !!(server.packages.npm || server.packages.docker);

      // Check 3: Can install
      if (server.packages.npm) {
        results.checks.installSuccessful = await this.attemptNpmInstall(server.packages.npm.name);
      }

      // Check 4: MCP compliant
      if (results.checks.installSuccessful) {
        const mcpResponse = await this.testMCPProtocol(server.packages.npm.name);
        results.checks.mcpCompliant = mcpResponse.success;
        results.tools = mcpResponse.tools || [];
      }

      // Determine overall status
      const allPassed = Object.values(results.checks).every(v => v === true);
      results.status = allPassed ? 'verified' : 'failed';

      results.executionTime = Date.now() - startTime;

    } catch (error) {
      results.status = 'error';
      results.error = error.message;
    }

    return results;
  }

  async checkRepository(repoUrl) {
    try {
      // Simple HEAD request to GitHub
      const response = await fetch(repoUrl.replace('github.com', 'api.github.com/repos'), {
        method: 'HEAD'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async attemptNpmInstall(packageName) {
    try {
      // Clean temp directory
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true });
      }
      fs.mkdirSync(this.tempDir, { recursive: true });

      // Create minimal package.json
      fs.writeFileSync(
        path.join(this.tempDir, 'package.json'),
        JSON.stringify({ name: 'mcp-validation-temp', version: '1.0.0' })
      );

      // Install package (with 60s timeout)
      execSync(`npm install ${packageName} --no-save --quiet`, {
        cwd: this.tempDir,
        timeout: 60000,
        stdio: 'ignore'
      });

      return true;
    } catch {
      return false;
    }
  }

  async testMCPProtocol(packageName) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        serverProcess.kill();
        resolve({ success: false, error: 'Timeout' });
      }, 10000);

      const serverProcess = spawn('npx', ['-y', packageName], {
        cwd: this.tempDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      serverProcess.stdout.on('data', (data) => {
        stdout += data.toString();

        // Try to parse as JSON-RPC response
        try {
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;

            const response = JSON.parse(line);

            if (response.id === 1 && response.result) {
              clearTimeout(timeout);
              serverProcess.kill();

              resolve({
                success: true,
                tools: response.result.tools || []
              });
              return;
            }
          }
        } catch {
          // Not valid JSON yet, keep waiting
        }
      });

      // Send tools/list request
      serverProcess.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }) + '\n');
    });
  }
}
```

**Acceptance Criteria**:
- [ ] Can validate npm-based MCP servers
- [ ] Completes in <30 seconds
- [ ] Handles errors gracefully (no crashes)
- [ ] Cleanup temp files after validation

---

#### Task 2.2.2: Add Validation Event to Main Actor

**Update**: `packages/apify-actor/src/main.js`

```javascript
import { ServerValidator } from './lib/validator.js';

// Add to PPE_EVENTS
const PPE_EVENTS = {
  search_basic: 0.02,
  validate_server: 0.10,  // NEW
  generate_config: 0.01
};

// Add to switch statement
case 'validate':
  await chargeEvent('validate_server');

  // Get server details first
  const server = await client.getServer(input.slug);
  if (!server) {
    throw new Error(`Server not found: ${input.slug}`);
  }

  // Run validation
  const validator = new ServerValidator();
  result = await validator.validate(server);
  break;
```

**Acceptance Criteria**:
- [ ] Validation event charges $0.10
- [ ] Returns structured validation results
- [ ] Updates database with validation status (see Task 2.3.1)

---

### 2.3 Database Integration

#### Task 2.3.1: Add Validation Results Table

**Migration**: Create `packages/api/src/db/migrations/003_validation_results.sql`

```sql
-- Table: server_validations
CREATE TABLE IF NOT EXISTS server_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('verified', 'failed', 'error')),
  checks JSONB NOT NULL DEFAULT '{}',
  tools JSONB,
  execution_time_ms INTEGER,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,

  -- Metadata
  validator_version VARCHAR(20),
  validation_method VARCHAR(50) -- 'npm', 'docker', 'manual'
);

-- Index for fast lookups
CREATE INDEX idx_server_validations_server_id ON server_validations(server_id);
CREATE INDEX idx_server_validations_status ON server_validations(status);
CREATE INDEX idx_server_validations_validated_at ON server_validations(validated_at DESC);

-- View: Latest validation per server
CREATE OR REPLACE VIEW server_latest_validation AS
SELECT DISTINCT ON (server_id)
  server_id,
  status,
  checks,
  tools,
  validated_at
FROM server_validations
ORDER BY server_id, validated_at DESC;
```

**API Endpoint**: `POST /servers/:slug/validate`

**Handler** (`packages/api/src/routes/servers.ts`):
```typescript
router.post('/:slug/validate', async (req, res) => {
  const { slug } = req.params;

  // Trigger Apify Actor validation
  const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });

  const run = await apifyClient.actor('your-username/openconductor-deployer').call({
    event: 'validate',
    slug
  });

  const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems();
  const validationResult = dataset.items[0];

  // Store in database
  const server = await mcpServerRepository.findBySlug(slug);
  await db.query(`
    INSERT INTO server_validations (server_id, status, checks, tools, execution_time_ms)
    VALUES ($1, $2, $3, $4, $5)
  `, [
    server.id,
    validationResult.data.status,
    validationResult.data.checks,
    validationResult.data.tools,
    validationResult.meta.executionTime
  ]);

  res.json({ success: true, validation: validationResult.data });
});
```

**Acceptance Criteria**:
- [ ] Migration runs successfully
- [ ] Validation results persist correctly
- [ ] Frontend can display validation badges (see Task 2.4.1)

---

### 2.4 Frontend Integration

#### Task 2.4.1: Add Validation Badges to Server Cards

**Location**: `packages/frontend/components/ServerCard.tsx`

**Visual Design**:
```tsx
{server.latestValidation && (
  <Badge
    variant={server.latestValidation.status === 'verified' ? 'success' : 'error'}
    className="ml-2"
  >
    {server.latestValidation.status === 'verified' && (
      <>
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Validated {formatDistanceToNow(server.latestValidation.validatedAt)} ago
      </>
    )}
    {server.latestValidation.status === 'failed' && (
      <>
        <XCircleIcon className="w-4 h-4 mr-1" />
        Validation Failed
      </>
    )}
  </Badge>
)}
```

**Acceptance Criteria**:
- [ ] Badges display correctly on server cards
- [ ] Clicking badge shows detailed validation report
- [ ] "Validate Now" button triggers new validation

---

## Phase 3: The Deployer (Weeks 9-16)

**Goal**: Enable one-click deployment of MCP servers to Apify

### 3.1 Apify Actor Creation API

#### Task 3.1.1: Research Apify API Capabilities

**Key API Endpoints**:
```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: userApifyToken });

// Create new Actor
const actor = await client.actors().create({
  name: 'my-mcp-server',
  title: 'My MCP Server',
  description: 'Deployed via OpenConductor',
  dockerImage: 'apify/actor-node:20',
  environmentVariables: [
    { name: 'MCP_SERVER_REPO', value: 'github.com/user/repo' }
  ]
});

// Build Actor
await client.actor(actor.id).build();

// Get Actor endpoint
const actorInfo = await client.actor(actor.id).get();
console.log(`Actor URL: https://api.apify.com/v2/acts/${actor.id}/runs`);
```

**Security Considerations**:
- User's `APIFY_TOKEN` must be handled as secret input
- Token should NEVER be logged or stored
- Token should be used transiently and discarded
- Implement token validation before deployment

---

#### Task 3.1.2: Design Deployment Flow

**User Journey**:
1. User finds MCP server: `openconductor search postgres`
2. User requests deployment: Via CLI, API, or Agent
3. OpenConductor Actor:
   - Validates server is deployable
   - Creates Actor in user's Apify account
   - Configures MCP wrapper
   - Waits for build completion
   - Returns connection details
4. User connects MCP client to deployed server

**Flow Diagram**:
```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  User   │────>│ OpenConductor│────>│ Apify API   │────>│ User's   │
│         │     │    Actor     │     │             │     │ Account  │
└─────────┘     └──────────────┘     └─────────────┘     └──────────┘
    │                  │                     │                  │
    │ 1. Deploy        │                     │                  │
    │  Request         │                     │                  │
    ├─────────────────>│                     │                  │
    │                  │ 2. Validate         │                  │
    │                  │    Server           │                  │
    │                  │                     │                  │
    │                  │ 3. Create Actor     │                  │
    │                  ├────────────────────>│                  │
    │                  │                     │ 4. New Actor     │
    │                  │                     ├─────────────────>│
    │                  │ 5. Actor Details    │                  │
    │                  │<────────────────────┤                  │
    │ 6. Connection    │                     │                  │
    │    Details       │                     │                  │
    │<─────────────────┤                     │                  │
```

---

### 3.2 Implementation

#### Task 3.2.1: Create Deployer Module

**Location**: `packages/apify-actor/src/lib/deployer.js`

```javascript
import { ApifyClient } from 'apify-client';

export class MCPDeployer {
  constructor(userToken) {
    if (!userToken) {
      throw new Error('Apify token required for deployment');
    }

    // Validate token format
    if (!userToken.startsWith('apify_api_')) {
      throw new Error('Invalid Apify token format');
    }

    this.client = new ApifyClient({ token: userToken });
  }

  async deploy(server) {
    const actorName = `mcp-${server.slug}`;

    console.log(`[DEPLOY] Starting deployment for ${server.slug}`);

    try {
      // Step 1: Validate server is deployable
      if (!server.packages.npm && !server.packages.docker) {
        throw new Error('Server must have npm or docker package');
      }

      // Step 2: Check if Actor already exists
      let actor;
      try {
        actor = await this.client.actor(actorName).get();
        console.log(`[DEPLOY] Actor ${actorName} already exists, updating...`);
      } catch {
        // Actor doesn't exist, create new
        console.log(`[DEPLOY] Creating new Actor ${actorName}`);

        actor = await this.client.actors().create({
          name: actorName,
          title: server.name,
          description: `MCP Server: ${server.description || server.tagline}`,

          // Use MCP wrapper base image
          dockerImage: 'apify/actor-node:20',

          // Environment variables
          environmentVariables: [
            { name: 'MCP_SERVER_PACKAGE', value: server.packages.npm?.name },
            { name: 'MCP_SERVER_COMMAND', value: 'npx' },
            { name: 'MCP_SERVER_ARGS', value: `-y ${server.packages.npm?.name}` }
          ],

          // Default input schema (MCP passthrough)
          inputSchema: {
            title: `${server.name} MCP Server`,
            type: 'object',
            schemaVersion: 1,
            properties: {}
          }
        });

        console.log(`[DEPLOY] Actor created: ${actor.id}`);
      }

      // Step 3: Build Actor
      console.log(`[DEPLOY] Building Actor...`);
      const build = await this.client.actor(actor.id).build();

      // Step 4: Wait for build completion (with timeout)
      const buildStatus = await this.waitForBuild(build.id, 180000); // 3 min timeout

      if (buildStatus !== 'SUCCEEDED') {
        throw new Error(`Build failed with status: ${buildStatus}`);
      }

      console.log(`[DEPLOY] Build completed successfully`);

      // Step 5: Return connection details
      return {
        success: true,
        actor: {
          id: actor.id,
          name: actorName,
          url: `https://console.apify.com/actors/${actor.id}`,
          apiEndpoint: `https://api.apify.com/v2/acts/${actor.id}/runs`,
        },
        mcpConfig: this.generateMCPConfig(actor.id),
        buildStatus: buildStatus,
        deployedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[DEPLOY] Error:`, error);
      throw error;
    }
  }

  async waitForBuild(buildId, timeout = 180000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const build = await this.client.build(buildId).get();

      if (build.status === 'SUCCEEDED' || build.status === 'FAILED') {
        return build.status;
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Build timeout');
  }

  generateMCPConfig(actorId) {
    return {
      mcpServers: {
        [`deployed-${actorId}`]: {
          command: 'npx',
          args: [
            '-y',
            '@modelcontextprotocol/server-apify',
            '--actor-id',
            actorId
          ],
          env: {
            APIFY_API_TOKEN: 'your-apify-token'
          }
        }
      }
    };
  }
}
```

**Acceptance Criteria**:
- [ ] Successfully creates Actors in test account
- [ ] Handles existing Actors gracefully (updates vs. creates)
- [ ] Build completes successfully for npm-based servers
- [ ] Returns valid MCP configuration

---

#### Task 3.2.2: Add Deploy Event to Main Actor

**Update**: `packages/apify-actor/src/main.js`

```javascript
import { MCPDeployer } from './lib/deployer.js';

// Add to PPE_EVENTS
const PPE_EVENTS = {
  search_basic: 0.02,
  validate_server: 0.10,
  deploy_to_apify: 2.00,  // NEW - High value event
  generate_config: 0.01
};

// Add to switch statement
case 'deploy':
  // Validate input
  if (!input.apifyToken) {
    throw new Error('apifyToken required for deployment');
  }

  if (!input.slug) {
    throw new Error('slug required for deployment');
  }

  // Charge event BEFORE deployment (non-refundable)
  await chargeEvent('deploy_to_apify');

  // Get server details
  const serverToDeploy = await client.getServer(input.slug);
  if (!serverToDeploy) {
    throw new Error(`Server not found: ${input.slug}`);
  }

  // Deploy
  const deployer = new MCPDeployer(input.apifyToken);
  result = await deployer.deploy(serverToDeploy);

  // Log deployment for analytics
  console.log(`[ANALYTICS] Deployed ${input.slug} for user`);

  break;
```

**Acceptance Criteria**:
- [ ] Deployment charges $2.00 PPE event
- [ ] Token is never logged or exposed
- [ ] Deployment completes in <3 minutes
- [ ] Returns valid connection details

---

### 3.3 Security Audit

#### Task 3.3.1: Token Security Review

**Checklist**:
- [ ] Tokens marked as `isSecret: true` in INPUT_SCHEMA
- [ ] No `console.log(input.apifyToken)` anywhere in code
- [ ] No token storage (localStorage, database, Key-Value Store)
- [ ] Token scoped correctly (user can only deploy to their own account)
- [ ] Error messages don't leak token (check stack traces)

**Testing**:
1. Deploy with valid token → Success
2. Deploy with invalid token → Clear error, no leakage
3. Check Apify logs → No token in logs
4. Check dataset output → No token in output
5. Trigger error during deployment → No token in error message

---

#### Task 3.3.2: Rate Limiting

**Protection**: Prevent abuse (single user deploying 1000 servers)

**Implementation**: Use Apify's built-in rate limiting or add custom:

```javascript
import { Actor } from 'apify';

// Store deployment count per user (by token hash)
const tokenHash = crypto.createHash('sha256').update(input.apifyToken).digest('hex');
const rateLimitKey = `deploy-rate-${tokenHash}`;

const deployCount = await Actor.getValue(rateLimitKey) || 0;

if (deployCount > 10) {
  throw new Error('Rate limit exceeded. Max 10 deployments per hour.');
}

await Actor.setValue(rateLimitKey, deployCount + 1, { contentType: 'application/json' });
```

**Acceptance Criteria**:
- [ ] Users can deploy max 10 servers per hour
- [ ] Rate limit resets after 1 hour
- [ ] Clear error message when limit exceeded

---

### 3.4 Frontend/CLI Integration

#### Task 3.4.1: Add Deploy Command to CLI

**Location**: `packages/cli/src/commands/deploy.js`

```javascript
import { Command } from 'commander';
import inquirer from 'inquirer';
import { ApifyClient } from 'apify-client';

export const deployCommand = new Command('deploy')
  .description('Deploy an MCP server to Apify cloud hosting')
  .argument('<slug>', 'Server slug to deploy')
  .option('--token <token>', 'Apify API token (or set APIFY_API_TOKEN env var)')
  .action(async (slug, options) => {
    console.log(`\nDeploying ${slug} to Apify...\n`);

    // Get Apify token
    let apifyToken = options.token || process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Enter your Apify API token:',
          validate: (input) => input.length > 0 || 'Token required'
        }
      ]);
      apifyToken = answers.token;
    }

    // Call OpenConductor Deployer Actor
    const client = new ApifyClient({ token: apifyToken });

    const run = await client.actor('your-username/openconductor-deployer').call({
      event: 'deploy',
      slug,
      apifyToken
    });

    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    const result = dataset.items[0];

    if (result.success) {
      console.log('\n✅ Deployment successful!\n');
      console.log(`Actor URL: ${result.data.actor.url}`);
      console.log(`\nAdd to your Claude Desktop config:\n`);
      console.log(JSON.stringify(result.data.mcpConfig, null, 2));
    } else {
      console.error('\n❌ Deployment failed:', result.error.message);
    }
  });
```

**Usage**:
```bash
openconductor deploy postgres-mcp --token apify_api_xxx
```

**Acceptance Criteria**:
- [ ] CLI successfully triggers deployment
- [ ] Outputs MCP config for user to copy
- [ ] Handles errors gracefully

---

## Phase 4: Optimization & Scaling (Weeks 17-24)

### 4.1 Performance Optimization

#### Task 4.1.1: Implement Aggressive Caching

**Current**: Basic Key-Value Store caching
**Target**: Multi-layer caching with smart invalidation

**Layers**:
1. **L1 - In-Memory** (Actor runtime): 1-minute TTL
2. **L2 - Key-Value Store** (persistent): 1-hour TTL
3. **L3 - API Cache** (Redis): 24-hour TTL

**Example**:
```javascript
class CacheManager {
  constructor() {
    this.memCache = new Map();
  }

  async get(key) {
    // L1: Memory
    if (this.memCache.has(key)) {
      const cached = this.memCache.get(key);
      if (Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
    }

    // L2: KV Store
    const kvCached = await Actor.getValue(key);
    if (kvCached && Date.now() - kvCached.timestamp < 3600000) {
      this.memCache.set(key, kvCached);
      return kvCached.data;
    }

    // L3: API (with cache header)
    const response = await fetch(`${API_URL}?key=${key}`, {
      headers: { 'Cache-Control': 'max-age=86400' }
    });

    const data = await response.json();

    const cacheEntry = { data, timestamp: Date.now() };
    this.memCache.set(key, cacheEntry);
    await Actor.setValue(key, cacheEntry);

    return data;
  }
}
```

**Expected Impact**: Reduce compute costs by 70%

---

#### Task 4.1.2: Optimize Docker Image Size

**Current**: ~180MB
**Target**: <100MB

**Tactics**:
- Use `FROM apify/actor-node:20-alpine` (smaller base)
- Remove dev dependencies
- Use `.dockerignore` to exclude unnecessary files
- Multi-stage builds

---

### 4.2 Affiliate Program Integration

#### Task 4.2.1: Add Affiliate Tracking

**Implementation**: Track referrals from OpenConductor to Apify

**Mechanism**:
1. Generate unique referral code: `OPENCONDUCTOR`
2. Embed in CLI output:
   ```
   Want to host this 24/7 in the cloud?
   Sign up for Apify and get $5 credit: https://apify.com/ref/openconductor
   ```
3. Track conversions via Apify affiliate dashboard

**Expected Revenue**: $500-750/month after 6 months

---

### 4.3 Enterprise Features

#### Task 4.3.1: Private Registries

**Use Case**: Enterprises want to deploy internal MCP servers (not public GitHub)

**Implementation**:
- Allow custom registry URLs in Actor input
- Support private GitHub repos (with token)
- Add authentication layer for API

**Pricing**: Enterprise tier ($50/month subscription + PPE events)

---

## Appendix: Quick Reference

### Command Cheat Sheet

```bash
# Development
cd packages/apify-actor
apify run                 # Run locally
apify push                # Deploy to Apify

# Testing
apify call your-username/openconductor-deployer --input '{"event":"search","query":"postgres"}'

# Monitoring
apify runs list your-username/openconductor-deployer
apify logs <run-id>
```

### PPE Event Summary

| Event | Price | Compute Cost | Margin | Phase |
|-------|-------|--------------|--------|-------|
| search_basic | $0.02 | $0.005 | 55% | 1 |
| validate_server | $0.10 | $0.020 | 60% | 2 |
| deploy_to_apify | $2.00 | $0.050 | 77.5% | 3 |
| search_semantic | $0.05 | $0.015 | 60% | 4 |

### Success Metrics by Phase

| Phase | Revenue Target | Key Metric |
|-------|---------------|------------|
| Phase 1 | $50/month | 100+ Actor runs |
| Phase 2 | $300/month | 500+ validations |
| Phase 3 | $1,000/month | 100+ deployments |
| Phase 4 | $2,500/month | 50+ enterprise users |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-23
**Status**: Ready for Implementation
