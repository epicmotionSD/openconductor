/**
 * SportIntel Real-Time WebSocket Handler
 *
 * Bloomberg Terminal-style WebSocket handler that provides sub-200ms
 * real-time updates for sports data, predictions, and alerts.
 *
 * Integrates with OpenConductor's EventBus and real-time processor
 * to deliver professional-grade trading terminal experience.
 */
import { EventBus } from '../../types/events';
import { Logger } from '../../utils/logger';
import { RealTimeProcessor } from '../processing/sportintel/real-time-processor';
import WebSocket from 'ws';
export interface WebSocketHandlerConfig {
    enabled: boolean;
    server: {
        port: number;
        host: string;
        maxConnections: number;
        heartbeatIntervalMs: number;
    };
    dataStreams: {
        enabled: string[];
        updateRates: Record<string, number>;
        compressionEnabled: boolean;
    };
    authentication: {
        required: boolean;
        jwtSecret?: string;
        subscriptionTiers: Record<string, string[]>;
    };
    performance: {
        maxMessageSize: number;
        rateLimitPerSecond: number;
        bufferSize: number;
    };
}
export interface ClientConnection {
    id: string;
    socket: WebSocket;
    userId?: string;
    subscriptionTier: string;
    subscriptions: Set<string>;
    lastHeartbeat: Date;
    messageCount: number;
    rateLimitReset: Date;
    metadata: Record<string, any>;
}
export interface StreamMessage {
    type: 'data' | 'alert' | 'prediction' | 'market' | 'system';
    stream: string;
    timestamp: Date;
    data: any;
    sequence: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
}
export declare class RealTimeWebSocketHandler {
    private eventBus;
    private logger;
    private config;
    private realTimeProcessor;
    private wsServer?;
    private clients;
    private streamBuffers;
    private sequenceCounters;
    private messagesSent;
    private bytesTransmitted;
    private averageLatency;
    constructor(config: WebSocketHandlerConfig, eventBus: EventBus, logger: Logger, realTimeProcessor: RealTimeProcessor);
    /**
     * Start the WebSocket server
     */
    start(): Promise<void>;
    /**
     * Stop the WebSocket server
     */
    stop(): Promise<void>;
    /**
     * Set up WebSocket server event handlers
     */
    private setupWebSocketHandlers;
    /**
     * Handle new WebSocket connection
     */
    private handleNewConnection;
    /**
     * Set up client-specific event handlers
     */
    private setupClientHandlers;
    /**
     * Handle incoming client messages
     */
    private handleClientMessage;
    /**
     * Handle subscription requests
     */
    private handleSubscribe;
    /**
     * Handle unsubscribe requests
     */
    private handleUnsubscribe;
    /**
     * Handle authentication
     */
    private handleAuthenticate;
    /**
     * Set up EventBus subscriptions for real-time streams
     */
    private setupEventSubscriptions;
    /**
     * Broadcast event to relevant subscribers
     */
    private broadcastEventToSubscribers;
    /**
     * Send message to specific client
     */
    private sendMessage;
    /**
     * Start maintenance tasks
     */
    private startMaintenanceTasks;
    /**
     * Perform heartbeat check on all clients
     */
    private performHeartbeatCheck;
    /**
     * Handle client disconnect
     */
    private handleClientDisconnect;
    private generateClientId;
    private checkRateLimit;
    private isStreamAvailableForTier;
    private mapEventToStream;
    private getMessageType;
    private getEventPriority;
    private getNextSequence;
    private validateJWT;
    private sendInitialStreamData;
    private getInitialStreamData;
    private broadcastSystemEvent;
    private emitPerformanceMetrics;
    private cleanupBuffers;
    private closeConnection;
    private handleHeartbeat;
    private handleQuery;
    getConnectedClients(): number;
    getServerMetrics(): any;
}
export declare function createRealTimeWebSocketHandler(config: WebSocketHandlerConfig, eventBus: EventBus, logger: Logger, realTimeProcessor: RealTimeProcessor): RealTimeWebSocketHandler;
export declare const defaultWebSocketConfig: WebSocketHandlerConfig;
//# sourceMappingURL=realtime-websocket-handler.d.ts.map