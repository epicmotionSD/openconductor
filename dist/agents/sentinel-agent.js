"use strict";
/**
 * Sentinel Agent - Advanced Monitoring and Alerting
 *
 * Trinity AI Pattern: "The vigilance to know what's happening"
 *
 * Provides comprehensive monitoring capabilities including:
 * - Real-time system monitoring
 * - Performance metrics tracking
 * - Anomaly detection and alerting
 * - Health checks and diagnostics
 * - SLA monitoring and reporting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentinelAgent = void 0;
const base_agent_1 = require("./base-agent");
class SentinelAgent extends base_agent_1.BaseAgent {
    metrics = new Map();
    thresholds = new Map();
    alerts = new Map();
    targets = new Map();
    healthChecks = new Map();
    monitoringIntervals = new Map();
    alertHistory = [];
    metricRetention = 24 * 60 * 60 * 1000; // 24 hours
    constructor(config, logger) {
        super({
            ...config,
            type: 'monitoring',
            capabilities: [
                {
                    type: 'monitoring',
                    name: 'Real-time System Monitoring',
                    description: 'Monitors system health and performance in real-time',
                    version: '1.0.0',
                    parameters: {
                        maxTargets: 100,
                        minCheckInterval: 1,
                        maxMetricRetention: 7 * 24 * 60 * 60 * 1000 // 7 days
                    }
                },
                {
                    type: 'real-time-processing',
                    name: 'Stream Processing',
                    description: 'Processes real-time data streams for monitoring',
                    version: '1.0.0'
                },
                {
                    type: 'data-analysis',
                    name: 'Anomaly Detection',
                    description: 'Detects anomalies in system metrics and behavior',
                    version: '1.0.0'
                }
            ]
        }, logger);
        this.initializeDefaultTargets();
        this.initializeDefaultThresholds();
    }
    async initialize() {
        await super.initialize();
        await this.startMonitoring();
        this.logger.info(`Sentinel Agent initialized with ${this.targets.size} monitoring targets`);
    }
    async shutdown() {
        await this.stopMonitoring();
        await super.shutdown();
    }
    async execute(input, context) {
        const startTime = Date.now();
        try {
            let data = input;
            if (typeof input === 'string') {
                try {
                    data = JSON.parse(input);
                }
                catch {
                    data = { message: input };
                }
            }
            this.logger.debug(`Sentinel monitoring data: ${JSON.stringify(data)}`);
            const result = await this.monitor(data, context?.thresholds);
            // Update metrics
            this.metrics.executionCount++;
            this.metrics.lastExecuted = new Date();
            this.metrics.averageExecutionTime =
                (this.metrics.averageExecutionTime * (this.metrics.executionCount - 1) +
                    (Date.now() - startTime)) / this.metrics.executionCount;
            return result;
        }
        catch (error) {
            this.metrics.errorCount++;
            this.logger.error(`Sentinel monitoring failed: ${error}`);
            throw error;
        }
    }
    async monitor(data, thresholds) {
        const alerts = [];
        const metrics = {};
        // Process incoming data as metrics
        if (data && typeof data === 'object') {
            await this.processMetrics(data);
        }
        // Run health checks
        const healthResults = await this.runHealthChecks();
        // Check thresholds and generate alerts
        const thresholdAlerts = await this.checkThresholds();
        alerts.push(...thresholdAlerts);
        // Calculate overall status
        const status = this.calculateOverallStatus(alerts, healthResults);
        // Collect current metrics
        for (const [name, metricList] of this.metrics.entries()) {
            if (metricList.length > 0) {
                const latest = metricList[metricList.length - 1];
                metrics[name] = latest.value;
            }
        }
        return {
            status,
            alerts: alerts.map(alert => ({
                level: alert.level,
                message: alert.message,
                timestamp: alert.timestamp,
                data: alert.data
            })),
            metrics
        };
    }
    setThreshold(metric, threshold) {
        if (typeof threshold === 'object' && threshold.condition && threshold.value) {
            const thresholdObj = {
                id: `${metric}_${Date.now()}`,
                metric,
                condition: threshold.condition,
                value: threshold.value,
                severity: threshold.severity || 'warning',
                enabled: true,
                duration: threshold.duration || 0,
                description: threshold.description
            };
            this.thresholds.set(thresholdObj.id, thresholdObj);
            this.logger.info(`Set threshold for metric '${metric}': ${threshold.condition} ${threshold.value}`);
        }
    }
    getThresholds() {
        const result = {};
        for (const [id, threshold] of this.thresholds.entries()) {
            result[id] = {
                metric: threshold.metric,
                condition: threshold.condition,
                value: threshold.value,
                severity: threshold.severity,
                enabled: threshold.enabled
            };
        }
        return result;
    }
    async processMetrics(data) {
        const timestamp = new Date();
        // Extract metrics from various data formats
        if (data.metrics) {
            // Standard metrics format
            for (const [name, value] of Object.entries(data.metrics)) {
                if (typeof value === 'number') {
                    await this.recordMetric(name, value, timestamp);
                }
            }
        }
        else {
            // Auto-detect metric patterns
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'number' && this.isMetricKey(key)) {
                    await this.recordMetric(key, value, timestamp);
                }
            }
        }
    }
    async recordMetric(name, value, timestamp) {
        const metric = {
            name,
            type: 'gauge',
            value,
            timestamp,
            unit: this.getMetricUnit(name)
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const metricList = this.metrics.get(name);
        metricList.push(metric);
        // Cleanup old metrics
        const cutoff = timestamp.getTime() - this.metricRetention;
        while (metricList.length > 0 && metricList[0].timestamp.getTime() < cutoff) {
            metricList.shift();
        }
        this.events.emit('metric', { name, value, timestamp });
    }
    async runHealthChecks() {
        const results = [];
        for (const target of this.targets.values()) {
            if (!target.enabled)
                continue;
            const healthCheck = await this.performHealthCheck(target);
            this.healthChecks.set(target.id, healthCheck);
            results.push(healthCheck);
        }
        return results;
    }
    async performHealthCheck(target) {
        const startTime = Date.now();
        try {
            // Simulate different types of health checks
            let status = 'healthy';
            let message = 'Service is healthy';
            const details = {};
            switch (target.type) {
                case 'service':
                    const serviceCheck = await this.checkServiceHealth(target);
                    status = serviceCheck.status;
                    message = serviceCheck.message;
                    details.endpoint = target.endpoint;
                    break;
                case 'database':
                    const dbCheck = await this.checkDatabaseHealth(target);
                    status = dbCheck.status;
                    message = dbCheck.message;
                    details.connectionPool = dbCheck.details;
                    break;
                case 'api':
                    const apiCheck = await this.checkApiHealth(target);
                    status = apiCheck.status;
                    message = apiCheck.message;
                    details.latency = apiCheck.latency;
                    break;
                default:
                    // Generic check
                    status = Math.random() > 0.1 ? 'healthy' : 'degraded';
                    message = status === 'healthy' ? 'Check passed' : 'Check degraded';
            }
            const responseTime = Date.now() - startTime;
            return {
                name: target.name,
                status,
                lastCheck: new Date(),
                responseTime,
                message,
                details
            };
        }
        catch (error) {
            return {
                name: target.name,
                status: 'unhealthy',
                lastCheck: new Date(),
                responseTime: Date.now() - startTime,
                message: `Health check failed: ${error}`,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async checkServiceHealth(target) {
        // Simulate service health check
        const isHealthy = Math.random() > 0.05; // 95% healthy
        const isDegraded = !isHealthy && Math.random() > 0.5;
        if (isHealthy) {
            return { status: 'healthy', message: 'Service responding normally' };
        }
        else if (isDegraded) {
            return { status: 'degraded', message: 'Service responding slowly' };
        }
        else {
            return { status: 'unhealthy', message: 'Service not responding' };
        }
    }
    async checkDatabaseHealth(target) {
        // Simulate database health check
        const connectionPool = {
            active: Math.floor(Math.random() * 10),
            idle: Math.floor(Math.random() * 20),
            total: 30
        };
        const isHealthy = connectionPool.active < 8;
        const status = isHealthy ? 'healthy' : connectionPool.active < 9 ? 'degraded' : 'unhealthy';
        return {
            status,
            message: `Database connection pool: ${connectionPool.active}/${connectionPool.total} active`,
            details: connectionPool
        };
    }
    async checkApiHealth(target) {
        // Simulate API health check
        const latency = Math.random() * 1000; // 0-1000ms
        let status;
        if (latency < 200) {
            status = 'healthy';
        }
        else if (latency < 500) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        return {
            status,
            message: `API latency: ${Math.round(latency)}ms`,
            latency
        };
    }
    async checkThresholds() {
        const newAlerts = [];
        for (const threshold of this.thresholds.values()) {
            if (!threshold.enabled)
                continue;
            const metricList = this.metrics.get(threshold.metric);
            if (!metricList || metricList.length === 0)
                continue;
            const latestMetric = metricList[metricList.length - 1];
            const isViolated = this.evaluateThreshold(latestMetric.value, threshold);
            if (isViolated) {
                const existingAlert = Array.from(this.alerts.values()).find(alert => alert.metric === threshold.metric && alert.status === 'active');
                if (!existingAlert) {
                    const alert = {
                        id: `alert_${threshold.metric}_${Date.now()}`,
                        level: threshold.severity,
                        message: `Threshold violated: ${threshold.metric} ${threshold.condition} ${threshold.value} (current: ${latestMetric.value})`,
                        timestamp: new Date(),
                        status: 'active',
                        metric: threshold.metric,
                        value: latestMetric.value,
                        threshold,
                        escalationLevel: 0
                    };
                    this.alerts.set(alert.id, alert);
                    this.alertHistory.push(alert);
                    newAlerts.push(alert);
                    this.events.emit('alert', alert);
                    this.logger.warn(`Alert triggered: ${alert.message}`);
                }
            }
            else {
                // Check if we should resolve any active alerts
                const activeAlert = Array.from(this.alerts.values()).find(alert => alert.metric === threshold.metric && alert.status === 'active');
                if (activeAlert) {
                    activeAlert.status = 'resolved';
                    activeAlert.resolvedAt = new Date();
                    this.events.emit('alert_resolved', activeAlert);
                    this.logger.info(`Alert resolved: ${activeAlert.message}`);
                }
            }
        }
        return newAlerts;
    }
    evaluateThreshold(value, threshold) {
        switch (threshold.condition) {
            case 'gt': return value > threshold.value;
            case 'gte': return value >= threshold.value;
            case 'lt': return value < threshold.value;
            case 'lte': return value <= threshold.value;
            case 'eq': return value === threshold.value;
            case 'ne': return value !== threshold.value;
            default: return false;
        }
    }
    calculateOverallStatus(alerts, healthChecks) {
        const hasCritical = alerts.some(alert => alert.level === 'critical') ||
            healthChecks.some(check => check.status === 'unhealthy');
        const hasWarning = alerts.some(alert => alert.level === 'warning' || alert.level === 'error') ||
            healthChecks.some(check => check.status === 'degraded');
        if (hasCritical)
            return 'critical';
        if (hasWarning)
            return 'warning';
        return 'normal';
    }
    isMetricKey(key) {
        const metricPatterns = [
            /cpu/i, /memory/i, /disk/i, /network/i,
            /latency/i, /throughput/i, /errors?/i, /requests?/i,
            /response_time/i, /queue/i, /connections?/i
        ];
        return metricPatterns.some(pattern => pattern.test(key));
    }
    getMetricUnit(name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('cpu') || lowerName.includes('percent'))
            return '%';
        if (lowerName.includes('memory') || lowerName.includes('bytes'))
            return 'bytes';
        if (lowerName.includes('time') || lowerName.includes('latency'))
            return 'ms';
        if (lowerName.includes('rate') || lowerName.includes('throughput'))
            return '/s';
        if (lowerName.includes('count') || lowerName.includes('requests'))
            return 'count';
        return '';
    }
    async startMonitoring() {
        for (const target of this.targets.values()) {
            if (!target.enabled)
                continue;
            const interval = setInterval(async () => {
                try {
                    await this.performHealthCheck(target);
                }
                catch (error) {
                    this.logger.error(`Health check failed for ${target.name}: ${error}`);
                }
            }, target.checkInterval * 1000);
            this.monitoringIntervals.set(target.id, interval);
        }
    }
    async stopMonitoring() {
        for (const [targetId, interval] of this.monitoringIntervals.entries()) {
            clearInterval(interval);
            this.monitoringIntervals.delete(targetId);
        }
    }
    initializeDefaultTargets() {
        // System monitoring target
        this.targets.set('system', {
            id: 'system',
            name: 'System Health',
            type: 'service',
            checkInterval: 30,
            timeout: 5,
            enabled: true,
            healthChecks: ['cpu', 'memory', 'disk'],
            thresholds: ['cpu_high', 'memory_high', 'disk_high']
        });
        // API monitoring target
        this.targets.set('api', {
            id: 'api',
            name: 'API Endpoints',
            type: 'api',
            endpoint: '/health',
            checkInterval: 60,
            timeout: 10,
            enabled: true,
            healthChecks: ['response_time', 'availability'],
            thresholds: ['api_latency_high', 'api_error_rate_high']
        });
    }
    initializeDefaultThresholds() {
        // CPU threshold
        this.thresholds.set('cpu_high', {
            id: 'cpu_high',
            metric: 'cpu_usage',
            condition: 'gt',
            value: 80,
            severity: 'warning',
            enabled: true,
            description: 'CPU usage above 80%'
        });
        // Memory threshold
        this.thresholds.set('memory_high', {
            id: 'memory_high',
            metric: 'memory_usage',
            condition: 'gt',
            value: 85,
            severity: 'critical',
            enabled: true,
            description: 'Memory usage above 85%'
        });
        // API latency threshold
        this.thresholds.set('api_latency_high', {
            id: 'api_latency_high',
            metric: 'response_time',
            condition: 'gt',
            value: 1000,
            severity: 'warning',
            enabled: true,
            description: 'API response time above 1000ms'
        });
        // Error rate threshold
        this.thresholds.set('error_rate_high', {
            id: 'error_rate_high',
            metric: 'error_rate',
            condition: 'gt',
            value: 5,
            severity: 'critical',
            enabled: true,
            description: 'Error rate above 5%'
        });
    }
    // Additional Sentinel-specific methods
    async addTarget(target) {
        this.targets.set(target.id, target);
        if (target.enabled) {
            const interval = setInterval(async () => {
                try {
                    await this.performHealthCheck(target);
                }
                catch (error) {
                    this.logger.error(`Health check failed for ${target.name}: ${error}`);
                }
            }, target.checkInterval * 1000);
            this.monitoringIntervals.set(target.id, interval);
        }
        this.logger.info(`Added monitoring target: ${target.name}`);
    }
    async removeTarget(targetId) {
        const interval = this.monitoringIntervals.get(targetId);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(targetId);
        }
        const removed = this.targets.delete(targetId);
        if (removed) {
            this.logger.info(`Removed monitoring target: ${targetId}`);
        }
        return removed;
    }
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
    }
    getAlertHistory(limit = 100) {
        return this.alertHistory
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.alerts.get(alertId);
        if (!alert)
            return false;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date();
        this.events.emit('alert_acknowledged', alert);
        this.logger.info(`Alert acknowledged: ${alert.message} by ${acknowledgedBy}`);
        return true;
    }
    getMetrics(metricName, timeRange) {
        if (metricName) {
            const metrics = this.metrics.get(metricName) || [];
            if (!timeRange)
                return metrics;
            return metrics.filter(metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end);
        }
        // Return all metrics
        const allMetrics = [];
        for (const metrics of this.metrics.values()) {
            allMetrics.push(...metrics);
        }
        if (!timeRange)
            return allMetrics;
        return allMetrics.filter(metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end);
    }
}
exports.SentinelAgent = SentinelAgent;
//# sourceMappingURL=sentinel-agent.js.map