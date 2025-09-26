"use strict";
/**
 * Prediction Data Source
 *
 * GraphQL data source for AI predictions and explainable AI features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionDataSource = void 0;
const apollo_datasource_rest_1 = require("apollo-datasource-rest");
const logger_1 = require("../../../utils/logger");
const development_config_1 = require("../../../config/sportintel/development-config");
class PredictionDataSource extends apollo_datasource_rest_1.RESTDataSource {
    logger;
    config;
    constructor() {
        super();
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.baseURL = this.getBaseURL();
        this.memoizeGetRequests = true;
    }
    getBaseURL() {
        if (this.config.isDevelopment()) {
            return 'http://localhost:3002/api/predictions';
        }
        return 'https://api.sportintel.ai/predictions';
    }
    willSendRequest(request) {
        request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
        request.headers.set('Accept', 'application/json');
    }
    errorFromResponse(response) {
        this.logger.error('Predictions API Error', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
        });
        return new Error(`Predictions API Error: ${response.status} ${response.statusText}`);
    }
    // ========== Prediction Methods ==========
    async getPredictions(options = {}) {
        const { filter = {}, limit = 20, offset = 0 } = options;
        const predictions = await this.get('', { ...filter, limit, offset });
        return {
            predictions,
            totalCount: predictions.length,
            hasNextPage: predictions.length === limit,
            offset,
        };
    }
    async getPrediction(id) {
        return this.get(id);
    }
    async getPlayerPredictions(options = {}) {
        const { playerId, gameId, limit = 5, offset = 0 } = options;
        const params = { playerId, limit, offset };
        if (gameId)
            params.gameId = gameId;
        const predictions = await this.get('player', params);
        return {
            predictions,
            totalCount: predictions.length,
            hasNextPage: predictions.length === limit,
            offset,
        };
    }
    async getPredictionsByGame(gameId) {
        return this.get('game', { gameId });
    }
    async getPredictionExplanation(predictionId) {
        return this.get(`${predictionId}/explanation`);
    }
    // ========== Batch Operations ==========
    async getPredictionsBatch(predictionIds) {
        const predictions = await Promise.all(predictionIds.map(id => this.getPrediction(id)));
        return predictions;
    }
    // ========== Caching ==========
    cacheKeyFor(request) {
        return `predictions:${request.url}:${JSON.stringify(request.params)}`;
    }
    cacheOptionsFor() {
        return {
            ttl: 180, // 3 minutes for predictions
        };
    }
}
exports.PredictionDataSource = PredictionDataSource;
exports.default = PredictionDataSource;
//# sourceMappingURL=prediction-datasource.js.map