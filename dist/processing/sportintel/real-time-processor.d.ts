/**
 * SportIntel Real-Time Data Processing Pipeline
 *
 * High-performance event processing pipeline built on OpenConductor's EventBus
 * designed to achieve sub-200ms response times for critical sports events.
 *
 * Key Features:
 * - Sub-200ms event processing for live games
 * - Intelligent event prioritization and routing
 * - Parallel processing with backpressure control
 * - Integration with Trinity AI agents for real-time predictions
 * - Bloomberg Terminal-style real-time updates
 */
import { EventBus } from '../../types/events';
import { Logger } from '../../utils/logger';
import { SportsOracleAgent } from '../../agents/sportintel/sports-oracle-agent';
import { SportsSentinelAgent } from '../../agents/sportintel/sports-sentinel-agent';
import { SportsDataManager } from '../../storage/sportintel/sports-data-manager';
export interface RealTimeProcessorConfig {
    enabled: boolean;
    performance: {
        targetLatencyMs: number;
        maxConcurrentEvents: number;
        processingTimeoutMs: number;
        batchProcessingEnabled: boolean;
        batchSize: number;
        batchTimeoutMs: number;
    };
    eventPriorities: {
        critical: string[];
        high: string[];
        medium: string[];
        low: string[];
    };
    processing: {
        enableMetrics: boolean;
        enableProfiling: boolean;
        circuitBreakerEnabled: boolean;
        retryAttempts: number;
        backpressureThreshold: number;
    };
    streaming: {
        bufferSize: number;
        flushIntervalMs: number;
        enableCompression: boolean;
    };
}
export interface ProcessingMetrics {
    totalEvents: number;
    avgLatency: number;
    successRate: number;
    errorCount: number;
    throughputPerSecond: number;
    backpressureEvents: number;
    circuitBreakerTrips: number;
}
export interface EventProcessingContext {
    eventId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    receivedAt: Date;
    deadline: Date;
    retryCount: number;
    processingStage: string;
    metadata: Record<string, any>;
}
export declare class RealTimeProcessor {
    private eventBus;
    private logger;
    private config;
    private sportsOracle;
    private sportsSentinel;
    private dataManager;
    private isProcessing;
    private activeEvents;
    private processingQueue;
    private metrics;
    private circuitBreakerOpen;
    private latencyBuffer;
    private throughputCounter;
    private lastThroughputReset;
    constructor(config: RealTimeProcessorConfig, eventBus: EventBus, logger: Logger, agents: {
        sportsOracle: SportsOracleAgent;
        sportsSentinel: SportsSentinelAgent;
        dataManager: SportsDataManager;
    });
    /**
     * Start the real-time processing pipeline
     */
    start(): Promise<void>;
    /**
     * Stop the real-time processing pipeline
     */
    stop(): Promise<void>;
    /**
     * Set up event subscriptions for real-time processing
     */
    private setupEventSubscriptions;
    /**
     * Process event with specific priority handling
     */
    private processEventWithPriority;
    /**
     * Process event immediately (for critical/real-time events)
     */
    private processEventImmediately;
    /**
     * Get event processors based on event type
     */
    private getEventProcessors;
    /**
     * Execute individual processor with timeout and error handling
     */
    private executeProcessor;
    private processGamePlay;
    private updateRealTimePredictions;
    private checkGameAlerts;
    private updateMarketData;
    private processInjuryUpdate;
    private analyzeInjuryImpact;
    private processLineupChange;
    private processLineMovement;
    private processOwnershipChange;
    private getDeadlineForPriority;
    private dropLowerPriorityEvents;
    private addToBatchQueue;
    private initializeProcessingQueues;
    private startProcessingLoops;
    private processBatchQueues;
    private processBatch;
    private startPerformanceMonitoring;
    private updateThroughputMetrics;
    private checkCircuitBreaker;
    private emitPerformanceMetrics;
    private updateProcessingMetrics;
    private handleProcessingError;
    private drainActiveEvents;
    private generateEventId;
    private calculateMarketImpact;
    private triggerInjuryAlerts;
    private updatePlayerProjections;
    private recalculateOwnership;
    private updateLineupAlerts;
    private refreshOptimalLineups;
    private analyzeMarketEfficiency;
    private updateBettingAlerts;
    private correlateWithNews;
    private updateValuePlays;
    private recalculateLineupOptimization;
    private triggerOwnershipAlerts;
    private logEventProcessing;
    private updateEventMetrics;
    getMetrics(): ProcessingMetrics;
    getActiveEventCount(): number;
    isHealthy(): boolean;
}
export declare function createRealTimeProcessor(config: RealTimeProcessorConfig, eventBus: EventBus, logger: Logger, agents: {
    sportsOracle: SportsOracleAgent;
    sportsSentinel: SportsSentinelAgent;
    dataManager: SportsDataManager;
}): RealTimeProcessor;
export declare const defaultRealTimeConfig: RealTimeProcessorConfig;
//# sourceMappingURL=real-time-processor.d.ts.map