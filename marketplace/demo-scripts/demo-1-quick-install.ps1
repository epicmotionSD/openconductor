# Demo 1: Quick Install (5-7 seconds) - PowerShell Version
# Purpose: Show the speed of installation
# Run this in Windows Terminal with: .\demo-1-quick-install.ps1

# Clear screen for clean recording
Clear-Host

# Pause for 1 second
Start-Sleep -Milliseconds 1000

# Discovery command
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "openconductor discover memory"
Start-Sleep -Milliseconds 500

# Simulated discovery output
Write-Host ""
Write-Host "🔍 Searching for 'memory' servers..." -ForegroundColor Cyan
Start-Sleep -Milliseconds 300
Write-Host ""
Write-Host "📦 openmemory" -ForegroundColor White
Write-Host "   ⭐ 1,640 stars | 👥 42 contributors" -ForegroundColor Gray
Write-Host "   💾 Hierarchical memory for AI agents" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 zep-memory-mcp" -ForegroundColor White
Write-Host "   ⭐ 620 stars | 👥 18 contributors" -ForegroundColor Gray
Write-Host "   💬 Conversational memory for AI" -ForegroundColor Gray
Write-Host ""

# Pause to let viewers read results
Start-Sleep -Milliseconds 2000

# Install command
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "openconductor install openmemory"
Start-Sleep -Milliseconds 500
Write-Host ""

# Installation progress
Write-Host "⚙️  Installing openmemory..." -ForegroundColor Cyan
Start-Sleep -Milliseconds 800
Write-Host "📦 Downloading package..." -ForegroundColor Gray
Start-Sleep -Milliseconds 800
Write-Host "✅ Package installed" -ForegroundColor Green
Start-Sleep -Milliseconds 500
Write-Host "⚙️  Configuring Claude Desktop..." -ForegroundColor Cyan
Start-Sleep -Milliseconds 800
Write-Host "✨ Added to claude_desktop_config.json" -ForegroundColor Yellow
Start-Sleep -Milliseconds 500
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Ready to use in Claude Desktop" -ForegroundColor Green

# Hold on success for 2 seconds
Start-Sleep -Milliseconds 2000
