/**
 * Cache Integration Service for SportIntel
 *
 * Central service that orchestrates intelligent caching, cost-aware routing,
 * and data optimization to achieve the $150/month cost target.
 */
import { EventEmitter } from 'events';
import { CacheConfig } from './intelligent-cache-manager';
import { ApiProvider } from './cost-aware-api-router';
export interface CacheIntegrationConfig {
    cache: CacheConfig;
    providers: ApiProvider[];
    optimization: {
        enablePredictiveWarming: boolean;
        enableBatchOptimization: boolean;
        enableCostAlerts: boolean;
        maxConcurrentRequests: number;
        gameWarmupHours: number;
    };
    monitoring: {
        metricsInterval: number;
        alertThresholds: {
            hitRate: number;
            responseTime: number;
            costPerHour: number;
        };
    };
}
export interface DataRequest<T = any> {
    key: string;
    dataType: 'player' | 'game' | 'market' | 'historical' | 'prediction';
    params: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    maxCost?: number;
    requiredBy?: Date;
    forceFresh?: boolean;
    batchable?: boolean;
}
export interface OptimizationReport {
    period: string;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    totalCost: number;
    costSavings: number;
    averageResponseTime: number;
    topCostDrivers: Array<{
        dataType: string;
        cost: number;
        requests: number;
    }>;
    recommendations: string[];
}
export declare class CacheIntegrationService extends EventEmitter {
    private cacheManager;
    private apiRouter;
    private config;
    private logger;
    private requestQueue;
    private batchTimer;
    private metricsTimer;
    constructor(config: CacheIntegrationConfig);
    /**
     * Primary data fetching method with intelligent caching and routing
     */
    getData<T>(request: DataRequest<T>): Promise<T | null>;
    /**
     * Batch data fetching with optimization
     */
    getBatch<T>(requests: DataRequest<T>[]): Promise<Array<{
        key: string;
        data: T | null;
    }>>;
    /**
     * Predictive cache warming for upcoming games
     */
    warmCacheForGames(gameIds: string[]): Promise<void>;
    /**
     * Generate optimization report
     */
    generateOptimizationReport(period?: 'hour' | 'day' | 'week'): Promise<OptimizationReport>;
    /**
     * Optimize cache configuration based on usage patterns
     */
    optimizeConfiguration(): Promise<void>;
    /**
     * Get comprehensive metrics for monitoring
     */
    getMetrics(): {
        cache: import("./intelligent-cache-manager").CacheStats;
        routing: {
            totalRequests: number;
            totalCost: number;
            costSavings: number;
            providerStats: Record<string, any>;
            cacheStats: import("./intelligent-cache-manager").CacheStats;
            averageResponseTime: number;
        };
        cost: {
            dailyCost: number;
            hourlyCost: number;
            dailyBudgetUsed: number;
            hourlyBudgetUsed: number;
            isNearBudgetLimit: boolean;
            remainingDailyBudget: number;
            remainingHourlyBudget: number;
        };
        uptime: number;
        timestamp: Date;
    };
    /**
     * Health check for the caching system
     */
    healthCheck(): Promise<{
        healthy: boolean;
        issues: string[];
    }>;
    private generateCacheKey;
    private getEndpointForDataType;
    private getDefaultMaxCost;
    private groupRequestsForBatching;
    private processBatchGroup;
    private warmGameData;
    private calculateTopCostDrivers;
    private generateOptimizationRecommendations;
    private optimizeCacheTTLs;
    private optimizeProviderConfiguration;
    private setupEventHandlers;
    private startBatchProcessor;
    private processPendingBatches;
    private startMetricsCollection;
    private checkForAlerts;
    private setupGameWarmup;
    private getUpcomingGames;
    /**
     * Cleanup resources
     */
    destroy(): Promise<void>;
}
export default CacheIntegrationService;
//# sourceMappingURL=cache-integration-service.d.ts.map