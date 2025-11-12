#!/bin/bash
# setup-openconductor-mcp.sh

echo "Setting up OpenConductor MCP Configuration for Windows/WSL..."

# Update npm first (optional but recommended)
echo "Updating npm..."
npm install -g npm@latest

# Install required MCP servers globally (with correct package names)
echo "Installing MCP servers..."
npm install -g \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-postgresql \
  @modelcontextprotocol/server-github \
  @modelcontextprotocol/server-git

# Note: @modelcontextprotocol/server-fetch doesn't exist yet
# We'll use alternative solutions

# Windows config path from WSL
CONFIG_DIR="/mnt/c/Users/$(cmd.exe /c echo %USERNAME% 2>/dev/null | tr -d '\r')/AppData/Roaming/Claude"

# Create config directory if it doesn't exist
echo "Creating config directory at: $CONFIG_DIR"
mkdir -p "$CONFIG_DIR"

# Backup existing config if it exists
if [ -f "$CONFIG_DIR/claude_desktop_config.json" ]; then
  cp "$CONFIG_DIR/claude_desktop_config.json" "$CONFIG_DIR/claude_desktop_config.backup.json"
  echo "✅ Backed up existing configuration"
fi

# Create the configuration file
cat > "$CONFIG_DIR/claude_desktop_config.json" << 'EOF'
{
  "mcpServers": {
    "openconductor-filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/roizen/projects/openconductor"
      ]
    },
    "openconductor-database": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgresql",
        "postgresql://localhost:5432/openconductor"
      ],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token-here"
      }
    },
    "git-openconductor": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-git",
        "--repository",
        "/home/roizen/projects/openconductor"
      ]
    }
  }
}
EOF

echo "✅ Configuration file created at: $CONFIG_DIR/claude_desktop_config.json"
echo ""
echo "⚠️  IMPORTANT: You need to:"
echo "1. Edit the config file to add your GitHub token"
echo "2. Completely quit Claude Desktop (not just close the window)"
echo "3. Restart Claude Desktop"
echo "4. Look for the 🔌 icon in the conversation interface"