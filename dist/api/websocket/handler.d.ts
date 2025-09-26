/**
 * OpenConductor WebSocket Handler
 *
 * Real-time communication handler for agent coordination, live events,
 * and distributed AI agent communication.
 */
import { WebSocketServer, WebSocket } from 'ws';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
export interface WebSocketMessage {
    type: 'subscribe' | 'unsubscribe' | 'event' | 'ping' | 'pong' | 'error' | 'agent-command' | 'workflow-command';
    id?: string;
    data?: any;
    timestamp: string;
    requestId?: string;
}
export interface WebSocketSubscription {
    id: string;
    type: 'events' | 'agent-status' | 'workflow-progress' | 'system-metrics' | 'agent-commands';
    filter?: any;
    clientId: string;
}
export interface WebSocketClient {
    id: string;
    socket: WebSocket;
    userId?: string;
    subscriptions: Set<string>;
    isAuthenticated: boolean;
    metadata: {
        connectedAt: Date;
        lastActivity: Date;
        messagesSent: number;
        messagesReceived: number;
        ip: string;
        userAgent?: string;
    };
}
/**
 * WebSocket Handler for real-time communication
 */
export declare class WebSocketHandler {
    private wss;
    private conductor;
    private logger;
    private errorManager;
    private clients;
    private subscriptions;
    private pingInterval;
    private cleanupInterval;
    constructor(wss: WebSocketServer, conductor: OpenConductor, logger: Logger, errorManager: ErrorManager);
    /**
     * Initialize WebSocket handler
     */
    initialize(): void;
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage;
    /**
     * Handle subscription request
     */
    private handleSubscribe;
    /**
     * Handle unsubscribe request
     */
    private handleUnsubscribe;
    /**
     * Handle ping request
     */
    private handlePing;
    /**
     * Handle agent command
     */
    private handleAgentCommand;
    /**
     * Handle workflow command
     */
    private handleWorkflowCommand;
    /**
     * Authenticate WebSocket client
     */
    private authenticateClient;
    /**
     * Handle client disconnection
     */
    private handleDisconnection;
    /**
     * Handle WebSocket error
     */
    private handleError;
    /**
     * Send message to client
     */
    private sendMessage;
    /**
     * Send error message to client
     */
    private sendError;
    /**
     * Broadcast message to all subscribed clients
     */
    private broadcastToSubscribers;
    /**
     * Check if data matches subscription filter
     */
    private matchesFilter;
    /**
     * Subscribe to conductor events for broadcasting
     */
    private subscribeToEvents;
    /**
     * Ping all clients
     */
    private pingClients;
    /**
     * Clean up dead connections
     */
    private cleanupDeadConnections;
    /**
     * Shutdown WebSocket handler
     */
    shutdown(): Promise<void>;
    /**
     * Get connection statistics
     */
    getStats(): any;
    /**
     * Get subscriptions grouped by type
     */
    private getSubscriptionsByType;
    /**
     * Generate unique client ID
     */
    private generateClientId;
    /**
     * Generate unique subscription ID
     */
    private generateSubscriptionId;
    /**
     * Extract client IP from request
     */
    private extractClientIP;
}
//# sourceMappingURL=handler.d.ts.map