/**
 * OpenConductor MCP Server Installation & Connection Manager
 * 
 * Manages MCP server installation, configuration, and connection lifecycle.
 * Provides automated installation, health monitoring, and connection pooling.
 */

import { spawn, ChildProcess } from 'child_process';
import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { MCPServer } from './server-registry';

export type InstallationMethod = 'npm' | 'docker' | 'binary' | 'manual';
export type InstallationStatus = 'pending' | 'installing' | 'installed' | 'failed' | 'uninstalled';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ServerInstallation {
  id: string;
  user_id: string;
  server_id: string;
  server_name: string;
  installation_method: InstallationMethod;
  status: InstallationStatus;
  configuration: any;
  environment_variables: Record<string, string>;
  installation_path?: string;
  process_id?: number;
  health_status: 'healthy' | 'degraded' | 'unhealthy';
  last_health_check: Date;
  installation_logs: string[];
  error_message?: string;
  installed_at?: Date;
  updated_at: Date;
  created_at: Date;
}

export interface MCPConnection {
  id: string;
  installation_id: string;
  server_id: string;
  user_id: string;
  transport_type: 'stdio' | 'http_sse' | 'websocket';
  connection_string: string;
  status: ConnectionStatus;
  process?: ChildProcess;
  last_ping?: Date;
  response_time_ms: number;
  error_count: number;
  success_count: number;
  tools_available: string[];
  connected_at?: Date;
  disconnected_at?: Date;
}

export interface InstallationRequest {
  server_id: string;
  installation_method: InstallationMethod;
  configuration?: any;
  environment_variables?: Record<string, string>;
  auto_start?: boolean;
}

export interface ConnectionPool {
  server_id: string;
  max_connections: number;
  active_connections: MCPConnection[];
  queue: Array<{
    user_id: string;
    callback: (connection: MCPConnection | null) => void;
    timeout: NodeJS.Timeout;
  }>;
}

/**
 * MCP Installation Manager
 */
export class MCPInstallationManager {
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  
  // Installation tracking
  private installations = new Map<string, ServerInstallation>();
  private connections = new Map<string, MCPConnection>();
  private connectionPools = new Map<string, ConnectionPool>();
  
