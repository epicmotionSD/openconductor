# OpenConductor v1.2.0 Automated Demo System

**Created**: 2025-11-22
**Status**: ✅ READY FOR PRODUCTION

---

## 🎯 What This Is

An **automated DevOps agent** for creating professional demo videos for OpenConductor v1.2.0. Generates all assets needed for video production without requiring manual script writing, design work, or content planning.

## ✨ What Was Generated

### 📝 Video Scripts (`scripts/`)
Complete narration scripts ready for voiceover generation:

- **`hero-video-narration.txt`** - 2:30 hero launch video (7 scenes)
- **`coder-stack-narration.txt`** - 1:45 Coder Stack showcase
- **`writer-stack-narration.txt`** - 1:45 Writer Stack showcase
- **`*-timing.json`** - Precise timing data for video editing
- **`hero-video-onscreen-text.txt`** - All on-screen text elements

### 🎨 HTML Slides (`slides/`)
Professional title screens and transitions:

- `intro-slide.html` - Opening title
- `problem-slide.html` - "The Old Way" (pain points)
- `solution-slide.html` - Stacks introduction
- `coderStack-slide.html` - Coder Stack features
- `writerStack-slide.html` - Writer Stack features
- `essentialStack-slide.html` - Essential Stack
- `cta-slide.html` - Call to action

**Features**:
- Animated (fade-in effects)
- 1920x1080 optimized
- Professional color schemes
- Ready to screenshot or record

### 🤖 Automation Scripts (`automation/`)
Reusable tools for future videos:

- `generate-video-scripts.js` - Script generator
- `generate-slides.js` - Slide generator
- `record-terminal-demo.sh` - Terminal recorder
- `generate-all-demo-assets.sh` - Master orchestrator

---

## 🚀 Quick Start: Create Your First Video

### Option 1: Semi-Automated (Recommended)

**Total Time**: 2-3 hours

```bash
# 1. Generate all text assets (already done!)
cd /home/roizen/projects/openconductor/demo-scripts/automation
bash generate-all-demo-assets.sh

# 2. Generate voiceovers with ElevenLabs
# - Go to elevenlabs.io
# - Upload: scripts/hero-video-narration.txt
# - Select voice (e.g., "Josh" - deep, professional)
# - Download: hero-video-voiceover.mp3

# 3. Record screen (interactive mode)
bash record-terminal-demo.sh --interactive
# - Start your screen recorder
# - Follow on-screen prompts
# - Captures perfect CLI demonstrations

# 4. Screenshot slides
# - Open each slide in browser (slides/*.html)
# - Press F11 for fullscreen
# - Screenshot or record for 3-5 seconds each

# 5. Edit in video editor
# - Import: voiceover, screen recordings, slides
# - Use timing.json files for exact scene durations
# - Add transitions and music
# - Export and publish!
```

### Option 2: Fully Manual

Use the generated assets as references and record everything yourself using the narration scripts and slide designs as guides.

---

## 📋 Detailed Workflow

### Step 1: Voiceover Generation

**Using ElevenLabs** (Recommended):

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up / log in
3. Create new project
4. Upload `scripts/hero-video-narration.txt`
5. Settings:
   - Voice: Professional (Josh, Adam, or similar)
   - Stability: 50%
   - Clarity: 75%
6. Generate and download
7. Save as `audio/hero-video-voiceover.mp3`

**Repeat for**:
- `coder-stack-narration.txt`
- `writer-stack-narration.txt`

**Alternative TTS Services**:
- Amazon Polly
- Google Cloud TTS
- Azure Cognitive Services
- Play.ht

### Step 2: Terminal Recordings

**Automated Mode**:
```bash
cd automation/
bash record-terminal-demo.sh --hero
# Generates text output files of all commands
```

**Interactive Mode** (for screen recording):
```bash
bash record-terminal-demo.sh --interactive
```

This will:
1. Show you each command to type
2. Wait for you to press ENTER
3. Execute the command with realistic timing
4. Perfect for recording while demonstrating

**What to Record**:
- `openconductor stack list`
- `openconductor stack install coder`
- `openconductor stack show coder`
- Claude Desktop usage (manual - follow script)

### Step 3: Slide Capture

**Option A: Screenshot**
```bash
cd slides/
# Open each .html file in browser
# Press F11 for fullscreen
# Take screenshot (Cmd+Shift+4 on Mac)
```

**Option B: Record with Animations**
```bash
# Better for final video - shows animations
# Open slide, press F11, record for 5 seconds
# Exports with fade-in effects intact
```

**Slides to Capture**:
1. intro-slide.html (5 seconds)
2. problem-slide.html (5 seconds)
3. solution-slide.html (5 seconds)
4. coderStack-slide.html (5 seconds)
5. writerStack-slide.html (5 seconds)
6. cta-slide.html (5 seconds)

### Step 4: Video Editing

**Import to Editor** (DaVinci Resolve, Premiere, Final Cut):

1. Create new project (1920x1080, 30fps)
2. Import all assets:
   - Audio: voiceover files
   - Video: screen recordings
   - Graphics: slide screenshots

3. Edit using timing data:
   ```bash
   cat scripts/hero-video-timing.json
   # Use exact timestamps for scene placement
   ```

4. Add polish:
   - Background music (royalty-free)
   - Transitions (simple fades or cuts)
   - Color grading (optional)
   - Subtitles (from narration scripts)

5. Export:
   - Format: MP4 (H.264)
   - Resolution: 1920x1080
   - Bitrate: 10 Mbps
   - Audio: 320 kbps AAC

---

## 🎬 Video Specifications

### Hero Video (2:30)

