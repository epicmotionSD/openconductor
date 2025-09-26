/**
 * SportIntel Metrics Collector
 *
 * Extends OpenConductor monitoring with sports analytics specific metrics,
 * SLA tracking, and performance monitoring for Bloomberg Terminal-level reliability.
 */
import { EventBus } from '../../events/event-bus';
/**
 * SportIntel Metrics Collector
 */
export declare class SportIntelMetricsCollector {
    private logger;
    private config;
    private eventBus;
    private readonly httpRequestDuration;
    private readonly httpRequestsTotal;
    private readonly httpRequestErrors;
    private readonly websocketConnections;
    private readonly websocketMessages;
    private readonly predictionsTotal;
    private readonly predictionAccuracy;
    private readonly predictionLatency;
    private readonly predictionErrors;
    private readonly dataProviderRequests;
    private readonly dataProviderLatency;
    private readonly dataProviderErrors;
    private readonly cacheHits;
    private readonly cacheMisses;
    private readonly cacheLatency;
    private readonly cacheSize;
    private readonly cacheEvictions;
    private readonly activeSubscriptions;
    private readonly subscriptionRevenue;
    private readonly subscriptionEvents;
    private readonly usageLimitsHit;
    private readonly featureUsage;
    private readonly modelInferences;
    private readonly modelLatency;
    private readonly modelAccuracy;
    private readonly modelErrors;
    private readonly shapExplanations;
    private readonly dbConnections;
    private readonly dbQueries;
    private readonly dbQueryDuration;
    private readonly dbErrors;
    private readonly timescaleCompressionRatio;
    private readonly portfoliosActive;
    private readonly lineupsGenerated;
    private readonly optimizationRequests;
    private readonly optimizationLatency;
    private readonly alertsSent;
    constructor(eventBus: EventBus);
    /**
     * Setup event listeners for automatic metric collection
     */
    private setupEventListeners;
    /**
     * Get error type from HTTP status code
     */
    private getErrorType;
    /**
     * Update subscription metrics periodically
     */
    updateSubscriptionMetrics(): Promise<void>;
    /**
     * Update database metrics
     */
    updateDatabaseMetrics(): Promise<void>;
    /**
     * Update portfolio metrics
     */
    updatePortfolioMetrics(): Promise<void>;
    /**
     * Start periodic metric updates
     */
    startPeriodicUpdates(): void;
    /**
     * Get current metrics summary
     */
    getMetricsSummary(): Promise<any>;
    /**
     * Register custom metric
     */
    registerCustomMetric(metric: any): void;
    /**
     * Clear all metrics
     */
    clearMetrics(): void;
}
export default SportIntelMetricsCollector;
//# sourceMappingURL=metrics-collector.d.ts.map