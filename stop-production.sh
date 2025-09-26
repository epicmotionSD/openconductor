#!/bin/bash

# SportIntel Production Stop Script
# Gracefully stops all services

echo "🛑 Stopping SportIntel Production Environment..."

if [ -f .production.pid ]; then
    echo "📋 Found running services..."
    
    for pid in $(cat .production.pid); do
        if kill -0 $pid 2>/dev/null; then
            echo "   Stopping service PID $pid..."
            kill -TERM $pid 2>/dev/null
        else
            echo "   Service PID $pid already stopped"
        fi
    done
    
    echo "⏳ Waiting for graceful shutdown..."
    sleep 5
    
    # Force kill if necessary
    for pid in $(cat .production.pid); do
        if kill -0 $pid 2>/dev/null; then
            echo "   Force stopping PID $pid..."
            kill -KILL $pid 2>/dev/null
        fi
    done
    
    rm .production.pid
    echo "✅ All services stopped"
else
    echo "ℹ️  No PID file found, checking for running processes..."
    
    # Kill by port if PID file is missing
    for port in 3010 8080; do
        pid=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pid" ]; then
            echo "   Stopping service on port $port (PID $pid)..."
            kill -TERM $pid 2>/dev/null
        fi
    done
fi

echo "🧹 Cleaning up..."
# Clean up log files if they're empty
find logs -name "*.log" -empty -delete 2>/dev/null || true

echo "✅ Production environment stopped"