# OpenConductor Support Templates

Quick-response templates for common launch day scenarios.

## 🚀 **Installation Issues**

### **Template 1: Node.js Version**
```
Hi! OpenConductor requires Node.js 18+. 

Check your version: `node --version`

If you need to update:
- **macOS:** `brew install node` or download from nodejs.org
- **Windows:** Download from nodejs.org  
- **Linux:** `sudo apt install nodejs` or use nvm

Let me know if that fixes it! 🚀
```

### **Template 2: Permission Denied**
```
This looks like a permissions issue. Try:

**macOS/Linux:** `sudo npm install -g @openconductor/cli`
**Windows:** Run Command Prompt as Administrator

Alternative: Use npx (no global install needed):
`npx @openconductor/cli discover`

Does that work better?
```

### **Template 3: Network/Registry Issues**
```
Looks like a connection issue to the registry. 

Quick fixes:
1. Check internet connection
2. Try: `npm config set registry https://registry.npmjs.org/`  
3. If behind corporate firewall, ask your IT team about npm access

You can also try: `openconductor --api-url https://api.openconductor.ai`

Let me know if you're still stuck!
```

---

## 🔍 **Discovery & Search Issues**

### **Template 4: No Servers Found**
```
No worries! Try these search tips:

✅ **Search by category:** `openconductor discover --category memory`
✅ **Search by function:** `openconductor discover "database"`  
✅ **Browse all:** `openconductor discover` (no query)
✅ **Web interface:** https://openconductor.ai/discover

What type of MCP server are you looking for? Happy to suggest some!
```

### **Template 5: Server Not Found**
```
That server might not be in our registry yet. 

Try:
1. **Check spelling:** `openconductor discover "partial-name"`
2. **Browse category:** `openconductor discover --category [category]`
3. **Web search:** https://openconductor.ai/discover

Know a great server we're missing? Drop the GitHub link and we'll add it! 📦
```

---

## ⚙️ **Configuration Issues**

### **Template 6: Claude Desktop Config**
```
OpenConductor automatically manages your Claude Desktop config file:

**Location:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
- **Linux:** `~/.config/claude/claude_desktop_config.json`

**View current config:** `openconductor list`
**Validate config:** Built-in validation ensures it's always correct

Need to use a custom location? `openconductor install server --config /path/to/config.json`
```

### **Template 7: Port Conflicts**  
```
OpenConductor handles ports automatically, but if you're seeing conflicts:

1. **Check current ports:** `openconductor list`
2. **Specify custom port:** `openconductor install server --port 8090`
3. **Auto-allocation:** OpenConductor finds free ports 8080-9000

Port conflicts are rare with our automatic management. What error are you seeing?
```

---

## 🛠️ **Technical Questions**

### **Template 8: How It Works**
```
Great question! Here's how OpenConductor works:

1. **Registry:** We index MCP servers from GitHub automatically  
2. **CLI:** Searches registry, installs packages, configures Claude
3. **Sync:** Updates happen automatically via GitHub webhooks

**Under the hood:**
- PostgreSQL database with 127+ servers
- Redis caching for fast search
- GitHub API integration for real-time updates

Want to see the code? https://github.com/epicmotionSD/openconductor 🔍
```

### **Template 9: Adding Your Server**
```
Love that you want to contribute! Adding servers is easy:

**Automatic (Recommended):**
1. Add `mcp-server` topic to your GitHub repo
2. Include installation instructions in README
3. We auto-discover and index within 24 hours

**Manual (Coming Soon):**
- Submit via our web interface (Phase 2 feature)

**Requirements:**
✅ Clear installation instructions
✅ Working MCP server implementation  
✅ Open source (preferred)

Drop your GitHub link and we'll fast-track it! 🚀
```

---

## 🤝 **Community & Feedback**

### **Template 10: Thank You**
```
Thank you so much for trying OpenConductor! 🙏

Your feedback means everything to us. If you're finding it useful:

