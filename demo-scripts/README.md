# OpenConductor Demo GIF Recording Guide

This folder contains ready-to-use scripts for creating professional demo GIFs.

## Quick Start (5 Minutes to First GIF)

### 1. Install ScreenToGif
- Download: https://www.screentogif.com/
- Choose portable version (no install needed)
- Launch ScreenToGif.exe

### 2. Setup Windows Terminal

**Option A: Manual Setup**
1. Open Windows Terminal
2. Press `Ctrl + ,` (Settings)
3. Font size: 18-20pt
4. Color scheme: One Half Dark or Campbell
5. Padding: 12px

**Option B: Use Our Config**
1. Open Windows Terminal Settings → Open JSON file
2. Copy content from `windows-terminal-config.json`
3. Paste into your settings
4. Save and restart terminal

### 3. Record Your First Demo

**Using PowerShell Scripts:**

```powershell
# Navigate to demo-scripts folder
cd C:\path\to\openconductor\demo-scripts

# Run the quick install demo
.\demo-1-quick-install.ps1
```

**Recording Steps:**
1. Open ScreenToGif → Click "Recorder"
2. Position window over terminal (resize to fit exactly)
3. Set FPS to 60 in recorder
4. Click F7 (Start Recording)
5. Run: `.\demo-1-quick-install.ps1`
6. Wait for script to complete
7. Click F8 (Stop Recording)

### 4. Edit and Export

1. In ScreenToGif editor:
   - Delete first 10-20 frames (startup)
   - Delete last 5-10 frames (cleanup)
   - Preview the loop

2. Export:
   - File → Save As → GIF
   - Encoder: FFmpeg (if installed) or System.Drawing
   - Frame rate: 15 FPS
   - Quality: 90
   - Save to: `../packages/frontend/public/demo/openconductor-demo.gif`

## Available Demo Scripts

### Demo 1: Quick Install (7 seconds)
**File:** `demo-1-quick-install.ps1`
**Shows:** Discovery → Install → Success
**Use for:** Landing page, Twitter, Product Hunt
**Target size:** < 3MB

```powershell
.\demo-1-quick-install.ps1
```

### Demo 2: Multi-Server Install (8 seconds)
**File:** `demo-2-multi-install.ps1`
**Shows:** Installing 3 servers at once
**Use for:** Power user demos, documentation
**Target size:** < 4MB

```powershell
.\demo-2-multi-install.ps1
```

## Recording Settings Cheat Sheet

### Windows Terminal Settings
```json
{
  "fontSize": 18,
  "fontFace": "Cascadia Code",
  "colorScheme": "OpenConductor High Contrast",
  "padding": "12"
}
```

### ScreenToGif Settings
```
Recording:
- FPS: 60 (record)
- Window: Fit to terminal exactly

Export:
- Format: GIF
- Encoder: FFmpeg
- FPS: 15 (export)
- Quality: 90
- Colors: 256
```

### File Size Targets
- Twitter: < 5MB (strict)
- Landing page: < 3MB (preferred)
- Documentation: < 10MB

## Optimization Tips

### If File Too Large:

1. **Reduce frame rate:**
   ```
   60 FPS → 20 FPS → 15 FPS → 10 FPS
   ```

2. **Reduce quality:**
   ```
   Quality 100 → 90 → 85 → 80
   ```

3. **Trim frames:**
   - Remove pauses
   - Keep only essential frames
   - Trim dead space

4. **Scale down:**
   - Resize to 90% if still too large

## Advanced: Using Terminalizer

### Install
```bash
npm install -g terminalizer
```

### Record
```bash
# Initialize config
terminalizer init openconductor

# Record (manual typing)
terminalizer record openconductor-demo

# Execute your commands manually
# Press Ctrl+D when done

# Render to GIF
terminalizer render openconductor-demo -o demo.gif
```

### Config (openconductor.yml)
```yaml
cols: 100
rows: 30
frameDelay: auto
quality: 100
theme:
  background: "#1e1e1e"
  foreground: "#d4d4d4"
fontFamily: "Cascadia Code, Consolas, monospace"
fontSize: 16
```

## Creating Custom Demos

Want to create your own demo? Copy and modify existing scripts:

```powershell
# Copy template
Copy-Item demo-1-quick-install.ps1 demo-custom.ps1

# Edit timing and content
notepad demo-custom.ps1

# Key functions to use:
Write-Host "Text" -ForegroundColor Green  # Colored output
Start-Sleep -Milliseconds 1000             # Pause (1 second)
Clear-Host                                 # Clear screen
```

## Color Reference for PowerShell

```powershell
# Available colors:
Black, DarkBlue, DarkGreen, DarkCyan
DarkRed, DarkMagenta, DarkYellow, Gray
DarkGray, Blue, Green, Cyan
Red, Magenta, Yellow, White

# Example usage:
Write-Host "Success!" -ForegroundColor Green
Write-Host "Error!" -ForegroundColor Red
Write-Host "Info" -ForegroundColor Cyan
```

## Troubleshooting

### Terminal text too small in GIF
- Increase font size to 20pt or larger
- Re-record with larger terminal

### GIF file too large
1. Reduce export FPS (15 → 10)
2. Reduce quality (90 → 85)
3. Trim unnecessary frames
4. Scale to 90% size

### Colors look washed out
- Use "OpenConductor High Contrast" color scheme
- Export with 256 colors (max for GIF)
- Avoid gradients and transparency

### Text not readable on mobile
- Minimum font size: 18pt
- High contrast colors only
- Test GIF on phone before publishing

### GIF doesn't loop smoothly
- Add 1-2 second delay on last frame
- Ensure clean start/end frames
- Preview loop in ScreenToGif editor

## Deployment

Once you have your GIF:

```bash
# Copy to public folder
cp demo.gif ../packages/frontend/public/demo/openconductor-demo.gif

# Commit and push
git add ../packages/frontend/public/demo/
git commit -m "Add demo GIF to landing page"
git push

# Deploy will happen automatically via Vercel
```

## Testing Checklist

Before publishing your GIF:

- [ ] File size < 5MB for Twitter
- [ ] Text readable on mobile (test on phone)
- [ ] Loops smoothly (no jarring restart)
- [ ] High contrast, readable colors
- [ ] Duration 5-10 seconds
- [ ] Shows clear value proposition
- [ ] No typos or errors visible
- [ ] Professional appearance

## Resources

- ScreenToGif: https://www.screentogif.com/
- Terminalizer: https://github.com/faressoft/terminalizer
- Cascadia Code Font: https://github.com/microsoft/cascadia-code
- GIF Optimization: https://ezgif.com/optimize

## Need Help?

If you run into issues:
1. Check the troubleshooting section
2. Review the guide in `GIF_CREATION_GUIDE.md`
3. Test with the provided demo scripts first
4. Verify Windows Terminal settings

---

**Ready to record? Start with demo-1-quick-install.ps1 and you'll have a professional GIF in 5 minutes!**
