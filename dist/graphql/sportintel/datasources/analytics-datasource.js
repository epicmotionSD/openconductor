"use strict";
/**
 * Analytics Data Source
 *
 * GraphQL data source for advanced analytics and insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsDataSource = void 0;
const apollo_datasource_rest_1 = require("apollo-datasource-rest");
const logger_1 = require("../../../utils/logger");
const development_config_1 = require("../../../config/sportintel/development-config");
class AnalyticsDataSource extends apollo_datasource_rest_1.RESTDataSource {
    logger;
    config;
    constructor() {
        super();
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.baseURL = this.getBaseURL();
        this.memoizeGetRequests = true; // Analytics can be cached longer
    }
    getBaseURL() {
        if (this.config.isDevelopment()) {
            return 'http://localhost:3003/api/analytics';
        }
        return 'https://api.sportintel.ai/analytics';
    }
    willSendRequest(request) {
        request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
        request.headers.set('Accept', 'application/json');
    }
    errorFromResponse(response) {
        this.logger.error('Analytics API Error', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
        });
        return new Error(`Analytics API Error: ${response.status} ${response.statusText}`);
    }
    // ========== Player Analytics ==========
    async getPlayerAnalytics(playerId) {
        return this.get(`players/${playerId}`);
    }
    async getPlayerSeasonStats(playerId, season) {
        const params = season ? { season } : {};
        return this.get(`players/${playerId}/season-stats`, params);
    }
    async getPlayerRecentForm(playerId, games = 5) {
        return this.get(`players/${playerId}/recent-form`, { games });
    }
    async getPlayerMatchupHistory(playerId, opponentId) {
        return this.get(`players/${playerId}/matchup-history`, { opponentId });
    }
    async getPlayerProjectionAccuracy(playerId) {
        return this.get(`players/${playerId}/projection-accuracy`);
    }
    async getPlayerValueMetrics(playerId) {
        return this.get(`players/${playerId}/value-metrics`);
    }
    async getPlayerOwnershipTrends(playerId, days = 30) {
        return this.get(`players/${playerId}/ownership-trends`, { days });
    }
    async getSimilarPlayers(playerId, limit = 10) {
        return this.get(`players/${playerId}/similar`, { limit });
    }
    // ========== Team Analytics ==========
    async getTeamAnalytics(teamId) {
        return this.get(`teams/${teamId}`);
    }
    async getTeamSeasonStats(teamId, season) {
        const params = season ? { season } : {};
        return this.get(`teams/${teamId}/season-stats`, params);
    }
    async getTeamRecentForm(teamId, games = 5) {
        return this.get(`teams/${teamId}/recent-form`, { games });
    }
    async getTeamHomeAwaySplits(teamId) {
        return this.get(`teams/${teamId}/home-away-splits`);
    }
    async getTeamStrengthOfSchedule(teamId) {
        return this.get(`teams/${teamId}/strength-of-schedule`);
    }
    async getTeamPaceMetrics(teamId) {
        return this.get(`teams/${teamId}/pace-metrics`);
    }
    async getTeamDefenseRankings(teamId) {
        return this.get(`teams/${teamId}/defense-rankings`);
    }
    // ========== Game Analytics ==========
    async getGameAnalytics(gameId) {
        return this.get(`games/${gameId}`);
    }
    async getGameScript(gameId) {
        return this.get(`games/${gameId}/game-script`);
    }
    async getWeatherImpact(gameId) {
        return this.get(`games/${gameId}/weather-impact`);
    }
    async getVegasAnalysis(gameId) {
        return this.get(`games/${gameId}/vegas-analysis`);
    }
    async getPublicBetting(gameId) {
        return this.get(`games/${gameId}/public-betting`);
    }
    async getKeyInjuries(gameId) {
        return this.get(`games/${gameId}/key-injuries`);
    }
    async getGameNarratives(gameId) {
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
    async getModelAccuracy(modelName) {
        const params = modelName ? { model: modelName } : {};
        return this.get('models/accuracy', params);
    }
    async getModelPerformance(modelName, timeframe = '30d') {
        const params = modelName ? { model: modelName, timeframe } : { timeframe };
        return this.get('models/performance', params);
    }
    async getFeatureImportance(modelName) {
        const params = modelName ? { model: modelName } : {};
        return this.get('models/feature-importance', params);
    }
    async getCalibrationData(modelName) {
        const params = modelName ? { model: modelName } : {};
        return this.get('models/calibration', params);
    }
    async getBacktestResults(modelName) {
        const params = modelName ? { model: modelName } : {};
        return this.get('models/backtest', params);
    }
    // ========== Trend Analytics ==========
    async getTrendAnalytics() {
        return this.get('trends');
    }
    async getPlayerTrends(timeframe = '7d') {
        return this.get('trends/players', { timeframe });
    }
    async getTeamTrends(timeframe = '7d') {
        return this.get('trends/teams', { timeframe });
    }
    async getMarketTrends(timeframe = '7d') {
        return this.get('trends/market', { timeframe });
    }
    async getOwnershipTrends(timeframe = '7d') {
        return this.get('trends/ownership', { timeframe });
    }
    async getSalaryTrends(timeframe = '7d') {
        return this.get('trends/salary', { timeframe });
    }
    // ========== Custom Analytics ==========
    async getCustomAnalytics(query) {
        return this.post('custom', query);
    }
    async createAnalyticsReport(config) {
        return this.post('reports', config);
    }
    async getAnalyticsReport(reportId) {
        return this.get(`reports/${reportId}`);
    }
    // ========== Batch Operations ==========
    async getPlayerAnalyticsBatch(playerIds) {
        return this.post('batch/players', { playerIds });
    }
    async getTeamAnalyticsBatch(teamIds) {
        return this.post('batch/teams', { teamIds });
    }
    async getGameAnalyticsBatch(gameIds) {
        return this.post('batch/games', { gameIds });
    }
    // ========== Caching ==========
    cacheKeyFor(request) {
        return `analytics:${request.url}:${JSON.stringify(request.params)}`;
    }
    cacheOptionsFor() {
        return {
            ttl: 600, // 10 minutes for analytics data
        };
    }
}
exports.AnalyticsDataSource = AnalyticsDataSource;
exports.default = AnalyticsDataSource;
//# sourceMappingURL=analytics-datasource.js.map