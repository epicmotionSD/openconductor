# Demo Video Scripts for Anthropic MCP Challenge

**Target Length**: 2-3 minutes each
**Format**: Screen recording with voiceover
**Tone**: Professional, enthusiastic, clear

---

## 🎬 Video 1: OpenConductor Registry MCP (2:30)

### Opening (0:00 - 0:15)
**Visual**: Show Claude Desktop interface
**Voiceover**:
> "Finding the right MCP server for Claude shouldn't require browsing GitHub or searching documentation. What if Claude could discover MCP servers on its own? Let me show you the OpenConductor Registry MCP."

### Problem Statement (0:15 - 0:30)
**Visual**: Show traditional workflow (browser tabs, GitHub search)
**Voiceover**:
> "Right now, finding MCP servers means context-switching between Claude, GitHub, and npm. There are over 120 MCP servers available, but discovering them is fragmented and time-consuming."

### Solution Introduction (0:30 - 0:45)
**Visual**: Show installation command, then Claude Desktop with server active
**Voiceover**:
> "The OpenConductor Registry MCP solves this. It's the first meta-MCP server - an MCP server that helps you discover other MCP servers. Install it with one command, and Claude gains access to the entire MCP ecosystem."

### Demo 1: Discovery (0:45 - 1:05)
**Visual**: Type in Claude: "Show me MCP servers for working with databases"
**Screen shows**: Formatted list of database servers with descriptions
**Voiceover**:
> "Just ask Claude naturally. Here, I'm searching for database-related servers. Claude instantly shows me PostgreSQL, SQLite, and other database MCP servers with their features and install commands."

### Demo 2: Trending (1:05 - 1:20)
**Visual**: Type: "What are the most popular MCP servers?"
**Screen shows**: Trending list with GitHub stars and install counts
**Voiceover**:
> "You can see what's trending in the community. This shows the most popular servers based on GitHub stars and installation counts. It's like having a curated directory right in your conversation."

### Demo 3: Details (1:20 - 1:40)
**Visual**: Type: "Tell me about the openmemory server"
**Screen shows**: Detailed info with installation instructions
**Voiceover**:
> "Need more details? Just ask. Claude shows you everything - what the server does, how to install it, required environment variables, and links to documentation. No more hunting through READMEs."

### Value Proposition (1:40 - 2:00)
**Visual**: Show the workflow: ask → discover → install
**Voiceover**:
> "The Registry MCP creates a discovery flywheel. Users find servers faster, server creators get more visibility, and the entire MCP ecosystem grows stronger. It's the npm registry, but conversational and AI-powered."

### Technical Highlights (2:00 - 2:15)
**Visual**: Quick code snippets showing clean API
**Voiceover**:
> "Built with TypeScript, it connects to OpenConductor's live API with 120+ validated servers. Smart caching ensures fast responses, and it works with zero configuration."

### Closing (2:15 - 2:30)
**Visual**: Show npm install command and GitHub link
**Voiceover**:
> "The OpenConductor Registry MCP is live on npm today. Install it in seconds, and give Claude the power to explore the entire MCP ecosystem. Links in the description."

**Text overlay**: `npm install -g @openconductor/mcp-registry`

---

## 🏀 Video 2: SportIntel MCP (2:30)

### Opening (0:00 - 0:15)
**Visual**: Show someone switching between Claude and a sports app
**Voiceover**:
> "You're working in Claude when you want to check last night's game. You switch to ESPN, find the score, switch back to Claude, and lose your flow. There's a better way."

### Problem Statement (0:15 - 0:30)
**Visual**: Multiple app windows (ESPN, TheScore, etc.)
**Voiceover**:
> "Sports data lives in fragmented apps. Each requires context switching, manual searching, and copying scores back to your AI conversation. For the 70 billion dollar sports and fantasy industry, this friction is everywhere."

### Solution Introduction (0:30 - 0:45)
**Visual**: SportIntel installation and Claude Desktop
**Voiceover**:
> "SportIntel brings live sports data directly into Claude. NBA, NFL, MLB, NHL, MLS - all accessible through natural language, with AI-powered analysis included. It's the first MCP server for sports intelligence."

### Demo 1: Live Scores (0:45 - 1:05)
**Visual**: Type: "What are today's NBA scores?"
**Screen shows**: Live game scores with status, teams, records
**Voiceover**:
> "Just ask for scores naturally. SportIntel pulls live data from ESPN, formats it beautifully, and even shows betting lines when available. Live games show real-time status and quarter information."

### Demo 2: Standings (1:05 - 1:20)
**Visual**: Type: "Show me NBA standings"
**Screen shows**: Formatted standings by division
**Voiceover**:
> "Need standings? Claude shows you the entire league, organized by division, with wins, losses, win percentage, and games behind. It's like having a sports analyst in your conversation."

### Demo 3: AI Analysis (1:20 - 1:45)
**Visual**: Type: "Which NBA teams are playoff bound based on current standings?"
**Screen shows**: Claude analyzes the standings and provides insights
**Voiceover**:
> "Here's where it gets powerful. Claude doesn't just show data - it analyzes it. Ask about playoff races, winning streaks, or fantasy matchups, and get AI-powered insights. This is sports data plus artificial intelligence working together."

