/**
 * OpenConductor WebSocket Service
 * Handles real-time communication with Trinity AI agents and workflow execution
 */

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
  callback: (data: any) => void;
}

export interface TrinityAgentUpdate {
  agentType: 'oracle' | 'sentinel' | 'sage';
  confidence: number;
  status: string;
  lastUpdate: Date;
  metrics: {
    requestsProcessed: number;
    successRate: number;
    avgResponseTime: number;
  };
  recommendations?: any[];
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptions = new Map<string, WebSocketSubscription>();
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private url: string;

  constructor() {
    this.url = import.meta.env.VITE_WEBSOCKET_URL || 'wss://api.openconductor.ai/ws';
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        const wsUrl = token ? `${this.url}?token=${token}` : this.url;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocket disconnected: ${event.code} ${event.reason}`);
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (event.code !== 1000) { // Not a normal closure
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.subscriptions.clear();
    this.messageQueue = [];
  }

  /**
   * Send message to server
   */
  private send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(
    type: WebSocketSubscription['type'],
    callback: (data: any) => void,
    filter?: any
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      type,
      filter,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message
    this.send({
      type: 'subscribe',
      id: subscriptionId,
      data: { type, filter },
      timestamp: new Date().toISOString()
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.delete(subscriptionId);
      
      this.send({
        type: 'unsubscribe',
        data: { subscriptionId },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send agent command
   */
  sendAgentCommand(agentId: string, command: string, params?: any): void {
    this.send({
      type: 'agent-command',
      data: { agentId, command, params },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send workflow command
   */
  sendWorkflowCommand(workflowId: string, command: string, params?: any): void {
    this.send({
      type: 'workflow-command',
      data: { workflowId, command, params },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'event':
          this.handleEvent(message.data);
          break;
          
        case 'pong':
          // Heartbeat response - connection is alive
          break;
          
        case 'error':
          console.error('WebSocket server error:', message.data);
          break;
          
        default:
          console.log('Received message:', message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle event messages
   */
  private handleEvent(eventData: any): void {
    // Route events to appropriate subscribers
    this.subscriptions.forEach((subscription) => {
      if (this.matchesSubscription(eventData, subscription)) {
        try {
          subscription.callback(eventData);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });
  }

  /**
   * Check if event matches subscription
   */
  private matchesSubscription(eventData: any, subscription: WebSocketSubscription): boolean {
    // Basic type matching
    if (subscription.type === 'events') {
      return true; // Subscribe to all events
    }

    if (subscription.type === 'agent-status' && eventData.type?.startsWith('agent.')) {
      return true;
    }

    if (subscription.type === 'workflow-progress' && eventData.type?.startsWith('workflow.')) {
      return true;
    }

    if (subscription.type === 'system-metrics' && eventData.type?.startsWith('system.')) {
      return true;
    }

    // TODO: Implement more sophisticated filtering based on subscription.filter
    return false;
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      
      console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  /**
   * Specific methods for Trinity AI integration
   */

  subscribeToTrinityAgents(callback: (update: TrinityAgentUpdate) => void): string {
    return this.subscribe('agent-status', callback, { agents: ['oracle', 'sentinel', 'sage'] });
  }

  subscribeToWorkflowProgress(workflowId: string, callback: (progress: any) => void): string {
    return this.subscribe('workflow-progress', callback, { workflowId });
  }

  subscribeToSystemMetrics(callback: (metrics: any) => void): string {
    return this.subscribe('system-metrics', callback);
  }

  // Trinity AI Agent Commands
  executeOracleAnalysis(params: any): void {
    this.sendAgentCommand('oracle', 'analyze', params);
  }

  startSentinelMonitoring(params: any): void {
    this.sendAgentCommand('sentinel', 'monitor', params);
  }

  requestSageRecommendations(params: any): void {
    this.sendAgentCommand('sage', 'recommend', params);
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;