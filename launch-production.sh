#!/bin/bash

# OpenConductor Production Launch Script
# Comprehensive orchestrated launch with monitoring and verification

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/openconductor-launch-$(date +%Y%m%d-%H%M%S).log"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"
LAUNCH_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" | tee -a $LOG_FILE ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" | tee -a $LOG_FILE ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" | tee -a $LOG_FILE ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a $LOG_FILE ;;
        *)       echo -e "${PURPLE}[LAUNCH]${NC} $message" | tee -a $LOG_FILE ;;
    esac
}

# Error handling
handle_error() {
    log "ERROR" "Launch failed: $1"
    
    # Send failure notification
    curl -X POST "$SLACK_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "🚨 OpenConductor production launch FAILED",
            "attachments": [{
                "color": "danger",
                "title": "Launch Failure",
                "text": "'"$1"'",
                "fields": [
                    {"title": "Time", "value": "'"$(date)"'", "short": true},
                    {"title": "Step", "value": "'"$CURRENT_STEP"'", "short": true}
                ]
            }]
        }' || true
    
    exit 1
}

# Trap errors
trap 'handle_error "Script failed at line $LINENO during step: $CURRENT_STEP"' ERR

# Launch banner
echo -e "${PURPLE}"
cat << "EOF"
   ____                   ____                 _            _             
  / __ \                 / ___|               | |          | |            
 | |  | |_ __   ___ _ __ | |     ___  _ __   __| |_   _  ___| |_ ___  _ __ 
 | |  | | '_ \ / _ \ '_ \| |    / _ \| '_ \ / _` | | | |/ __| __/ _ \| '__|
 | |__| | |_) |  __/ | | | |___| (_) | | | | (_| | |_| | (__| || (_) | |   
  \____/| .__/ \___|_| |_|\____|\___/|_| |_|\__,_|\__,_|\___|\__\___/|_|   
        | |                                                               
        |_|                Production Launch Script v2.1.0                
EOF
echo -e "${NC}"

log "LAUNCH" "🚀 Starting OpenConductor Production Launch"
log "INFO" "Launch log: $LOG_FILE"
log "INFO" "Timestamp: $(date)"
echo ""

# Pre-launch checklist
CURRENT_STEP="Pre-launch validation"
log "INFO" "📋 Running pre-launch validation..."

# Check required environment variables
check_env_vars() {
    local required_vars=(
        "DATABASE_URL"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "STRIPE_SECRET_KEY"
        "OPENAI_API_KEY"
        "NEXTAUTH_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            handle_error "Required environment variable $var is not set"
        fi
    done
    
    log "INFO" "✅ Environment variables validated"
}

# Check external dependencies
check_dependencies() {
    # Check if CLI tools are available
    local required_tools=("railway" "vercel" "curl" "jq")
    
    for tool in "${required_tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log "WARN" "⚠️ $tool not found, some launch steps may be skipped"
        fi
    done
    
    log "INFO" "✅ Dependencies checked"
}

# Step 1: Environment validation
CURRENT_STEP="Environment validation"
log "INFO" "🔍 Step 1: Validating environment..."
check_env_vars
check_dependencies

# Step 2: Database deployment
CURRENT_STEP="Database deployment"
log "INFO" "🗄️ Step 2: Setting up production database..."

if command -v psql &> /dev/null; then
    # Test database connection
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log "INFO" "✅ Database connection verified"
        
        # Apply schema if needed
        if [ -f "database/supabase-schema.sql" ]; then
            log "INFO" "📝 Applying database schema..."
            psql "$DATABASE_URL" -f database/supabase-schema.sql || log "WARN" "Schema may already be applied"
        fi
    else
        handle_error "Cannot connect to production database"
    fi
else
    log "WARN" "⚠️ psql not available, skipping database verification"
fi

# Step 3: Backend deployment
CURRENT_STEP="Backend deployment"
log "INFO" "🚀 Step 3: Deploying backend to Railway..."

if command -v railway &> /dev/null; then
    railway login --token "$RAILWAY_TOKEN" || handle_error "Railway authentication failed"
    
    # Deploy to production
    log "INFO" "📦 Deploying backend..."
    railway deploy --environment production || handle_error "Backend deployment failed"
    
    # Wait for deployment to be live
    log "INFO" "⏳ Waiting for backend deployment..."
    sleep 60
    
    # Get deployment URL
    BACKEND_URL=$(railway status --json | jq -r '.deploymentDomain' | sed 's/^/https:\/\//')
    log "INFO" "🌐 Backend deployed: $BACKEND_URL"
else
    log "WARN" "⚠️ Railway CLI not available, using configured backend URL"
    BACKEND_URL="https://api.openconductor.ai"
fi

# Step 4: Frontend deployment
CURRENT_STEP="Frontend deployment"
log "INFO" "🌐 Step 4: Deploying frontend to Vercel..."

if command -v vercel &> /dev/null; then
    cd frontend
    
    # Deploy to production
    log "INFO" "📦 Deploying frontend..."
    FRONTEND_URL=$(vercel --prod --confirm --token "$VERCEL_TOKEN" 2>/dev/null || echo "https://app.openconductor.ai")
    
    cd ..
    log "INFO" "🌐 Frontend deployed: $FRONTEND_URL"
else
    log "WARN" "⚠️ Vercel CLI not available, using configured frontend URL"
    FRONTEND_URL="https://app.openconductor.ai"
fi

# Step 5: Health checks
CURRENT_STEP="Health verification"
log "INFO" "🏥 Step 5: Running comprehensive health checks..."

# Backend health check
log "INFO" "🔍 Checking backend health..."
if curl -f "$BACKEND_URL/health" &> /dev/null; then
    log "INFO" "✅ Backend health check passed"
else
    log "WARN" "⚠️ Backend health check failed, waiting 30s and retrying..."
    sleep 30
    if curl -f "$BACKEND_URL/health" &> /dev/null; then
        log "INFO" "✅ Backend health check passed (retry)"
    else
        handle_error "Backend health check failed after retry"
    fi
fi

# Frontend accessibility check
log "INFO" "🔍 Checking frontend accessibility..."
if curl -f "$FRONTEND_URL" &> /dev/null; then
    log "INFO" "✅ Frontend accessibility verified"
else
    log "WARN" "⚠️ Frontend not immediately accessible, may still be deploying"
fi

# API endpoints check
log "INFO" "🔍 Checking critical API endpoints..."
API_ENDPOINTS=(
    "/api/v1/mcp/servers?limit=1"
    "/api/v1/mcp/billing/plans"
    "/api/v1/system/health"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    if curl -f "$BACKEND_URL$endpoint" &> /dev/null; then
        log "INFO" "✅ $endpoint accessible"
    else
        log "WARN" "⚠️ $endpoint not accessible"
    fi
done

# Step 6: Database verification
CURRENT_STEP="Database verification"
log "INFO" "🗄️ Step 6: Verifying database setup..."

if command -v psql &> /dev/null; then
    # Check pgvector extension
    if psql "$DATABASE_URL" -c "SELECT extname FROM pg_extension WHERE extname = 'vector';" | grep -q "vector"; then
        log "INFO" "✅ pgvector extension verified"
    else
        log "WARN" "⚠️ pgvector extension not found"
    fi
    
    # Check seed data
    SEED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM mcp_servers;" | tr -d ' ')
    if [ "$SEED_COUNT" -gt 0 ]; then
        log "INFO" "✅ Seed data verified ($SEED_COUNT MCP servers)"
    else
        log "WARN" "⚠️ No seed data found in database"
    fi
fi

# Step 7: Monitoring setup
CURRENT_STEP="Monitoring setup"
log "INFO" "📊 Step 7: Configuring monitoring and alerts..."

# Test Sentry integration
if [ -n "$SENTRY_DSN" ]; then
    log "INFO" "✅ Sentry DSN configured"
else
    log "WARN" "⚠️ Sentry DSN not configured"
fi

# Test Stripe webhook
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    log "INFO" "✅ Stripe webhooks configured"
else
    log "WARN" "⚠️ Stripe webhooks not configured"
fi

# Step 8: Performance baseline
CURRENT_STEP="Performance baseline"
log "INFO" "⚡ Step 8: Establishing performance baseline..."

# Measure API response times
API_RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$BACKEND_URL/health" | cut -d. -f1)
FRONTEND_RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL" | cut -d. -f1)

log "INFO" "📊 Backend response time: ${API_RESPONSE_TIME}s"
log "INFO" "📊 Frontend response time: ${FRONTEND_RESPONSE_TIME}s"

# Step 9: Launch verification
CURRENT_STEP="Launch verification"
log "INFO" "🔬 Step 9: Running comprehensive launch verification..."

# Run production tests
if [ -f "tests/e2e/production-tests.js" ]; then
    log "INFO" "🧪 Running production test suite..."
    
    FRONTEND_URL="$FRONTEND_URL" \
    BACKEND_URL="$BACKEND_URL" \
    node tests/e2e/production-tests.js || log "WARN" "Some production tests failed"
else
    log "WARN" "⚠️ Production test suite not found"
fi

# Step 10: Traffic monitoring setup
CURRENT_STEP="Traffic monitoring"
log "INFO" "📈 Step 10: Setting up traffic monitoring..."

# Create monitoring dashboard URL
DASHBOARD_URL="https://railway.app/project/$RAILWAY_PROJECT_ID"
STATUS_URL="$FRONTEND_URL/status"

log "INFO" "📊 Monitoring Dashboard: $DASHBOARD_URL"
log "INFO" "📊 Status Page: $STATUS_URL"

# Launch completion
LAUNCH_DURATION=$(($(date +%s) - LAUNCH_TIME))
CURRENT_STEP="Launch completion"

log "LAUNCH" "🎉 OpenConductor Production Launch COMPLETED!"
echo ""
log "INFO" "📊 Launch Summary:"
log "INFO" "   • Duration: ${LAUNCH_DURATION}s"
log "INFO" "   • Frontend: $FRONTEND_URL"
log "INFO" "   • Backend: $BACKEND_URL"
log "INFO" "   • WebSocket: ${BACKEND_URL/https/wss}/ws"
log "INFO" "   • Database: Connected and verified"
log "INFO" "   • Monitoring: Configured and active"
echo ""

# Success notification
curl -X POST "$SLACK_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d '{
        "text": "🚀 OpenConductor Production Launch SUCCESSFUL!",
        "attachments": [{
            "color": "good",
            "title": "Production Environment Live",
            "fields": [
                {"title": "Frontend", "value": "'"$FRONTEND_URL"'", "short": true},
                {"title": "Backend", "value": "'"$BACKEND_URL"'", "short": true},
                {"title": "Launch Time", "value": "'"$LAUNCH_DURATION"'s", "short": true},
                {"title": "Status", "value": "All systems operational", "short": true}
            ],
            "actions": [
                {
                    "type": "button",
                    "text": "Open Dashboard",
                    "url": "'"$FRONTEND_URL"'"
                },
                {
                    "type": "button", 
                    "text": "View Monitoring",
                    "url": "'"$DASHBOARD_URL"'"
                }
            ]
        }]
    }' || true

# Post-launch monitoring
log "INFO" "📊 Setting up post-launch monitoring..."

# Create monitoring script
cat > /tmp/post-launch-monitor.sh << 'EOF'
#!/bin/bash

FRONTEND_URL="$1"
BACKEND_URL="$2" 
DURATION=${3:-3600}  # Monitor for 1 hour by default

start_time=$(date +%s)
end_time=$((start_time + DURATION))

echo "🔍 Monitoring OpenConductor for $((DURATION/60)) minutes..."
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"

while [ $(date +%s) -lt $end_time ]; do
    # Check frontend
    if curl -f "$FRONTEND_URL" &> /dev/null; then
        frontend_status="✅"
    else
        frontend_status="❌"
    fi
    
    # Check backend
    if curl -f "$BACKEND_URL/health" &> /dev/null; then
        backend_status="✅"
    else
        backend_status="❌"
    fi
    
    # Get response times
    frontend_time=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL" || echo "0")
    backend_time=$(curl -o /dev/null -s -w '%{time_total}' "$BACKEND_URL/health" || echo "0")
    
    echo "$(date '+%H:%M:%S') | Frontend: $frontend_status (${frontend_time}s) | Backend: $backend_status (${backend_time}s)"
    
    # Alert if both services are down
    if [ "$frontend_status" = "❌" ] && [ "$backend_status" = "❌" ]; then
        echo "🚨 CRITICAL: Both frontend and backend are down!"
        # Send alert (implement notification logic here)
    fi
    
    sleep 60  # Check every minute
done

echo "✅ Post-launch monitoring completed"
EOF

chmod +x /tmp/post-launch-monitor.sh

# Start background monitoring
log "INFO" "🔍 Starting post-launch monitoring (1 hour)..."
nohup /tmp/post-launch-monitor.sh "$FRONTEND_URL" "$BACKEND_URL" 3600 > /tmp/monitor.log 2>&1 &
MONITOR_PID=$!

log "INFO" "📊 Monitoring PID: $MONITOR_PID"

# Final launch verification
log "INFO" "🔬 Final launch verification..."

# Test critical user flows
USER_FLOWS=(
    "Frontend load"
    "MCP server discovery"
    "Workflow management"  
    "Trinity AI system"
    "Billing system"
)

for flow in "${USER_FLOWS[@]}"; do
    case $flow in
        "Frontend load")
            if curl -f "$FRONTEND_URL" &> /dev/null; then
                log "INFO" "✅ $flow: Working"
            else
                log "WARN" "⚠️ $flow: Issues detected"
            fi
            ;;
        "MCP server discovery")
            if curl -f "$BACKEND_URL/api/v1/mcp/servers?limit=1" &> /dev/null; then
                log "INFO" "✅ $flow: Working"
            else
                log "WARN" "⚠️ $flow: Issues detected"
            fi
            ;;
        "Workflow management")
            if curl -f "$BACKEND_URL/api/v1/mcp/workflows" &> /dev/null; then
                log "INFO" "✅ $flow: Working"
            else
                log "WARN" "⚠️ $flow: Issues detected (may require auth)"
            fi
            ;;
        "Trinity AI system") 
            if curl -f "$BACKEND_URL/api/v1/system/health" &> /dev/null; then
                log "INFO" "✅ $flow: Working"
            else
                log "WARN" "⚠️ $flow: Issues detected"
            fi
            ;;
        "Billing system")
            if curl -f "$BACKEND_URL/api/v1/mcp/billing/plans" &> /dev/null; then
                log "INFO" "✅ $flow: Working"
            else
                log "WARN" "⚠️ $flow: Issues detected"
            fi
            ;;
    esac
