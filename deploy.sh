#!/bin/bash

# Trinity AI Production Deployment Script
# Integrates FlexaSports Bloomberg Terminal design system with OpenConductor

set -e

echo "🚀 Starting Trinity AI Terminal Deployment..."
echo "📊 Bloomberg Terminal Design System Integration"

# Set environment variables
export TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
export BUILD_VERSION="v1.0.0-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

print_success "Prerequisites check passed"

# Stop any running development servers
print_status "Stopping development servers..."
pkill -f "npm run dev" || true
pkill -f "vite" || true

# Build frontend
print_status "Building Trinity AI Frontend with Bloomberg Terminal design..."
cd frontend
npm run build:prod
print_success "Frontend build completed"

# Build Docker images
cd ..
print_status "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache
print_success "Docker images built successfully"

# Deploy services
print_status "Deploying Trinity AI services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 10

# Health check
print_status "Performing health checks..."

# Check if frontend is responding
if curl -f http://localhost/health &> /dev/null; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend health check failed - may need more time to start"
fi

# Display deployment information
echo ""
echo "🎉 Trinity AI Terminal Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   • Build Version: ${BUILD_VERSION}"
echo "   • Frontend URL: http://localhost"
echo "   • Backend API: http://localhost:8080"
echo "   • Design System: FlexaSports Bloomberg Terminal"
echo "   • Architecture: Trinity AI (Oracle/Sentinel/Sage)"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   • Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   • Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "💡 Next Steps:"
echo "   • Configure SSL certificates for HTTPS"
echo "   • Set up backend API endpoints"
echo "   • Configure WebSocket for real-time agent coordination"
echo "   • Set up monitoring and analytics"
echo ""
print_success "Trinity AI Terminal is now running with FlexaSports design integration!"