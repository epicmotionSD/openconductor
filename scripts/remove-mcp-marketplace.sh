#!/bin/bash

# Remove MCP Marketplace and Community Features
# Part of Trinity Agent Platform Reimagining

echo "🧹 Removing MCP marketplace and community features..."

# Remove community-focused MCP backend files
echo "Removing community backend files..."
rm -f src/mcp/community-features.ts
rm -f src/mcp/server-registry.ts
rm -f src/mcp/semantic-search-engine.ts

# Remove community directory entirely
echo "Removing community directory..."
rm -rf community/

# Remove revenue and sales directories (replaced with Trinity-focused billing)
echo "Removing old revenue/sales directories..."
rm -rf revenue/
rm -rf sales/

# Remove MCP marketplace frontend components
echo "Removing MCP marketplace UI components..."
rm -f frontend/src/components/mcp/MCPDashboard.tsx
rm -f frontend/src/components/mcp/MCPMinimalMode.tsx
rm -f frontend/src/components/mcp/MCPProfessionalMinimal.tsx
rm -f frontend/src/components/mcp/MCPQuickTrainer.tsx

# Keep only essential MCP files for Trinity Agent automation
echo "Preserving essential MCP files for agent automation..."
# These will be modified to support only Trinity Agent workflows:
# - src/mcp/mcp-integration.ts (modified)
# - src/mcp/analytics-engine.ts (modified)
# - src/mcp/performance-monitor.ts (kept)
# - src/mcp/realtime-monitor.ts (kept)

echo "✅ MCP marketplace cleanup complete!"
echo "📋 Summary:"
echo "  - Removed community features and server registry"
echo "  - Removed marketplace UI components"
echo "  - Preserved essential MCP infrastructure for Trinity Agents"
echo "  - Removed old revenue/sales systems"