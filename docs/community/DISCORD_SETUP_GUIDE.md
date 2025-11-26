# Discord Server Setup Guide

Complete setup for OpenConductor Discord community.

## Server Creation

### Initial Setup

1. **Create Server**
   - Name: `OpenConductor`
   - Icon: OpenConductor logo (terminal icon with blue circle)
   - Server template: Community
   - Region: Auto

2. **Server Settings**
   - Go to: Server Settings → Overview
   - **Description**:
     ```
     The npm for AI agent tools. Install MCP servers without the JSON hell.
     220+ servers, one command, zero config.
     ```
   - **Discovery**: Enable (if eligible)
   - **Verification Level**: Medium
   - **Explicit Content Filter**: Scan all members
   - **System Messages Channel**: #general

## Server Structure

### Categories & Channels

```
📢 INFORMATION
├── #welcome - Welcome new members
├── #rules - Server rules and guidelines
├── #announcements - Official announcements
└── #changelog - Product updates

💬 GENERAL
├── #general - General discussion
├── #introductions - Introduce yourself
├── #showcase - Share what you built
└── #off-topic - Random chat

🔧 SUPPORT
├── #help - Get help installing MCP servers
├── #troubleshooting - Fix issues
├── #feature-requests - Suggest new features
└── #bug-reports - Report bugs

🛠️ DEVELOPMENT
├── #developers - Technical discussions
├── #server-submissions - Submit new MCP servers
├── #api-discussion - API and SDK talk
└── #contributing - How to contribute

🚀 MCP SERVERS
├── #server-spotlight - Featured servers
├── #server-recommendations - Ask for recommendations
├── #stacks - Discuss stacks and workflows
└── #integrations - Integration guides

🎓 LEARNING
├── #tutorials - Guides and how-tos
├── #resources - Useful links
├── #use-cases - Real-world examples
└── #ask-claude - Questions answered by Claude

🎉 COMMUNITY
├── #events - Community events
├── #achievements - Unlock badges
├── #feedback - Suggestions
└── #random - Fun stuff

🔊 VOICE CHANNELS
├── 🔊 General Voice
├── 🔊 Office Hours
└── 🔊 Pair Programming
```

### Channel Descriptions

**#welcome**
```
Welcome to OpenConductor! 🎉

We're the npm for AI agent tools. Install MCP servers without the JSON hell.

👋 Start here:
• Read #rules
• Introduce yourself in #introductions
• Check #announcements for updates
• Get help in #help

🚀 Quick Start:
npm install -g @openconductor/cli
openconductor install github

Links:
• Website: https://openconductor.ai
• GitHub: https://github.com/epicmotionSD/openconductor
• Docs: https://openconductor.ai/docs
```

**#rules**
```
📜 Server Rules

1. **Be Respectful**
   • Treat everyone with respect
   • No harassment, hate speech, or discrimination
   • Keep discussions professional and constructive

2. **Stay On Topic**
   • Use appropriate channels
   • Keep technical discussions in dev channels
   • Use #off-topic for casual chat

3. **No Spam**
   • No advertising or self-promotion without permission
   • No excessive messages or bot spam
   • No DM advertising

4. **Get Help Properly**
   • Use #help for support questions
   • Search existing messages first
   • Provide error messages and logs
   • Be patient - this is a community

5. **Share Responsibly**
   • No pirated content
   • No malicious code or servers
   • Credit others' work
   • Follow licenses

6. **English Primary**
   • English is the main language
   • Other languages welcome in DMs

Violations may result in warnings, mutes, or bans.
Questions? Ask a moderator.

Code of Conduct: https://github.com/epicmotionSD/openconductor/blob/main/CODE_OF_CONDUCT.md
```

**#announcements**
```
📣 Official Announcements

Stay updated on:
• New releases and features
• Breaking changes
• Community events
• Important updates

Follow to never miss an update!
```

**#general**
```
💬 General Discussion

Talk about anything related to:
• MCP servers
• Claude Desktop
• AI agent tools
• OpenConductor

Need help? Use #help instead
```

**#help**
```
🆘 Get Help

Having trouble? We're here to help!

Before asking:
1. Check the docs: https://openconductor.ai/docs
2. Search this channel
3. Try #troubleshooting for common issues

When asking:
• Describe the problem clearly
• Include error messages
• Share your OS and versions
• Tell us what you've tried

Response time: Usually < 1 hour during US hours
```

