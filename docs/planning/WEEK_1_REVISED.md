# Week 1 Action Plan (REVISED with Strategic Refinements)

**CRITICAL CHANGES**: Production sync, trust-first doctor, viral sharing
**DO NOT SKIP**: Day 1 production deployment is mandatory before any marketing

---

## 🚨 PRE-WEEK CRITICAL PATH (Must Complete First)

### Production Database Verification (2-4 hours)

**Goal**: Ensure production can handle Day 1 traffic with quality search results

```bash
# 1. Test current production state
curl https://www.openconductor.ai/api/v1/servers?limit=200 | jq '.data.pagination.total'
# If returns 93 instead of 191 → proceed with deployment

# 2. Test critical searches
curl "https://www.openconductor.ai/api/v1/servers?q=postgres" | jq '.data.servers[0].name'
# Should return "PostgreSQL MCP" as first result

# 3. If production is broken, deploy Top 50 immediately
```

**Checklist**:
- [ ] Production has at least 50 high-quality servers
- [ ] Search "postgres" → postgresql-mcp (#1)
- [ ] Search "github" → github-mcp (#1)
- [ ] Search "slack" → slack-mcp (top 3)
- [ ] Search "snowflake" → snowflake-mcp (returns results)
- [ ] /v1/servers/categories works
- [ ] /v1/servers/stats/trending works

**If any fail → STOP and fix before proceeding**

---

## DAY 1: Production Deployment & Trust-First Doctor

### Morning: Top 50 Server Deployment (3 hours) 🚨 CRITICAL

**Priority 1**: Deploy critical servers to production

**Step 1: Create Top 50 List** (30 min)
```bash
cd /home/roizen/projects/openconductor/packages/api

# Create priority list
cat > scripts/top-50-servers.json <<EOF
{
  "priority_servers": [
    "github-mcp",
    "filesystem-mcp",
    "postgresql-mcp",
    "openmemory",
    "docker-mcp",
    "aws-mcp",
    "brave-search-mcp",
    "slack-mcp",
    "notion-mcp",
    "google-drive-mcp",
    "stripe-mcp",
    "supabase-mcp",
    "snowflake-mcp",
    "bigquery-mcp",
    "databricks-mcp",
    "datadog",
    "playwright",
    "perplexity",
    "mem0-mcp",
    "neon-mcp"
  ]
}
EOF
```

**Step 2: Export Top 50** (30 min)
```bash
# Create export script
node scripts/export-priority-servers.js

# Verify export
cat top-50-export.sql | grep "INSERT INTO mcp_servers"
# Should show ~50 INSERT statements
```

**Step 3: Deploy to Production** (1 hour)
```bash
# Backup production first
pg_dump $PRODUCTION_DB_URL > production-backup-$(date +%Y%m%d).sql

# Deploy top 50
psql $PRODUCTION_DB_URL < top-50-export.sql

# Verify deployment
curl "https://www.openconductor.ai/api/v1/servers?limit=100" | jq '.data.pagination.total'
# Should return at least 50
```

**Step 4: Smoke Test** (1 hour)
```bash
# Test each critical search
declare -a searches=("postgres" "github" "slack" "snowflake" "memory" "filesystem")

for query in "${searches[@]}"; do
  echo "Testing: $query"
  curl -s "https://www.openconductor.ai/api/v1/servers?q=$query&limit=5" \
    | jq '.data.servers[0].name'
done

# All should return relevant results
```

**Deliverable**: Production has 50+ quality servers with working search

---

### Afternoon: Trust-First Doctor Command (4 hours)

**Goal**: Build doctor that NEVER breaks user configs by default

**Step 1: Create Dry-Run Default** (2 hours)

File: `/packages/cli/src/commands/doctor.js`

```javascript
export async function doctorCommand(options) {
  const isDryRun = !options.fix; // Default to dry-run
  const spinner = ora('Analyzing configuration...').start();

  try {
    // Read config
    const configPath = getClaudeConfigPath();
    const config = readConfig(configPath);

    // Run diagnostics
    const issues = await runDiagnostics(config);

    spinner.stop();

    if (issues.length === 0) {
      logger.success('✅ No issues found');
      return;
    }

    // Show issues
    console.log(`\nFound ${issues.length} issue(s):\n`);
    issues.forEach((issue, i) => {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${issue.message}`);
    });

    if (isDryRun) {
      console.log('\n✅ No changes made (dry run mode)');
      console.log('\nTo fix automatically: ' + logger.code('openconductor doctor --fix'));
      console.log('To see details: ' + logger.code('openconductor doctor --verbose'));
    } else {
      // Interactive confirmation
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Fix ${issues.length} issue(s)? (A backup will be created)`,
        default: false
      }]);

      if (!confirm) {
        logger.info('Cancelled. No changes made.');
        return;
      }

      await applyFixes(config, issues, configPath);
    }

  } catch (error) {
    spinner.stop();
    logger.error('Doctor failed:', error.message);
    process.exit(1);
  }
}
```

**Step 2: Timestamped Backups** (1 hour)

```javascript
function createBackup(configPath) {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19); // 2025-11-22-14-30-00

  const backupPath = `${configPath}.bak.${timestamp}`;

  fs.copyFileSync(configPath, backupPath);

  logger.info(`Backup created: ${backupPath}`);

  return backupPath;
}

async function applyFixes(config, issues, configPath) {
  // Create backup BEFORE any changes
  const backupPath = createBackup(configPath);

  console.log('\n⚠️  Applying fixes...\n');

  try {
    // Apply each fix
    for (const issue of issues) {
      await applyFix(config, issue);
      console.log(`✅ Fixed: ${issue.message}`);
    }

    // Write updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('\n✅ All fixes applied successfully!\n');
    console.log(`Backup: ${backupPath}`);
    console.log(`Rollback: ${logger.code('openconductor doctor --restore')}`);

  } catch (error) {
    // Restore from backup on error
    console.log('\n❌ Error applying fixes. Restoring from backup...');
    fs.copyFileSync(backupPath, configPath);
    console.log('✅ Config restored from backup');
    throw error;
  }
}
```

**Step 3: Rollback Command** (1 hour)

```javascript
export async function doctorRestoreCommand() {
  const configPath = getClaudeConfigPath();
  const backupDir = path.dirname(configPath);

  // Find all backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('claude_desktop_config.json.bak.'))
    .sort()
    .reverse(); // Most recent first

  if (backups.length === 0) {
    logger.warn('No backups found');
    return;
  }

  // Interactive selection
  const { selectedBackup } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedBackup',
    message: 'Select backup to restore:',
    choices: backups.map(b => ({
      name: `${b} (${getBackupAge(b)})`,
      value: b
    }))
  }]);

  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'This will overwrite your current config. Continue?',
    default: false
  }]);

  if (!confirm) {
    logger.info('Cancelled');
    return;
  }

  // Restore
  const backupPath = path.join(backupDir, selectedBackup);
  fs.copyFileSync(backupPath, configPath);

  logger.success(`✅ Config restored from ${selectedBackup}`);
}
```

**Deliverable**: Doctor command that is safe by default

---

## DAY 2: Stack Deep Links & Share URLs

### Morning: Stack Landing Pages (3 hours)

**Goal**: Every stack gets a shareable URL that converts clicks to installs

**Step 1: Database Schema Update**

```sql
-- Add short_code for shareable URLs
ALTER TABLE stacks ADD COLUMN short_code VARCHAR(10) UNIQUE;

-- Generate short codes for existing stacks
UPDATE stacks
SET short_code = SUBSTRING(MD5(id::text) FROM 1 FOR 6)
WHERE short_code IS NULL;

-- Create index for fast lookups
CREATE INDEX idx_stacks_short_code ON stacks(short_code);
```

**Step 2: Frontend Stack Pages**

File: `/packages/frontend/src/app/stack/[slug]/page.tsx`

```tsx
export default async function StackPage({ params }: { params: { slug: string } }) {
  const stack = await getStack(params.slug);

  if (!stack) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{stack.icon}</div>
        <h1 className="text-4xl font-bold mb-2">{stack.name}</h1>
        <p className="text-xl text-gray-600">{stack.tagline}</p>
        <div className="mt-4 flex gap-4 justify-center">
          <Badge>{stack.servers.length} servers</Badge>
          <Badge>{stack.installs} installs</Badge>
        </div>
      </div>

      {/* Install Command - PROMINENT */}
      <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold mb-4">Install This Stack</h2>
        <CopyCommandBox
          command={`npx @openconductor/cli stack install ${stack.slug}`}
        />
        <p className="text-sm text-gray-600 mt-2">
          ✨ Installs {stack.servers.length} servers automatically
        </p>
      </Card>

      {/* Server List */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Included Servers</h2>
        <div className="space-y-4">
          {stack.servers.map(server => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      </div>

      {/* Share Buttons */}
      <ShareButtons stack={stack} />
    </div>
  );
}
```

**Step 3: Short URL Redirect**

File: `/packages/frontend/src/app/s/[code]/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  // Look up short code
  const stack = await getStackByShortCode(params.code);

  if (!stack) {
    return NextResponse.redirect('/stacks');
  }

  // Redirect to full stack page
  return NextResponse.redirect(`/stack/${stack.slug}`);
}
```

**Deliverable**: Stack pages with one-click copy buttons

---

### Afternoon: Share Command (3 hours)

**Goal**: `openconductor stack share` generates shareable URLs

**Step 1: CLI Share Command**

File: `/packages/cli/src/commands/stack.js`

```javascript
export async function stackShareCommand(stackSlug) {
  const spinner = ora('Generating share link...').start();

  try {
    const api = new ApiClient();
    const stack = await api.getStack(stackSlug);

    spinner.stop();

    const shareUrl = `https://openconductor.ai/stack/${stack.slug}`;
    const shortUrl = `https://openconductor.ai/s/${stack.short_code}`;

    // Copy to clipboard
    await clipboard.write(shortUrl);

    console.log();
    logger.success('📤 Share URL copied to clipboard!');
    console.log();
    console.log(`Share: ${logger.link(shortUrl)}`);
    console.log();

    // Social sharing options
    const tweetText = encodeURIComponent(
      `I just set up Claude with the ${stack.name} in 10 seconds using @openconductor\n\n` +
      `${stack.emoji} ${stack.servers.length} servers installed automatically\n` +
      `✨ No JSON editing required\n\n` +
      `Try it: ${shortUrl}`
    );

    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    console.log('📱 Share on:');
    console.log(`  🐦 Twitter: ${logger.link(tweetUrl)}`);
    console.log(`  📋 Copied to clipboard: ${shortUrl}`);
    console.log();

    // Prompt for social sharing
    const { shareSocial } = await inquirer.prompt([{
      type: 'confirm',
      name: 'shareSocial',
      message: 'Open Twitter to share now?',
      default: false
    }]);

    if (shareSocial) {
      await open(tweetUrl);
    }

  } catch (error) {
    spinner.stop();
    logger.error('Failed to generate share link:', error.message);
    process.exit(1);
  }
}
```

**Step 2: Auto-Share Prompts**

Add to stack install success:

```javascript
// After successful stack installation
console.log();
logger.success(`✅ Installed ${stack.name} (${stack.servers.length} servers)`);
console.log();

