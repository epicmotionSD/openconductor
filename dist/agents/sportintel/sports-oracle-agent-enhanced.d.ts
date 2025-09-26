/**
 * Enhanced SportsOracleAgent with Explainable AI Integration
 *
 * Advanced sports prediction agent that extends the base OracleAgent with
 * SHAP/LIME explainable AI capabilities. This provides transparency in
 * predictions, justifying the premium pricing model.
 *
 * Key Features:
 * - Explainable predictions with SHAP/LIME analysis
 * - Real-time prediction updates with explanations
 * - Bloomberg Terminal-style transparent AI
 * - Domain-specific sports knowledge integration
 * - Performance optimized for sub-200ms explanations
 */
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';
import { SportsDataManager } from '../../storage/sportintel/sports-data-manager';
import { ExplanationResult } from '../../ai/sportintel/explainable-ai-engine';
export interface EnhancedOracleConfig {
    name: string;
    version: string;
    predictiveModels: {
        enabled: string[];
        defaultConfidence: number;
        ensembleWeights: Record<string, number>;
    };
    explainableAI: {
        enabled: boolean;
        alwaysExplain: boolean;
        explainThreshold: number;
        visualizations: boolean;
    };
    realTimeUpdates: {
        enabled: boolean;
        updateIntervalMs: number;
        batchUpdates: boolean;
    };
    performance: {
        predictionTimeoutMs: number;
        explanationTimeoutMs: number;
        cacheEnabled: boolean;
        maxConcurrentPredictions: number;
    };
}
export interface EnhancedPrediction {
    predictionId: string;
    playerId: string;
    prediction: {
        value: number;
        confidence: number;
        range: [number, number];
        modelUsed: string;
    };
    explanation?: ExplanationResult;
    context: {
        gameContext: any;
        playerContext: any;
        marketContext: any;
    };
    metadata: {
        timestamp: Date;
        processingTime: number;
        explainabilityEnabled: boolean;
        cacheUsed: boolean;
    };
}
export interface LineupOptimizationResult {
    lineups: Array<{
        lineup: Array<{
            playerId: string;
            position: string;
            salary: number;
            projection: number;
            ownership: number;
        }>;
        totalSalary: number;
        projectedScore: number;
        riskScore: number;
        explanation?: ExplanationResult;
    }>;
    strategy: {
        type: 'cash' | 'gpp' | 'satellite';
        riskProfile: 'conservative' | 'balanced' | 'aggressive';
        keyFactors: string[];
        reasoning: string;
    };
    alternatives: Array<{
        lineup: any;
        rationale: string;
        tradeoffs: string[];
    }>;
    optimization: {
        algorithm: string;
        iterations: number;
        convergence: number;
        processingTime: number;
    };
}
export declare class EnhancedSportsOracleAgent {
    private logger;
    private eventBus;
    private dataManager;
    private explainableAI;
    private config;
    private activePredictions;
    private predictionCache;
    private modelRegistry;
    private metrics;
    constructor(config: EnhancedOracleConfig, logger: Logger, eventBus: EventBus, dataManager: SportsDataManager);
    /**
     * Generate explainable player performance prediction
     */
    predictPlayerPerformance(playerId: string, gameContext: any, options?: {
        modelType?: string;
        features?: string[];
        includeUncertainty?: boolean;
        forceExplanation?: boolean;
        explainabilityLevel?: 'basic' | 'detailed' | 'comprehensive';
    }): Promise<EnhancedPrediction>;
    /**
     * Generate explainable lineup optimization
     */
    optimizeLineups(playerPool: any[], constraints: any, options?: {
        contest: string;
        site: string;
        objectives?: string[];
        riskTolerance?: 'conservative' | 'balanced' | 'aggressive';
        numLineups?: number;
        diversityFactor?: number;
        explainStrategy?: boolean;
    }): Promise<LineupOptimizationResult>;
    /**
     * Update player prediction in real-time with explanation
     */
    updatePlayerPrediction(playerId: string, newContext: any, options?: {
        realTime?: boolean;
        maxLatencyMs?: number;
        explainChange?: boolean;
    }): Promise<EnhancedPrediction>;
    private preparePredictionInput;
    private generateBasePrediction;
    private runPredictionModel;
    private shouldGenerateExplanation;
    private batchPredictPlayers;
    private runLineupOptimization;
    private constructLineup;
    private generateLineupStrategy;
    private generateLineupAlternatives;
    private explainLineupConstruction;
    private extractFeatures;
    private getMarketContext;
    private explainPredictionChange;
    private initializePredictionModels;
    private generatePredictionId;
    private generateOptimizationId;
    private generateCacheKey;
    private isCacheValid;
    private getLatestPrediction;
    private getPositionBaseValue;
    private getFeatureWeight;
    private calculateLineupRisk;
    private calculateStackCorrelation;
    private identifyChangeFactors;
    private getTopChangeReason;
    private updatePredictionMetrics;
    getMetrics(): typeof this.metrics;
    isHealthy(): boolean;
    clearCache(): Promise<void>;
}
export declare function createEnhancedSportsOracleAgent(config: EnhancedOracleConfig, logger: Logger, eventBus: EventBus, dataManager: SportsDataManager): EnhancedSportsOracleAgent;
export declare const defaultEnhancedOracleConfig: EnhancedOracleConfig;
//# sourceMappingURL=sports-oracle-agent-enhanced.d.ts.map