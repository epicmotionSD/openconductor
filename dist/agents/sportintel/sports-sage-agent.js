"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsSageAgent = void 0;
const sage_agent_1 = require("../sage-agent");
class SportsSageAgent extends sage_agent_1.SageAgent {
    portfolioHistory = new Map();
    strategyRepository = new Map();
    marketIntelligence = new Map();
    seasonalKnowledge = new Map();
    constructor(eventBus, logger) {
        super({
            id: 'sports-sage-agent',
            name: 'SportIntel Sage Agent',
            version: '1.0.0',
            type: 'advisory',
            description: 'Strategic advisory engine for DFS and sports analytics optimization',
            author: 'SportIntel.ai',
            capabilities: [
                {
                    type: 'ml-inference',
                    name: 'portfolio-optimization',
                    description: 'Advanced DFS portfolio and bankroll management',
                    version: '1.0.0'
                },
                {
                    type: 'data-analysis',
                    name: 'market-inefficiency-detection',
                    description: 'Identify and exploit market pricing inefficiencies',
                    version: '1.0.0'
                },
                {
                    type: 'prediction',
                    name: 'strategy-optimization',
                    description: 'Optimize contest strategies based on game theory and market dynamics',
                    version: '1.0.0'
                },
                {
                    type: 'data-analysis',
                    name: 'competitive-intelligence',
                    description: 'Analyze market trends and competitor strategies',
                    version: '1.0.0'
                },
                {
                    type: 'orchestration',
                    name: 'risk-management',
                    description: 'Comprehensive risk assessment and mitigation strategies',
                    version: '1.0.0'
                }
            ],
            tools: [
                {
                    id: 'portfolio-analyzer',
                    name: 'DFS Portfolio Analyzer',
                    type: 'financial-analysis',
                    version: '1.0.0',
                    description: 'Analyzes DFS portfolio performance and risk metrics',
                    config: {
                        riskModels: ['VaR', 'CVaR', 'Sharpe', 'Sortino'],
                        benchmarks: ['market_average', 'top_10_percent'],
                        lookbackPeriods: [7, 30, 90, 365]
                    }
                },
                {
                    id: 'market-analyzer',
                    name: 'Market Inefficiency Detector',
                    type: 'market-analysis',
                    version: '1.0.0',
                    description: 'Identifies pricing inefficiencies and arbitrage opportunities',
                    config: {
                        dataSources: ['ownership', 'projections', 'vegas_lines', 'weather'],
                        inefficiencyTypes: ['ownership_mispricing', 'correlation_gaps', 'value_traps'],
                        confidenceThresholds: { minimum: 0.7, high: 0.85 }
                    }
                },
                {
                    id: 'strategy-optimizer',
                    name: 'Contest Strategy Optimizer',
                    type: 'optimization',
                    version: '1.0.0',
                    description: 'Optimizes tournament and cash game strategies',
                    config: {
                        gameTheoryModels: ['Nash', 'Minimax', 'Bayesian'],
                        simulationRuns: 10000,
                        strategies: ['cash', 'gpp', 'satellite', 'hybrid']
                    }
                },
                {
                    id: 'trend-analyzer',
                    name: 'Seasonal Trend Analyzer',
                    type: 'time-series-analysis',
                    version: '1.0.0',
                    description: 'Analyzes seasonal patterns and market cycles',
                    config: {
                        timeframes: ['weekly', 'monthly', 'seasonal'],
                        trendTypes: ['ownership', 'value', 'performance', 'variance'],
                        historicalDepth: 5 // years
                    }
                }
            ],
            memory: {
                type: 'persistent',
                store: 'postgresql',
                ttl: 2592000, // 30 days
                encryption: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
        }, logger);
        this.initializeSportsAdvisory();
        this.setupStrategicKnowledge();
    }
    /**
     * Initialize sports-specific advisory capabilities
     */
    initializeSportsAdvisory() {
        this.log('info', 'Initializing SportIntel advisory systems');
        // Initialize contest strategies
        this.initializeContestStrategies();
        // Load seasonal knowledge
        this.loadSeasonalKnowledge();
        // Set up event listeners
        this.on('portfolio_updated', this.analyzePortfolioPerformance.bind(this));
        this.on('market_data_updated', this.updateMarketIntelligence.bind(this));
        this.on('contest_results', this.updateStrategyEffectiveness.bind(this));
        this.on('seasonal_transition', this.adjustSeasonalStrategies.bind(this));
    }
    /**
     * Provide comprehensive DFS portfolio management advice
     */
    async adviseBankrollManagement(portfolio, goals, constraints) {
        this.log('info', 'Analyzing bankroll management strategy', {
            bankroll: portfolio.totalBankroll,
            currentROI: portfolio.performance.roi,
            targetROI: goals.targetROI
        });
        try {
            // Analyze current portfolio performance
            const performanceAnalysis = await this.analyzePortfolioRisk(portfolio);
            // Generate strategic recommendations
            const recommendations = await this.generateBankrollRecommendations(portfolio, goals, performanceAnalysis, constraints);
            // Optimize portfolio allocation
            const portfolioOptimization = await this.optimizePortfolioAllocation(portfolio, goals, performanceAnalysis);
            // Assess and mitigate risks
            const riskAssessment = await this.assessPortfolioRisks(portfolio, goals, performanceAnalysis);
            return {
                recommendations,
                portfolioOptimization,
                riskAssessment
            };
        }
        catch (error) {
            this.log('error', 'Bankroll management advisory failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Recommend optimal contest strategy based on market conditions
     */
    async recommendContestStrategy(contestInfo, playerPool, marketConditions) {
        this.log('info', 'Analyzing contest strategy', {
            contestType: contestInfo.type,
            entryFee: contestInfo.entryFee,
            fieldSize: contestInfo.fieldSize
        });
        try {
            // Select base strategy based on contest type
            const baseStrategy = this.strategyRepository.get(contestInfo.type) ||
                await this.generateBaseStrategy(contestInfo.type);
            // Adapt strategy based on market conditions
            const adaptedStrategy = await this.adaptStrategyToMarket(baseStrategy, contestInfo, marketConditions);
            // Generate player recommendations
            const playerRecommendations = await this.generatePlayerRecommendations(playerPool, adaptedStrategy, marketConditions);
            // Identify stacking opportunities
            const stackingOpportunities = await this.identifyStackingOpportunities(playerPool, adaptedStrategy, contestInfo);
            // Find contrarian opportunities
            const contrarian = await this.findContrarianOpportunities(playerPool, marketConditions, contestInfo);
            return {
                strategy: adaptedStrategy,
                playerRecommendations,
                stackingOpportunities,
                contrarian
            };
        }
        catch (error) {
            this.log('error', 'Contest strategy recommendation failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Identify and analyze market inefficiencies
     */
    async identifyMarketInefficiencies(playerData, ownershipData, contextData) {
        this.log('info', 'Analyzing market inefficiencies', {
            playerCount: playerData.length,
            ownershipDataPoints: Object.keys(ownershipData).length
        });
        try {
            // Analyze ownership vs projection mismatches
            const ownershipInefficiencies = await this.analyzeOwnershipMispricings(playerData, ownershipData);
            // Identify correlation opportunities
            const correlationInefficiencies = await this.analyzeCorrelationOpportunities(playerData, contextData);
            // Detect injury overreactions
            const injuryInefficiencies = await this.analyzeInjuryOverreactions(playerData, contextData.injuries, ownershipData);
            // Weather impact mispricings
            const weatherInefficiencies = await this.analyzeWeatherMispricings(playerData, contextData.weather, ownershipData);
            // Combine all inefficiencies
            const inefficiencies = [
                ...ownershipInefficiencies,
                ...correlationInefficiencies,
                ...injuryInefficiencies,
                ...weatherInefficiencies
            ].sort((a, b) => b.opportunity.expectedValue - a.opportunity.expectedValue);
            // Generate actionable opportunities
            const opportunities = inefficiencies.slice(0, 5).map(inefficiency => ({
                type: inefficiency.type,
                description: inefficiency.description,
                expectedValue: inefficiency.opportunity.expectedValue,
                implementationStrategy: inefficiency.exploitation.strategy,
                riskFactors: inefficiency.exploitation.riskFactors
            }));
            // Analyze overall market sentiment
            const marketSentiment = this.analyzeMarketSentiment(playerData, ownershipData, contextData);
            return {
                inefficiencies,
                opportunities,
                marketSentiment
            };
        }
        catch (error) {
            this.log('error', 'Market inefficiency analysis failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Provide seasonal strategy adjustments
     */
    async recommendSeasonalStrategy(currentWeek, historicalData, currentPerformance) {
        this.log('info', `Analyzing seasonal strategy for week ${currentWeek}`);
        try {
            // Load seasonal patterns
            const seasonalPatterns = this.seasonalKnowledge.get('nfl') || {};
            // Identify current trends
            const seasonalTrends = await this.identifySeasonalTrends(currentWeek, historicalData, seasonalPatterns);
            // Generate strategy adjustments
            const adjustments = await this.generateSeasonalAdjustments(seasonalTrends, currentPerformance, currentWeek);
            // Determine focus areas
            const focusAreas = this.determineFocusAreas(seasonalTrends, currentWeek);
            // Assess seasonal risks
            const riskConsiderations = this.assessSeasonalRisks(currentWeek, seasonalTrends);
            return {
                seasonalTrends,
                adjustments,
                focusAreas,
                riskConsiderations
            };
        }
        catch (error) {
            this.log('error', 'Seasonal strategy recommendation failed', { error: error.message });
            throw error;
        }
    }
    // Private helper methods
    initializeContestStrategies() {
        // Cash game strategy
        this.strategyRepository.set('cash', {
            contestType: 'cash',
            strategy: 'conservative',
            keyPrinciples: [
                'Prioritize floor over ceiling',
                'Target high-floor, consistent players',
                'Minimize variance and bust risk',
                'Focus on safe game environments'
            ],
            playerSelection: {
                targetOwnership: { min: 15, max: 40 },
                correlationStrategy: 'balanced',
                valueThreshold: 2.8,
                ceilingWeight: 0.3
            },
            budgetAllocation: {
                studs: 50,
                midTier: 35,
                values: 15
            },
            riskTolerance: {
                maxExposure: 20,
                diversificationTargets: { QB: 1, RB: 2, WR: 3, TE: 1, K: 1, DST: 1 },
                hedgeRecommendations: ['Diversify across game environments', 'Avoid boom/bust players']
            }
        });
        // Tournament strategy
        this.strategyRepository.set('gpp', {
            contestType: 'gpp',
            strategy: 'aggressive',
            keyPrinciples: [
                'Prioritize ceiling over floor',
                'Target low-owned, high-upside players',
                'Embrace calculated variance',
                'Leverage game stacks and correlations'
            ],
            playerSelection: {
                targetOwnership: { min: 3, max: 25 },
                correlationStrategy: 'stack',
                valueThreshold: 2.5,
                ceilingWeight: 0.7
            },
            budgetAllocation: {
                studs: 35,
                midTier: 40,
                values: 25
            },
            riskTolerance: {
                maxExposure: 30,
                diversificationTargets: { QB: 1, RB: 2, WR: 3, TE: 1, K: 1, DST: 1 },
                hedgeRecommendations: ['Stack game environments', 'Target contrarian plays']
            }
        });
    }
    loadSeasonalKnowledge() {
        // NFL seasonal patterns
        this.seasonalKnowledge.set('nfl', {
            earlySeasonTrends: {
                weeks: [1, 2, 3, 4],
                characteristics: [
                    'High variance due to small sample sizes',
                    'Preseason hype vs reality adjustments',
                    'Weather less of a factor',
                    'Running back committee situations unclear'
                ],
                strategies: [
                    'Target proven veterans over rookies',
                    'Fade overhyped preseason darlings',
                    'Monitor snap count changes closely'
                ]
            },
            midSeasonTrends: {
                weeks: [5, 6, 7, 8, 9, 10, 11, 12],
                characteristics: [
                    'More stable usage patterns',
                    'Weather becomes factor in northern cities',
                    'Bye week management crucial',
                    'Trade deadline impacts'
                ],
                strategies: [
                    'Weather games become key differentiators',
                    'Target players with established roles',
                    'Monitor injury replacements carefully'
                ]
            },
            lateSeasonTrends: {
                weeks: [13, 14, 15, 16, 17, 18],
                characteristics: [
                    'Weather major factor',
                    'Teams resting players if locked into playoffs',
                    'Desperation plays for bubble teams',
                    'Playoff implications affect game scripts'
                ],
                strategies: [
                    'Heavy weather emphasis',
                    'Monitor playoff status closely',
                    'Target teams with something to play for'
                ]
            }
        });
    }
    async analyzePortfolioRisk(portfolio) {
        // Calculate portfolio risk metrics
        const riskMetrics = {
            variance: portfolio.riskMetrics.portfolioVariance,
            sharpeRatio: portfolio.performance.sharpeRatio,
            maxDrawdown: portfolio.performance.maxDrawdown,
            concentrationRisk: portfolio.riskMetrics.concentrationRisk,
            diversification: this.calculateDiversificationScore(portfolio)
        };
        return {
            riskLevel: this.categorizeRiskLevel(riskMetrics),
            strengths: this.identifyPortfolioStrengths(portfolio, riskMetrics),
            weaknesses: this.identifyPortfolioWeaknesses(portfolio, riskMetrics),
            recommendations: this.generateRiskRecommendations(riskMetrics)
        };
    }
    async generateBankrollRecommendations(portfolio, goals, analysis, constraints) {
        const recommendations = [];
        // Risk tolerance adjustment
        if (analysis.riskLevel === 'high' && goals.riskTolerance === 'conservative') {
            recommendations.push({
                timeframe: 'weekly',
                category: 'risk_management',
                priority: 'high',
                advice: 'Reduce portfolio risk to match conservative tolerance',
                reasoning: 'Current portfolio risk exceeds stated risk tolerance',
                implementation: {
                    steps: [
                        'Reduce tournament allocation by 20%',
                        'Increase cash game percentage',
                        'Lower maximum exposure limits'
                    ],
                    timeline: '1 week',
                    resources: ['Portfolio rebalancing'],
                    expectedOutcome: 'Reduced volatility, more consistent returns'
                },
                risks: [{
                        risk: 'Lower upside potential',
                        likelihood: 0.8,
                        impact: 0.4,
                        mitigation: 'Selective tournament entry with higher edge'
                    }],
                successMetrics: [{
                        metric: 'Portfolio Sharpe Ratio',
                        target: 1.2,
                        timeframe: '30 days'
                    }]
            });
        }
        // ROI optimization
        if (portfolio.performance.roi < goals.targetROI) {
            const roiGap = goals.targetROI - portfolio.performance.roi;
            recommendations.push({
                timeframe: 'monthly',
                category: 'strategy',
                priority: 'high',
                advice: `Improve ROI by ${(roiGap * 100).toFixed(1)}% through strategy refinement`,
                reasoning: 'Current ROI below target, indicating room for strategic improvement',
                implementation: {
                    steps: [
                        'Analyze losing lineups for pattern identification',
                        'Refine player selection process',
                        'Optimize contest selection criteria',
                        'Implement stricter value thresholds'
                    ],
                    timeline: '30 days',
                    resources: ['Performance analysis tools', 'Strategy consultation'],
                    expectedOutcome: `ROI improvement of ${(roiGap * 100).toFixed(1)}%`
                },
                risks: [{
                        risk: 'Implementation variance',
                        likelihood: 0.6,
                        impact: 0.3,
                        mitigation: 'Gradual implementation with frequent monitoring'
                    }],
                successMetrics: [{
                        metric: 'Monthly ROI',
                        target: goals.targetROI,
                        timeframe: '60 days'
                    }]
            });
        }
        return recommendations;
    }
    async optimizePortfolioAllocation(portfolio, goals, analysis) {
        // Kelly Criterion-based allocation
        const kellyAllocations = this.calculateKellyAllocations(portfolio, analysis);
        // Risk-adjusted allocations
        const riskAdjusted = this.applyRiskAdjustments(kellyAllocations, goals.riskTolerance);
        return {
            suggestedAllocations: riskAdjusted,
            riskAdjustments: [
                'Reduced tournament exposure during high variance periods',
                'Increased diversification across contest types'
            ],
            rebalancingNeeds: this.needsRebalancing(portfolio, riskAdjusted)
        };
    }
    async assessPortfolioRisks(portfolio, goals, analysis) {
        const currentRisk = this.calculatePortfolioRisk(portfolio);
        const targetRisk = this.calculateTargetRisk(goals);
        return {
            currentRisk,
            targetRisk,
            mitigationStrategies: this.generateRiskMitigationStrategies(currentRisk, targetRisk, analysis)
        };
    }
    async generateBaseStrategy(contestType) {
        // Fallback strategy generation for undefined contest types
        return {
            contestType: contestType,
            strategy: 'balanced',
            keyPrinciples: ['Balance risk and reward', 'Adapt to market conditions'],
            playerSelection: {
                targetOwnership: { min: 10, max: 30 },
                correlationStrategy: 'balanced',
                valueThreshold: 2.6,
                ceilingWeight: 0.5
            },
            budgetAllocation: { studs: 40, midTier: 40, values: 20 },
            riskTolerance: {
                maxExposure: 25,
                diversificationTargets: {},
                hedgeRecommendations: []
            }
        };
    }
    async adaptStrategyToMarket(baseStrategy, contestInfo, marketConditions) {
        const adapted = { ...baseStrategy };
        // Adjust for field size
        if (contestInfo.fieldSize > 100000) {
            adapted.playerSelection.targetOwnership.max = Math.min(15, adapted.playerSelection.targetOwnership.max);
            adapted.strategy = 'contrarian';
        }
        // Adjust for weather
        if (marketConditions.weatherFactors?.severeWeather) {
            adapted.playerSelection.ceilingWeight = Math.max(0.2, adapted.playerSelection.ceilingWeight - 0.2);
        }
        return adapted;
    }
    async generatePlayerRecommendations(playerPool, strategy, marketConditions) {
        return playerPool
            .filter(player => player.projectedPoints > 8) // Minimum threshold
            .map(player => {
            const ownership = player.ownership?.projected || 10;
            const strategicValue = this.calculateStrategicValue(player, strategy, ownership);
            return {
                playerId: player.playerId,
                rationale: this.generatePlayerRationale(player, strategy),
                confidence: player.confidence || 0.7,
                expectedOwnership: ownership,
                strategicValue
            };
        })
            .sort((a, b) => b.strategicValue - a.strategicValue)
            .slice(0, 20);
    }
    async identifyStackingOpportunities(playerPool, strategy, contestInfo) {
        // Group players by team for stacking analysis
        const teamGroups = this.groupPlayersByTeam(playerPool);
        const stacks = [];
        for (const [team, players] of teamGroups.entries()) {
            if (players.length >= 2) {
                const correlation = this.calculateTeamCorrelation(players);
                const riskReward = this.calculateStackRiskReward(players, strategy);
                if (correlation > 0.3 && riskReward > 1.1) {
                    stacks.push({
                        team,
                        players: players.map(p => p.playerId),
                        correlation,
                        riskReward
                    });
                }
            }
        }
        return stacks.sort((a, b) => b.riskReward - a.riskReward);
    }
    async findContrarianOpportunities(playerPool, marketConditions, contestInfo) {
        return playerPool
            .filter(player => {
            const ownership = player.ownership?.projected || 10;
            const upside = player.ceiling - player.projectedPoints;
            return ownership < 8 && upside > 5; // Low owned with high upside
        })
            .map(player => ({
            play: player.playerId,
            reasoning: `Low ownership (${player.ownership?.projected}%) with high ceiling (${player.ceiling})`,
            upside: player.ceiling - player.projectedPoints,
            risk: this.calculatePlayerRisk(player)
        }))
            .sort((a, b) => (b.upside / b.risk) - (a.upside / a.risk))
            .slice(0, 10);
    }
    async analyzeOwnershipMispricings(playerData, ownershipData) {
        const inefficiencies = [];
        for (const player of playerData) {
            const ownership = ownershipData[player.playerId] || 10;
            const projectedPoints = player.projectedPoints;
            const expectedOwnership = this.calculateExpectedOwnership(projectedPoints);
            const ownershipGap = Math.abs(ownership - expectedOwnership);
            if (ownershipGap > 5 && ownership < expectedOwnership) {
                inefficiencies.push({
                    type: 'ownership_mispricing',
                    description: `${player.playerId} underowned relative to projection`,
                    opportunity: {
                        players: [player.playerId],
                        expectedValue: ownershipGap * 0.1,
                        confidence: 0.75,
                        timeframe: 'immediate'
                    },
                    exploitation: {
                        strategy: 'Target in lineups as core play',
                        implementation: ['Include in cash game lineups', 'Use as GPP anchor'],
                        riskFactors: ['Projection accuracy', 'Late ownership shifts'],
                        expectedROI: ownershipGap * 0.05
                    },
                    persistence: {
                        historical: false,
                        seasonality: 'None',
                        marketCycles: 'Weekly reset'
                    }
                });
            }
        }
        return inefficiencies;
    }
    async analyzeCorrelationOpportunities(playerData, contextData) {
        // Simplified correlation analysis
        return [];
    }
    async analyzeInjuryOverreactions(playerData, injuries, ownershipData) {
        // Simplified injury overreaction analysis
        return [];
    }
    async analyzeWeatherMispricings(playerData, weather, ownershipData) {
        // Simplified weather mispricing analysis
        return [];
    }
    analyzeMarketSentiment(playerData, ownershipData, contextData) {
        const avgOwnership = Object.values(ownershipData).reduce((sum, own) => sum + own, 0) / Object.values(ownershipData).length;
        return {
            overall: avgOwnership > 15 ? 'bullish' : avgOwnership < 10 ? 'bearish' : 'neutral',
            byPosition: {},
            contrarian: avgOwnership > 20 // High overall ownership suggests contrarian opportunities
        };
    }
    // Additional helper methods (simplified implementations)
    calculateDiversificationScore(portfolio) { return 0.7; }
    categorizeRiskLevel(metrics) { return 'medium'; }
    identifyPortfolioStrengths(portfolio, metrics) { return ['Good diversification']; }
    identifyPortfolioWeaknesses(portfolio, metrics) { return ['High variance']; }
    generateRiskRecommendations(metrics) { return ['Reduce tournament exposure']; }
    calculateKellyAllocations(portfolio, analysis) { return { cash: 0.6, gpp: 0.4 }; }
    applyRiskAdjustments(allocations, risk) { return allocations; }
    needsRebalancing(portfolio, target) { return false; }
    calculatePortfolioRisk(portfolio) { return 0.3; }
    calculateTargetRisk(goals) { return 0.25; }
    generateRiskMitigationStrategies(current, target, analysis) { return ['Reduce exposure']; }
    calculateStrategicValue(player, strategy, ownership) { return player.projectedPoints / ownership; }
    generatePlayerRationale(player, strategy) { return `Strong value play at ${player.projectedPoints} projected points`; }
    groupPlayersByTeam(players) { return new Map(); }
    calculateTeamCorrelation(players) { return 0.5; }
    calculateStackRiskReward(players, strategy) { return 1.2; }
    calculatePlayerRisk(player) { return 0.3; }
    calculateExpectedOwnership(projectedPoints) { return projectedPoints * 1.5; }
    async identifySeasonalTrends(week, historical, patterns) { return []; }
    async generateSeasonalAdjustments(trends, performance, week) { return []; }
    determineFocusAreas(trends, week) { return ['Weather games']; }
    assessSeasonalRisks(week, trends) { return ['Cold weather variance']; }
    // Event handlers
    async analyzePortfolioPerformance(portfolio) {
        this.log('info', 'Analyzing portfolio performance', { roi: portfolio.performance.roi });
    }
    async updateMarketIntelligence(marketData) {
        this.log('info', 'Updating market intelligence', { dataType: marketData.type });
    }
    async updateStrategyEffectiveness(results) {
        this.log('info', 'Updating strategy effectiveness', { contestType: results.contestType });
    }
    async adjustSeasonalStrategies(transition) {
        this.log('info', 'Adjusting seasonal strategies', { fromWeek: transition.fromWeek, toWeek: transition.toWeek });
    }
}
exports.SportsSageAgent = SportsSageAgent;
//# sourceMappingURL=sports-sage-agent.js.map