**Scenes**:
1. Hook (0:00-0:10) - Split screen comparison
2. Problem (0:10-0:30) - Manual JSON editing pain
3. Solution (0:30-0:50) - Stacks introduction
4. Demo Install (0:50-1:10) - `stack install coder`
5. Demo Usage (1:10-1:50) - Claude in action
6. More Stacks (1:50-2:10) - Writer & Essential
7. CTA (2:10-2:30) - Call to action

**Target Platforms**:
- YouTube (main upload)
- Twitter (30s clip of demo)
- LinkedIn (60s clip with CTA)
- Product Hunt (embed on launch)

### Coder Stack Demo (1:45)

**Scenes**:
1. Intro (0:00-0:15)
2. Install (0:15-0:30)
3. File Access (0:30-0:50)
4. Database Demo (0:50-1:10)
5. GitHub Demo (1:10-1:30)
6. CTA (1:30-1:45)

### Writer Stack Demo (1:45)

**Scenes**:
1. Intro (0:00-0:15)
2. Install (0:15-0:30)
3. Research Demo (0:30-0:55)
4. Writing Demo (0:55-1:20)
5. CTA (1:20-1:45)

---

## 🔧 Regenerating Assets

### Regenerate Everything
```bash
cd automation/
bash generate-all-demo-assets.sh
```

### Regenerate Just Scripts
```bash
node generate-video-scripts.js
```

### Regenerate Just Slides
```bash
node generate-slides.js
```

### Customize Scripts
Edit `generate-video-scripts.js`:
- Modify `HERO_VIDEO_SCRIPT` object
- Change narration text
- Adjust timing
- Run script to regenerate

### Customize Slides
Edit `generate-slides.js`:
- Modify `SLIDES` object
- Change colors, text, bullets
- Run script to regenerate

---

## 📦 File Structure

```
v1.2.0-automated/
├── README.md (this file)
├── GENERATION_REPORT.md (generation summary)
│
├── scripts/
│   ├── hero-video-narration.txt
│   ├── hero-video-timing.json
│   ├── hero-video-onscreen-text.txt
│   ├── coder-stack-narration.txt
│   ├── coder-stack-timing.json
│   ├── writer-stack-narration.txt
│   └── writer-stack-timing.json
│
├── slides/
│   ├── README.md
│   ├── intro-slide.html
│   ├── problem-slide.html
│   ├── solution-slide.html
│   ├── coderStack-slide.html
│   ├── writerStack-slide.html
│   ├── essentialStack-slide.html
│   └── cta-slide.html
│
├── terminal-recordings/ (you create these)
│   ├── 01-stack-list.txt
│   ├── 02-install-coder.txt
│   └── ...
│
├── audio/ (you create these)
│   ├── hero-video-voiceover.mp3
│   ├── coder-stack-voiceover.mp3
│   └── writer-stack-voiceover.mp3
│
├── screenshots/ (you create these)
│   ├── intro-slide.png
│   ├── problem-slide.png
│   └── ...
│
└── automation/ (generator scripts)
    ├── generate-video-scripts.js
    ├── generate-slides.js
    ├── record-terminal-demo.sh
    └── generate-all-demo-assets.sh
```

---

## 💡 Pro Tips

### Voiceover
- Use pauses between scenes for easier editing
- Record in a quiet room
- Use a pop filter if available
- Generate multiple takes, pick the best

### Screen Recording
- Clean your desktop before recording
- Use Do Not Disturb mode
- Hide menu bars if possible
- Record in 1920x1080
- 30 fps is sufficient

### Editing
- Keep cuts tight - remove dead air
- Use simple transitions (cuts or quick fades)
- Add subtle background music (20-30% volume)
- Color correct screen recordings for consistency
- Add subtle zoom-ins on important UI elements

### Distribution
- YouTube: Full videos with chapters
- Twitter: 30-60s clips with hook
- LinkedIn: 60-90s professional framing
- Instagram/TikTok: Vertical crop (9:16) of key scenes

---

## 🎯 Success Metrics

Track these after publishing:

- **Views**: YouTube, social media
- **Engagement**: Likes, comments, shares
- **Conversions**:
  - CLI installs (`npm view @openconductor/cli`)
  - Website traffic (openconductor.ai)
  - GitHub stars
- **Retention**: Watch time, completion rate

---

## 🔄 Updates and Maintenance

### To Update for Future Versions

1. Edit scripts in `automation/generate-video-scripts.js`
2. Update version numbers, features, narration
3. Regenerate: `bash generate-all-demo-assets.sh`
4. Record new voiceovers and terminal demos
5. Edit and publish

### To Add New Videos

1. Add new script object to `generate-video-scripts.js`
2. Add corresponding slides to `generate-slides.js`
3. Regenerate all assets
4. Follow same production workflow

---

## 📞 Support

**Questions or Issues?**
- GitHub Issues: https://github.com/openconductor/openconductor/issues
- Documentation: All scripts are commented
- Examples: This README and GENERATION_REPORT.md

---

**Generated by**: OpenConductor Automated Demo System
**Version**: 1.0.0
**Last Updated**: 2025-11-22

---

## ✅ Next Steps

1. **Review generated scripts**: `cat scripts/hero-video-narration.txt`
2. **Open a slide**: `open slides/intro-slide.html` (or your browser)
3. **Generate voiceover**: Upload script to ElevenLabs
4. **Record terminal demo**: `bash automation/record-terminal-demo.sh --interactive`
5. **Edit video**: Import all assets and assemble
6. **Publish**: YouTube, social media, website

**Ready to create professional demo videos in hours instead of weeks!** 🎬
