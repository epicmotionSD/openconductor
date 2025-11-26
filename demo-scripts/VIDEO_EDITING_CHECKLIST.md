# Video Editing Checklist

Complete post-production checklist for Registry MCP and SportIntel MCP demo videos.

---

## Table of Contents
1. [Import & Organization](#import--organization)
2. [Assembly & Timing](#assembly--timing)
3. [Graphics & Text](#graphics--text)
4. [Audio Enhancement](#audio-enhancement)
5. [Color Grading](#color-grading)
6. [Effects & Transitions](#effects--transitions)
7. [Export & Optimization](#export--optimization)
8. [Platform-Specific Versions](#platform-specific-versions)

---

## Import & Organization

### File Management

- [ ] Create project folder structure:
  ```
  openconductor-demos/
    registry-mcp/
      01-raw-footage/
        scene-01-take-01.mp4
        scene-01-take-02.mp4
        ...
      02-audio/
        voiceover-final.wav
        background-music.mp3
      03-graphics/
        intro-slate.png
        lower-thirds/
        end-card.png
        logos/
      04-exports/
        registry-mcp-youtube.mp4
        registry-mcp-twitter.mp4
        ...
    sportintel-mcp/
      [same structure]
  ```

- [ ] Import all raw footage into editor
- [ ] Label clips clearly (Scene 1 Take 1, Scene 1 Take 2, etc.)
- [ ] Create bins/folders by scene
- [ ] Import audio files
- [ ] Import graphics assets

### Asset Preparation

- [ ] Review all takes, mark best ones
- [ ] Check audio sync on all clips
- [ ] Verify no corrupted files
- [ ] Create backup of all raw files

---

## Assembly & Timing

### Timeline Creation

#### Registry MCP Video (2:15 total)

- [ ] **Scene 1: Introduction (0:00-0:15)**
  - [ ] Intro slate: 0:00-0:03
  - [ ] Fade to Claude Desktop: 0:03-0:05
  - [ ] Voiceover starts: 0:05
  - [ ] End scene: 0:15

- [ ] **Scene 2: The Problem (0:15-0:30)**
  - [ ] Show browser tabs: 0:15-0:20
  - [ ] Multiple GitHub repos: 0:20-0:25
  - [ ] Confusion montage: 0:25-0:30

- [ ] **Scene 3: The Solution (0:30-0:45)**
  - [ ] Switch to Claude: 0:30-0:32
  - [ ] Show clean interface: 0:32-0:40
  - [ ] Highlight MCP indicator: 0:40-0:45

- [ ] **Scene 4: Demo - Discovery (0:45-1:05)**
  - [ ] User types query: 0:45-0:50
  - [ ] Response appears: 0:50-0:58
  - [ ] Highlight key servers: 0:58-1:05

- [ ] **Scene 5: Demo - Trending (1:05-1:20)**
  - [ ] User types: 1:05-1:08
  - [ ] Response: 1:08-1:15
  - [ ] Show trending list: 1:15-1:20

- [ ] **Scene 6: Demo - Details (1:20-1:40)**
  - [ ] User types: 1:20-1:23
  - [ ] Full details appear: 1:23-1:35
  - [ ] Highlight install command: 1:35-1:40

- [ ] **Scene 7: Value Prop (1:40-2:00)**
  - [ ] Split screen setup: 1:40-1:45
  - [ ] Old way: 1:45-1:50
  - [ ] New way: 1:50-1:55
  - [ ] Comparison: 1:55-2:00

- [ ] **Scene 8: Technical (2:00-2:15)**
  - [ ] Show badges: 2:00-2:05
  - [ ] Code snippet: 2:05-2:10
  - [ ] Feature highlights: 2:10-2:15

- [ ] **Scene 9: Get Started (2:15-2:30)**
  - [ ] Terminal command: 2:15-2:20
  - [ ] End card: 2:20-2:28
  - [ ] Fade to black: 2:28-2:30

#### SportIntel MCP Video (2:15 total)

- [ ] **Scene 1: Introduction (0:00-0:15)**
  - [ ] Intro slate
  - [ ] Fade to Claude

- [ ] **Scene 2: The Problem (0:15-0:30)**
  - [ ] Context switching demo
  - [ ] ESPN tabs

- [ ] **Scene 3: The Solution (0:30-0:45)**
  - [ ] Show MCP connection
  - [ ] 5 sports leagues graphic

- [ ] **Scene 4: Live Scores (0:45-1:05)**
  - [ ] NBA scores query
  - [ ] Response with live data

- [ ] **Scene 5: Standings (1:05-1:20)**
  - [ ] Standings query
  - [ ] Full conference view

- [ ] **Scene 6: AI Analysis (1:20-1:45)**
  - [ ] Analysis query
  - [ ] Claude's insights

- [ ] **Scene 7: Multi-Sport (1:45-2:00)**
  - [ ] Multiple sports query
  - [ ] All leagues shown

- [ ] **Scene 8: Use Cases (2:00-2:15)**
  - [ ] Quick montage

- [ ] **Scene 9: Get Started (2:15-2:30)**
  - [ ] Install command
  - [ ] End card with disclaimer

### Pacing Adjustments

- [ ] Speed up slow responses (1.2x-1.5x)
- [ ] Cut dead space between scenes
- [ ] Maintain 2-3 second breathing room after responses
- [ ] Ensure total runtime hits target (2:15-2:30)
- [ ] Add smooth transitions between cuts

---

## Graphics & Text

### Intro & Outro

#### Intro Slate (0:00-0:03)
- [ ] **Registry MCP:**
  - Text: "OpenConductor Registry MCP"
  - Subtitle: "The First Meta-MCP Server"
  - Logo: OpenConductor logo
  - Background: Dark gradient or animated
  - Animation: Fade in + subtle zoom

- [ ] **SportIntel MCP:**
  - Text: "SportIntel MCP"
  - Subtitle: "Live Sports Data in Claude"
  - Logo: SportIntel logo with sports icons
  - Background: Energetic sports theme
  - Animation: Dynamic entrance

#### End Card (2:20-2:30)
- [ ] **Both videos:**
  - Title: "Get Started"
  - Install command prominently displayed
  - Links section:
    - npm package URL
    - GitHub repo URL
    - Twitter handle
  - QR codes (optional)
  - "Subscribe for more" CTA
  - OpenConductor logo
  - Animation: Fade in elements sequentially

### Lower Thirds

- [ ] **Package name lower third:**
  - Position: Bottom left
  - Show: At 0:05 and 2:15
  - Content: "@openconductor/[package-name]"
  - Style: Modern, semi-transparent background

- [ ] **Feature callouts:**
  - Registry: "120+ MCP Servers" at 0:45
  - Registry: "Zero Configuration" at 2:00
  - SportIntel: "5 Sports Leagues" at 0:45
  - SportIntel: "Real-time Data" at 0:50
  - Style: Subtle badges that don't obscure content

### On-Screen Text

- [ ] **Highlight key information:**
  - Install commands (yellow highlight box)
  - Server names in lists (subtle underline)
  - Key statistics (enlarge font)
  - Category tags (badge style)

- [ ] **Captions/Subtitles:**
  - [ ] Generate SRT file from voiceover script
  - [ ] Sync with audio precisely
  - [ ] Style: Yellow text, black background, bottom center
  - [ ] Font: Sans-serif, 40-48pt
  - [ ] Ensure readability at all sizes

### Zoom Effects

- [ ] **Registry MCP:**
  - Zoom 120% on server list (0:52-0:58)
  - Zoom 120% on install command (1:35-1:40)
  - Smooth zoom, not jarring

- [ ] **SportIntel MCP:**
  - Zoom 120% on scores (0:50-1:00)
  - Zoom 120% on standings table (1:10-1:15)
  - Pan across if content wider than screen

---

## Audio Enhancement

### Voiceover Processing

- [ ] **In Audacity or DAW:**
  - [ ] Normalize to -3dB peak
  - [ ] Apply noise reduction
  - [ ] Compress (ratio 3:1, threshold -20dB)
  - [ ] EQ: Boost 100-200Hz (warmth), reduce 300-500Hz (muddiness)
  - [ ] De-ess (reduce sibilance)
  - [ ] Final limiter (-1dB ceiling)

- [ ] **In Video Editor:**
  - [ ] Sync voiceover to video precisely
  - [ ] Adjust volume to -12dB average (leaving headroom)
  - [ ] Add fade in/out at scene transitions (0.5s)
  - [ ] Duck music when voiceover plays

### Background Music

- [ ] **Select music:**
  - Registry: Upbeat tech/corporate (subtle)
  - SportIntel: Energetic sports theme
  - Royalty-free sources confirmed

- [ ] **Music editing:**
  - [ ] Import music track
  - [ ] Cut/loop to fit video length
  - [ ] Volume: -24dB when voiceover plays, -18dB otherwise
  - [ ] Fade in: 0:00-0:02
  - [ ] Duck during key moments (auto-ducking or manual)
  - [ ] Fade out: 2:28-2:30
  - [ ] Ensure no copyright issues

### Sound Effects (Optional)

- [ ] **Subtle effects:**
  - "Whoosh" on transitions (very subtle, -30dB)
  - "Click" when buttons pressed
  - "Ding" when responses appear
  - Keep minimal, professional

### Audio Mixing

- [ ] **Final mix:**
  - Voiceover: -12dB average, peaks at -6dB
  - Music: -24dB average during voice, -18dB otherwise
  - SFX: -30dB to -24dB (subtle)
  - Total mix: Peaks at -3dB, average -18dB

- [ ] **Quality check:**
  - [ ] No clipping (red peaks)
  - [ ] No audio dropouts
  - [ ] Consistent volume throughout
  - [ ] Clear voice, no distortion
  - [ ] Music doesn't overpower voice

---

## Color Grading

### Basic Correction

- [ ] **Exposure:**
  - Ensure desktop is visible and clear
  - Not too bright (washed out) or dark
  - Adjust if screen recording too dim/bright

- [ ] **White Balance:**
  - Neutral whites in UI
  - Consistent across all clips

- [ ] **Contrast:**
  - Text is crisp and readable
  - UI elements have good separation

### Creative Grade

- [ ] **Registry MCP:**
  - Slightly cooler tones (tech feel)
  - High contrast for clarity
  - Subtle saturation boost for UI elements

- [ ] **SportIntel MCP:**
  - Warmer, more vibrant
  - Boost saturation for energy
  - Make scores/stats pop

### Consistency

- [ ] Match color across all scenes
- [ ] No jarring color shifts between cuts
- [ ] Graphics match video grade
- [ ] Test on different displays (if possible)

---

## Effects & Transitions

### Transitions

- [ ] **Between scenes:**
  - Type: Simple crossfade (0.5-1s)
  - OR: Clean cut (faster pace)
  - Avoid: Cheesy effects (star wipes, etc.)

- [ ] **For emphasis:**
  - Quick zoom ins (Ken Burns effect)
  - Smooth pans across long lists
  - Highlight boxes appearing (subtle animation)

### Cursor Effects

- [ ] **Highlight cursor:**
  - Add glow/ring around cursor (optional)
  - Enlarge cursor by 1.5x
  - Add click animation when clicking

- [ ] **Cursor smoothing:**
  - Remove jerky movements
  - Speed up slow cursor drags (1.2x)

### Text Animations

- [ ] **Lower thirds:**
  - Slide in from left (0.3s)
  - Stay on screen (3-5s)
  - Slide out to left (0.3s)

- [ ] **Callout boxes:**
  - Fade in (0.2s)
  - Scale from 95% to 100% (subtle zoom)
  - Stay (2-3s)
  - Fade out (0.2s)

- [ ] **End card elements:**
  - Stagger entrance (0.1s apart)
  - Fade + slide up
  - Professional, not distracting

---

## Platform-Specific Edits

### YouTube (Primary Version)
**Format:** 1920x1080, 2:15-2:30 duration

- [ ] Full intro slate (3 seconds)
- [ ] Complete voiceover and music
- [ ] All graphics and effects
- [ ] Full end card (10 seconds)
- [ ] Captions embedded or separate SRT
- [ ] Chapter markers in description:
  ```
  0:00 Introduction
  0:15 The Problem
  0:30 The Solution
  0:45 Live Demo
  2:00 Technical Details
  2:15 Get Started
  ```

### Twitter (Shortened Version)
**Format:** 1920x1080 or 1280x720, MAX 2:20 duration

- [ ] Shorter intro (1 second)
- [ ] Cut Scene 2 (The Problem) to 5 seconds
- [ ] Keep one demo scene only
- [ ] Shorter end card (5 seconds)
- [ ] Faster pacing throughout
- [ ] MUST have captions (auto-play on mute)
- [ ] File size under 512MB
- [ ] First 3 seconds are CRITICAL (autoplay)

### LinkedIn (Professional Version)
**Format:** 1920x1080, 2:15-2:30 duration

- [ ] Same as YouTube
- [ ] Professional tone emphasized
- [ ] Captions required
- [ ] Clear CTA at end
- [ ] Consider square format (1080x1080) for feed

### Instagram Feed (1:1 Square)
**Format:** 1080x1080, MAX 60 seconds

- [ ] Reframe to square (zoom/crop)
- [ ] Much faster pacing
- [ ] Keep ONE key demo scene
- [ ] Shorter intro/outro
- [ ] Bold, large text (mobile-friendly)
- [ ] Captions essential
- [ ] First 3 seconds grab attention

### Instagram Stories / TikTok (Vertical)
**Format:** 1080x1920 (9:16), 15-60 seconds

- [ ] Reframe to vertical
- [ ] Extreme crop on important areas
- [ ] One demo only
- [ ] Fast cuts, energetic
- [ ] Large text, high contrast
- [ ] Trending music (if appropriate)
- [ ] Strong hook in first 2 seconds

---

## Quality Control Checklist

### Visual Check

- [ ] **Throughout video:**
  - [ ] No typos in text overlays
  - [ ] All text readable at 720p
  - [ ] Cursor visible and smooth
  - [ ] No stuttering or lag
  - [ ] Smooth frame rate (30fps)
  - [ ] Color consistent
  - [ ] No compression artifacts visible

- [ ] **Graphics:**
  - [ ] High resolution (no pixelation)
  - [ ] Aligned properly
  - [ ] Animations smooth
  - [ ] No graphics cut off at edges

### Audio Check

- [ ] **Quality:**
  - [ ] Voice clear and intelligible
  - [ ] No background noise
  - [ ] No pops, clicks, or distortion
  - [ ] Music not overpowering
  - [ ] Consistent volume throughout
  - [ ] Proper fade in/out

- [ ] **Sync:**
  - [ ] Voiceover matches video actions
  - [ ] Music transitions at right moments
  - [ ] No audio/video drift

### Content Check

- [ ] **Accuracy:**
  - [ ] Install commands correct
  - [ ] URLs correct
  - [ ] Package names spelled correctly
  - [ ] Demo responses make sense
  - [ ] Timestamps accurate

- [ ] **Completeness:**
  - [ ] All scenes included
  - [ ] All key features shown
  - [ ] Clear call to action
  - [ ] Credits/attributions present
  - [ ] Disclaimer added (SportIntel)

---

## Export & Optimization

### Export Settings

#### YouTube (Primary)
```
Format: MP4 (H.264)
Resolution: 1920x1080
Frame Rate: 30fps
Bitrate: 8000-10000 Kbps (CBR or VBR)
Audio: AAC, 192kbps, 44.1kHz, Stereo
Color Space: Rec. 709
Render Quality: Maximum
```

#### Twitter
```
Format: MP4 (H.264)
Resolution: 1280x720 (720p recommended for size)
Frame Rate: 30fps
Bitrate: 6000-8000 Kbps
Audio: AAC, 128kbps, 44.1kHz
Max File Size: 512MB
Max Duration: 2:20
```

#### LinkedIn
```
Format: MP4 (H.264)
Resolution: 1920x1080 (or 1080x1080 square)
Frame Rate: 30fps
Bitrate: 8000 Kbps
Audio: AAC, 192kbps
Max Size: 5GB (but keep under 200MB for fast loading)
```

#### Instagram Feed
```
Format: MP4 (H.264)
Resolution: 1080x1080 (square)
Frame Rate: 30fps
Bitrate: 5000 Kbps
Audio: AAC, 128kbps
Max Duration: 60s
Aspect Ratio: 1:1
```

#### Instagram Stories/TikTok
```
Format: MP4 (H.264)
Resolution: 1080x1920 (vertical)
Frame Rate: 30fps
Bitrate: 5000 Kbps
Audio: AAC, 128kbps
Aspect Ratio: 9:16
Max Duration: 60s (IG), 10min (TikTok)
```

### File Naming Convention

```
openconductor-registry-mcp-demo-youtube-1080p.mp4
openconductor-registry-mcp-demo-twitter-720p.mp4
openconductor-sportintel-mcp-demo-youtube-1080p.mp4
openconductor-sportintel-mcp-demo-instagram-square.mp4
```

### Post-Export Check

- [ ] **Play full video:**
  - Watch at 100% volume
  - Check for any rendering errors
  - Verify file plays in VLC, QuickTime
  - Check file size reasonable

- [ ] **Test on platforms:**
  - Upload as unlisted/private test
  - Check how it looks on desktop
  - Check how it looks on mobile
  - Verify captions work
  - Check thumbnail appearance

---

## Thumbnail Creation

### YouTube Thumbnail (1280x720)

#### Registry MCP
- [ ] **Design elements:**
  - Large text: "Registry MCP"
  - Subtitle: "Discover 120+ MCP Servers"
  - Screenshot of Claude with server list
  - OpenConductor logo
  - High contrast colors (readable at small size)
  - Face/person (optional, increases CTR)

#### SportIntel MCP
- [ ] **Design elements:**
  - Large text: "SportIntel MCP"
  - Subtitle: "Live Sports in Claude"
  - Sports imagery (basketball, football)
  - Screenshot of live scores
  - Vibrant, energetic colors
  - Sport emojis: 🏀🏈⚾

### Design Tips
- [ ] Use 80pt+ font size
- [ ] High contrast (light text on dark background)
- [ ] Test at 320x180 (small size)
- [ ] No fine details (get lost at small sizes)
- [ ] Avoid clickbait
- [ ] Match video content

---

## Additional Deliverables

### Captions/Subtitles (SRT files)

- [ ] **Generate SRT:**
  - Use video editor auto-transcription
  - OR manually create from voiceover script
  - Time stamps precise (sync with audio)

- [ ] **Format:**
  ```
  1
  00:00:05,000 --> 00:00:08,000
  What if Claude could help you discover other MCP servers?

  2
  00:00:08,000 --> 00:00:11,000
  That's exactly what OpenConductor Registry does.
  ```

- [ ] **Export:**
  - registry-mcp-demo-captions.srt
  - sportintel-mcp-demo-captions.srt
  - Upload to YouTube separately

### Social Media Assets

- [ ] **Teaser GIFs (for Twitter):**
  - 5-second loops
  - Show key demo moments
  - Max 5MB size
  - Tools: GIPHY Capture, Photoshop

- [ ] **Quote Cards:**
  - 1080x1080
  - Pull quotes from video
  - "Discover 120+ MCP servers conversationally"
  - OpenConductor branding

### Video Descriptions

- [ ] **YouTube description template:**
  ```
  [Video Title]

  [Package Name] brings [key benefit] to Claude AI.

  🎯 TIMESTAMPS
  0:00 Introduction
  0:15 The Problem
  ...

  📦 INSTALL
  npm install -g @openconductor/[package-name]

  🔗 LINKS
  npm: [url]
  GitHub: [url]
  Docs: [url]

  🛠️ FEATURES
  - [feature 1]
  - [feature 2]
  ...

  Built for the Anthropic Model Context Protocol Challenge
  https://www.anthropic.com/mcp

  #ClaudeAI #MCP #AI #OpenSource
  ```

---

## Final Checklist Before Publishing

- [ ] **All versions exported:**
  - [ ] YouTube (1080p)
  - [ ] Twitter (720p)
  - [ ] LinkedIn (1080p)
  - [ ] Instagram Square (1080x1080)
  - [ ] Instagram Stories (1080x1920)

- [ ] **All assets created:**
  - [ ] Thumbnails
  - [ ] SRT caption files
  - [ ] Teaser GIFs
  - [ ] Quote cards

- [ ] **Quality verified:**
  - [ ] Watched each version fully
  - [ ] No errors or glitches
  - [ ] Captions sync properly
  - [ ] Audio levels correct

- [ ] **Metadata prepared:**
  - [ ] Video descriptions written
  - [ ] Hashtags researched
  - [ ] Upload schedules planned

- [ ] **Backup created:**
  - [ ] All raw footage backed up
  - [ ] Project files saved
  - [ ] Final exports archived

---

## Timeline Estimate

### Per Video:
- **Import & Assembly:** 2-3 hours
- **Graphics & Text:** 1-2 hours
- **Audio Enhancement:** 1 hour
- **Color Grading:** 30 minutes
- **Effects & Transitions:** 1 hour
- **Export & Testing:** 1 hour
- **Platform Variations:** 2 hours

**Total per video:** 8-10 hours
**Both videos:** 16-20 hours

---

## Tools & Resources

### Free Tools
- **DaVinci Resolve** - Professional editing
- **Audacity** - Audio editing
- **GIMP** - Graphics/thumbnails
- **Canva Free** - Thumbnail design
- **Kapwing** - Quick video edits

### Paid Tools (Optional)
- **Adobe Premiere Pro** - Professional editing
- **Adobe After Effects** - Motion graphics
- **Final Cut Pro** - macOS editing
- **ScreenFlow** - All-in-one recording/editing
- **Epidemic Sound** - Music library

---

You're ready to create professional demo videos! 🎬🚀
