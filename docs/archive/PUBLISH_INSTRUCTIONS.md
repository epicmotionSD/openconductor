# How to Publish OpenConductor Registry MCP

Quick reference for publishing the MCP server to npm.

## Prerequisites Check

```bash
# Verify you have npm account
npm whoami

# If not logged in
npm login
# Enter: username, password, email, OTP (if 2FA enabled)
```

## Step 1: Final Build Verification

```bash
cd /home/roizen/projects/openconductor/packages/mcp-servers/openconductor-registry

# Clean build
rm -rf dist/
npm run build

# Verify build output
ls -la dist/
# Should see: index.js, api-client.js, tools/, and .d.ts files
```

## Step 2: Test Locally (Optional but Recommended)

```bash
# Test with MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Should output:
# "Inspector running at http://localhost:6274"

# Kill with Ctrl+C when done
```

## Step 3: Publish to npm

```bash
# Make sure you're in the package directory
pwd
# Should show: /home/roizen/projects/openconductor/packages/mcp-servers/openconductor-registry

# Publish (dry run first to check)
npm publish --dry-run --access public

# If dry run looks good, publish for real
npm publish --access public

# Should output:
# + @openconductor/mcp-registry@1.0.0
```

## Step 4: Verify Publication

```bash
# Check on npm
npm view @openconductor/mcp-registry

# Or visit:
# https://www.npmjs.com/package/@openconductor/mcp-registry
```

## Step 5: Test Installation

```bash
# In a new terminal, install globally
npm install -g @openconductor/mcp-registry

# Find installation path
npm list -g @openconductor/mcp-registry

# Note the path for Claude Desktop config
```

## Step 6: Configure Claude Desktop

### Find config file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Add configuration:

**macOS/Linux**:
```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "/usr/local/lib/node_modules/@openconductor/mcp-registry/dist/index.js"
      ]
    }
  }
}
```

**Windows**:
```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "C:\\Users\\YourUsername\\AppData\\Roaming\\npm\\node_modules\\@openconductor\\mcp-registry\\dist\\index.js"
      ]
    }
  }
}
```

## Step 7: Test with Claude Desktop

1. **Restart Claude Desktop** (important!)

2. **Open Claude and test**:
   ```
   Show me trending MCP servers
   ```

3. **Verify all tools work**:
   - discover_servers
   - search_servers
   - get_server_details
   - get_trending_servers
   - get_category_stats

## Step 8: Submit to OpenConductor Registry

```bash
# Option 1: Use the CLI (if published)
openconductor submit @openconductor/mcp-registry

# Option 2: Web interface
# Visit: https://openconductor.ai/submit
# Enter: @openconductor/mcp-registry
```

## Step 9: Announce and Promote

### Update Main README
```bash
cd /home/roizen/projects/openconductor
# Add to README.md under "Featured Servers" or create new section
```

### Social Media
- Tweet announcement with demo
- Post in Discord
- Share on Product Hunt (later)

### GitHub
```bash
# Create a release
git tag -a v1.0.0 -m "Release OpenConductor Registry MCP v1.0.0"
git push origin v1.0.0
```

## Troubleshooting

### "You need to login to npm"
```bash
npm login
# Follow prompts
```

### "Package name already exists"
```bash
# Check if you own it
npm owner ls @openconductor/mcp-registry

# If not, choose different name in package.json
```

### "403 Forbidden"
```bash
# Ensure access is public
npm publish --access public
```

### "Package not found after publish"
```bash
# Wait 1-2 minutes for npm to index
# Then try: npm view @openconductor/mcp-registry
```

### Claude Desktop not detecting server
1. Check path in config is correct
2. Restart Claude Desktop (fully quit and reopen)
3. Check Claude Desktop logs for errors
4. Verify server runs manually: `node /path/to/dist/index.js`

## Quick Commands Reference

```bash
# Build
npm run build

# Publish (dry run)
npm publish --dry-run --access public

# Publish (for real)
npm publish --access public

# View published package
npm view @openconductor/mcp-registry

# Install globally
npm install -g @openconductor/mcp-registry

# Find global install path
npm list -g @openconductor/mcp-registry

# Update version (if needed)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Republish after update
npm publish --access public
```

## Success Checklist

- [ ] Logged into npm (`npm whoami` works)
- [ ] Build completes without errors
- [ ] Package published to npm
- [ ] Package visible on npmjs.com
- [ ] Can install globally
- [ ] Claude Desktop config updated
- [ ] Claude Desktop restarted
- [ ] All 5 tools work in Claude
- [ ] Added to OpenConductor registry
- [ ] Announcement posted

## Timeline

- **Build & Test**: 5 minutes
- **Publish to npm**: 2 minutes
- **Configure Claude**: 3 minutes
- **Test in Claude**: 5 minutes
- **Submit to registry**: 2 minutes
- **Total**: ~17 minutes

## What's Next After Publishing

1. **Monitor npm downloads**: https://npm-stat.com/charts.html?package=@openconductor/mcp-registry
2. **Track GitHub stars**: (once repo is public)
3. **Collect user feedback**: Discord, GitHub issues
4. **Iterate and improve**: Fix bugs, add features
5. **Build SportIntel MCP**: Next server for challenge

---

**Ready to publish?** Start with Step 1 and work your way down!

Good luck! 🚀
