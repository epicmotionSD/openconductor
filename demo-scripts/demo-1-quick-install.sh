#!/bin/bash
# Demo 1: Quick Install (5-7 seconds)
# Purpose: Show the speed of installation

# Clear screen for clean recording
clear

# Pause for 1 second
sleep 1

# Discovery command
echo "$ openconductor discover memory"
sleep 0.5

# Simulated discovery output
echo ""
echo "🔍 Searching for 'memory' servers..."
sleep 0.3
echo ""
echo "📦 openmemory"
echo "   ⭐ 1,640 stars | 👥 42 contributors"
echo "   💾 Hierarchical memory for AI agents"
echo ""
echo "📦 zep-memory-mcp"
echo "   ⭐ 620 stars | 👥 18 contributors"
echo "   💬 Conversational memory for AI"
echo ""

# Pause to let viewers read results
sleep 2

# Install command
echo "$ openconductor install openmemory"
sleep 0.5
echo ""

# Installation progress
echo "⚙️  Installing openmemory..."
sleep 0.8
echo "📦 Downloading package..."
sleep 0.8
echo "✅ Package installed"
sleep 0.5
echo "⚙️  Configuring Claude Desktop..."
sleep 0.8
echo "✨ Added to claude_desktop_config.json"
sleep 0.5
echo "🎉 Installation complete!"
echo ""
echo "✓ Ready to use in Claude Desktop"

# Hold on success for 2 seconds
sleep 2
