# OpenConductor Automated Demo System
## DevOps Agent for Video Creation

**Date**: 2025-11-22
**Goal**: Automate demo video creation using available tools

---

## 🎯 System Architecture

### Phase 1: Script & Asset Generation (Automated)
**What We Can Do Now**:
1. **Generate Video Scripts** - AI-generated narration text
2. **Capture Screenshots** - Automated CLI screenshots using `script` command
3. **Generate Slide Decks** - Text-based slides for key scenes
4. **Create Voiceover Scripts** - Formatted for ElevenLabs TTS

**Tools Available**:
- Node.js / TypeScript
- Bash scripting
- `script` command for terminal recording
- `import` or `scrot` for screenshots (if available)
- Text-to-image for simple graphics

### Phase 2: Manual Assembly (User does this)
**What Requires External Tools**:
1. **Voiceover Generation** - User uploads script to ElevenLabs
2. **Screen Recording** - User runs automated script while recording
3. **Video Editing** - User assembles in DaVinci Resolve / Premiere

---

## 📁 Automated Output Structure

```
openconductor-demos/
  v1.2.0-automated/
    scripts/
      hero-video-narration.txt          # Generated voiceover script
      hero-video-timing.json            # Scene timing data
      coder-stack-demo-narration.txt

    terminal-recordings/
      01-stack-list.txt                 # ASCII terminal output
      02-stack-install-coder.txt
      03-claude-usage.txt

    screenshots/
      scene-01-hook.png                 # Auto-generated or placeholders
      scene-02-problem.png
      scene-03-solution.png

    slides/
      intro-slide.html                  # HTML slides for title screens
      outro-slide.html

    automation/
      run-demo.sh                       # Script that runs the demo
      capture-terminal.sh               # Records terminal sessions
```

---

## 🤖 Components to Build

### 1. Script Generator (`generate-video-scripts.ts`)
**Input**: Video strategy markdown
**Output**:
- Formatted narration scripts
- Timing markers
- Scene descriptions
- On-screen text suggestions

### 2. Terminal Recorder (`record-terminal-demo.sh`)
**Input**: List of commands to run
**Output**: Clean terminal recordings (ASCII or screenshots)

### 3. Slide Generator (`generate-slides.ts`)
**Input**: Text and styling data
**Output**: HTML slides that can be screenshotted

### 4. Demo Orchestrator (`run-full-demo.sh`)
**Runs**:
- All CLI commands in sequence
- Captures output
- Times each scene
- Generates complete asset package

---

## 🎬 Hero Video Automation Plan

### Automated Components

**Script Generation**:
```bash
node scripts/generate-video-scripts.ts \
  --input demo-scripts/V1.2.0_DEMO_VIDEO_STRATEGY.md \
  --output v1.2.0-automated/scripts/hero-video-narration.txt
```

**Terminal Recording**:
```bash
./scripts/record-terminal-demo.sh \
  --demo hero-video \
  --output v1.2.0-automated/terminal-recordings/
```

**Slide Generation**:
```bash
node scripts/generate-slides.ts \
  --scenes "Hook,Problem,Solution,Demo,CTA" \
  --output v1.2.0-automated/slides/
```

### Manual Steps (User)

1. **Generate Voiceover**:
   - Upload `hero-video-narration.txt` to ElevenLabs
   - Download audio file

2. **Record Screen**:
   - Run `./run-full-demo.sh`
   - Record screen while script executes
   - Result: Perfectly timed screen recording

3. **Edit Video**:
   - Import screen recording
   - Add voiceover
   - Overlay slides
   - Add transitions

---

## ✅ Quick Start Commands

### Generate Everything
```bash
# Create demo assets
cd /home/roizen/projects/openconductor
mkdir -p demo-scripts/v1.2.0-automated/{scripts,terminal-recordings,screenshots,slides,automation}

# Generate scripts
node demo-scripts/automation/generate-video-scripts.ts

# Record terminal sessions
bash demo-scripts/automation/record-terminal-demo.sh

# Generate slides
node demo-scripts/automation/generate-slides.ts

# Package for delivery
zip -r v1.2.0-demo-package.zip demo-scripts/v1.2.0-automated/
```

---

## 🎯 Benefits of This Approach

### Automated
- ✅ No manual script writing
- ✅ Consistent terminal recordings
- ✅ Reproducible demos
- ✅ Easy to update/regenerate

### Flexible
- ✅ Works without sudo/admin access
- ✅ No heavy dependencies
- ✅ Cross-platform compatible
- ✅ Uses existing tools

### Professional
- ✅ Perfectly timed scenes
- ✅ Clean terminal output
- ✅ Professional narration scripts
- ✅ Ready for editing

---

## 📊 Next Steps

1. **Build Script Generator** - Convert strategy MD → narration scripts
2. **Build Terminal Recorder** - Automate CLI demo captures
3. **Build Slide Generator** - Create title/transition slides
4. **Test Full Pipeline** - Generate complete hero video package
5. **Document for User** - Instructions for final assembly

**Estimated Build Time**: 2-3 hours
**Estimated User Assembly Time**: 1-2 hours
**Total**: 3-5 hours for professional demo video
