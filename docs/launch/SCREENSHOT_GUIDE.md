# Product Hunt Screenshots & GIF Guide

**Goal**: Create 6 high-quality screenshots + 1 demo GIF for Product Hunt
**Time needed**: 1-2 hours
**Tools**: Built-in screenshot tools + asciinema (for GIF)

---

## Setup First

### 1. Update Your CLI to Latest Version
```bash
npm install -g @openconductor/cli@latest
openconductor --version  # Should show 1.3.2
```

### 2. Create Assets Folder
```bash
mkdir -p docs/launch/assets
cd docs/launch/assets
```

### 3. Clean Your Terminal
```bash
# Make terminal look professional
clear
# Increase font size (Ctrl/Cmd + Plus a few times)
# Use a clean theme if possible
```

---

## Screenshot 1: Homepage Hero (EASY)

**What**: Your website homepage showing the main hero section

**Steps**:
1. Open browser to: https://openconductor.ai
2. Do hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Make browser window full width
4. Scroll to top
5. Take screenshot of hero section (top portion of page)

**Tools**:
- **Windows**: Win+Shift+S → Select area
- **Mac**: Cmd+Shift+4 → Select area
- **Linux**: Use Flameshot or Screenshot tool

**Save as**: `product-hunt-01-hero.png`

**What to capture**:
- Main headline: "Set up Claude for Coding/Writing/Data in 10 seconds"
- Tagline and description
- CTA buttons
- Trust indicators (220+ Servers, etc.)

---

## Screenshot 2: CLI Demo (MEDIUM)

**What**: Terminal showing the basic install flow

**Steps**:

1. **Open terminal and make it look good**:
   ```bash
   clear
   # Increase font size (Ctrl/Cmd + Plus)
   # Resize window to ~1200px wide
   ```

2. **Run these commands** (take screenshot after step 4):
   ```bash
   # Step 1: Show version
   openconductor --version

   # Step 2: Discover servers
   openconductor discover memory

   # Step 3: Show what we'll install
   echo "Installing openmemory server..."

   # Step 4: Show list (if you have servers installed)
   openconductor list
   ```

3. **Take screenshot**:
   - Include the terminal window
   - Show the commands and output
   - Make sure text is readable

**Save as**: `product-hunt-02-cli.png`

**Alternative if you want cleaner**:
```bash
# Create a clean demo
clear
cat << 'EOF'
$ npm install -g @openconductor/cli
✓ Installed @openconductor/cli@1.3.2

$ openconductor discover memory
🔍 Found 12 memory servers:

📦 openmemory (⭐ 1.6K)
   Hierarchical memory for AI agents
   Install: openconductor install openmemory

📦 zep-memory (⭐ 620)
   Long-term memory for AI
   Install: openconductor install zep-memory

$ openconductor install openmemory
✓ Installed openmemory successfully!
✓ Added to Claude Desktop config
✓ Ready to use in Claude!
EOF

# Then take screenshot
```

---

## Screenshot 3: Stack List (EASY)

**What**: Output of the stack list command

**Steps**:

1. **Clear terminal and run**:
   ```bash
   clear
   openconductor stack list
   ```

2. **Take screenshot showing**:
   - The stack list output
   - All 3 stacks (Essential, Coder, Writer)
   - Icons and descriptions

**Save as**: `product-hunt-03-stacks.png`

---

## Screenshot 4: Achievements (EASY)

**What**: The achievements display

**Steps**:

1. **Clear terminal and run**:
   ```bash
   clear
   openconductor achievements
   ```

2. **Take screenshot showing**:
   - Your unlocked achievements
   - Progress bars
   - Rank/points display

**Save as**: `product-hunt-04-achievements.png`

---

## Screenshot 5: Badge Generator (EASY)

**What**: Badge generation output

**Steps**:

1. **Clear terminal and run**:
   ```bash
   clear
   openconductor badge github-mcp --simple
   ```

2. **Take screenshot showing**:
   - The badge command
   - The generated badge markdown
   - The preview of what it looks like

**Alternative - show all templates**:
```bash
clear
openconductor badge-templates
```

**Save as**: `product-hunt-05-badges.png`

---

## Screenshot 6: Before/After Comparison (NEEDS DESIGN)

**What**: Side-by-side comparison of manual setup vs OpenConductor

**Option A: Use a Design Tool** (Recommended)