### Use Cases (1:45 - 2:00)
**Visual**: Quick montage of different queries
**Voiceover**:
> "Fantasy sports players get instant matchup analysis. Sports bettors see trend data. Casual fans check scores without app-switching. And analysts get AI-powered insights on demand."

### Technical Highlights (2:00 - 2:15)
**Visual**: Code showing caching and ESPN API integration
**Voiceover**:
> "Built on ESPN's public API with smart caching to handle rate limits. Updates every 2 minutes for live games, and supports basketball, football, baseball, hockey, and soccer."

### Closing (2:15 - 2:30)
**Visual**: Show npm install and feature roadmap
**Voiceover**:
> "SportIntel is live on npm today. Future versions will add player stats, injury reports, and fantasy projections. Start checking scores in Claude right now."

**Text overlay**: `npm install -g @openconductor/sportintel`

---

## 🎯 Video 3: Portfolio Demo - "Two Servers, One Vision" (2:00)

### Opening (0:00 - 0:15)
**Visual**: Split screen showing both servers
**Voiceover**:
> "I built two MCP servers for the Anthropic Challenge in just five hours. Not as a portfolio, but as a proof of concept: MCP works for everyone, from developers to sports fans."

### The Strategy (0:15 - 0:35)
**Visual**: Venn diagram showing different markets
**Voiceover**:
> "OpenConductor Registry targets developers - solving MCP discovery. SportIntel targets consumers - bringing sports data to AI conversations. Different markets, different problems, same technology. This shows MCP's versatility."

### Cross-Promotion Demo (0:35 - 0:55)
**Visual**: Use Registry to find SportIntel
**Voiceover**:
> "Here's the network effect. Use the Registry MCP to discover SportIntel. Claude shows you the sports server, explains what it does, and gives you the install command. Discovery becomes frictionless."

**Type**: "Find sports-related MCP servers"
**Shows**: SportIntel in results
**Type**: "Get details about sportintel"
**Shows**: Installation instructions and features

### Business Model (0:55 - 1:15)
**Visual**: Comparison chart showing both servers
**Voiceover**:
> "Registry MCP drives platform growth through network effects - every discovery strengthens OpenConductor. SportIntel has direct monetization - the sports and fantasy market is worth 70 billion dollars, and we're offering a freemium model with premium analytics."

### Technical Excellence (1:15 - 1:30)
**Visual**: Code examples from both projects
**Voiceover**:
> "Both servers are production-ready TypeScript with comprehensive docs, smart caching, and proper error handling. They demonstrate clean MCP patterns that other developers can learn from."

### Impact (1:30 - 1:50)
**Visual**: Usage scenarios montage
**Voiceover**:
> "The impact is measurable. Registry MCP accelerates ecosystem growth by making servers discoverable. SportIntel opens MCP to millions of sports fans who've never heard of Model Context Protocol. Together, they prove MCP's potential beyond developer tools."

### Closing (1:50 - 2:00)
**Visual**: GitHub repos, npm packages, OpenConductor website
**Voiceover**:
> "Both servers are live on npm today, fully open source, and ready to use. This is what's possible when you combine great technology with clear use cases. Links below."

**Text overlay**:
```
@openconductor/mcp-registry
@openconductor/sportintel
github.com/epicmotionSD/openconductor
```

---

## 📱 Social Media Snippets (30-60 seconds)

### Twitter/X Thread Opener (30 sec)
**Visual**: Quick cuts between both servers
**Voiceover**:
> "I just shipped 2 MCP servers for Claude. One helps you discover other servers. One brings live sports scores into AI conversations. Both are live on npm. Thread 👇"

### Instagram Reel (60 sec)
**Visual**: Fast-paced demo of coolest features
**Soundtrack**: Upbeat electronic
**Text overlays**:
- "I built this in 5 hours"
- "First: Discovery MCP"
- "Search 120+ servers in Claude"
- "Second: Sports MCP"
- "Live NBA scores in AI"
- "Both live on npm"
- "@openconductor/mcp-registry"
- "@openconductor/sportintel"

### LinkedIn (45 sec - Professional)
**Visual**: Clean, professional screen recording
**Voiceover**:
> "As a developer building in the Model Context Protocol space, I saw two opportunities: making MCP servers discoverable, and bringing MCP to consumer markets. Today, I'm sharing two servers that address both. Here's how they work."

[Show key features professionally]

> "Both are open source and available on npm. If you're building with MCP, check them out."

---

## 🎨 Visual Guidelines

### Branding
- **Colors**: OpenConductor brand colors
- **Font**: Clean, modern sans-serif
- **Logo**: OpenConductor logo in corner

### Screen Recording
- **Resolution**: 1920x1080 minimum
- **Frame Rate**: 30 fps minimum
- **Cursor**: Make cursor movements smooth and deliberate
- **Zoom**: Zoom in on important UI elements

### Text Overlays
- **Commands**: Use monospace font in boxes
- **Features**: Bold, large text
- **URLs**: Clear, readable size

