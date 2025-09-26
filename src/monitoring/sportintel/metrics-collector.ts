/**
 * SportIntel Metrics Collector
 * 
 * Extends OpenConductor monitoring with sports analytics specific metrics,
 * SLA tracking, and performance monitoring for Bloomberg Terminal-level reliability.
 */

import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { Logger } from '../../utils/logger';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
import { EventBus } from '../../events/event-bus';

// Custom metric interfaces
interface PredictionMetrics {
  total: number;
  successful: number;
  failed: number;
  avgAccuracy: number;
  avgLatency: number;
}

interface SubscriptionMetrics {
  activeUsers: number;
  totalRevenue: number;
  churnRate: number;
  conversionRate: number;
  avgRevenuePerUser: number;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  cacheHitRate: number;
}

/**
 * SportIntel Metrics Collector
 */
export class SportIntelMetricsCollector {
  private logger: Logger;
  private config: SportIntelConfigManager;
  private eventBus: EventBus;

  // Core Performance Metrics
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestErrors: Counter<string>;
  private readonly websocketConnections: Gauge<string>;
  private readonly websocketMessages: Counter<string>;

  // Sports Analytics Metrics
  private readonly predictionsTotal: Counter<string>;
  private readonly predictionAccuracy: Histogram<string>;
  private readonly predictionLatency: Histogram<string>;
  private readonly predictionErrors: Counter<string>;
  private readonly dataProviderRequests: Counter<string>;
  private readonly dataProviderLatency: Histogram<string>;
  private readonly dataProviderErrors: Counter<string>;

  // Cache Metrics
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;
  private readonly cacheLatency: Histogram<string>;
  private readonly cacheSize: Gauge<string>;
  private readonly cacheEvictions: Counter<string>;

  // Subscription & Business Metrics
  private readonly activeSubscriptions: Gauge<string>;
  private readonly subscriptionRevenue: Gauge<string>;
  private readonly subscriptionEvents: Counter<string>;
  private readonly usageLimitsHit: Counter<string>;
  private readonly featureUsage: Counter<string>;

  // ML Model Metrics
  private readonly modelInferences: Counter<string>;
  private readonly modelLatency: Histogram<string>;
  private readonly modelAccuracy: Histogram<string>;
  private readonly modelErrors: Counter<string>;
  private readonly shapExplanations: Counter<string>;

  // Database Metrics
  private readonly dbConnections: Gauge<string>;
  private readonly dbQueries: Counter<string>;
  private readonly dbQueryDuration: Histogram<string>;
  private readonly dbErrors: Counter<string>;
  private readonly timescaleCompressionRatio: Gauge<string>;

  // Portfolio & DFS Metrics
  private readonly portfoliosActive: Gauge<string>;
  private readonly lineupsGenerated: Counter<string>;
  private readonly optimizationRequests: Counter<string>;
  private readonly optimizationLatency: Histogram<string>;
  private readonly alertsSent: Counter<string>;

