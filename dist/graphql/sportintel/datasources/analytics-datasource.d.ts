/**
 * Analytics Data Source
 *
 * GraphQL data source for advanced analytics and insights
 */
import { RESTDataSource } from 'apollo-datasource-rest';
export declare class AnalyticsDataSource extends RESTDataSource {
    private logger;
    private config;
    constructor();
    private getBaseURL;
    willSendRequest(request: any): void;
    errorFromResponse(response: any): Error;
    getPlayerAnalytics(playerId: string): Promise<any>;
    getPlayerSeasonStats(playerId: string, season?: number): Promise<any>;
    getPlayerRecentForm(playerId: string, games?: number): Promise<any>;
    getPlayerMatchupHistory(playerId: string, opponentId: string): Promise<any>;
    getPlayerProjectionAccuracy(playerId: string): Promise<any>;
    getPlayerValueMetrics(playerId: string): Promise<any>;
    getPlayerOwnershipTrends(playerId: string, days?: number): Promise<any>;
    getSimilarPlayers(playerId: string, limit?: number): Promise<any>;
    getTeamAnalytics(teamId: string): Promise<any>;
    getTeamSeasonStats(teamId: string, season?: number): Promise<any>;
    getTeamRecentForm(teamId: string, games?: number): Promise<any>;
    getTeamHomeAwaySplits(teamId: string): Promise<any>;
    getTeamStrengthOfSchedule(teamId: string): Promise<any>;
    getTeamPaceMetrics(teamId: string): Promise<any>;
    getTeamDefenseRankings(teamId: string): Promise<any>;
    getGameAnalytics(gameId: string): Promise<any>;
    getGameScript(gameId: string): Promise<any>;
    getWeatherImpact(gameId: string): Promise<any>;
    getVegasAnalysis(gameId: string): Promise<any>;
    getPublicBetting(gameId: string): Promise<any>;
    getKeyInjuries(gameId: string): Promise<any>;
    getGameNarratives(gameId: string): Promise<any>;
    getMarketAnalytics(): Promise<any>;
    getOwnershipAnalytics(): Promise<any>;
    getSalaryAnalytics(): Promise<any>;
    getValueAnalytics(): Promise<any>;
    getContrarianAnalytics(): Promise<any>;
    getSharpAnalytics(): Promise<any>;
    getModelAnalytics(): Promise<any>;
    getModelAccuracy(modelName?: string): Promise<any>;
    getModelPerformance(modelName?: string, timeframe?: string): Promise<any>;
    getFeatureImportance(modelName?: string): Promise<any>;
    getCalibrationData(modelName?: string): Promise<any>;
    getBacktestResults(modelName?: string): Promise<any>;
    getTrendAnalytics(): Promise<any>;
    getPlayerTrends(timeframe?: string): Promise<any>;
    getTeamTrends(timeframe?: string): Promise<any>;
    getMarketTrends(timeframe?: string): Promise<any>;
    getOwnershipTrends(timeframe?: string): Promise<any>;
    getSalaryTrends(timeframe?: string): Promise<any>;
    getCustomAnalytics(query: any): Promise<any>;
    createAnalyticsReport(config: any): Promise<any>;
    getAnalyticsReport(reportId: string): Promise<any>;
    getPlayerAnalyticsBatch(playerIds: string[]): Promise<any>;
    getTeamAnalyticsBatch(teamIds: string[]): Promise<any>;
    getGameAnalyticsBatch(gameIds: string[]): Promise<any>;
    cacheKeyFor(request: any): string;
    cacheOptionsFor(): {
        ttl: number;
    };
}
export default AnalyticsDataSource;
//# sourceMappingURL=analytics-datasource.d.ts.map