⭐ **Star us on GitHub:** https://github.com/epicmotionSD/openconductor
💬 **Join Discord:** https://discord.gg/Ya5TPWeS
🐛 **Report bugs:** GitHub Issues
💡 **Suggest features:** GitHub Discussions

What are you building with MCP servers? We'd love to hear about it!
```

### **Template 11: Feature Request Response**
```
Love this idea! 💡

I've added it to our roadmap: [GitHub Issue Link]

**Timeline:** We review feature requests weekly
**Voting:** GitHub reactions help us prioritize  
**Updates:** Follow the issue for progress

Want to contribute? We're always looking for community developers! 

Check out CONTRIBUTING.md to get started 🤝
```

---

## 🚨 **Launch Day Emergency Responses**

### **Template 12: Server Down**
```
We're experiencing high launch traffic! 📈

**Status:** Investigating and scaling up servers
**ETA:** Back online in 2-3 minutes  
**Updates:** https://status.openconductor.ai

Thanks for your patience - this is a good problem to have! 🚀

Follow @SDexecution for real-time updates.
```

### **Template 13: High Traffic**
```
Wow! The response to OpenConductor has been incredible! 🤯

We're seeing high traffic and scaling up infrastructure.

**What to expect:**
- Slightly slower response times (30s instead of 3s)
- All features still working
- We're monitoring closely

**Workaround:** Try the web interface if CLI is slow: https://openconductor.ai

Thanks for being part of launch day! 🎉
```

---

## 📊 **Metrics & Progress Updates**

### **Template 14: Milestone Celebration**
```
🎉 MILESTONE ALERT! 🎉

We just hit [NUMBER] [METRIC]!

In [TIME PERIOD]:
- 📦 [N] CLI installs
- ⭐ [N] GitHub stars
- 👥 [N] community members
- 🔥 Most popular: [TOP SERVER]

Thank you to everyone who's tried OpenConductor and shared feedback!

What should we build next? Drop ideas in #feature-requests 💭
```

### **Template 15: Weekly Update**
```
📊 **Week 1 Numbers:**

🚀 **Growth:**
- CLI Downloads: [N] (+[%] from last week)
- GitHub Stars: [N] (+[%] from last week)  
- Community: [N] members (+[%] from last week)

🔥 **Popular Servers:**
1. [Server 1] - [N] installs
2. [Server 2] - [N] installs  
3. [Server 3] - [N] installs

🛠️ **This Week:**
- Fixed [N] bugs
- Added [N] servers
- Shipped [N] improvements

**Next week:** [Preview upcoming features]

Thanks for an incredible launch week! 🙏
```

---

## 🎯 **Response Time Guidelines**

### **Priority Levels:**

**🔴 Critical (Respond in 15 minutes):**
- CLI completely broken
- Website down
- Security issues
- Data loss reports

**🟡 High (Respond in 1 hour):**
- Installation failures  
- Search not working
- Feature requests from influencers
- Press inquiries

**🟢 Normal (Respond in 4 hours):**
- General questions
- Feature requests
- Documentation feedback
- Community discussions

**⚪ Low (Respond in 24 hours):**
- Enhancement ideas
- Non-urgent feedback
- Thank you messages
- General community chat

---

## 🎨 **Tone & Style Guide**

### **Voice:**
- **Friendly but professional**
- **Helpful without being condescending**  
- **Excited about the technology**
- **Humble about mistakes**

### **Do:**
✅ Thank people for trying OpenConductor  
✅ Provide specific, actionable help
✅ Ask follow-up questions to understand issues
✅ Celebrate community wins and feedback
✅ Admit when you don't know something

### **Don't:**
❌ Get defensive about criticism
❌ Promise features without timeline
❌ Ignore or dismiss feedback  
❌ Use too much technical jargon
❌ Argue with trolls (respond once politely, then ignore)

---

*Use these templates as starting points - personalize based on the specific user and situation!*