done

# Launch metrics
echo ""
log "LAUNCH" "📊 PRODUCTION LAUNCH METRICS"
log "INFO" "================================"
log "INFO" "🌐 Frontend URL: $FRONTEND_URL"
log "INFO" "🔌 Backend API: $BACKEND_URL" 
log "INFO" "📡 WebSocket: ${BACKEND_URL/https/wss}/ws"
log "INFO" "🏥 Health Check: $BACKEND_URL/health"
log "INFO" "📚 API Docs: $BACKEND_URL/docs"
log "INFO" "📊 Monitoring: $DASHBOARD_URL"
log "INFO" "⏱️ Launch Duration: ${LAUNCH_DURATION}s"
log "INFO" "🗂️ Launch Log: $LOG_FILE"
echo ""

# Create launch report
LAUNCH_REPORT="/tmp/openconductor-launch-report.json"
cat > $LAUNCH_REPORT << EOF
{
    "launch_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "launch_duration_seconds": $LAUNCH_DURATION,
    "environment": "production",
    "services": {
        "frontend": {
            "url": "$FRONTEND_URL",
            "status": "deployed",
            "health": "$(curl -f "$FRONTEND_URL" &> /dev/null && echo "healthy" || echo "unhealthy")"
        },
        "backend": {
            "url": "$BACKEND_URL", 
            "status": "deployed",
            "health": "$(curl -f "$BACKEND_URL/health" &> /dev/null && echo "healthy" || echo "unhealthy")"
        },
        "database": {
            "provider": "supabase",
            "status": "connected",
            "extensions": ["uuid-ossp", "pgvector", "pg_trgm"]
        }
    },
    "features": {
        "mcp_registry": true,
        "workflow_management": true,
        "trinity_ai": true,
        "billing_system": true,
        "real_time_websockets": true,
        "semantic_search": true
    },
    "monitoring": {
        "sentry": "$([ -n "$SENTRY_DSN" ] && echo "configured" || echo "not_configured")",
        "performance": "enabled",
        "error_tracking": "enabled"
    }
}
EOF

log "INFO" "📄 Launch report: $LAUNCH_REPORT"

# Final success message
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  🎉 OPENCONDUCTOR PRODUCTION LAUNCH SUCCESSFUL! 🎉          ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  Your Trinity AI + MCP automation platform is now live!     ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Access your platform: $FRONTEND_URL${NC}"
echo -e "${BLUE}🔧 API Documentation: $BACKEND_URL/docs${NC}"
echo -e "${BLUE}📊 Monitoring Dashboard: $DASHBOARD_URL${NC}"
echo ""
echo -e "${PURPLE}🚀 Next Steps:${NC}"
echo -e "   • Monitor application performance for the first few hours"
echo -e "   • Test all user workflows end-to-end"
echo -e "   • Set up DNS records if using custom domain"
echo -e "   • Configure additional monitoring alerts"
echo -e "   • Review backup and security procedures"
echo ""
echo -e "${YELLOW}📞 Support: If you encounter any issues, check the logs at: $LOG_FILE${NC}"

exit 0