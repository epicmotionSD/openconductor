#!/bin/bash

###############################################################################
# OpenConductor Terminal Demo Recorder
# Automates terminal recordings for demo videos
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/../v1.2.0-automated/terminal-recordings"
DELAY_BETWEEN_COMMANDS=2
TYPING_SPEED=0.05  # seconds per character

echo -e "${BLUE}🎬 OpenConductor Terminal Demo Recorder${NC}\n"

# Create output directory
mkdir -p "$OUTPUT_DIR"

###############################################################################
# Helper Functions
###############################################################################

# Simulate typing (for realistic terminal recordings)
type_command() {
    local cmd="$1"
    local char
    for (( i=0; i<${#cmd}; i++ )); do
        char="${cmd:$i:1}"
        echo -n "$char"
        sleep "$TYPING_SPEED"
    done
    echo
}

# Record a command with output
record_command() {
    local name="$1"
    local command="$2"
    local output_file="${OUTPUT_DIR}/${name}.txt"

    echo -e "${GREEN}Recording: ${name}${NC}"

    # Create a clean recording
    {
        echo "$ ${command}"
        echo "============================================"
        eval "$command" 2>&1
        echo "============================================"
        echo ""
    } > "$output_file"

    echo -e "${GREEN}✓ Saved: ${output_file}${NC}\n"
    sleep "$DELAY_BETWEEN_COMMANDS"
}

# Record with manual typing simulation (for screen recording)
record_interactive() {
    local name="$1"
    local command="$2"

    echo -e "${YELLOW}Interactive mode: ${name}${NC}"
    echo -e "${YELLOW}Type the following command:${NC}"
    echo -e "${BLUE}${command}${NC}\n"

    read -p "Press ENTER when ready to execute..."
    eval "$command"

    sleep "$DELAY_BETWEEN_COMMANDS"
}

###############################################################################
# Demo Scenarios
###############################################################################

hero_video_demo() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Hero Video Terminal Recordings${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

    # Scene 1: Show openconductor stack list
    record_command "01-stack-list" "openconductor stack list"

    # Scene 2: Install Coder Stack
    record_command "02-install-coder" "openconductor stack install coder"

    # Scene 3: Show stack details
    record_command "03-stack-show-coder" "openconductor stack show coder"

    # Scene 4: List installed servers (after install)
    record_command "04-list-after-install" "openconductor list"
}

coder_stack_demo() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Coder Stack Demo Recordings${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

    record_command "coder-01-list-stacks" "openconductor stack list"
    record_command "coder-02-show-details" "openconductor stack show coder"
    record_command "coder-03-install" "openconductor stack install coder"
    record_command "coder-04-verify" "openconductor list"
}

writer_stack_demo() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Writer Stack Demo Recordings${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

    record_command "writer-01-show-details" "openconductor stack show writer"
    record_command "writer-02-install" "openconductor stack install writer"
    record_command "writer-03-verify" "openconductor list"
}

essential_stack_demo() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Essential Stack Demo Recordings${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

    record_command "essential-01-show-details" "openconductor stack show essential"
    record_command "essential-02-install" "openconductor stack install essential"
}

comparison_demo() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Old vs New Comparison${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

    # Old way (manual)
    echo -e "${YELLOW}Showing the old painful way...${NC}"
    record_command "old-01-search" "openconductor search github"
    record_command "old-02-install-one" "openconductor install github-mcp"
    record_command "old-03-install-two" "openconductor install filesystem-mcp"

    # New way (stacks)
    echo -e "${YELLOW}Showing the new easy way...${NC}"
    record_command "new-01-stack-install" "openconductor stack install coder"
}

###############################################################################
# Interactive Recording Mode (for screen capture)
###############################################################################

interactive_demo() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Interactive Screen Recording Mode${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

    echo -e "${YELLOW}START YOUR SCREEN RECORDING NOW${NC}"
    echo -e "${YELLOW}This will guide you through the demo with pauses${NC}\n"

    read -p "Press ENTER when recording has started..."

    sleep 2

    record_interactive "Stack List" "openconductor stack list"
    record_interactive "Show Coder Stack" "openconductor stack show coder"
    record_interactive "Install Coder Stack" "openconductor stack install coder"
    record_interactive "Verify Installation" "openconductor list"

    echo -e "\n${GREEN}✅ Demo complete! Stop your screen recording.${NC}"
}

###############################################################################
# Main Menu
###############################################################################

show_menu() {
    echo -e "\n${BLUE}Select demo to record:${NC}"
    echo "  1) Hero Video Demo"
    echo "  2) Coder Stack Demo"
    echo "  3) Writer Stack Demo"
    echo "  4) Essential Stack Demo"
    echo "  5) Comparison Demo (Old vs New)"
    echo "  6) Interactive Mode (for screen recording)"
    echo "  7) All Demos"
    echo "  q) Quit"
    echo
    read -p "Choice: " choice

    case $choice in
        1) hero_video_demo ;;
        2) coder_stack_demo ;;
        3) writer_stack_demo ;;
        4) essential_stack_demo ;;
        5) comparison_demo ;;
        6) interactive_demo ;;
        7)
            hero_video_demo
            coder_stack_demo
            writer_stack_demo
            essential_stack_demo
            comparison_demo
            ;;
        q|Q) exit 0 ;;
        *)
            echo "Invalid choice"
            show_menu
            ;;
    esac
}

###############################################################################
# Entry Point
###############################################################################

# Check if openconductor is installed
if ! command -v openconductor &> /dev/null; then
    echo -e "${YELLOW}⚠ openconductor CLI not found!${NC}"
    echo "Install with: npm install -g @openconductor/cli"
    exit 1
fi

# Check CLI version
VERSION=$(openconductor --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo -e "${GREEN}OpenConductor CLI version: ${VERSION}${NC}\n"

# Run based on argument or show menu
if [ $# -eq 0 ]; then
    show_menu
else
    case "$1" in
        --hero) hero_video_demo ;;
        --coder) coder_stack_demo ;;
        --writer) writer_stack_demo ;;
        --essential) essential_stack_demo ;;
        --comparison) comparison_demo ;;
        --interactive) interactive_demo ;;
        --all)
            hero_video_demo
            coder_stack_demo
            writer_stack_demo
            essential_stack_demo
            ;;
        *)
            echo "Usage: $0 [--hero|--coder|--writer|--essential|--comparison|--interactive|--all]"
            exit 1
            ;;
    esac
fi

echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Recording Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "\nRecordings saved to: ${OUTPUT_DIR}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "  1. Review terminal recordings in ${OUTPUT_DIR}"
echo "  2. Use these for screen capture or editing reference"
echo "  3. Generate slides with: node generate-slides.js"
echo "  4. Generate scripts with: node generate-video-scripts.js"
