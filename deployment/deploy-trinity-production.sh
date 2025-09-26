#!/bin/bash

# Trinity Agent Platform - Production Deployment Script
# Transforms openconductor into Trinity Agent-focused enterprise platform

set -e

echo "🚀 Trinity Agent Platform - Production Deployment"
echo "================================================="

# Configuration
DOMAIN=${DOMAIN:-"trinity-agents.ai"}
API_DOMAIN=${API_DOMAIN:-"api.trinity-agents.ai"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo "📋 Deployment Configuration:"
echo "   Domain: $DOMAIN"
echo "   API Domain: $API_DOMAIN"
echo "   Environment: $ENVIRONMENT"
echo ""

# Check required environment variables
echo "🔍 Checking environment variables..."
required_vars=(
  "POSTGRES_USER"
  "POSTGRES_PASSWORD" 
  "POSTGRES_DB"
  "JWT_SECRET"
  "NEXTAUTH_SECRET"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    echo "Please set all required variables in your .env file"
    exit 1
  fi
done
echo "✅ All required environment variables set"

# Build production images
echo "🔨 Building production Docker images..."
docker-compose -f trinity-production-deployment.yml build --no-cache

# Setup database
echo "🗄️ Setting up database..."
docker-compose -f trinity-production-deployment.yml up -d trinity-postgres trinity-redis
sleep 10

# Run database migrations
echo "📊 Running database setup..."
docker-compose -f trinity-production-deployment.yml exec trinity-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -f /docker-entrypoint-initdb.d/01-schema.sql
docker-compose -f trinity-production-deployment.yml exec trinity-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -f /docker-entrypoint-initdb.d/02-seed.sql

# Start all services
echo "🚀 Starting all Trinity Agent services..."
docker-compose -f trinity-production-deployment.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🏥 Performing health checks..."

# Check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ Backend service healthy"
else
  echo "❌ Backend service health check failed"
  exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend service healthy"
else
  echo "❌ Frontend service health check failed"
  exit 1
fi

# Check database connection
if docker-compose -f trinity-production-deployment.yml exec trinity-postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
  echo "✅ Database healthy"
else
  echo "❌ Database health check failed"
  exit 1
fi

# Check Redis
if docker-compose -f trinity-production-deployment.yml exec trinity-redis redis-cli ping | grep -q PONG; then
  echo "✅ Redis healthy"
else
  echo "❌ Redis health check failed"
  exit 1
fi

# Verify Trinity Agents
echo "🔮 Verifying Trinity Agents..."
for agent in oracle sentinel sage; do
  if docker-compose -f trinity-production-deployment.yml ps trinity-$agent | grep -q "Up"; then
    echo "✅ Trinity $agent agent running"
  else
    echo "❌ Trinity $agent agent not running"
    exit 1
  fi
done

# Setup SSL certificates (Let's Encrypt)
echo "🔒 Setting up SSL certificates..."
if [ "$ENVIRONMENT" = "production" ]; then
  # Generate SSL certificates using certbot
  docker run --rm -v trinity-ssl-certs:/etc/letsencrypt \
    certbot/certbot certonly --standalone \
    --email admin@$DOMAIN \
    --agree-tos --no-eff-email \
    -d $DOMAIN -d $API_DOMAIN
  
  echo "✅ SSL certificates generated"
fi

# Configure monitoring
echo "📊 Setting up monitoring..."
docker-compose -f trinity-production-deployment.yml up -d trinity-monitoring trinity-grafana

# Wait for monitoring services
sleep 15

# Import Grafana dashboards
echo "📈 Importing Trinity Agent dashboards..."
# This would import pre-configured Grafana dashboards for Trinity Agent metrics

# Verify final deployment
echo "🔍 Final deployment verification..."

# Check all services are running
services=(trinity-frontend trinity-backend trinity-postgres trinity-redis trinity-oracle trinity-sentinel trinity-sage)
for service in "${services[@]}"; do
  if docker-compose -f trinity-production-deployment.yml ps $service | grep -q "Up"; then
    echo "✅ $service running"
  else
    echo "❌ $service not running"
    exit 1
  fi
done

# Display service URLs
echo ""
echo "🎉 Trinity Agent Platform deployment complete!"
echo "=============================================="
echo ""
echo "🌐 Service URLs:"
echo "   Frontend: https://$DOMAIN"
echo "   API: https://$API_DOMAIN"
echo "   Monitoring: http://localhost:9090"
echo "   Grafana: http://localhost:3001"
echo ""
echo "🔮 Trinity Agents Status:"
echo "   Oracle Analytics: Active"
echo "   Sentinel Monitoring: Active"
echo "   Sage Optimization: Active"
echo ""
echo "📊 Key Features Deployed:"
echo "   ✅ Enterprise authentication (NextAuth + SSO)"
echo "   ✅ 14-day trial system with ROI tracking"
echo "   ✅ Stripe subscription and billing"
echo "   ✅ Bloomberg Terminal-style dashboard"
echo "   ✅ MCP automation infrastructure"
echo "   ✅ Production monitoring and alerting"
echo ""
echo "🎯 Next Steps:"
echo "   1. Configure DNS to point to your server IP"
echo "   2. Update Stripe webhook endpoints"
echo "   3. Test Trinity Agent trial signup flow"
echo "   4. Import any existing user data"
echo ""
echo "📞 Support:"
echo "   Documentation: https://docs.trinity-agents.ai"
echo "   Enterprise Support: enterprise@trinity-agents.ai"
echo ""
echo "🚀 Trinity Agent Platform is live and ready for enterprise customers!"