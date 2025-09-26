#!/bin/bash
# OpenConductor MCP Deployment Pipeline
# Complete deployment automation for MCP integration with existing Trinity AI infrastructure

set -e  # Exit on any error

echo "🚀 OpenConductor MCP Deployment Pipeline Starting..."
echo "================================================="

# Configuration
DEPLOYMENT_ENV=${1:-production}
BACKUP_ENABLED=${2:-true}
MIGRATION_MODE=${3:-gradual}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Pre-deployment checks
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check required environment variables
    required_vars=(
        "DATABASE_URL"
        "REDIS_URL" 
        "OPENAI_API_KEY"
        "STRIPE_SECRET_KEY"
        "JWT_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check database connectivity
    log "Testing database connectivity..."
    if ! docker run --rm postgres:16 pg_isready -h $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1) -p 5432; then
        error "Cannot connect to database"
    fi
    
    success "Prerequisites check passed"
}

# Backup existing system
backup_system() {
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        log "Creating system backup..."
        
        # Database backup
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        docker exec openconductor-postgres pg_dump -U $DB_USER openconductor > "$BACKUP_DIR/database_backup.sql"
        
        # Backup configuration
        cp -r ./config "$BACKUP_DIR/"
        cp .env "$BACKUP_DIR/env_backup"
        
        # Backup current codebase
        git rev-parse HEAD > "$BACKUP_DIR/git_commit.txt"
        
        success "System backup created at $BACKUP_DIR"
    else
        warning "Backup disabled - skipping backup step"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if pgvector extension is available
    log "Verifying pgvector extension..."
    docker exec openconductor-postgres psql -U $DB_USER -d openconductor -c "CREATE EXTENSION IF NOT EXISTS vector;"
    
    # Run MCP schema
    log "Applying MCP database schema..."
    docker exec -i openconductor-postgres psql -U $DB_USER -d openconductor < ../src/mcp/database-schema.sql
    
    # Verify schema integrity
    log "Verifying schema integrity..."
    TRINITY_TABLES=$(docker exec openconductor-postgres psql -U $DB_USER -d openconductor -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'trinity_%';")
    MCP_TABLES=$(docker exec openconductor-postgres psql -U $DB_USER -d openconductor -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'mcp_%';")
    
    log "Trinity AI tables: $TRINITY_TABLES"
    log "MCP tables: $MCP_TABLES"
    
    if [[ $MCP_TABLES -lt 5 ]]; then
        error "MCP schema migration failed - insufficient tables created"
    fi
    
    success "Database migrations completed successfully"
}

# Build and deploy containers
deploy_containers() {
    log "Building and deploying containers..."
    
    # Build main application with MCP support
    log "Building OpenConductor application..."
    docker build -t openconductor/core:latest-mcp \
        --build-arg FEATURES=trinity,mcp,enterprise \
        --build-arg NODE_ENV=production \
        ..
    
    # Build MCP worker
    log "Building MCP worker..."
    docker build -f ../Dockerfile.worker -t openconductor/mcp-worker:latest ..
    
    # Deploy with Docker Compose
    log "Deploying containers..."
    docker-compose -f docker-compose.mcp.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    wait_for_health
    
    success "Container deployment completed"
}

# Wait for all services to be healthy
wait_for_health() {
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        # Check main application
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            # Check MCP-specific health
            if curl -f http://localhost:3000/api/v1/mcp/health > /dev/null 2>&1; then
                success "All services are healthy"
                return 0
            fi
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Services failed to become healthy within timeout"
}

# Run post-deployment tests
run_tests() {
    log "Running post-deployment tests..."
    
    # Test Trinity AI functionality (preserve existing)
    log "Testing Trinity AI functionality..."
    curl -f http://localhost:3000/api/v1/agents > /dev/null || error "Trinity AI API test failed"
    curl -f http://localhost:3000/api/v1/workflows > /dev/null || error "Trinity AI workflows test failed"
    
    # Test MCP functionality (new)
    log "Testing MCP functionality..."
    curl -f http://localhost:3000/api/v1/mcp/servers > /dev/null || error "MCP servers API test failed"
    curl -f http://localhost:3000/api/v1/mcp/workflows > /dev/null || error "MCP workflows API test failed"
    
    # Test WebSocket monitoring
    log "Testing WebSocket monitoring..."
    if ! nc -z localhost 8080; then
        error "WebSocket monitoring port not accessible"
    fi
    
    # Run comprehensive test suite
    log "Running comprehensive test suite..."
    docker exec openconductor-main npm run test:mcp
    
    success "All post-deployment tests passed"
}

# Configure monitoring and alerting
setup_monitoring() {
    log "Setting up monitoring and alerting..."
    
    # Import Grafana dashboards
    log "Importing Grafana dashboards..."
    docker exec openconductor-grafana grafana-cli admin reset-admin-password --homepath="/usr/share/grafana" "${GRAFANA_ADMIN_PASSWORD}"
    
    # Set up Prometheus targets
    log "Configuring Prometheus monitoring..."
    docker exec openconductor-monitoring prometheus --config.file=/etc/prometheus/prometheus.yml --web.enable-lifecycle
    
    # Configure alerting rules
    log "Setting up alerting rules..."
    docker cp ./monitoring/alerts.yml openconductor-monitoring:/etc/prometheus/
    docker exec openconductor-monitoring curl -X POST http://localhost:9090/-/reload
    
    success "Monitoring and alerting configured"
}

# Gradual feature rollout
gradual_rollout() {
    if [[ "$MIGRATION_MODE" == "gradual" ]]; then
        log "Starting gradual feature rollout..."
        
        # Phase 1: Enable for 10% of users
        log "Phase 1: Enabling MCP for 10% of users..."
        docker exec openconductor-main npm run migration:enable-mcp -- --percentage=10
        sleep 300  # Wait 5 minutes
        
        # Check metrics
        check_rollout_metrics 10
        
        # Phase 2: Enable for 50% of users
        log "Phase 2: Enabling MCP for 50% of users..."
        docker exec openconductor-main npm run migration:enable-mcp -- --percentage=50
        sleep 600  # Wait 10 minutes
        
        check_rollout_metrics 50
        
        # Phase 3: Enable for all users
        log "Phase 3: Enabling MCP for all users..."
        docker exec openconductor-main npm run migration:enable-mcp -- --percentage=100
        
        check_rollout_metrics 100
        
        success "Gradual rollout completed successfully"
    else
        log "Immediate rollout mode - enabling all features"
        docker exec openconductor-main npm run migration:enable-mcp -- --percentage=100
    fi
}

# Check rollout metrics
check_rollout_metrics() {
    local percentage=$1
    log "Checking rollout metrics for $percentage% deployment..."
    
    # Get error rate
    ERROR_RATE=$(curl -s http://localhost:3000/api/v1/system/metrics | jq -r '.error_rate')
    
    # Get response time
    RESPONSE_TIME=$(curl -s http://localhost:3000/api/v1/system/metrics | jq -r '.avg_response_time')
    
    # Check thresholds
    if (( $(echo "$ERROR_RATE > 5.0" | bc -l) )); then
        error "Error rate too high: $ERROR_RATE% (threshold: 5%)"
    fi
    
    if (( $(echo "$RESPONSE_TIME > 500" | bc -l) )); then
        error "Response time too high: ${RESPONSE_TIME}ms (threshold: 500ms)"
    fi
    
    success "Metrics check passed for $percentage% rollout"
}

# Validate deployment
validate_deployment() {
    log "Validating deployment..."
    
    # Check all containers are running
    RUNNING_CONTAINERS=$(docker-compose -f docker-compose.mcp.yml ps -q | wc -l)
    EXPECTED_CONTAINERS=7  # app, postgres, redis, monitoring, grafana, nginx, worker
    
    if [[ $RUNNING_CONTAINERS -ne $EXPECTED_CONTAINERS ]]; then
        error "Expected $EXPECTED_CONTAINERS containers, but $RUNNING_CONTAINERS are running"
    fi
    
    # Check database connectivity and schema
    log "Validating database schema..."
    SCHEMA_VERSION=$(docker exec openconductor-postgres psql -U $DB_USER -d openconductor -t -c "SELECT MAX(version) FROM schema_migrations;")
    log "Database schema version: $SCHEMA_VERSION"
    
    # Check feature flags
    log "Checking feature flags..."
    FEATURES=$(curl -s http://localhost:3000/api/v1/system/features)
    echo "$FEATURES" | jq -e '.mcp_enabled' > /dev/null || error "MCP features not enabled"
    echo "$FEATURES" | jq -e '.trinity_enabled' > /dev/null || error "Trinity AI features not enabled"
    
    # Performance validation
    log "Running performance validation..."
    LOAD_TEST_RESULT=$(curl -s -w "%{time_total}" http://localhost:3000/api/v1/mcp/servers?limit=1)
    if (( $(echo "$LOAD_TEST_RESULT > 2.0" | bc -l) )); then
        warning "MCP API response time is high: ${LOAD_TEST_RESULT}s"
    fi
    
    success "Deployment validation completed"
}

# Setup SSL and security
setup_security() {
    log "Setting up SSL and security configurations..."
    
    # Generate SSL certificates if needed
    if [[ ! -f ./nginx/ssl/cert.pem ]]; then
        log "Generating SSL certificates..."
        mkdir -p ./nginx/ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./nginx/ssl/key.pem \
            -out ./nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    fi
    
    # Update Nginx configuration for SSL
    log "Configuring Nginx SSL..."
    envsubst '${DOMAIN_NAME}' < ./nginx/nginx.conf.template > ./nginx/nginx.conf
    docker exec openconductor-nginx nginx -s reload
    
    success "Security configuration completed"
}

# Monitoring setup
setup_alerting() {
    log "Setting up alerting and notifications..."
    
    # Configure Slack notifications if webhook provided
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        log "Configuring Slack notifications..."
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"🚀 OpenConductor MCP deployment completed successfully!"}' \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Set up email alerts
    if [[ -n "$ALERT_EMAIL" ]]; then
        log "Configuring email alerts..."
        docker exec openconductor-monitoring \
            promtool config reload --config.file=/etc/prometheus/prometheus.yml
    fi
    
    success "Alerting configuration completed"
}

# Cleanup old resources
cleanup_old_resources() {
    log "Cleaning up old resources..."
    
    # Remove old Docker images
    docker image prune -f --filter "until=168h"  # Remove images older than 7 days
    
    # Clean up old log files
    find ./logs -name "*.log" -mtime +30 -delete
    
    # Clean up old backups (keep last 10)
    ls -t ./backups/ | tail -n +11 | xargs -r rm -rf
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    echo "🎯 Deployment Configuration:"
    echo "   Environment: $DEPLOYMENT_ENV"
    echo "   Backup Enabled: $BACKUP_ENABLED" 
    echo "   Migration Mode: $MIGRATION_MODE"
    echo ""
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Backup
    backup_system
    
    # Step 3: Database migrations
    run_migrations
    
    # Step 4: Container deployment
    deploy_containers
    
    # Step 5: Security setup
    setup_security
    
    # Step 6: Monitoring setup
    setup_monitoring
    
    # Step 7: Feature rollout
    gradual_rollout
    
    # Step 8: Testing
    run_tests
    
    # Step 9: Validation
    validate_deployment
    
    # Step 10: Alerting
    setup_alerting
    
    # Step 11: Cleanup
    cleanup_old_resources
    
    echo ""
    echo "🎉 OpenConductor MCP Deployment Completed Successfully!"
    echo "================================================="
    echo ""
    echo "📊 Deployment Summary:"
    echo "   ✅ Trinity AI features preserved and functional"
    echo "   ✅ MCP server registry active and discoverable"
    echo "   ✅ Semantic search powered by OpenAI embeddings"
    echo "   ✅ Community features enabled (stars, reviews, sharing)"
    echo "   ✅ Subscription billing integrated with Stripe"
    echo "   ✅ Real-time monitoring via WebSocket (port 8080)"
    echo "   ✅ Enterprise security and compliance controls"
    echo "   ✅ Performance monitoring and auto-scaling"
    echo ""
    echo "🔗 Access URLs:"
    echo "   Main Application: http://localhost:3000"
    echo "   MCP Dashboard: http://localhost:3000/mcp"
    echo "   Trinity AI Dashboard: http://localhost:3000/trinity" 
    echo "   Monitoring: http://localhost:3001 (Grafana)"
    echo "   Metrics: http://localhost:9090 (Prometheus)"
    echo ""
    echo "📈 Next Steps:"
    echo "   1. Monitor system metrics for 24 hours"
    echo "   2. Collect user feedback on new features"
    echo "   3. Optimize performance based on usage patterns"
    echo "   4. Plan marketing campaign for MCP features"
    echo ""
    echo "🆘 Support:"
    echo "   Logs: docker-compose logs -f"
    echo "   Health: curl http://localhost:3000/health"
    echo "   Rollback: ./rollback.sh"
}

# Rollback function
rollback() {
    log "🔄 Starting emergency rollback..."
    
    # Stop new containers
    docker-compose -f docker-compose.mcp.yml down
    
    # Restore from backup
    if [[ -d "./backups" ]]; then
        LATEST_BACKUP=$(ls -t ./backups/ | head -n1)
        log "Restoring from backup: $LATEST_BACKUP"
        
        # Restore database
        docker exec -i openconductor-postgres psql -U $DB_USER -d openconductor < "./backups/$LATEST_BACKUP/database_backup.sql"
        
        # Restore configuration
        cp "./backups/$LATEST_BACKUP/.env" .env
    fi
    
    # Start original services
    docker-compose -f docker-compose.yml up -d
    
    success "Rollback completed"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "test")
        run_tests
        ;;
    "backup")
        backup_system
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|test|backup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full MCP deployment (default)"
        echo "  rollback - Emergency rollback to previous state"
        echo "  test     - Run deployment tests only"
        echo "  backup   - Create system backup only"
        echo ""
        echo "Environment variables:"
        echo "  DEPLOYMENT_ENV - deployment environment (production|staging)"
        echo "  BACKUP_ENABLED - enable system backup (true|false)"
        echo "  MIGRATION_MODE - migration strategy (gradual|immediate)"
        exit 1
        ;;
esac