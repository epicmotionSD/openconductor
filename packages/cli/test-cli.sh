#!/bin/bash

# OpenConductor CLI Local Testing Script
# Tests all major CLI functionality locally

set -e

echo "🧪 Testing OpenConductor CLI locally..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_API_URL="${OPENCONDUCTOR_API_URL:-http://localhost:3001/v1}"
TEST_CONFIG_DIR="/tmp/openconductor-test"
TEST_CONFIG_PATH="$TEST_CONFIG_DIR/claude_desktop_config.json"

echo -e "${BLUE}Setting up test environment...${NC}"
mkdir -p "$TEST_CONFIG_DIR"

# Set environment variables for testing
export OPENCONDUCTOR_API_URL="$TEST_API_URL"
export DEBUG=true

echo -e "${BLUE}Test environment ready${NC}"
echo "  API URL: $TEST_API_URL"
echo "  Config Dir: $TEST_CONFIG_DIR"
echo "  Config Path: $TEST_CONFIG_PATH"
echo ""

# Function to run CLI command with error handling
run_cli() {
    local cmd="$1"
    local description="$2"
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Command: node bin/openconductor.js $cmd"
    echo "----------------------------------------"
    
    if node bin/openconductor.js $cmd; then
        echo -e "${GREEN}✓ PASSED: $description${NC}"
    else
        echo -e "${RED}✗ FAILED: $description${NC}"
        return 1
    fi
    
    echo ""
    sleep 1
}

# Function to test API connectivity
test_api_connectivity() {
    echo -e "${BLUE}Testing API connectivity...${NC}"
    
    if curl -s -f "$TEST_API_URL/servers" > /dev/null; then
        echo -e "${GREEN}✓ API is reachable${NC}"
    else
        echo -e "${RED}✗ API is not reachable at $TEST_API_URL${NC}"
        echo "  Make sure the API server is running:"
        echo "  cd packages/api && pnpm run dev"
        exit 1
    fi
    echo ""
}

# Test basic CLI functionality
test_basic_commands() {
    echo -e "${BLUE}Testing basic CLI commands...${NC}"
    
    # Test help
    run_cli "--help" "Show help"
    
    # Test version
    run_cli "--version" "Show version"
    
    echo -e "${GREEN}✓ Basic commands working${NC}"
    echo ""
}

# Test discovery commands
test_discovery() {
    echo -e "${BLUE}Testing discovery commands...${NC}"
    
    # Test discover without query
    run_cli "discover --limit 5 --no-interactive" "Discover servers (no query)"
    
    # Test discover with query
    run_cli "discover memory --limit 3 --no-interactive" "Search for memory servers"
    
    # Test discover with category filter
    run_cli "discover --category database --limit 3 --no-interactive" "Filter by database category"
    
    echo -e "${GREEN}✓ Discovery commands working${NC}"
    echo ""
}

# Test configuration commands
test_configuration() {
    echo -e "${BLUE}Testing configuration commands...${NC}"
    
    # Test list (should be empty initially)
    run_cli "list --config $TEST_CONFIG_PATH" "List servers (empty)"
    
    # Create minimal config file (non-interactive)
    echo '{"mcpServers":{},"globalShortcut":"Cmd+Shift+."}' > "$TEST_CONFIG_PATH"
    
    # Test list after config creation
    run_cli "list --config $TEST_CONFIG_PATH" "List servers after init"
    
    echo -e "${GREEN}✓ Configuration commands working${NC}"
    echo ""
}

# Test installation workflow (dry run only)
test_installation() {
    echo -e "${BLUE}Testing installation workflow...${NC}"
    
    # Test dry run installation
    run_cli "install mcp-memory --config $TEST_CONFIG_PATH --dry-run --yes" "Install server (dry run)"
    
    echo -e "${GREEN}✓ Installation workflow working${NC}"
    echo ""
}

# Test error handling
test_error_handling() {
    echo -e "${BLUE}Testing error handling...${NC}"
    
    # Test non-existent server
    echo -e "${YELLOW}Testing: Non-existent server (should fail gracefully)${NC}"
    echo "Command: node bin/openconductor.js install nonexistent-server-xyz --config $TEST_CONFIG_PATH --yes"
    echo "----------------------------------------"
    
    if node bin/openconductor.js install nonexistent-server-xyz --config $TEST_CONFIG_PATH --yes 2>/dev/null; then
        echo -e "${RED}✗ UNEXPECTED: Should have failed for non-existent server${NC}"
    else
        echo -e "${GREEN}✓ PASSED: Error handled gracefully${NC}"
    fi
    echo ""
    
    # Test invalid category
    echo -e "${YELLOW}Testing: Invalid category (should fail gracefully)${NC}"
    echo "Command: node bin/openconductor.js discover --category invalid-category"
    echo "----------------------------------------"
    
    if node bin/openconductor.js discover --category invalid-category --no-interactive 2>/dev/null; then
        echo -e "${RED}✗ UNEXPECTED: Should have failed for invalid category${NC}"
    else
        echo -e "${GREEN}✓ PASSED: Validation error handled gracefully${NC}"
    fi
    echo ""
}

# Test SDK functionality
test_sdk() {
    echo -e "${BLUE}Testing SDK functionality...${NC}"

    # Get absolute path to current directory
    local CLI_DIR="$(pwd)"

    cat > /tmp/test-sdk.mjs <<EOF
import { OpenConductorSDK } from '${CLI_DIR}/src/lib/sdk.js';

async function testSDK() {
  const sdk = new OpenConductorSDK({
    apiUrl: process.env.OPENCONDUCTOR_API_URL
  });

  try {
    // Test health check
    const health = await sdk.checkAPIHealth();
    console.log('API Health:', health.healthy ? '✓' : '✗');

    // Test search
    const searchResults = await sdk.searchServers('memory', { limit: 2 });
    console.log('Search Results:', searchResults.servers.length, 'servers found');

    // Test categories
    const categories = await sdk.getCategories();
    console.log('Categories:', categories.categories.length, 'categories found');

    console.log('✓ SDK test completed successfully');
  } catch (error) {
    console.error('✗ SDK test failed:', error.message);
    process.exit(1);
  }
}

testSDK();
EOF

    echo -e "${YELLOW}Testing: SDK functionality${NC}"
    echo "Command: node /tmp/test-sdk.mjs"
    echo "----------------------------------------"

    if node /tmp/test-sdk.mjs; then
        echo -e "${GREEN}✓ PASSED: SDK functionality working${NC}"
    else
        echo -e "${RED}✗ FAILED: SDK test failed${NC}"
    fi

    rm -f /tmp/test-sdk.mjs
    echo ""
}

# Main test execution
main() {
    echo -e "${BLUE}🚀 Starting OpenConductor CLI Test Suite${NC}"
    echo ""
    
    # Check if we're in the right directory
    if [[ ! -f "bin/openconductor.js" ]]; then
        echo -e "${RED}✗ Error: Must run from CLI package directory${NC}"
        echo "  cd packages/cli && ./test-cli.sh"
        exit 1
    fi
    
    # Run test suites
    test_api_connectivity
    test_basic_commands
    test_discovery
    test_configuration
    test_installation
    test_error_handling
    test_sdk
    
    # Cleanup
    echo -e "${BLUE}Cleaning up test environment...${NC}"
    rm -rf "$TEST_CONFIG_DIR"
    
    echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}CLI is ready for development and testing${NC}"
    echo ""
    echo "Next steps:"
    echo "  • Link CLI globally: npm link"
    echo "  • Test commands: openconductor discover"
    echo "  • Make changes and test locally"
    echo "  • Run test suite: ./test-cli.sh"
}

# Run main function
main "$@"