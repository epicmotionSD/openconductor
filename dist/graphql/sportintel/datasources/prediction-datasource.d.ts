/**
 * Prediction Data Source
 *
 * GraphQL data source for AI predictions and explainable AI features
 */
import { RESTDataSource } from 'apollo-datasource-rest';
export declare class PredictionDataSource extends RESTDataSource {
    private logger;
    private config;
    constructor();
    private getBaseURL;
    willSendRequest(request: any): void;
    errorFromResponse(response: any): Error;
    getPredictions(options?: any): Promise<{
        predictions: any;
        totalCount: any;
        hasNextPage: boolean;
        offset: any;
    }>;
    getPrediction(id: string): Promise<any>;
    getPlayerPredictions(options?: any): Promise<{
        predictions: any;
        totalCount: any;
        hasNextPage: boolean;
        offset: any;
    }>;
    getPredictionsByGame(gameId: string): Promise<any>;
    getPredictionExplanation(predictionId: string): Promise<any>;
    getPredictionsBatch(predictionIds: string[]): Promise<any>;
    cacheKeyFor(request: any): string;
    cacheOptionsFor(): {
        ttl: number;
    };
}
export default PredictionDataSource;
//# sourceMappingURL=prediction-datasource.d.ts.map