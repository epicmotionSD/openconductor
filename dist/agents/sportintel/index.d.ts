/**
 * SportIntel AI Agent Extensions
 *
 * Trinity AI agents specialized for sports analytics, DFS optimization,
 * and real-time sports data processing on the OpenConductor platform.
 */
export { SportsOracleAgent } from './sports-oracle-agent';
export { SportsSentinelAgent } from './sports-sentinel-agent';
export { SportsSageAgent } from './sports-sage-agent';
export type { SportsData, WeatherData, VenueData, MatchupData, PlayerPrediction, GamePrediction, LineupOptimization } from './sports-oracle-agent';
export type { SportsDataMetrics, SportsAlert, DataProviderHealth, PredictionQualityMetrics } from './sports-sentinel-agent';
export type { DFSPortfolio, ContestStrategy, MarketInefficiency, StrategicAdvice, CompetitiveIntelligence } from './sports-sage-agent';
/**
 * SportIntel Agent Factory
 *
 * Factory function to create and configure SportIntel agents
 * with proper dependencies and shared configuration.
 */
export declare class SportIntelAgentFactory {
    static createSportsOracle(eventBus: any, logger?: any): any;
    static createSportsSentinel(eventBus: any, logger?: any): any;
    static createSportsSage(eventBus: any, logger?: any): any;
    /**
     * Create complete Trinity AI agent suite for SportIntel
     */
    static createTrinityAgents(eventBus: any, logger?: any): {
        oracle: any;
        sentinel: any;
        sage: any;
    };
}
//# sourceMappingURL=index.d.ts.map