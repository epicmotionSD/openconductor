#!/bin/bash
# Demo 2: Multi-Server Install (8 seconds)
# Purpose: Show installing multiple servers at once

clear
sleep 1

echo "$ openconductor install openmemory brave-search filesystem"
sleep 0.5
echo ""

# Multi-install progress
echo "⚙️  Installing 3 servers..."
sleep 0.5
echo ""

# Progress for each server
echo "  📦 openmemory"
sleep 0.8
echo "     ✅ Installed"
sleep 0.3

echo "  🔍 brave-search"
sleep 0.8
echo "     ✅ Installed"
sleep 0.3

echo "  📁 filesystem"
sleep 0.8
echo "     ✅ Installed"
sleep 0.5

echo ""
echo "✨ Configured Claude Desktop"
sleep 0.5
echo "🎉 All 3 servers ready to use!"

sleep 2
