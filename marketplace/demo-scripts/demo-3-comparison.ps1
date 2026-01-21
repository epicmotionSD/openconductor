# Demo 3: Before/After Comparison (10 seconds)
# Purpose: Show how much easier OpenConductor is vs manual setup
# Run this in Windows Terminal with: .\demo-3-comparison.ps1

Clear-Host
Start-Sleep -Milliseconds 1000

# Show "Before" label
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host " BEFORE: Manual Setup" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Start-Sleep -Milliseconds 800

# Manual setup steps (abbreviated)
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "git clone https://github.com/..."
Start-Sleep -Milliseconds 600
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "cd openmemory && npm install"
Start-Sleep -Milliseconds 600
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "npm run build"
Start-Sleep -Milliseconds 600
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "# Edit claude_desktop_config.json manually..."
Start-Sleep -Milliseconds 600
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "# Restart Claude Desktop..."
Start-Sleep -Milliseconds 600
Write-Host ""
Write-Host "❌ 10+ minutes, multiple steps" -ForegroundColor Red
Write-Host ""

Start-Sleep -Milliseconds 1500

# Clear for "After"
Clear-Host

# Show "After" label
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host " AFTER: OpenConductor" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Start-Sleep -Milliseconds 800

# One simple command
Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "openconductor install openmemory"
Start-Sleep -Milliseconds 500
Write-Host ""

Write-Host "⚙️  Installing..." -ForegroundColor Cyan
Start-Sleep -Milliseconds 1000
Write-Host "✅ Installed" -ForegroundColor Green
Start-Sleep -Milliseconds 500
Write-Host "✨ Configured" -ForegroundColor Yellow
Start-Sleep -Milliseconds 500
Write-Host "🎉 Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Done in 3 seconds" -ForegroundColor Green
Write-Host ""

Start-Sleep -Milliseconds 2000
