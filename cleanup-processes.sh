#!/bin/bash

# OpenConductor Process Cleanup Script
# Kills all running OpenConductor processes and clears ports

echo "🧹 Cleaning up OpenConductor processes..."

# Kill all tsx/node processes related to OpenConductor
echo "Stopping all tsx processes..."
pkill -f "tsx.*server.ts" || true
pkill -f "tsx.*openconductor" || true

# Kill all npm/pnpm dev processes
echo "Stopping all dev servers..."
pkill -f "pnpm.*dev" || true
pkill -f "npm.*dev" || true

# Kill any Next.js processes
pkill -f "next.*dev" || true

# Kill any express processes on our ports
for port in 3000 3001 3002 3003 3004 3005 3006 3007; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill $pid 2>/dev/null || true
    fi
done

# Clean up any background processes
sleep 2

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf packages/frontend/.next/ 2>/dev/null || true

# Wait a moment for processes to die
sleep 1

echo "✅ Cleanup complete!"
echo "You can now run: ./launch-openconductor.sh"