  constructor(eventBus: EventBus) {
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.eventBus = eventBus;

    // Initialize metrics
    this.httpRequestDuration = new Histogram({
      name: 'sportintel_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'subscription_tier'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    });

    this.httpRequestsTotal = new Counter({
      name: 'sportintel_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'subscription_tier'],
    });

    this.httpRequestErrors = new Counter({
      name: 'sportintel_http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type', 'subscription_tier'],
    });

    this.websocketConnections = new Gauge({
      name: 'sportintel_websocket_connections_active',
      help: 'Active WebSocket connections',
      labelNames: ['subscription_tier'],
    });

    this.websocketMessages = new Counter({
      name: 'sportintel_websocket_messages_total',
      help: 'Total WebSocket messages sent',
      labelNames: ['type', 'subscription_tier'],
    });

    this.predictionsTotal = new Counter({
      name: 'sportintel_predictions_total',
      help: 'Total number of predictions generated',
      labelNames: ['model', 'sport', 'position', 'subscription_tier'],
    });

    this.predictionAccuracy = new Histogram({
      name: 'sportintel_prediction_accuracy',
      help: 'Prediction accuracy distribution',
      labelNames: ['model', 'sport', 'position'],
      buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    });

    this.predictionLatency = new Histogram({
      name: 'sportintel_prediction_latency_seconds',
      help: 'Time taken to generate predictions',
      labelNames: ['model', 'sport'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    });

    this.predictionErrors = new Counter({
      name: 'sportintel_prediction_errors_total',
      help: 'Total prediction errors',
      labelNames: ['model', 'error_type', 'sport'],
    });

    this.dataProviderRequests = new Counter({
      name: 'sportintel_data_provider_requests_total',
      help: 'Total requests to data providers',
      labelNames: ['provider', 'endpoint', 'status'],
    });

    this.dataProviderLatency = new Histogram({
      name: 'sportintel_data_provider_latency_seconds',
      help: 'Data provider response times',
      labelNames: ['provider', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    this.dataProviderErrors = new Counter({
      name: 'sportintel_data_provider_errors_total',
      help: 'Data provider errors',
      labelNames: ['provider', 'error_type'],
    });

    this.cacheHits = new Counter({
      name: 'sportintel_cache_hits_total',
      help: 'Cache hits',
      labelNames: ['layer', 'key_type'],
    });

    this.cacheMisses = new Counter({
      name: 'sportintel_cache_misses_total',
      help: 'Cache misses',
      labelNames: ['layer', 'key_type'],
    });

    this.cacheLatency = new Histogram({
      name: 'sportintel_cache_latency_seconds',
      help: 'Cache operation latency',
      labelNames: ['operation', 'layer'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5],
    });

    this.cacheSize = new Gauge({
      name: 'sportintel_cache_size_bytes',
      help: 'Current cache size in bytes',
      labelNames: ['layer'],
    });

    this.cacheEvictions = new Counter({
      name: 'sportintel_cache_evictions_total',
      help: 'Cache evictions',
      labelNames: ['layer', 'reason'],
    });

    this.activeSubscriptions = new Gauge({
      name: 'sportintel_active_subscriptions',
      help: 'Currently active subscriptions',
      labelNames: ['tier', 'status'],
    });

    this.subscriptionRevenue = new Gauge({
      name: 'sportintel_subscription_revenue_dollars',
      help: 'Current subscription revenue in dollars',
      labelNames: ['tier', 'period'],
    });

    this.subscriptionEvents = new Counter({
      name: 'sportintel_subscription_events_total',
      help: 'Subscription lifecycle events',
      labelNames: ['event_type', 'tier'],
    });

    this.usageLimitsHit = new Counter({
      name: 'sportintel_usage_limits_hit_total',
      help: 'Usage limits hit by subscription tier',
      labelNames: ['limit_type', 'tier'],
    });

    this.featureUsage = new Counter({
      name: 'sportintel_feature_usage_total',
      help: 'Feature usage by subscription tier',
      labelNames: ['feature', 'tier'],
    });

    this.modelInferences = new Counter({
      name: 'sportintel_model_inferences_total',
      help: 'ML model inferences performed',
      labelNames: ['model_name', 'version', 'sport'],
    });

    this.modelLatency = new Histogram({
      name: 'sportintel_model_latency_seconds',
      help: 'ML model inference latency',
      labelNames: ['model_name', 'sport'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2],
    });

    this.modelAccuracy = new Histogram({
      name: 'sportintel_model_accuracy',
      help: 'ML model accuracy distribution',
      labelNames: ['model_name', 'sport'],
      buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    });

    this.modelErrors = new Counter({
      name: 'sportintel_model_errors_total',
      help: 'ML model errors',
      labelNames: ['model_name', 'error_type'],
    });

    this.shapExplanations = new Counter({
      name: 'sportintel_shap_explanations_total',
      help: 'SHAP explanations generated',
      labelNames: ['model_name', 'sport'],
    });

    this.dbConnections = new Gauge({
      name: 'sportintel_db_connections_active',
      help: 'Active database connections',
      labelNames: ['database', 'pool'],
    });

    this.dbQueries = new Counter({
      name: 'sportintel_db_queries_total',
      help: 'Total database queries',
      labelNames: ['database', 'operation', 'table'],
    });

    this.dbQueryDuration = new Histogram({
      name: 'sportintel_db_query_duration_seconds',
      help: 'Database query duration',
      labelNames: ['database', 'operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.dbErrors = new Counter({
      name: 'sportintel_db_errors_total',
      help: 'Database errors',
      labelNames: ['database', 'error_type'],
    });

    this.timescaleCompressionRatio = new Gauge({
      name: 'sportintel_timescale_compression_ratio',
      help: 'TimescaleDB compression ratio',
      labelNames: ['table'],
    });

    this.portfoliosActive = new Gauge({
      name: 'sportintel_portfolios_active',
      help: 'Active portfolios',
      labelNames: ['subscription_tier'],
    });

    this.lineupsGenerated = new Counter({
      name: 'sportintel_lineups_generated_total',
      help: 'Total lineups generated',
      labelNames: ['contest_type', 'optimization_type', 'subscription_tier'],
    });

    this.optimizationRequests = new Counter({
      name: 'sportintel_optimization_requests_total',
      help: 'Portfolio optimization requests',
      labelNames: ['optimization_type', 'subscription_tier'],
    });

    this.optimizationLatency = new Histogram({
      name: 'sportintel_optimization_latency_seconds',
      help: 'Portfolio optimization latency',
      labelNames: ['optimization_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30],
    });

    this.alertsSent = new Counter({
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
  private setupEventListeners(): void {
    // HTTP request metrics
    this.eventBus.subscribe('http.request.completed', (event: any) => {
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
    this.eventBus.subscribe('websocket.connected', (event: any) => {
      const { subscriptionTier = 'none' } = event.data;
      this.websocketConnections.labels(subscriptionTier).inc();
    });

    this.eventBus.subscribe('websocket.disconnected', (event: any) => {
      const { subscriptionTier = 'none' } = event.data;
      this.websocketConnections.labels(subscriptionTier).dec();
    });

    this.eventBus.subscribe('websocket.message.sent', (event: any) => {
      const { type, subscriptionTier = 'none' } = event.data;
      this.websocketMessages.labels(type, subscriptionTier).inc();
    });

    // Prediction metrics
    this.eventBus.subscribe('prediction.generated', (event: any) => {
      const { model, sport, position, subscriptionTier = 'none', latency } = event.data;
      
      this.predictionsTotal.labels(model, sport, position, subscriptionTier).inc();
      
      if (latency) {
        this.predictionLatency.labels(model, sport).observe(latency / 1000);
      }
    });

    this.eventBus.subscribe('prediction.accuracy.measured', (event: any) => {
      const { model, sport, position, accuracy } = event.data;
      this.predictionAccuracy.labels(model, sport, position).observe(accuracy);
    });

    this.eventBus.subscribe('prediction.error', (event: any) => {
      const { model, sport, errorType } = event.data;
      this.predictionErrors.labels(model, errorType, sport).inc();
    });

    // Data provider metrics
    this.eventBus.subscribe('data.provider.request', (event: any) => {
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
    this.eventBus.subscribe('cache.hit', (event: any) => {
      const { layer, keyType } = event.data;
      this.cacheHits.labels(layer, keyType).inc();
    });

    this.eventBus.subscribe('cache.miss', (event: any) => {
      const { layer, keyType } = event.data;
      this.cacheMisses.labels(layer, keyType).inc();
    });

    this.eventBus.subscribe('cache.operation', (event: any) => {
      const { operation, layer, duration } = event.data;
      this.cacheLatency.labels(operation, layer).observe(duration / 1000);
    });

    this.eventBus.subscribe('cache.eviction', (event: any) => {
      const { layer, reason } = event.data;
      this.cacheEvictions.labels(layer, reason).inc();
    });

    // Subscription metrics
    this.eventBus.subscribe('billing.*', (event: any) => {
      const eventType = event.type.split('.').pop();
      const { tier = 'unknown' } = event.data;
      this.subscriptionEvents.labels(eventType, tier).inc();
    });

    this.eventBus.subscribe('usage.limit.exceeded', (event: any) => {
      const { limitType, tier = 'unknown' } = event.data;
      this.usageLimitsHit.labels(limitType, tier).inc();
    });

    // Feature usage metrics
    this.eventBus.subscribe('feature.used', (event: any) => {
      const { feature, tier = 'unknown' } = event.data;
      this.featureUsage.labels(feature, tier).inc();
    });

    // ML model metrics
    this.eventBus.subscribe('model.inference', (event: any) => {
      const { modelName, version, sport, latency } = event.data;
      
      this.modelInferences.labels(modelName, version, sport).inc();
      
      if (latency) {
        this.modelLatency.labels(modelName, sport).observe(latency / 1000);
      }
    });

    this.eventBus.subscribe('model.accuracy.updated', (event: any) => {
      const { modelName, sport, accuracy } = event.data;
      this.modelAccuracy.labels(modelName, sport).observe(accuracy);
    });

    this.eventBus.subscribe('shap.explanation.generated', (event: any) => {
      const { modelName, sport } = event.data;
      this.shapExplanations.labels(modelName, sport).inc();
    });

    // Database metrics
    this.eventBus.subscribe('db.query.executed', (event: any) => {
      const { database, operation, table, duration } = event.data;
      
      this.dbQueries.labels(database, operation, table).inc();
      
      if (duration) {
        this.dbQueryDuration.labels(database, operation, table).observe(duration / 1000);
      }
    });

    this.eventBus.subscribe('db.error', (event: any) => {
      const { database, errorType } = event.data;
      this.dbErrors.labels(database, errorType).inc();
    });

    // Portfolio metrics
    this.eventBus.subscribe('lineup.generated', (event: any) => {
      const { contestType, optimizationType, subscriptionTier = 'none' } = event.data;
      this.lineupsGenerated.labels(contestType, optimizationType, subscriptionTier).inc();
    });

    this.eventBus.subscribe('optimization.requested', (event: any) => {
      const { optimizationType, subscriptionTier = 'none', latency } = event.data;
      
      this.optimizationRequests.labels(optimizationType, subscriptionTier).inc();
      
      if (latency) {
        this.optimizationLatency.labels(optimizationType).observe(latency / 1000);
      }
    });

    this.eventBus.subscribe('alert.sent', (event: any) => {
      const { alertType, severity, subscriptionTier = 'none' } = event.data;
      this.alertsSent.labels(alertType, severity, subscriptionTier).inc();
    });

    this.logger.info('SportIntel metrics event listeners configured');
  }

  /**
   * Get error type from HTTP status code
   */
  private getErrorType(statusCode: number): string {
    if (statusCode >= 400 && statusCode < 500) return 'client_error';
    if (statusCode >= 500) return 'server_error';
    return 'unknown';
  }

  /**
   * Update subscription metrics periodically
   */
  async updateSubscriptionMetrics(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to update subscription metrics', { error });
    }
  }

  /**
   * Update database metrics
   */
  async updateDatabaseMetrics(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to update database metrics', { error });
    }
  }

  /**
   * Update portfolio metrics
   */
  async updatePortfolioMetrics(): Promise<void> {
    try {
      const tiers = ['rookie', 'pro', 'elite', 'champion'];
      
      for (const tier of tiers) {
        const activePortfolios = Math.floor(Math.random() * 1000);
        this.portfoliosActive.labels(tier).set(activePortfolios);
      }
    } catch (error) {
      this.logger.error('Failed to update portfolio metrics', { error });
    }
  }

  /**
   * Start periodic metric updates
   */
  startPeriodicUpdates(): void {
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
  async getMetricsSummary(): Promise<any> {
    const metrics = await register.metrics();
    return {
      timestamp: new Date().toISOString(),
      metrics: metrics,
      collectors: register.getSingleMetric.length,
    };
  }

  /**
   * Register custom metric
   */
  registerCustomMetric(metric: any): void {
    register.registerMetric(metric);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    register.clear();
  }
}

export default SportIntelMetricsCollector;