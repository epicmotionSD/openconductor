/**
 * HubSpot Data Adapter for OpenConductor Trinity AI Agents
 * Handles real-time data synchronization and transformation between HubSpot and Trinity agents
 */
import { EventEmitter } from 'events';
interface HubSpotConfig {
    accessToken: string;
    baseURL?: string;
    rateLimits?: {
        daily: number;
        burst: number;
    };
    retryConfig?: {
        maxRetries: number;
        backoffFactor: number;
        maxDelay: number;
    };
}
interface DataSyncConfig {
    syncInterval: number;
    batchSize: number;
    enableRealTimeSync: boolean;
    cacheTimeout: number;
}
interface SyncResult {
    success: boolean;
    recordsProcessed: number;
    recordsUpdated: number;
    recordsCreated: number;
    errors: Array<{
        record: string;
        error: string;
    }>;
    duration: number;
    nextSyncToken?: string;
}
export declare class HubSpotDataAdapter extends EventEmitter {
    private httpClient;
    private config;
    private syncConfig;
    private dataCache;
    private syncTokens;
    private rateLimitState;
    private syncIntervals;
    constructor(config: HubSpotConfig, syncConfig?: Partial<DataSyncConfig>);
    /**
     * Setup HTTP interceptors for rate limiting and error handling
     */
    private setupInterceptors;
    /**
     * DEALS DATA ADAPTER
     */
    syncDealsData(): Promise<SyncResult>;
    /**
     * CONTACTS DATA ADAPTER
     */
    syncContactsData(): Promise<SyncResult>;
    /**
     * COMPANIES DATA ADAPTER
     */
    syncCompaniesData(): Promise<SyncResult>;
    /**
     * MARKETING DATA ADAPTER
     */
    syncMarketingData(): Promise<SyncResult>;
    /**
     * GET AGGREGATED DATA FOR TRINITY AGENTS
     */
    getAggregatedDataForOracle(): Promise<any>;
    getAggregatedDataForSentinel(): Promise<any>;
    getAggregatedDataForSage(): Promise<any>;
    /**
     * DATA TRANSFORMATION METHODS
     */
    private transformDealRecord;
    private transformContactRecord;
    private transformCompanyRecord;
    /**
     * PERIODIC SYNC MANAGEMENT
     */
    private startPeriodicSync;
    /**
     * UTILITY METHODS
     */
    private checkRateLimit;
    private updateRateLimitState;
    private delay;
    private syncEmailCampaigns;
    private syncMarketingAnalytics;
    private calculateAPIMetrics;
    private assessDataQuality;
    private analyzePipelineHealth;
    private analyzeCustomerSegments;
    private identifyMarketTrends;
    private performCompetitiveAnalysis;
    private buildOpportunityMatrix;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export {};
//# sourceMappingURL=hubspot-data-adapter.d.ts.map