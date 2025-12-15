# Discord Quick Start (30 Minutes)

Fast track setup for OpenConductor Discord server.

## Step 1: Create Server (5 min)

1. Open Discord → Click "+" → Create My Own → For a community
2. **Server Name**: `OpenConductor`
3. **Upload Icon**: OpenConductor logo
4. Click "Create"

## Step 2: Quick Channels (10 min)

Delete default channels and create these:

### Category: 📢 INFORMATION
```
#welcome
#rules
#announcements
```

### Category: 💬 GENERAL
```
#general
#introductions
#showcase
#help
```

### Category: 🛠️ DEVELOPMENT
```
#developers
#server-submissions
```

### Category: 🔊 VOICE
```
🔊 Office Hours
```

**Quick Tip:** Create a channel, then drag to create category.

## Step 3: Essential Bots (10 min)

### Add Welcomer Bot
1. Go to: https://welcomer.gg/
2. Click "Add to Discord"
3. Select OpenConductor server
4. Configure welcome message:

```
👋 Welcome {{user}}!

🚀 Quick Start:
npm install -g @openconductor/cli
openconductor install github

📚 Resources:
• https://openconductor.ai
• https://github.com/epicmotionSD/openconductor

Get help in <#help>!
```

### Add MEE6
1. Go to: https://mee6.xyz/
2. Click "Add to Discord"
3. Enable: Moderation + Custom Commands

## Step 4: Set Rules (5 min)

Post in #rules:

```
📜 Server Rules

1. Be respectful - No harassment or hate speech
2. Stay on topic - Use appropriate channels
3. No spam - No excessive messages or ads
4. Get help properly - Use #help with details
5. Share responsibly - No malicious code

Code of Conduct: https://github.com/epicmotionSD/openconductor/blob/main/CODE_OF_CONDUCT.md
```

## Step 5: Server Settings (5 min)

Go to: Server Settings → Overview

**Description:**
```
The npm for AI agent tools. Install MCP servers without the JSON hell.
220+ servers, one command, zero config.
```

**Verification Level:** Medium

**Explicit Content Filter:** Scan all members

Go to: Server Settings → Enable Community

Check these:
- [x] Accept rules
- [x] Enable welcome screen

## Step 6: Create Roles (5 min)

Server Settings → Roles → Create:

1. **Moderator** (Green) - Manage Messages, Timeout Members
2. **Contributor** (Orange) - Special color for contributors
3. **Helper** (Yellow) - For active helpers
4. **Member** (Gray) - Default role

## Step 7: Invite Link (2 min)

1. Right-click server icon
2. Click "Invite People"
3. Create permanent invite link
4. Copy: `discord.gg/[your-code]`

**Save this link!** You'll need it for:
- OpenConductor README
- Website
- Twitter bio
- GitHub

## Quick Invite Message

Share this in your communities:

```
Join the OpenConductor Discord! 🚀

Get help, share projects, and connect with developers building AI agent tools.

✨ 220+ MCP servers
🛠️ Installation support
📚 Tutorials & guides
💬 Active community

Join: discord.gg/[your-code]
```

## First Announcement

Post in #announcements:

```
📣 Welcome to OpenConductor Discord!

We're just getting started. Here's what you can do:

✅ Get help installing MCP servers in #help
✅ Share what you built in #showcase
✅ Submit servers to the registry in #server-submissions
✅ Chat with the community in #general

Resources:
• Website: https://openconductor.ai
• GitHub: https://github.com/epicmotionSD/openconductor
• Docs: https://openconductor.ai/docs

Let's build something awesome! 🎉
```

## Add to OpenConductor README

Add Discord link to README.md:

```markdown
## Community

- 🌐 [Website](https://openconductor.ai)
- 💬 [Discord](https://discord.gg/your-code)  ← ADD THIS
- 🐦 [Twitter/X](https://twitter.com/openconductor)
- 🐛 [Issues](https://github.com/epicmotionSD/openconductor/issues)
```

## Promote Your Discord

### Tweet
```
Just launched OpenConductor Discord! 🎉

Join to:
• Get installation help
• Share your projects
• Connect with developers
• Access tutorials

Join: discord.gg/[code]

#OpenConductor #MCP #ClaudeAI
```

### Reddit Post
```
Title: OpenConductor Discord is Live!

We've launched a Discord community for OpenConductor (the npm for MCP servers).

Join to get help, share projects, and connect with other developers.

Link: discord.gg/[code]
```

### GitHub
Add badge to README:
```markdown
[![Discord](https://img.shields.io/discord/YOUR_SERVER_ID?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/your-code)
```

Get your server ID:
1. Enable Developer Mode in Discord
2. Right-click server icon
3. Copy ID

## Next Steps

Once you have 10+ members:

1. **Host Office Hours** - Weekly voice chat
2. **Post Tutorials** - Share guides in #tutorials
3. **Feature Servers** - Spotlight MCP servers weekly
4. **Give Roles** - Reward active helpers
5. **Gather Feedback** - Ask what members want

## Full Setup Guide

For complete setup including advanced features:
→ [DISCORD_SETUP_GUIDE.md](./DISCORD_SETUP_GUIDE.md)

---

🎉 **Your Discord is ready in 30 minutes!**

Last Updated: 2025-01-26