**#showcase**
```
✨ Showcase

Share what you built with OpenConductor!

Examples:
• Workflows and automations
• Custom MCP servers
• Integration demos
• Video tutorials
• Blog posts

Use this format:
**Project:** Name
**Description:** What it does
**Tech:** MCP servers used
**Link:** GitHub/demo

We love seeing what you create! 🚀
```

**#server-submissions**
```
📦 Submit MCP Servers

Have an MCP server to add to the registry?

Submit here or on GitHub:
https://github.com/epicmotionSD/openconductor/issues/new?template=server_request.md

Requirements:
✓ Follows MCP specification
✓ Has documentation
✓ Publicly available (npm/GitHub)
✓ Tested and working

Format:
**Name:** Server name
**Description:** What it does
**Package:** npm package or GitHub URL
**Category:** Development/Productivity/Data/etc.

We review submissions weekly!
```

**#ask-claude**
```
🤖 Ask Claude

Ask questions and Claude (via MCP) will help!

Try asking:
• "How do I install the GitHub MCP server?"
• "What's the best stack for web development?"
• "Help me debug this error: [paste error]"
• "Recommend servers for data analysis"

Claude has access to:
• OpenConductor registry (220+ servers)
• Documentation and guides
• Common issues and solutions

Be specific for best results!
```

## Roles & Permissions

### Role Structure

```
🔴 @Owner (Admin)
├── Full permissions
└── Server management

🔵 @Core Team (Admin)
├── Manage server
├── Manage channels
├── Manage roles
├── Kick/ban members
└── All moderation tools

🟢 @Moderator (Moderator)
├── Manage messages
├── Kick members
├── Timeout members
└── Help in support channels

🟡 @Contributor (Special)
├── Submitted code to OpenConductor
├── Special color
└── Access to #contributors channel

🟠 @Server Author (Special)
├── Created MCP servers in registry
├── Special badge
└── Showcase their work

🟣 @Helper (Community)
├── Active helper in #help
├── Can use external emojis
└── Recognition role

⚪ @Member (Default)
└── Standard access

🤖 @Bot
└── Bot-specific permissions
```

### Permission Settings

**@Owner**
- Administrator: ✅

**@Core Team**
- Administrator: ✅

**@Moderator**
- Manage Messages: ✅
- Manage Threads: ✅
- Kick Members: ✅
- Timeout Members: ✅
- View Audit Log: ✅

**@Contributor**
- Send Messages: ✅
- Embed Links: ✅
- Attach Files: ✅
- Use External Emojis: ✅

**@Member**
- View Channels: ✅
- Send Messages: ✅
- Embed Links: ✅
- Attach Files: ✅
- Read Message History: ✅
- Add Reactions: ✅
- Use Slash Commands: ✅

### Role Colors

- Owner: `#E74C3C` (Red)
- Core Team: `#3498DB` (Blue)
- Moderator: `#2ECC71` (Green)
- Contributor: `#F39C12` (Orange)
- Server Author: `#9B59B6` (Purple)
- Helper: `#E67E22` (Yellow-Orange)
- Member: `#95A5A6` (Gray)

## Welcome Bot Setup

### Recommended Bot: Welcomer

1. **Add Welcomer Bot**
   - https://welcomer.gg/
   - Authorize for your server
   - Set permissions

2. **Welcome Message Configuration**

```
👋 Welcome to OpenConductor, {{user}}!

We're the npm for AI agent tools. Install 220+ MCP servers with one command.

🚀 **Get Started:**
1. Read our <#rules-channel-id>
2. Introduce yourself in <#introductions-channel-id>
3. Install the CLI: `npm install -g @openconductor/cli`

📚 **Resources:**
• Website: https://openconductor.ai
• Docs: https://openconductor.ai/docs
• GitHub: https://github.com/epicmotionSD/openconductor

Need help? Ask in <#help-channel-id>!

Enjoy your stay! 🎉
```

3. **Welcome Channel**: #welcome
4. **Leave Message**: Disabled
5. **DM New Members**: Optional with quick links

## Moderation Bots

### 1. MEE6 (Recommended)

**Features:**
- Auto-moderation
- Custom commands
- Leveling system
- Reaction roles

**Setup:**
1. Add MEE6: https://mee6.xyz/
2. Enable plugins:
   - Moderation
   - Leveling
   - Custom Commands
   - Reaction Roles

**Auto-Mod Rules:**
- Spam: 5 messages in 5 seconds → Timeout 5 minutes
- Excessive mentions: >5 mentions → Delete + warn
- Caps: >70% caps → Delete message
- Links in #help: Allowed
- Links in #general: Allowed from trusted members

### 2. Dyno (Alternative)

**Features:**
- Advanced moderation
- Auto-moderation
- Custom commands
- Logging

