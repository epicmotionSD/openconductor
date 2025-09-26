"use strict";
/**
 * Portfolio Data Source
 *
 * GraphQL data source for portfolio management and lineup optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioDataSource = void 0;
const apollo_datasource_rest_1 = require("apollo-datasource-rest");
const logger_1 = require("../../../utils/logger");
const development_config_1 = require("../../../config/sportintel/development-config");
class PortfolioDataSource extends apollo_datasource_rest_1.RESTDataSource {
    logger;
    config;
    constructor() {
        super();
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.baseURL = this.getBaseURL();
        this.memoizeGetRequests = false; // Portfolio data changes frequently
    }
    getBaseURL() {
        if (this.config.isDevelopment()) {
            return 'http://localhost:3004/api/portfolio';
        }
        return 'https://api.sportintel.ai/portfolio';
    }
    willSendRequest(request) {
        request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
        request.headers.set('Accept', 'application/json');
        request.headers.set('Content-Type', 'application/json');
    }
    errorFromResponse(response) {
        this.logger.error('Portfolio API Error', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
        });
        return new Error(`Portfolio API Error: ${response.status} ${response.statusText}`);
    }
    // ========== Portfolio Methods ==========
    async getUserPortfolios(userId) {
        return this.get('portfolios', { userId });
    }
    async getPortfolio(id) {
        return this.get(`portfolios/${id}`);
    }
    async createPortfolio(data) {
        return this.post('portfolios', data);
    }
    async updatePortfolio(id, data) {
        return this.put(`portfolios/${id}`, data);
    }
    async deletePortfolio(id) {
        return this.delete(`portfolios/${id}`);
    }
    async getPortfolioPerformance(portfolioId) {
        return this.get(`portfolios/${portfolioId}/performance`);
    }
    // ========== Lineup Methods ==========
    async getLineups(portfolioId) {
        const params = portfolioId ? { portfolioId } : {};
        return this.get('lineups', params);
    }
    async getLineup(id) {
        return this.get(`lineups/${id}`);
    }
    async getLineupsByPortfolio(portfolioId) {
        return this.get(`portfolios/${portfolioId}/lineups`);
    }
    async createLineup(data) {
        return this.post('lineups', data);
    }
    async updateLineup(id, data) {
        return this.put(`lineups/${id}`, data);
    }
    async deleteLineup(id) {
        return this.delete(`lineups/${id}`);
    }
    async getLineupExposure(lineupId) {
        return this.get(`lineups/${lineupId}/exposure`);
    }
    // ========== Optimization Methods ==========
    async optimizeLineup(input) {
        return this.post('lineups/optimize', input);
    }
    async optimizePortfolio(portfolioId, input) {
        return this.post(`portfolios/${portfolioId}/optimize`, input);
    }
    // ========== Webhook Methods ==========
    async createWebhook(data) {
        return this.post('webhooks', data);
    }
    async updateWebhook(id, data) {
        return this.put(`webhooks/${id}`, data);
    }
    async deleteWebhook(id) {
        return this.delete(`webhooks/${id}`);
    }
    async getUserWebhooks(userId) {
        return this.get('webhooks', { userId });
    }
    // ========== Caching ==========
    cacheKeyFor(request) {
        return `portfolio:${request.url}:${JSON.stringify(request.params)}`;
    }
    cacheOptionsFor() {
        return {
            ttl: 60, // 1 minute for portfolio data
        };
    }
}
exports.PortfolioDataSource = PortfolioDataSource;
exports.default = PortfolioDataSource;
//# sourceMappingURL=portfolio-datasource.js.map