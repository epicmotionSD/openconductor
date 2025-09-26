/**
 * TimescaleDB Sports Data Store
 *
 * High-performance time-series database integration for SportIntel platform,
 * optimized for sports analytics with automatic compression and retention policies.
 *
 * Key Features:
 * - Hypertables for player stats, game data, and predictions
 * - Automatic compression (90%+ space savings)
 * - Intelligent data retention policies by subscription tier
 * - Real-time continuous aggregates
 * - Cost-optimized storage strategies
 */
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';
export interface TimescaleConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
    compressionEnabled?: boolean;
    retentionPolicies?: Record<string, string>;
}
export interface SportsTimeSeriesData {
    timestamp: Date;
    playerId?: string;
    gameId?: string;
    team?: string;
    season?: number;
    week?: number;
    data: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface PlayerStatPoint {
    timestamp: Date;
    playerId: string;
    gameId: string;
    team: string;
    opponent: string;
    position: string;
    week: number;
    season: number;
    fantasyPoints: number;
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receivingTDs?: number;
    receptions?: number;
    targets?: number;
    snapCount?: number;
    redZoneTargets?: number;
    airYards?: number;
    targetShare?: number;
    gameScript?: number;
    weatherTemp?: number;
    weatherWind?: number;
    dataSource: string;
    confidence: number;
}
export interface GameStatePoint {
    timestamp: Date;
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    week: number;
    season: number;
    quarter: number;
    timeRemaining: number;
    homeScore: number;
    awayScore: number;
    possession: string;
    down?: number;
    distance?: number;
    yardLine?: number;
    gameScript: number;
    scoreDifferential: number;
    winProbability: number;
    temperature?: number;
    windSpeed?: number;
    precipitation?: number;
    venue: string;
    surface: string;
}
export interface PredictionPoint {
    timestamp: Date;
    predictionId: string;
    modelId: string;
    playerId?: string;
    gameId?: string;
    predictionType: 'player_performance' | 'game_outcome' | 'ownership';
    predictedValue: number;
    actualValue?: number;
    confidence: number;
    features: Record<string, number>;
    shapValues?: Record<string, number>;
    modelVersion: string;
    isValidated: boolean;
    accuracy?: number;
}
export declare class TimescaleSportsStore {
    private pool;
    private logger;
    private eventBus;
    private initialized;
    constructor(config: TimescaleConfig, logger: Logger, eventBus: EventBus);
    /**
     * Initialize TimescaleDB hypertables and policies
     */
    initialize(): Promise<void>;
    /**
     * Insert player statistics with automatic conflict resolution
     */
    insertPlayerStats(stats: PlayerStatPoint[]): Promise<void>;
    /**
     * Insert game state data for real-time game analysis
     */
    insertGameStates(states: GameStatePoint[]): Promise<void>;
    /**
     * Insert prediction data for model accuracy tracking
     */
    insertPredictions(predictions: PredictionPoint[]): Promise<void>;
    /**
     * Query player statistics with time range and filters
     */
    queryPlayerStats(filters: {
        playerId?: string;
        team?: string;
        position?: string;
        startTime: Date;
        endTime: Date;
        season?: number;
        week?: number;
        limit?: number;
    }): Promise<PlayerStatPoint[]>;
    /**
     * Get real-time aggregated statistics using continuous aggregates
     */
    getPlayerAggregates(playerId: string, timeframe: '1h' | '1d' | '7d' | '30d' | 'season'): Promise<{
        avgFantasyPoints: number;
        totalSnapCount: number;
        consistencyScore: number;
        recentTrend: number;
        gameCount: number;
    }>;
    /**
     * Clean up old data based on retention policies
     */
    cleanupOldData(): Promise<{
        deletedRows: number;
        freedSpace: string;
    }>;
    private createPlayerStatsHypertable;
    private createGameStatesHypertable;
    private createPredictionsHypertable;
    private createOwnershipHypertable;
    private createInjuriesHypertable;
    private createWeatherHypertable;
    private setupCompressionPolicies;
    private setupRetentionPolicies;
    private createContinuousAggregates;
    private createOptimizedIndexes;
    private getMaterializedViewName;
    private mapRowToPlayerStat;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
//# sourceMappingURL=timescale-sports-store.d.ts.map