**Setup:**
1. Add Dyno: https://dyno.gg/
2. Configure modules
3. Set up logging channel

### 3. Carl-bot (Reaction Roles)

**Setup:**
1. Add Carl-bot: https://carl.gg/
2. Create reaction role message in #rules
3. Configure roles

**Reaction Roles Message:**
```
🎯 **Choose Your Interests**

React to get notified about:
📢 @Announcements - New releases
🚀 @Updates - Weekly updates
🎓 @Tutorials - New guides
🛠️ @Developer - Technical discussions
💼 @Job Opportunities - Work opportunities

Remove reaction to unsubscribe.
```

## Custom Bots (Optional)

### OpenConductor Stats Bot

**Features:**
- Show server statistics
- Installation commands
- Search registry
- Display trending servers

**Commands:**
- `/stats` - Show OpenConductor statistics
- `/server <name>` - Get server info
- `/install <name>` - Show install command
- `/trending` - Show trending servers
- `/search <query>` - Search registry

**Code:** Create with Discord.js + OpenConductor API

### GitHub Integration Bot

**Setup:**
1. Add GitHub App: https://github.com/apps/discord
2. Link repository: `epicmotionSD/openconductor`
3. Configure notifications to #changelog

**Notifications:**
- New releases → #changelog
- New issues → #bug-reports (optional)
- New PRs → #developers (optional)
- New stars milestone → #announcements

## Engagement Strategies

### 1. Office Hours

**Schedule:**
- Weekly: Wednesdays 2pm PT / 5pm ET
- Voice channel: Office Hours
- Duration: 1 hour
- Format: Q&A, demos, discussions

**Announcement Template:**
```
🎙️ **Office Hours Tomorrow!**

Join us Wednesday at 2pm PT / 5pm ET in 🔊 Office Hours

This week:
• Demo: Building custom MCP servers
• Q&A: Ask anything
• Sneak peek: Upcoming features

See you there! 🚀
```

### 2. Weekly Events

**Server Spotlight Saturday**
- Feature 1 MCP server per week
- Post in #server-spotlight
- Include demo, use cases, tips

**Tutorial Tuesday**
- Share weekly tutorial
- Post in #tutorials
- Cover different use cases

**Feedback Friday**
- Ask for community feedback
- Post in #feedback
- Engage with suggestions

### 3. Achievements System

Use MEE6 leveling or custom bot:

**Levels & Rewards:**
- Level 5: @Active Member role + custom color
- Level 10: @Helper role + external emojis
- Level 20: @Super Helper role + special badge
- Level 50: @Legend role + VIP channel access

**Special Achievements:**
- First Install: Install first MCP server
- Stack Master: Install 3+ stacks
- Contributor: Submit PR to OpenConductor
- Server Author: Create MCP server in registry
- Helper: Get 10+ helpful reactions in #help

### 4. Community Programs

**Helper Program**
- Recognize active helpers
- Give @Helper role
- Special perks and recognition
- Monthly "Helper of the Month"

**Ambassador Program**
- Content creators and advocates
- Special role and channel
- Early access to features
- Swag and perks

### 5. Content Calendar

**Monday:**
- Share #changelog updates
- Highlight new servers

**Tuesday:**
- #tutorials post
- How-to guides

**Wednesday:**
- Office Hours reminder
- Community Q&A

**Thursday:**
- #developers discussion topic
- Technical deep dive

**Friday:**
- #feedback request
- Community poll

**Saturday:**
- #server-spotlight feature
- Use case showcase

**Sunday:**
- Week recap in #announcements
- Preview next week

## Server Boosts

**Benefits at Each Level:**

**Level 1 (2 boosts):**
- 128 kbps audio
- Custom server invite background
- Animated server icon

**Level 2 (7 boosts):**
- 256 kbps audio
- Server banner
- 50 emoji slots
- 1080p 60fps streams

**Level 3 (14 boosts):**
- 384 kbps audio
- Vanity URL: discord.gg/openconductor
- 100 emoji slots
- Custom stickers

**Encourage Boosts:**
- Give @Booster role with special color
- Access to #boosters-lounge
- Recognition in #announcements
- Special perks (early access, etc.)

## Moderation Guidelines

### Warning System

**Tier 1 - Warning**
- First offense
- Minor rule violation
- DM from moderator
- Log in mod channel

**Tier 2 - Timeout**
- Second offense or moderate violation
- Timeout: 1-24 hours
- Public notice in channel
- Log in mod channel

**Tier 3 - Kick**
- Third offense or serious violation
- Remove from server
- Can rejoin
- Log in mod channel