// Prompt for sharing (but don't force it)
console.log('💡 Found this helpful?');
console.log(`   Share with others: ${logger.code(`openconductor stack share ${stack.slug}`)}`);
console.log();
```

**Deliverable**: Viral sharing system with one-click tweets

---

## DAY 3: MCP Manifest Specification

### Morning: Manifest Spec Document (3 hours)

**Goal**: Define the `mcp-manifest.json` standard

**File**: Create `/packages/shared/src/manifest-spec.ts`

```typescript
export interface MCPManifest {
  // Basic metadata
  name: string;
  version: string; // semver
  description: string;
  author: string;
  license: string;
  repository: string;

  // MCP-specific
  mcp: {
    version: '1.0'; // Manifest format version
    category: string;
    tags: string[];

    // Installation
    installation: {
      npm?: string; // Package name
      docker?: string; // Docker image
      command: string; // Execution command
      args?: string[]; // Default args
    };

    // Requirements
    requirements: {
      node?: string; // Node version (semver range)
      env?: {
        [key: string]: {
          required: boolean;
          description: string;
          validate?: string; // Regex pattern
          default?: string;
        };
      };
      ports?: {
        default: number;
        configurable: boolean;
      };
    };

    // Capabilities (for discovery)
    capabilities?: {
      tools?: Array<{
        name: string;
        description: string;
        inputs: string[];
      }>;
      resources?: string[];
      prompts?: string[];
    };

    // Testing
    testing?: {
      healthcheck?: string; // Command to verify server is running
      example_config?: any; // Example configuration
    };
  };
}
```

**Documentation**: Create `/MANIFEST_SPEC.md`

```markdown
# MCP Manifest Specification v1.0

