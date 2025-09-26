/**
 * Analytics Data Source
 * 
 * GraphQL data source for advanced analytics and insights
 */

import { RESTDataSource } from 'apollo-datasource-rest';
import { Logger } from '../../../utils/logger';
import { SportIntelConfigManager } from '../../../config/sportintel/development-config';

export class AnalyticsDataSource extends RESTDataSource {
  private logger: Logger;
  private config: SportIntelConfigManager;

  constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.baseURL = this.getBaseURL();
    this.memoizeGetRequests = true; // Analytics can be cached longer
  }

  private getBaseURL(): string {
    if (this.config.isDevelopment()) {
      return 'http://localhost:3003/api/analytics';
    }
    return 'https://api.sportintel.ai/analytics';
  }

  willSendRequest(request: any) {
    request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
    request.headers.set('Accept', 'application/json');
  }

  errorFromResponse(response: any) {
    this.logger.error('Analytics API Error', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
    
    return new Error(`Analytics API Error: ${response.status} ${response.statusText}`);
  }

  // ========== Player Analytics ==========

  async getPlayerAnalytics(playerId: string) {
    return this.get(`players/${playerId}`);
  }

  async getPlayerSeasonStats(playerId: string, season?: number) {
    const params = season ? { season } : {};
    return this.get(`players/${playerId}/season-stats`, params);
  }

  async getPlayerRecentForm(playerId: string, games: number = 5) {
    return this.get(`players/${playerId}/recent-form`, { games });
  }

  async getPlayerMatchupHistory(playerId: string, opponentId: string) {
    return this.get(`players/${playerId}/matchup-history`, { opponentId });
  }

  async getPlayerProjectionAccuracy(playerId: string) {
    return this.get(`players/${playerId}/projection-accuracy`);
  }

  async getPlayerValueMetrics(playerId: string) {
    return this.get(`players/${playerId}/value-metrics`);
  }

  async getPlayerOwnershipTrends(playerId: string, days: number = 30) {
    return this.get(`players/${playerId}/ownership-trends`, { days });
  }

  async getSimilarPlayers(playerId: string, limit: number = 10) {
    return this.get(`players/${playerId}/similar`, { limit });
  }

  // ========== Team Analytics ==========

  async getTeamAnalytics(teamId: string) {
    return this.get(`teams/${teamId}`);
  }

  async getTeamSeasonStats(teamId: string, season?: number) {
    const params = season ? { season } : {};
    return this.get(`teams/${teamId}/season-stats`, params);
  }

  async getTeamRecentForm(teamId: string, games: number = 5) {
    return this.get(`teams/${teamId}/recent-form`, { games });
  }

  async getTeamHomeAwaySplits(teamId: string) {
    return this.get(`teams/${teamId}/home-away-splits`);
  }

  async getTeamStrengthOfSchedule(teamId: string) {
    return this.get(`teams/${teamId}/strength-of-schedule`);
  }

  async getTeamPaceMetrics(teamId: string) {
    return this.get(`teams/${teamId}/pace-metrics`);
  }

  async getTeamDefenseRankings(teamId: string) {
    return this.get(`teams/${teamId}/defense-rankings`);
  }

  // ========== Game Analytics ==========

  async getGameAnalytics(gameId: string) {
    return this.get(`games/${gameId}`);
  }

  async getGameScript(gameId: string) {
    return this.get(`games/${gameId}/game-script`);
  }

  async getWeatherImpact(gameId: string) {
    return this.get(`games/${gameId}/weather-impact`);
  }

  async getVegasAnalysis(gameId: string) {
    return this.get(`games/${gameId}/vegas-analysis`);
  }

  async getPublicBetting(gameId: string) {
    return this.get(`games/${gameId}/public-betting`);
  }

  async getKeyInjuries(gameId: string) {
    return this.get(`games/${gameId}/key-injuries`);
  }

  async getGameNarratives(gameId: string) {
    return this.get(`games/${gameId}/narratives`);
  }

  // ========== Market Analytics ==========

  async getMarketAnalytics() {
    return this.get('market');
  }

  async getOwnershipAnalytics() {
    return this.get('market/ownership');
  }

  async getSalaryAnalytics() {
    return this.get('market/salary');
  }

  async getValueAnalytics() {
    return this.get('market/value');
  }

  async getContrarianAnalytics() {
    return this.get('market/contrarian');
  }

  async getSharpAnalytics() {
    return this.get('market/sharp');
  }

  // ========== Model Analytics ==========

  async getModelAnalytics() {
    return this.get('models');
  }

  async getModelAccuracy(modelName?: string) {
    const params = modelName ? { model: modelName } : {};
    return this.get('models/accuracy', params);
  }

  async getModelPerformance(modelName?: string, timeframe: string = '30d') {
    const params = modelName ? { model: modelName, timeframe } : { timeframe };
    return this.get('models/performance', params);
  }

  async getFeatureImportance(modelName?: string) {
    const params = modelName ? { model: modelName } : {};
    return this.get('models/feature-importance', params);
  }

  async getCalibrationData(modelName?: string) {
    const params = modelName ? { model: modelName } : {};
    return this.get('models/calibration', params);
  }

  async getBacktestResults(modelName?: string) {
    const params = modelName ? { model: modelName } : {};
    return this.get('models/backtest', params);
  }

  // ========== Trend Analytics ==========

  async getTrendAnalytics() {
    return this.get('trends');
  }

  async getPlayerTrends(timeframe: string = '7d') {
    return this.get('trends/players', { timeframe });
  }

  async getTeamTrends(timeframe: string = '7d') {
    return this.get('trends/teams', { timeframe });
  }

  async getMarketTrends(timeframe: string = '7d') {
    return this.get('trends/market', { timeframe });
  }

  async getOwnershipTrends(timeframe: string = '7d') {
    return this.get('trends/ownership', { timeframe });
  }

  async getSalaryTrends(timeframe: string = '7d') {
    return this.get('trends/salary', { timeframe });
  }

  // ========== Custom Analytics ==========

  async getCustomAnalytics(query: any) {
    return this.post('custom', query);
  }

  async createAnalyticsReport(config: any) {
    return this.post('reports', config);
  }

  async getAnalyticsReport(reportId: string) {
    return this.get(`reports/${reportId}`);
  }

  // ========== Batch Operations ==========

  async getPlayerAnalyticsBatch(playerIds: string[]) {
    return this.post('batch/players', { playerIds });
  }

  async getTeamAnalyticsBatch(teamIds: string[]) {
    return this.post('batch/teams', { teamIds });
  }

  async getGameAnalyticsBatch(gameIds: string[]) {
    return this.post('batch/games', { gameIds });
  }

  // ========== Caching ==========

  cacheKeyFor(request: any) {
    return `analytics:${request.url}:${JSON.stringify(request.params)}`;
  }

  cacheOptionsFor() {
    return {
      ttl: 600, // 10 minutes for analytics data
    };
  }
}

export default AnalyticsDataSource;