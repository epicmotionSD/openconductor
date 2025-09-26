/**
 * SportsOracleAgent - SportIntel AI Prediction Engine
 *
 * Extends OpenConductor's OracleAgent to provide sports-specific predictive analytics
 * with explainable AI capabilities for Daily Fantasy Sports (DFS) and sports betting.
 *
 * Key Features:
 * - Player performance predictions with confidence intervals
 * - Game outcome forecasting with SHAP explanations
 * - Lineup optimization for DFS contests
 * - Ownership projection for tournament strategy
 * - Weather impact analysis
 * - Injury risk assessment
 */
import { EventBus } from '../../types/events';
import { Logger } from '../../utils/logger';
import { OracleAgent } from '../oracle-agent';
export interface SportsData {
    playerId?: string;
    gameId?: string;
    team: string;
    opponent: string;
    position?: string;
    salary?: number;
    projectedPoints?: number;
    recentPerformance?: number[];
    injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out';
    weatherConditions?: WeatherData;
    venueFactors?: VenueData;
    historicalMatchup?: MatchupData;
}
export interface WeatherData {
    temperature?: number;
    windSpeed?: number;
    precipitation?: number;
    conditions?: string;
    stadium?: 'indoor' | 'outdoor' | 'retractable';
}
export interface VenueData {
    venueId: string;
    parkFactors?: Record<string, number>;
    altitude?: number;
    surfaceType?: string;
    homefieldAdvantage?: number;
}
export interface MatchupData {
    headToHeadRecord?: Record<string, number>;
    averageScoring?: number;
    defensiveRanking?: Record<string, number>;
    paceFactors?: number;
}
export interface PlayerPrediction {
    playerId: string;
    projectedPoints: number;
    confidenceInterval: {
        lower: number;
        upper: number;
        confidence: number;
    };
    ceiling: number;
    floor: number;
    ownership?: {
        projected: number;
        confidence: number;
    };
    explanation: {
        factors: Array<{
            factor: string;
            impact: number;
            description: string;
        }>;
        shapValues?: Record<string, number>;
        reasoning: string;
    };
    riskFactors: Array<{
        type: 'injury' | 'weather' | 'matchup' | 'usage' | 'variance';
        severity: 'low' | 'medium' | 'high';
        description: string;
    }>;
}
export interface GamePrediction {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    predictedScore: {
        home: number;
        away: number;
        total: number;
    };
    winProbability: {
        home: number;
        away: number;
    };
    confidence: number;
    keyFactors: Array<{
        factor: string;
        impact: number;
        description: string;
    }>;
    weatherImpact?: number;
    injuryImpact?: Record<string, number>;
}
export interface LineupOptimization {
    lineup: Array<{
        playerId: string;
        position: string;
        salary: number;
        projectedPoints: number;
        ownership: number;
    }>;
    totalSalary: number;
    projectedPoints: number;
    projectedOwnership: number;
    riskScore: number;
    strategy: 'cash' | 'gpp' | 'balanced';
    explanation: {
        reasoning: string;
        keyPicks: string[];
        differentiators: string[];
        riskMitigation: string[];
    };
}
export declare class SportsOracleAgent extends OracleAgent {
    private readonly sportsModels;
    private readonly weatherService;
    private readonly injuryTracker;
    constructor(eventBus: EventBus, logger?: Logger);
    /**
     * Initialize sports-specific prediction models
     */
    private initializeSportsModels;
    /**
     * Set up sports-specific agent capabilities
     */
    private setupSportsCapabilities;
    /**
     * Predict player performance with explainable AI
     */
    predictPlayerPerformance(playerData: SportsData, options?: {
        includeOwnership?: boolean;
        explainPrediction?: boolean;
        confidenceLevel?: number;
    }): Promise<PlayerPrediction>;
    /**
     * Predict game outcome with detailed analysis
     */
    predictGameOutcome(homeTeam: SportsData, awayTeam: SportsData, gameContext?: {
        venue?: VenueData;
        weather?: WeatherData;
        injuries?: Array<{
            playerId: string;
            impact: number;
        }>;
    }): Promise<GamePrediction>;
    /**
     * Optimize lineup for DFS contests
     */
    optimizeLineup(players: SportsData[], constraints: {
        salary: number;
        positions: Record<string, number>;
        strategy: 'cash' | 'gpp' | 'balanced';
        ownership?: {
            max: number;
            target?: number;
        };
    }): Promise<LineupOptimization>;
    /**
     * Project player ownership for tournaments
     */
    predictOwnership(playerData: SportsData): Promise<{
        projected: number;
        confidence: number;
    }>;
    private extractPlayerFeatures;
    private extractGameFeatures;
    private extractOwnershipFeatures;
    private encodeInjuryStatus;
    private calculateWeatherImpact;
    private encodeWeatherConditions;
    private calculatePlayerVariance;
    private generateExplanation;
    private identifyRiskFactors;
    private calculateWinProbability;
    private calculateInjuryImpact;
    private generateGameFactors;
    private createLineupOptimizer;
    private calculateLineupRisk;
    private generateLineupExplanation;
    private humanizeFeatureName;
    private getFactorDescription;
    private generateReasoningText;
    private handleSportsDataUpdate;
    private handleInjuryUpdate;
    private handleWeatherUpdate;
    private handleLineupOptimization;
}
//# sourceMappingURL=sports-oracle-agent.d.ts.map