## Overview
The MCP Manifest is a standardized format for declaring MCP server capabilities, requirements, and installation instructions.

## Benefits

### For Server Developers
- Auto-generated installation docs
- Better error messages for users
- Featured placement in OpenConductor
- Advanced analytics (tool usage, not just installs)

### For Users
- One-command installation
- Clear error messages ("Missing GITHUB_TOKEN")
- Auto-configuration of ports and env vars
- Health checks validate setup

### For the Ecosystem
- Enables "smart stacks" that auto-configure
- Compatibility checking (which servers work together)
- Capability-based discovery ("servers that can create issues")
- Foundation for managed hosting

## Example

[Full example from STRATEGIC_REFINEMENTS.md]

## Adoption Incentives

Servers with manifests get:
- ⭐ "Verified" badge in CLI search
- 📊 Advanced analytics dashboard
- 🚀 Featured placement in registry
- 🎯 Higher search ranking
- 📈 Better discovery (capability-based search)

## How to Add

1. Create `mcp-manifest.json` in your repo root
2. Validate: `npx @openconductor/cli validate-manifest`
3. Register: `openconductor register --with-manifest`
4. Get verified badge!

[... rest of spec ...]
```

**Deliverable**: Manifest spec ready for adoption pitch

---

### Afternoon: Manifest Validator (3 hours)

**Goal**: CLI command to validate manifests

```javascript
export async function validateManifestCommand(manifestPath) {
  const spinner = ora('Validating manifest...').start();

  try {
    // Read manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Validate against schema
    const errors = validateManifest(manifest);

    spinner.stop();

    if (errors.length === 0) {
      logger.success('✅ Manifest is valid!');
      console.log();
      console.log('Benefits of having a manifest:');
      console.log('  ⭐ Verified badge in search results');
      console.log('  📊 Advanced analytics dashboard');
      console.log('  🚀 Featured placement');
      console.log();
      console.log('Next: ' + logger.code('openconductor register --with-manifest'));
    } else {
      logger.error('❌ Manifest has errors:');
      errors.forEach(err => console.log(`  • ${err}`));
      process.exit(1);
    }

  } catch (error) {
    spinner.stop();
    logger.error('Failed to validate manifest:', error.message);
    process.exit(1);
  }
}
```

**Deliverable**: Manifest validation ready

---

## DAY 4: Badge System with Manifest Pitch

### Morning: Badge Generator (3 hours)

(Same as original plan, but add manifest pitch)

**Updated PR Template**:

Add section:

```markdown
## 🎯 Bonus: MCP Manifest (Optional)

