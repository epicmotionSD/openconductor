# Pre-Flight Checks - Production Readiness

**Critical Issues That Could Kill Launch**

These are invisible landmines that only show up after users start using the product. Must fix before Day 1.

---

## ✅ Check 1: JSON Comments Trap (CRITICAL)

### The Problem

**User's actual `claude_desktop_config.json`**:
```json
{
  "mcpServers": {
    // GitHub integration for my work projects
    "github-mcp": {
      "command": "npx",
      "args": ["-y", "@anthropic/github-mcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxx" // My personal token
      }
    }
  }
}
```

**Standard Node.js behavior**:
```javascript
// Read file
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
// ❌ ERROR: Unexpected token '/' in JSON at position 45

// OR if it somehow parses (stripping comments):
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
// ✅ Writes valid JSON but...
// ❌ All user comments are DELETED
```

**User reaction**:
> "WTF! OpenConductor deleted all my comments! 😡"
> [Posts on HN: "PSA: openconductor CLI silently deletes config comments"]
> **Your reputation is destroyed**

### The Fix

**Use `comment-json` library** (NOT standard JSON):

```bash
cd packages/cli
npm install comment-json
```

**Updated config reading**:

```javascript
import { parse, stringify, assign } from 'comment-json';
import fs from 'fs';

function readConfig(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');

  // Preserves comments!
  const config = parse(content);

  return config;
}

function writeConfig(configPath, config) {
  // Preserves comments during serialization
  const content = stringify(config, null, 2);

  fs.writeFileSync(configPath, content);
}

// Example usage
const config = readConfig(claudeConfigPath);

// Add new server
assign(config.mcpServers, {
  'postgres-mcp': {
    command: 'npx',
    args: ['-y', '@anthropic/postgresql-mcp']
  }
});

// Write back - COMMENTS PRESERVED
writeConfig(claudeConfigPath, config);
```

**Result**:
```json
{
  "mcpServers": {
    // GitHub integration for my work projects
    "github-mcp": {
      "command": "npx",
      "args": ["-y", "@anthropic/github-mcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxx" // My personal token
      }
    },
    "postgres-mcp": {
      "command": "npx",
      "args": ["-y", "@anthropic/postgresql-mcp"]
    }
  }
}
```

**Comments preserved! ✅**

### Testing Checklist

Create test config with edge cases:

```json
{
  // Top-level comment
  "mcpServers": {
    /* Block comment */
    "test-server": {
      "command": "node", // Inline comment
      /* Multi-line
         comment */
      "args": ["--version"]
    }
    // Trailing comment
  }
}
```

**Test**:
- [ ] Read → Modify → Write preserves all comments
- [ ] Works with `//` comments
- [ ] Works with `/* */` comments
- [ ] Works with inline comments
- [ ] Works with trailing commas (JSON5 extension)

### Update All Config Files

**Files to update**:
- [ ] `packages/cli/src/lib/config-manager.js`
- [ ] `packages/cli/src/commands/install.js`
- [ ] `packages/cli/src/commands/remove.js`
- [ ] `packages/cli/src/commands/doctor.js`
- [ ] Any other file that reads/writes claude_desktop_config.json

**Package.json update**:
```json
{
  "dependencies": {
    "comment-json": "^4.2.3"
  }
}
```

---

## ✅ Check 2: Telemetry Backlash (REPUTATION RISK)

### The Problem

**Your plan**: Track installs for maintainer analytics

**Developer discovers**:
```bash
# User runs packet sniffer
$ tcpdump -i any -n host openconductor.ai
# Sees POST requests to /api/analytics
```

**Reddit post the next day**:
> "PSA: @openconductor/cli is spyware. It phones home every install without consent."
> [400 upvotes, 200 comments calling you unethical]

**Your project is dead.**

### The Fix: Transparency + Opt-Out

**First-Run Consent Prompt**:

