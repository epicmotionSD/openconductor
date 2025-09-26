#!/usr/bin/env node

/**
 * SportIntel Production Deployment Pipeline
 * Connects SportIntel Bloomberg Terminal to FlexaSports Infrastructure
 * 
 * Features:
 * - Automated MCP server startup and health checks
 * - Service discovery and load balancing
 * - Environment configuration management
 * - Production monitoring and alerting
 * - Cost optimization and API rate limiting
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');

class ProductionDeploymentPipeline {
    constructor() {
        this.config = {
            // Service Configuration
            services: {
                flexaSports: {
                    name: 'FlexaSports MCP Server',
                    script: '../flexasports/mcp-servers/index.ts',
                    port: 3000,
                    healthCheck: '/health',
                    retries: 3,
                    timeout: 30000
                },
                enhancedSportsData: {
                    name: 'Enhanced Sports Data MCP Server',
                    script: '../flexasports/mcp-servers/sports-data/enhanced-sports-data-server.ts',
                    port: 3001,
                    healthCheck: '/health',
                    retries: 3,
                    timeout: 30000
                },
                mlPipeline: {
                    name: 'ML Pipeline MCP Server',
                    script: '../flexasports/mcp-servers/ml-pipeline/ml-pipeline-server.ts',
                    port: 3002,
                    healthCheck: '/health',
                    retries: 3,
                    timeout: 30000
                },
                sportIntel: {
                    name: 'SportIntel Bloomberg Terminal',
                    script: './sportintel-demo.js',
                    port: 8080,
                    healthCheck: '/api/health',
                    retries: 3,
                    timeout: 30000
                }
            },
            
            // API Configuration
            apis: {
                espn: {
                    name: 'ESPN API',
                    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
                    rateLimit: 1000, // requests per hour (estimated)
                    cost: 0 // Free
                },
                theOddsApi: {
                    name: 'The Odds API',
                    baseUrl: 'https://api.the-odds-api.com/v4',
                    rateLimit: 500, // requests per month
                    cost: 10 // $10/month
                },
                openWeatherMap: {
                    name: 'OpenWeatherMap API',
                    baseUrl: 'https://api.openweathermap.org/data/2.5',
                    rateLimit: 1000, // requests per day
                    cost: 0 // Free tier
                }
            },
            
            // Monitoring Configuration
            monitoring: {
                healthCheckInterval: 30000, // 30 seconds
                apiUsageCheckInterval: 300000, // 5 minutes
                costThreshold: 50, // Alert at $50/month
                rateLimit: {
                    warningThreshold: 0.8, // 80% of rate limit
                    criticalThreshold: 0.95 // 95% of rate limit
                }
            }
        };
        
        this.services = new Map();
        this.apiUsage = new Map();
        this.isShuttingDown = false;
        
        // Initialize API usage tracking
        Object.keys(this.config.apis).forEach(apiName => {
            this.apiUsage.set(apiName, {
                requests: 0,
                lastReset: Date.now(),
                errors: 0,
                avgResponseTime: 0
            });
        });
    }
    
    async start() {
        console.log('\n🚀 SportIntel Production Deployment Pipeline Starting...\n');
        
        try {
            // Check prerequisites
            await this.checkPrerequisites();
            
            // Start infrastructure services first
            await this.startInfrastructureServices();
            
            // Wait for services to be healthy
            await this.waitForServicesHealth();
            
            // Start SportIntel application
            await this.startSportIntelApplication();
            
            // Start monitoring systems
            await this.startMonitoring();
            
            console.log('\n✅ Production deployment complete!\n');
            console.log('🌐 SportIntel Bloomberg Terminal: http://localhost:8080');
            console.log('📊 FlexaSports MCP Server: http://localhost:3000');
            console.log('📈 Enhanced Sports Data: http://localhost:3001');
            console.log('🤖 ML Pipeline Server: http://localhost:3002');
            
            // Set up graceful shutdown
            process.on('SIGINT', () => this.gracefulShutdown());
            process.on('SIGTERM', () => this.gracefulShutdown());
            
        } catch (error) {
            console.error('❌ Production deployment failed:', error.message);
            await this.gracefulShutdown();
            process.exit(1);
        }
    }
    
    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`   Node.js version: ${nodeVersion}`);
        
        // Check required files exist
        const requiredFiles = [
            '../flexasports/mcp-servers/index.ts',
            '../flexasports/mcp-servers/sports-data/enhanced-sports-data-server.ts',
            '../flexasports/mcp-servers/ml-pipeline/ml-pipeline-server.ts',
            './sportintel-demo.js'
        ];
        
        for (const file of requiredFiles) {
            try {
                await fs.access(path.resolve(__dirname, file));
                console.log(`   ✅ ${file}`);
            } catch (error) {
                throw new Error(`Required file not found: ${file}`);
            }
        }
        
        // Check environment variables
        const requiredEnvVars = ['THE_ODDS_API_KEY', 'OPENWEATHER_API_KEY'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                console.warn(`   ⚠️  Environment variable ${envVar} not set`);
            } else {
                console.log(`   ✅ ${envVar} configured`);
            }
        }
    }
    
    async startInfrastructureServices() {
        console.log('\n🏗️  Starting infrastructure services...');
        
        const infraServices = ['flexaSports', 'enhancedSportsData', 'mlPipeline'];
        
        for (const serviceName of infraServices) {
            await this.startService(serviceName);
        }
    }
    
    async startService(serviceName) {
        const serviceConfig = this.config.services[serviceName];
        console.log(`   🚀 Starting ${serviceConfig.name}...`);
        
        const scriptPath = path.resolve(__dirname, serviceConfig.script);
        const child = spawn('node', [scriptPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PORT: serviceConfig.port.toString(),
                NODE_ENV: 'production'
            }
        });
        
        this.services.set(serviceName, {
            process: child,
            config: serviceConfig,
            startTime: Date.now(),
            restarts: 0
        });
        
        // Handle service output
        child.stdout.on('data', (data) => {
            console.log(`   [${serviceConfig.name}] ${data.toString().trim()}`);
        });
        
        child.stderr.on('data', (data) => {
            console.error(`   [${serviceConfig.name}] ERROR: ${data.toString().trim()}`);
        });
        
        child.on('exit', (code) => {
            if (!this.isShuttingDown) {
                console.error(`   [${serviceConfig.name}] Exited with code ${code}`);
                this.restartService(serviceName);
            }
        });
        
        // Give service time to start
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    async restartService(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) return;
        
        service.restarts++;
        if (service.restarts > 3) {
            console.error(`   [${service.config.name}] Max restarts exceeded, giving up`);
            return;
        }
        
        console.log(`   🔄 Restarting ${service.config.name} (attempt ${service.restarts})...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before restart
        await this.startService(serviceName);
    }
    
    async waitForServicesHealth() {
        console.log('\n🏥 Waiting for services to be healthy...');
        
        for (const [serviceName, service] of this.services) {
            await this.waitForServiceHealth(serviceName);
        }
    }
    
    async waitForServiceHealth(serviceName) {
        const service = this.services.get(serviceName);
        const maxAttempts = 10;
        const delay = 3000;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.checkServiceHealth(service.config.port);
                console.log(`   ✅ ${service.config.name} is healthy`);
                return;
            } catch (error) {
                console.log(`   ⏳ ${service.config.name} not ready (${attempt}/${maxAttempts})...`);
                if (attempt === maxAttempts) {
                    throw new Error(`${service.config.name} failed to become healthy`);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    async checkServiceHealth(port) {
        return new Promise((resolve, reject) => {
            const req = http.get(`http://localhost:${port}/health`, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`Health check failed: ${res.statusCode}`));
                }
            });
            
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Health check timeout'));
            });
        });
    }
    
    async startSportIntelApplication() {
        console.log('\n💼 Starting SportIntel Bloomberg Terminal...');
        await this.startService('sportIntel');
    }
    
    async startMonitoring() {
        console.log('\n📊 Starting monitoring systems...');
        
        // Health monitoring
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.monitoring.healthCheckInterval);
        
        // API usage monitoring
        setInterval(() => {
            this.checkApiUsage();
        }, this.config.monitoring.apiUsageCheckInterval);
        
        console.log('   ✅ Health monitoring active');
        console.log('   ✅ API usage monitoring active');
        console.log('   ✅ Cost tracking active');
    }
    
    async performHealthChecks() {
        for (const [serviceName, service] of this.services) {
            try {
                await this.checkServiceHealth(service.config.port);
            } catch (error) {
                console.warn(`⚠️  Health check failed for ${service.config.name}: ${error.message}`);
                // Could trigger restart or alert here
            }
        }
    }
    
    async checkApiUsage() {
        let totalCost = 0;
        
        for (const [apiName, usage] of this.apiUsage) {
            const apiConfig = this.config.apis[apiName];
            const rateUsage = usage.requests / apiConfig.rateLimit;
            
            // Calculate cost (simplified)
            if (apiConfig.cost > 0) {
                totalCost += apiConfig.cost;
            }
            
            // Check rate limit thresholds
            if (rateUsage >= this.config.monitoring.rateLimit.criticalThreshold) {
                console.error(`🚨 CRITICAL: ${apiConfig.name} at ${(rateUsage * 100).toFixed(1)}% of rate limit`);
            } else if (rateUsage >= this.config.monitoring.rateLimit.warningThreshold) {
                console.warn(`⚠️  WARNING: ${apiConfig.name} at ${(rateUsage * 100).toFixed(1)}% of rate limit`);
            }
        }
        
        // Cost monitoring
        if (totalCost >= this.config.monitoring.costThreshold) {
            console.error(`💰 COST ALERT: Monthly spending at $${totalCost.toFixed(2)}`);
        }
        
        // Log usage summary
        console.log(`📊 API Usage Summary - Total Cost: $${totalCost.toFixed(2)}/month`);
    }
    
    trackApiRequest(apiName, responseTime, isError = false) {
        const usage = this.apiUsage.get(apiName);
        if (usage) {
            usage.requests++;
            if (isError) usage.errors++;
            
            // Update average response time
            usage.avgResponseTime = (usage.avgResponseTime + responseTime) / 2;
            
            this.apiUsage.set(apiName, usage);
        }
    }
    
    async gracefulShutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        console.log('\n🛑 Graceful shutdown initiated...');
        
        // Stop all services
        for (const [serviceName, service] of this.services) {
            console.log(`   🛑 Stopping ${service.config.name}...`);
            service.process.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await new Promise(resolve => {
                const timeout = setTimeout(() => {
                    service.process.kill('SIGKILL');
                    resolve();
                }, 5000);
                
                service.process.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
        
        console.log('✅ All services stopped gracefully');
        process.exit(0);
    }
    
    getStatus() {
        const status = {
            services: {},
            apiUsage: Object.fromEntries(this.apiUsage),
            uptime: process.uptime()
        };
        
        for (const [serviceName, service] of this.services) {
            status.services[serviceName] = {
                name: service.config.name,
                port: service.config.port,
                uptime: Date.now() - service.startTime,
                restarts: service.restarts
            };
        }
        
        return status;
    }
}

// API Rate Limit Monitoring Middleware
class ApiRateLimitMonitor {
    constructor(pipeline) {
        this.pipeline = pipeline;
        this.requests = new Map();
    }
    
    track(apiName, endpoint) {
        const key = `${apiName}:${endpoint}`;
        const now = Date.now();
        
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }
        
        const requests = this.requests.get(key);
        requests.push(now);
        
        // Clean old requests (keep last hour)
        const oneHour = 60 * 60 * 1000;
        this.requests.set(key, requests.filter(time => now - time < oneHour));
        
        // Track in pipeline
        this.pipeline.trackApiRequest(apiName, 0);
        
        return requests.length;
    }
    
    getRateLimit(apiName, endpoint) {
        const key = `${apiName}:${endpoint}`;
        return this.requests.get(key)?.length || 0;
    }
}

// Cost Optimization Helper
class CostOptimizer {
    constructor() {
        this.strategies = {
            caching: {
                aggressive: true,
                ttl: {
                    static: 30 * 60 * 1000, // 30 minutes for static data
                    dynamic: 5 * 60 * 1000,  // 5 minutes for dynamic data
                    realtime: 30 * 1000      // 30 seconds for real-time data
                }
            },
            rateLimiting: {
                enabled: true,
                maxRequestsPerMinute: 10,
                burstAllowance: 5
            },
            fallbacks: {
                enabled: true,
                priority: ['cache', 'free_api', 'paid_api', 'mock_data']
            }
        };
    }
    
    shouldUseCache(dataType, lastUpdate) {
        const ttl = this.strategies.caching.ttl[dataType] || this.strategies.caching.ttl.dynamic;
        return Date.now() - lastUpdate < ttl;
    }
    
    selectDataSource(options) {
        // Prioritize free sources, then cached data, then paid APIs
        const priorities = ['espn', 'cache', 'theOddsApi'];
        return priorities.find(source => options[source]?.available) || 'mock';
    }
    
    calculateMonthlyCost(usage) {
        let totalCost = 0;
        
        // The Odds API: $10/month for 500 requests
        if (usage.theOddsApi > 0) {
            totalCost += 10;
        }
        
        // ESPN API: Free
        // OpenWeatherMap: Free tier (1000 requests/day)
        
        return totalCost;
    }
}

// Export for use in other modules
module.exports = {
    ProductionDeploymentPipeline,
    ApiRateLimitMonitor,
    CostOptimizer
};

// Run if called directly
if (require.main === module) {
    const pipeline = new ProductionDeploymentPipeline();
    pipeline.start().catch(error => {
        console.error('❌ Pipeline failed:', error);
        process.exit(1);
    });
}