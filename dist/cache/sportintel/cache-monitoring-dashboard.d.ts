/**
 * Cache Monitoring Dashboard for SportIntel
 *
 * Real-time monitoring and alerting system for the intelligent cache
 * to ensure $150/month cost target and 95% hit rate performance.
 */
import { EventEmitter } from 'events';
import CacheIntegrationService, { OptimizationReport } from './cache-integration-service';
export interface DashboardMetrics {
    timestamp: Date;
    performance: {
        hitRate: number;
        missRate: number;
        averageResponseTime: number;
        requestsPerSecond: number;
        errorRate: number;
    };
    cost: {
        hourlyRate: number;
        dailySpent: number;
        monthlyProjected: number;
        budgetUtilization: number;
        costPerRequest: number;
        savings: number;
    };
    providers: Record<string, {
        requests: number;
        cost: number;
        responseTime: number;
        errorRate: number;
        utilization: number;
    }>;
    cache: {
        memoryUsage: number;
        redisUsage: number;
        totalEntries: number;
        evictionRate: number;
        compressionRatio: number;
    };
    alerts: Array<{
        type: 'cost' | 'performance' | 'error';
        severity: 'info' | 'warning' | 'critical';
        message: string;
        timestamp: Date;
        value: number;
        threshold: number;
    }>;
}
export interface AlertConfig {
    cost: {
        hourlyBudget: number;
        dailyBudget: number;
        monthlyBudget: number;
        warningThreshold: number;
    };
    performance: {
        minHitRate: number;
        maxResponseTime: number;
        maxErrorRate: number;
    };
    notifications: {
        email?: string[];
        webhook?: string;
        slack?: string;
    };
}
export declare class CacheMonitoringDashboard extends EventEmitter {
    private cacheService;
    private logger;
    private alertConfig;
    private metricsHistory;
    private activeAlerts;
    private monitoringTimer;
    constructor(cacheService: CacheIntegrationService, alertConfig: AlertConfig);
    /**
     * Get current dashboard metrics
     */
    getCurrentMetrics(): DashboardMetrics;
    /**
     * Get metrics history for charting
     */
    getMetricsHistory(hours?: number): DashboardMetrics[];
    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport(period?: 'hour' | 'day' | 'week'): Promise<{
        summary: OptimizationReport;
        trends: {
            hitRate: Array<{
                time: Date;
                value: number;
            }>;
            cost: Array<{
                time: Date;
                value: number;
            }>;
            responseTime: Array<{
                time: Date;
                value: number;
            }>;
        };
        recommendations: string[];
        costBreakdown: Array<{
            category: string;
            amount: number;
            percentage: number;
        }>;
    }>;
    /**
     * Check and trigger alerts based on current metrics
     */
    private checkAlerts;
    /**
     * Get cost optimization suggestions
     */
    getCostOptimizationSuggestions(): Array<{
        category: string;
        suggestion: string;
        estimatedSavings: number;
        difficulty: 'easy' | 'medium' | 'hard';
    }>;
    /**
     * Export metrics data for external analysis
     */
    exportMetrics(format?: 'json' | 'csv'): string;
    private setupMonitoring;
    private setupCacheServiceListeners;
    private calculateRequestsPerSecond;
    private calculateErrorRate;
    private calculateCostPerRequest;
    private getProviderMetrics;
    private getMemoryUsage;
    private getRedisUsage;
    private calculateEvictionRate;
    private calculateCompressionRatio;
    private generateRecommendations;
    private calculateCostBreakdown;
    private sendNotification;
    private sendEmailNotification;
    private sendWebhookNotification;
    private sendSlackNotification;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const DEFAULT_ALERT_CONFIG: AlertConfig;
export default CacheMonitoringDashboard;
//# sourceMappingURL=cache-monitoring-dashboard.d.ts.map