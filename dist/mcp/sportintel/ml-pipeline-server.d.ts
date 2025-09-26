/**
 * ML Pipeline MCP Server
 *
 * Model Context Protocol server for machine learning pipeline management,
 * model training, inference, and explainable AI integration.
 *
 * Integrates with SportIntel Trinity AI agents and provides SHAP/LIME
 * explanations for prediction transparency.
 */
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';
import { SportsOracleAgent } from '../../agents/sportintel/sports-oracle-agent';
export interface MLPipelineServerConfig {
    name: string;
    version: string;
    modelRegistry: {
        enabled: boolean;
        modelsPath: string;
        maxModels: number;
    };
    inference: {
        maxConcurrentInference: number;
        timeoutMs: number;
        batchSize: number;
    };
    explainability: {
        enabled: boolean;
        methods: string[];
        maxExplanations: number;
    };
    performance: {
        enableMetrics: boolean;
        enableProfiling: boolean;
    };
}
export declare class MLPipelineMCPServer {
    private server;
    private eventBus;
    private sportsOracle;
    private logger;
    private config;
    private activeInferences;
    private modelRegistry;
    private explanationCache;
    private readonly tools;
    constructor(config: MLPipelineServerConfig, eventBus: EventBus, sportsOracle: SportsOracleAgent, logger: Logger);
    private setupHandlers;
    private initializeModels;
    private handlePredictPlayerPerformance;
    private handlePredictGameOutcome;
    private handleOptimizeLineup;
    private handleExplainPrediction;
    private handleAnalyzeModelPerformance;
    private handleTrainModel;
    private handleBatchPredict;
    private handleGetModelInfo;
    private generateExplanation;
    private generateDetailedExplanation;
    private generatePredictionId;
    private generateOptimizationId;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createMLPipelineMCPServer(config: MLPipelineServerConfig, eventBus: EventBus, sportsOracle: SportsOracleAgent, logger: Logger): MLPipelineMCPServer;
//# sourceMappingURL=ml-pipeline-server.d.ts.map