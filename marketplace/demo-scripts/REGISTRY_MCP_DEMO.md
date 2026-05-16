# Registry MCP Demo Video Script

**Duration**: 2:15
**Format**: Screen recording with voiceover
**Resolution**: 1920x1080 (1080p)

---

## Pre-Recording Setup

### Installation
```bash
# Ensure Registry MCP is installed
npm install -g @openconductor/mcp-registry

# Verify installation
npm list -g @openconductor/mcp-registry
```

### Claude Desktop Configuration
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "npx",
      "args": ["-y", "@openconductor/mcp-registry"]
    }
  }
}
```

### Screen Recording Settings
- **Tool**: OBS Studio, QuickTime, or ScreenFlow
- **Resolution**: 1920x1080
- **Frame Rate**: 30fps
- **Audio**: 44.1kHz, clear microphone
- **Cursor**: Visible, enlarged (1.5x)
- **Window**: Claude Desktop maximized

---

## SCENE 1: Introduction (0:00 - 0:15)

### Visual
- **Slate**: "OpenConductor Registry MCP"
- **Subtitle**: "The First Meta-MCP Server"
- **Fade in**: Clean desktop with Claude Desktop open

### Voiceover Script
> "What if Claude could help you discover other MCP servers? That's exactly what OpenConductor Registry does. Let me show you."

---

## SCENE 2: The Problem (0:15 - 0:30)

### Visual
- Show browser with multiple GitHub tabs open
- Switch between different MCP server repositories
- Show confusion/complexity

### Voiceover Script
> "Finding the right MCP server usually means hunting through GitHub, reading dozens of READMEs, and manually testing packages. There's a better way."

---

## SCENE 3: The Solution (0:30 - 0:45)

### Visual
- Switch to Claude Desktop
- Show clean, empty conversation
- Highlight MCP icon/indicator showing Registry is connected

### Voiceover Script
> "With Registry MCP installed, Claude has instant access to over 120 validated MCP servers. Just ask."

---

## SCENE 4: Demo - Discovery (0:45 - 1:05)

### Visual
**USER TYPES:**
```
Show me database-related MCP servers
```

**CLAUDE RESPONDS WITH:**
- Formatted list of database servers:
  - postgres (PostgreSQL database integration)
  - sqlite (SQLite database queries)
  - mongodb (MongoDB operations)
  - supabase (Supabase integration)
- Each with description and category

### Voiceover Script
> "Want database tools? Just ask. Registry searches its catalog and presents formatted results with descriptions."

---

## SCENE 5: Demo - Trending (1:05 - 1:20)

### Visual
**USER TYPES:**
```
What are the trending MCP servers right now?
```

**CLAUDE RESPONDS WITH:**
- Trending servers list:
  1. filesystem (File operations)
  2. fetch (Web scraping)
  3. github (GitHub integration)
  4. brave-search (Web search)
  5. postgres (Database)

### Voiceover Script
> "You can browse trending servers, see what the community is using most, and discover new tools."

---

## SCENE 6: Demo - Details (1:20 - 1:40)

### Visual
**USER TYPES:**
```
Get me the installation details for the github server
```

**CLAUDE RESPONDS WITH:**
- Full server details:
  - Name: github
  - Description: GitHub API integration
  - Category: Version Control
  - Installation command:
    ```
    npm install -g @modelcontextprotocol/server-github
    ```
  - Configuration example
  - Tools available: create_issue, search_repos, etc.

### Voiceover Script
> "Need installation instructions? Registry provides everything you need - the command, configuration, and available tools."

---

## SCENE 7: Value Proposition (1:40 - 2:00)

### Visual
- Split screen or quick cuts showing:
  - Left: Old way (browser tabs, GitHub)
  - Right: New way (Claude conversation)
- Emphasize the speed and simplicity

### Voiceover Script
> "No context switching. No manual hunting. Just conversational discovery of the entire MCP ecosystem."

---

## SCENE 8: Technical Highlights (2:00 - 2:15)

### Visual
- Show brief code snippet or architecture diagram:
  - TypeScript badge
  - "120+ servers" stat
  - "Zero config" badge
  - "MIT License" badge

### Voiceover Script
> "Built with TypeScript, zero configuration required, and completely open source. Install it in seconds."

---

## SCENE 9: Get Started (2:15 - 2:30)

### Visual
- Terminal showing:
```bash
npm install -g @openconductor/mcp-registry
```
- Configuration snippet
- End card with links:
  - npm: npmjs.com/package/@openconductor/mcp-registry
  - GitHub: github.com/epicmotionSD/openconductor
  - Twitter: @openconductor

### Voiceover Script
> "Install it now with npm, add it to your Claude config, and start discovering. Link in the description."

---

## Post-Production Checklist

### Editing
- [ ] Add intro slate (0:00-0:03)
- [ ] Add background music (subtle, non-intrusive)
- [ ] Add lower thirds for key features
- [ ] Highlight cursor during important clicks
- [ ] Zoom in on text when needed (20% zoom)
- [ ] Add smooth transitions between scenes
- [ ] Color grade for consistency

### Graphics to Overlay
- [ ] "120+ MCP Servers" badge at 0:45
- [ ] "Zero Configuration" badge at 2:00
- [ ] "MIT Licensed" badge at 2:00
- [ ] npm install command highlight at 2:15

### Audio
- [ ] Normalize audio levels
- [ ] Remove background noise
- [ ] Add subtle background music (royalty-free)
- [ ] Fade in/out music
- [ ] Check for pops/clicks

### Final Touches
- [ ] Add captions/subtitles (SRT file)
- [ ] Export in multiple formats:
  - 1080p MP4 (H.264) for YouTube
  - 1080p MOV (H.264) for Twitter
  - 720p MP4 for Instagram/LinkedIn
- [ ] Create thumbnail (1280x720):
  - "Registry MCP" title
  - "Discover 120+ Servers"
  - OpenConductor logo
  - High contrast colors

---

## Recording Tips

1. **Clean Environment**
   - Close unnecessary applications
   - Clear desktop clutter
   - Use light theme or dark theme consistently
   - Disable notifications

2. **Smooth Typing**
   - Type naturally, not too fast
   - Pause briefly before hitting enter
   - Allow responses to fully render

3. **Multiple Takes**
   - Record each scene 2-3 times
   - Pick the best take in editing
   - Keep raw footage organized by scene

4. **Voiceover**
   - Record in quiet room
   - Use pop filter
   - Stand/sit consistently
   - Read script naturally, not robotic
   - Record 2-3 takes per section

---

## Alternate Versions

### 60-Second Version (for Twitter/Instagram)
- 0:00-0:10: Problem + Solution
- 0:10-0:35: One discovery demo
- 0:35-0:50: Value prop
- 0:50-1:00: Install command + CTA

### 30-Second Version (for ads)
- 0:00-0:08: Hook "Discover MCP servers in Claude"
- 0:08-0:20: Single demo
- 0:20-0:30: Install + CTA

---

## Export Settings

### YouTube (Primary)
- Format: MP4
- Codec: H.264
- Resolution: 1920x1080
- Frame Rate: 30fps
- Bitrate: 8-10 Mbps
- Audio: AAC, 192kbps

### Twitter
- Format: MP4
- Max duration: 2:20
- Max size: 512MB
- Resolution: 1920x1080 or 1280x720
- Frame Rate: 30fps

### LinkedIn
- Format: MP4
- Max duration: 10 minutes
- Max size: 5GB
- Resolution: 1920x1080

---

## Royalty-Free Music Suggestions

1. **Upbeat Tech**
   - "Technology" by Corporate Music Zone
   - "Digital Network" by Alumo

2. **Subtle Background**
   - "Ambient Tech" by Coma-Media
   - "Inspiring Technology" by Scott Holmes

Sources:
- YouTube Audio Library
- Epidemic Sound
- Artlist