**Tier 4 - Ban**
- Repeated violations or severe offense
- Permanent removal
- Cannot rejoin without appeal
- Log in mod channel

### Common Issues

**Spam:**
- Auto-delete by bot
- Warning on repeat
- Timeout for excessive spam

**Off-topic:**
- Polite redirect to correct channel
- Warning if persistent

**Help Abuse:**
- First time: Gentle reminder of format
- Repeat: Warning
- Persistent: Timeout

**Promotion:**
- If relevant and helpful: Allowed
- If spam or off-topic: Delete + warning
- Repeat: Timeout

## Analytics & Metrics

### Track Weekly

- Total members
- New members
- Active members (sent message)
- Messages per channel
- Top contributors
- Support response time

### Tools

**MEE6 Dashboard:**
- Member stats
- Message stats
- Level distribution

**Discord Server Insights:**
- Member growth
- Engagement metrics
- Top channels

**Custom Tracking:**
- Support ticket resolution time
- Community contributions
- Event attendance

### Goals

**Month 1:**
- 100 members
- 10 active daily users
- 5 helpers
- <1 hour support response time

**Month 3:**
- 500 members
- 50 active daily users
- 20 helpers
- <30 min support response time

**Month 6:**
- 2,000 members
- 200 active daily users
- 50 helpers
- <15 min support response time

## Launch Checklist

### Pre-Launch (1 hour)

- [ ] Create server with proper name and icon
- [ ] Set up all channels and categories
- [ ] Configure channel descriptions
- [ ] Create all roles with permissions
- [ ] Set up Welcomer bot
- [ ] Add MEE6 for moderation
- [ ] Add Carl-bot for reaction roles
- [ ] Configure auto-mod rules
- [ ] Write welcome message
- [ ] Post rules in #rules
- [ ] Test permissions in each channel
- [ ] Invite 2-3 core team members
- [ ] Set vanity URL (if boosted)

### Launch Day

- [ ] Announce in Twitter: "Join our Discord!"
- [ ] Post in OpenConductor README
- [ ] Share in relevant communities
- [ ] Post in #announcements
- [ ] Pin important messages
- [ ] Monitor for issues
- [ ] Welcome new members personally (first 50)

### Week 1

- [ ] Host first Office Hours
- [ ] Post first #tutorial
- [ ] Feature first #server-spotlight
- [ ] Gather feedback
- [ ] Adjust channels if needed
- [ ] Add GitHub integration

### Month 1

- [ ] Review analytics
- [ ] Identify top contributors
- [ ] Give Helper roles
- [ ] Create first event
- [ ] Survey members for improvements
- [ ] Plan Ambassador program

## Useful Links

**Discord Resources:**
- [Discord Mod Academy](https://discord.com/moderation)
- [Community Guidelines](https://discord.com/guidelines)
- [Server Setup Guide](https://discord.com/guild-discovery)

**Bot Setup:**
- [MEE6](https://mee6.xyz/)
- [Dyno](https://dyno.gg/)
- [Carl-bot](https://carl.gg/)
- [Welcomer](https://welcomer.gg/)

**OpenConductor Links:**
- Website: https://openconductor.ai
- GitHub: https://github.com/epicmotionSD/openconductor
- Awesome MCP: https://github.com/epicmotionSD/awesome-mcp
- Docs: https://openconductor.ai/docs

## Templates & Quick Copy

### Announcement Template

```
📣 **[Title]**

[Description of announcement]

**What's New:**
• Feature 1
• Feature 2
• Feature 3

**Links:**
• [Link 1](url)
• [Link 2](url)

Questions? Ask in #help!
```

### Tutorial Template

```
📚 **Tutorial: [Title]**

**What you'll learn:**
• Point 1
• Point 2
• Point 3

**Prerequisites:**
• Requirement 1
• Requirement 2

**Steps:**

1. Step 1
   \`\`\`bash
   command here
   \`\`\`

2. Step 2
   \`\`\`bash
   command here
   \`\`\`

3. Step 3

**Resources:**
• [Link](url)

Questions? Ask below! 👇
```

### Support Response Template

```
👋 Thanks for reaching out!

To help you better, please provide:
1. Your OS (Windows/Mac/Linux)
2. Node.js version: `node --version`
3. OpenConductor version: `openconductor --version`
4. Full error message
5. What you've already tried

This helps us solve your issue faster! 🚀
```

---

**Ready to Launch!** 🎉

Use this guide to set up a thriving Discord community for OpenConductor.

Last Updated: 2025-01-26
