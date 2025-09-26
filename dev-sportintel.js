#!/usr/bin/env node

/**
 * SportIntel Development Server Launcher
 * Simplified launcher that bypasses TypeScript compilation issues
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏟️  Starting SportIntel Development Environment');
console.log('==============================================');

// Check if environment file exists
const envFile = path.join(__dirname, '.env.sportintel');
if (!fs.existsSync(envFile)) {
    console.log('❌ Environment file not found. Run setup script first:');
    console.log('   ./scripts/sportintel/setup-dev-env.sh');
    process.exit(1);
}

// Set environment variables
require('dotenv').config({ path: envFile });
process.env.NODE_ENV = 'development';
process.env.DEBUG = 'sportintel:*';

console.log('✅ Environment configured');

// Start services
async function startServices() {
    console.log('\n🚀 Starting SportIntel services...\n');
    
    // Start the development server with tsx (bypassing TypeScript compilation)
    const serverProcess = spawn('npx', ['tsx', 'watch', 'src/server.ts'], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env }
    });

    console.log('📡 Backend API server starting on http://localhost:3001');
    console.log('🎯 Health check: http://localhost:3001/health');
    
    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down SportIntel...');
        serverProcess.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down SportIntel...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
    });
}

// Check for Docker services
function checkDockerServices() {
    exec('docker-compose -f docker-compose.sportintel.yml ps', (error, stdout, stderr) => {
        if (error) {
            console.log('⚠️  Docker services not running. To start them:');
            console.log('   docker-compose -f docker-compose.sportintel.yml up -d');
        } else {
            console.log('✅ Docker services status checked');
        }
    });
}

// Main execution
console.log('🔍 Checking Docker services...');
checkDockerServices();

setTimeout(() => {
    startServices();
}, 1000);