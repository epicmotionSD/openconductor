/**
 * SportIntel Explainable AI Engine
 *
 * Advanced explainable AI implementation providing SHAP and LIME explanations
 * for sports predictions. This transparency engine differentiates SportIntel
 * from competitors by showing users WHY predictions are made.
 *
 * Key Features:
 * - SHAP (SHapley Additive exPlanations) for feature importance
 * - LIME (Local Interpretable Model-agnostic Explanations) for instance explanations
 * - Custom sports-domain explanation templates
 * - Visual explanation generation for Bloomberg Terminal UI
 * - Performance optimized for real-time explanations (<100ms)
 */
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';
export interface ExplainableAIConfig {
    enabled: boolean;
    methods: {
        shap: {
            enabled: boolean;
            backgroundSamples: number;
            maxFeatures: number;
            approximation: 'exact' | 'kernel' | 'tree';
        };
        lime: {
            enabled: boolean;
            numSamples: number;
            numFeatures: number;
            kernelWidth: number;
        };
    };
    performance: {
        cacheExplanations: boolean;
        cacheTTL: number;
        maxConcurrentExplanations: number;
        timeoutMs: number;
    };
    visualization: {
        enabled: boolean;
        chartTypes: string[];
        maxDataPoints: number;
    };
    domainKnowledge: {
        sportsContextEnabled: boolean;
        playerPositionWeights: Record<string, number>;
        situationalFactors: string[];
    };
}
export interface PredictionInput {
    playerId: string;
    features: Record<string, number>;
    gameContext: {
        opponent: string;
        venue: 'home' | 'away';
        weather?: Record<string, any>;
        gameTime?: string;
        down?: number;
        distance?: number;
    };
    playerContext: {
        position: string;
        team: string;
        injuryStatus: string;
        recentPerformance: number[];
    };
    metadata: {
        modelId: string;
        predictionType: string;
        timestamp: Date;
    };
}
export interface ExplanationResult {
    explanationId: string;
    predictionId: string;
    method: 'shap' | 'lime' | 'hybrid';
    prediction: {
        value: number;
        confidence: number;
        range: [number, number];
    };
    explanations: {
        shap?: SHAPExplanation;
        lime?: LIMEExplanation;
        natural?: NaturalLanguageExplanation;
    };
    visualizations?: ExplanationVisualization[];
    performance: {
        computationTime: number;
        cacheHit: boolean;
        confidence: number;
    };
    timestamp: Date;
}
export interface SHAPExplanation {
    baseValue: number;
    shapValues: Record<string, number>;
    featureImportances: Array<{
        feature: string;
        importance: number;
        value: number;
        contribution: number;
        rank: number;
    }>;
    interactions?: Array<{
        feature1: string;
        feature2: string;
        interaction: number;
    }>;
    globalImportance: Record<string, number>;
}
export interface LIMEExplanation {
    localFeatures: Array<{
        feature: string;
        coefficient: number;
        value: number;
        confidence: [number, number];
        rank: number;
    }>;
    fidelity: number;
    r2Score: number;
    interceptValue: number;
    neighborhoodSize: number;
}
export interface NaturalLanguageExplanation {
    summary: string;
    keyFactors: string[];
    reasoning: Array<{
        factor: string;
        impact: 'positive' | 'negative';
        strength: 'low' | 'medium' | 'high';
        explanation: string;
    }>;
    confidence: string;
    risks: string[];
    opportunities: string[];
}
export interface ExplanationVisualization {
    type: 'waterfall' | 'bar' | 'scatter' | 'heatmap' | 'force_plot';
    title: string;
    data: any;
    config: any;
    description: string;
}
export declare class ExplainableAIEngine {
    private logger;
    private eventBus;
    private config;
    private explanationCache;
    private activeExplanations;
    private computationMetrics;
    private positionFactors;
    private situationalWeights;
    constructor(config: ExplainableAIConfig, logger: Logger, eventBus: EventBus);
    /**
     * Generate comprehensive explanation for a prediction
     */
    explainPrediction(predictionInput: PredictionInput, predictionResult: number): Promise<ExplanationResult>;
    /**
     * Generate SHAP explanation
     */
    private generateSHAPExplanation;
    /**
     * Generate LIME explanation
     */
    private generateLIMEExplanation;
    /**
     * Generate natural language explanation
     */
    private generateNaturalLanguageExplanation;
    /**
     * Generate explanation visualizations
     */
    private generateExplanationVisualizations;
    private calculateBaseValue;
    private calculateSHAPValue;
    private getFeatureBaseline;
    private getFeatureWeight;
    private getSituationalMultiplier;
    private calculateFeatureInteractions;
    private calculatePairwiseInteraction;
    private getFeatureCorrelation;
    private generatePerturbations;
    private fitLocalLinearModel;
    private generateGaussianNoise;
    private generateFeatureExplanation;
    private analyzeGameContext;
    private generatePredictionSummary;
    private identifyRisks;
    private identifyOpportunities;
    private determineConfidenceLevel;
    private calculatePredictionConfidence;
    private calculatePredictionRange;
    private calculateVariance;
    private categorizeImpactStrength;
    private calculateExplanationConfidence;
    private generateExplanationId;
    private generateCacheKey;
    private isCacheValid;
    private updateComputationMetrics;
    private getGlobalFeatureImportance;
    private createWaterfallData;
    private createBarChartData;
    private createScatterData;
    private createPositionHeatmapData;
    getMetrics(): typeof this.computationMetrics;
    clearCache(): void;
    isHealthy(): boolean;
}
export declare function createExplainableAIEngine(config: ExplainableAIConfig, logger: Logger, eventBus: EventBus): ExplainableAIEngine;
export declare const defaultExplainableAIConfig: ExplainableAIConfig;
//# sourceMappingURL=explainable-ai-engine.d.ts.map