To enable even better installation experience, consider adding an `mcp-manifest.json`:

Benefits:
- Auto-detects installation requirements
- Validates environment variables
- Provides clear error messages
- Enables health checks and auto-updates
- **Gets you a "Verified" badge** in search results

We can auto-generate a starter manifest for you if interested!

Learn more: https://openconductor.ai/docs/manifest
```

**Deliverable**: Badge system with manifest upsell

---

### Afternoon: Auto-Generate Manifests (3 hours)

**Goal**: Create manifests for top 10 servers based on their READMEs

```bash
# Generate manifest for a server
openconductor generate-manifest github-mcp

# Reads GitHub repo, extracts:
# - Package name from package.json
# - Env vars from README
# - Installation command
# - Outputs mcp-manifest.json
```

**Deliverable**: 10 auto-generated manifests ready for outreach

---

## DAY 5: First PRs with Manifest Pitch

(Same as original, but include manifest in pitch)

**PR Message Update**:

```markdown
## Summary
This PR adds two improvements to make installation easier:

1. **Quick Install Section**: One-command installation via OpenConductor
2. **MCP Manifest** (optional): Standardized format for declaring requirements

## Why Manifest?

The manifest enables:
- Auto-configuration of ports and env vars
- Better error messages ("Missing GITHUB_TOKEN" vs generic failures)
- Health checks to verify installation
- Tool-level analytics (see which features users actually use)
- **Verified badge** in OpenConductor registry

I've auto-generated a starter manifest for you (see attached).
Feel free to customize or skip it entirely!

[... rest of PR ...]
```

**Deliverable**: 3 PRs submitted with manifest pitch

---

## DAY 6-7: Launch Prep (Same as Original)

Content creation, Product Hunt prep, etc.

**Updated Demo Video**:
- Show dry-run doctor command (safety)
- Show stack sharing with URL
- Show verified badge for servers with manifests

---

## Week 1 Success Criteria (REVISED)

### Must-Have (Blocking):
- [ ] Production has 50+ quality servers
- [ ] Critical searches work (postgres, github, slack)
- [ ] Doctor defaults to dry-run
- [ ] Backups work correctly
- [ ] Zero broken configs

### Should-Have:
- [ ] 3 PRs submitted (with manifest pitch)
- [ ] Stack share URLs working
- [ ] Badge generator live
- [ ] 10 auto-generated manifests

### Nice-to-Have:
- [ ] 1 PR merged
- [ ] 50+ stack installs
- [ ] 1 server adopts manifest

---

## Emergency Rollback Plan

If anything breaks:

```bash
# Rollback production DB
psql $PRODUCTION_DB_URL < production-backup-YYYYMMDD.sql

# Point CLI to localhost
export OPENCONDUCTOR_API_URL=http://localhost:3001/v1

# Delay launch 24-48 hours
```

---

**Bottom Line**: This revised plan prioritizes **trust** (safe doctor), **virality** (share URLs), and **moat** (manifest standard) over speed.

Better to launch 2 days late with a solid product than rush and destroy trust. 🚀