  // Health monitoring
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.pool = pool;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    
    // Start health monitoring
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    this.logger.info('MCP Installation Manager initialized');
  }

  /**
   * Install MCP server for user
   */
  async installServer(
    userId: string, 
    request: InstallationRequest
  ): Promise<ServerInstallation> {
    this.logger.info('Installing MCP server', {
      userId,
      serverId: request.server_id,
      method: request.installation_method
    });

    try {
      // Get server details
      const serverQuery = 'SELECT * FROM mcp_servers WHERE id = $1 AND status = $2';
      const serverResult = await this.pool.query(serverQuery, [request.server_id, 'active']);
      
      if (serverResult.rows.length === 0) {
        throw new Error(`Server not found or inactive: ${request.server_id}`);
      }

      const server = serverResult.rows[0];

      // Check if already installed for this user
      const existingQuery = `
        SELECT id FROM server_installations 
        WHERE user_id = $1 AND server_id = $2 AND status IN ('installed', 'installing')
      `;
      const existingResult = await this.pool.query(existingQuery, [userId, request.server_id]);
      
      if (existingResult.rows.length > 0) {
        throw new Error('Server already installed or installation in progress');
      }

      // Create installation record
      const installation = await this.createInstallationRecord(userId, server, request);

      // Start installation process
      this.performInstallation(installation).catch(error => {
        this.logger.error('Installation failed:', error);
        this.updateInstallationStatus(installation.id, 'failed', error.message);
      });

      return installation;
    } catch (error) {
      this.logger.error('Failed to install server:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'server-installation',
        userId,
        serverId: request.server_id
      });
    }
  }

  /**
   * Get user's server installations
   */
  async getUserInstallations(userId: string): Promise<ServerInstallation[]> {
    try {
      const query = `
        SELECT si.*, s.name as server_name, s.display_name
        FROM server_installations si
        JOIN mcp_servers s ON si.server_id = s.id
        WHERE si.user_id = $1
        ORDER BY si.updated_at DESC
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows.map(row => this.mapInstallationFromDB(row));
    } catch (error) {
      this.logger.error('Failed to get user installations:', error);
      throw error;
    }
  }

  /**
   * Connect to installed MCP server
   */
  async connectToServer(
    userId: string,
    serverId: string,
    options?: {
      timeout?: number;
      max_retries?: number;
    }
  ): Promise<MCPConnection> {
    this.logger.debug('Connecting to MCP server', { userId, serverId });

    try {
      // Get installation
      const installation = await this.getInstallation(userId, serverId);
      if (!installation || installation.status !== 'installed') {
        throw new Error('Server not installed or installation failed');
      }

      // Check if connection already exists
      const existingConnection = Array.from(this.connections.values())
        .find(conn => conn.user_id === userId && conn.server_id === serverId);

      if (existingConnection && existingConnection.status === 'connected') {
        return existingConnection;
      }

      // Create new connection
      const connection = await this.createConnection(installation, options);
      
      // Store connection
      this.connections.set(connection.id, connection);

      // Add to connection pool
      this.addToConnectionPool(connection);

      // Emit connection event
      await this.eventBus.emit({
        type: 'mcp.server.connected',
        timestamp: new Date(),
        data: {
          connectionId: connection.id,
          serverId,
          userId,
          transportType: connection.transport_type
        }
      });

      this.logger.info('Connected to MCP server successfully', {
        connectionId: connection.id,
        serverId,
        userId
      });

      return connection;
    } catch (error) {
      this.logger.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnectFromServer(connectionId: string): Promise<void> {
    this.logger.debug('Disconnecting from MCP server', { connectionId });

    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      // Close process if stdio transport
      if (connection.process) {
        connection.process.kill('SIGTERM');
      }

      // Update connection status
      connection.status = 'disconnected';
      connection.disconnected_at = new Date();

      // Remove from connection pool
      this.removeFromConnectionPool(connection);

      // Remove from active connections
      this.connections.delete(connectionId);

      // Emit disconnection event
      await this.eventBus.emit({
        type: 'mcp.server.disconnected',
        timestamp: new Date(),
        data: {
          connectionId,
          serverId: connection.server_id,
          userId: connection.user_id
        }
      });

      this.logger.info('Disconnected from MCP server', {
        connectionId,
        serverId: connection.server_id
      });
    } catch (error) {
      this.logger.error('Failed to disconnect from MCP server:', error);
      throw error;
    }
  }

  /**
   * Get server connection health status
   */
  async getConnectionHealth(connectionId: string): Promise<{
    status: ConnectionStatus;
    response_time_ms: number;
    last_ping: Date;
    error_count: number;
    success_count: number;
    uptime: number;
    tools_available: number;
  }> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      // Perform ping test
      const pingResult = await this.pingConnection(connection);

      return {
        status: connection.status,
        response_time_ms: connection.response_time_ms,
        last_ping: connection.last_ping || new Date(),
        error_count: connection.error_count,
        success_count: connection.success_count,
        uptime: connection.connected_at ? Date.now() - connection.connected_at.getTime() : 0,
        tools_available: connection.tools_available.length
      };
    } catch (error) {
      this.logger.error('Failed to get connection health:', error);
      throw error;
    }
  }

  /**
   * Uninstall MCP server
   */
  async uninstallServer(userId: string, serverId: string): Promise<void> {
    this.logger.info('Uninstalling MCP server', { userId, serverId });

    try {
      const installation = await this.getInstallation(userId, serverId);
      if (!installation) {
        throw new Error('Server installation not found');
      }

      // Disconnect any active connections
      const activeConnections = Array.from(this.connections.values())
        .filter(conn => conn.user_id === userId && conn.server_id === serverId);

      for (const connection of activeConnections) {
        await this.disconnectFromServer(connection.id);
      }

      // Perform uninstallation based on method
      await this.performUninstallation(installation);

      // Update installation status
      await this.updateInstallationStatus(installation.id, 'uninstalled');

      // Emit uninstallation event
      await this.eventBus.emit({
        type: 'mcp.server.uninstalled',
        timestamp: new Date(),
        data: {
          installationId: installation.id,
          serverId,
          userId
        }
      });

      this.logger.info('Server uninstalled successfully', {
        serverId,
        userId
      });
    } catch (error) {
      this.logger.error('Failed to uninstall server:', error);
      throw error;
    }
  }

  /**
   * Perform actual installation based on method
   */
  private async performInstallation(installation: ServerInstallation): Promise<void> {
    this.logger.debug('Performing installation', {
      method: installation.installation_method,
      serverId: installation.server_id
    });

    try {
      await this.updateInstallationStatus(installation.id, 'installing');

      switch (installation.installation_method) {
        case 'npm':
          await this.performNpmInstallation(installation);
          break;
        case 'docker':
          await this.performDockerInstallation(installation);
          break;
        case 'binary':
          await this.performBinaryInstallation(installation);
          break;
        case 'manual':
          await this.performManualInstallation(installation);
          break;
        default:
          throw new Error(`Unsupported installation method: ${installation.installation_method}`);
      }

      await this.updateInstallationStatus(installation.id, 'installed');
      
      // Test connection after installation
      if (installation.configuration?.auto_start !== false) {
        await this.testConnection(installation);
      }

    } catch (error) {
      await this.updateInstallationStatus(installation.id, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Perform NPM installation
   */
  private async performNpmInstallation(installation: ServerInstallation): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverQuery = `SELECT npm_package FROM mcp_servers WHERE id = $1`;
      this.pool.query(serverQuery, [installation.server_id])
        .then(result => {
          const npmPackage = result.rows[0]?.npm_package;
          if (!npmPackage) {
            throw new Error('No npm package specified for server');
          }

          const installCommand = `npm install -g ${npmPackage}`;
          const process = spawn('npm', ['install', '-g', npmPackage], {
            env: { ...process.env, ...installation.environment_variables }
          });

          let output = '';
          let error = '';

          process.stdout.on('data', (data) => {
            output += data.toString();
            this.addInstallationLog(installation.id, `STDOUT: ${data.toString()}`);
          });

          process.stderr.on('data', (data) => {
            error += data.toString();
            this.addInstallationLog(installation.id, `STDERR: ${data.toString()}`);
          });

          process.on('close', (code) => {
            if (code === 0) {
              this.addInstallationLog(installation.id, 'NPM installation completed successfully');
              resolve();
            } else {
              reject(new Error(`NPM installation failed with code ${code}: ${error}`));
            }
          });

          process.on('error', (err) => {
            reject(new Error(`NPM installation process error: ${err.message}`));
          });
        })
        .catch(reject);
    });
  }

  /**
   * Perform Docker installation
   */
  private async performDockerInstallation(installation: ServerInstallation): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const serverQuery = `SELECT docker_image FROM mcp_servers WHERE id = $1`;
        const result = await this.pool.query(serverQuery, [installation.server_id]);
        
        const dockerImage = result.rows[0]?.docker_image;
        if (!dockerImage) {
          throw new Error('No Docker image specified for server');
        }

        // Pull image
        const pullProcess = spawn('docker', ['pull', dockerImage]);
        
        pullProcess.on('close', (code) => {
          if (code === 0) {
            // Create and start container
            const envArgs = Object.entries(installation.environment_variables)
              .flatMap(([key, value]) => ['-e', `${key}=${value}`]);

            const runArgs = [
              'run', '-d', '--name', `mcp-${installation.server_id}-${installation.user_id}`,
              ...envArgs,
              dockerImage
            ];

            const runProcess = spawn('docker', runArgs);
            
            runProcess.on('close', (runCode) => {
              if (runCode === 0) {
                this.addInstallationLog(installation.id, 'Docker container started successfully');
                resolve();
              } else {
                reject(new Error(`Docker container failed to start with code ${runCode}`));
              }
            });
          } else {
            reject(new Error(`Docker pull failed with code ${code}`));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create MCP connection
   */
  private async createConnection(
    installation: ServerInstallation,
    options?: any
  ): Promise<MCPConnection> {
    const connectionId = this.generateConnectionId();
    
    // Get server transport details
    const serverQuery = 'SELECT transport_type FROM mcp_servers WHERE id = $1';
    const serverResult = await this.pool.query(serverQuery, [installation.server_id]);
    const transportType = serverResult.rows[0]?.transport_type || 'stdio';

    const connection: MCPConnection = {
      id: connectionId,
      installation_id: installation.id,
      server_id: installation.server_id,
      user_id: installation.user_id,
      transport_type: transportType,
      connection_string: this.buildConnectionString(installation, transportType),
      status: 'connecting',
      response_time_ms: 0,
      error_count: 0,
      success_count: 0,
      tools_available: []
    };

    try {
      // Establish connection based on transport type
      switch (transportType) {
        case 'stdio':
          await this.createStdioConnection(connection, installation);
          break;
        case 'http_sse':
          await this.createHttpSseConnection(connection, installation);
          break;
        case 'websocket':
          await this.createWebSocketConnection(connection, installation);
          break;
        default:
          throw new Error(`Unsupported transport type: ${transportType}`);
      }

      connection.status = 'connected';
      connection.connected_at = new Date();

      // Discover available tools
      connection.tools_available = await this.discoverServerTools(connection);

      this.logger.info('MCP connection established', {
        connectionId,
        serverId: installation.server_id,
        transportType
      });

      return connection;
    } catch (error) {
      connection.status = 'error';
      this.logger.error('Failed to create MCP connection:', error);
      throw error;
    }
  }

  /**
   * Create stdio-based connection
   */
  private async createStdioConnection(
    connection: MCPConnection,
    installation: ServerInstallation
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Get server command
        const serverQuery = `SELECT installation_command, npm_package FROM mcp_servers WHERE id = $1`;
        this.pool.query(serverQuery, [installation.server_id])
          .then(result => {
            const server = result.rows[0];
            const command = server.installation_command || `npx ${server.npm_package}`;
            
            // Parse command
            const [cmd, ...args] = command.split(' ');
            
            // Spawn process
            const process = spawn(cmd, args, {
              env: { ...process.env, ...installation.environment_variables },
              stdio: ['pipe', 'pipe', 'pipe']
            });

            // Handle process events
            process.on('spawn', () => {
              connection.process = process;
              this.logger.debug('MCP server process spawned', {
                connectionId: connection.id,
                pid: process.pid
              });
              resolve();
            });

            process.on('error', (error) => {
              this.logger.error('MCP server process error:', error);
              reject(error);
            });

            process.on('exit', (code, signal) => {
              this.logger.warn('MCP server process exited', {
                connectionId: connection.id,
                code,
                signal
              });
              connection.status = 'disconnected';
              connection.disconnected_at = new Date();
            });

            // Set up stdio communication
            this.setupStdioCommunication(connection, process);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup stdio communication for MCP protocol
   */
  private setupStdioCommunication(connection: MCPConnection, process: ChildProcess): void {
    // Handle stdout messages (MCP responses)
    process.stdout?.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMCPMessage(connection, message);
      } catch (error) {
        this.logger.warn('Invalid MCP message received', {
          connectionId: connection.id,
          data: data.toString()
        });
      }
    });

    // Handle stderr (errors and logs)
    process.stderr?.on('data', (data) => {
      this.logger.warn('MCP server stderr', {
        connectionId: connection.id,
        message: data.toString()
      });
    });
  }

  /**
   * Handle MCP protocol messages
   */
  private handleMCPMessage(connection: MCPConnection, message: any): void {
    this.logger.debug('Received MCP message', {
      connectionId: connection.id,
      method: message.method,
      id: message.id
    });

    // Update success/error counters
    if (message.error) {
      connection.error_count++;
    } else {
      connection.success_count++;
    }

    // Handle specific message types
    switch (message.method) {
      case 'tools/list':
        if (message.result?.tools) {
          connection.tools_available = message.result.tools.map((tool: any) => tool.name);
        }
        break;
        
      case 'tools/call':
        // Tool execution result
        break;
        
      default:
        // Generic message handling
    }

    // Update last ping time
    connection.last_ping = new Date();
  }

  /**
   * Discover available tools from server
   */
  private async discoverServerTools(connection: MCPConnection): Promise<string[]> {
    try {
      if (connection.transport_type === 'stdio' && connection.process) {
        // Send tools/list request
        const request = {
          jsonrpc: '2.0',
          id: this.generateRequestId(),
          method: 'tools/list',
          params: {}
        };

        connection.process.stdin?.write(JSON.stringify(request) + '\n');
        
        // Wait for response (simplified - should use proper MCP client)
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(connection.tools_available);
          }, 1000);
        });
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to discover server tools:', error);
      return [];
    }
  }

  /**
   * Perform health checks on all connections
   */
  private async performHealthChecks(): Promise<void> {
    const connections = Array.from(this.connections.values());
    
    for (const connection of connections) {
      if (connection.status === 'connected') {
        try {
          await this.pingConnection(connection);
        } catch (error) {
          this.logger.warn('Health check failed for connection', {
            connectionId: connection.id,
            error: error.message
          });
          
          connection.error_count++;
          if (connection.error_count > 5) {
            connection.status = 'error';
            await this.disconnectFromServer(connection.id);
          }
        }
      }
    }
  }

  /**
   * Ping connection to test health
   */
  private async pingConnection(connection: MCPConnection): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      if (connection.transport_type === 'stdio' && connection.process) {
        // Send ping request
        const request = {
          jsonrpc: '2.0',
          id: this.generateRequestId(),
          method: 'ping',
          params: {}
        };

        connection.process.stdin?.write(JSON.stringify(request) + '\n');
        
        // Update response time (simplified)
        connection.response_time_ms = Date.now() - startTime;
        connection.last_ping = new Date();
        
        return true;
      }

      return false;
    } catch (error) {
      connection.response_time_ms = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async createInstallationRecord(
    userId: string,
    server: any,
    request: InstallationRequest
  ): Promise<ServerInstallation> {
    const installationId = this.generateInstallationId();
    
    const query = `
      INSERT INTO server_installations (
        id, user_id, server_id, server_name, installation_method,
        status, configuration, environment_variables
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      installationId,
      userId,
      request.server_id,
      server.name,
      request.installation_method,
      JSON.stringify(request.configuration || {}),
      JSON.stringify(request.environment_variables || {})
    ]);

    return this.mapInstallationFromDB(result.rows[0]);
  }

  private async getInstallation(userId: string, serverId: string): Promise<ServerInstallation | null> {
    const query = `
      SELECT * FROM server_installations 
      WHERE user_id = $1 AND server_id = $2
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [userId, serverId]);
    return result.rows.length > 0 ? this.mapInstallationFromDB(result.rows[0]) : null;
  }

  private async updateInstallationStatus(
    installationId: string,
    status: InstallationStatus,
    errorMessage?: string
  ): Promise<void> {
    const query = `
      UPDATE server_installations 
      SET status = $1, error_message = $2, updated_at = NOW()
      WHERE id = $3
    `;
    
    await this.pool.query(query, [status, errorMessage, installationId]);
  }

  private async addInstallationLog(installationId: string, logMessage: string): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE server_installations 
        SET installation_logs = installation_logs || $1::text
        WHERE id = $2
      `, [logMessage, installationId]);
    } catch (error) {
      this.logger.error('Failed to add installation log:', error);
    }
  }

  private addToConnectionPool(connection: MCPConnection): void {
    const pool = this.connectionPools.get(connection.server_id);
    if (pool) {
      pool.active_connections.push(connection);
    } else {
      this.connectionPools.set(connection.server_id, {
        server_id: connection.server_id,
        max_connections: 10, // Configurable limit
        active_connections: [connection],
        queue: []
      });
    }
  }

  private removeFromConnectionPool(connection: MCPConnection): void {
    const pool = this.connectionPools.get(connection.server_id);
    if (pool) {
      pool.active_connections = pool.active_connections.filter(c => c.id !== connection.id);
    }
  }

  private buildConnectionString(installation: ServerInstallation, transportType: string): string {
    switch (transportType) {
      case 'stdio':
        return `stdio://${installation.server_name}`;
      case 'http_sse':
        return `http://localhost:${installation.configuration?.port || 3000}/sse`;
      case 'websocket':
        return `ws://localhost:${installation.configuration?.port || 3000}/ws`;
      default:
        return '';
    }
  }

  private async performDockerInstallation(installation: ServerInstallation): Promise<void> {
    // Implementation for Docker-based installation
    throw new Error('Docker installation not yet implemented');
  }

  private async performBinaryInstallation(installation: ServerInstallation): Promise<void> {
    // Implementation for binary installation
    throw new Error('Binary installation not yet implemented');
  }

  private async performManualInstallation(installation: ServerInstallation): Promise<void> {
    // Mark as installed for manual installations
    this.addInstallationLog(installation.id, 'Manual installation - marked as completed');
  }

  private async performUninstallation(installation: ServerInstallation): Promise<void> {
    switch (installation.installation_method) {
      case 'npm':
        // NPM uninstall
        break;
      case 'docker':
        // Docker container removal
        break;
      default:
        // Manual cleanup
    }
  }

  private async testConnection(installation: ServerInstallation): Promise<void> {
    try {
      const connection = await this.createConnection(installation);
      this.logger.info('Connection test successful', {
        installationId: installation.id,
        connectionId: connection.id
      });
    } catch (error) {
      this.logger.warn('Connection test failed after installation:', error);
    }
  }

  private async createHttpSseConnection(connection: MCPConnection, installation: ServerInstallation): Promise<void> {
    // TODO: Implement HTTP SSE connection
    throw new Error('HTTP SSE transport not yet implemented');
  }

  private async createWebSocketConnection(connection: MCPConnection, installation: ServerInstallation): Promise<void> {
    // TODO: Implement WebSocket connection
    throw new Error('WebSocket transport not yet implemented');
  }

  private mapInstallationFromDB(row: any): ServerInstallation {
    return {
      id: row.id,
      user_id: row.user_id,
      server_id: row.server_id,
      server_name: row.server_name,
      installation_method: row.installation_method,
      status: row.status,
      configuration: row.configuration,
      environment_variables: row.environment_variables,
      installation_path: row.installation_path,
      process_id: row.process_id,
      health_status: row.health_status || 'healthy',
      last_health_check: row.last_health_check || new Date(),
      installation_logs: row.installation_logs || [],
      error_message: row.error_message,
      installed_at: row.installed_at,
      updated_at: row.updated_at,
      created_at: row.created_at
    };
  }

  private generateInstallationId(): string {
    return `install_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down installation manager');
    
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Disconnect all connections
    for (const [connectionId] of this.connections) {
      await this.disconnectFromServer(connectionId);
    }

    this.logger.info('Installation manager shutdown complete');
  }
}

/**
 * Factory function to create installation manager
 */
export function createMCPInstallationManager(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): MCPInstallationManager {
  return new MCPInstallationManager(pool, logger, errorManager, eventBus);
}