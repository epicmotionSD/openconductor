# OpenConductor Doctor Command

## Overview
`openconductor doctor` - The config file debugger that makes users dependent on OpenConductor for MCP management.

**The Insight**: Manual JSON editing is error-prone. If we can detect and auto-fix issues, users won't trust manual editing anymore.

## Command Usage

\`\`\`bash
# Run full diagnostic
openconductor doctor

# Fix issues automatically
openconductor doctor --fix

# Check specific server
openconductor doctor github-mcp

# Verbose output
openconductor doctor --verbose

# Export diagnostic report
openconductor doctor --export report.json
\`\`\`

## What It Checks

### 1. JSON Syntax Validation
**Problem**: Invalid JSON breaks Claude Desktop
**Check**:
- Parse `claude_desktop_config.json`
- Detect syntax errors (missing commas, quotes, brackets)
- Validate structure

**Fix**:
- Auto-correct common JSON errors
- Format with proper indentation
- Backup before fixing

**Output**:
\`\`\`
✅ JSON syntax valid
or
❌ JSON syntax error on line 23: Missing comma
   → Fix: openconductor doctor --fix
\`\`\`

---

### 2. Port Conflicts
**Problem**: Multiple servers using same port causes failures
**Check**:
- Scan all server configs for port numbers
- Detect duplicates
- Check if ports are already in use by other processes

**Fix**:
- Auto-assign available ports
- Update server configs
- Suggest port ranges

**Output**:
\`\`\`
⚠️  Port conflict detected
   • github-mcp: port 3000
   • postgresql-mcp: port 3000
   → Fix: Reassign postgresql-mcp to port 3001
   Run: openconductor doctor --fix
\`\`\`

---

### 3. Missing Dependencies
**Problem**: Servers require npm packages that aren't installed
**Check**:
- For each server, check if npm package exists
- Verify package version compatibility
- Check global vs local installation

**Fix**:
- Install missing packages
- Update outdated packages
- Suggest global installation

**Output**:
\`\`\`
❌ Missing dependency: @anthropic/github-mcp
   → Fix: npm install -g @anthropic/github-mcp
   Or: openconductor doctor --fix
\`\`\`

---

### 4. Invalid Server Configurations
**Problem**: Servers with incorrect config structure
**Check**:
- Validate `command` field exists
- Check `args` format
- Verify `env` variables format

**Fix**:
- Fetch correct config from registry
- Auto-populate missing fields
- Remove deprecated fields

**Output**:
\`\`\`
⚠️  Invalid config for github-mcp
   Missing required field: "command"
   → Fix: openconductor doctor --fix
\`\`\`

---

### 5. Environment Variable Issues
**Problem**: Missing required env vars (API keys, paths)
**Check**:
- Identify servers that need env vars
- Check if vars are set in config
- Validate format (no spaces, proper quotes)

**Fix**:
- Prompt user for missing values
- Auto-format env var syntax
- Suggest using .env file

**Output**:
\`\`\`
⚠️  Missing environment variables
   • github-mcp needs: GITHUB_TOKEN
   → Set with: openconductor config set github-mcp GITHUB_TOKEN your-token
\`\`\`

---

### 6. File Path Validation
**Problem**: Broken paths to executables or scripts
**Check**:
- Verify paths in `command` field exist
- Check file permissions
- Validate relative vs absolute paths

**Fix**:
- Resolve to absolute paths
- Fix permissions
- Suggest correct paths

**Output**:
\`\`\`
❌ Invalid path: /usr/local/bin/mcp-server
   File does not exist
   → Fix: openconductor doctor --fix
\`\`\`

---

### 7. Server Health Check
**Problem**: Servers configured but not responding
**Check**:
- Try to connect to each server
- Send test request
- Check response time

**Fix**:
- Restart non-responsive servers
- Reinstall broken servers
- Remove dead servers

**Output**:
\`\`\`
❌ Server not responding: github-mcp
   Last seen: 2 days ago
   → Fix: Restart with openconductor restart github-mcp
\`\`\`

---

### 8. Claude Desktop Status
**Problem**: Claude Desktop not running or needs restart
**Check**:
- Check if Claude Desktop is running
- Detect if config changes need restart
- Verify Claude Desktop version

**Fix**:
- Offer to restart Claude Desktop
- Show restart instructions
- Check for Claude updates

**Output**:
\`\`\`
ℹ️  Config changed - restart required
   → Restart Claude Desktop to apply changes
   macOS: openconductor restart-claude
\`\`\`

---

### 9. Duplicate Servers
**Problem**: Same server installed multiple times
**Check**:
- Scan for duplicate server entries
- Identify conflicting configs

**Fix**:
- Merge duplicate entries
- Keep most recent version
- Remove conflicts

**Output**:
\`\`\`
⚠️  Duplicate server: github-mcp
   Found 2 entries in config
   → Fix: Keep latest version
\`\`\`

---

### 10. Security Issues
**Problem**: Insecure configurations (exposed keys, public ports)
**Check**:
- Scan for hardcoded API keys
- Check for public-facing ports
- Validate SSL/TLS settings

**Fix**:
- Move keys to env vars
- Suggest secure configs
- Enable HTTPS where needed

**Output**:
\`\`\`
🔒 Security warning: API key in config file
   Recommendation: Use environment variables
   → Fix: openconductor doctor --fix
\`\`\`

---

## Doctor Output Format

### Summary View (Default)
\`\`\`
🏥 OpenConductor Doctor

Checking Claude Desktop configuration...

✅ JSON syntax valid
✅ All dependencies installed
⚠️  2 port conflicts detected
❌ 1 server not responding
ℹ️  Restart required

Issues found: 3
Run 'openconductor doctor --fix' to auto-fix issues
\`\`\`

### Detailed View (--verbose)
\`\`\`
🏥 OpenConductor Doctor (Detailed Report)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuration: /Users/name/Library/Application Support/Claude/claude_desktop_config.json
Last modified: 2025-01-22 14:30:00
Claude Desktop: Running (v1.2.3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/10] Checking JSON syntax... ✅ PASS
  └─ Valid JSON structure
  └─ Proper formatting

[2/10] Checking port conflicts... ⚠️  WARNING
  └─ github-mcp: port 3000 ✅
  └─ postgresql-mcp: port 3000 ❌ CONFLICT
  └─ slack-mcp: port 3002 ✅

  Fix: openconductor doctor --fix

[3/10] Checking dependencies... ✅ PASS
  └─ @anthropic/github-mcp@1.0.0 ✅
  └─ @anthropic/postgresql-mcp@1.2.1 ✅
  └─ @slack/mcp-server@2.0.0 ✅

[4/10] Validating server configs... ✅ PASS
  └─ All servers have valid configuration

[5/10] Checking environment variables... ℹ️  INFO
  └─ github-mcp: GITHUB_TOKEN ✅
  └─ postgresql-mcp: DATABASE_URL ⚠️  Optional
  └─ slack-mcp: SLACK_TOKEN ✅

[6/10] Validating file paths... ✅ PASS
  └─ All executables found

[7/10] Checking server health... ❌ FAIL
  └─ github-mcp: responding (45ms) ✅
  └─ postgresql-mcp: not responding ❌
  └─ slack-mcp: responding (23ms) ✅

  Fix: openconductor restart postgresql-mcp

[8/10] Checking Claude Desktop... ℹ️  RESTART NEEDED
  └─ Config changed 5 minutes ago
  └─ Restart to apply changes

[9/10] Checking for duplicates... ✅ PASS
  └─ No duplicate servers found

[10/10] Security scan... ✅ PASS
  └─ No exposed credentials
  └─ Secure configurations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 7 passed, 1 warning, 1 failed, 1 info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommended actions:
1. Fix port conflict: openconductor doctor --fix
2. Restart postgresql-mcp: openconductor restart postgresql-mcp
3. Restart Claude Desktop

Run 'openconductor doctor --fix' to automatically fix issues
\`\`\`

---

## Auto-Fix Behavior

\`\`\`bash
$ openconductor doctor --fix

🏥 OpenConductor Doctor - Auto-Fix Mode

Analyzing configuration...

Found 3 issues. Proceeding to fix...

[1/3] Fixing port conflict...
  ✅ Reassigned postgresql-mcp from port 3000 → 3001
  ✅ Updated configuration

[2/3] Restarting postgresql-mcp...
  ✅ Server restarted successfully

[3/3] Backing up config...
  ✅ Backup saved to claude_desktop_config.json.backup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All issues fixed! ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Restart Claude Desktop to apply changes
  macOS: Cmd+Q and relaunch
  Auto-restart: openconductor restart-claude
\`\`\`

---

## Integration Points

### 1. Install Command
After installing servers:
\`\`\`bash
$ openconductor install github-mcp

✅ Installed github-mcp

Running health check...
✅ Configuration valid
✅ Server responding

Pro tip: Run 'openconductor doctor' anytime to check your setup
\`\`\`

### 2. Remove Command
After removing servers:
\`\`\`bash
$ openconductor remove github-mcp

✅ Removed github-mcp

Running cleanup...
✅ No orphaned dependencies
✅ No port conflicts
\`\`\`

### 3. Update Command
After updates:
\`\`\`bash
$ openconductor update

✅ Updated 3 servers

Running validation...
⚠️  1 server needs restart
Run 'openconductor doctor' for details
\`\`\`

### 4. Proactive Monitoring
Background health checks:
\`\`\`bash
$ openconductor doctor --daemon

🏥 Doctor is now monitoring your configuration
Will alert on issues every 6 hours

To stop: openconductor doctor --stop
\`\`\`

---

## Network Effect Mechanism

### The Lock-In Loop

1. **User installs server manually** → JSON errors occur
2. **User runs `openconductor doctor`** → Errors fixed instantly
3. **User trusts OpenConductor** → Relies on doctor for all changes
4. **User afraid to edit manually** → Always uses CLI
5. **User recommends to friends** → "Use openconductor doctor, it saved me"

### Social Proof

After fixing issues:
\`\`\`
✅ Fixed 5 issues in your configuration

💡 Found this helpful?
  ⭐ Star us on GitHub: https://github.com/epicmotionSD/openconductor
  🐦 Share: "openconductor doctor just saved my Claude Desktop setup"
\`\`\`

---

## Implementation Priority

### Phase 1 (Week 1)
- JSON syntax validation
- Port conflict detection
- Dependency checking

### Phase 2 (Week 2)
- Server health checks
- Auto-fix functionality
- Backup/restore

### Phase 3 (Week 3)
- Environment variable validation
- Security scanning
- Proactive monitoring

---

## Success Metrics

- **Usage**: % of users who run doctor at least once
- **Fixes**: # of auto-fixes applied
- **Retention**: Users who run doctor regularly (power users)
- **Referrals**: "Doctor saved me" social mentions

---

## Marketing Angle

**Problem**: "Editing claude_desktop_config.json is a nightmare"
**Solution**: "Run `openconductor doctor` and never touch JSON again"

**Headlines**:
- "JSON Hell? There's a Doctor for That"
- "Stop Breaking Your Claude Desktop Config"
- "The MCP Config Debugger You Didn't Know You Needed"

---

**Bottom Line**: `openconductor doctor` turns configuration pain into a competitive moat. Users become dependent on it, making OpenConductor the de facto config manager.