### Music
- **Background**: Subtle, not distracting
- **Volume**: -20dB below voiceover
- **Style**: Upbeat tech/corporate

---

## 🎤 Recording Tips

### Voiceover
1. **Practice first**: Read script 3-5 times before recording
2. **Pace**: Speak clearly but naturally (not too fast)
3. **Enthusiasm**: Sound excited but professional
4. **Pauses**: Pause between sections for editing
5. **Room tone**: Record 10 seconds of silence for noise reduction

### Screen Recording
1. **Clean desktop**: Close unnecessary windows
2. **Disable notifications**: Turn off system notifications
3. **Practice run**: Do a full rehearsal before recording
4. **Multiple takes**: Record each section 2-3 times
5. **B-roll**: Capture extra footage of interesting UI elements

### Editing
1. **Cuts**: Cut out pauses, mistakes, slow moments
2. **Transitions**: Use simple fades between sections
3. **Highlights**: Add circles/arrows to highlight features
4. **Text timing**: Keep text on screen long enough to read twice
5. **Export**: H.264, 1080p, 30fps for YouTube/Twitter

---

## 📋 Pre-Recording Checklist

### Environment
- [ ] Quiet room with no background noise
- [ ] Good microphone (USB mic or headset)
- [ ] Screen recording software installed (OBS, ScreenFlow, etc.)
- [ ] Claude Desktop configured and tested
- [ ] Both MCP servers installed and working

### Preparation
- [ ] Script printed or on second monitor
- [ ] Demo queries written out
- [ ] Browser bookmarks for npm packages
- [ ] Code examples ready to show
- [ ] Desktop cleaned up

### Test Recording
- [ ] 10-second test to check audio levels
- [ ] Verify screen resolution and clarity
- [ ] Test cursor visibility
- [ ] Check color accuracy

---

## 🎯 Video Titles & Descriptions

### OpenConductor Registry MCP
**Title**: "I Built the First Meta-MCP Server for Claude - Discover 120+ Servers Instantly"

**Description**:
```
The OpenConductor Registry MCP is the first MCP server that helps you discover OTHER MCP servers, directly in Claude. No more hunting through GitHub or documentation.

🔗 Install: npm install -g @openconductor/mcp-registry
📦 npm: https://www.npmjs.com/package/@openconductor/mcp-registry
💻 GitHub: https://github.com/epicmotionSD/openconductor

Features:
✅ Search 120+ MCP servers by category or keyword
✅ See trending servers in the community
✅ Get instant installation instructions
✅ Browse ecosystem statistics
✅ Zero configuration required

Built for the Anthropic Model Context Protocol Challenge.

#ClaudeAI #MCP #OpenSource #AI #Developer Tools
```

### SportIntel MCP
**Title**: "Live Sports Scores in Claude - AI-Powered Sports Intelligence with MCP"

**Description**:
```
Check NBA, NFL, MLB, NHL, and MLS scores without leaving Claude. SportIntel brings live sports data and AI analysis into your conversations.

🔗 Install: npm install -g @openconductor/sportintel
📦 npm: https://www.npmjs.com/package/@openconductor/sportintel
💻 GitHub: https://github.com/epicmotionSD/openconductor

Features:
🏀 Live scores for all major sports
📊 League standings and team records
🔍 Search teams across leagues
🤖 AI-powered analysis and insights
⚡ Smart caching for fast responses

Perfect for fantasy sports, betting analysis, or just checking the score.

Built for the Anthropic Model Context Protocol Challenge.

#NBA #NFL #MLB #SportsTech #AI #ClaudeAI
```

### Portfolio Demo
**Title**: "I Built 2 MCP Servers in 5 Hours - Here's What They Do"

**Description**:
```
Two MCP servers, two different markets, one vision: showing what's possible with Model Context Protocol.

1️⃣ Registry MCP - Discover MCP servers in Claude
2️⃣ SportIntel - Live sports data + AI analysis

Both live on npm today.

🔗 @openconductor/mcp-registry
🔗 @openconductor/sportintel

Learn how I built both, the strategy behind them, and why MCP is going to change how we interact with AI.

Timestamps:
0:00 - Introduction
0:15 - The Strategy
0:35 - Cross-Promotion Demo
0:55 - Business Model
1:15 - Technical Details
1:30 - Impact
1:50 - Get Started

#MCP #AI #OpenSource #Anthropic #ClaudeAI #DeveloperTools #SportsTech
```

---

## 🎬 Post-Production

### Thumbnail Design
**Registry MCP**:
- Large text: "Discover MCP Servers"
- "in Claude" subtitle
- OpenConductor logo
- Screenshot of search results

**SportIntel**:
- Large text: "Live Sports in AI"
- NBA/NFL logos (if allowed)
- Live scores screenshot
- Excited face/reaction (optional)

**Portfolio**:
- Split screen of both servers
- "2 Servers, 5 Hours"
- Your branding
- "Live on npm"

---

Ready to record! Would you like me to help with anything else for the demos, such as:
1. Social media announcement drafts?
2. Product Hunt launch materials?
3. Anthropic challenge submission draft?
