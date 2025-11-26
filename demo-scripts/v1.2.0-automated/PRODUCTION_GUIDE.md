# 🎬 Hero Video Production Guide
## OpenConductor v1.2.0 - Quick Start

**Duration**: 2:30
**Status**: Ready for Production
**Assets**: All generated and ready

---

## ✅ What You Have

### 1. Complete Narration Script
**File**: `scripts/hero-video-narration.txt`
**Status**: ✅ Ready for voiceover
**Scenes**: 7 (with exact timing)

### 2. Professional Slides
**Files**: `slides/*.html`
**Status**: ✅ Ready to screenshot/record
**Count**: 7 slides

### 3. Terminal Recordings
**Files**: `terminal-recordings/*.txt`
**Status**: ✅ Mock outputs created
**Scenes**: Stack list, install, show

### 4. Timing Data
**File**: `scripts/hero-video-timing.json`
**Status**: ✅ Precise scene timing
**Use**: Reference while editing

---

## 🚀 Quick Production Workflow (3-4 hours)

### Step 1: Voiceover (30 min)

#### Option A: ElevenLabs (Recommended)
1. Go to https://elevenlabs.io
2. Sign up (free tier available)
3. Create new project
4. Copy-paste from `scripts/hero-video-narration.txt`
5. Select voice:
   - **Josh**: Deep, professional (recommended)
   - **Adam**: Friendly, energetic
   - **Antoni**: Warm, conversational
6. Generate audio
7. Download as `hero-video-voiceover.mp3`

#### Option B: Free TTS Alternatives
- **Google Cloud TTS**: 1 million characters free/month
- **Amazon Polly**: Free tier available
- **Natural Reader**: Free web-based
- **Balabolka**: Free desktop app (Windows)

#### Option C: Record Yourself
```bash
# Use Audacity (free)
# - Read the narration script
# - Export as MP3
# - Aim for calm, professional tone
```

**Cost**: $0-5
**Time**: 30 minutes

---

### Step 2: Capture Slides (15 min)

```bash
cd slides/

# Open each HTML file in browser
# For each slide:
#   1. Open in fullscreen (F11)
#   2. Let animation play (3-5 seconds)
#   3. Screenshot OR record 5 seconds
```

**Files to Capture**:
1. `intro-slide.html` - Title screen
2. `problem-slide.html` - Old way pain points
3. `solution-slide.html` - Stacks introduction
4. `coderStack-slide.html` - Coder Stack features
5. `cta-slide.html` - Call to action

**Tool**: Built-in screenshot tool, OBS, or QuickTime

**Save as**: `intro-slide.png`, `problem-slide.png`, etc.

---

### Step 3: Terminal Screen Captures (20 min)

#### Option A: Type Out Terminal Recordings
```bash
# Use terminal-recordings/*.txt as reference
# Type each command in your terminal
# Record screen while typing

# Files to demo:
cat terminal-recordings/01-stack-list.txt
cat terminal-recordings/02-stack-install-coder.txt
cat terminal-recordings/03-stack-show-coder.txt
```

#### Option B: Create Video from Text
```bash
# Use asciinema or termtosvg (if available)
# Or simply screenshot the text files
# Add typing animation in video editor
```

**Time per scene**: 5-10 seconds
**Total**: 3 scenes x 7 seconds = ~20 seconds of footage

---

### Step 4: Video Editing (2-3 hours)

#### Software Options:
- **DaVinci Resolve** (FREE, professional)
- **OpenShot** (FREE, simple)
- **iMovie** (FREE, Mac only)
- **Premiere Pro** (Paid)
- **Final Cut Pro** (Paid)

#### Import Assets:
1. Audio: `hero-video-voiceover.mp3`
2. Images: All slide screenshots
3. Video: Terminal recordings

#### Editing Timeline:

```
Timeline (2:30 total):

0:00-0:10 (10s) - HOOK
  - Slide: intro-slide.png
  - Narration: "What if you could transform..."
  - Effect: Fade in from black

0:10-0:30 (20s) - PROBLEM
  - Slide: problem-slide.png
  - Narration: "Setting up MCP servers..."
  - Optional: Show config file errors

0:30-0:50 (20s) - SOLUTION
  - Slide: solution-slide.png
  - Narration: "Version 1.2.0 introduces Stacks..."
  - Show: terminal-recordings/01-stack-list.txt

0:50-1:10 (20s) - DEMO INSTALL
  - Video: Terminal - stack install command
  - Narration: "Watch this. One command..."
  - Show: terminal-recordings/02-stack-install-coder.txt

1:10-1:50 (40s) - DEMO USAGE
  - Slide: coderStack-slide.png (or mock Claude usage)
  - Narration: "Paste the prompt into Claude..."
  - Text overlays: "✓ Reading files", "✓ Querying database"

1:50-2:10 (20s) - MORE STACKS
  - Quick cuts: writer/essential slides
  - Narration: "The Writer Stack transforms..."

2:10-2:30 (20s) - CTA
  - Slide: cta-slide.html
  - Narration: "Ready to transform..."
  - Text overlays: URLs and commands
```

#### Editing Tips:
1. **Sync audio first** - Drop voiceover on timeline
2. **Add slides** - Match to narration timing
3. **Transitions** - Simple cuts or quick fades (0.5s)
4. **Text overlays** - Use on-screen text from script
5. **Music** (optional) - Background music at 20-30% volume
6. **Color correction** - Consistent look across all scenes

---

### Step 5: Export & Publish (15 min)

#### Export Settings:
```
Format: MP4 (H.264)
Resolution: 1920x1080
Frame Rate: 30 fps
Bitrate: 10 Mbps
Audio: AAC 320 kbps
```

