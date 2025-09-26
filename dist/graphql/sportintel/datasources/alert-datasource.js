"use strict";
/**
 * Alert Data Source
 *
 * GraphQL data source for alerts and notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDataSource = void 0;
const apollo_datasource_rest_1 = require("apollo-datasource-rest");
const logger_1 = require("../../../utils/logger");
const development_config_1 = require("../../../config/sportintel/development-config");
class AlertDataSource extends apollo_datasource_rest_1.RESTDataSource {
    logger;
    config;
    constructor() {
        super();
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.baseURL = this.getBaseURL();
        this.memoizeGetRequests = false; // Alerts are real-time
    }
    getBaseURL() {
        if (this.config.isDevelopment()) {
            return 'http://localhost:3005/api/alerts';
        }
        return 'https://api.sportintel.ai/alerts';
    }
    willSendRequest(request) {
        request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
        request.headers.set('Accept', 'application/json');
    }
    errorFromResponse(response) {
        this.logger.error('Alerts API Error', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
        });
        return new Error(`Alerts API Error: ${response.status} ${response.statusText}`);
    }
    // ========== Alert Methods ==========
    async getUserAlerts(userId, options = {}) {
        const { read, limit = 20, offset = 0 } = options;
        const params = { userId, limit, offset };
        if (typeof read === 'boolean')
            params.read = read;
        return this.get('', params);
    }
    async getAlert(id) {
        return this.get(id);
    }
    async getAlertsByPortfolio(portfolioId) {
        return this.get('', { portfolioId });
    }
    async markAlertRead(id) {
        return this.put(`${id}/read`);
    }
    async markAllAlertsRead(userId) {
        return this.put('read-all', { userId });
    }
    async deleteAlert(id) {
        return this.delete(id);
    }
    async createAlert(data) {
        return this.post('', data);
    }
    // ========== Batch Operations ==========
    async getAlertsBatch(alertIds) {
        const alerts = await Promise.all(alertIds.map(id => this.getAlert(id)));
        return alerts;
    }
    async markAlertsReadBatch(alertIds) {
        const results = await Promise.all(alertIds.map(id => this.markAlertRead(id)));
        return results;
    }
    // ========== Real-time Methods ==========
    async subscribeToAlerts(userId) {
        // This would integrate with WebSocket or Server-Sent Events
        return this.post('subscribe', { userId });
    }
    async unsubscribeFromAlerts(userId) {
        return this.post('unsubscribe', { userId });
    }
    // ========== Caching ==========
    cacheKeyFor(request) {
        return `alerts:${request.url}:${JSON.stringify(request.params)}`;
    }
    cacheOptionsFor() {
        return {
            ttl: 30, // 30 seconds for alerts
        };
    }
}
exports.AlertDataSource = AlertDataSource;
exports.default = AlertDataSource;
//# sourceMappingURL=alert-datasource.js.map