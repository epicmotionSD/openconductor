/**
 * OpenConductor API Client
 *
 * HTTP REST API client for OpenConductor services
 */
import { Logger } from '../utils/logger';
export interface APIClientConfig {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    retries?: number;
}
export declare class OpenConductorAPIClient {
    private _config;
    private logger;
    constructor(config: APIClientConfig, logger: Logger);
    get(endpoint: string, params?: Record<string, any>): Promise<any>;
    post(endpoint: string, data?: any): Promise<any>;
    put(endpoint: string, data?: any): Promise<any>;
    delete(endpoint: string): Promise<any>;
}
//# sourceMappingURL=client.d.ts.map