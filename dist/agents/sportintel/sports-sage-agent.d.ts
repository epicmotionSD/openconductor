/**
 * SportsSageAgent - SportIntel Strategic Advisory Engine
 *
 * Extends OpenConductor's SageAgent to provide sports-specific strategic advice,
 * portfolio management, and optimization recommendations for DFS players and analysts.
 *
 * Key Features:
 * - DFS bankroll and portfolio management advice
 * - Tournament strategy optimization
 * - Player selection and lineup construction advice
 * - Market inefficiency identification
 * - Risk management recommendations
 * - Seasonal trend analysis and strategy adaptation
 * - Competitive intelligence and edge identification
 */
import { EventBus } from '../../types/events';
import { Logger } from '../../utils/logger';
import { SageAgent } from '../sage-agent';
import { PlayerPrediction } from './sports-oracle-agent';
export interface DFSPortfolio {
    totalBankroll: number;
    allocatedBankroll: number;
    availableBankroll: number;
    positions: Array<{
        contestId: string;
        contestType: 'cash' | 'gpp' | 'satellite';
        entryFee: number;
        lineups: number;
        allocatedAmount: number;
        expectedROI: number;
        riskScore: number;
    }>;
    performance: {
        roi: number;
        winRate: number;
        averageFinish: number;
        sharpeRatio: number;
        maxDrawdown: number;
    };
    riskMetrics: {
        portfolioVariance: number;
        concentrationRisk: number;
        exposureByPosition: Record<string, number>;
        exposureByTeam: Record<string, number>;
    };
}
export interface ContestStrategy {
    contestType: 'cash' | 'gpp' | 'satellite';
    strategy: 'conservative' | 'balanced' | 'aggressive' | 'contrarian';
    keyPrinciples: string[];
    playerSelection: {
        targetOwnership: {
            min: number;
            max: number;
        };
        correlationStrategy: 'stack' | 'diversify' | 'balanced';
        valueThreshold: number;
        ceilingWeight: number;
    };
    budgetAllocation: {
        studs: number;
        midTier: number;
        values: number;
    };
    riskTolerance: {
        maxExposure: number;
        diversificationTargets: Record<string, number>;
        hedgeRecommendations: string[];
    };
}
export interface MarketInefficiency {
    type: 'ownership_mispricing' | 'correlation_opportunity' | 'value_mismatch' | 'injury_overreaction';
    description: string;
    opportunity: {
        players: string[];
        expectedValue: number;
        confidence: number;
        timeframe: 'immediate' | 'short_term' | 'long_term';
    };
    exploitation: {
        strategy: string;
        implementation: string[];
        riskFactors: string[];
        expectedROI: number;
    };
    persistence: {
        historical: boolean;
        seasonality: string;
        marketCycles: string;
    };
}
export interface StrategicAdvice {
    timeframe: 'daily' | 'weekly' | 'seasonal';
    category: 'bankroll' | 'strategy' | 'player_selection' | 'market_timing' | 'risk_management';
    priority: 'low' | 'medium' | 'high' | 'critical';
    advice: string;
    reasoning: string;
    implementation: {
        steps: string[];
        timeline: string;
        resources: string[];
        expectedOutcome: string;
    };
    risks: Array<{
        risk: string;
        likelihood: number;
        impact: number;
        mitigation: string;
    }>;
    successMetrics: Array<{
        metric: string;
        target: number;
        timeframe: string;
    }>;
}
export interface CompetitiveIntelligence {
    marketTrends: {
        ownershipPatterns: Record<string, number>;
        valuePerceptions: Record<string, number>;
        stackingTrends: Array<{
            team: string;
            popularity: number;
            success: number;
        }>;
        contrarian: Array<{
            player: string;
            lowOwnership: number;
            highUpside: number;
        }>;
    };
    inefficiencies: MarketInefficiency[];
    seasonalPatterns: {
        month: string;
        trends: string[];
        opportunities: string[];
        adjustments: string[];
    }[];
    competitorAnalysis: {
        sharpVsPublic: {
            sharpPlays: string[];
            publicPlays: string[];
            contrarian: string[];
        };
        expertConsensus: Array<{
            player: string;
            expertOwnership: number;
            publicOwnership: number;
            opportunity: number;
        }>;
    };
}
export declare class SportsSageAgent extends SageAgent {
    private readonly portfolioHistory;
    private readonly strategyRepository;
    private readonly marketIntelligence;
    private readonly seasonalKnowledge;
    constructor(eventBus: EventBus, logger?: Logger);
    /**
     * Initialize sports-specific advisory capabilities
     */
    private initializeSportsAdvisory;
    /**
     * Provide comprehensive DFS portfolio management advice
     */
    adviseBankrollManagement(portfolio: DFSPortfolio, goals: {
        targetROI: number;
        riskTolerance: 'conservative' | 'moderate' | 'aggressive';
        timeframe: 'daily' | 'weekly' | 'monthly' | 'seasonal';
        growthTarget: number;
    }, constraints?: {
        maxDailyRisk: number;
        diversificationRequirements: Record<string, number>;
        excludeContests?: string[];
    }): Promise<{
        recommendations: StrategicAdvice[];
        portfolioOptimization: {
            suggestedAllocations: Record<string, number>;
            riskAdjustments: string[];
            rebalancingNeeds: boolean;
        };
        riskAssessment: {
            currentRisk: number;
            targetRisk: number;
            mitigationStrategies: string[];
        };
    }>;
    /**
     * Recommend optimal contest strategy based on market conditions
     */
    recommendContestStrategy(contestInfo: {
        type: 'cash' | 'gpp' | 'satellite';
        entryFee: number;
        fieldSize: number;
        payoutStructure: {
            positions: number;
            percentage: number;
        }[];
        prizePool: number;
    }, playerPool: PlayerPrediction[], marketConditions: {
        publicBias?: string[];
        sharpPlays?: string[];
        weatherFactors?: any;
        newsImpacts?: Array<{
            player: string;
            impact: 'positive' | 'negative';
            magnitude: number;
        }>;
    }): Promise<{
        strategy: ContestStrategy;
        playerRecommendations: Array<{
            playerId: string;
            rationale: string;
            confidence: number;
            expectedOwnership: number;
            strategicValue: number;
        }>;
        stackingOpportunities: Array<{
            team: string;
            players: string[];
            correlation: number;
            riskReward: number;
        }>;
        contrarian: Array<{
            play: string;
            reasoning: string;
            upside: number;
            risk: number;
        }>;
    }>;
    /**
     * Identify and analyze market inefficiencies
     */
    identifyMarketInefficiencies(playerData: PlayerPrediction[], ownershipData: Record<string, number>, contextData: {
        weather?: any;
        injuries?: any;
        vegas?: Record<string, number>;
        news?: Array<{
            player: string;
            sentiment: number;
            impact: number;
        }>;
    }): Promise<{
        inefficiencies: MarketInefficiency[];
        opportunities: Array<{
            type: string;
            description: string;
            expectedValue: number;
            implementationStrategy: string;
            riskFactors: string[];
        }>;
        marketSentiment: {
            overall: 'bullish' | 'bearish' | 'neutral';
            byPosition: Record<string, string>;
            contrarian: boolean;
        };
    }>;
    /**
     * Provide seasonal strategy adjustments
     */
    recommendSeasonalStrategy(currentWeek: number, historicalData: any, currentPerformance: any): Promise<{
        seasonalTrends: Array<{
            trend: string;
            strength: number;
            reliability: number;
            timeframe: string;
        }>;
        adjustments: StrategicAdvice[];
        focusAreas: string[];
        riskConsiderations: string[];
    }>;
    private initializeContestStrategies;
    private loadSeasonalKnowledge;
    private analyzePortfolioRisk;
    private generateBankrollRecommendations;
    private optimizePortfolioAllocation;
    private assessPortfolioRisks;
    private generateBaseStrategy;
    private adaptStrategyToMarket;
    private generatePlayerRecommendations;
    private identifyStackingOpportunities;
    private findContrarianOpportunities;
    private analyzeOwnershipMispricings;
    private analyzeCorrelationOpportunities;
    private analyzeInjuryOverreactions;
    private analyzeWeatherMispricings;
    private analyzeMarketSentiment;
    private calculateDiversificationScore;
    private categorizeRiskLevel;
    private identifyPortfolioStrengths;
    private identifyPortfolioWeaknesses;
    private generateRiskRecommendations;
    private calculateKellyAllocations;
    private applyRiskAdjustments;
    private needsRebalancing;
    private calculatePortfolioRisk;
    private calculateTargetRisk;
    private generateRiskMitigationStrategies;
    private calculateStrategicValue;
    private generatePlayerRationale;
    private groupPlayersByTeam;
    private calculateTeamCorrelation;
    private calculateStackRiskReward;
    private calculatePlayerRisk;
    private calculateExpectedOwnership;
    private identifySeasonalTrends;
    private generateSeasonalAdjustments;
    private determineFocusAreas;
    private assessSeasonalRisks;
    private analyzePortfolioPerformance;
    private updateMarketIntelligence;
    private updateStrategyEffectiveness;
    private adjustSeasonalStrategies;
}
//# sourceMappingURL=sports-sage-agent.d.ts.map