"use strict";
/**
 * Sports Data Source
 *
 * GraphQL data source that integrates with OpenConductor sports data services
 * and provides caching, batching, and error handling for sports entities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsDataSource = void 0;
const apollo_datasource_rest_1 = require("apollo-datasource-rest");
const logger_1 = require("../../../utils/logger");
const development_config_1 = require("../../../config/sportintel/development-config");
class SportsDataSource extends apollo_datasource_rest_1.RESTDataSource {
    logger;
    config;
    constructor() {
        super();
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.baseURL = this.getBaseURL();
        // Configure caching
        this.memoizeGetRequests = true;
    }
    /**
     * Get base URL for sports data API
     */
    getBaseURL() {
        if (this.config.isDevelopment()) {
            return 'http://localhost:3001/api/sports';
        }
        return 'https://api.sportintel.ai/sports';
    }
    /**
     * Configure request headers
     */
    willSendRequest(request) {
        request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
        request.headers.set('Accept', 'application/json');
    }
    /**
     * Handle request errors
     */
    errorFromResponse(response) {
        this.logger.error('Sports API Error', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
        });
        return new Error(`Sports API Error: ${response.status} ${response.statusText}`);
    }
    // ========== League Methods ==========
    async getLeagues() {
        return this.get('leagues');
    }
    async getLeague(id) {
        return this.get(`leagues/${id}`);
    }
    // ========== Team Methods ==========
    async getTeams(leagueId) {
        const params = leagueId ? { leagueId } : {};
        return this.get('teams', params);
    }
    async getTeam(id) {
        return this.get(`teams/${id}`);
    }
    async getTeamsByLeague(leagueId) {
        return this.get(`leagues/${leagueId}/teams`);
    }
    async getTeamStats(teamId, season) {
        const params = season ? { season } : {};
        return this.get(`teams/${teamId}/stats`, params);
    }
    // ========== Player Methods ==========
    async getPlayers(options = {}) {
        const { filter = {}, limit = 20, offset = 0 } = options;
        return this.get('players', { ...filter, limit, offset });
    }
    async getPlayer(id) {
        return this.get(`players/${id}`);
    }
    async getPlayersByTeam(teamId) {
        return this.get(`teams/${teamId}/players`);
    }
    async getPlayerStats(playerId, options = {}) {
        const { season, gameId } = options;
        const params = {};
        if (season)
            params.season = season;
        if (gameId)
            params.gameId = gameId;
        return this.get(`players/${playerId}/stats`, params);
    }
    // ========== Game Methods ==========
    async getGames(options = {}) {
        const { filter = {}, limit = 20, offset = 0 } = options;
        const games = await this.get('games', { ...filter, limit, offset });
        return {
            games,
            totalCount: games.length, // In real implementation, this would come from API
            hasNextPage: games.length === limit,
            offset,
        };
    }
    async getGame(id) {
        return this.get(`games/${id}`);
    }
    async getGamesByTeam(teamId, homeAway) {
        const params = homeAway ? { [homeAway]: teamId } : { teamId };
        return this.get('games', params);
    }
    // ========== Market Data Methods ==========
    async getMarketData(playerId, gameId) {
        return this.get(`market-data/${playerId}/${gameId}`);
    }
    async getGameMarketData(gameId) {
        return this.get(`games/${gameId}/market-data`);
    }
    async getGameOwnership(gameId) {
        return this.get(`games/${gameId}/ownership`);
    }
    async getSalaryChanges(days = 7) {
        return this.get('salary-changes', { days });
    }
    // ========== Caching and Batching ==========
    /**
     * Cache key for GET requests
     */
    cacheKeyFor(request) {
        return `sports:${request.url}:${JSON.stringify(request.params)}`;
    }
    /**
     * TTL for cached responses
     */
    cacheOptionsFor() {
        return {
            ttl: 300, // 5 minutes for most sports data
        };
    }
    /**
     * Batch multiple player requests
     */
    async getPlayersBatch(playerIds) {
        const players = await Promise.all(playerIds.map(id => this.getPlayer(id)));
        return players;
    }
    /**
     * Batch multiple team requests
     */
    async getTeamsBatch(teamIds) {
        const teams = await Promise.all(teamIds.map(id => this.getTeam(id)));
        return teams;
    }
    /**
     * Batch multiple game requests
     */
    async getGamesBatch(gameIds) {
        const games = await Promise.all(gameIds.map(id => this.getGame(id)));
        return games;
    }
}
exports.SportsDataSource = SportsDataSource;
exports.default = SportsDataSource;
//# sourceMappingURL=sports-datasource.js.map