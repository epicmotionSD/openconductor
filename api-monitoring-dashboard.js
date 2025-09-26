#!/usr/bin/env node

/**
 * SportIntel API Monitoring Dashboard
 * Real-time monitoring of API usage, costs, and rate limits
 * 
 * Features:
 * - Real-time API usage tracking
 * - Cost monitoring and alerting
 * - Rate limit monitoring with predictive alerts
 * - Performance metrics and SLA tracking
 * - Cost optimization recommendations
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class ApiMonitoringDashboard {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        
        this.metrics = {
            apis: {
                espn: {
                    name: 'ESPN API',
                    requests: 0,
                    errors: 0,
                    avgResponseTime: 0,
                    rateLimit: 1000, // per hour
                    cost: 0,
                    endpoints: new Map()
                },
                theOddsApi: {
                    name: 'The Odds API',
                    requests: 0,
                    errors: 0,
                    avgResponseTime: 0,
                    rateLimit: 500, // per month
                    cost: 10,
                    endpoints: new Map()
                },
                openWeatherMap: {
                    name: 'OpenWeatherMap API',
                    requests: 0,
                    errors: 0,
                    avgResponseTime: 0,
                    rateLimit: 1000, // per day
                    cost: 0,
                    endpoints: new Map()
                }
            },
            total: {
                requests: 0,
                errors: 0,
                monthlyCost: 0,
                costSavings: 485 // vs MySportsFeeds $495/month
            },
            performance: {
                cacheHitRate: 0,
                averageResponseTime: 0,
                uptime: 0
            },
            alerts: []
        };
        
        this.thresholds = {
            rateLimit: {
                warning: 0.7,
                critical: 0.9
            },
            cost: {
                monthly: 50,
                daily: 5
            },
            performance: {
                responseTime: 2000, // 2 seconds
                errorRate: 0.05 // 5%
            }
        };
        
        this.setupRoutes();
        this.setupSocketHandlers();
        this.startMonitoring();
    }
    
    setupRoutes() {
        // Serve static dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
        
        // API metrics endpoint
        this.app.get('/api/metrics', (req, res) => {
            res.json(this.getMetrics());
        });
        
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        
        // Cost optimization endpoint
        this.app.get('/api/optimization', (req, res) => {
            res.json(this.getCostOptimizationRecommendations());
        });
        
        // Alert management
        this.app.get('/api/alerts', (req, res) => {
            res.json(this.metrics.alerts);
        });
        
        this.app.delete('/api/alerts/:id', (req, res) => {
            const alertId = req.params.id;
            this.metrics.alerts = this.metrics.alerts.filter(alert => alert.id !== alertId);
            res.json({ success: true });
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('📊 Dashboard client connected');
            
            // Send current metrics
            socket.emit('metrics', this.getMetrics());
            
            socket.on('disconnect', () => {
                console.log('📊 Dashboard client disconnected');
            });
        });
    }
    
    startMonitoring() {
        // Update metrics every 10 seconds
        setInterval(() => {
            this.updateMetrics();
            this.checkThresholds();
            this.broadcastMetrics();
        }, 10000);
        
        // Cost calculation every hour
        setInterval(() => {
            this.calculateCosts();
        }, 60 * 60 * 1000);
    }
    
    trackRequest(apiName, endpoint, responseTime, isError = false) {
        if (!this.metrics.apis[apiName]) return;
        
        const api = this.metrics.apis[apiName];
        api.requests++;
        this.metrics.total.requests++;
        
        if (isError) {
            api.errors++;
            this.metrics.total.errors++;
        }
        
        // Update average response time
        api.avgResponseTime = (api.avgResponseTime + responseTime) / 2;
        
        // Track endpoint usage
        if (!api.endpoints.has(endpoint)) {
            api.endpoints.set(endpoint, { requests: 0, errors: 0 });
        }
        const endpointStats = api.endpoints.get(endpoint);
        endpointStats.requests++;
        if (isError) endpointStats.errors++;
    }
    
    updateMetrics() {
        // Calculate performance metrics
        const totalRequests = this.metrics.total.requests;
        const totalErrors = this.metrics.total.errors;
        
        this.metrics.performance.uptime = process.uptime();
        
        if (totalRequests > 0) {
            // Calculate average response time across all APIs
            let totalResponseTime = 0;
            let apiCount = 0;
            
            Object.values(this.metrics.apis).forEach(api => {
                if (api.avgResponseTime > 0) {
                    totalResponseTime += api.avgResponseTime;
                    apiCount++;
                }
            });
            
            this.metrics.performance.averageResponseTime = 
                apiCount > 0 ? totalResponseTime / apiCount : 0;
        }
    }
    
    checkThresholds() {
        const now = Date.now();
        
        // Check rate limits
        Object.entries(this.metrics.apis).forEach(([apiName, api]) => {
            const rateUsage = api.requests / api.rateLimit;
            
            if (rateUsage >= this.thresholds.rateLimit.critical) {
                this.addAlert({
                    id: `${apiName}-rate-critical-${now}`,
                    type: 'critical',
                    message: `${api.name} approaching rate limit (${(rateUsage * 100).toFixed(1)}%)`,
                    timestamp: now,
                    apiName
                });
            } else if (rateUsage >= this.thresholds.rateLimit.warning) {
                this.addAlert({
                    id: `${apiName}-rate-warning-${now}`,
                    type: 'warning',
                    message: `${api.name} rate usage at ${(rateUsage * 100).toFixed(1)}%`,
                    timestamp: now,
                    apiName
                });
            }
        });
        
        // Check error rates
        Object.entries(this.metrics.apis).forEach(([apiName, api]) => {
            if (api.requests > 0) {
                const errorRate = api.errors / api.requests;
                if (errorRate >= this.thresholds.performance.errorRate) {
                    this.addAlert({
                        id: `${apiName}-error-${now}`,
                        type: 'warning',
                        message: `High error rate for ${api.name}: ${(errorRate * 100).toFixed(1)}%`,
                        timestamp: now,
                        apiName
                    });
                }
            }
        });
        
        // Check response times
        Object.entries(this.metrics.apis).forEach(([apiName, api]) => {
            if (api.avgResponseTime > this.thresholds.performance.responseTime) {
                this.addAlert({
                    id: `${apiName}-performance-${now}`,
                    type: 'warning',
                    message: `Slow response time for ${api.name}: ${api.avgResponseTime.toFixed(0)}ms`,
                    timestamp: now,
                    apiName
                });
            }
        });
    }
    
    addAlert(alert) {
        // Avoid duplicate alerts
        const exists = this.metrics.alerts.some(existing => 
            existing.apiName === alert.apiName && 
            existing.type === alert.type &&
            Date.now() - existing.timestamp < 300000 // 5 minutes
        );
        
        if (!exists) {
            this.metrics.alerts.push(alert);
            console.log(`🚨 Alert: ${alert.message}`);
        }
        
        // Keep only recent alerts (last hour)
        const oneHour = 60 * 60 * 1000;
        this.metrics.alerts = this.metrics.alerts.filter(
            alert => Date.now() - alert.timestamp < oneHour
        );
    }
    
    calculateCosts() {
        let totalCost = 0;
        
        Object.values(this.metrics.apis).forEach(api => {
            totalCost += api.cost;
        });
        
        this.metrics.total.monthlyCost = totalCost;
        
        // Calculate savings vs premium services
        const premiumCost = 495; // MySportsFeeds
        this.metrics.total.costSavings = premiumCost - totalCost;
        
        console.log(`💰 Monthly cost: $${totalCost}, Savings: $${this.metrics.total.costSavings}`);
    }
    
    getCostOptimizationRecommendations() {
        const recommendations = [];
        
        // Rate limit recommendations
        Object.entries(this.metrics.apis).forEach(([apiName, api]) => {
            const rateUsage = api.requests / api.rateLimit;
            
            if (rateUsage > 0.8) {
                recommendations.push({
                    type: 'rate_limit',
                    priority: 'high',
                    message: `Consider implementing more aggressive caching for ${api.name}`,
                    apiName
                });
            }
        });
        
        // Cost optimization
        if (this.metrics.total.monthlyCost > this.thresholds.cost.monthly) {
            recommendations.push({
                type: 'cost',
                priority: 'medium',
                message: 'Monthly cost exceeds threshold. Review API usage patterns.',
                apiName: 'all'
            });
        }
        
        // Performance optimization
        if (this.metrics.performance.averageResponseTime > 1000) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                message: 'Consider implementing request batching and connection pooling'
            });
        }
        
        return recommendations;
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now()
        };
    }
    
    broadcastMetrics() {
        this.io.emit('metrics', this.getMetrics());
    }
    
    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SportIntel API Monitoring Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
        }
        
        .dashboard {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
        }
        
        .metric-title {
            font-size: 18px;
            margin-bottom: 15px;
            color: #64ffda;
        }
        
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .metric-subtitle {
            color: #aaa;
            font-size: 14px;
        }
        
        .alerts-section {
            margin-top: 30px;
        }
        
        .alert {
            background: rgba(255, 82, 82, 0.1);
            border: 1px solid rgba(255, 82, 82, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .alert.warning {
            background: rgba(255, 193, 7, 0.1);
            border-color: rgba(255, 193, 7, 0.3);
        }
        
        .alert.critical {
            background: rgba(220, 53, 69, 0.1);
            border-color: rgba(220, 53, 69, 0.3);
        }
        
        .progress-bar {
            width: 100%;
            height: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #64ffda, #1de9b6);
            transition: width 0.3s ease;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online { background: #4caf50; }
        .status-warning { background: #ff9800; }
        .status-error { background: #f44336; }
        
        @media (max-width: 768px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>📊 SportIntel API Monitoring Dashboard</h1>
            <p>Real-time monitoring of API usage, costs, and performance</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">
                    <span class="status-indicator status-online"></span>
                    Total Requests
                </div>
                <div class="metric-value" id="totalRequests">0</div>
                <div class="metric-subtitle">Across all APIs</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Monthly Cost</div>
                <div class="metric-value" id="monthlyCost">$0.00</div>
                <div class="metric-subtitle">vs $495/month premium services</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Cost Savings</div>
                <div class="metric-value" id="costSavings">$485</div>
                <div class="metric-subtitle">95%+ savings achieved</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Average Response Time</div>
                <div class="metric-value" id="avgResponseTime">0ms</div>
                <div class="metric-subtitle">All APIs combined</div>
            </div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">ESPN API</div>
                <div class="metric-value" id="espnRequests">0</div>
                <div class="metric-subtitle">Requests (Free)</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="espnProgress" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">The Odds API</div>
                <div class="metric-value" id="oddsRequests">0</div>
                <div class="metric-subtitle">Requests ($10/month)</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="oddsProgress" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">OpenWeather API</div>
                <div class="metric-value" id="weatherRequests">0</div>
                <div class="metric-subtitle">Requests (Free)</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="weatherProgress" style="width: 0%"></div>
                </div>
            </div>
        </div>
        
        <div class="alerts-section">
            <h2>🚨 Active Alerts</h2>
            <div id="alertsContainer">
                <p style="color: #aaa;">No active alerts</p>
            </div>
        </div>
    </div>
    
    <script>
        const socket = io();
        
        socket.on('metrics', (data) => {
            updateDashboard(data);
        });
        
        function updateDashboard(metrics) {
            // Update main metrics
            document.getElementById('totalRequests').textContent = 
                metrics.total.requests.toLocaleString();
            document.getElementById('monthlyCost').textContent = 
                '$' + metrics.total.monthlyCost.toFixed(2);
            document.getElementById('costSavings').textContent = 
                '$' + metrics.total.costSavings.toFixed(0);
            document.getElementById('avgResponseTime').textContent = 
                metrics.performance.averageResponseTime.toFixed(0) + 'ms';
            
            // Update API-specific metrics
            updateApiMetrics('espn', metrics.apis.espn);
            updateApiMetrics('odds', metrics.apis.theOddsApi, 'oddsRequests', 'oddsProgress');
            updateApiMetrics('weather', metrics.apis.openWeatherMap, 'weatherRequests', 'weatherProgress');
            
            // Update alerts
            updateAlerts(metrics.alerts);
        }
        
        function updateApiMetrics(apiKey, apiData, requestsId, progressId) {
            if (!requestsId) requestsId = apiKey + 'Requests';
            if (!progressId) progressId = apiKey + 'Progress';
            
            document.getElementById(requestsId).textContent = 
                apiData.requests.toLocaleString();
            
            const usage = (apiData.requests / apiData.rateLimit) * 100;
            document.getElementById(progressId).style.width = Math.min(usage, 100) + '%';
            
            // Change color based on usage
            const progressEl = document.getElementById(progressId);
            if (usage > 90) {
                progressEl.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
            } else if (usage > 70) {
                progressEl.style.background = 'linear-gradient(90deg, #ff9800, #f57c00)';
            } else {
                progressEl.style.background = 'linear-gradient(90deg, #64ffda, #1de9b6)';
            }
        }
        
        function updateAlerts(alerts) {
            const container = document.getElementById('alertsContainer');
            
            if (alerts.length === 0) {
                container.innerHTML = '<p style="color: #aaa;">No active alerts</p>';
                return;
            }
            
            container.innerHTML = alerts.map(alert => 
                '<div class="alert ' + alert.type + '">' +
                    '<div>' +
                        '<strong>' + alert.message + '</strong><br>' +
                        '<small>' + new Date(alert.timestamp).toLocaleString() + '</small>' +
                    '</div>' +
                    '<button onclick="dismissAlert(\\'' + alert.id + '\\')">×</button>' +
                '</div>'
            ).join('');
        }
        
        function dismissAlert(alertId) {
            fetch('/api/alerts/' + alertId, { method: 'DELETE' });
        }
    </script>
</body>
</html>`;
    }
    
    start(port = 3010) {
        this.server.listen(port, () => {
            console.log(`📊 API Monitoring Dashboard running on http://localhost:${port}`);
        });
    }
}

// Export for use as middleware
module.exports = ApiMonitoringDashboard;

// Run if called directly
if (require.main === module) {
    const dashboard = new ApiMonitoringDashboard();
    dashboard.start();
}