# Claude Desktop Setup Guide - BOTH MCP SERVERS

**Status**: ✅ Both servers installed and configured!
**Setup Date**: November 20, 2025

---

## ✅ What's Installed

Both MCP servers are now installed globally and configured for Claude Desktop:

1. **OpenConductor Registry MCP** v1.0.0
2. **SportIntel MCP** v1.0.0

---

## 📍 Installation Locations

**Global npm directory**: `/home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/`

**Registry MCP**:
```
/home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/mcp-registry/dist/index.js
```

**SportIntel MCP**:
```
/home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/sportintel/dist/index.js
```

---

## ⚙️ Claude Desktop Configuration

**Config file location**: `~/.config/Claude/claude_desktop_config.json`

**Current configuration**:
```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "node",
      "args": [
        "/home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/mcp-registry/dist/index.js"
      ]
    },
    "sportintel": {
      "command": "node",
      "args": [
        "/home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/sportintel/dist/index.js"
      ]
    }
  }
}
```

### Adding Python-based MCP Servers

Some MCP servers (like `mcp-server-git`) are Python packages. To add them:

1. **Install uv** (Python package runner):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   source $HOME/.local/bin/env
   ```

2. **Add to Claude config** (example with git server):
   ```json
   {
     "mcpServers": {
       "git": {
         "command": "uvx",
         "args": [
           "mcp-server-git",
           "--repository",
           "/home/roizen/projects/openconductor"
         ]
       }
     }
   }
   ```

3. **Test the server**:
   ```bash
   uvx mcp-server-git --help
   ```

**Note**: The first run may take longer as `uvx` downloads and caches the package.

---

## 🧪 Testing Steps

### Step 1: Restart Claude Desktop

**Important**: You MUST restart Claude Desktop for the MCP servers to load.

1. Completely quit Claude Desktop (not just close the window)
2. Reopen Claude Desktop
3. Wait for it to fully load

### Step 2: Verify Servers are Loaded

Claude Desktop should show MCP server indicators when they're loaded. Look for:
- Server connection status in the UI
- Available tools/functions

### Step 3: Test Registry MCP

Try these queries in Claude:

**Test 1 - Discover Servers**:
```
Show me MCP servers for working with databases
```

**Expected**: List of database-related MCP servers with descriptions and install commands

**Test 2 - Trending**:
```
What are the most popular MCP servers right now?
```

**Expected**: List of trending servers sorted by GitHub stars and installs

**Test 3 - Search**:
```
Search for servers related to GitHub
```

**Expected**: Search results for GitHub-related servers

**Test 4 - Details**:
```
Get details about the openmemory server
```

**Expected**: Detailed information including installation instructions

**Test 5 - Categories**:
```
Show me the breakdown of MCP servers by category
```

**Expected**: Statistics showing server counts per category

### Step 4: Test SportIntel MCP

Try these queries in Claude:

**Test 1 - Live NBA Scores**:
```
What are today's NBA scores?
```

**Expected**: Current/recent NBA game scores with teams, records, and status

**Test 2 - NFL Scores**:
```
Show me NFL scores
```

**Expected**: NFL game scores (if games are happening)

**Test 3 - Standings**:
```
Show me NBA standings
```

**Expected**: Full NBA standings organized by division

**Test 4 - Team Search**:
```
Find the Los Angeles Lakers
```

**Expected**: Lakers team information and current record

**Test 5 - AI Analysis**:
```
Which NBA teams are currently playoff contenders based on the standings?
```

**Expected**: Claude analyzes the standings data and provides insights

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Claude Desktop restarted successfully
- [ ] Both MCP servers show as connected
- [ ] Registry MCP can discover servers
- [ ] Registry MCP can search servers
- [ ] Registry MCP can show server details
- [ ] SportIntel can fetch live scores
- [ ] SportIntel can show standings
- [ ] SportIntel can search teams
- [ ] Both servers respond within 1-2 seconds
- [ ] No error messages in Claude

---

## 🐛 Troubleshooting

### Claude Desktop doesn't start

**Cause**: Configuration file syntax error

**Fix**:
```bash
# Verify JSON is valid
cat ~/.config/Claude/claude_desktop_config.json | python3 -m json.tool
```

If you see errors, the JSON is malformed. Check for:
- Missing commas
- Unclosed quotes
- Incorrect brackets

### MCP servers not showing up

**Cause**: Incorrect paths or permissions

**Fix**:
```bash
# Verify files exist
ls -la /home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/mcp-registry/dist/index.js
ls -la /home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/sportintel/dist/index.js

