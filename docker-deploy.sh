#!/bin/bash

# SportIntel Docker Deployment Script
# Extends OpenConductor with sports analytics microservices

set -e

# Configuration
COMPOSE_FILE="docker-compose.sportintel.yml"
ENV_FILE=".env.sportintel"
BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check available memory
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        MEMORY=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$MEMORY" -lt 8 ]; then
            log_warning "System has less than 8GB RAM. Performance may be impacted."
        fi
    fi
    
    log_success "System requirements check passed"
}

# Function to create environment file
create_env_file() {
    log_info "Creating environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << EOF
# SportIntel Environment Configuration
# Production deployment settings

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
POSTGRES_PASSWORD=sportintel_secure_$(date +%Y)_$(openssl rand -hex 8)
REDIS_PASSWORD=redis_secure_$(date +%Y)_$(openssl rand -hex 8)

# =============================================================================
# AUTHENTICATION & SECURITY
# =============================================================================
JWT_SECRET=sportintel_jwt_$(openssl rand -hex 32)
GRAFANA_ADMIN_PASSWORD=admin_$(openssl rand -hex 8)

# =============================================================================
# EXTERNAL API KEYS (Required)
# =============================================================================
# Sports data providers - REQUIRED for functionality
API_SPORTS_KEY=your_api_sports_key_here
MYSPORTS_FEEDS_KEY=your_mysports_feeds_key_here

# =============================================================================
# NOTIFICATION SERVICES (Optional)
# =============================================================================
# Slack integration
SLACK_BOT_TOKEN=
SLACK_CHANNEL=

# Discord integration  
DISCORD_BOT_TOKEN=
DISCORD_CHANNEL=

# Email notifications
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
EMAIL_FROM=

# Webhook notifications
WEBHOOK_URL=

# =============================================================================
# DEPLOYMENT CONFIGURATION
# =============================================================================
SPORTINTEL_VERSION=1.0.0
NODE_ENV=production
LOG_LEVEL=info

# Resource limits
MAX_CONNECTIONS=1000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000

# =============================================================================
# MONITORING & OBSERVABILITY
# =============================================================================
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
LOGGING_ENABLED=true

# External services (optional)
CLICKHOUSE_URL=
ELASTIC_SEARCH_URL=
EOF
        
        log_success "Environment file created at $ENV_FILE"
        log_warning "Please edit $ENV_FILE and add your API keys before deployment"
    else
        log_info "Environment file already exists"
    fi
}

# Function to create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    directories=(
        "config"
        "nginx"
        "monitoring"
        "logging"
        "ssl"
        "ml-models"
        "ml-cache"
        "$BACKUP_DIR"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    done
    
    log_success "Directory structure created"
}

