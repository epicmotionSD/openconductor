#!/bin/bash

# OpenConductor - Demo Script for Screenshots
# This creates clean terminal output for screenshots

echo "════════════════════════════════════════════════════════════════"
echo "  OpenConductor Demo - Screenshot Helper"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "This script will help you create screenshots."
echo "Press Enter after each section to continue..."
echo ""

# Screenshot 2: CLI Demo
read -p "Press Enter for CLI Demo (Screenshot 2)..."
clear
echo "$ npm install -g @openconductor/cli"
echo "✓ Installed @openconductor/cli@1.3.2"
echo ""
echo "$ openconductor discover memory"
echo "🔍 Found 12 memory servers:"
echo ""
echo "📦 openmemory (⭐ 1.6K)"
echo "   Hierarchical memory for AI agents"
echo "   Install: openconductor install openmemory"
echo ""
echo "📦 zep-memory (⭐ 620)"
echo "   Long-term memory for AI"
echo "   Install: openconductor install zep-memory"
echo ""
echo "$ openconductor install openmemory"
echo "✓ Installed openmemory successfully!"
echo "✓ Added to Claude Desktop config"
echo "✓ Ready to use in Claude!"
echo ""
echo "📸 TAKE SCREENSHOT NOW - Save as: product-hunt-02-cli.png"
echo ""

# Screenshot 3: Stack List
read -p "Press Enter for Stack List (Screenshot 3)..."
clear
openconductor stack list
echo ""
echo "📸 TAKE SCREENSHOT NOW - Save as: product-hunt-03-stacks.png"
echo ""

# Screenshot 4: Achievements
read -p "Press Enter for Achievements (Screenshot 4)..."
clear
openconductor achievements
echo ""
echo "📸 TAKE SCREENSHOT NOW - Save as: product-hunt-04-achievements.png"
echo ""

# Screenshot 5: Badge
read -p "Press Enter for Badge Generator (Screenshot 5)..."
clear
openconductor badge github-mcp --simple
echo ""
echo "📸 TAKE SCREENSHOT NOW - Save as: product-hunt-05-badges.png"
echo ""

# Screenshot 6: Comparison
read -p "Press Enter for Before/After Comparison (Screenshot 6)..."
clear
cat << 'COMPARISON'
╔══════════════════════════════════════════════════════════════════════╗
║              BEFORE vs AFTER OpenConductor                           ║
╚══════════════════════════════════════════════════════════════════════╝

❌ BEFORE (30+ minutes)              ✅ AFTER (30 seconds)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. npm search mcp-server-github      $ npm install -g @openconductor/cli
                                      $ openconductor install github-mcp
2. Find the right package            
                                      ✓ Done in 10 seconds!
3. npm install -g [long-package]     

4. Open config file
   ~/Library/Application Support/
   Claude/claude_desktop_config.json

5. Edit JSON manually:
   {
     "mcpServers": {
       "github": {
         "command": "node",
         "args": ["/path/to/..."],
         "env": {"GITHUB_TOKEN": "..."}
       }
     }
   }

6. Fix syntax errors

7. Restart Claude Desktop

8. Debug why it doesn't work

9. Repeat for EACH server...

COMPARISON
echo ""
echo "📸 TAKE SCREENSHOT NOW - Save as: product-hunt-06-comparison.png"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ All terminal screenshots ready!"
echo ""
echo "Still need:"
echo "  1. Homepage screenshot (from browser)"
echo "  2. Demo GIF (see SCREENSHOT_GUIDE.md)"
echo ""
echo "All screenshots should be saved in:"
echo "  docs/launch/assets/"
echo "════════════════════════════════════════════════════════════════"
