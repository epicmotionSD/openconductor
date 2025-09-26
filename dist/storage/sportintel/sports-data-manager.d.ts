/**
 * Sports Data Manager
 *
 * Integration layer between OpenConductor's persistence system and TimescaleDB,
 * providing unified data access patterns for SportIntel agents with intelligent
 * caching and cost optimization.
 */
import { EventBus } from '../../types/events';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../utils/config-manager';
export interface SportsDataConfig {
    timescaledb: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
        maxConnections?: number;
    };
    caching: {
        enabled: boolean;
        defaultTTL: number;
        costOptimization: boolean;
    };
    costLimits: {
        monthlyBudget: number;
        dailyLimit: number;
        warningThreshold: number;
    };
}
export interface DataQuery {
    type: 'player_stats' | 'game_states' | 'predictions' | 'ownership' | 'injuries' | 'weather';
    filters: {
        playerId?: string;
        gameId?: string;
        team?: string;
        position?: string;
        startTime: Date;
        endTime: Date;
        season?: number;
        week?: number;
        limit?: number;
    };
    cacheStrategy?: 'always' | 'never' | 'smart';
    priority?: 'low' | 'medium' | 'high';
}
export interface DataInsert {
    type: 'player_stats' | 'game_states' | 'predictions' | 'ownership' | 'injuries' | 'weather';
    data: any[];
    source: string;
    confidence: number;
    deduplication?: boolean;
}
export interface CostMetrics {
    dailyCost: number;
    monthlyCost: number;
    queryCount: number;
    storageUsed: number;
    compressionRatio: number;
    projectedMonthlyCost: number;
}
export declare class SportsDataManager {
    private timescaleStore;
    private logger;
    private eventBus;
    private config;
    private costTracker;
    private queryCache;
    private initialized;
    constructor(config: ConfigManager, logger: Logger, eventBus: EventBus);
    /**
     * Initialize the sports data management system
     */
    initialize(): Promise<void>;
    /**
     * Query sports data with intelligent caching and cost optimization
     */
    queryData<T = any>(query: DataQuery): Promise<T[]>;
    /**
     * Insert sports data with deduplication and validation
     */
    insertData(insert: DataInsert): Promise<{
        inserted: number;
        deduplicated: number;
        errors: number;
    }>;
    /**
     * Get aggregated player statistics with caching
     */
    getPlayerAggregates(playerId: string, timeframe: '1h' | '1d' | '7d' | '30d' | 'season', bustCache?: boolean): Promise<{
        avgFantasyPoints: number;
        totalSnapCount: number;
        consistencyScore: number;
        recentTrend: number;
        gameCount: number;
    }>;
    /**
     * Get cost metrics and optimization recommendations
     */
    getCostMetrics(): Promise<CostMetrics & {
        recommendations: string[];
    }>;
    private setupEventListeners;
    private checkCostLimits;
    private shouldUseCache;
    private generateQueryKey;
    private getCachedResult;
    private cacheResult;
    private shouldCacheResult;
    private trackQueryCost;
    private getDailyCostData;
    private validateDataItem;
    private deduplicateData;
    private invalidateCache;
    private estimateStorageUsage;
    private startCostTracking;
    private initializeCostTracking;
    private startCacheCleanup;
    private queryGameStates;
    private queryPredictions;
    private queryOwnership;
    private queryInjuries;
    private queryWeather;
    private handleDataUpdate;
    private handleCacheInvalidation;
    private handleCostWarning;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
//# sourceMappingURL=sports-data-manager.d.ts.map