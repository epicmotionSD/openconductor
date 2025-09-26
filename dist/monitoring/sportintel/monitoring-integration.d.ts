/**
 * SportIntel Monitoring Integration
 *
 * Integrates Prometheus metrics collection, Grafana dashboards, and SLA monitoring
 * to provide Bloomberg Terminal-level observability and reliability.
 */
import { Express } from 'express';
import { EventBus } from '../../events/event-bus';
/**
 * Complete monitoring integration for SportIntel
 */
export declare class SportIntelMonitoringIntegration {
    private logger;
    private config;
    private eventBus;
    private metricsCollector;
    private slaMonitor;
    private app;
    constructor(app: Express, eventBus: EventBus);
    /**
     * Setup monitoring HTTP endpoints
     */
    private setupMonitoringEndpoints;
    /**
     * Setup Grafana dashboards
     */
    private setupGrafanaDashboards;
    /**
     * Start periodic monitoring tasks
     */
    private startPeriodicTasks;
    /**
     * Generate daily monitoring report
     */
    private generateDailyReport;
    /**
     * Perform health check
     */
    private performHealthCheck;
    /**
     * Get dashboard data
     */
    private getDashboardData;
    /**
     * Get key metrics summary
     */
    private getKeyMetrics;
    /**
     * Get performance summary
     */
    private getPerformanceSummary;
    /**
     * Get business metrics
     */
    private getBusinessMetrics;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Store monitoring report
     */
    private storeReport;
    private calculateUptime;
    private getAverageResponseTime;
    private getResponseTimeP95;
    private getMaxResponseTime;
    private getThroughput;
    private getErrorRate;
    private getCacheHitRate;
    private getTotalRequests;
    private getSuccessRate;
    private getActiveUserCount;
    private getCurrentRevenue;
    private getPredictionCount;
    private getSubscriptionDistribution;
    private getFeatureUsage;
    private getUsageLimitsHit;
    private getActiveSubscriptions;
    private getMonthlyRevenue;
    private getNewSignups;
    private getChurnRate;
    private getAverageRevenuePerUser;
    private getDbConnections;
    private getQueryPerformance;
    private getCacheSize;
    private getCompressionRatio;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Get monitoring status
     */
    getStatus(): any;
}
/**
 * Initialize SportIntel monitoring
 */
export declare const initializeSportIntelMonitoring: (app: Express, eventBus: EventBus) => SportIntelMonitoringIntegration;
export default SportIntelMonitoringIntegration;
//# sourceMappingURL=monitoring-integration.d.ts.map