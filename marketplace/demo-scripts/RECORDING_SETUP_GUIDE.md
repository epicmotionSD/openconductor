# Demo Video Recording Setup Guide

Complete guide for recording professional demo videos for Registry MCP and SportIntel MCP.

---

## Table of Contents
1. [Equipment & Software](#equipment--software)
2. [Pre-Recording Checklist](#pre-recording-checklist)
3. [Screen Recording Setup](#screen-recording-setup)
4. [Audio Recording Setup](#audio-recording-setup)
5. [Environment Preparation](#environment-preparation)
6. [Recording Workflow](#recording-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Equipment & Software

### Required Software

#### Screen Recording (Choose One)
- **OBS Studio** (FREE - Recommended for Linux/Windows)
  - Download: https://obsproject.com
  - Best for: Multi-platform, professional features

- **QuickTime Player** (FREE - macOS built-in)
  - Best for: Simple, reliable, native macOS

- **ScreenFlow** (PAID - macOS)
  - Download: https://www.telestream.net/screenflow/
  - Best for: All-in-one recording + editing

#### Video Editing (Choose One)
- **DaVinci Resolve** (FREE)
  - Download: https://www.blackmagicdesign.com/products/davinciresolve
  - Best for: Professional features, color grading

- **iMovie** (FREE - macOS)
  - Best for: Simple edits, quick turnaround

- **Adobe Premiere Pro** (PAID)
  - Best for: Professional workflow, integration

#### Audio Recording
- **Audacity** (FREE)
  - Download: https://www.audacityteam.org
  - Best for: Voiceover recording, cleanup

### Optional Equipment
- External microphone (USB or XLR)
  - Budget: Blue Snowball ($50)
  - Mid-range: Audio-Technica AT2020 ($100)
  - Pro: Shure SM7B ($400)
- Pop filter ($10-30)
- Headphones for monitoring
- Good lighting for webcam (if adding talking head)

---

## Pre-Recording Checklist

### Installation Verification

```bash
# Verify both packages are installed globally
npm list -g @openconductor/mcp-registry
npm list -g @openconductor/sportintel

# If not installed:
npm install -g @openconductor/mcp-registry @openconductor/sportintel
```

### Claude Desktop Configuration

1. **Locate config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add both servers:**
```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "npx",
      "args": ["-y", "@openconductor/mcp-registry"]
    },
    "sportintel": {
      "command": "npx",
      "args": ["-y", "@openconductor/sportintel"]
    }
  }
}
```

3. **Restart Claude Desktop**

4. **Verify connection:**
   - Look for MCP indicator in Claude Desktop
   - Type a test query: "List available MCP tools"
   - Should see tools from both servers

### Test Queries

#### Registry MCP Test
```
Search for database MCP servers
```
Expected: List of database-related servers

#### SportIntel MCP Test
```
What are today's NBA scores?
```
Expected: Current NBA scores (or message if no games today)

---

## Screen Recording Setup

### OBS Studio Configuration (Linux/Windows/macOS)

#### Initial Setup
1. **Install OBS Studio**
   ```bash
   # Ubuntu/Debian
   sudo apt install obs-studio

   # macOS (with Homebrew)
   brew install --cask obs

   # Windows: Download from obsproject.com
   ```

2. **Create Scene:**
   - Open OBS Studio
   - Scene Name: "Claude Demo"
   - Add Source → Window Capture
   - Select: "Claude Desktop"

3. **Settings:**
   - Settings → Video
     - Base Resolution: 1920x1080
     - Output Resolution: 1920x1080
     - FPS: 30

   - Settings → Output
     - Output Mode: Simple
     - Video Bitrate: 10000 Kbps
     - Encoder: x264
     - Recording Format: mp4

   - Settings → Audio
     - Sample Rate: 44.1 kHz
     - Channels: Stereo
     - Mic/Auxiliary: Your microphone

4. **Hotkeys (Optional):**
   - Settings → Hotkeys
   - Start Recording: F9
   - Stop Recording: F10
   - Pause Recording: F11

#### Recording Workflow in OBS
1. Open Claude Desktop
2. Open OBS Studio
3. Arrange windows (Claude visible, OBS on second monitor or hidden)
4. Click "Start Recording" (or press F9)
5. Perform demo
6. Click "Stop Recording" (or press F10)
7. Files saved to: Videos folder (default)

---

### QuickTime Setup (macOS)

#### Recording
1. **Open QuickTime Player**
2. **File → New Screen Recording**
3. **Options:**
   - Microphone: Select your mic
   - Quality: Maximum
   - Show Mouse Clicks: No (will add in post)
4. **Click Record button**
5. **Select full screen or click-drag to select Claude window**
6. **Perform demo**
7. **Click Stop in menu bar**
8. **File → Save**

---

### ScreenFlow Setup (macOS)

#### Configuration
1. **New Recording:**
   - Record Desktop: From: [Select Claude Desktop monitor]
   - Record Computer Audio: ✓
   - Record Audio from: [Your microphone]
   - Record Video from: ✗ (unless adding talking head)

2. **Quality:**
   - Settings → Document
   - Frame Rate: 30 fps
   - Dimensions: 1920x1080

3. **Recording:**
   - Click red record button
   - 5-second countdown
   - Perform demo
   - Click stop (Cmd+Shift+2)
   - Automatically opens in editor

---

## Audio Recording Setup

### Option 1: Record Audio Separately (Recommended)

**Why?** Better audio quality, easier to re-record if mistakes, easier to edit.

#### Using Audacity
1. **Setup:**
   - Open Audacity
   - Select microphone input
   - Set sample rate: 44100 Hz
   - Set format: 32-bit float

2. **Recording:**
   - Click red record button
   - Read script section by section
   - Pause between sections (for easier editing)
   - Click stop when done

3. **Editing:**
   - Effect → Noise Reduction
     - Step 1: Select silent section, click "Get Noise Profile"
     - Step 2: Select all (Cmd/Ctrl+A), apply noise reduction
   - Effect → Normalize → OK
   - Effect → Compressor (optional, for consistent volume)
   - Export → Export as WAV (for editing) or MP3 (for final)

4. **Sync with Video:**
   - In video editor, import both video and audio
   - Use clapperboard technique or visual cue to sync
   - Replace video audio with clean audio track

---

### Option 2: Record Audio with Screen Capture

**Why?** Faster workflow, audio automatically synced.

**Cons:** Harder to fix mistakes, background noise captured.

#### Setup
- Ensure microphone is connected
- Set input levels (speak normally, peaks around -12dB to -6dB)
- Use headphones to monitor
- Record in quiet environment
- Do multiple takes if needed

---

## Environment Preparation

### Desktop Cleanup

```bash
# macOS: Hide desktop icons temporarily
defaults write com.apple.finder CreateDesktop false
killall Finder

# To restore:
defaults write com.apple.finder CreateDesktop true
killall Finder
```

**Manual cleanup:**
- [ ] Close all unnecessary applications
- [ ] Clear browser tabs
- [ ] Hide dock (macOS: Cmd+Option+D)
- [ ] Disable notifications:
  - macOS: Hold Option, click notification icon, "Turn Do Not Disturb On"
  - Windows: Settings → System → Notifications → Turn off
  - Linux: Depends on desktop environment
- [ ] Clear desktop clutter
- [ ] Close email clients, chat apps
- [ ] Disable Dropbox, OneDrive sync notifications

### Claude Desktop Preparation

1. **Clear conversation history:**
   - Start fresh conversation for each demo
   - Clear previous test queries

2. **Theme selection:**
   - Light theme: Better for daytime recording, professional
   - Dark theme: Better contrast, modern look, easier on eyes
   - **Recommendation**: Dark theme for tech demos

3. **Window size:**
   - Maximize Claude Desktop
   - Ensure no scrollbars visible initially
   - Font size: Medium (readable at 1080p)

4. **Cursor:**
   - Make cursor larger (for visibility)
   - macOS: System Preferences → Accessibility → Display → Cursor
   - Windows: Settings → Accessibility → Mouse pointer
   - Linux: Varies by desktop environment

---

## Recording Workflow

### Day Before Recording

- [ ] Install and test both MCP servers
- [ ] Verify Claude Desktop configuration
- [ ] Run test queries for each server
- [ ] Check if live games available (for SportIntel)
- [ ] Charge equipment (if using wireless mic)
- [ ] Print scripts
- [ ] Rehearse voiceover

### 1 Hour Before Recording

- [ ] Close all unnecessary apps
- [ ] Disable notifications
- [ ] Clean desktop
- [ ] Test microphone levels
- [ ] Test screen recording (30-second test)
- [ ] Check disk space (need ~5GB free per hour of recording)
- [ ] Warm up voice (read script aloud)

### Recording Session

#### For Each Video:

1. **Setup** (5 minutes)
   - Open Claude Desktop (fresh conversation)
   - Open recording software
   - Position windows
   - Check audio levels
   - Take deep breath

2. **Record in Sections** (30-45 minutes)
   - Record Scene 1 (2-3 takes)
   - Brief pause
   - Record Scene 2 (2-3 takes)
   - Continue for all scenes
   - Take breaks every 15 minutes

3. **Review** (10 minutes)
   - Watch each section
   - Check for:
     - Clear audio
     - Smooth cursor movement
     - Full responses visible
     - No glitches or errors
   - Re-record if needed

4. **Save & Organize** (5 minutes)
   - Save all takes
   - Create folder structure:
     ```
     demos/
       registry-mcp/
         raw/
           scene-01-take-01.mp4
           scene-01-take-02.mp4
           ...
         audio/
           voiceover-scene-01.wav
           ...
       sportintel-mcp/
         raw/
           ...
     ```

---

## Pro Tips

### Recording Tips

1. **Multiple Takes Are Normal**
   - Record each scene 2-3 times
   - Pick best take in editing
   - First take is often stiff, second is natural

2. **Cursor Movement**
   - Move slowly and deliberately
   - Pause briefly at destination
   - Avoid jerky movements
   - Consider using keyboard shortcuts (looks professional)

3. **Typing**
   - Type at natural speed
   - It's okay to backspace/correct
   - Pause before hitting Enter (builds anticipation)
   - Consider using text expansion tools for long queries

4. **Responses**
   - Wait for full response to render
   - Give 2-3 seconds after completion (breathing room)
   - If response is slow, can speed up in post

5. **Voiceover**
   - Smile while recording (you can hear it!)
   - Stand while recording (better breath control)
   - Drink water between takes
   - Re-record if you stumble (don't try to save it)
   - Read naturally, not robotically

---

## Troubleshooting

### Common Issues

#### "Claude can't find the MCP server"
**Solution:**
```bash
# Check installation
npm list -g @openconductor/mcp-registry
npm list -g @openconductor/sportintel

# Verify config file location
# macOS:
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Restart Claude Desktop completely
# Check MCP indicator in UI
```

#### "Screen recording is choppy"
**Solution:**
- Close background applications
- Lower recording quality temporarily
- Increase video bitrate
- Check CPU/RAM usage
- Disable GPU acceleration in Claude

#### "Audio has background noise"
**Solution:**
- Record in quiet room
- Use Audacity noise reduction
- Move away from computer fans
- Use directional microphone
- Record early morning (quieter)

#### "Cursor is too small/invisible"
**Solution:**
- Increase cursor size in OS settings
- Use software cursor highlighting (OBS plugin)
- Add cursor glow in post-production

#### "Response takes too long to render"
**Solution:**
- Pre-warm the server (run query before recording)
- Speed up video slightly in post (1.2x-1.5x)
- Edit out waiting time
- Use faster queries for demo

#### "Colors look washed out"
**Solution:**
- Check recording color space (use Rec. 709)
- Use color grading in post
- Increase saturation slightly
- Check monitor calibration

---

## Quick Reference

### OBS Keyboard Shortcuts
- Start/Stop Recording: Ctrl+Shift+R (Windows/Linux), Cmd+Shift+R (macOS)
- Pause Recording: Ctrl+Shift+P
- Hide/Show OBS: Ctrl+H

### QuickTime Keyboard Shortcuts
- Start Recording: Cmd+Shift+5, then click record
- Stop Recording: Click stop in menu bar
- Save: Cmd+S

### Video Export Settings Summary
```
Format: MP4
Codec: H.264
Resolution: 1920x1080
Frame Rate: 30fps
Bitrate: 8000-10000 Kbps
Audio: AAC, 192kbps, 44.1kHz
```

---

## Next Steps

After recording:
1. Review all footage
2. Select best takes
3. Import into video editor
4. Follow editing checklist in demo scripts
5. Add graphics, music, captions
6. Export in multiple formats
7. Upload to YouTube, Twitter, etc.

Good luck with your recordings! 🎬
