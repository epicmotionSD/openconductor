/**
 * OpenConductor MCP Real-time Execution Monitor
 * 
 * WebSocket-based real-time monitoring for MCP workflow executions.
 * Provides live updates on execution status, progress, and performance metrics.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export interface ExecutionUpdate {
  execution_id: string;
  workflow_id: string;
  user_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  current_step: number;
  total_steps: number;
  progress_percentage: number;
  step_updates: StepUpdate[];
  performance_metrics: {
    execution_time_ms: number;
    memory_usage: number;
    cpu_usage: number;
    tokens_consumed: number;
    api_calls_made: number;
  };
  logs: LogEntry[];
  error_details?: {
    step_id: string;
    error_message: string;
    error_code: string;
    timestamp: Date;
  };
  timestamp: Date;
}

export interface StepUpdate {
  step_id: string;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  start_time?: Date;
  end_time?: Date;
  duration_ms?: number;
  output_preview?: any;
  server_used?: string;
  tool_used?: string;
}

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  step_id?: string;
  server_id?: string;
  metadata?: any;
  timestamp: Date;
}

export interface MonitoringSubscription {
  id: string;
  user_id: string;
  execution_id?: string; // Specific execution
  workflow_id?: string;  // All executions for workflow
  filters: {
    status?: string[];
    servers?: string[];
    min_duration?: number;
  };
  created_at: Date;
}

export interface ClientConnection {
  id: string;
  user_id: string;
  socket: WebSocket;
  subscriptions: MonitoringSubscription[];
  last_ping: Date;
  connected_at: Date;
}

/**
 * Real-time Execution Monitor
 */
export class MCPRealtimeMonitor {
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private wsServer: WebSocketServer;
  
  // Client management
  private clients = new Map<string, ClientConnection>();
  private subscriptions = new Map<string, MonitoringSubscription[]>();
  
  // Performance monitoring
  private metricsCache = new Map<string, any>();
  private lastMetricsUpdate = new Date(0);

  constructor(
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus,
    port: number = 8080
  ) {
    this.pool = pool;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    
    // Initialize WebSocket server
    this.wsServer = new WebSocketServer({ port });
    this.setupWebSocketHandlers();
    this.setupEventListeners();
    
    // Start periodic cleanup and metrics updates
    this.startPeriodicTasks();
    
    this.logger.info('MCP Real-time Monitor initialized', { port });
  }

  /**
   * Broadcast execution update to interested clients
   */
  async broadcastExecutionUpdate(update: ExecutionUpdate): Promise<void> {
    this.logger.debug('Broadcasting execution update', {
      executionId: update.execution_id,
      status: update.status,
      clientCount: this.clients.size
    });

    try {
      const message = JSON.stringify({
        type: 'execution_update',
        data: update,
        timestamp: new Date().toISOString()
      });

      // Find clients interested in this execution
      const interestedClients = this.findInterestedClients(update);
      
      // Broadcast to interested clients
      for (const client of interestedClients) {
        if (client.socket.readyState === WebSocket.OPEN) {
          try {
            client.socket.send(message);
          } catch (error) {
            this.logger.warn('Failed to send message to client', {
              clientId: client.id,
              error: error.message
            });
            // Remove failed client
            this.removeClient(client.id);
          }
        }
      }

      // Store in cache for reconnection recovery
      await this.cacheExecutionUpdate(update);

      this.logger.debug('Execution update broadcasted', {
        executionId: update.execution_id,
        clientsNotified: interestedClients.length
      });
    } catch (error) {
      this.logger.error('Failed to broadcast execution update:', error);
    }
  }

