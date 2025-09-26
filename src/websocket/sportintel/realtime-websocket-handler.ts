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

export class RealTimeWebSocketHandler {
  private eventBus: EventBus;
  private logger: Logger;
  private config: WebSocketHandlerConfig;
  private realTimeProcessor: RealTimeProcessor;
  
  private wsServer?: WebSocket.Server;
  private clients = new Map<string, ClientConnection>();
  private streamBuffers = new Map<string, StreamMessage[]>();
  private sequenceCounters = new Map<string, number>();

  // Performance tracking
  private messagesSent = 0;
  private bytesTransmitted = 0;
  private averageLatency = 0;

  constructor(
    config: WebSocketHandlerConfig,
    eventBus: EventBus,
    logger: Logger,
    realTimeProcessor: RealTimeProcessor
  ) {
    this.config = config;
    this.eventBus = eventBus;
    this.logger = logger;
    this.realTimeProcessor = realTimeProcessor;
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Real-time WebSocket handler disabled');
      return;
    }

    this.logger.info('Starting SportIntel real-time WebSocket server...');

    try {
      // Create WebSocket server
      this.wsServer = new WebSocket.Server({
        port: this.config.server.port,
        host: this.config.server.host,
        maxPayload: this.config.performance.maxMessageSize
      });

      // Set up WebSocket event handlers
      this.setupWebSocketHandlers();

      // Subscribe to real-time events from EventBus
      await this.setupEventSubscriptions();

      // Start maintenance tasks
      this.startMaintenanceTasks();

      // Emit startup event
      await this.eventBus.emit({
        type: 'websocket.server.started',
        timestamp: new Date(),
        data: {
          port: this.config.server.port,
          maxConnections: this.config.server.maxConnections,
          streamsEnabled: this.config.dataStreams.enabled
        }
      });

      this.logger.info('SportIntel real-time WebSocket server started successfully', {
        port: this.config.server.port,
        maxConnections: this.config.server.maxConnections
      });

    } catch (error) {
      this.logger.error('Failed to start WebSocket server', error);
      throw error;
    }
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping SportIntel real-time WebSocket server...');

