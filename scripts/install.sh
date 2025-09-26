#!/usr/bin/env bash

# OpenConductor One-Line Installer
# Usage: curl -fsSL https://install.openconductor.ai | bash
# Or: npx @openconductor/install

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
OPENCONDUCTOR_VERSION="${OPENCONDUCTOR_VERSION:-latest}"
INSTALL_DIR="${OPENCONDUCTOR_INSTALL_DIR:-$HOME/.openconductor}"
FORCE_INSTALL="${FORCE_INSTALL:-false}"
SKIP_ONBOARDING="${SKIP_ONBOARDING:-false}"

# Global variables
DETECTED_ENVIRONMENT=""
RECOMMENDED_SERVERS=()
INSTALLATION_LOG=""

# Logging functions
log() {
    echo -e "${GREEN}[OpenConductor]${NC} $1"
    INSTALLATION_LOG+="\n[$(date)] $1"
}

warn() {
    echo -e "${YELLOW}[OpenConductor]${NC} ⚠️  $1"
    INSTALLATION_LOG+="\n[$(date)] WARNING: $1"
}

error() {
    echo -e "${RED}[OpenConductor]${NC} ❌ $1"
    INSTALLATION_LOG+="\n[$(date)] ERROR: $1"
}

success() {
    echo -e "${GREEN}[OpenConductor]${NC} ✅ $1"
    INSTALLATION_LOG+="\n[$(date)] SUCCESS: $1"
}