# Make sure they're executable
chmod +x /home/roizen/.nvm/versions/node/v20.19.5/lib/node_modules/@openconductor/*/dist/index.js
```

### "Server connection failed" errors

**Cause**: Node.js path issues

**Fix**:
```bash
# Verify node is in PATH
which node

# If different from config, update the "command" field to full path:
# "command": "/home/roizen/.nvm/versions/node/v20.19.5/bin/node"
```

### Registry MCP returns errors

**Cause**: API connectivity issues

**Fix**:
```bash
# Test API directly
curl https://api.openconductor.ai/v1/servers

# Should return JSON with servers
```

### SportIntel returns errors

**Cause**: ESPN API connectivity

**Fix**:
```bash
# Test ESPN API
curl "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"

# Should return JSON with game data
```

---

## 📊 Expected Performance

### Registry MCP
- **Response Time**: <500ms (with caching)
- **Cache Duration**: 5 minutes for most queries
- **API Calls**: ~1 per unique query
- **Data Source**: api.openconductor.ai

### SportIntel MCP
- **Response Time**: <1000ms (first request), <200ms (cached)
- **Cache Duration**:
  - Live scores: 2 minutes
  - Standings: 1 hour
  - Team data: 24 hours
- **API Calls**: ~1 per unique query per cache period
- **Data Source**: ESPN public APIs

---

## 🔄 Updating the Servers

When new versions are released:

```bash
# Update both servers
npm update -g @openconductor/mcp-registry @openconductor/sportintel

# Restart Claude Desktop
# (Configuration doesn't need to change)
```

---

## 🎯 Demo Queries to Try

### Cool Registry MCP Queries

1. **"Show me all memory-related MCP servers"**
   - Discovers memory management tools

2. **"What's the most popular MCP server?"**
   - Shows top server by stars

3. **"Find servers that work with PostgreSQL"**
   - Targeted search example

4. **"How many MCP servers are in the filesystem category?"**
   - Category statistics

### Cool SportIntel Queries

1. **"How did the Warriors do last night?"**
   - Recent game lookup

2. **"Compare the Lakers and Celtics standings"**
   - Multi-team analysis

3. **"Which NBA team has the best record in the West?"**
   - AI analyzes standings

4. **"Show me all California NBA teams"**
   - Geography-based search

---

## 📸 Screenshot Checklist

For demo videos and marketing, capture screenshots of:

### Registry MCP
- [ ] Search results showing multiple servers
- [ ] Trending servers list
- [ ] Detailed server info with install commands
- [ ] Category statistics

### SportIntel MCP
- [ ] Live game scores with multiple games
- [ ] Full standings table
- [ ] Team search results
- [ ] AI analysis of playoff race

---

## 🎬 Recording Tips

When creating demo videos:

1. **Clear the chat**: Start fresh for clean screenshots
2. **Type slowly**: Make queries readable in video
3. **Wait for response**: Let full output display
4. **Highlight features**: Zoom in on important details
5. **Show variety**: Different queries, different sports

---

## 💡 Test Script for Live Demo

Use this script for a live demonstration:

```
[Open Claude Desktop]

"Hi Claude, I've configured two MCP servers. Let's test them."

[Test Registry MCP]
"Show me MCP servers for working with databases"
[Wait for response]

"What are the trending MCP servers?"
[Wait for response]

[Test SportIntel]
"What are today's NBA scores?"
[Wait for response]

"Show me NBA standings"
[Wait for response]

[Test AI Integration]
"Based on these standings, which teams look like playoff contenders?"
[Wait for Claude to analyze]

[Close]
"Both servers are working perfectly!"
```

---

## ✅ Success Criteria

Both servers are working if:

1. ✅ No error messages appear
2. ✅ Data is returned within 2 seconds
3. ✅ Formatted output is clear and readable
4. ✅ Links and install commands are included
5. ✅ Claude can analyze the data (AI integration works)

---

## 📞 Support

If you encounter issues:

1. **Check logs**: Claude Desktop logs are in `~/.config/claude/logs/`
2. **Test APIs**: Verify api.openconductor.ai and ESPN APIs are accessible
3. **GitHub Issues**: https://github.com/epicmotionSD/openconductor/issues
4. **Discord**: [community server]
5. **Email**: hello@openconductor.ai

---

## 🎉 You're All Set!

Both MCP servers are installed and configured. Just restart Claude Desktop and start testing!

**Next Steps**:
1. Restart Claude Desktop
2. Test all queries above
3. Capture screenshots/recordings
4. Share your results!

Good luck with the demos! 🚀
