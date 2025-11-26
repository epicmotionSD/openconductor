# SportIntel MCP Demo Video Script

**Duration**: 2:15
**Format**: Screen recording with voiceover
**Resolution**: 1920x1080 (1080p)

---

## Pre-Recording Setup

### Installation
```bash
# Install SportIntel MCP
npm install -g @openconductor/sportintel

# Verify installation
npm list -g @openconductor/sportintel
```

### Claude Desktop Configuration
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "sportintel": {
      "command": "npx",
      "args": ["-y", "@openconductor/sportintel"]
    }
  }
}
```

### Timing Considerations
- **Best time to record**: During active game days (evening/weekend)
- **Backup plan**: Use recent game data if no live games
- **Leagues to show**: NBA (primary), NFL (if in season)

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
- **Slate**: "SportIntel MCP"
- **Subtitle**: "Live Sports Data in Claude"
- **Fade in**: Claude Desktop with clean conversation

### Voiceover Script
> "Want live sports scores and AI-powered analysis without leaving Claude? SportIntel makes it happen. Let me show you."

---

## SCENE 2: The Problem (0:15 - 0:30)

### Visual
- Show typical workflow:
  - Claude Desktop open
  - Switch to ESPN.com
  - Check scores
  - Switch back to Claude
  - Context lost
- Show frustration of context switching

### Voiceover Script
> "Checking scores usually means leaving your workflow, opening a browser, hunting through ESPN, then losing your train of thought. Not anymore."

---

## SCENE 3: The Solution (0:30 - 0:45)

### Visual
- Back to Claude Desktop
- Show MCP indicator with SportIntel connected
- Clean, ready interface

### Voiceover Script
> "SportIntel brings live data from NBA, NFL, MLB, NHL, and MLS directly into your Claude conversations."

---

## SCENE 4: Demo - Live Scores (0:45 - 1:05)

### Visual
**USER TYPES:**
```
What are today's NBA scores?
```

**CLAUDE RESPONDS WITH:**
```
🏀 NBA Scores - [Today's Date]

FINAL:
Lakers 118, Celtics 112
- Lakers: LeBron 28pts, AD 22pts
- Celtics: Tatum 31pts, Brown 19pts

IN PROGRESS (Q3, 5:42):
Warriors 87, Suns 82
- Warriors leading by 5
- Curry 24pts, Thompson 18pts

UPCOMING:
Bucks vs. Heat - 8:00 PM ET
Nuggets vs. Clippers - 10:30 PM ET
```

### Voiceover Script
> "Ask for today's scores and get real-time results - completed games, live scores, and upcoming matchups, all formatted perfectly."

---

## SCENE 5: Demo - Standings (1:05 - 1:20)

### Visual
**USER TYPES:**
```
Show me the NBA Eastern Conference standings
```

**CLAUDE RESPONDS WITH:**
```
🏀 NBA Eastern Conference Standings

ATLANTIC:
1. Celtics (45-12, .789)
2. 76ers (38-19, .667)
3. Nets (32-25, .561)
4. Raptors (28-29, .491)
5. Knicks (26-31, .456)

CENTRAL:
1. Bucks (43-14, .754)
2. Cavaliers (35-22, .614)
3. Bulls (27-30, .474)
...

Updated: [Timestamp]
```

### Voiceover Script
> "Need standings? Ask for them. Full division breakdowns with records and win percentages, updated in real-time."

---

## SCENE 6: Demo - AI Analysis (1:20 - 1:45)

### Visual
**USER TYPES:**
```
Based on tonight's scores, which teams are trending for playoffs?
```

**CLAUDE RESPONDS WITH AI ANALYSIS:**
```
Based on tonight's results, here's the playoff picture:

🔥 Hot Teams:
- Lakers: 3-game win streak, LeBron averaging 27ppg in this stretch
- Warriors: Won 7 of last 10, strong road performance
- Celtics: Despite the loss, still #1 seed with 5-game cushion

⚠️ Concerns:
- Suns: 2nd straight loss, dropped to 6th seed
- Heat: Lost 4 of last 5, injury concerns

The Lakers-Celtics game was significant - if playoffs started today, this could be an NBA Finals preview. Lakers showing championship form at the right time.
```

### Voiceover Script
> "But here's where it gets powerful. Claude can analyze the data, identify trends, and give you insights you'd normally spend hours researching."

---

## SCENE 7: Demo - Multi-Sport (1:45 - 2:00)

### Visual
**USER TYPES:**
```
What are today's NFL and MLB scores?
```

**CLAUDE RESPONDS WITH:**
```
🏈 NFL Scores - Week 12
FINAL:
Chiefs 27, Raiders 20
49ers 31, Seahawks 17

⚾ MLB Scores - [Date]
FINAL:
Yankees 5, Red Sox 3
Dodgers 4, Giants 2

IN PROGRESS (7th inning):
Astros 3, Rangers 2
```

### Voiceover Script
> "It's not just NBA. Get NFL, MLB, NHL, and MLS scores all in one place. Perfect for fantasy sports or just staying updated."

---

## SCENE 8: Use Cases (2:00 - 2:15)

### Visual
- Quick montage showing different use cases:
  - **Fantasy Sports**: "Should I start Curry or Harden tonight?"
  - **Betting Analysis**: "Show me team stats for tonight's games"
  - **Quick Checks**: "Did the Lakers win?"
  - **Deep Analysis**: "Compare Eastern vs Western conference strength"

### Voiceover Script
> "Whether you're managing fantasy teams, researching bets, or just checking last night's game, SportIntel keeps you in the flow."

---

## SCENE 9: Get Started (2:15 - 2:30)

### Visual
- Terminal showing:
```bash
npm install -g @openconductor/sportintel
```
- Configuration snippet
- End card with links:
  - npm: npmjs.com/package/@openconductor/sportintel
  - GitHub: github.com/epicmotionSD/openconductor
  - Twitter: @openconductor
- Disclaimer: "For entertainment and educational purposes only"

### Voiceover Script
> "Install SportIntel now with npm, add it to Claude, and never miss another game. Link in the description."

---

## Post-Production Checklist

### Editing
- [ ] Add intro slate (0:00-0:03)
- [ ] Add background music (energetic sports theme)
- [ ] Add lower thirds for each sport
- [ ] Highlight scores as they appear
- [ ] Zoom in on key statistics (20% zoom)
- [ ] Add smooth transitions
- [ ] Color grade for vibrancy

### Graphics to Overlay
- [ ] Sport emoji badges (🏀 🏈 ⚾ 🏒 ⚽) at 0:45
- [ ] "5 Sports Leagues" badge at 1:45
- [ ] "Real-time Data" badge at 0:45
- [ ] "AI Analysis" badge at 1:20
- [ ] Team logos (if permitted)

### Audio
- [ ] Normalize audio levels
- [ ] Remove background noise
- [ ] Add energetic background music
- [ ] Add subtle "whoosh" transitions
- [ ] Fade in/out music
- [ ] Check for pops/clicks

### Final Touches
- [ ] Add captions/subtitles (SRT file)
- [ ] Add disclaimer about entertainment/educational use
- [ ] Export in multiple formats:
  - 1080p MP4 (H.264) for YouTube
  - 1080p MOV (H.264) for Twitter
  - 720p MP4 for Instagram/LinkedIn
  - 9:16 vertical version for Instagram Stories/TikTok
- [ ] Create thumbnail (1280x720):
  - "SportIntel MCP" title
  - "Live Sports + AI"
  - Basketball/Football imagery
  - High contrast, vibrant colors

---

## Recording Tips

1. **Clean Environment**
   - Close unnecessary applications
   - Clear desktop clutter
   - Use theme that makes scores pop (dark theme recommended)
   - Disable notifications
   - Check for live games before recording

2. **Smooth Typing**
   - Type naturally, not too fast
   - Pause briefly before hitting enter
   - Allow responses to fully render
   - Wait for scores to populate

3. **Multiple Takes**
   - Record each scene 2-3 times
   - Have backup queries ready
   - Keep raw footage organized by scene
   - Record during active game times if possible

4. **Voiceover**
   - Use energetic, sports announcer tone (but not over the top)
   - Record in quiet room
   - Use pop filter
   - Emphasize key numbers/stats
   - Record 2-3 takes per section

---

## Alternate Versions

### 60-Second Version (for Twitter/Instagram)
- 0:00-0:10: Hook "Live sports in Claude"
- 0:10-0:35: Live scores demo
- 0:35-0:50: AI analysis tease
- 0:50-1:00: Install command + CTA

### 30-Second Version (for TikTok/Reels)
- 0:00-0:08: Hook "Stop switching apps for scores"
- 0:08-0:22: One score check demo
- 0:22-0:30: Install + CTA

### Sport-Specific Versions (for r/NBA, r/NFL, etc.)
- Focus on just that sport
- 45-60 seconds
- Deep dive on one feature
- Sport-specific use cases

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

### Instagram/TikTok (Vertical)
- Format: MP4
- Resolution: 1080x1920 (9:16)
- Frame Rate: 30fps
- Max duration: 60s (Instagram), 10min (TikTok)

---

## Royalty-Free Music Suggestions

1. **Energetic Sports**
   - "Stadium Rave" by Influx
   - "Sports Energy" by Music Unlimited
   - "Game Day" by Kevin MacLeod

2. **Upbeat Tech-Sports Fusion**
   - "Digital Sports" by Corporate Music Zone
   - "Tech Game" by Alumo

Sources:
- YouTube Audio Library (Filter: Sports, Energetic)
- Epidemic Sound (Sports category)
- Artlist (Game Day playlist)

---

## Legal Disclaimer

### Include in Video Description
```
Disclaimer: SportIntel provides sports data for entertainment and educational purposes only.
Data sourced from ESPN public APIs. Not affiliated with NBA, NFL, MLB, NHL, or MLS.
Team names and logos are property of their respective leagues and organizations.
```

### Include in End Card (Small Text)
```
For entertainment and educational purposes only
Data provided by ESPN public APIs
```

---

## Backup Plan (No Live Games)

If recording when no games are live:

**SCENE 4 Alternative:**
```
What were last night's NBA scores?
```
Then show completed games with final stats.

**SCENE 5 Alternative:**
Keep standings demo (always available)

**SCENE 6 Alternative:**
```
Based on the current standings, who are the top playoff contenders?
```

---

## Sport-Specific Demo Ideas

### For r/NBA Post
- Focus entirely on NBA
- Show player stats lookup
- Demonstrate season-long standings
- Include playoff probability discussion

### For Fantasy Sports Communities
- Show multiple game scores quickly
- Demonstrate player performance lookup
- Show how to compare matchups
- Include "should I start X or Y" analysis

### For Betting/Analysis Forums
- Show historical trends
- Demonstrate home/away splits
- Include injury report integration (if available)
- Show conference strength comparison

---

## Call to Action Variations

### For General Audience
> "Install SportIntel and never miss another game"

### For Developers
> "Check out the source code and contribute on GitHub"

### For Sports Fans
> "Get instant scores without leaving your workflow"

### For Fantasy Players
> "Make better lineup decisions with AI analysis"