  /**
   * Broadcast system-wide metrics update
   */
  async broadcastSystemMetrics(): Promise<void> {
    try {
      const metrics = await this.getSystemMetrics();
      
      const message = JSON.stringify({
        type: 'system_metrics',
        data: metrics,
        timestamp: new Date().toISOString()
      });

      // Broadcast to all connected clients
      for (const [clientId, client] of this.clients) {
        if (client.socket.readyState === WebSocket.OPEN) {
          try {
            client.socket.send(message);
          } catch (error) {
            this.logger.warn('Failed to send metrics to client', { clientId });
            this.removeClient(clientId);
          }
        }
      }

      this.logger.debug('System metrics broadcasted', {
        clientCount: this.clients.size
      });
    } catch (error) {
      this.logger.error('Failed to broadcast system metrics:', error);
    }
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    this.wsServer.on('connection', (socket: WebSocket, request) => {
      const clientId = this.generateClientId();
      
      this.logger.debug('New WebSocket connection', { clientId });

      // Handle authentication message
      socket.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          switch (message.type) {
            case 'authenticate':
              await this.handleAuthentication(clientId, socket, message.data);
              break;
              
            case 'subscribe':
              await this.handleSubscription(clientId, message.data);
              break;
              
            case 'unsubscribe':
              await this.handleUnsubscription(clientId, message.data);
              break;
              
            case 'ping':
              this.handlePing(clientId);
              break;
              
            default:
              this.logger.warn('Unknown message type', { type: message.type, clientId });
          }
        } catch (error) {
          this.logger.error('Failed to process WebSocket message:', error);
          socket.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });

      // Handle connection close
      socket.on('close', () => {
        this.removeClient(clientId);
        this.logger.debug('WebSocket connection closed', { clientId });
      });

      // Handle errors
      socket.on('error', (error) => {
        this.logger.error('WebSocket error', { clientId, error: error.message });
        this.removeClient(clientId);
      });

      // Send welcome message
      socket.send(JSON.stringify({
        type: 'welcome',
        data: {
          client_id: clientId,
          server_time: new Date().toISOString(),
          supported_features: [
            'execution_monitoring',
            'system_metrics',
            'real_time_logs',
            'performance_alerts'
          ]
        }
      }));
    });
  }

  /**
   * Handle client authentication
   */
  private async handleAuthentication(
    clientId: string,
    socket: WebSocket,
    authData: any
  ): Promise<void> {
    try {
      // Validate authentication token (simplified)
      const userId = await this.validateAuthToken(authData.token);
      
      if (!userId) {
        socket.send(JSON.stringify({
          type: 'auth_error',
          data: { message: 'Invalid authentication token' }
        }));
        socket.close();
        return;
      }

      // Create client connection record
      const client: ClientConnection = {
        id: clientId,
        user_id: userId,
        socket,
        subscriptions: [],
        last_ping: new Date(),
        connected_at: new Date()
      };

      this.clients.set(clientId, client);

      // Send authentication success
      socket.send(JSON.stringify({
        type: 'authenticated',
        data: {
          client_id: clientId,
          user_id: userId,
          session_started: new Date().toISOString()
        }
      }));

      this.logger.info('Client authenticated successfully', { clientId, userId });
    } catch (error) {
      this.logger.error('Authentication failed', { clientId, error: error.message });
      socket.close();
    }
  }

  /**
   * Handle subscription to execution updates
   */
  private async handleSubscription(clientId: string, subscriptionData: any): Promise<void> {
    try {
      const client = this.clients.get(clientId);
      if (!client) {
        this.logger.warn('Subscription request from unknown client', { clientId });
        return;
      }

      const subscription: MonitoringSubscription = {
        id: this.generateSubscriptionId(),
        user_id: client.user_id,
        execution_id: subscriptionData.execution_id,
        workflow_id: subscriptionData.workflow_id,
        filters: subscriptionData.filters || {},
        created_at: new Date()
      };

      client.subscriptions.push(subscription);

      // Add to global subscriptions map
      const userSubscriptions = this.subscriptions.get(client.user_id) || [];
      userSubscriptions.push(subscription);
      this.subscriptions.set(client.user_id, userSubscriptions);

      // Send subscription confirmation
      client.socket.send(JSON.stringify({
        type: 'subscribed',
        data: {
          subscription_id: subscription.id,
          execution_id: subscription.execution_id,
          workflow_id: subscription.workflow_id
        }
      }));

      // Send any cached updates for this subscription
      await this.sendCachedUpdates(client, subscription);

      this.logger.debug('Client subscribed to updates', {
        clientId,
        subscriptionId: subscription.id,
        executionId: subscription.execution_id
      });
    } catch (error) {
      this.logger.error('Failed to handle subscription:', error);
    }
  }

  /**
   * Get real-time system metrics
   */
  private async getSystemMetrics(): Promise<any> {
    // Check cache first (update every 30 seconds)
    const now = new Date();
    if (now.getTime() - this.lastMetricsUpdate.getTime() < 30000 && this.metricsCache.has('system')) {
      return this.metricsCache.get('system');
    }

    try {
      const metricsQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'running' THEN 1 END) as active_executions,
          COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_executions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_today,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_today,
          AVG(execution_time_ms) as avg_execution_time,
          SUM(tokens_consumed) as total_tokens_today,
          SUM(api_calls_made) as total_api_calls_today
        FROM mcp_workflow_executions 
        WHERE started_at >= CURRENT_DATE
      `;

      const result = await this.pool.query(metricsQuery);
      const metrics = result.rows[0];

      // Get server health
      const serverHealthQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'active' THEN 1 END) as healthy_servers,
          COUNT(*) as total_servers,
          AVG(avg_response_time_ms) as avg_response_time
        FROM mcp_servers
      `;

      const serverHealthResult = await this.pool.query(serverHealthQuery);
      const serverHealth = serverHealthResult.rows[0];

      const systemMetrics = {
        executions: {
          active: parseInt(metrics.active_executions) || 0,
          queued: parseInt(metrics.queued_executions) || 0,
          completed_today: parseInt(metrics.completed_today) || 0,
          failed_today: parseInt(metrics.failed_today) || 0,
          avg_execution_time: parseInt(metrics.avg_execution_time) || 0
        },
        resources: {
          total_tokens_today: parseInt(metrics.total_tokens_today) || 0,
          total_api_calls_today: parseInt(metrics.total_api_calls_today) || 0
        },
        servers: {
          healthy_servers: parseInt(serverHealth.healthy_servers) || 0,
          total_servers: parseInt(serverHealth.total_servers) || 0,
          avg_response_time: parseInt(serverHealth.avg_response_time) || 0
        },
        timestamp: now
      };

      // Cache metrics
      this.metricsCache.set('system', systemMetrics);
      this.lastMetricsUpdate = now;

      return systemMetrics;
    } catch (error) {
      this.logger.error('Failed to get system metrics:', error);
      return null;
    }
  }

  /**
   * Setup event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Listen for workflow execution events
    this.eventBus.on('mcp.workflow.execution.started', async (event: any) => {
      await this.handleExecutionEvent('started', event.data);
    });

    this.eventBus.on('mcp.workflow.execution.step.completed', async (event: any) => {
      await this.handleExecutionEvent('step_completed', event.data);
    });

    this.eventBus.on('mcp.workflow.execution.completed', async (event: any) => {
      await this.handleExecutionEvent('completed', event.data);
    });

    this.eventBus.on('mcp.workflow.execution.failed', async (event: any) => {
      await this.handleExecutionEvent('failed', event.data);
    });

    // Listen for server health events
    this.eventBus.on('mcp.server.health.changed', async (event: any) => {
      await this.broadcastServerHealthUpdate(event.data);
    });

    // Listen for system alerts
    this.eventBus.on('mcp.system.alert', async (event: any) => {
      await this.broadcastSystemAlert(event.data);
    });
  }

  /**
   * Handle execution events and broadcast updates
   */
  private async handleExecutionEvent(eventType: string, eventData: any): Promise<void> {
    try {
      // Get full execution data
      const executionData = await this.getExecutionData(eventData.executionId);
      
      if (executionData) {
        await this.broadcastExecutionUpdate(executionData);
      }
    } catch (error) {
      this.logger.error('Failed to handle execution event:', error);
    }
  }

  /**
   * Get complete execution data for broadcasting
   */
  private async getExecutionData(executionId: string): Promise<ExecutionUpdate | null> {
    try {
      const query = `
        SELECT 
          e.*,
          w.name as workflow_name,
          w.definition as workflow_definition
        FROM mcp_workflow_executions e
        JOIN mcp_workflows w ON e.workflow_id = w.id
        WHERE e.id = $1
      `;

      const result = await this.pool.query(query, [executionId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const execution = result.rows[0];
      const workflowDefinition = execution.workflow_definition;
      
      // Calculate progress
      const totalSteps = execution.total_steps || 0;
      const currentStep = execution.current_step || 0;
      const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

      // Get step updates from execution log
      const stepUpdates = this.parseStepUpdatesFromLog(execution.execution_log || []);

      // Get recent logs
      const logs = this.parseLogsFromExecutionLog(execution.execution_log || []);

      return {
        execution_id: execution.id,
        workflow_id: execution.workflow_id,
        user_id: execution.user_id,
        status: execution.status,
        current_step: currentStep,
        total_steps: totalSteps,
        progress_percentage: progressPercentage,
        step_updates: stepUpdates,
        performance_metrics: {
          execution_time_ms: execution.execution_time_ms || 0,
          memory_usage: 0, // TODO: Implement memory tracking
          cpu_usage: 0,    // TODO: Implement CPU tracking
          tokens_consumed: execution.tokens_consumed || 0,
          api_calls_made: execution.api_calls_made || 0
        },
        logs: logs.slice(-20), // Last 20 log entries
        error_details: execution.error_message ? {
          step_id: `step_${currentStep}`,
          error_message: execution.error_message,
          error_code: 'EXECUTION_ERROR',
          timestamp: new Date()
        } : undefined,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get execution data:', error);
      return null;
    }
  }

  /**
   * Find clients interested in specific execution updates
   */
  private findInterestedClients(update: ExecutionUpdate): ClientConnection[] {
    const interested: ClientConnection[] = [];

    for (const [clientId, client] of this.clients) {
      for (const subscription of client.subscriptions) {
        // Check if subscription matches this update
        if (this.subscriptionMatches(subscription, update)) {
          interested.push(client);
          break; // Don't add same client multiple times
        }
      }
    }

    return interested;
  }

  /**
   * Check if subscription matches execution update
   */
  private subscriptionMatches(subscription: MonitoringSubscription, update: ExecutionUpdate): boolean {
    // Specific execution subscription
    if (subscription.execution_id && subscription.execution_id === update.execution_id) {
      return true;
    }

    // Workflow-level subscription
    if (subscription.workflow_id && subscription.workflow_id === update.workflow_id) {
      // Check filters
      if (subscription.filters.status && !subscription.filters.status.includes(update.status)) {
        return false;
      }
      
      if (subscription.filters.min_duration && update.performance_metrics.execution_time_ms < subscription.filters.min_duration) {
        return false;
      }

      return true;
    }

    // User owns the execution
    if (subscription.user_id === update.user_id && !subscription.execution_id && !subscription.workflow_id) {
      return true;
    }

    return false;
  }

  /**
   * Cache execution update for reconnection recovery
   */
  private async cacheExecutionUpdate(update: ExecutionUpdate): Promise<void> {
    try {
      const cacheKey = `execution:${update.execution_id}:latest`;
      const cacheData = JSON.stringify(update);
      
      // Store in Redis or memory cache (simplified to memory for now)
      this.metricsCache.set(cacheKey, update);
      
      // Set expiration (1 hour)
      setTimeout(() => {
        this.metricsCache.delete(cacheKey);
      }, 3600000);
    } catch (error) {
      this.logger.error('Failed to cache execution update:', error);
    }
  }

  /**
   * Send cached updates to newly subscribed clients
   */
  private async sendCachedUpdates(
    client: ClientConnection,
    subscription: MonitoringSubscription
  ): Promise<void> {
    try {
      if (subscription.execution_id) {
        const cacheKey = `execution:${subscription.execution_id}:latest`;
        const cachedUpdate = this.metricsCache.get(cacheKey);
        
        if (cachedUpdate && client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(JSON.stringify({
            type: 'execution_update',
            data: cachedUpdate,
            cached: true,
            timestamp: new Date().toISOString()
          }));
        }
      }
    } catch (error) {
      this.logger.error('Failed to send cached updates:', error);
    }
  }

  /**
   * Start periodic maintenance tasks
   */
  private startPeriodicTasks(): void {
    // Cleanup disconnected clients every 5 minutes
    setInterval(() => {
      this.cleanupDisconnectedClients();
    }, 5 * 60 * 1000);

    // Broadcast system metrics every 30 seconds
    setInterval(() => {
      this.broadcastSystemMetrics();
    }, 30 * 1000);

    // Send ping to all clients every 30 seconds
    setInterval(() => {
      this.pingAllClients();
    }, 30 * 1000);
  }

  /**
   * Cleanup disconnected clients
   */
  private cleanupDisconnectedClients(): void {
    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState !== WebSocket.OPEN) {
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Remove client and cleanup subscriptions
   */
  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from subscriptions map
      const userSubscriptions = this.subscriptions.get(client.user_id) || [];
      const filteredSubscriptions = userSubscriptions.filter(sub => 
        !client.subscriptions.some(clientSub => clientSub.id === sub.id)
      );
      
      if (filteredSubscriptions.length > 0) {
        this.subscriptions.set(client.user_id, filteredSubscriptions);
      } else {
        this.subscriptions.delete(client.user_id);
      }

      this.clients.delete(clientId);
      
      this.logger.debug('Client removed', { clientId, userId: client.user_id });
    }
  }

  /**
   * Send ping to all clients
   */
  private pingAllClients(): void {
    const pingMessage = JSON.stringify({
      type: 'ping',
      timestamp: new Date().toISOString()
    });

    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(pingMessage);
        } catch (error) {
          this.removeClient(clientId);
        }
      }
    }
  }

  /**
   * Handle ping from client
   */
  private handlePing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.last_ping = new Date();
      
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  /**
   * Broadcast server health update
   */
  private async broadcastServerHealthUpdate(healthData: any): Promise<void> {
    const message = JSON.stringify({
      type: 'server_health_update',
      data: healthData,
      timestamp: new Date().toISOString()
    });

    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(message);
        } catch (error) {
          this.removeClient(clientId);
        }
      }
    }
  }

  /**
   * Broadcast system alert
   */
  private async broadcastSystemAlert(alertData: any): Promise<void> {
    const message = JSON.stringify({
      type: 'system_alert',
      data: alertData,
      timestamp: new Date().toISOString()
    });

    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(message);
        } catch (error) {
          this.removeClient(clientId);
        }
      }
    }
  }

  /**
   * Helper methods
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async validateAuthToken(token: string): Promise<string | null> {
    // Simplified token validation - integrate with your auth system
    try {
      // This would validate JWT or API key
      const query = 'SELECT user_id FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()';
      const result = await this.pool.query(query, [token]);
      
      return result.rows.length > 0 ? result.rows[0].user_id : null;
    } catch (error) {
      return null;
    }
  }

  private parseStepUpdatesFromLog(executionLog: any[]): StepUpdate[] {
    // Parse execution log to extract step updates
    return executionLog
      .filter(entry => entry.type === 'step_update')
      .map(entry => ({
        step_id: entry.step_id,
        step_name: entry.step_name || entry.step_id,
        status: entry.status,
        start_time: entry.start_time ? new Date(entry.start_time) : undefined,
        end_time: entry.end_time ? new Date(entry.end_time) : undefined,
        duration_ms: entry.duration_ms,
        output_preview: entry.output_preview,
        server_used: entry.server_used,
        tool_used: entry.tool_used
      }));
  }

  private parseLogsFromExecutionLog(executionLog: any[]): LogEntry[] {
    return executionLog
      .filter(entry => entry.type === 'log')
      .map(entry => ({
        id: entry.id || this.generateLogId(),
        level: entry.level || 'info',
        message: entry.message,
        step_id: entry.step_id,
        server_id: entry.server_id,
        metadata: entry.metadata,
        timestamp: new Date(entry.timestamp)
      }));
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    connected_clients: number;
    active_subscriptions: number;
    total_executions_monitored: number;
    uptime: number;
  } {
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.length, 0);

    return {
      connected_clients: this.clients.size,
      active_subscriptions: totalSubscriptions,
      total_executions_monitored: this.metricsCache.size,
      uptime: Date.now() - (this.wsServer as any).startTime || 0
    };
  }

  /**
   * Close monitor and cleanup
   */
  async close(): Promise<void> {
    this.logger.info('Closing real-time monitor');
    
    // Close all client connections
    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.close();
      }
    }

    // Close WebSocket server
    this.wsServer.close();
    
    this.logger.info('Real-time monitor closed');
  }
}

/**
 * Factory function to create real-time monitor
 */
export function createMCPRealtimeMonitor(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus,
  port?: number
): MCPRealtimeMonitor {
  return new MCPRealtimeMonitor(pool, logger, errorManager, eventBus, port);
}