    // Close all client connections
    for (const client of this.clients.values()) {
      this.closeConnection(client, 1001, 'Server shutting down');
    }

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }

    // Clear buffers
    this.streamBuffers.clear();
    this.clients.clear();

    this.logger.info('SportIntel real-time WebSocket server stopped');
  }

  /**
   * Set up WebSocket server event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;

    this.wsServer.on('connection', (socket: WebSocket, request) => {
      this.handleNewConnection(socket, request);
    });

    this.wsServer.on('error', (error) => {
      this.logger.error('WebSocket server error', error);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleNewConnection(socket: WebSocket, request: any): Promise<void> {
    // Check connection limits
    if (this.clients.size >= this.config.server.maxConnections) {
      socket.close(1013, 'Server overloaded');
      this.logger.warn('Connection rejected: server at capacity');
      return;
    }

    const clientId = this.generateClientId();
    
    const client: ClientConnection = {
      id: clientId,
      socket,
      subscriptionTier: 'basic', // Default tier
      subscriptions: new Set(),
      lastHeartbeat: new Date(),
      messageCount: 0,
      rateLimitReset: new Date(Date.now() + 60000),
      metadata: {
        connectedAt: new Date(),
        userAgent: request.headers['user-agent'],
        ip: request.socket.remoteAddress
      }
    };

    this.clients.set(clientId, client);

    // Set up client event handlers
    this.setupClientHandlers(client);

    // Send welcome message
    await this.sendMessage(client, {
      type: 'system',
      stream: 'connection',
      timestamp: new Date(),
      data: {
        clientId,
        status: 'connected',
        availableStreams: this.config.dataStreams.enabled,
        subscriptionTier: client.subscriptionTier
      },
      sequence: 0,
      priority: 'medium'
    });

    this.logger.info('New WebSocket client connected', {
      clientId,
      totalClients: this.clients.size,
      ip: client.metadata.ip
    });

    // Emit client connected event
    await this.eventBus.emit({
      type: 'websocket.client.connected',
      timestamp: new Date(),
      data: { clientId, totalClients: this.clients.size }
    });
  }

  /**
   * Set up client-specific event handlers
   */
  private setupClientHandlers(client: ClientConnection): void {
    client.socket.on('message', async (data) => {
      await this.handleClientMessage(client, data);
    });

    client.socket.on('close', (code, reason) => {
      this.handleClientDisconnect(client, code, reason);
    });

    client.socket.on('error', (error) => {
      this.logger.error('Client socket error', { clientId: client.id, error });
    });

    client.socket.on('pong', () => {
      client.lastHeartbeat = new Date();
    });
  }

  /**
   * Handle incoming client messages
   */
  private async handleClientMessage(client: ClientConnection, data: WebSocket.RawData): Promise<void> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(client)) {
        await this.sendMessage(client, {
          type: 'system',
          stream: 'error',
          timestamp: new Date(),
          data: { error: 'Rate limit exceeded' },
          sequence: this.getNextSequence('error'),
          priority: 'medium'
        });
        return;
      }

      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          await this.handleSubscribe(client, message);
          break;
        case 'unsubscribe':
          await this.handleUnsubscribe(client, message);
          break;
        case 'authenticate':
          await this.handleAuthenticate(client, message);
          break;
        case 'heartbeat':
          await this.handleHeartbeat(client);
          break;
        case 'query':
          await this.handleQuery(client, message);
          break;
        default:
          this.logger.warn('Unknown message type', { clientId: client.id, type: message.type });
      }

    } catch (error) {
      this.logger.error('Error handling client message', { clientId: client.id, error });
      await this.sendMessage(client, {
        type: 'system',
        stream: 'error',
        timestamp: new Date(),
        data: { error: 'Invalid message format' },
        sequence: this.getNextSequence('error'),
        priority: 'medium'
      });
    }
  }

  /**
   * Handle subscription requests
   */
  private async handleSubscribe(client: ClientConnection, message: any): Promise<void> {
    const { streams, options = {} } = message;
    
    for (const stream of streams) {
      // Check if stream is available for client's tier
      if (!this.isStreamAvailableForTier(stream, client.subscriptionTier)) {
        await this.sendMessage(client, {
          type: 'system',
          stream: 'subscription',
          timestamp: new Date(),
          data: { 
            stream, 
            status: 'denied', 
            reason: 'Subscription tier insufficient' 
          },
          sequence: this.getNextSequence('subscription'),
          priority: 'medium'
        });
        continue;
      }

      client.subscriptions.add(stream);
      
      await this.sendMessage(client, {
        type: 'system',
        stream: 'subscription',
        timestamp: new Date(),
        data: { 
          stream, 
          status: 'subscribed',
          updateRate: this.config.dataStreams.updateRates[stream] || 1000
        },
        sequence: this.getNextSequence('subscription'),
        priority: 'medium'
      });

      // Send initial data if available
      await this.sendInitialStreamData(client, stream);
    }

    this.logger.debug('Client subscriptions updated', {
      clientId: client.id,
      subscriptions: Array.from(client.subscriptions)
    });
  }

  /**
   * Handle unsubscribe requests
   */
  private async handleUnsubscribe(client: ClientConnection, message: any): Promise<void> {
    const { streams } = message;
    
    for (const stream of streams) {
      client.subscriptions.delete(stream);
      
      await this.sendMessage(client, {
        type: 'system',
        stream: 'subscription',
        timestamp: new Date(),
        data: { stream, status: 'unsubscribed' },
        sequence: this.getNextSequence('subscription'),
        priority: 'medium'
      });
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuthenticate(client: ClientConnection, message: any): Promise<void> {
    if (!this.config.authentication.required) {
      return;
    }

    const { token } = message;
    
    try {
      // Validate JWT token (simplified)
      const payload = this.validateJWT(token);
      client.userId = payload.userId;
      client.subscriptionTier = payload.tier || 'basic';

      await this.sendMessage(client, {
        type: 'system',
        stream: 'auth',
        timestamp: new Date(),
        data: { 
          status: 'authenticated', 
          userId: client.userId,
          tier: client.subscriptionTier
        },
        sequence: this.getNextSequence('auth'),
        priority: 'high'
      });

    } catch (error) {
      await this.sendMessage(client, {
        type: 'system',
        stream: 'auth',
        timestamp: new Date(),
        data: { status: 'failed', error: 'Invalid token' },
        sequence: this.getNextSequence('auth'),
        priority: 'high'
      });
    }
  }

  /**
   * Set up EventBus subscriptions for real-time streams
   */
  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to processed game events
    await this.eventBus.subscribe([
      'game.play.processed',
      'prediction.updated',
      'alert.generated',
      'market.updated',
      'injury.reported',
      'lineup.changed'
    ], async (event) => {
      await this.broadcastEventToSubscribers(event);
    });

    // Subscribe to system events
    await this.eventBus.subscribe([
      'realtime.processor.metrics',
      'system.alert'
    ], async (event) => {
      await this.broadcastSystemEvent(event);
    });

    this.logger.info('EventBus subscriptions configured for WebSocket streaming');
  }

  /**
   * Broadcast event to relevant subscribers
   */
  private async broadcastEventToSubscribers(event: any): Promise<void> {
    const streamType = this.mapEventToStream(event.type);
    if (!streamType) return;

    const message: StreamMessage = {
      type: this.getMessageType(event.type),
      stream: streamType,
      timestamp: new Date(),
      data: event.data,
      sequence: this.getNextSequence(streamType),
      priority: this.getEventPriority(event.type)
    };

    // Get subscribers for this stream
    const subscribers = Array.from(this.clients.values())
      .filter(client => client.subscriptions.has(streamType));

    if (subscribers.length === 0) return;

    // Broadcast to all subscribers
    const broadcastPromises = subscribers.map(client => 
      this.sendMessage(client, message)
    );

    await Promise.allSettled(broadcastPromises);
    
    this.logger.debug('Event broadcasted to subscribers', {
      stream: streamType,
      subscribers: subscribers.length,
      eventType: event.type
    });
  }

  /**
   * Send message to specific client
   */
  private async sendMessage(client: ClientConnection, message: StreamMessage): Promise<void> {
    if (client.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const payload = JSON.stringify(message);
      
      if (this.config.dataStreams.compressionEnabled && payload.length > 1024) {
        // In production, would compress large messages
      }

      const startTime = Date.now();
      client.socket.send(payload);
      
      // Update metrics
      this.messagesSent++;
      this.bytesTransmitted += payload.length;
      client.messageCount++;
      
      const latency = Date.now() - startTime;
      this.averageLatency = this.averageLatency * 0.9 + latency * 0.1;

    } catch (error) {
      this.logger.error('Failed to send message to client', {
        clientId: client.id,
        error
      });
      
      // Remove failed client
      this.closeConnection(client, 1006, 'Send failed');
    }
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    // Heartbeat monitoring
    setInterval(() => {
      this.performHeartbeatCheck();
    }, this.config.server.heartbeatIntervalMs);

    // Performance metrics
    setInterval(() => {
      this.emitPerformanceMetrics();
    }, 5000);

    // Buffer cleanup
    setInterval(() => {
      this.cleanupBuffers();
    }, 30000);
  }

  /**
   * Perform heartbeat check on all clients
   */
  private performHeartbeatCheck(): void {
    const now = Date.now();
    const timeoutMs = this.config.server.heartbeatIntervalMs * 2;
    
    for (const [clientId, client] of this.clients) {
      const lastHeartbeat = client.lastHeartbeat.getTime();
      
      if (now - lastHeartbeat > timeoutMs) {
        this.logger.debug('Client heartbeat timeout', { clientId });
        this.closeConnection(client, 1000, 'Heartbeat timeout');
      } else {
        // Send ping
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping();
        }
      }
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(client: ClientConnection, code: number, reason: Buffer): void {
    this.clients.delete(client.id);
    
    this.logger.info('Client disconnected', {
      clientId: client.id,
      code,
      reason: reason.toString(),
      totalClients: this.clients.size,
      messagesSent: client.messageCount
    });

    // Emit disconnect event
    this.eventBus.emit({
      type: 'websocket.client.disconnected',
      timestamp: new Date(),
      data: { 
        clientId: client.id, 
        totalClients: this.clients.size,
        sessionDuration: Date.now() - client.metadata.connectedAt.getTime()
      }
    });
  }

  // Helper methods
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkRateLimit(client: ClientConnection): boolean {
    const now = Date.now();
    
    if (now > client.rateLimitReset.getTime()) {
      client.messageCount = 0;
      client.rateLimitReset = new Date(now + 60000); // Reset every minute
    }
    
    return client.messageCount < this.config.performance.rateLimitPerSecond * 60;
  }

  private isStreamAvailableForTier(stream: string, tier: string): boolean {
    const tierStreams = this.config.authentication.subscriptionTiers[tier] || [];
    return tierStreams.includes(stream) || tierStreams.includes('*');
  }

  private mapEventToStream(eventType: string): string | null {
    const mapping: Record<string, string> = {
      'game.play.processed': 'live_games',
      'prediction.updated': 'predictions',
      'alert.generated': 'alerts',
      'market.updated': 'market_data',
      'injury.reported': 'injuries',
      'lineup.changed': 'lineups'
    };
    
    return mapping[eventType] || null;
  }

  private getMessageType(eventType: string): StreamMessage['type'] {
    if (eventType.includes('alert')) return 'alert';
    if (eventType.includes('prediction')) return 'prediction';
    if (eventType.includes('market')) return 'market';
    return 'data';
  }

  private getEventPriority(eventType: string): StreamMessage['priority'] {
    if (eventType.includes('critical') || eventType === 'game.play.processed') return 'critical';
    if (eventType.includes('alert') || eventType.includes('injury')) return 'high';
    if (eventType.includes('prediction') || eventType.includes('market')) return 'medium';
    return 'low';
  }

  private getNextSequence(stream: string): number {
    const current = this.sequenceCounters.get(stream) || 0;
    const next = current + 1;
    this.sequenceCounters.set(stream, next);
    return next;
  }

  private validateJWT(token: string): any {
    // Simplified JWT validation - in production would use proper library
    try {
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Validate expiration
      if (payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private async sendInitialStreamData(client: ClientConnection, stream: string): Promise<void> {
    // Send initial data based on stream type
    const initialData = await this.getInitialStreamData(stream);
    
    if (initialData) {
      await this.sendMessage(client, {
        type: 'data',
        stream,
        timestamp: new Date(),
        data: initialData,
        sequence: this.getNextSequence(stream),
        priority: 'medium'
      });
    }
  }

  private async getInitialStreamData(stream: string): Promise<any> {
    // Get initial data for stream (placeholder implementation)
    switch (stream) {
      case 'live_games':
        return { games: [], message: 'Live games will appear here' };
      case 'predictions':
        return { predictions: [], message: 'Player predictions will appear here' };
      case 'alerts':
        return { alerts: [], message: 'Real-time alerts will appear here' };
      default:
        return null;
    }
  }

  private async broadcastSystemEvent(event: any): Promise<void> {
    const message: StreamMessage = {
      type: 'system',
      stream: 'system',
      timestamp: new Date(),
      data: event.data,
      sequence: this.getNextSequence('system'),
      priority: 'low'
    };

    // Broadcast to all connected clients
    const promises = Array.from(this.clients.values()).map(client =>
      this.sendMessage(client, message)
    );

    await Promise.allSettled(promises);
  }

  private async emitPerformanceMetrics(): Promise<void> {
    const metrics = {
      connectedClients: this.clients.size,
      messagesSent: this.messagesSent,
      bytesTransmitted: this.bytesTransmitted,
      averageLatency: this.averageLatency,
      activeStreams: this.streamBuffers.size
    };

    await this.eventBus.emit({
      type: 'websocket.metrics',
      timestamp: new Date(),
      data: metrics
    });
  }

  private cleanupBuffers(): void {
    // Clean up old buffer data
    for (const [stream, buffer] of this.streamBuffers) {
      if (buffer.length > 100) {
        buffer.splice(0, buffer.length - 100);
      }
    }
  }

  private closeConnection(client: ClientConnection, code: number, reason: string): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.close(code, reason);
    }
    this.clients.delete(client.id);
  }

  private async handleHeartbeat(client: ClientConnection): Promise<void> {
    client.lastHeartbeat = new Date();
    
    await this.sendMessage(client, {
      type: 'system',
      stream: 'heartbeat',
      timestamp: new Date(),
      data: { status: 'alive' },
      sequence: this.getNextSequence('heartbeat'),
      priority: 'low'
    });
  }

  private async handleQuery(client: ClientConnection, message: any): Promise<void> {
    // Handle one-off queries for historical data
    const { query, params } = message;
    
    // Simplified query handling
    const response = {
      queryId: message.queryId,
      result: `Query "${query}" executed with params: ${JSON.stringify(params)}`,
      timestamp: new Date()
    };

    await this.sendMessage(client, {
      type: 'data',
      stream: 'query_result',
      timestamp: new Date(),
      data: response,
      sequence: this.getNextSequence('query_result'),
      priority: 'medium'
    });
  }

  // Public API
  getConnectedClients(): number {
    return this.clients.size;
  }

  getServerMetrics(): any {
    return {
      connectedClients: this.clients.size,
      messagesSent: this.messagesSent,
      bytesTransmitted: this.bytesTransmitted,
      averageLatency: this.averageLatency,
      uptime: Date.now()
    };
  }
}

// Factory function and default configuration
export function createRealTimeWebSocketHandler(
  config: WebSocketHandlerConfig,
  eventBus: EventBus,
  logger: Logger,
  realTimeProcessor: RealTimeProcessor
): RealTimeWebSocketHandler {
  return new RealTimeWebSocketHandler(config, eventBus, logger, realTimeProcessor);
}

export const defaultWebSocketConfig: WebSocketHandlerConfig = {
  enabled: true,
  server: {
    port: 8080,
    host: '0.0.0.0',
    maxConnections: 1000,
    heartbeatIntervalMs: 30000
  },
  dataStreams: {
    enabled: ['live_games', 'predictions', 'alerts', 'market_data', 'injuries', 'lineups'],
    updateRates: {
      live_games: 1000,    // 1 second
      predictions: 5000,   // 5 seconds
      alerts: 500,         // 500ms
      market_data: 2000,   // 2 seconds
      injuries: 10000,     // 10 seconds
      lineups: 15000       // 15 seconds
    },
    compressionEnabled: true
  },
  authentication: {
    required: true,
    subscriptionTiers: {
      basic: ['live_games', 'alerts'],
      pro: ['live_games', 'predictions', 'alerts', 'injuries'],
      premium: ['*'] // All streams
    }
  },
  performance: {
    maxMessageSize: 1048576, // 1MB
    rateLimitPerSecond: 100,
    bufferSize: 1000
  }
};