info() {
    echo -e "${BLUE}[OpenConductor]${NC} ℹ️  $1"
    INSTALLATION_LOG+="\n[$(date)] INFO: $1"
}

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
   ____                   _____                _            _             
  / __ \                 / ____|              | |          | |            
 | |  | |_ __   ___ _ __ | |     ___  _ __   __| |_   _  ___| |_ ___  _ __ 
 | |  | | '_ \ / _ \ '_ \| |    / _ \| '_ \ / _` | | | |/ __| __/ _ \| '__|
 | |__| | |_) |  __/ | | | |___| (_) | | | | (_| | |_| | (__| || (_) | |   
  \____/| .__/ \___|_| |_|\_____\___/|_| |_|\__,_|\__,_|\___|\__\___/|_|   
        | |                                                               
        |_|                                                               

        🚀 The Open-Source Intelligent Internal Developer Platform
        
EOF
    echo -e "${NC}"
    log "Starting OpenConductor installation..."
    log "This will take about 2-5 minutes and get you to your first working workflow in under 15 minutes!"
}

# Environment detection
detect_environment() {
    info "🔍 Detecting your development environment..."
    
    local env_info=""
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        env_info+="os:linux,"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        env_info+="os:macos,"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        env_info+="os:windows,"
    fi
    
    # Detect Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        env_info+="node:$node_version,"
        success "Found Node.js v$node_version"
    else
        warn "Node.js not detected - we'll help you install it"
        env_info+="node:missing,"
    fi
    
    # Detect npm/yarn/pnpm
    if command -v pnpm &> /dev/null; then
        env_info+="pm:pnpm,"
        success "Found pnpm package manager"
    elif command -v yarn &> /dev/null; then
        env_info+="pm:yarn,"
        success "Found Yarn package manager"
    elif command -v npm &> /dev/null; then
        env_info+="pm:npm,"
        success "Found npm package manager"
    fi
    
    # Detect development tools
    detect_dev_tools() {
        local tools=()
        
        # Version Control
        command -v git &> /dev/null && tools+=("git")
        
        # Container tools
        command -v docker &> /dev/null && tools+=("docker")
        command -v kubectl &> /dev/null && tools+=("kubernetes")
        
        # CI/CD
        [[ -f ".github/workflows" ]] && tools+=("github-actions")
        [[ -f ".gitlab-ci.yml" ]] && tools+=("gitlab-ci")
        [[ -f "Jenkinsfile" ]] && tools+=("jenkins")
        
        # Cloud CLIs
        command -v aws &> /dev/null && tools+=("aws-cli")
        command -v gcloud &> /dev/null && tools+=("gcp-cli")
        command -v az &> /dev/null && tools+=("azure-cli")
        
        # Monitoring
        [[ -d "prometheus" ]] || [[ -f "prometheus.yml" ]] && tools+=("prometheus")
        [[ -d "grafana" ]] && tools+=("grafana")
        
        # Databases
        command -v psql &> /dev/null && tools+=("postgresql")
        command -v mysql &> /dev/null && tools+=("mysql")
        command -v redis-cli &> /dev/null && tools+=("redis")
        
        # Communication
        [[ -f ".slack" ]] && tools+=("slack")
        
        if [[ ${#tools[@]} -gt 0 ]]; then
            env_info+="tools:$(IFS=\|; echo "${tools[*]}"),"
            success "Detected development tools: ${tools[*]}"
        fi
    }
    
    detect_dev_tools
    
    # Detect project type
    if [[ -f "package.json" ]]; then
        env_info+="project:nodejs,"
        success "Detected Node.js project"
    elif [[ -f "requirements.txt" ]] || [[ -f "pyproject.toml" ]]; then
        env_info+="project:python,"
        success "Detected Python project"
    elif [[ -f "Cargo.toml" ]]; then
        env_info+="project:rust,"
        success "Detected Rust project"
    elif [[ -f "go.mod" ]]; then
        env_info+="project:go,"
        success "Detected Go project"
    fi
    
    DETECTED_ENVIRONMENT="$env_info"
    info "Environment detection complete!"
}

# Install Node.js if missing
install_nodejs() {
    if ! command -v node &> /dev/null; then
        info "Installing Node.js..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install node
            else
                error "Please install Node.js from https://nodejs.org or install Homebrew first"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Use NodeSource repository for latest Node.js
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            error "Please install Node.js from https://nodejs.org for your operating system"
            exit 1
        fi
        
        success "Node.js installed successfully"
    fi
}

# Create installation directory
setup_install_directory() {
    info "Setting up installation directory: $INSTALL_DIR"
    
    if [[ -d "$INSTALL_DIR" ]] && [[ "$FORCE_INSTALL" != "true" ]]; then
        warn "OpenConductor is already installed. Use FORCE_INSTALL=true to reinstall."
        read -p "Continue with existing installation? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        mkdir -p "$INSTALL_DIR"
        mkdir -p "$INSTALL_DIR/data"
        mkdir -p "$INSTALL_DIR/logs"
        mkdir -p "$INSTALL_DIR/servers"
        mkdir -p "$INSTALL_DIR/workflows"
    fi
}

# Install OpenConductor core
install_openconductor_core() {
    info "Installing OpenConductor core platform..."
    
    cd "$INSTALL_DIR"
    
    # Initialize package.json if it doesn't exist
    if [[ ! -f "package.json" ]]; then
        cat > package.json << EOF
{
  "name": "openconductor-installation",
  "version": "1.0.0",
  "description": "OpenConductor platform installation",
  "private": true,
  "scripts": {
    "start": "openconductor start",
    "dev": "openconductor dev",
    "stop": "openconductor stop"
  }
}
EOF
    fi
    
    # Install OpenConductor
    if command -v pnpm &> /dev/null; then
        pnpm install @openconductor/core@$OPENCONDUCTOR_VERSION
    elif command -v yarn &> /dev/null; then
        yarn add @openconductor/core@$OPENCONDUCTOR_VERSION
    else
        npm install @openconductor/core@$OPENCONDUCTOR_VERSION
    fi
    
    success "OpenConductor core installed!"
}

# Generate intelligent server recommendations
generate_server_recommendations() {
    info "🤖 Analyzing your environment to recommend MCP servers..."
    
    # Parse environment info to generate recommendations
    local recommendations=()
    
    # Base recommendations for everyone
    recommendations+=("file-manager:Essential file operations")
    recommendations+=("git-tools:Git repository management")
    
    # Based on detected tools
    if [[ "$DETECTED_ENVIRONMENT" == *"docker"* ]]; then
        recommendations+=("docker-manager:Docker container management")
    fi
    
    if [[ "$DETECTED_ENVIRONMENT" == *"kubernetes"* ]]; then
        recommendations+=("k8s-operator:Kubernetes cluster operations")
    fi
    
    if [[ "$DETECTED_ENVIRONMENT" == *"aws-cli"* ]]; then
        recommendations+=("aws-toolkit:AWS cloud operations")
    fi
    
    if [[ "$DETECTED_ENVIRONMENT" == *"postgresql"* ]]; then
        recommendations+=("postgres-admin:PostgreSQL database management")
    fi
    
    if [[ "$DETECTED_ENVIRONMENT" == *"slack"* ]]; then
        recommendations+=("slack-integration:Team communication automation")
    fi
    
    if [[ "$DETECTED_ENVIRONMENT" == *"prometheus"* ]]; then
        recommendations+=("prometheus-metrics:Monitoring and alerting")
    fi
    
    # Project-specific recommendations
    if [[ "$DETECTED_ENVIRONMENT" == *"project:nodejs"* ]]; then
        recommendations+=("npm-manager:NPM package management")
        recommendations+=("node-toolkit:Node.js development tools")
    fi
    
    if [[ "$DETECTED_ENVIRONMENT" == *"project:python"* ]]; then
        recommendations+=("python-toolkit:Python development tools")
        recommendations+=("pip-manager:Python package management")
    fi
    
    RECOMMENDED_SERVERS=("${recommendations[@]}")
    
    success "Generated ${#RECOMMENDED_SERVERS[@]} personalized server recommendations!"
}

# Install recommended servers
install_recommended_servers() {
    if [[ ${#RECOMMENDED_SERVERS[@]} -eq 0 ]]; then
        return
    fi
    
    info "🚀 Installing your personalized MCP servers..."
    
    # Create a simple installation script that will be executed by the OpenConductor platform
    cat > "$INSTALL_DIR/auto-install-servers.json" << EOF
{
  "autoInstall": true,
  "servers": [
EOF
    
    local first=true
    for server_info in "${RECOMMENDED_SERVERS[@]}"; do
        local server_name=$(echo "$server_info" | cut -d: -f1)
        local server_desc=$(echo "$server_info" | cut -d: -f2-)
        
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$INSTALL_DIR/auto-install-servers.json"
        fi
        
        cat >> "$INSTALL_DIR/auto-install-servers.json" << EOF
    {
      "name": "$server_name",
      "description": "$server_desc",
      "autoInstall": true,
      "priority": "high"
    }
EOF
    done
    
    cat >> "$INSTALL_DIR/auto-install-servers.json" << EOF
  ]
}
EOF
    
    success "Server installation queue created!"
}

# Create initial configuration
create_initial_config() {
    info "📝 Creating your personalized configuration..."
    
    cat > "$INSTALL_DIR/openconductor.config.json" << EOF
{
  "version": "1.0.0",
  "environment": "$DETECTED_ENVIRONMENT",
  "installation": {
    "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "$OPENCONDUCTOR_VERSION",
    "autoConfigured": true
  },
  "trinity": {
    "oracle": {
      "enabled": true,
      "autoRecommendations": true
    },
    "sentinel": {
      "enabled": true,
      "autoMonitoring": true
    },
    "sage": {
      "enabled": true,
      "autoAdvice": true
    }
  },
  "servers": {
    "autoInstall": true,
    "recommendations": $(printf '%s\n' "${RECOMMENDED_SERVERS[@]}" | jq -R . | jq -s .)
  },
  "onboarding": {
    "completed": false,
    "skipRequested": $SKIP_ONBOARDING,
    "targetTime": 900
  }
}
EOF
    
    success "Configuration created!"
}

# Create quick start script
create_quick_start() {
    info "📋 Creating quick start commands..."
    
    cat > "$INSTALL_DIR/start.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting OpenConductor..."
cd "$(dirname "$0")"
npx @openconductor/core start --config openconductor.config.json
EOF
    
    cat > "$INSTALL_DIR/dev.sh" << 'EOF'
#!/bin/bash
echo "🛠️  Starting OpenConductor in development mode..."
cd "$(dirname "$0")"
npx @openconductor/core dev --config openconductor.config.json
EOF
    
    chmod +x "$INSTALL_DIR/start.sh"
    chmod +x "$INSTALL_DIR/dev.sh"
    
    success "Quick start scripts created!"
}

# Final setup and first run
complete_installation() {
    success "🎉 OpenConductor installation complete!"
    
    echo
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Installation Summary${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    echo -e "${BLUE}  📁 Installation Directory:${NC} $INSTALL_DIR"
    echo -e "${BLUE}  🤖 Recommended Servers:${NC} ${#RECOMMENDED_SERVERS[@]} servers queued for installation"
    echo -e "${BLUE}  ⚡ Trinity AI Agents:${NC} Oracle, Sentinel, and Sage enabled"
    echo -e "${BLUE}  🎯 Target Setup Time:${NC} 15 minutes to first workflow"
    echo
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Next Steps${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    echo -e "${YELLOW}  1. Start OpenConductor:${NC}"
    echo -e "     ${BLUE}cd $INSTALL_DIR && ./start.sh${NC}"
    echo
    echo -e "${YELLOW}  2. Open your browser:${NC}"
    echo -e "     ${BLUE}http://localhost:3000${NC}"
    echo
    echo -e "${YELLOW}  3. Complete the 15-minute onboarding:${NC}"
    echo -e "     ${BLUE}Follow the guided setup to create your first workflow${NC}"
    echo
    echo -e "${YELLOW}  4. Get help:${NC}"
    echo -e "     ${BLUE}https://docs.openconductor.ai${NC}"
    echo
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    
    if [[ "$SKIP_ONBOARDING" != "true" ]]; then
        echo -e "${GREEN}🚀 Ready to start your OpenConductor journey!${NC}"
        echo
        read -p "Would you like to start OpenConductor now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$INSTALL_DIR"
            ./start.sh
        fi
    fi
}

# Error handling
handle_error() {
    error "Installation failed at step: $1"
    echo
    echo "Installation log:"
    echo -e "$INSTALLATION_LOG"
    echo
    echo "Please report this issue at: https://github.com/openconductor/core/issues"
    exit 1
}

# Main installation flow
main() {
    trap 'handle_error "Unknown error"' ERR
    
    show_banner
    
    detect_environment || handle_error "Environment detection"
    
    install_nodejs || handle_error "Node.js installation"
    
    setup_install_directory || handle_error "Directory setup"
    
    install_openconductor_core || handle_error "Core installation"
    
    generate_server_recommendations || handle_error "Server recommendations"
    
    install_recommended_servers || handle_error "Server installation"
    
    create_initial_config || handle_error "Configuration creation"
    
    create_quick_start || handle_error "Quick start setup"
    
    complete_installation
}

# Run main installation
main "$@"