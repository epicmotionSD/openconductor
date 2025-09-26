/**
 * OpenConductor WebSocket Client
 *
 * Real-time WebSocket client for OpenConductor services
 */
import { Logger } from '../utils/logger';
export interface WebSocketClientConfig {
    url: string;
    apiKey?: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
export declare class OpenConductorWebSocketClient {
    private config;
    private logger;
    private ws;
    private _reconnectCount;
    constructor(config: WebSocketClientConfig, logger: Logger);
    connect(): Promise<void>;
    disconnect(): void;
    send(message: any): void;
    onMessage(callback: (message: any) => void): void;
    onError(callback: (error: Error) => void): void;
}
//# sourceMappingURL=websocket-client.d.ts.map