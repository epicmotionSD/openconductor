# Demo 2: Multi-Server Install (8 seconds) - PowerShell Version
# Purpose: Show installing multiple servers at once
# Run this in Windows Terminal with: .\demo-2-multi-install.ps1

Clear-Host
Start-Sleep -Milliseconds 1000

Write-Host "PS > " -NoNewline -ForegroundColor Green
Write-Host "openconductor install openmemory brave-search filesystem"
Start-Sleep -Milliseconds 500
Write-Host ""

# Multi-install progress
Write-Host "⚙️  Installing 3 servers..." -ForegroundColor Cyan
Start-Sleep -Milliseconds 500
Write-Host ""

# Progress for each server
Write-Host "  📦 openmemory" -ForegroundColor White
Start-Sleep -Milliseconds 800
Write-Host "     ✅ Installed" -ForegroundColor Green
Start-Sleep -Milliseconds 300

Write-Host "  🔍 brave-search" -ForegroundColor White
Start-Sleep -Milliseconds 800
Write-Host "     ✅ Installed" -ForegroundColor Green
Start-Sleep -Milliseconds 300

Write-Host "  📁 filesystem" -ForegroundColor White
Start-Sleep -Milliseconds 800
Write-Host "     ✅ Installed" -ForegroundColor Green
Start-Sleep -Milliseconds 500

Write-Host ""
Write-Host "✨ Configured Claude Desktop" -ForegroundColor Yellow
Start-Sleep -Milliseconds 500
Write-Host "🎉 All 3 servers ready to use!" -ForegroundColor Green

Start-Sleep -Milliseconds 2000
