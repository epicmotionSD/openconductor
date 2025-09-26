/**
 * Sports Data Source
 * 
 * GraphQL data source that integrates with OpenConductor sports data services
 * and provides caching, batching, and error handling for sports entities.
 */

import { RESTDataSource } from 'apollo-datasource-rest';
import { Logger } from '../../../utils/logger';
import { SportIntelConfigManager } from '../../../config/sportintel/development-config';

export class SportsDataSource extends RESTDataSource {
  private logger: Logger;
  private config: SportIntelConfigManager;

  constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.baseURL = this.getBaseURL();
    
    // Configure caching
    this.memoizeGetRequests = true;
  }

  /**
   * Get base URL for sports data API
   */
  private getBaseURL(): string {
    if (this.config.isDevelopment()) {
      return 'http://localhost:3001/api/sports';
    }
    return 'https://api.sportintel.ai/sports';
  }

  /**
   * Configure request headers
   */
  willSendRequest(request: any) {
    request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
    request.headers.set('Accept', 'application/json');
  }

  /**
   * Handle request errors
   */
  errorFromResponse(response: any) {
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

  async getLeague(id: string) {
    return this.get(`leagues/${id}`);
  }

  // ========== Team Methods ==========

  async getTeams(leagueId?: string) {
    const params = leagueId ? { leagueId } : {};
    return this.get('teams', params);
  }

  async getTeam(id: string) {
    return this.get(`teams/${id}`);
  }

  async getTeamsByLeague(leagueId: string) {
    return this.get(`leagues/${leagueId}/teams`);
  }

  async getTeamStats(teamId: string, season?: number) {
    const params = season ? { season } : {};
    return this.get(`teams/${teamId}/stats`, params);
  }

  // ========== Player Methods ==========

  async getPlayers(options: any = {}) {
    const { filter = {}, limit = 20, offset = 0 } = options;
    return this.get('players', { ...filter, limit, offset });
  }

  async getPlayer(id: string) {
    return this.get(`players/${id}`);
  }

  async getPlayersByTeam(teamId: string) {
    return this.get(`teams/${teamId}/players`);
  }

  async getPlayerStats(playerId: string, options: any = {}) {
    const { season, gameId } = options;
    const params: any = {};
    if (season) params.season = season;
    if (gameId) params.gameId = gameId;
    return this.get(`players/${playerId}/stats`, params);
  }

  // ========== Game Methods ==========

  async getGames(options: any = {}) {
    const { filter = {}, limit = 20, offset = 0 } = options;
    
    const games = await this.get('games', { ...filter, limit, offset });
    
    return {
      games,
      totalCount: games.length, // In real implementation, this would come from API
      hasNextPage: games.length === limit,
      offset,
    };
  }

  async getGame(id: string) {
    return this.get(`games/${id}`);
  }

  async getGamesByTeam(teamId: string, homeAway?: 'home' | 'away') {
    const params = homeAway ? { [homeAway]: teamId } : { teamId };
    return this.get('games', params);
  }

  // ========== Market Data Methods ==========

  async getMarketData(playerId: string, gameId: string) {
    return this.get(`market-data/${playerId}/${gameId}`);
  }

  async getGameMarketData(gameId: string) {
    return this.get(`games/${gameId}/market-data`);
  }

  async getGameOwnership(gameId: string) {
    return this.get(`games/${gameId}/ownership`);
  }

  async getSalaryChanges(days: number = 7) {
    return this.get('salary-changes', { days });
  }

  // ========== Caching and Batching ==========

  /**
   * Cache key for GET requests
   */
  cacheKeyFor(request: any) {
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
  async getPlayersBatch(playerIds: string[]) {
    const players = await Promise.all(
      playerIds.map(id => this.getPlayer(id))
    );
    return players;
  }

  /**
   * Batch multiple team requests
   */
  async getTeamsBatch(teamIds: string[]) {
    const teams = await Promise.all(
      teamIds.map(id => this.getTeam(id))
    );
    return teams;
  }

  /**
   * Batch multiple game requests
   */
  async getGamesBatch(gameIds: string[]) {
    const games = await Promise.all(
      gameIds.map(id => this.getGame(id))
    );
    return games;
  }
}

export default SportsDataSource;