# OpenConductor Demo Video Production Guide

Complete production package for creating professional demo videos for OpenConductor v1.2.0 and individual MCP servers.

---

## 🚀 NEW: v1.2.0 Launch Campaign

### START HERE for the v1.2.0 "30 Minutes → 10 Seconds" Campaign

**Priority 1**: [V1.2.0_RECORDING_QUICKSTART.md](./V1.2.0_RECORDING_QUICKSTART.md) - **Get recording in 30 minutes**

- Quick setup checklist
- Screen recording session guide
- Voiceover recording guide
- Immediate action plan

**Strategy**: [V1.2.0_DEMO_VIDEO_STRATEGY.md](./V1.2.0_DEMO_VIDEO_STRATEGY.md) - **Master campaign plan**

- Hero Launch Video (2:30) - Showcases the transformation
- 3 Stack Demo Videos (1:30-1:45 each)
- Comparison Video (1:00) - Old vs New
- Short-form content strategy (12 clips for social media)
- Distribution plan, success metrics

**Production**: [V1.2.0_PRODUCTION_SCRIPTS.md](./V1.2.0_PRODUCTION_SCRIPTS.md) - **Detailed shot-by-shot scripts**

- Complete Hero Video production script (20 shots with exact timing)
- Voiceover scripts (word-for-word)
- Technical specifications
- Visual examples

---

## 📁 What's Included

This package contains everything you need to create professional demo videos:

### V1.2.0 Launch Campaign (New - Priority)

1. **[V1.2.0_RECORDING_QUICKSTART.md](./V1.2.0_RECORDING_QUICKSTART.md)** - Get recording in 30 minutes
2. **[V1.2.0_DEMO_VIDEO_STRATEGY.md](./V1.2.0_DEMO_VIDEO_STRATEGY.md)** - Complete campaign strategy
3. **[V1.2.0_PRODUCTION_SCRIPTS.md](./V1.2.0_PRODUCTION_SCRIPTS.md)** - Detailed shot-by-shot scripts

### Legacy MCP Server Demos

4. **[REGISTRY_MCP_DEMO.md](./REGISTRY_MCP_DEMO.md)** - Complete script for Registry MCP video
5. **[SPORTINTEL_MCP_DEMO.md](./SPORTINTEL_MCP_DEMO.md)** - Complete script for SportIntel MCP video

### Universal Production Guides

6. **[RECORDING_SETUP_GUIDE.md](./RECORDING_SETUP_GUIDE.md)** - Equipment, software, and setup instructions
7. **[DEMO_CONVERSATIONS.md](./DEMO_CONVERSATIONS.md)** - Exact queries and expected responses for recording
8. **[VIDEO_EDITING_CHECKLIST.md](./VIDEO_EDITING_CHECKLIST.md)** - Post-production checklist with timestamps

---

## 🚀 Quick Start

### 1. Pre-Production (Day 1)

**Setup:**
```bash
# Install both packages globally
npm install -g @openconductor/mcp-registry @openconductor/sportintel

# Verify installations
npm list -g @openconductor/mcp-registry
npm list -g @openconductor/sportintel
```