# Function to generate SSL certificates
generate_ssl() {
    log_info "Generating SSL certificates for development..."
    
    if [ ! -f "ssl/sportintel.crt" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/sportintel.key \
            -out ssl/sportintel.crt \
            -subj "/C=US/ST=State/L=City/O=SportIntel/CN=localhost" 2>/dev/null
        
        log_success "SSL certificates generated"
    else
        log_info "SSL certificates already exist"
    fi
}

# Function to create configuration files
create_configs() {
    log_info "Creating configuration files..."
    
    # Redis configuration
    if [ ! -f "config/redis.conf" ]; then
        cat > "config/redis.conf" << EOF
# SportIntel Redis Configuration
bind 0.0.0.0
protected-mode yes
port 6379
timeout 0
tcp-keepalive 300
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./
maxmemory 1gb
maxmemory-policy allkeys-lru
EOF
        log_success "Redis configuration created"
    fi
    
    # Nginx configuration
    if [ ! -f "nginx/sportintel.conf" ]; then
        cat > "nginx/sportintel.conf" << EOF
# SportIntel Nginx Configuration
upstream openconductor_backend {
    server openconductor-core:3000;
}

upstream openconductor_websocket {
    server openconductor-core:3001;
}

upstream sportintel_frontend {
    server sportintel-frontend:3000;
}

server {
    listen 80;
    server_name localhost sportintel.local;
    
    # Redirect HTTP to HTTPS in production
    # return 301 https://\$server_name\$request_uri;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Frontend static files
    location / {
        proxy_pass http://sportintel_frontend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://openconductor_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
    }
    
    # WebSocket endpoints
    location /ws {
        proxy_pass http://openconductor_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Monitoring endpoints
    location /grafana/ {
        proxy_pass http://sportintel-grafana:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF
        log_success "Nginx configuration created"
    fi
}

# Function to pull required images
pull_images() {
    log_info "Pulling required Docker images..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    log_success "Docker images pulled successfully"
}

# Function to build custom images
build_images() {
    log_info "Building SportIntel custom images..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel
    log_success "Custom images built successfully"
}

# Function to start services
start_services() {
    log_info "Starting SportIntel services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    check_health
    
    log_success "SportIntel deployment completed!"
    show_access_info
}

# Function to check service health
check_health() {
    log_info "Checking service health..."
    
    services=(
        "http://localhost:3000/health:OpenConductor Core"
        "http://localhost:5432:TimescaleDB:skip"
        "http://localhost:6379:Redis:skip"
        "http://localhost:3004:Grafana:skip"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r url name skip <<< "$service"
        
        if [ "$skip" != "skip" ]; then
            if curl -f -s "$url" > /dev/null 2>&1; then
                log_success "$name is healthy"
            else
                log_warning "$name health check failed"
            fi
        fi
    done
}

# Function to show access information
show_access_info() {
    log_info "SportIntel Services Access Information:"
    echo ""
    echo "🏆 SportIntel Terminal: http://localhost:3003"
    echo "⚡ OpenConductor API: http://localhost:3000"
    echo "📊 Grafana Dashboard: http://localhost:3004 (admin:admin)"
    echo "📈 Prometheus: http://localhost:9090"
    echo "💾 TimescaleDB: localhost:5432 (sportintel:password)"
    echo "🔄 Redis: localhost:6379"
    echo ""
    log_success "All services are accessible!"
}

# Function to stop services
stop_services() {
    log_info "Stopping SportIntel services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_success "Services stopped"
}

# Function to backup data
backup_data() {
    log_info "Creating backup..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="$BACKUP_DIR/sportintel_backup_$timestamp.tar.gz"
    
    # Create backup
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T timescaledb \
        pg_dump -U sportintel sportintel_prod | gzip > "$backup_file.sql.gz"
    
    log_success "Backup created: $backup_file.sql.gz"
}

# Function to show logs
show_logs() {
    service=${1:-}
    if [ -n "$service" ]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$service"
    else
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
    fi
}

# Function to show status
show_status() {
    log_info "SportIntel Services Status:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# Function to clean up
cleanup() {
    log_warning "This will remove all SportIntel containers, volumes, and data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up SportIntel deployment..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --remove-orphans
        docker system prune -f
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Main script logic
case "$1" in
    "deploy")
        check_requirements
        create_env_file
        create_directories
        generate_ssl
        create_configs
        pull_images
        build_images
        start_services
        ;;
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        start_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "backup")
        backup_data
        ;;
    "health")
        check_health
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "SportIntel Docker Deployment Script"
        echo ""
        echo "Usage: $0 {deploy|start|stop|restart|status|logs|backup|health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (first time setup)"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - Show logs (optionally specify service name)"
        echo "  backup   - Create database backup"
        echo "  health   - Check service health"
        echo "  cleanup  - Remove all containers and data"
        echo ""
        echo "Examples:"
        echo "  $0 deploy          # Initial deployment"
        echo "  $0 logs openconductor-core  # View specific service logs"
        echo "  $0 backup          # Create backup"
        exit 1
        ;;
esac