1. **Go to Figma** (https://figma.com) - Free account
2. **Create new design**: 1270x760px
3. **Split screen in half**:
   - LEFT: "Before OpenConductor (30 minutes)"
   - RIGHT: "After OpenConductor (30 seconds)"

**Left side content**:
```
❌ BEFORE (30+ minutes)

1. Find the right package
   $ npm search mcp-server-github

2. Install manually
   $ npm install -g @modelcontextprotocol/server-github

3. Edit JSON config
   $ vi ~/Library/Application Support/Claude/claude_desktop_config.json

4. Add complex configuration
   {
     "mcpServers": {
       "github": {
         "command": "node",
         "args": ["/usr/local/lib/..."],
         "env": {...}
       }
     }
   }

5. Deal with errors, restart, debug...
```

**Right side content**:
```
✅ AFTER (30 seconds)

$ npm install -g @openconductor/cli
$ openconductor install github-mcp

✓ Done!
```

**Option B: Use Terminal + Screenshot** (Easier)

Create a text file that shows the comparison:

```bash
cat > comparison.txt << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║                  BEFORE vs AFTER OpenConductor                 ║
╚════════════════════════════════════════════════════════════════╝

❌ BEFORE (30+ minutes)              ✅ AFTER (30 seconds)

1. npm search mcp-server-github      1. npm install -g @openconductor/cli
2. Find the right package            2. openconductor install github-mcp
3. npm install -g [package]
4. Open config file                  ✓ Done!
5. Edit JSON manually
6. Add paths, ports, env vars
7. Fix syntax errors
8. Restart Claude Desktop
9. Debug why it doesn't work
10. Repeat for each server...
EOF

cat comparison.txt
# Take screenshot
```

**Save as**: `product-hunt-06-comparison.png`

---

## GIF Demo: Terminal Recording (MEDIUM)

**What**: Animated GIF showing the install process

**Tool**: asciinema + agg (best for terminal recordings)

### Install Tools

```bash
# Install asciinema (terminal recorder)
sudo apt install asciinema  # Linux
# or
brew install asciinema      # Mac

# Install agg (converts to GIF)
cargo install --git https://github.com/asciinema/agg
# or download from: https://github.com/asciinema/agg/releases
```

### Alternative: Use Terminalizer (Easier)

```bash
npm install -g terminalizer

# Record
terminalizer record openconductor-demo

# During recording, run your demo commands (see below)
# When done, press Ctrl+D

# Render to GIF
terminalizer render openconductor-demo
```

### Demo Script (Record This)

**What to show** (keep it 15-20 seconds):

```bash
# Before recording: prepare terminal
clear
# Set nice size and font

# Start recording
# Then type these commands with small pauses:

# 1. Install (pretend, or use echo)
echo "$ npm install -g @openconductor/cli"
sleep 1
echo "✓ Installed @openconductor/cli@1.3.2"
sleep 1.5

# 2. Discover
echo ""
echo "$ openconductor discover memory"
sleep 1
echo "🔍 Found 12 memory servers"
echo ""
echo "📦 openmemory (⭐ 1.6K)"
echo "   Hierarchical memory for AI agents"
sleep 2

# 3. Install
echo ""
echo "$ openconductor install openmemory"
sleep 1
echo "✓ Installed openmemory successfully!"
echo "✓ Added to Claude Desktop config"
echo "✓ Ready to use in Claude!"
sleep 2

# End recording
```

### With asciinema + agg (Better Quality)

```bash
# 1. Record
asciinema rec openconductor-demo.cast

# Run your demo commands (same as above)
# Press Ctrl+D when done

# 2. Convert to GIF
agg openconductor-demo.cast openconductor-demo.gif

# 3. Optimize (optional)
# Use https://ezgif.com/optimize to reduce file size
```

**Save as**: `product-hunt-demo.gif`

**GIF should**:
- Be 15-20 seconds max
- Show the key flow: discover → install → done
- Have readable text (not too small)
- Be under 5MB

---

## Quick Demo Script Alternative

If recording tools are complex, create a **simple animated sequence**:

```bash
# Create a script that simulates typing
cat > demo.sh << 'EOF'
#!/bin/bash

# Function to simulate typing
type_text() {
    text="$1"
    for ((i=0; i<${#text}; i++)); do
        echo -n "${text:$i:1}"
        sleep 0.05
    done
    echo
}

clear
echo "OpenConductor Demo"
echo "=================="
echo ""
sleep 1

type_text "$ npm install -g @openconductor/cli"
sleep 0.5
echo "✓ Installed @openconductor/cli@1.3.2"
echo ""
sleep 1.5

type_text "$ openconductor install github-mcp"
sleep 0.5
echo "⚙️  Installing github-mcp..."
sleep 1
echo "✓ Installed successfully!"
echo "✓ Added to Claude Desktop config"
echo "✓ Ready to use in Claude!"
echo ""
sleep 2

echo "🎉 Done in 10 seconds!"
EOF

chmod +x demo.sh

# Record this with OBS or screen recorder
./demo.sh
```

---

## Screenshot Checklist

- [ ] 01-hero.png - Homepage hero section (1270x760px)
- [ ] 02-cli.png - CLI demo in terminal (1270x760px)
- [ ] 03-stacks.png - Stack list output (1270x760px)
- [ ] 04-achievements.png - Achievements display (1270x760px)
- [ ] 05-badges.png - Badge generator output (1270x760px)
- [ ] 06-comparison.png - Before/After graphic (1270x760px)
- [ ] demo.gif - Terminal demo animation (under 5MB)

---

## Image Quality Requirements

**Product Hunt Requirements**:
- Minimum: 1270x760px
- Maximum: 3840x2160px
- Format: PNG, JPG, or GIF
- File size: Under 5MB each

**Tips**:
- Use PNG for screenshots (better quality)
- Use GIF for animations
- Make sure text is readable
- Keep consistent styling
- Show real data/output

---

## Quick Start Commands

```bash
# Save all screenshots here
cd docs/launch/assets

# Take screenshots as you go
# Name them: product-hunt-01-hero.png, etc.

# Check file sizes
ls -lh *.png *.gif

# If too large, compress at:
# https://tinypng.com (PNG)
# https://ezgif.com/optimize (GIF)
```

---

## What Each Screenshot Should Communicate

1. **Homepage**: Professional, polished product
2. **CLI Demo**: Easy to use, clear output
3. **Stacks**: Multiple workflows available
4. **Achievements**: Engaging, gamified
5. **Badges**: Developer-friendly, viral growth
6. **Comparison**: Dramatic time savings (30min → 30sec)
7. **GIF**: See it working in real-time

---

## Need Help?

**If stuck on**:
- Recording terminal: Let me help you set up asciinema
- Creating comparison: I can help with Figma or text layout
- Optimizing images: I'll provide compression commands
- Anything else: Just ask!

**Ready to start?** Begin with Screenshot 1 (easiest) and work your way through!
