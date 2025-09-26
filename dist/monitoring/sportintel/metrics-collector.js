"use strict";
/**
 * SportIntel Metrics Collector
 *
 * Extends OpenConductor monitoring with sports analytics specific metrics,
 * SLA tracking, and performance monitoring for Bloomberg Terminal-level reliability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportIntelMetricsCollector = void 0;
const prom_client_1 = require("prom-client");
const logger_1 = require("../../utils/logger");
const development_config_1 = require("../../config/sportintel/development-config");
/**
 * SportIntel Metrics Collector
 */
class SportIntelMetricsCollector {
    logger;
    config;
    eventBus;
    // Core Performance Metrics
    httpRequestDuration;
    httpRequestsTotal;
    httpRequestErrors;
    websocketConnections;
    websocketMessages;
    // Sports Analytics Metrics
    predictionsTotal;
    predictionAccuracy;
    predictionLatency;
    predictionErrors;
    dataProviderRequests;
    dataProviderLatency;
    dataProviderErrors;
    // Cache Metrics
    cacheHits;
    cacheMisses;
    cacheLatency;
    cacheSize;
    cacheEvictions;
    // Subscription & Business Metrics
    activeSubscriptions;
    subscriptionRevenue;
    subscriptionEvents;
    usageLimitsHit;
    featureUsage;
    // ML Model Metrics
    modelInferences;
    modelLatency;
    modelAccuracy;
    modelErrors;
    shapExplanations;
    // Database Metrics
    dbConnections;
    dbQueries;
    dbQueryDuration;
    dbErrors;
    timescaleCompressionRatio;
    // Portfolio & DFS Metrics
    portfoliosActive;
    lineupsGenerated;
    optimizationRequests;
    optimizationLatency;
    alertsSent;
    constructor(eventBus) {
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.eventBus = eventBus;
        // Initialize metrics
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'sportintel_http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code', 'subscription_tier'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
        });
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'sportintel_http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code', 'subscription_tier'],
        });
        this.httpRequestErrors = new prom_client_1.Counter({
            name: 'sportintel_http_request_errors_total',
            help: 'Total number of HTTP request errors',
            labelNames: ['method', 'route', 'error_type', 'subscription_tier'],
        });
        this.websocketConnections = new prom_client_1.Gauge({
            name: 'sportintel_websocket_connections_active',
            help: 'Active WebSocket connections',
            labelNames: ['subscription_tier'],
        });
        this.websocketMessages = new prom_client_1.Counter({
            name: 'sportintel_websocket_messages_total',
            help: 'Total WebSocket messages sent',
            labelNames: ['type', 'subscription_tier'],
        });
        this.predictionsTotal = new prom_client_1.Counter({
            name: 'sportintel_predictions_total',
            help: 'Total number of predictions generated',
            labelNames: ['model', 'sport', 'position', 'subscription_tier'],
        });
        this.predictionAccuracy = new prom_client_1.Histogram({
            name: 'sportintel_prediction_accuracy',
            help: 'Prediction accuracy distribution',
            labelNames: ['model', 'sport', 'position'],
            buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        });
        this.predictionLatency = new prom_client_1.Histogram({
            name: 'sportintel_prediction_latency_seconds',
            help: 'Time taken to generate predictions',
            labelNames: ['model', 'sport'],
            buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
        });
        this.predictionErrors = new prom_client_1.Counter({
            name: 'sportintel_prediction_errors_total',
            help: 'Total prediction errors',
            labelNames: ['model', 'error_type', 'sport'],
        });
        this.dataProviderRequests = new prom_client_1.Counter({
            name: 'sportintel_data_provider_requests_total',
            help: 'Total requests to data providers',
            labelNames: ['provider', 'endpoint', 'status'],
        });
        this.dataProviderLatency = new prom_client_1.Histogram({
            name: 'sportintel_data_provider_latency_seconds',
            help: 'Data provider response times',
            labelNames: ['provider', 'endpoint'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
        });
        this.dataProviderErrors = new prom_client_1.Counter({
            name: 'sportintel_data_provider_errors_total',
            help: 'Data provider errors',
            labelNames: ['provider', 'error_type'],
        });
        this.cacheHits = new prom_client_1.Counter({
            name: 'sportintel_cache_hits_total',
            help: 'Cache hits',
            labelNames: ['layer', 'key_type'],
        });
        this.cacheMisses = new prom_client_1.Counter({
            name: 'sportintel_cache_misses_total',
            help: 'Cache misses',
            labelNames: ['layer', 'key_type'],
        });
        this.cacheLatency = new prom_client_1.Histogram({
            name: 'sportintel_cache_latency_seconds',
            help: 'Cache operation latency',
            labelNames: ['operation', 'layer'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5],
        });
        this.cacheSize = new prom_client_1.Gauge({
            name: 'sportintel_cache_size_bytes',
            help: 'Current cache size in bytes',
            labelNames: ['layer'],
        });
        this.cacheEvictions = new prom_client_1.Counter({
            name: 'sportintel_cache_evictions_total',
            help: 'Cache evictions',
            labelNames: ['layer', 'reason'],
        });
        this.activeSubscriptions = new prom_client_1.Gauge({
            name: 'sportintel_active_subscriptions',
            help: 'Currently active subscriptions',
            labelNames: ['tier', 'status'],
        });
        this.subscriptionRevenue = new prom_client_1.Gauge({
            name: 'sportintel_subscription_revenue_dollars',
            help: 'Current subscription revenue in dollars',
            labelNames: ['tier', 'period'],
        });
        this.subscriptionEvents = new prom_client_1.Counter({
            name: 'sportintel_subscription_events_total',
            help: 'Subscription lifecycle events',
            labelNames: ['event_type', 'tier'],
        });
        this.usageLimitsHit = new prom_client_1.Counter({
            name: 'sportintel_usage_limits_hit_total',
            help: 'Usage limits hit by subscription tier',
            labelNames: ['limit_type', 'tier'],
        });
        this.featureUsage = new prom_client_1.Counter({
            name: 'sportintel_feature_usage_total',
            help: 'Feature usage by subscription tier',
            labelNames: ['feature', 'tier'],
        });
        this.modelInferences = new prom_client_1.Counter({
            name: 'sportintel_model_inferences_total',
            help: 'ML model inferences performed',
            labelNames: ['model_name', 'version', 'sport'],
        });
        this.modelLatency = new prom_client_1.Histogram({
            name: 'sportintel_model_latency_seconds',
            help: 'ML model inference latency',
            labelNames: ['model_name', 'sport'],
            buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2],
        });
        this.modelAccuracy = new prom_client_1.Histogram({
            name: 'sportintel_model_accuracy',
            help: 'ML model accuracy distribution',
            labelNames: ['model_name', 'sport'],
            buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        });
        this.modelErrors = new prom_client_1.Counter({
            name: 'sportintel_model_errors_total',
            help: 'ML model errors',
            labelNames: ['model_name', 'error_type'],
        });
        this.shapExplanations = new prom_client_1.Counter({
            name: 'sportintel_shap_explanations_total',
            help: 'SHAP explanations generated',
            labelNames: ['model_name', 'sport'],
        });
        this.dbConnections = new prom_client_1.Gauge({
            name: 'sportintel_db_connections_active',
            help: 'Active database connections',
            labelNames: ['database', 'pool'],
        });
        this.dbQueries = new prom_client_1.Counter({
            name: 'sportintel_db_queries_total',
            help: 'Total database queries',
            labelNames: ['database', 'operation', 'table'],
        });
        this.dbQueryDuration = new prom_client_1.Histogram({
            name: 'sportintel_db_query_duration_seconds',
            help: 'Database query duration',
            labelNames: ['database', 'operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
        });
        this.dbErrors = new prom_client_1.Counter({
            name: 'sportintel_db_errors_total',
            help: 'Database errors',
            labelNames: ['database', 'error_type'],
        });
        this.timescaleCompressionRatio = new prom_client_1.Gauge({
            name: 'sportintel_timescale_compression_ratio',
            help: 'TimescaleDB compression ratio',
            labelNames: ['table'],
        });
        this.portfoliosActive = new prom_client_1.Gauge({
            name: 'sportintel_portfolios_active',
            help: 'Active portfolios',
            labelNames: ['subscription_tier'],
        });
        this.lineupsGenerated = new prom_client_1.Counter({
            name: 'sportintel_lineups_generated_total',
            help: 'Total lineups generated',
            labelNames: ['contest_type', 'optimization_type', 'subscription_tier'],
        });
        this.optimizationRequests = new prom_client_1.Counter({
            name: 'sportintel_optimization_requests_total',
            help: 'Portfolio optimization requests',
            labelNames: ['optimization_type', 'subscription_tier'],
        });
        this.optimizationLatency = new prom_client_1.Histogram({
            name: 'sportintel_optimization_latency_seconds',
            help: 'Portfolio optimization latency',
            labelNames: ['optimization_type'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30],
        });
        this.alertsSent = new prom_client_1.Counter({
            name: 'sportintel_alerts_sent_total',
            help: 'Alerts sent to users',
            labelNames: ['alert_type', 'severity', 'subscription_tier'],
        });
        // Setup event listeners
        this.setupEventListeners();
        this.logger.info('SportIntel metrics collector initialized');
    }
    /**
     * Setup event listeners for automatic metric collection
     */
    setupEventListeners() {
        // HTTP request metrics
        this.eventBus.subscribe('http.request.completed', (event) => {
            const { method, route, statusCode, duration, subscriptionTier = 'none' } = event.data;
            this.httpRequestDuration
                .labels(method, route, statusCode.toString(), subscriptionTier)
                .observe(duration / 1000);
            this.httpRequestsTotal
                .labels(method, route, statusCode.toString(), subscriptionTier)
                .inc();
            if (statusCode >= 400) {
                this.httpRequestErrors
                    .labels(method, route, this.getErrorType(statusCode), subscriptionTier)
                    .inc();
            }
        });
        // WebSocket metrics
        this.eventBus.subscribe('websocket.connected', (event) => {
            const { subscriptionTier = 'none' } = event.data;
            this.websocketConnections.labels(subscriptionTier).inc();
        });
        this.eventBus.subscribe('websocket.disconnected', (event) => {
            const { subscriptionTier = 'none' } = event.data;
            this.websocketConnections.labels(subscriptionTier).dec();
        });
        this.eventBus.subscribe('websocket.message.sent', (event) => {
            const { type, subscriptionTier = 'none' } = event.data;
            this.websocketMessages.labels(type, subscriptionTier).inc();
        });
        // Prediction metrics
        this.eventBus.subscribe('prediction.generated', (event) => {
            const { model, sport, position, subscriptionTier = 'none', latency } = event.data;
            this.predictionsTotal.labels(model, sport, position, subscriptionTier).inc();
            if (latency) {
                this.predictionLatency.labels(model, sport).observe(latency / 1000);
            }
        });
        this.eventBus.subscribe('prediction.accuracy.measured', (event) => {
            const { model, sport, position, accuracy } = event.data;
            this.predictionAccuracy.labels(model, sport, position).observe(accuracy);
        });
        this.eventBus.subscribe('prediction.error', (event) => {
            const { model, sport, errorType } = event.data;
            this.predictionErrors.labels(model, errorType, sport).inc();
        });
        // Data provider metrics
        this.eventBus.subscribe('data.provider.request', (event) => {
            const { provider, endpoint, status, latency } = event.data;
            this.dataProviderRequests.labels(provider, endpoint, status).inc();
            if (latency) {
                this.dataProviderLatency.labels(provider, endpoint).observe(latency / 1000);
            }
            if (status === 'error') {
                this.dataProviderErrors.labels(provider, 'request_failed').inc();
            }
        });
        // Cache metrics
        this.eventBus.subscribe('cache.hit', (event) => {
            const { layer, keyType } = event.data;
            this.cacheHits.labels(layer, keyType).inc();
        });
        this.eventBus.subscribe('cache.miss', (event) => {
            const { layer, keyType } = event.data;
            this.cacheMisses.labels(layer, keyType).inc();
        });
        this.eventBus.subscribe('cache.operation', (event) => {
            const { operation, layer, duration } = event.data;
            this.cacheLatency.labels(operation, layer).observe(duration / 1000);
        });
        this.eventBus.subscribe('cache.eviction', (event) => {
            const { layer, reason } = event.data;
            this.cacheEvictions.labels(layer, reason).inc();
        });
        // Subscription metrics
        this.eventBus.subscribe('billing.*', (event) => {
            const eventType = event.type.split('.').pop();
            const { tier = 'unknown' } = event.data;
            this.subscriptionEvents.labels(eventType, tier).inc();
        });
        this.eventBus.subscribe('usage.limit.exceeded', (event) => {
            const { limitType, tier = 'unknown' } = event.data;
            this.usageLimitsHit.labels(limitType, tier).inc();
        });
        // Feature usage metrics
        this.eventBus.subscribe('feature.used', (event) => {
            const { feature, tier = 'unknown' } = event.data;
            this.featureUsage.labels(feature, tier).inc();
        });
        // ML model metrics
        this.eventBus.subscribe('model.inference', (event) => {
            const { modelName, version, sport, latency } = event.data;
            this.modelInferences.labels(modelName, version, sport).inc();
            if (latency) {
                this.modelLatency.labels(modelName, sport).observe(latency / 1000);
            }
        });
        this.eventBus.subscribe('model.accuracy.updated', (event) => {
            const { modelName, sport, accuracy } = event.data;
            this.modelAccuracy.labels(modelName, sport).observe(accuracy);
        });
        this.eventBus.subscribe('shap.explanation.generated', (event) => {
            const { modelName, sport } = event.data;
            this.shapExplanations.labels(modelName, sport).inc();
        });
        // Database metrics
        this.eventBus.subscribe('db.query.executed', (event) => {
            const { database, operation, table, duration } = event.data;
            this.dbQueries.labels(database, operation, table).inc();
            if (duration) {
                this.dbQueryDuration.labels(database, operation, table).observe(duration / 1000);
            }
        });
        this.eventBus.subscribe('db.error', (event) => {
            const { database, errorType } = event.data;
            this.dbErrors.labels(database, errorType).inc();
        });
        // Portfolio metrics
        this.eventBus.subscribe('lineup.generated', (event) => {
            const { contestType, optimizationType, subscriptionTier = 'none' } = event.data;
            this.lineupsGenerated.labels(contestType, optimizationType, subscriptionTier).inc();
        });
        this.eventBus.subscribe('optimization.requested', (event) => {
            const { optimizationType, subscriptionTier = 'none', latency } = event.data;
            this.optimizationRequests.labels(optimizationType, subscriptionTier).inc();
            if (latency) {
                this.optimizationLatency.labels(optimizationType).observe(latency / 1000);
            }
        });
        this.eventBus.subscribe('alert.sent', (event) => {
            const { alertType, severity, subscriptionTier = 'none' } = event.data;
            this.alertsSent.labels(alertType, severity, subscriptionTier).inc();
        });
        this.logger.info('SportIntel metrics event listeners configured');
    }
    /**
     * Get error type from HTTP status code
     */
    getErrorType(statusCode) {
        if (statusCode >= 400 && statusCode < 500)
            return 'client_error';
        if (statusCode >= 500)
            return 'server_error';
        return 'unknown';
    }
    /**
     * Update subscription metrics periodically
     */
    async updateSubscriptionMetrics() {
        try {
            // This would fetch data from subscription manager
            const tiers = ['rookie', 'pro', 'elite', 'champion'];
            const statuses = ['active', 'past_due', 'canceled'];
            for (const tier of tiers) {
                for (const status of statuses) {
                    // Mock data - in real implementation, fetch from subscription manager
                    const count = Math.floor(Math.random() * 1000);
                    this.activeSubscriptions.labels(tier, status).set(count);
                }
                // Mock revenue data
                const monthlyRevenue = Math.floor(Math.random() * 100000);
                const yearlyRevenue = monthlyRevenue * 12;
                this.subscriptionRevenue.labels(tier, 'monthly').set(monthlyRevenue);
                this.subscriptionRevenue.labels(tier, 'yearly').set(yearlyRevenue);
            }
        }
        catch (error) {
            this.logger.error('Failed to update subscription metrics', { error });
        }
    }
    /**
     * Update database metrics
     */
    async updateDatabaseMetrics() {
        try {
            // Mock TimescaleDB compression ratios
            const tables = ['player_stats', 'game_data', 'market_data', 'predictions'];
            for (const table of tables) {
                const compressionRatio = 0.1 + Math.random() * 0.4; // 10-50% compression
                this.timescaleCompressionRatio.labels(table).set(compressionRatio);
            }
            // Mock connection counts
            this.dbConnections.labels('timescaledb', 'main').set(15);
            this.dbConnections.labels('redis', 'cache').set(50);
        }
        catch (error) {
            this.logger.error('Failed to update database metrics', { error });
        }
    }
    /**
     * Update portfolio metrics
     */
    async updatePortfolioMetrics() {
        try {
            const tiers = ['rookie', 'pro', 'elite', 'champion'];
            for (const tier of tiers) {
                const activePortfolios = Math.floor(Math.random() * 1000);
                this.portfoliosActive.labels(tier).set(activePortfolios);
            }
        }
        catch (error) {
            this.logger.error('Failed to update portfolio metrics', { error });
        }
    }
    /**
     * Start periodic metric updates
     */
    startPeriodicUpdates() {
        // Update subscription metrics every 5 minutes
        setInterval(() => {
            this.updateSubscriptionMetrics();
        }, 5 * 60 * 1000);
        // Update database metrics every 2 minutes
        setInterval(() => {
            this.updateDatabaseMetrics();
        }, 2 * 60 * 1000);
        // Update portfolio metrics every 3 minutes
        setInterval(() => {
            this.updatePortfolioMetrics();
        }, 3 * 60 * 1000);
        this.logger.info('Periodic metric updates started');
    }
    /**
     * Get current metrics summary
     */
    async getMetricsSummary() {
        const metrics = await prom_client_1.register.metrics();
        return {
            timestamp: new Date().toISOString(),
            metrics: metrics,
            collectors: prom_client_1.register.getSingleMetric.length,
        };
    }
    /**
     * Register custom metric
     */
    registerCustomMetric(metric) {
        prom_client_1.register.registerMetric(metric);
    }
    /**
     * Clear all metrics
     */
    clearMetrics() {
        prom_client_1.register.clear();
    }
}
exports.SportIntelMetricsCollector = SportIntelMetricsCollector;
exports.default = SportIntelMetricsCollector;
//# sourceMappingURL=metrics-collector.js.map