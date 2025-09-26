/**
 * Oracle Agent - Advanced Prediction and Forecasting
 *
 * Trinity AI Pattern: "The wisdom to see what's coming"
 *
 * Provides comprehensive prediction capabilities including:
 * - Time series forecasting
 * - ML model inference
 * - Pattern recognition
 * - Risk assessment
 * - Trend analysis
 */
import { BaseAgent } from './base-agent';
import { AgentConfig, PredictionAgent as IPredictionAgent } from '../types/agent';
import { Logger } from '../utils/logger';
export interface PredictionModel {
    id: string;
    name: string;
    type: 'time-series' | 'classification' | 'regression' | 'anomaly-detection';
    version: string;
    accuracy: number;
    lastTrained: Date;
    features: string[];
    parameters: Record<string, any>;
}
export interface PredictionRequest {
    model?: string;
    data: any[];
    timeHorizon?: number;
    confidence?: number;
    includeFactors?: boolean;
    includeAlternatives?: boolean;
}
export interface PredictionResult {
    prediction: any;
    confidence: number;
    timeHorizon?: number;
    factors?: Array<{
        name: string;
        importance: number;
        impact: 'positive' | 'negative' | 'neutral';
    }>;
    alternatives?: Array<{
        scenario: string;
        probability: number;
        prediction: any;
    }>;
    metadata: {
        model: PredictionModel;
        timestamp: Date;
        executionTime: number;
        dataPoints: number;
    };
}
export declare class OracleAgent extends BaseAgent implements IPredictionAgent {
    private models;
    private predictionHistory;
    constructor(config: AgentConfig, logger: Logger);
    initialize(): Promise<void>;
    execute(input: any, context?: Record<string, any>): Promise<PredictionResult>;
    predict<TInput = any, TPrediction = any>(input: TInput, options?: {
        confidence?: number;
        timeHorizon?: number;
        model?: string;
    }): Promise<{
        prediction: TPrediction;
        confidence: number;
        factors?: string[];
        metadata?: Record<string, any>;
    }>;
    private runPredictionModel;
    private runTimeSeriesModel;
    private runClassificationModel;
    private runRegressionModel;
    private runAnomalyDetectionModel;
    private calculateTrend;
    private calculateSeasonalFactor;
    private extractFeatures;
    private calculateAnomalyScore;
    private initializeDefaultModels;
    addModel(model: PredictionModel): Promise<void>;
    removeModel(modelId: string): Promise<boolean>;
    getModel(modelId: string): PredictionModel | undefined;
    getAvailableModels(): PredictionModel[];
    getPredictionHistory(limit?: number): Array<{
        timestamp: Date;
        request: PredictionRequest;
        result: PredictionResult;
    }>;
    validateModel(modelId: string, testData: any[]): Promise<{
        accuracy: number;
        errors: string[];
        performance: number;
    }>;
}
//# sourceMappingURL=oracle-agent.d.ts.map