```javascript
// On first CLI run ever
async function checkFirstRun() {
  const configDir = getConfigDir(); // ~/.openconductor/
  const consentFile = path.join(configDir, 'telemetry-consent.json');

  if (!fs.existsSync(consentFile)) {
    // First run!
    console.log();
    console.log(chalk.cyan('📊 OpenConductor Telemetry'));
    console.log();
    console.log('OpenConductor collects anonymous usage statistics to help server maintainers');
    console.log('understand adoption and improve their tools.');
    console.log();
    console.log('We collect:');
    console.log('  • Which servers you install (not your API keys or data)');
    console.log('  • Your platform (macOS/Linux/Windows)');
    console.log('  • CLI version');
    console.log();
    console.log('We DO NOT collect:');
    console.log('  • Personal information');
    console.log('  • Environment variables or API keys');
    console.log('  • File contents or project data');
    console.log();
    console.log('This data helps maintainers see:');
    console.log('  • How many people use their server');
    console.log('  • Which platforms to support');
    console.log('  • If updates are being adopted');
    console.log();
    console.log(chalk.dim('You can disable telemetry anytime: openconductor telemetry off'));
    console.log(chalk.dim('View telemetry code: https://github.com/epicmotionSD/openconductor/blob/main/packages/cli/src/lib/analytics.js'));
    console.log();

    const { consent } = await inquirer.prompt([{
      type: 'confirm',
      name: 'consent',
      message: 'Enable anonymous telemetry to help server maintainers?',
      default: true
    }]);

    // Save consent
    fs.writeFileSync(consentFile, JSON.stringify({
      enabled: consent,
      consentedAt: new Date().toISOString()
    }, null, 2));

    if (consent) {
      console.log(chalk.green('✅ Telemetry enabled. Thank you!'));
    } else {
      console.log(chalk.yellow('Telemetry disabled.'));
    }
    console.log();
  }
}
```

**Telemetry Command**:

```javascript
export async function telemetryCommand(action) {
  const consentFile = path.join(getConfigDir(), 'telemetry-consent.json');

  if (action === 'status') {
    const consent = JSON.parse(fs.readFileSync(consentFile, 'utf-8'));
    console.log('Telemetry:', consent.enabled ? chalk.green('enabled') : chalk.yellow('disabled'));
    console.log('View data collected: https://openconductor.ai/privacy');
    console.log('View source code: https://github.com/epicmotionSD/openconductor/blob/main/packages/cli/src/lib/analytics.js');
  }

  if (action === 'on') {
    fs.writeFileSync(consentFile, JSON.stringify({ enabled: true }, null, 2));
    console.log(chalk.green('✅ Telemetry enabled'));
  }

  if (action === 'off') {
    fs.writeFileSync(consentFile, JSON.stringify({ enabled: false }, null, 2));
    console.log(chalk.yellow('Telemetry disabled'));
  }

  if (action === 'show') {
    // Show exactly what would be sent
    const data = {
      event: 'install',
      server: 'github-mcp',
      platform: process.platform,
      nodeVersion: process.version,
      cliVersion: pkg.version,
      timestamp: new Date().toISOString()
      // NO personal data, API keys, file contents, etc.
    };
    console.log('Example telemetry data:');
    console.log(JSON.stringify(data, null, 2));
  }
}
```

**Analytics Implementation (Transparent)**:

```javascript
// packages/cli/src/lib/analytics.js
export async function trackInstall(serverId, metadata) {
  // Check if telemetry is enabled
  const consentFile = path.join(getConfigDir(), 'telemetry-consent.json');

  if (!fs.existsSync(consentFile)) {
    return; // No consent file = don't track
  }

  const consent = JSON.parse(fs.readFileSync(consentFile, 'utf-8'));

  if (!consent.enabled) {
    return; // User opted out
  }

  // Only send non-identifying data
  const data = {
    event: 'install',
    serverId, // e.g., "github-mcp" (not user's API keys!)
    platform: process.platform, // e.g., "darwin"
    nodeVersion: process.version, // e.g., "v18.0.0"
    cliVersion: pkg.version, // e.g., "1.1.1"
    timestamp: new Date().toISOString()
    // NO: username, email, API keys, file paths, env vars
  };

  try {
    await axios.post('https://openconductor.ai/api/v1/analytics/install', data, {
      timeout: 2000 // Don't block CLI if network is slow
    });
  } catch (error) {
    // Fail silently - analytics shouldn't break CLI
    if (process.env.DEBUG) {
      console.error('Analytics error:', error.message);
    }
  }
}
```

**README.md Section**:

```markdown
## Telemetry

OpenConductor collects anonymous usage statistics to help server maintainers understand adoption.

### What We Collect
- Server install events (which servers you install)
- Platform information (macOS, Linux, Windows)
- CLI version
- Timestamps

### What We DON'T Collect
- Personal information
- API keys or credentials
- Environment variables
- File contents or code
- IP addresses (aggregated at CDN level)

### How to Opt Out
```bash
openconductor telemetry off
```

### Transparency
- View telemetry code: [src/lib/analytics.js](packages/cli/src/lib/analytics.js)
- View what data is sent: `openconductor telemetry show`
- Privacy policy: https://openconductor.ai/privacy
```

### Update Launch Messaging

**Add to Product Hunt / HN / Reddit posts**:

> 💡 Privacy Note: OpenConductor collects anonymous install statistics (which servers, platform) to help maintainers. You can disable with `openconductor telemetry off`. [View source](https://github.com/...)

**Proactive transparency prevents backlash.**

---

## ✅ Check 3: Manifest Versioning (ARCHITECTURE RISK)

### The Problem

**Day 1 manifest spec**:
```json
{
  "name": "github-mcp",
  "mcp": {
    "requirements": {
      "env": {
        "GITHUB_TOKEN": {
          "required": true
        }
      }
    }
  }
}
```

**Day 30 - you realize you need**:
```json
{
  "requirements": {
    "env": {
      "GITHUB_TOKEN": {
        "required": true,
        "scopes": ["repo", "issues"], // NEW FIELD
        "format": "ghp_.*" // NEW FIELD
      }
    }
  }
}
```

**But if you add fields, old parsers break.**
**If you can't add fields, the spec becomes useless.**

### The Fix: Version from Day 1

**Include `schemaVersion` field**:

```json
{
  "name": "github-mcp",
  "version": "1.2.3",
  "mcp": {
    "schemaVersion": "1.0", // ← THIS IS CRITICAL
    "requirements": {
      "env": {
        "GITHUB_TOKEN": {
          "required": true
        }
      }
    }
  }
}
```

**Validation logic**:

```javascript
function validateManifest(manifest) {
  const supportedVersions = ['1.0'];

  if (!manifest.mcp.schemaVersion) {
    throw new Error('Manifest missing required field: mcp.schemaVersion');
  }

  if (!supportedVersions.includes(manifest.mcp.schemaVersion)) {
    const latest = supportedVersions[supportedVersions.length - 1];
    console.warn(`Manifest uses schema version ${manifest.mcp.schemaVersion}`);
    console.warn(`Latest supported version: ${latest}`);
    console.warn(`Some features may not work correctly.`);
  }

  // Version-specific validation
  if (manifest.mcp.schemaVersion === '1.0') {
    return validateV1(manifest);
  }

  // Future:
  // if (manifest.mcp.schemaVersion === '2.0') {
  //   return validateV2(manifest);
  // }
}
```

**Future-proofing**:

When you introduce v2.0:
```json
{
  "mcp": {
    "schemaVersion": "2.0", // New version
    "requirements": {
      "env": {
        "GITHUB_TOKEN": {
          "required": true,
          "scopes": ["repo"], // New in 2.0
          "format": "ghp_.*" // New in 2.0
        }
      }
    }
  }
}
```

**Your CLI can handle both**:
- v1.0 manifests: Use old parsing logic (no scopes field)
- v2.0 manifests: Use new parsing logic (with scopes)

**Without versioning**: You can never evolve the spec without breaking things.

### Update MANIFEST_SPEC.md

Add to spec:

```markdown
## Schema Versioning

Every manifest MUST include a `schemaVersion` field.

### Current Version: 1.0

```json
{
  "mcp": {
    "schemaVersion": "1.0"
  }
}
```

### Version Support

OpenConductor CLI supports:
- v1.0: Current stable version

### Future Versions

If we introduce breaking changes, we'll release:
- v2.0: Backwards-incompatible changes
- CLI will support both v1.0 and v2.0 during transition period

### Deprecation Policy

- New schema versions announced 3 months in advance
- Old versions supported for 6 months after new release
- Gradual migration path provided
```

---

## ✅ Check 4: Anthropic Collision (STRATEGIC RISK)

### The Problem

**Scenario**: Anthropic announces "Claude CLI" next week with server discovery.

**If your brand is**: "The Unofficial MCP Registry"
→ You get crushed by the official one

**If your brand is**: "AI Workflow Automation Platform"
→ You're complementary, not competing

### The Fix: Lean Into Value-Add

**Current messaging** (vulnerable):
> "OpenConductor - The npm for MCP Servers"
> "190+ MCP Servers in One Place"

**Revised messaging** (defensible):
> "OpenConductor - Pre-Built AI Workflows"
> "Install complete AI personas in one command"

**Emphasize what Anthropic won't build**:

1. **Stacks** (Opinionated workflows)
   - Anthropic will list servers
   - They won't curate "Coder Stack" or "Writer Stack"
   - They won't include system prompts
   - **This is your wedge**

2. **Doctor** (Environment debugging)
   - Anthropic won't fix your local config errors
   - They won't auto-resolve port conflicts
   - They won't validate env vars
   - **This is your moat**

3. **Analytics** (Maintainer data)
   - Anthropic won't give server authors install stats
   - They won't show platform breakdowns
   - They won't track retention
   - **This is your flywheel**

### Update All Messaging

**Homepage**:
❌ Before: "Discover and install 190+ MCP servers"
✅ After: "Pre-configured AI workflows. One command."

**Product Hunt**:
❌ Before: "The npm for MCP servers"
✅ After: "Instant AI workflows for Claude (Coder/Writer/Data stacks)"

**Twitter**:
❌ Before: "We built a registry of MCP servers"
✅ After: "Set up Claude for coding in 10 seconds with the Coder Stack"

**Value Proposition**:
```
Primary: Instant workflows (Stacks)
Secondary: Config management (Doctor)
Tertiary: Maintainer analytics
Commodity: Server registry (don't lead with this)
```

**If Anthropic launches a registry**:
> "Awesome! Anthropic's registry is great for discovery.
> OpenConductor Stacks are great for instant setup.
> We're complementary - use both!"

**Position as the workflow layer**, not the registry.

---

## Final Pre-Flight Checklist

### Technical
- [ ] Replace all `JSON.parse/stringify` with `comment-json`
- [ ] Test config read/write preserves comments
- [ ] Add first-run telemetry consent prompt
- [ ] Implement `openconductor telemetry` command
- [ ] Add `schemaVersion: "1.0"` to manifest spec
- [ ] Update validator to check schema version

### Messaging
- [ ] Update homepage to emphasize Stacks
- [ ] Change Product Hunt title to "Instant AI Workflows"
- [ ] Rewrite HN post to focus on workflows, not registry
- [ ] Add telemetry transparency note to all announcements
- [ ] Position as "workflow layer" not "unofficial registry"

### Documentation
- [ ] Add "Telemetry" section to README
- [ ] Add "Schema Versioning" to MANIFEST_SPEC.md
- [ ] Link to analytics.js source code
- [ ] Privacy policy page on website
- [ ] FAQ: "What if Anthropic builds their own?"

### Testing
- [ ] Test with configs that have `//` comments
- [ ] Test with configs that have `/* */` comments
- [ ] Test telemetry opt-out flow
- [ ] Test manifest validation with version mismatch
- [ ] Test on all platforms (Mac, Linux, Windows)

---

## Launch Approval Gates

**DO NOT LAUNCH until all 4 checks are ✅**:

- [ ] ✅ Check 1: JSON Comments (comment-json library installed)
- [ ] ✅ Check 2: Telemetry (consent prompt + transparency)
- [ ] ✅ Check 3: Manifest Versioning (schemaVersion field)
- [ ] ✅ Check 4: Messaging (workflow-first, not registry-first)

**If ANY are missing → DELAY LAUNCH**

A delayed launch is recoverable.
A reputation-destroying bug is not.

---

## Emergency Response Plans

### If "Spyware" Accusation Emerges

**Immediate Response** (within 1 hour):
```
We collect anonymous install stats (which servers, platform) to help maintainers.

You can:
- Disable: `openconductor telemetry off`
- View code: [link to analytics.js]
- See what's sent: `openconductor telemetry show`

We take privacy seriously. We'll add more prominent consent prompts in the next release.
```

**Follow-up** (within 24 hours):
- Release patch with louder consent prompt
- Blog post explaining telemetry
- Add privacy audit to roadmap

### If Anthropic Announces Registry

**Immediate Response**:
```
This is great news! More MCP adoption = better ecosystem.

Anthropic's registry is perfect for discovery.
OpenConductor Stacks are perfect for instant setup.

We're complementary - use both!

Our focus: Pre-configured workflows + config debugging + maintainer analytics.
```

**Pivot Strategy**:
- Double down on Stacks
- Emphasize Doctor command
- Position as "workflow automation" not "alternative registry"

### If Comments Get Deleted

**Immediate Response** (within 30 min):
```
We just discovered a bug that may delete JSON comments in some configs.

IMMEDIATE FIX:
1. Restore from backup: `openconductor doctor --restore`
2. Update CLI: `npm update -g @openconductor/cli`
3. We've patched the issue

We're deeply sorry. We'll add more robust testing.
```

**Follow-up**:
- Emergency patch release
- Add comment preservation tests
- Compensate affected users (free analytics, featured placement)

---

## System Status: READY FOR LAUNCH ✅

With these 4 checks implemented:

**Strategy**: ✅ GO
**Tech Stack**: ✅ GO (with fixes)
**Messaging**: ✅ GO (workflow-first)
**Viral Loops**: ✅ GO
**Privacy**: ✅ GO (with transparency)
**Future-Proof**: ✅ GO (versioning)

**You are clear for takeoff. 🚀**

---

**Implementation Priority**:

1. **TODAY**: Add comment-json library + test
2. **TODAY**: Add telemetry consent + transparency
3. **TOMORROW**: Add schemaVersion to manifest spec
4. **TOMORROW**: Update all messaging to "workflows first"

**Then launch.**
