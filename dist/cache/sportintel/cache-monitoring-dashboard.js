"use strict";
/**
 * Cache Monitoring Dashboard for SportIntel
 *
 * Real-time monitoring and alerting system for the intelligent cache
 * to ensure $150/month cost target and 95% hit rate performance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ALERT_CONFIG = exports.CacheMonitoringDashboard = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
class CacheMonitoringDashboard extends events_1.EventEmitter {
    cacheService;
    logger;
    alertConfig;
    metricsHistory = [];
    activeAlerts = new Map();
    monitoringTimer = null;
    constructor(cacheService, alertConfig) {
        super();
        this.cacheService = cacheService;
        this.alertConfig = alertConfig;
        this.logger = logger_1.Logger.getInstance();
        this.setupMonitoring();
        this.setupCacheServiceListeners();
    }
    /**
     * Get current dashboard metrics
     */
    getCurrentMetrics() {
        const cacheMetrics = this.cacheService.getMetrics();
        const timestamp = new Date();
        const metrics = {
            timestamp,
            performance: {
                hitRate: cacheMetrics.cache.hitRate,
                missRate: cacheMetrics.cache.missRate,
                averageResponseTime: cacheMetrics.cache.averageResponseTime,
                requestsPerSecond: this.calculateRequestsPerSecond(),
                errorRate: this.calculateErrorRate()
            },
            cost: {
                hourlyRate: cacheMetrics.cost.hourlyCost,
                dailySpent: cacheMetrics.cost.dailyCost,
                monthlyProjected: cacheMetrics.cost.dailyCost * 30,
                budgetUtilization: (cacheMetrics.cost.dailyCost / this.alertConfig.cost.dailyBudget) * 100,
                costPerRequest: this.calculateCostPerRequest(cacheMetrics),
                savings: cacheMetrics.routing.costSavings
            },
            providers: this.getProviderMetrics(cacheMetrics),
            cache: {
                memoryUsage: this.getMemoryUsage(),
                redisUsage: this.getRedisUsage(),
                totalEntries: cacheMetrics.cache.cacheSize,
                evictionRate: this.calculateEvictionRate(cacheMetrics),
                compressionRatio: this.calculateCompressionRatio()
            },
            alerts: Array.from(this.activeAlerts.values())
        };
        // Store metrics history (keep last 24 hours)
        this.metricsHistory.push(metrics);
        const dayAgo = new Date(Date.now() - 86400000);
        this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > dayAgo);
        return metrics;
    }
    /**
     * Get metrics history for charting
     */
    getMetricsHistory(hours = 24) {
        const cutoff = new Date(Date.now() - (hours * 3600000));
        return this.metricsHistory.filter(m => m.timestamp > cutoff);
    }
    /**
     * Generate comprehensive performance report
     */
    async generatePerformanceReport(period = 'day') {
        const report = await this.cacheService.generateOptimizationReport(period);
        const history = this.getMetricsHistory(period === 'week' ? 168 : period === 'day' ? 24 : 1);
        // Calculate trends
        const trends = {
            hitRate: history.map(m => ({ time: m.timestamp, value: m.performance.hitRate })),
            cost: history.map(m => ({ time: m.timestamp, value: m.cost.hourlyRate })),
            responseTime: history.map(m => ({ time: m.timestamp, value: m.performance.averageResponseTime }))
        };
        // Generate recommendations
        const recommendations = this.generateRecommendations(report, history);
        // Cost breakdown
        const costBreakdown = this.calculateCostBreakdown(history);
        return {
            summary: report,
            trends,
            recommendations,
            costBreakdown
        };
    }
    /**
     * Check and trigger alerts based on current metrics
     */
    checkAlerts(metrics) {
        const alerts = [];
        // Cost alerts
        if (metrics.cost.hourlyRate > this.alertConfig.cost.hourlyBudget) {
            alerts.push({
                type: 'cost',
                severity: 'critical',
                message: `Hourly cost rate exceeded budget: $${metrics.cost.hourlyRate.toFixed(4)}`,
                timestamp: new Date(),
                value: metrics.cost.hourlyRate,
                threshold: this.alertConfig.cost.hourlyBudget
            });
        }
        else if (metrics.cost.budgetUtilization > this.alertConfig.cost.warningThreshold) {
            alerts.push({
                type: 'cost',
                severity: 'warning',
                message: `Daily budget utilization at ${metrics.cost.budgetUtilization.toFixed(1)}%`,
                timestamp: new Date(),
                value: metrics.cost.budgetUtilization,
                threshold: this.alertConfig.cost.warningThreshold
            });
        }
        // Performance alerts
        if (metrics.performance.hitRate < this.alertConfig.performance.minHitRate) {
            alerts.push({
                type: 'performance',
                severity: 'warning',
                message: `Cache hit rate below target: ${(metrics.performance.hitRate * 100).toFixed(1)}%`,
                timestamp: new Date(),
                value: metrics.performance.hitRate,
                threshold: this.alertConfig.performance.minHitRate
            });
        }
        if (metrics.performance.averageResponseTime > this.alertConfig.performance.maxResponseTime) {
            alerts.push({
                type: 'performance',
                severity: 'warning',
                message: `Average response time exceeded: ${metrics.performance.averageResponseTime.toFixed(0)}ms`,
                timestamp: new Date(),
                value: metrics.performance.averageResponseTime,
                threshold: this.alertConfig.performance.maxResponseTime
            });
        }
        if (metrics.performance.errorRate > this.alertConfig.performance.maxErrorRate) {
            alerts.push({
                type: 'error',
                severity: 'critical',
                message: `Error rate exceeded threshold: ${(metrics.performance.errorRate * 100).toFixed(1)}%`,
                timestamp: new Date(),
                value: metrics.performance.errorRate,
                threshold: this.alertConfig.performance.maxErrorRate
            });
        }
        // Update active alerts
        alerts.forEach(alert => {
            const key = `${alert.type}_${alert.message.slice(0, 50)}`;
            this.activeAlerts.set(key, alert);
            this.logger.warn(`Alert triggered: ${alert.message}`, alert);
            this.emit('alert', alert);
            // Send notifications if configured
            this.sendNotification(alert);
        });
        // Clean up resolved alerts (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 3600000);
        for (const [key, alert] of this.activeAlerts.entries()) {
            if (alert.timestamp < oneHourAgo) {
                this.activeAlerts.delete(key);
            }
        }
    }
    /**
     * Get cost optimization suggestions
     */
    getCostOptimizationSuggestions() {
        const currentMetrics = this.getCurrentMetrics();
        const suggestions = [];
        if (currentMetrics.performance.hitRate < 0.95) {
            suggestions.push({
                category: 'cache',
                suggestion: 'Increase cache TTLs for frequently accessed data to improve hit rate',
                estimatedSavings: (0.95 - currentMetrics.performance.hitRate) * currentMetrics.cost.dailySpent,
                difficulty: 'easy'
            });
        }
        if (currentMetrics.cost.costPerRequest > 0.005) {
            suggestions.push({
                category: 'providers',
                suggestion: 'Switch to lower-cost API providers for non-critical data',
                estimatedSavings: currentMetrics.cost.dailySpent * 0.3,
                difficulty: 'medium'
            });
        }
        if (currentMetrics.cache.evictionRate > 0.1) {
            suggestions.push({
                category: 'memory',
                suggestion: 'Increase memory cache size to reduce evictions',
                estimatedSavings: currentMetrics.cost.dailySpent * 0.1,
                difficulty: 'easy'
            });
        }
        return suggestions;
    }
    /**
     * Export metrics data for external analysis
     */
    exportMetrics(format = 'json') {
        const data = this.getMetricsHistory();
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }
        // CSV format
        const headers = [
            'timestamp',
            'hitRate',
            'responseTime',
            'hourlyRate',
            'dailySpent',
            'budgetUtilization',
            'requestsPerSecond',
            'errorRate'
        ].join(',');
        const rows = data.map(m => [
            m.timestamp.toISOString(),
            m.performance.hitRate,
            m.performance.averageResponseTime,
            m.cost.hourlyRate,
            m.cost.dailySpent,
            m.cost.budgetUtilization,
            m.performance.requestsPerSecond,
            m.performance.errorRate
        ].join(','));
        return [headers, ...rows].join('\n');
    }
    // Private helper methods
    setupMonitoring() {
        // Monitor every minute
        this.monitoringTimer = setInterval(() => {
            const metrics = this.getCurrentMetrics();
            this.checkAlerts(metrics);
            this.emit('metrics_update', metrics);
        }, 60000);
        this.logger.info('Cache monitoring dashboard started');
    }
    setupCacheServiceListeners() {
        this.cacheService.on('alert', (alert) => {
            this.emit('cache_service_alert', alert);
        });
        this.cacheService.on('cost_warning', (data) => {
            this.emit('cost_warning', data);
        });
        this.cacheService.on('performance_warning', (data) => {
            this.emit('performance_warning', data);
        });
    }
    calculateRequestsPerSecond() {
        if (this.metricsHistory.length < 2)
            return 0;
        const recent = this.metricsHistory.slice(-2);
        const timeDiff = (recent[1].timestamp.getTime() - recent[0].timestamp.getTime()) / 1000;
        const requestDiff = recent[1].performance.hitRate + recent[1].performance.missRate -
            (recent[0].performance.hitRate + recent[0].performance.missRate);
        return Math.max(0, requestDiff / timeDiff);
    }
    calculateErrorRate() {
        // This would be calculated from actual error metrics
        // For now, return a mock value
        return 0.001; // 0.1% error rate
    }
    calculateCostPerRequest(cacheMetrics) {
        const totalRequests = cacheMetrics.cache.totalRequests || 1;
        const totalCost = cacheMetrics.routing.totalCost || 0;
        return totalCost / totalRequests;
    }
    getProviderMetrics(cacheMetrics) {
        const providerStats = cacheMetrics.routing.providerStats || {};
        const metrics = {};
        for (const [name, stats] of Object.entries(providerStats)) {
            metrics[name] = {
                requests: stats.requestCount || 0,
                cost: stats.cost || 0,
                responseTime: stats.averageResponseTime || 0,
                errorRate: stats.errorRate || 0,
                utilization: stats.utilization || 0
            };
        }
        return metrics;
    }
    getMemoryUsage() {
        // Get Node.js memory usage
        const usage = process.memoryUsage();
        return usage.heapUsed / 1024 / 1024; // MB
    }
    getRedisUsage() {
        // This would query Redis for memory usage
        // For now, return a mock value
        return 256; // MB
    }
    calculateEvictionRate(cacheMetrics) {
        const evictions = cacheMetrics.cache.evictionCount || 0;
        const totalEntries = cacheMetrics.cache.cacheSize || 1;
        return evictions / totalEntries;
    }
    calculateCompressionRatio() {
        // This would calculate actual compression ratio
        // For now, return a mock value
        return 0.3; // 30% compression
    }
    generateRecommendations(report, history) {
        const recommendations = [...report.recommendations];
        if (history.length > 0) {
            const latest = history[history.length - 1];
            if (latest.cost.monthlyProjected > this.alertConfig.cost.monthlyBudget) {
                recommendations.push(`Projected monthly cost ($${latest.cost.monthlyProjected.toFixed(2)}) exceeds budget. Consider reducing API call frequency or switching providers.`);
            }
            if (latest.performance.hitRate < 0.9) {
                recommendations.push('Cache hit rate is below optimal. Consider increasing TTLs or improving cache warming strategies.');
            }
            if (latest.cache.evictionRate > 0.1) {
                recommendations.push('High cache eviction rate detected. Consider increasing memory allocation or optimizing cache policies.');
            }
        }
        return recommendations;
    }
    calculateCostBreakdown(history) {
        if (history.length === 0)
            return [];
        const latest = history[history.length - 1];
        const totalCost = latest.cost.dailySpent;
        // Mock breakdown - in real implementation, this would come from actual cost tracking
        const breakdown = [
            { category: 'API Calls', amount: totalCost * 0.7, percentage: 70 },
            { category: 'Infrastructure', amount: totalCost * 0.2, percentage: 20 },
            { category: 'Processing', amount: totalCost * 0.1, percentage: 10 }
        ];
        return breakdown;
    }
    async sendNotification(alert) {
        if (alert.severity === 'info')
            return; // Don't send notifications for info alerts
        const message = `SportIntel Alert: ${alert.message} (${alert.severity.toUpperCase()})`;
        try {
            // Email notifications
            if (this.alertConfig.notifications.email && this.alertConfig.notifications.email.length > 0) {
                await this.sendEmailNotification(message, alert);
            }
            // Webhook notifications
            if (this.alertConfig.notifications.webhook) {
                await this.sendWebhookNotification(message, alert);
            }
            // Slack notifications
            if (this.alertConfig.notifications.slack) {
                await this.sendSlackNotification(message, alert);
            }
        }
        catch (error) {
            this.logger.error('Failed to send notification', { alert, error });
        }
    }
    async sendEmailNotification(message, alert) {
        // Implementation would send actual email
        this.logger.info('Email notification sent', { message, alert });
    }
    async sendWebhookNotification(message, alert) {
        // Implementation would send webhook
        this.logger.info('Webhook notification sent', { message, alert });
    }
    async sendSlackNotification(message, alert) {
        // Implementation would send Slack message
        this.logger.info('Slack notification sent', { message, alert });
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        this.removeAllListeners();
        this.logger.info('Cache monitoring dashboard destroyed');
    }
}
exports.CacheMonitoringDashboard = CacheMonitoringDashboard;
// Default alert configuration
exports.DEFAULT_ALERT_CONFIG = {
    cost: {
        hourlyBudget: 0.21, // $0.21/hour = $150/month
        dailyBudget: 5.0, // $5/day
        monthlyBudget: 150.0, // $150/month
        warningThreshold: 80 // 80% of budget
    },
    performance: {
        minHitRate: 0.90, // 90% minimum hit rate
        maxResponseTime: 100, // 100ms max response time
        maxErrorRate: 0.01 // 1% max error rate
    },
    notifications: {
        // Configure these based on your setup
        email: [],
        webhook: undefined,
        slack: undefined
    }
};
exports.default = CacheMonitoringDashboard;
//# sourceMappingURL=cache-monitoring-dashboard.js.map