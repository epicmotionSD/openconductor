/**
 * Cost-Aware API Router for SportIntel
 *
 * Intelligent routing system that minimizes API costs by:
 * - Dynamic provider selection based on cost and data quality
 * - Request deduplication and batching
 * - Fallback hierarchies for cost optimization
 * - Rate limiting and quota management
 */
import { EventEmitter } from 'events';
import IntelligentCacheManager from './intelligent-cache-manager';
export interface ApiProvider {
    name: string;
    baseUrl: string;
    apiKey: string;
    costPerRequest: number;
    rateLimit: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    reliability: number;
    dataQuality: number;
    specialties: string[];
    fallbackPriority: number;
}
export interface RouteDecision {
    provider: ApiProvider;
    estimatedCost: number;
    cacheStrategy: 'miss' | 'hit' | 'refresh';
    reason: string;
    alternatives: ApiProvider[];
}
export interface ApiRequest {
    endpoint: string;
    params: Record<string, any>;
    dataType: 'player' | 'game' | 'market' | 'historical' | 'prediction';
    priority: 'low' | 'medium' | 'high' | 'critical';
    maxCost: number;
    cacheable: boolean;
    batchable: boolean;
    requiredBy: Date;
}
export interface ApiResponse<T = any> {
    data: T;
    provider: string;
    cost: number;
    cached: boolean;
    responseTime: number;
    quality: number;
}
export declare class CostAwareApiRouter extends EventEmitter {
    private providers;
    private requestQueue;
    private rateLimiters;
    private costTracker;
    private logger;
    private cacheManager;
    private batchProcessor;
    constructor(providers: ApiProvider[], cacheManager: IntelligentCacheManager);
    /**
     * Route API request through optimal provider
     */
    route<T>(request: ApiRequest): Promise<ApiResponse<T>>;
    /**
     * Batch multiple requests for cost efficiency
     */
    routeBatch<T>(requests: ApiRequest[]): Promise<ApiResponse<T>[]>;
    /**
     * Get the best provider for a specific data type
     */
    getBestProvider(dataType: string, maxCost?: number): ApiProvider | null;
    /**
     * Add or update API provider
     */
    updateProvider(provider: ApiProvider): void;
    /**
     * Get routing statistics and cost analysis
     */
    getStats(): {
        totalRequests: number;
        totalCost: number;
        costSavings: number;
        providerStats: Record<string, any>;
        cacheStats: import("./intelligent-cache-manager").CacheStats;
        averageResponseTime: number;
    };
    private generateRouteKey;
    private checkCache;
    private makeRoutingDecision;
    private getViableProviders;
    private selectOptimalProvider;
    private calculateProviderScore;
    private calculateLoadPenalty;
    private calculateCostBonus;
    private providerCanHandle;
    private canMeetDeadline;
    private getSelectionReason;
    private executeRequest;
    private makeApiCall;
    private cacheResponse;
    private generateCacheKey;
    private calculateCacheTTL;
    private groupForBatching;
    private executeBatchRequest;
    private trackRequest;
    private getProviderStats;
    private startBatchProcessor;
    private startCostMonitoring;
}
export default CostAwareApiRouter;
//# sourceMappingURL=cost-aware-api-router.d.ts.map