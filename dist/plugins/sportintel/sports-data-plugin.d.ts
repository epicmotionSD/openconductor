/**
 * Sports Data Integration Plugin
 *
 * Multi-provider sports data integration system that extends OpenConductor's
 * PluginManager architecture to efficiently manage costs and data quality
 * across MySportsFeeds, API-Sports, nflfastR, and other providers.
 *
 * Key Features:
 * - Cost-aware provider selection and routing
 * - Intelligent fallback and redundancy
 * - Rate limit management and queuing
 * - Data quality validation and enrichment
 * - Real-time webhook processing
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';
export interface DataProviderConfig {
    id: string;
    name: string;
    type: 'api' | 'webhook' | 'file' | 'database';
    priority: number;
    costPerCall: number;
    rateLimits: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
        burstLimit?: number;
    };
    reliability: {
        uptime: number;
        accuracy: number;
        latency: number;
    };
    endpoints: {
        [key: string]: {
            url: string;
            method: 'GET' | 'POST' | 'PUT' | 'DELETE';
            headers?: Record<string, string>;
            rateLimit?: number;
            cost?: number;
        };
    };
    authentication: {
        type: 'apikey' | 'oauth' | 'bearer' | 'none';
        config: Record<string, any>;
    };
    dataTypes: string[];
    updateFrequency: number;
    retryPolicy: {
        maxRetries: number;
        backoffMultiplier: number;
        initialDelay: number;
    };
}
export interface DataRequest {
    dataType: 'player_stats' | 'game_schedules' | 'injury_reports' | 'weather' | 'odds' | 'ownership';
    priority: 'low' | 'medium' | 'high' | 'critical';
    params: Record<string, any>;
    maxCost?: number;
    preferredProviders?: string[];
    excludeProviders?: string[];
    cacheStrategy?: 'always' | 'never' | 'smart';
    freshness?: number;
}
export interface DataResponse {
    data: any;
    provider: string;
    cost: number;
    latency: number;
    cached: boolean;
    confidence: number;
    timestamp: Date;
    metadata: {
        version?: string;
        source?: string;
        quality?: number;
    };
}
export interface ProviderMetrics {
    providerId: string;
    callsToday: number;
    costToday: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
    rateLimitHits: number;
    lastCall: Date;
    status: 'active' | 'degraded' | 'down' | 'suspended';
}
export declare class SportsDataPlugin extends EventEmitter {
    private providers;
    private providerMetrics;
    private requestQueue;
    private rateLimitTrackers;
    private logger;
    private eventBus;
    private initialized;
    private processingQueue;
    constructor(logger: Logger, eventBus: EventBus);
    /**
     * Initialize the sports data plugin with provider configurations
     */
    initialize(providers: DataProviderConfig[]): Promise<void>;
    /**
     * Register a new data provider
     */
    registerProvider(config: DataProviderConfig): Promise<void>;
    /**
     * Request data from the most appropriate provider
     */
    requestData(request: DataRequest): Promise<DataResponse>;
    /**
     * Get provider metrics and recommendations
     */
    getProviderMetrics(): {
        providers: ProviderMetrics[];
        totalCostToday: number;
        recommendations: string[];
        costOptimization: {
            potentialSavings: number;
            suggestedChanges: string[];
        };
    };
    private initializeDefaultProviders;
    private validateProviderConfig;
    private processQueue;
    private executeDataRequest;
    private selectOptimalProvider;
    private checkRateLimit;
    private makeProviderRequest;
    private calculateRequestCost;
    private updateProviderMetrics;
    private tryFallbackProviders;
    private setupEventListeners;
    private startQueueProcessor;
    private startMetricsCollection;
    private startHealthMonitoring;
    private checkProviderHealth;
    private handleProviderHealthCheck;
    private handleCostWarning;
    private sleep;
    /**
     * Cleanup resources
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=sports-data-plugin.d.ts.map