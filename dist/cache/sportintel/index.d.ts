/**
 * SportIntel Intelligent Caching System
 *
 * Export all caching components for cost-optimized data management
 * targeting $150/month budget through intelligent cache strategies.
 */
export { default as IntelligentCacheManager } from './intelligent-cache-manager';
export type { CacheConfig, CacheStats, CacheEntry } from './intelligent-cache-manager';
export { default as CostAwareApiRouter } from './cost-aware-api-router';
export type { ApiProvider, RouteDecision, ApiRequest, ApiResponse } from './cost-aware-api-router';
export { default as CacheIntegrationService } from './cache-integration-service';
export type { CacheIntegrationConfig, DataRequest, OptimizationReport } from './cache-integration-service';
export declare function createSportIntelCacheConfig(): CacheIntegrationConfig;
export declare const DEFAULT_PROVIDERS: ApiProvider[];
export declare class CostOptimizer {
    static calculateOptimalTTL(dataType: string, accessFrequency: number): number;
    static selectCostOptimalProvider(providers: ApiProvider[], dataType: string, urgency?: 'low' | 'medium' | 'high'): ApiProvider | null;
    static estimateMonthlyCost(requestsPerDay: number, avgCostPerRequest: number, cacheHitRate?: number): number;
}
export declare class CacheWarmingStrategy {
    static getGameWarmupRequests(gameId: string): DataRequest[];
    static getPrimeTimeWarmupRequests(): DataRequest[];
}
export { CacheIntegrationConfig, DataRequest, OptimizationReport };
//# sourceMappingURL=index.d.ts.map