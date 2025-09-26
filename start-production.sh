#!/bin/bash

# SportIntel Production Startup Script
# Standalone deployment with integrated data sources

echo "🚀 Starting SportIntel Production Environment..."

# Set environment variables
export NODE_ENV=production
export PORT=8080

# Create logs directory
mkdir -p logs

# Function to check if service is running
check_service() {
    local port=$1
    local name=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo "✅ $name is healthy on port $port"
            return 0
        fi
        echo "⏳ Waiting for $name (attempt $attempt/$max_attempts)..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name failed to start on port $port"
    return 1
}

# Start API Monitoring Dashboard
echo "📊 Starting API Monitoring Dashboard..."
node api-monitoring-dashboard.js > logs/monitoring.log 2>&1 &
MONITORING_PID=$!
echo "   API Monitoring Dashboard PID: $MONITORING_PID"

# Start SportIntel Bloomberg Terminal (standalone with integrated data sources)
echo "💼 Starting SportIntel Bloomberg Terminal..."
node sportintel-demo.js > logs/sportintel.log 2>&1 &
SPORTINTEL_PID=$!
echo "   SportIntel Terminal PID: $SPORTINTEL_PID"

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 5

# Final health check
check_service 8080 "SportIntel Terminal" || exit 1
check_service 3010 "API Monitoring Dashboard" || exit 1

echo ""
echo "✅ All services started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   SportIntel Bloomberg Terminal: http://localhost:8080"
echo "   API Monitoring Dashboard:     http://localhost:3010"
echo ""
echo "📊 Service Status:"
echo "   API Monitoring:     PID $MONITORING_PID"
echo "   SportIntel:         PID $SPORTINTEL_PID"
echo ""
echo "📋 Log Files:"
echo "   Monitoring:     logs/monitoring.log"
echo "   SportIntel:     logs/sportintel.log"
echo ""
echo "💡 Tips:"
echo "   - Monitor API costs at: http://localhost:3010"
echo "   - View logs with: tail -f logs/*.log"
echo "   - Stop all services: ./stop-production.sh"
echo ""
echo "💰 Cost Optimization:"
echo "   - ESPN API: FREE"
echo "   - The Odds API: $10/month"
echo "   - OpenWeatherMap: FREE"
echo "   - Total: ~$10/month (vs $500+ premium services)"
echo ""

# Create PID file for easy cleanup
echo "$MONITORING_PID $SPORTINTEL_PID" > .production.pid

# Keep script running to monitor services
echo "🔄 Monitoring services (Ctrl+C to stop all)..."

# Trap signals for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Graceful shutdown initiated..."
    
    if [ -f .production.pid ]; then
        for pid in $(cat .production.pid); do
            if kill -0 $pid 2>/dev/null; then
                echo "   Stopping PID $pid..."
                kill -TERM $pid 2>/dev/null
            fi
        done
        
        # Wait for graceful shutdown
        sleep 5
        
        # Force kill if necessary
        for pid in $(cat .production.pid); do
            if kill -0 $pid 2>/dev/null; then
                echo "   Force stopping PID $pid..."
                kill -KILL $pid 2>/dev/null
            fi
        done
        
        rm .production.pid
    fi
    
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Monitor services
while true; do
    sleep 30
    
    # Check if any service died
    if [ -f .production.pid ]; then
        for pid in $(cat .production.pid); do
            if ! kill -0 $pid 2>/dev/null; then
                echo "⚠️  Service with PID $pid has died"
                # Could restart service here
            fi
        done
    fi
done