/**
 * Prediction Data Source
 * 
 * GraphQL data source for AI predictions and explainable AI features
 */

import { RESTDataSource } from 'apollo-datasource-rest';
import { Logger } from '../../../utils/logger';
import { SportIntelConfigManager } from '../../../config/sportintel/development-config';

export class PredictionDataSource extends RESTDataSource {
  private logger: Logger;
  private config: SportIntelConfigManager;

  constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.baseURL = this.getBaseURL();
    this.memoizeGetRequests = true;
  }

  private getBaseURL(): string {
    if (this.config.isDevelopment()) {
      return 'http://localhost:3002/api/predictions';
    }
    return 'https://api.sportintel.ai/predictions';
  }

  willSendRequest(request: any) {
    request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
    request.headers.set('Accept', 'application/json');
  }

  errorFromResponse(response: any) {
    this.logger.error('Predictions API Error', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
    
    return new Error(`Predictions API Error: ${response.status} ${response.statusText}`);
  }

  // ========== Prediction Methods ==========

  async getPredictions(options: any = {}) {
    const { filter = {}, limit = 20, offset = 0 } = options;
    
    const predictions = await this.get('', { ...filter, limit, offset });
    
    return {
      predictions,
      totalCount: predictions.length,
      hasNextPage: predictions.length === limit,
      offset,
    };
  }

  async getPrediction(id: string) {
    return this.get(id);
  }

  async getPlayerPredictions(options: any = {}) {
    const { playerId, gameId, limit = 5, offset = 0 } = options;
    const params: any = { playerId, limit, offset };
    if (gameId) params.gameId = gameId;
    
    const predictions = await this.get('player', params);
    
    return {
      predictions,
      totalCount: predictions.length,
      hasNextPage: predictions.length === limit,
      offset,
    };
  }

  async getPredictionsByGame(gameId: string) {
    return this.get('game', { gameId });
  }

  async getPredictionExplanation(predictionId: string) {
    return this.get(`${predictionId}/explanation`);
  }

  // ========== Batch Operations ==========

  async getPredictionsBatch(predictionIds: string[]) {
    const predictions = await Promise.all(
      predictionIds.map(id => this.getPrediction(id))
    );
    return predictions;
  }

  // ========== Caching ==========

  cacheKeyFor(request: any) {
    return `predictions:${request.url}:${JSON.stringify(request.params)}`;
  }

  cacheOptionsFor() {
    return {
      ttl: 180, // 3 minutes for predictions
    };
  }
}

export default PredictionDataSource;