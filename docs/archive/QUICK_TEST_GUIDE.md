# Quick Test Guide - Both MCP Servers in Claude Desktop

**Status**: ✅ Configuration updated with both new servers!

---

## 🎯 Your Claude Desktop Now Has 6 MCP Servers

### Existing Servers (Already Working)
1. **openconductor-filesystem** - File operations in your project
2. **openconductor-database** - PostgreSQL database access
3. **github** - GitHub API operations
4. **git-openconductor** - Git operations on your repo

### NEW Servers (Just Added!)
5. **openconductor-registry** - Discover 120+ MCP servers
6. **sportintel** - Live sports data and analysis

---

## 🚀 Quick Start (2 Minutes)

### Step 1: Restart Claude Desktop
- Completely quit Claude Desktop
- Reopen it
- Wait for all 6 servers to connect

### Step 2: Test Registry MCP (New!)

Type this in Claude:
```
Show me MCP servers for working with databases
```

**Expected**: List of database MCP servers with install commands

### Step 3: Test SportIntel MCP (New!)

Type this in Claude:
```
What are today's NBA scores?
```

**Expected**: Live NBA game scores with teams and records

---

## 🎨 Demo Queries to Impress

### Registry MCP - Discover Servers

1. **"What are the most popular MCP servers?"**
   - Shows trending servers with GitHub stars

2. **"Find MCP servers for memory management"**
   - Targeted search example

3. **"Get details about the filesystem server"**
   - Deep dive with install instructions

4. **"Show me a breakdown of servers by category"**
   - Ecosystem statistics

### SportIntel - Sports Intelligence

1. **"What are today's NBA scores?"**
   - Live game scores

2. **"Show me NBA standings"**
   - Full league standings by division

3. **"Find the Los Angeles Lakers"**
   - Team search and info

4. **"Which NBA teams are playoff contenders based on current standings?"**
   - AI analyzes the data!

### Cross-Server Magic

1. **"Use the registry to find the sportintel server"**
   - Meta query: one server discovering another!

2. **"Show me all the MCP servers I have installed"**
   - Claude will list all 6 servers

---

## 📊 What Each Server Does

### Your Full MCP Stack

| Server | Purpose | Example Query |
|--------|---------|---------------|
| **filesystem** | Read/write project files | "Read the README.md file" |
| **database** | PostgreSQL queries | "Show me the mcp_servers table" |
| **github** | GitHub API access | "List my GitHub repositories" |
| **git** | Git operations | "Show me recent commits" |
| **registry** 🆕 | Discover MCP servers | "Find database servers" |
| **sportintel** 🆕 | Sports data + AI | "NBA scores today" |

---

## ✅ Verification Checklist

After restarting Claude Desktop:

- [ ] Claude shows all 6 servers connected
- [ ] Existing servers still work (test one)
- [ ] Registry MCP responds to "show me trending servers"
- [ ] SportIntel MCP responds to "NBA scores"
- [ ] No error messages appear
- [ ] Responses come within 1-2 seconds

---

## 🎬 Perfect Demo Flow

Use this for recordings or demos:

```
[Start]
"Hi, I've just added two new MCP servers to Claude. Let me show you."

[Test Registry]
"Show me the most popular MCP servers"
[Wait for response]
"That's the Registry MCP - it discovers other servers!"

[Test SportIntel]
"What are today's NBA scores?"
[Wait for response]
"And that's SportIntel - live sports data with AI analysis!"

[Meta Demo]
"Now watch this - use the registry to find the sportintel server"
[Wait for response]
"One server discovering another - that's the power of MCP!"

[Finish]
"Both servers are live on npm and ready to use!"
```

---

## 🐛 Troubleshooting

### "Server not found" errors

**Check**:
```bash
# Verify installations
npm list -g @openconductor/mcp-registry
npm list -g @openconductor/sportintel

# Should show v1.0.0 for both
```

### Servers don't connect

**Check logs**:
```bash
# Claude Desktop logs location
ls -la ~/.config/claude/logs/

# View most recent log
tail -50 ~/.config/claude/logs/mcp*.log
```

### Registry returns errors

**Test API**:
```bash
curl https://api.openconductor.ai/v1/servers | head -100
# Should return JSON with servers
```

### SportIntel returns errors

**Test ESPN API**:
```bash
curl "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard" | head -100
# Should return JSON with games
```

---

## 📸 Screenshot Opportunities

### For Social Media/Demos

1. **Server List** - Claude showing all 6 servers connected
2. **Registry Search** - "Show me database servers" result
3. **Trending Servers** - Popular MCP servers list
4. **Live NBA Scores** - Today's games with scores
5. **Standings Table** - Full NBA standings
6. **Meta Query** - Registry finding SportIntel

---

## 🎯 Test Script for Recording

```
# Setup
- Open Claude Desktop (all servers connected)
- Start new conversation
- Have queries ready

# Registry MCP Demo (30 seconds)
"Show me MCP servers for working with databases"
[Pause for response]
"What are the trending MCP servers?"
[Pause for response]

# SportIntel Demo (30 seconds)
"What are today's NBA scores?"
[Pause for response]
"Show me NBA standings"
[Pause for response]

# Meta Demo (15 seconds)
"Use the registry to search for sports-related servers"
[Pause for response - should find SportIntel!]

# Close
"Both servers working perfectly!"
```

---

## 💡 Pro Tips

### Make Your Demo Stand Out

1. **Show the meta-capability**: Use Registry to find SportIntel
2. **Show AI analysis**: Ask Claude to analyze standings
3. **Show speed**: Highlight how fast responses are (caching!)
4. **Show variety**: Different sports, different queries
5. **Show cross-server**: Combine filesystem + registry queries

### Example Advanced Query

```
"Use the registry to find all database-related MCP servers, then tell me which would work best with my PostgreSQL database that you can already access"
```

This shows Claude using multiple MCP servers together!

---

## 📦 Package Info

### Quick Links

**Registry MCP**:
- npm: https://www.npmjs.com/package/@openconductor/mcp-registry
- Docs: See README in package

**SportIntel MCP**:
- npm: https://www.npmjs.com/package/@openconductor/sportintel
- Docs: See README in package

### Installation (Others Can Use)

```bash
npm install -g @openconductor/mcp-registry @openconductor/sportintel
```

Then add to their Claude config using the paths from `npm root -g`.

---

## 🎉 You're Ready!

**Your Claude Desktop now has**:
- ✅ File operations (filesystem)
- ✅ Database access (PostgreSQL)
- ✅ GitHub integration
- ✅ Git operations
- ✅ MCP server discovery (NEW!)
- ✅ Live sports intelligence (NEW!)

**Next**: Restart Claude Desktop and test! 🚀

---

## 📞 Need Help?

- **Config issues**: Check `CLAUDE_DESKTOP_SETUP.md`
- **API errors**: Test with curl commands above
- **Server problems**: Check npm installations
- **Other issues**: hello@openconductor.ai

**Good luck with your demos!** 🎬
