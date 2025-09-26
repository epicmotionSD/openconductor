/**
 * Portfolio Data Source
 * 
 * GraphQL data source for portfolio management and lineup optimization
 */

import { RESTDataSource } from 'apollo-datasource-rest';
import { Logger } from '../../../utils/logger';
import { SportIntelConfigManager } from '../../../config/sportintel/development-config';

export class PortfolioDataSource extends RESTDataSource {
  private logger: Logger;
  private config: SportIntelConfigManager;

  constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.baseURL = this.getBaseURL();
    this.memoizeGetRequests = false; // Portfolio data changes frequently
  }

  private getBaseURL(): string {
    if (this.config.isDevelopment()) {
      return 'http://localhost:3004/api/portfolio';
    }
    return 'https://api.sportintel.ai/portfolio';
  }

  willSendRequest(request: any) {
    request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
    request.headers.set('Accept', 'application/json');
    request.headers.set('Content-Type', 'application/json');
  }

  errorFromResponse(response: any) {
    this.logger.error('Portfolio API Error', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
    
    return new Error(`Portfolio API Error: ${response.status} ${response.statusText}`);
  }

  // ========== Portfolio Methods ==========

  async getUserPortfolios(userId: string) {
    return this.get('portfolios', { userId });
  }

  async getPortfolio(id: string) {
    return this.get(`portfolios/${id}`);
  }

  async createPortfolio(data: any) {
    return this.post('portfolios', data);
  }

  async updatePortfolio(id: string, data: any) {
    return this.put(`portfolios/${id}`, data);
  }

  async deletePortfolio(id: string) {
    return this.delete(`portfolios/${id}`);
  }

  async getPortfolioPerformance(portfolioId: string) {
    return this.get(`portfolios/${portfolioId}/performance`);
  }

  // ========== Lineup Methods ==========

  async getLineups(portfolioId?: string) {
    const params = portfolioId ? { portfolioId } : {};
    return this.get('lineups', params);
  }

  async getLineup(id: string) {
    return this.get(`lineups/${id}`);
  }

  async getLineupsByPortfolio(portfolioId: string) {
    return this.get(`portfolios/${portfolioId}/lineups`);
  }

  async createLineup(data: any) {
    return this.post('lineups', data);
  }

  async updateLineup(id: string, data: any) {
    return this.put(`lineups/${id}`, data);
  }

  async deleteLineup(id: string) {
    return this.delete(`lineups/${id}`);
  }

  async getLineupExposure(lineupId: string) {
    return this.get(`lineups/${lineupId}/exposure`);
  }

  // ========== Optimization Methods ==========

  async optimizeLineup(input: any) {
    return this.post('lineups/optimize', input);
  }

  async optimizePortfolio(portfolioId: string, input: any) {
    return this.post(`portfolios/${portfolioId}/optimize`, input);
  }

  // ========== Webhook Methods ==========

  async createWebhook(data: any) {
    return this.post('webhooks', data);
  }

  async updateWebhook(id: string, data: any) {
    return this.put(`webhooks/${id}`, data);
  }

  async deleteWebhook(id: string) {
    return this.delete(`webhooks/${id}`);
  }

  async getUserWebhooks(userId: string) {
    return this.get('webhooks', { userId });
  }

  // ========== Caching ==========

  cacheKeyFor(request: any) {
    return `portfolio:${request.url}:${JSON.stringify(request.params)}`;
  }

  cacheOptionsFor() {
    return {
      ttl: 60, // 1 minute for portfolio data
    };
  }
}

export default PortfolioDataSource;