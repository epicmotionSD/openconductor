/**
 * Portfolio Data Source
 *
 * GraphQL data source for portfolio management and lineup optimization
 */
import { RESTDataSource } from 'apollo-datasource-rest';
export declare class PortfolioDataSource extends RESTDataSource {
    private logger;
    private config;
    constructor();
    private getBaseURL;
    willSendRequest(request: any): void;
    errorFromResponse(response: any): Error;
    getUserPortfolios(userId: string): Promise<any>;
    getPortfolio(id: string): Promise<any>;
    createPortfolio(data: any): Promise<any>;
    updatePortfolio(id: string, data: any): Promise<any>;
    deletePortfolio(id: string): Promise<any>;
    getPortfolioPerformance(portfolioId: string): Promise<any>;
    getLineups(portfolioId?: string): Promise<any>;
    getLineup(id: string): Promise<any>;
    getLineupsByPortfolio(portfolioId: string): Promise<any>;
    createLineup(data: any): Promise<any>;
    updateLineup(id: string, data: any): Promise<any>;
    deleteLineup(id: string): Promise<any>;
    getLineupExposure(lineupId: string): Promise<any>;
    optimizeLineup(input: any): Promise<any>;
    optimizePortfolio(portfolioId: string, input: any): Promise<any>;
    createWebhook(data: any): Promise<any>;
    updateWebhook(id: string, data: any): Promise<any>;
    deleteWebhook(id: string): Promise<any>;
    getUserWebhooks(userId: string): Promise<any>;
    cacheKeyFor(request: any): string;
    cacheOptionsFor(): {
        ttl: number;
    };
}
export default PortfolioDataSource;
//# sourceMappingURL=portfolio-datasource.d.ts.map