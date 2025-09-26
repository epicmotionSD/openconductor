"use strict";
/**
 * OpenConductor WebSocket Handler
 *
 * Real-time communication handler for agent coordination, live events,
 * and distributed AI agent communication.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketHandler = void 0;
const ws_1 = require("ws");
const auth_1 = require("../middleware/auth");
/**
 * WebSocket Handler for real-time communication
 */
class WebSocketHandler {
    wss;
    conductor;
    logger;
    errorManager;
    clients = new Map();
    subscriptions = new Map();
    pingInterval;
    cleanupInterval;
    constructor(wss, conductor, logger, errorManager) {
        this.wss = wss;
        this.conductor = conductor;
        this.logger = logger;
        this.errorManager = errorManager;
    }
    /**
     * Initialize WebSocket handler
     */
    initialize() {
        this.logger.info('Initializing WebSocket handler...');
        // Handle new connections
        this.wss.on('connection', (socket, request) => {
            this.handleConnection(socket, request);
        });
        // Setup periodic ping/pong
        this.pingInterval = setInterval(() => {
            this.pingClients();
        }, 30000); // Every 30 seconds
        // Setup cleanup for dead connections
        this.cleanupInterval = setInterval(() => {
            this.cleanupDeadConnections();
        }, 60000); // Every minute
        // Subscribe to conductor events for broadcasting
        this.subscribeToEvents();
        this.logger.info('WebSocket handler initialized successfully');
    }
    /**
     * Handle new WebSocket connection
     */
    handleConnection(socket, request) {
        const clientId = this.generateClientId();
        const ip = this.extractClientIP(request);
        const userAgent = request.headers['user-agent'];
        this.logger.info('New WebSocket connection', { clientId, ip, userAgent });
        const client = {
            id: clientId,
            socket,
            subscriptions: new Set(),
            isAuthenticated: false,
            metadata: {
                connectedAt: new Date(),
                lastActivity: new Date(),
                messagesSent: 0,
                messagesReceived: 0,
                ip,
                userAgent
            }
        };
        this.clients.set(clientId, client);
        // Handle messages
        socket.on('message', (data) => {
            this.handleMessage(client, data);
        });
        // Handle connection close
        socket.on('close', (code, reason) => {
            this.handleDisconnection(client, code, reason);
        });
        // Handle errors
        socket.on('error', (error) => {
            this.handleError(client, error);
        });
        // Handle pong responses
        socket.on('pong', () => {
            client.metadata.lastActivity = new Date();
        });
        // Send welcome message
        this.sendMessage(client, {
            type: 'event',
            data: {
                type: 'connection.established',
                clientId,
                timestamp: new Date().toISOString(),
                message: 'WebSocket connection established'
            },
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Handle incoming WebSocket message
     */
    async handleMessage(client, data) {
        client.metadata.lastActivity = new Date();
        client.metadata.messagesReceived++;
        try {
            const message = JSON.parse(data.toString());
            this.logger.debug('WebSocket message received', {
                clientId: client.id,
                type: message.type,
                messageId: message.id
            });
            // Handle different message types
            switch (message.type) {
                case 'subscribe':
                    await this.handleSubscribe(client, message);
                    break;
                case 'unsubscribe':
                    await this.handleUnsubscribe(client, message);
                    break;
                case 'ping':
                    this.handlePing(client, message);
                    break;
                case 'agent-command':
                    await this.handleAgentCommand(client, message);
                    break;
                case 'workflow-command':
                    await this.handleWorkflowCommand(client, message);
                    break;
                default:
                    this.sendError(client, `Unknown message type: ${message.type}`, message.id);
            }
        }
        catch (error) {
            this.logger.error('Error handling WebSocket message:', error);
            this.sendError(client, 'Invalid message format', undefined, error);
        }
    }
    /**
     * Handle subscription request
     */
    async handleSubscribe(client, message) {
        const { type, filter } = message.data;
        const subscriptionId = this.generateSubscriptionId();
        // Authenticate if required for certain subscriptions
        if (['agent-commands', 'system-metrics'].includes(type) && !client.isAuthenticated) {
            await this.authenticateClient(client, message.data.token);
        }
        const subscription = {
            id: subscriptionId,
            type,
            filter,
            clientId: client.id
        };
        this.subscriptions.set(subscriptionId, subscription);
        client.subscriptions.add(subscriptionId);
        // Subscribe to conductor events based on type
        if (type === 'events') {
            // Already subscribed to all events in subscribeToEvents()
        }
        else if (type === 'agent-status') {
            // Subscribe to agent status updates
            this.conductor.events.subscribe(['agent.*'], (event) => {
                this.broadcastToSubscribers('agent-status', event);
            });
        }
        else if (type === 'workflow-progress') {
            // Subscribe to workflow progress updates
            this.conductor.events.subscribe(['workflow.*'], (event) => {
                this.broadcastToSubscribers('workflow-progress', event);
            });
        }
        this.sendMessage(client, {
            type: 'event',
            data: {
                type: 'subscription.created',
                subscriptionId,
                subscriptionType: type,
                timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString(),
            id: message.id
        });
        this.logger.info('WebSocket subscription created', {
            clientId: client.id,
            subscriptionId,
            subscriptionType: type
        });
    }
    /**
     * Handle unsubscribe request
     */
    async handleUnsubscribe(client, message) {
        const { subscriptionId } = message.data;
        if (client.subscriptions.has(subscriptionId)) {
            client.subscriptions.delete(subscriptionId);
            this.subscriptions.delete(subscriptionId);
            this.sendMessage(client, {
                type: 'event',
                data: {
                    type: 'subscription.removed',
                    subscriptionId,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                id: message.id
            });
            this.logger.info('WebSocket subscription removed', {
                clientId: client.id,
                subscriptionId
            });
        }
        else {
            this.sendError(client, `Subscription ${subscriptionId} not found`, message.id);
        }
    }
    /**
     * Handle ping request
     */
    handlePing(client, message) {
        this.sendMessage(client, {
            type: 'pong',
            timestamp: new Date().toISOString(),
            id: message.id
        });
    }
    /**
     * Handle agent command
     */
    async handleAgentCommand(client, message) {
        if (!client.isAuthenticated) {
            this.sendError(client, 'Authentication required for agent commands', message.id);
            return;
        }
        const { agentId, command, params } = message.data;
        try {
            let result;
            switch (command) {
                case 'execute':
                    result = await this.conductor.executeAgent(agentId, params.input);
                    break;
                case 'stop':
                    // TODO: Implement agent stopping
                    result = { message: 'Agent stop command received' };
                    break;
                case 'status':
                    const agent = this.conductor.getAgent(agentId);
                    result = agent ? { status: agent.status } : null;
                    break;
                default:
                    throw new Error(`Unknown agent command: ${command}`);
            }
            this.sendMessage(client, {
                type: 'event',
                data: {
                    type: 'agent.command.result',
                    agentId,
                    command,
                    result,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                id: message.id
            });
        }
        catch (error) {
            this.logger.error('Agent command failed:', error);
            this.sendError(client, `Agent command failed: ${error.message}`, message.id);
        }
    }
    /**
     * Handle workflow command
     */
    async handleWorkflowCommand(client, message) {
        if (!client.isAuthenticated) {
            this.sendError(client, 'Authentication required for workflow commands', message.id);
            return;
        }
        const { workflowId, command, params } = message.data;
        try {
            let result;
            switch (command) {
                case 'execute':
                    result = await this.conductor.executeWorkflow(workflowId, params.input);
                    break;
                case 'pause':
                    // TODO: Implement workflow pausing
                    result = { message: 'Workflow pause command received' };
                    break;
                case 'resume':
                    // TODO: Implement workflow resuming
                    result = { message: 'Workflow resume command received' };
                    break;
                case 'cancel':
                    // TODO: Implement workflow cancellation
                    result = { message: 'Workflow cancel command received' };
                    break;
                default:
                    throw new Error(`Unknown workflow command: ${command}`);
            }
            this.sendMessage(client, {
                type: 'event',
                data: {
                    type: 'workflow.command.result',
                    workflowId,
                    command,
                    result,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                id: message.id
            });
        }
        catch (error) {
            this.logger.error('Workflow command failed:', error);
            this.sendError(client, `Workflow command failed: ${error.message}`, message.id);
        }
    }
    /**
     * Authenticate WebSocket client
     */
    async authenticateClient(client, token) {
        if (!token) {
            throw new Error('Authentication token required');
        }
        try {
            // For now, use JWT verification - in production this should be configurable
            const decoded = (0, auth_1.verifyJWT)(token, {
                secret: 'your-jwt-secret', // TODO: Get from config
                issuer: 'openconductor',
                audience: 'openconductor-api',
                algorithm: 'HS256'
            });
            client.userId = decoded.sub;
            client.isAuthenticated = true;
            this.logger.info('WebSocket client authenticated', {
                clientId: client.id,
                userId: client.userId
            });
        }
        catch (error) {
            this.logger.warn('WebSocket authentication failed:', error);
            throw new Error('Invalid authentication token');
        }
    }
    /**
     * Handle client disconnection
     */
    handleDisconnection(client, code, reason) {
        this.logger.info('WebSocket client disconnected', {
            clientId: client.id,
            code,
            reason: reason.toString(),
            duration: Date.now() - client.metadata.connectedAt.getTime()
        });
        // Clean up subscriptions
        for (const subscriptionId of client.subscriptions) {
            this.subscriptions.delete(subscriptionId);
        }
        // Remove client
        this.clients.delete(client.id);
    }
    /**
     * Handle WebSocket error
     */
    handleError(client, error) {
        this.logger.error('WebSocket error:', error);
        const managedError = this.errorManager.createError('WEBSOCKET_ERROR', error.message, 'websocket', 'medium', { clientId: client.id, userId: client.userId }, error);
        this.errorManager.handleError(managedError);
    }
    /**
     * Send message to client
     */
    sendMessage(client, message) {
        if (client.socket.readyState === ws_1.WebSocket.OPEN) {
            try {
                client.socket.send(JSON.stringify(message));
                client.metadata.messagesSent++;
            }
            catch (error) {
                this.logger.error('Failed to send WebSocket message:', error);
            }
        }
    }
    /**
     * Send error message to client
     */
    sendError(client, message, requestId, error) {
        this.sendMessage(client, {
            type: 'error',
            data: {
                message,
                error: error?.message
            },
            timestamp: new Date().toISOString(),
            id: requestId
        });
    }
    /**
     * Broadcast message to all subscribed clients
     */
    broadcastToSubscribers(subscriptionType, data) {
        for (const [subscriptionId, subscription] of this.subscriptions) {
            if (subscription.type === subscriptionType) {
                const client = this.clients.get(subscription.clientId);
                if (client && client.socket.readyState === ws_1.WebSocket.OPEN) {
                    // Apply filter if specified
                    if (!subscription.filter || this.matchesFilter(data, subscription.filter)) {
                        this.sendMessage(client, {
                            type: 'event',
                            data,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }
    }
    /**
     * Check if data matches subscription filter
     */
    matchesFilter(data, filter) {
        // TODO: Implement sophisticated filtering logic
        return true; // For now, no filtering
    }
    /**
     * Subscribe to conductor events for broadcasting
     */
    subscribeToEvents() {
        this.conductor.events.subscribeToAll((event) => {
            this.broadcastToSubscribers('events', event);
        });
    }
    /**
     * Ping all clients
     */
    pingClients() {
        for (const [clientId, client] of this.clients) {
            if (client.socket.readyState === ws_1.WebSocket.OPEN) {
                client.socket.ping();
            }
        }
    }
    /**
     * Clean up dead connections
     */
    cleanupDeadConnections() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutes
        for (const [clientId, client] of this.clients) {
            if (now - client.metadata.lastActivity.getTime() > timeout) {
                this.logger.info('Cleaning up inactive WebSocket client', { clientId });
                client.socket.terminate();
                this.clients.delete(clientId);
                // Clean up subscriptions
                for (const subscriptionId of client.subscriptions) {
                    this.subscriptions.delete(subscriptionId);
                }
            }
        }
    }
    /**
     * Shutdown WebSocket handler
     */
    async shutdown() {
        this.logger.info('Shutting down WebSocket handler...');
        // Clear intervals
        if (this.pingInterval)
            clearInterval(this.pingInterval);
        if (this.cleanupInterval)
            clearInterval(this.cleanupInterval);
        // Close all client connections
        for (const [clientId, client] of this.clients) {
            client.socket.terminate();
        }
        this.clients.clear();
        this.subscriptions.clear();
        this.logger.info('WebSocket handler shutdown complete');
    }
    /**
     * Get connection statistics
     */
    getStats() {
        return {
            totalConnections: this.clients.size,
            authenticatedConnections: Array.from(this.clients.values()).filter(c => c.isAuthenticated).length,
            totalSubscriptions: this.subscriptions.size,
            subscriptionsByType: this.getSubscriptionsByType(),
            messagesSent: Array.from(this.clients.values()).reduce((sum, c) => sum + c.metadata.messagesSent, 0),
            messagesReceived: Array.from(this.clients.values()).reduce((sum, c) => sum + c.metadata.messagesReceived, 0)
        };
    }
    /**
     * Get subscriptions grouped by type
     */
    getSubscriptionsByType() {
        const result = {};
        for (const subscription of this.subscriptions.values()) {
            result[subscription.type] = (result[subscription.type] || 0) + 1;
        }
        return result;
    }
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    /**
     * Generate unique subscription ID
     */
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    /**
     * Extract client IP from request
     */
    extractClientIP(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            request.headers['x-real-ip'] ||
            request.socket.remoteAddress ||
            'unknown');
    }
}
exports.WebSocketHandler = WebSocketHandler;
//# sourceMappingURL=handler.js.map