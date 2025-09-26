/**
 * Alert Data Source
 * 
 * GraphQL data source for alerts and notifications
 */

import { RESTDataSource } from 'apollo-datasource-rest';
import { Logger } from '../../../utils/logger';
import { SportIntelConfigManager } from '../../../config/sportintel/development-config';

export class AlertDataSource extends RESTDataSource {
  private logger: Logger;
  private config: SportIntelConfigManager;

  constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.baseURL = this.getBaseURL();
    this.memoizeGetRequests = false; // Alerts are real-time
  }

  private getBaseURL(): string {
    if (this.config.isDevelopment()) {
      return 'http://localhost:3005/api/alerts';
    }
    return 'https://api.sportintel.ai/alerts';
  }

  willSendRequest(request: any) {
    request.headers.set('User-Agent', 'SportIntel-GraphQL-Gateway');
    request.headers.set('Accept', 'application/json');
  }

  errorFromResponse(response: any) {
    this.logger.error('Alerts API Error', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
    
    return new Error(`Alerts API Error: ${response.status} ${response.statusText}`);
  }

  // ========== Alert Methods ==========

  async getUserAlerts(userId: string, options: any = {}) {
    const { read, limit = 20, offset = 0 } = options;
    const params: any = { userId, limit, offset };
    if (typeof read === 'boolean') params.read = read;
    
    return this.get('', params);
  }

  async getAlert(id: string) {
    return this.get(id);
  }

  async getAlertsByPortfolio(portfolioId: string) {
    return this.get('', { portfolioId });
  }

  async markAlertRead(id: string) {
    return this.put(`${id}/read`);
  }

  async markAllAlertsRead(userId: string) {
    return this.put('read-all', { userId });
  }

  async deleteAlert(id: string) {
    return this.delete(id);
  }

  async createAlert(data: any) {
    return this.post('', data);
  }

  // ========== Batch Operations ==========

  async getAlertsBatch(alertIds: string[]) {
    const alerts = await Promise.all(
      alertIds.map(id => this.getAlert(id))
    );
    return alerts;
  }

  async markAlertsReadBatch(alertIds: string[]) {
    const results = await Promise.all(
      alertIds.map(id => this.markAlertRead(id))
    );
    return results;
  }

  // ========== Real-time Methods ==========

  async subscribeToAlerts(userId: string) {
    // This would integrate with WebSocket or Server-Sent Events
    return this.post('subscribe', { userId });
  }

  async unsubscribeFromAlerts(userId: string) {
    return this.post('unsubscribe', { userId });
  }

  // ========== Caching ==========

  cacheKeyFor(request: any) {
    return `alerts:${request.url}:${JSON.stringify(request.params)}`;
  }

  cacheOptionsFor() {
    return {
      ttl: 30, // 30 seconds for alerts
    };
  }
}

export default AlertDataSource;