**Configure Claude Desktop:**
- Read: [RECORDING_SETUP_GUIDE.md#pre-recording-checklist](./RECORDING_SETUP_GUIDE.md#pre-recording-checklist)
- Add both servers to Claude config
- Restart Claude Desktop
- Test both servers with sample queries

**Download Software:**
- Screen recording: OBS Studio (free) or QuickTime (macOS)
- Video editing: DaVinci Resolve (free) or iMovie (macOS)
- Audio editing: Audacity (free)

**Review Scripts:**
- Read through both demo scripts
- Practice voiceover (record dry runs)
- Familiarize yourself with scene flow

---

### 2. Recording (Day 2)

**Morning: Registry MCP**
1. Open [REGISTRY_MCP_DEMO.md](./REGISTRY_MCP_DEMO.md)
2. Open [DEMO_CONVERSATIONS.md](./DEMO_CONVERSATIONS.md) for exact queries
3. Record each scene 2-3 times
4. Follow the timing guide (9 scenes, ~2:30 total)

**Afternoon: SportIntel MCP**
1. Open [SPORTINTEL_MCP_DEMO.md](./SPORTINTEL_MCP_DEMO.md)
2. Check if NBA/NFL games are happening (best for live demo)
3. Record each scene 2-3 times
4. Capture backup footage in case of API issues

**Voiceover Recording:**
- Use [RECORDING_SETUP_GUIDE.md#audio-recording-setup](./RECORDING_SETUP_GUIDE.md#audio-recording-setup)
- Record in quiet room
- Read script naturally, not robotic
- Record 2-3 takes per section

---

### 3. Post-Production (Day 3-4)

**Day 3: Assembly & Graphics**
1. Open [VIDEO_EDITING_CHECKLIST.md](./VIDEO_EDITING_CHECKLIST.md)
2. Import all footage into editor
3. Select best takes for each scene
4. Assemble timeline following timestamp guide
5. Add graphics (intro, outro, lower thirds)

**Day 4: Polish & Export**
1. Audio enhancement (normalize, de-noise)
2. Color grading
3. Add background music
4. Create captions/subtitles
5. Export for multiple platforms

---

## 📋 Recommended Workflow

### Timeline
- **Day 1**: Setup & Testing (2-3 hours)
- **Day 2**: Recording (4-6 hours)
- **Day 3**: Editing Assembly (6-8 hours)
- **Day 4**: Final Polish & Export (4-6 hours)

**Total**: 16-23 hours for both videos

---

## 🎯 Video Specifications

### Primary Version (YouTube)
- **Duration**: 2:15-2:30 each
- **Resolution**: 1920x1080 (1080p)
- **Format**: MP4 (H.264)
- **Frame Rate**: 30fps

### Platform Variations
- Twitter: 720p, max 2:20, max 512MB
- LinkedIn: 1080p or 1080x1080 square
- Instagram Feed: 1080x1080 square, max 60s
- Instagram Stories/TikTok: 1080x1920 vertical, 15-60s

See [VIDEO_EDITING_CHECKLIST.md#platform-specific-edits](./VIDEO_EDITING_CHECKLIST.md#platform-specific-edits) for details.

---

## 📝 Script Overview

### Registry MCP Video (2:15)

**Key Scenes:**
1. Introduction (0:00-0:15)
2. The Problem: Manual GitHub hunting (0:15-0:30)
3. The Solution: Registry MCP (0:30-0:45)
4. **Demo 1**: Discover database servers (0:45-1:05)
5. **Demo 2**: Trending servers (1:05-1:20)
6. **Demo 3**: Installation details (1:20-1:40)
7. Value Proposition (1:40-2:00)
8. Technical Highlights (2:00-2:15)
9. Call to Action (2:15-2:30)

**Key Messages:**
- First "meta" MCP server
- 120+ servers cataloged
- Zero configuration
- Conversational discovery

---

### SportIntel MCP Video (2:15)

**Key Scenes:**
1. Introduction (0:00-0:15)
2. The Problem: Context switching (0:15-0:30)
3. The Solution: Live sports in Claude (0:30-0:45)
4. **Demo 1**: Live NBA scores (0:45-1:05)
5. **Demo 2**: League standings (1:05-1:20)
6. **Demo 3**: AI-powered analysis (1:20-1:45)
7. **Demo 4**: Multi-sport support (1:45-2:00)
8. Use Cases (2:00-2:15)
9. Call to Action (2:15-2:30)

**Key Messages:**
- 5 sports leagues (NBA, NFL, MLB, NHL, MLS)
- Real-time data
- AI analysis built-in
- Perfect for fantasy sports

---

## 🛠️ Equipment Needed

### Minimum Setup (Free)
- Computer with Claude Desktop installed
- Built-in microphone
- Free screen recording software (OBS/QuickTime)
- Free video editor (DaVinci Resolve/iMovie)
- Quiet recording space

### Recommended Setup ($50-150)
- Everything in minimum
- USB microphone (Blue Snowball ~$50)
- Pop filter (~$10)
- Headphones (~$30)
- Good lighting (if adding talking head)

### Professional Setup ($400+)
- Everything in recommended
- Professional mic (Shure SM7B ~$400)
- Audio interface (~$100)
- Paid editing software (Premiere/Final Cut)
- ScreenFlow or similar all-in-one tool

---

## 📚 File Structure

After production, organize files like this:

```
openconductor-demos/
├── registry-mcp/
│   ├── 01-raw-footage/
│   │   ├── scene-01-intro-take-01.mp4
│   │   ├── scene-01-intro-take-02.mp4
│   │   ├── scene-02-problem-take-01.mp4
│   │   └── ...
│   ├── 02-audio/
│   │   ├── voiceover-raw.wav
│   │   ├── voiceover-final.wav
│   │   └── background-music.mp3
│   ├── 03-graphics/
│   │   ├── intro-slate.png
│   │   ├── end-card.png
│   │   ├── lower-thirds/
│   │   └── logos/
│   ├── 04-exports/
│   │   ├── registry-mcp-youtube-1080p.mp4
│   │   ├── registry-mcp-twitter-720p.mp4
│   │   ├── registry-mcp-instagram-square.mp4
│   │   └── registry-mcp-captions.srt
│   └── project-files/
│       └── registry-mcp.dproj (or .fcpx, etc.)
│
├── sportintel-mcp/
│   └── [same structure as registry-mcp]
│
└── assets/
    ├── openconductor-logo.png
    ├── sportintel-logo.png
    └── royalty-free-music/
```

---

## ✅ Pre-Recording Checklist

Before hitting record:

### Environment
- [ ] Close all unnecessary applications
- [ ] Disable notifications (macOS: Option+Click notification icon)
- [ ] Hide desktop icons
- [ ] Clear Claude conversation history
- [ ] Clean browser bookmarks bar (if showing browser)
- [ ] Check available disk space (need ~5GB per hour)

### Software
- [ ] Claude Desktop configured with both MCP servers
- [ ] MCP servers responding to test queries
- [ ] Screen recording software tested (30-second test)
- [ ] Microphone levels checked (peaks at -12dB to -6dB)
- [ ] Recording path confirmed (know where files save)

### Script
- [ ] Read through full script
- [ ] Printed or on second monitor
- [ ] Voiceover practiced
- [ ] Demo queries copied to clipboard or text file

---

## 🎬 Recording Tips

### For Best Results:

**Visual:**
- Clean desktop, maximized Claude window
- Dark theme looks more professional on screen
- Cursor enlarged 1.5x for visibility
- Type at natural speed (not too fast)
- Wait 2-3 seconds after responses complete

**Audio:**
- Record in morning (quieter, fresh voice)
- Stand while recording (better breath control)
- Smile while speaking (you can hear it!)
- Pause between takes (for editing flexibility)
- Re-record if you stumble (don't try to save it)

**Workflow:**
- Record each scene 2-3 times
- First take is usually stiff, second is natural
- Review after each scene (catch issues early)
- Take breaks every 15 minutes
- Save frequently!

---

## 🎨 Design Assets Needed

### Graphics to Create:

**Both Videos:**
- [ ] Intro slate (1920x1080)
  - OpenConductor branding
  - Package name
  - Tagline
- [ ] End card (1920x1080)
  - Install command
  - Links (npm, GitHub, Twitter)
  - QR codes (optional)
  - "Subscribe" CTA
- [ ] Lower thirds
  - Package name badge
  - Feature callouts

**Thumbnails (1280x720):**
- [ ] Registry MCP: "Discover 120+ MCP Servers"
- [ ] SportIntel MCP: "Live Sports in Claude"

**Tools:**
- Canva (free, easy templates)
- Figma (free, professional)
- Adobe Photoshop (paid, advanced)

---

## 🎵 Music Recommendations

### Royalty-Free Sources:
1. **YouTube Audio Library** (free)
   - Search: "technology background music"
   - Filter: No copyright claims

2. **Epidemic Sound** (paid subscription)
   - High quality
   - Safe for all platforms

3. **Artlist** (paid subscription)
   - Professional quality
   - Unlimited downloads

### Suggested Tracks:
- Registry: "Technology" by Corporate Music Zone
- SportIntel: "Stadium Rave" by Influx

See individual demo scripts for more suggestions.

---

## 📤 Export Checklist

Before publishing:

- [ ] **YouTube Version:**
  - 1080p MP4, 2:15-2:30 duration
  - Captions embedded or SRT file
  - Thumbnail created (1280x720)
  - Description written with timestamps
  - Chapter markers added

- [ ] **Twitter Version:**
  - 720p MP4, under 2:20, under 512MB
  - Captions burned in (autoplay muted)
  - First 3 seconds grab attention

- [ ] **LinkedIn Version:**
  - 1080p MP4, professional tone
  - Captions included

- [ ] **Instagram Versions:**
  - Square (1080x1080) for feed
  - Vertical (1080x1920) for Stories
  - Under 60 seconds each
  - Large, mobile-friendly text

---

## 📊 Success Metrics

After publishing, track:

**Engagement:**
- Views (YouTube, Twitter, LinkedIn)
- Likes, comments, shares
- Click-through rate to npm packages
- Completion rate (did they watch to end?)

**Conversions:**
- npm package downloads
- GitHub stars
- Claude Desktop installations
- Questions/support requests

**Feedback:**
- Comments and questions
- Suggestions for improvements
- Bug reports
- Feature requests

---

## 🆘 Troubleshooting

### Common Issues:

**"Claude can't find my MCP server"**
→ See [RECORDING_SETUP_GUIDE.md#troubleshooting](./RECORDING_SETUP_GUIDE.md#troubleshooting)

**"Recording is choppy/laggy"**
→ Close background apps, lower recording quality, check CPU usage

**"Audio has background noise"**
→ Use Audacity noise reduction, record in quieter room, use better mic

**"No live NBA games to demo"**
→ Use yesterday's scores or current standings (both work great)

**"Video file too large for Twitter"**
→ Reduce resolution to 720p, lower bitrate to 6000 Kbps, shorten to under 2:15

---

## 📞 Support & Resources

### Documentation:
- [Anthropic MCP Docs](https://modelcontextprotocol.io/)
- [OpenConductor Registry](https://www.npmjs.com/package/@openconductor/mcp-registry)
- [SportIntel MCP](https://www.npmjs.com/package/@openconductor/sportintel)

### Video Production Help:
- [DaVinci Resolve Tutorials](https://www.youtube.com/blackmagicdesign)
- [OBS Studio Guide](https://obsproject.com/wiki/)
- [Audacity Manual](https://manual.audacityteam.org/)

---

## 📝 Notes

### Platform-Specific Tips:

**YouTube:**
- First 48 hours are critical for algorithm
- Thumbnails significantly impact CTR
- Engage with early comments
- Pin comment with install instructions

**Twitter:**
- Tweet during peak hours (9am-12pm ET)
- Thread the video with follow-ups
- Tag @AnthropicAI and relevant accounts
- Use trending hashtags (#MCP, #ClaudeAI)

**LinkedIn:**
- Professional tone emphasized
- Tag Anthropic, OpenConductor
- Post Tuesday-Thursday for best reach
- Engage with comments professionally

**Reddit:**
- Post to r/ClaudeAI, r/LocalLLaMA
- SportIntel to r/NBA, r/fantasybball
- Follow subreddit rules
- Engage authentically, not promotional

---

## 🚀 Launch Plan

### Day 1: YouTube + Twitter
- Upload to YouTube (unlisted for testing)
- Get feedback from 2-3 trusted people
- Make final tweaks
- Publish public
- Tweet announcement with video link
- Post to MCP Discord

### Day 2: LinkedIn + Reddit
- Post professional version to LinkedIn
- Post to r/ClaudeAI with context
- Engage with comments from Day 1

### Day 3: Instagram + Specialized Communities
- Post square/vertical versions to Instagram
- Post SportIntel to r/NBA, fantasy sports forums
- Share in OpenConductor Discord

### Week 2: Analysis & Iteration
- Review metrics
- Collect feedback
- Plan improvements for future videos
- Prepare Anthropic challenge submission

---

## 🎓 Learning Resources

### Video Production:
- **Premiere Gal** (YouTube) - Premiere Pro tutorials
- **Casey Faris** (YouTube) - DaVinci Resolve
- **Video Copilot** - After Effects for motion graphics

### Audio:
- **Booth Junkie** (YouTube) - Voiceover techniques
- **Curtis Judd** (YouTube) - Audio recording

### Design:
- **Canva Design School** - Thumbnail creation
- **Yes I'm a Designer** - Quick tips

---

## ✨ Final Thoughts

**Remember:**
- Perfection is the enemy of done
- Your first video won't be perfect (that's okay!)
- Authenticity > production value
- Focus on clear communication
- Show, don't just tell
- Have fun with it!

**The goal:**
- Demonstrate the value of your MCP servers
- Make it easy for others to understand and use them
- Generate interest in the OpenConductor project
- Win the Anthropic MCP Challenge! 🏆

---

## 📬 Feedback

Found issues with this guide? Have suggestions?
- Open an issue on GitHub
- Contact: hello@openconductor.ai
- Twitter: @openconductor

---

**Good luck with your demo videos! 🎬🚀**

Let's make the OpenConductor ecosystem accessible to everyone!
