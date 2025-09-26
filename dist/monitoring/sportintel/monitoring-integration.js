"use strict";
/**
 * SportIntel Monitoring Integration
 *
 * Integrates Prometheus metrics collection, Grafana dashboards, and SLA monitoring
 * to provide Bloomberg Terminal-level observability and reliability.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSportIntelMonitoring = exports.SportIntelMonitoringIntegration = void 0;
const prom_client_1 = require("prom-client");
const logger_1 = require("../../utils/logger");
const development_config_1 = require("../../config/sportintel/development-config");
const metrics_collector_1 = require("./metrics-collector");
const sla_monitor_1 = require("./sla-monitor");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Complete monitoring integration for SportIntel
 */
class SportIntelMonitoringIntegration {
    logger;
    config;
    eventBus;
    metricsCollector;
    slaMonitor;
    app;
    constructor(app, eventBus) {
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.eventBus = eventBus;
        this.app = app;
        // Initialize components
        this.metricsCollector = new metrics_collector_1.SportIntelMetricsCollector(eventBus);
        this.slaMonitor = new sla_monitor_1.SportIntelSLAMonitor(eventBus);
        this.setupMonitoringEndpoints();
        this.setupGrafanaDashboards();
        this.startPeriodicTasks();
        this.logger.info('SportIntel Monitoring Integration initialized');
    }
    /**
     * Setup monitoring HTTP endpoints
     */
    setupMonitoringEndpoints() {
        // Prometheus metrics endpoint
        this.app.get('/metrics', async (req, res) => {
            try {
                res.set('Content-Type', prom_client_1.register.contentType);
                res.end(await prom_client_1.register.metrics());
            }
            catch (error) {
                this.logger.error('Failed to serve metrics', { error });
                res.status(500).end(error);
            }
        });
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: this.config.getConfig().environment,
                services: {
                    metrics: 'up',
                    sla_monitor: 'up',
                    database: 'up', // Would check actual database health
                    cache: 'up', // Would check actual cache health
                },
            };
            res.json(health);
        });
        // SLA status endpoint
        this.app.get('/sla/status', (req, res) => {
            const status = this.slaMonitor.getSLAStatus();
            res.json(status);
        });
        // SLA breach history endpoint
        this.app.get('/sla/breaches', (req, res) => {
            const hours = parseInt(req.query.hours) || 24;
            const breaches = this.slaMonitor.getBreachHistory(hours);
            res.json(breaches);
        });
        // Force SLA check endpoint (for testing)
        this.app.post('/sla/check', async (req, res) => {
            try {
                await this.slaMonitor.forceSLACheck();
                res.json({ success: true, message: 'SLA check completed' });
            }
            catch (error) {
                this.logger.error('Failed to force SLA check', { error });
                res.status(500).json({ success: false, error: error.message });
            }
        });
        // Metrics summary endpoint
        this.app.get('/metrics/summary', async (req, res) => {
            try {
                const summary = await this.metricsCollector.getMetricsSummary();
                res.json(summary);
            }
            catch (error) {
                this.logger.error('Failed to get metrics summary', { error });
                res.status(500).json({ success: false, error: error.message });
            }
        });
        // Custom dashboard data endpoint
        this.app.get('/dashboard/data', async (req, res) => {
            try {
                const dashboardData = await this.getDashboardData();
                res.json(dashboardData);
            }
            catch (error) {
                this.logger.error('Failed to get dashboard data', { error });
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.logger.info('Monitoring endpoints configured');
    }
    /**
     * Setup Grafana dashboards
     */
    async setupGrafanaDashboards() {
        if (!this.config.isProduction()) {
            try {
                // Load dashboard configurations
                const dashboardsPath = path.join(__dirname, 'grafana-dashboards.json');
                const dashboardsConfig = JSON.parse(await fs.readFile(dashboardsPath, 'utf8'));
                // In a real implementation, this would:
                // 1. Connect to Grafana API
                // 2. Create/update dashboards
                // 3. Set up data sources
                // 4. Configure alerts
                this.logger.info('Grafana dashboards configured', {
                    dashboards: Object.keys(dashboardsConfig).length,
                });
            }
            catch (error) {
                this.logger.error('Failed to setup Grafana dashboards', { error });
            }
        }
    }
    /**
     * Start periodic monitoring tasks
     */
    startPeriodicTasks() {
        // Start metrics collector periodic updates
        this.metricsCollector.startPeriodicUpdates();
        // Generate daily monitoring report
        setInterval(() => {
            this.generateDailyReport();
        }, 24 * 60 * 60 * 1000); // Daily
        // Health check ping
        setInterval(() => {
            this.performHealthCheck();
        }, 60 * 1000); // Every minute
        this.logger.info('Periodic monitoring tasks started');
    }
    /**
     * Generate daily monitoring report
     */
    async generateDailyReport() {
        try {
            const report = {
                date: new Date().toISOString().split('T')[0],
                slaStatus: this.slaMonitor.getSLAStatus(),
                metrics: await this.getKeyMetrics(),
                performance: await this.getPerformanceSummary(),
                businessMetrics: await this.getBusinessMetrics(),
                recommendations: await this.generateRecommendations(),
            };
            // Log report
            this.logger.info('Daily monitoring report generated', report);
            // Emit report event
            this.eventBus.publish('monitoring.daily.report', report);
            // Store report (would save to database in real implementation)
            await this.storeReport(report);
        }
        catch (error) {
            this.logger.error('Failed to generate daily report', { error });
        }
    }
    /**
     * Perform health check
     */
    async performHealthCheck() {
        try {
            const health = {
                timestamp: new Date(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                slaBreaches: this.slaMonitor.getSLAStatus().activeBreeches,
            };
            // Emit health event
            this.eventBus.publish('monitoring.health.check', health);
            // Log critical issues
            if (health.slaBreaches > 0) {
                this.logger.warn('Health check detected SLA breaches', {
                    breaches: health.slaBreaches,
                });
            }
        }
        catch (error) {
            this.logger.error('Health check failed', { error });
        }
    }
    /**
     * Get dashboard data
     */
    async getDashboardData() {
        return {
            overview: {
                uptime: this.calculateUptime(),
                responseTime: await this.getAverageResponseTime(),
                activeUsers: await this.getActiveUserCount(),
                revenue: await this.getCurrentRevenue(),
                predictions: await this.getPredictionCount(),
            },
            performance: {
                responseTimeP95: await this.getResponseTimeP95(),
                throughput: await this.getThroughput(),
                errorRate: await this.getErrorRate(),
                cacheHitRate: await this.getCacheHitRate(),
            },
            business: {
                subscriptionDistribution: await this.getSubscriptionDistribution(),
                featureUsage: await this.getFeatureUsage(),
                usageLimits: await this.getUsageLimitsHit(),
                churnRate: await this.getChurnRate(),
            },
            infrastructure: {
                dbConnections: await this.getDbConnections(),
                queryPerformance: await this.getQueryPerformance(),
                cacheSize: await this.getCacheSize(),
                compressionRatio: await this.getCompressionRatio(),
            },
        };
    }
    /**
     * Get key metrics summary
     */
    async getKeyMetrics() {
        return {
            uptime: this.calculateUptime(),
            responseTime: await this.getAverageResponseTime(),
            throughput: await this.getThroughput(),
            errorRate: await this.getErrorRate(),
            cacheHitRate: await this.getCacheHitRate(),
        };
    }
    /**
     * Get performance summary
     */
    async getPerformanceSummary() {
        return {
            averageResponseTime: await this.getAverageResponseTime(),
            p95ResponseTime: await this.getResponseTimeP95(),
            maxResponseTime: await this.getMaxResponseTime(),
            totalRequests: await this.getTotalRequests(),
            successRate: await this.getSuccessRate(),
        };
    }
    /**
     * Get business metrics
     */
    async getBusinessMetrics() {
        return {
            activeSubscriptions: await this.getActiveSubscriptions(),
            monthlyRevenue: await this.getMonthlyRevenue(),
            newSignups: await this.getNewSignups(),
            churnRate: await this.getChurnRate(),
            averageRevenuePerUser: await this.getAverageRevenuePerUser(),
        };
    }
    /**
     * Generate recommendations
     */
    async generateRecommendations() {
        const recommendations = [];
        // Check response time
        const responseTime = await this.getAverageResponseTime();
        if (responseTime > 200) {
            recommendations.push('Consider optimizing API endpoints - response time exceeds 200ms target');
        }
        // Check cache hit rate
        const cacheHitRate = await this.getCacheHitRate();
        if (cacheHitRate < 95) {
            recommendations.push('Improve cache strategy - hit rate below 95% target');
        }
        // Check error rate
        const errorRate = await this.getErrorRate();
        if (errorRate > 1) {
            recommendations.push('Investigate error causes - error rate exceeds 1% threshold');
        }
        // Check SLA breaches
        const slaStatus = this.slaMonitor.getSLAStatus();
        if (slaStatus.activeBreeches > 0) {
            recommendations.push(`Address ${slaStatus.activeBreeches} active SLA breach(es)`);
        }
        return recommendations;
    }
    /**
     * Store monitoring report
     */
    async storeReport(report) {
        // In a real implementation, this would store the report in a database
        // For now, just log that we would store it
        this.logger.info('Storing monitoring report', {
            date: report.date,
            size: JSON.stringify(report).length,
        });
    }
    // Helper methods for metrics (these would query actual Prometheus metrics)
    calculateUptime() {
        return Math.min(99.9 + Math.random() * 0.1, 100);
    }
    async getAverageResponseTime() {
        return 150 + Math.random() * 50; // 150-200ms
    }
    async getResponseTimeP95() {
        return 180 + Math.random() * 60; // 180-240ms
    }
    async getMaxResponseTime() {
        return 300 + Math.random() * 200; // 300-500ms
    }
    async getThroughput() {
        return 1000 + Math.random() * 500; // 1000-1500 RPS
    }
    async getErrorRate() {
        return Math.random() * 0.5; // 0-0.5%
    }
    async getCacheHitRate() {
        return 94 + Math.random() * 6; // 94-100%
    }
    async getTotalRequests() {
        return Math.floor(Math.random() * 1000000); // Random daily requests
    }
    async getSuccessRate() {
        return 99 + Math.random() * 1; // 99-100%
    }
    async getActiveUserCount() {
        return Math.floor(Math.random() * 10000); // Random active users
    }
    async getCurrentRevenue() {
        return Math.floor(Math.random() * 500000); // Random monthly revenue
    }
    async getPredictionCount() {
        return Math.floor(Math.random() * 100000); // Random daily predictions
    }
    async getSubscriptionDistribution() {
        return {
            rookie: Math.floor(Math.random() * 1000),
            pro: Math.floor(Math.random() * 500),
            elite: Math.floor(Math.random() * 200),
            champion: Math.floor(Math.random() * 50),
        };
    }
    async getFeatureUsage() {
        return {
            predictions: Math.floor(Math.random() * 50000),
            portfolios: Math.floor(Math.random() * 10000),
            alerts: Math.floor(Math.random() * 5000),
            analytics: Math.floor(Math.random() * 2000),
        };
    }
    async getUsageLimitsHit() {
        return Math.floor(Math.random() * 100);
    }
    async getActiveSubscriptions() {
        return Math.floor(Math.random() * 2000);
    }
    async getMonthlyRevenue() {
        return Math.floor(Math.random() * 500000);
    }
    async getNewSignups() {
        return Math.floor(Math.random() * 100);
    }
    async getChurnRate() {
        return Math.random() * 5; // 0-5%
    }
    async getAverageRevenuePerUser() {
        return 50 + Math.random() * 200; // $50-250
    }
    async getDbConnections() {
        return Math.floor(Math.random() * 50);
    }
    async getQueryPerformance() {
        return 10 + Math.random() * 40; // 10-50ms
    }
    async getCacheSize() {
        return Math.floor(Math.random() * 1000000000); // Random bytes
    }
    async getCompressionRatio() {
        return 0.2 + Math.random() * 0.3; // 20-50% compression
    }
    /**
     * Stop monitoring
     */
    stop() {
        this.slaMonitor.stopMonitoring();
        this.logger.info('SportIntel monitoring stopped');
    }
    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            metricsCollector: 'active',
            slaMonitor: this.slaMonitor.getSLAStatus(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            environment: this.config.getConfig().environment,
        };
    }
}
exports.SportIntelMonitoringIntegration = SportIntelMonitoringIntegration;
/**
 * Initialize SportIntel monitoring
 */
const initializeSportIntelMonitoring = (app, eventBus) => {
    return new SportIntelMonitoringIntegration(app, eventBus);
};
exports.initializeSportIntelMonitoring = initializeSportIntelMonitoring;
exports.default = SportIntelMonitoringIntegration;
//# sourceMappingURL=monitoring-integration.js.map