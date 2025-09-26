/**
 * Sports Data Source
 *
 * GraphQL data source that integrates with OpenConductor sports data services
 * and provides caching, batching, and error handling for sports entities.
 */
import { RESTDataSource } from 'apollo-datasource-rest';
export declare class SportsDataSource extends RESTDataSource {
    private logger;
    private config;
    constructor();
    /**
     * Get base URL for sports data API
     */
    private getBaseURL;
    /**
     * Configure request headers
     */
    willSendRequest(request: any): void;
    /**
     * Handle request errors
     */
    errorFromResponse(response: any): Error;
    getLeagues(): Promise<any>;
    getLeague(id: string): Promise<any>;
    getTeams(leagueId?: string): Promise<any>;
    getTeam(id: string): Promise<any>;
    getTeamsByLeague(leagueId: string): Promise<any>;
    getTeamStats(teamId: string, season?: number): Promise<any>;
    getPlayers(options?: any): Promise<any>;
    getPlayer(id: string): Promise<any>;
    getPlayersByTeam(teamId: string): Promise<any>;
    getPlayerStats(playerId: string, options?: any): Promise<any>;
    getGames(options?: any): Promise<{
        games: any;
        totalCount: any;
        hasNextPage: boolean;
        offset: any;
    }>;
    getGame(id: string): Promise<any>;
    getGamesByTeam(teamId: string, homeAway?: 'home' | 'away'): Promise<any>;
    getMarketData(playerId: string, gameId: string): Promise<any>;
    getGameMarketData(gameId: string): Promise<any>;
    getGameOwnership(gameId: string): Promise<any>;
    getSalaryChanges(days?: number): Promise<any>;
    /**
     * Cache key for GET requests
     */
    cacheKeyFor(request: any): string;
    /**
     * TTL for cached responses
     */
    cacheOptionsFor(): {
        ttl: number;
    };
    /**
     * Batch multiple player requests
     */
    getPlayersBatch(playerIds: string[]): Promise<any>;
    /**
     * Batch multiple team requests
     */
    getTeamsBatch(teamIds: string[]): Promise<any>;
    /**
     * Batch multiple game requests
     */
    getGamesBatch(gameIds: string[]): Promise<any>;
}
export default SportsDataSource;
//# sourceMappingURL=sports-datasource.d.ts.map