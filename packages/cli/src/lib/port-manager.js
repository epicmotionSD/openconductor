import { createServer } from 'net';

/**
 * Manages port allocation for MCP servers
 */
export class PortManager {
  constructor(startPort = 8080, endPort = 9000) {
    this.startPort = startPort;
    this.endPort = endPort;
    this.lastAllocatedPort = null;
  }

  /**
   * Find an available port
   */
  async allocatePort() {
    for (let port = this.startPort; port <= this.endPort; port++) {
      if (await this.isPortAvailable(port)) {
        this.lastAllocatedPort = port;
        return port;
      }
    }
    
    throw new Error(`No available ports found between ${this.startPort} and ${this.endPort}`);
  }

  /**
   * Check if a specific port is available
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Get all allocated ports from config
   */
  getAllocatedPorts(config) {
    const ports = [];
    
    if (config.mcpServers) {
      for (const serverConfig of Object.values(config.mcpServers)) {
        if (serverConfig.env?.PORT) {
          ports.push(parseInt(serverConfig.env.PORT, 10));
        }
      }
    }
    
    return ports;
  }

  /**
   * Find next available port avoiding conflicts with existing config
   */
  async allocatePortAvoiding(existingPorts = []) {
    for (let port = this.startPort; port <= this.endPort; port++) {
      // Skip ports already in use by other servers
      if (existingPorts.includes(port)) {
        continue;
      }
      
      if (await this.isPortAvailable(port)) {
        this.lastAllocatedPort = port;
        return port;
      }
    }
    
    throw new Error(`No available ports found between ${this.startPort} and ${this.endPort}`);
  }

  /**
   * Reserve multiple ports at once
   */
  async allocateMultiplePorts(count) {
    const ports = [];
    
    for (let i = 0; i < count; i++) {
      const existingPorts = [...ports, ...this.getAllocatedPorts({})];
      const port = await this.allocatePortAvoiding(existingPorts);
      ports.push(port);
    }
    
    return ports;
  }

  /**
   * Get port range information
   */
  getPortRange() {
    return {
      start: this.startPort,
      end: this.endPort,
      total: this.endPort - this.startPort + 1
    };
  }

  /**
   * Check if port is in valid range
   */
  isValidPort(port) {
    return port >= this.startPort && port <= this.endPort;
  }

  /**
   * Get recommended port for a server (based on server name hash)
   */
  getRecommendedPort(serverName) {
    // Simple hash to get consistent port suggestion for same server
    let hash = 0;
    for (let i = 0; i < serverName.length; i++) {
      const char = serverName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Map hash to port range
    const portRange = this.endPort - this.startPort;
    const suggestedOffset = Math.abs(hash) % portRange;
    return this.startPort + suggestedOffset;
  }

  /**
   * Release a port (mark as available for future allocation)
   * Note: This doesn't actually unbind the port, just removes it from tracking
   */
  releasePort(port) {
    // In a more sophisticated implementation, we could track reserved ports
    // For now, this is mainly for logging/debugging
    if (this.lastAllocatedPort === port) {
      this.lastAllocatedPort = null;
    }
  }
}