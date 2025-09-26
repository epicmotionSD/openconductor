/**
 * Alert Data Source
 *
 * GraphQL data source for alerts and notifications
 */
import { RESTDataSource } from 'apollo-datasource-rest';
export declare class AlertDataSource extends RESTDataSource {
    private logger;
    private config;
    constructor();
    private getBaseURL;
    willSendRequest(request: any): void;
    errorFromResponse(response: any): Error;
    getUserAlerts(userId: string, options?: any): Promise<any>;
    getAlert(id: string): Promise<any>;
    getAlertsByPortfolio(portfolioId: string): Promise<any>;
    markAlertRead(id: string): Promise<any>;
    markAllAlertsRead(userId: string): Promise<any>;
    deleteAlert(id: string): Promise<any>;
    createAlert(data: any): Promise<any>;
    getAlertsBatch(alertIds: string[]): Promise<any>;
    markAlertsReadBatch(alertIds: string[]): Promise<any>;
    subscribeToAlerts(userId: string): Promise<any>;
    unsubscribeFromAlerts(userId: string): Promise<any>;
    cacheKeyFor(request: any): string;
    cacheOptionsFor(): {
        ttl: number;
    };
}
export default AlertDataSource;
//# sourceMappingURL=alert-datasource.d.ts.map