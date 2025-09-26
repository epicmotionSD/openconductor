/**
 * Intelligent Cache Manager for SportIntel
 *
 * Cost-optimized caching system targeting $150/month data budget through:
 * - Multi-layer cache architecture (L1: Memory, L2: Redis, L3: Database)
 * - Intelligent cache invalidation based on data freshness requirements
 * - Cost-aware API provider routing
 * - Predictive cache warming for upcoming games
 */
import { EventEmitter } from 'events';
export interface CacheConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        maxMemoryPolicy: string;
        maxMemory: string;
    };
    ttl: {
        playerData: number;
        gameData: number;
        marketData: number;
        predictions: number;
        historicalData: number;
        staticData: number;
    };
    costLimits: {
        monthlyBudget: number;
        dailyBudget: number;
        hourlyBudget: number;
        warningThreshold: number;
    };
    performance: {
        targetHitRate: number;
        maxResponseTime: number;
        warmupThreshold: number;
    };
}
export interface CacheStats {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    costSavings: number;
    apiCallsAvoided: number;
    averageResponseTime: number;
    cacheSize: number;
    evictionCount: number;
}
export interface CacheEntry<T = any> {
    key: string;
    value: T;
    ttl: number;
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    cost: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
}
export declare class IntelligentCacheManager extends EventEmitter {
    private redis;
    private memoryCache;
    private config;
    private logger;
    private stats;
    private costTracker;
    private invalidationScheduler;
    constructor(config: CacheConfig);
    /**
     * Get cached data with intelligent fallback strategy
     */
    get<T>(key: string, options?: {
        fallback?: () => Promise<T>;
        ttl?: number;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        tags?: string[];
    }): Promise<T | null>;
    /**
     * Set cached data with intelligent storage strategy
     */
    set<T>(key: string, value: T, options?: {
        ttl?: number;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        tags?: string[];
    }): Promise<boolean>;
    /**
     * Batch get for multiple keys with parallel processing
     */
    mget<T>(keys: string[], options?: {
        fallback?: (missedKeys: string[]) => Promise<Record<string, T>>;
        ttl?: number;
        priority?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<Record<string, T | null>>;
    /**
     * Invalidate cache entries by key or tags
     */
    invalidate(pattern: string | string[] | {
        tags: string[];
    }): Promise<number>;
    /**
     * Warm cache for upcoming games (predictive caching)
     */
    warmCache(gameIds: string[]): Promise<void>;
    /**
     * Get comprehensive cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get cost tracking information
     */
    getCostStats(): {
        dailyCost: number;
        hourlyCost: number;
        dailyBudgetUsed: number;
        hourlyBudgetUsed: number;
        isNearBudgetLimit: boolean;
        remainingDailyBudget: number;
        remainingHourlyBudget: number;
    };
    /**
     * Optimize cache performance by removing least valuable entries
     */
    optimize(): Promise<void>;
    private initializeStats;
    private getFromMemory;
    private getFromRedis;
    private setInMemory;
    private setInRedis;
    private calculateIntelligentTTL;
    private shouldStoreInMemory;
    private shouldStoreInRedis;
    private isExpired;
    private isFrequentlyAccessed;
    private estimateApiCost;
    private estimateBatchApiCost;
    private recordHit;
    private recordMiss;
    private updateAverageResponseTime;
    private evictLRUFromMemory;
    private deleteKey;
    private deleteByTags;
    private preloadGameData;
    private preloadPlayerData;
    private preloadMarketData;
    private optimizeMemoryCache;
    private optimizeRedisCache;
    private updatePerformanceMetrics;
    private setupRedisListeners;
    private startPerformanceMonitoring;
    private startCostMonitoring;
    private promoteToMemoryIfNeeded;
}
export default IntelligentCacheManager;
//# sourceMappingURL=intelligent-cache-manager.d.ts.map