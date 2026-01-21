# 5-Minute Quick Start: Create Your First Demo GIF

## Step 1: Download ScreenToGif (1 minute)
1. Go to https://www.screentogif.com/
2. Download "Portable" version
3. Extract and run ScreenToGif.exe

## Step 2: Setup Terminal (1 minute)
1. Open Windows Terminal
2. Press `Ctrl + ,` for Settings
3. Change these settings:
   - Font size: **18** or **20**
   - Color scheme: **One Half Dark** or **Campbell**
   - Padding: **12**

## Step 3: Record Demo (2 minutes)
1. In ScreenToGif, click **"Recorder"**
2. Position window over your terminal
3. In terminal, navigate to demo scripts:
   ```powershell
   cd C:\path\to\openconductor\demo-scripts
   ```
4. Click **F7** in ScreenToGif (Start Recording)
5. In terminal, run:
   ```powershell
   .\demo-1-quick-install.ps1
   ```
6. Wait for script to finish
7. Click **F8** in ScreenToGif (Stop Recording)

## Step 4: Export GIF (1 minute)
1. In ScreenToGif editor:
   - Delete first 10-20 frames (the startup frames)
   - Delete last 5-10 frames (cleanup frames)
   - Click **Play** to preview

2. Export:
   - Click **File → Save As**
   - Choose **GIF** format
   - Frame rate: **15 FPS**
   - Quality: **90**
   - File name: `openconductor-demo.gif`
   - Save location: `../packages/frontend/public/demo/`

## Step 5: Deploy (30 seconds)
```bash
git add packages/frontend/public/demo/openconductor-demo.gif
git commit -m "Add demo GIF to landing page"
git push
```

## Done! 🎉

Your demo GIF will automatically appear on the landing page after deployment.

## What to Record Next

Try these demos in order:
1. ✅ `demo-1-quick-install.ps1` (Start here)
2. `demo-2-multi-install.ps1` (Power user demo)
3. `demo-3-comparison.ps1` (Before/after comparison)

## Common Issues

**Text too small?**
→ Increase font size to 20pt in Terminal settings

**File too large?**
→ Reduce FPS from 15 to 10 when exporting

**GIF looks blurry?**
→ Use "One Half Dark" color scheme for better contrast

**Need help?**
→ Check README.md for detailed instructions

---

**Total Time: 5 minutes from download to deployed GIF!**