#### Publish To:
- **YouTube**: Upload, add chapters, optimize SEO
- **Twitter**: Extract 30s clip with hook
- **LinkedIn**: 60s clip with professional intro
- **Website**: Embed on openconductor.ai

---

## 📊 Scene-by-Scene Reference

### Scene 1: Hook (0:00-0:10)
**Narration**:
> "What if you could transform Claude into a specialized AI assistant in 10 seconds instead of 30 minutes? OpenConductor v1.2.0 makes it possible."

**Visual**: intro-slide.html
**Text Overlays**:
- "30 minutes → 10 seconds"
- "Configuration hell → One command"

---

### Scene 2: Problem (0:10-0:30)
**Narration**:
> "Setting up MCP servers used to mean hunting through GitHub, manually editing JSON configs, wrestling with syntax errors, and losing 30 minutes of your day. And that's if everything works."

**Visual**: problem-slide.html
**Text Overlays**:
- "Manual JSON editing"
- "Syntax errors"
- "Multiple restarts"

---

### Scene 3: Solution (0:30-0:50)
**Narration**:
> "Version 1.2.0 introduces Stacks - pre-configured AI workflows that bundle the right servers with specialized system prompts. No configuration, no guesswork, just instant value."

**Visual**: solution-slide.html + terminal: stack list
**Text Overlays**:
- "🧑‍💻 Coder Stack - 5 servers"
- "✍️ Writer Stack - 4 servers"
- "⚡ Essential Stack - 3 servers"

---

### Scene 4: Demo Install (0:50-1:10)
**Narration**:
> "Watch this. One command installs five development servers: GitHub, filesystem, PostgreSQL, memory, and Brave Search. Plus, a specialized system prompt is automatically copied to your clipboard."

**Visual**: Terminal - stack install coder
**Text Overlays**:
- "$ openconductor stack install coder"
- "✓ Installing 5 servers..."
- "✓ System prompt copied!"

---

### Scene 5: Demo Usage (1:10-1:50)
**Narration**:
> "Paste the prompt into Claude, and you instantly have a senior software engineer. It can read files, analyze codebases, query databases, search the web, and remember context across sessions. All without touching a single config file."

**Visual**: coderStack-slide.html (or mock Claude interface)
**Text Overlays**:
- "✓ Reading project files"
- "✓ Analyzing architecture"
- "✓ Querying database"
- "✓ Remembering context"

---

### Scene 6: More Stacks (1:50-2:10)
**Narration**:
> "The Writer Stack transforms Claude into a research and publishing assistant. The Essential Stack gives you the perfect first install. Each stack is crafted for a specific workflow, tested in production, and ready to use."

**Visual**: Quick cuts of writerStack-slide.html and essentialStack-slide.html
**Text Overlays**:
- "Writer Stack: Research + Publishing"
- "Essential Stack: Perfect First Install"

---

### Scene 7: CTA (2:10-2:30)
**Narration**:
> "Ready to transform your Claude setup? Visit openconductor.ai to explore stacks, or install the CLI now with npm install -g @openconductor/cli. Stop configuring. Start creating."

**Visual**: cta-slide.html
**Text Overlays**:
- "openconductor.ai/stacks"
- "npm install -g @openconductor/cli"
- "Stop configuring. Start creating."

---

## 🎯 Quality Checklist

Before Publishing:

- [ ] Audio is clear and at good volume
- [ ] All scenes match narration timing
- [ ] Text overlays are readable
- [ ] Transitions are smooth
- [ ] Color/brightness is consistent
- [ ] Terminal text is legible
- [ ] URLs and commands are correct
- [ ] No typos in text overlays
- [ ] Tested on different screen sizes
- [ ] Added subtitles (optional but recommended)

---

## 🚨 Quick Shortcuts

### Fastest Path (90 minutes):
1. **ElevenLabs voiceover** (20 min setup + 10 min generate)
2. **Screenshot all slides** (10 min)
3. **Screenshot terminal recordings** (5 min)
4. **DaVinci Resolve edit** (45 min)
5. **Export & upload** (15 min)

### Professional Path (4 hours):
1. **Professional voiceover** (30 min)
2. **Record animated slides** (20 min)
3. **Record live terminal demos** (30 min)
4. **Advanced editing with effects** (2 hours)
5. **Color grading & polish** (30 min)
6. **Export multiple versions** (30 min)

---

## 📞 Need Help?

**Assets Location**:
```bash
cd /home/roizen/projects/openconductor/demo-scripts/v1.2.0-automated
```

**Files**:
- Narration: `scripts/hero-video-narration.txt`
- Slides: `slides/*.html`
- Terminal: `terminal-recordings/*.txt`
- Timing: `scripts/hero-video-timing.json`

**Support**:
- All scripts documented
- README in each directory
- Example outputs provided

---

## ✨ Bonus: Creating Short Clips

Once hero video is done, extract clips:

### 30s Twitter Clip (Demo Only)
- Extract: Scenes 4-5 (0:50-1:30)
- Add: Quick hook at start
- Result: Pure demo value

### 60s LinkedIn Clip (Problem → Solution)
- Extract: Scenes 2-4 (0:10-1:10)
- Add: Professional intro
- Result: Business value focus

### 15s TikTok/Reels (Just the Install)
- Extract: Scene 4 (0:50-1:10)
- Add: Punchy music
- Result: Viral potential

---

**Status**: ✅ READY TO PRODUCE
**Time Required**: 3-4 hours
**Difficulty**: Beginner-friendly

**Let's make this video! 🎬**
