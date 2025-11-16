import { createServer } from 'net';
import { execSync } from 'child_process';
import os from 'os';

/**
 * Manages port allocation for MCP servers
 * Handles port conflicts, system port usage, and MCP config tracking
 */
export class PortManager {
  constructor(startPort = 8080, endPort = 9000) {
    this.startPort = startPort;
    this.endPort = endPort;
    this.lastAllocatedPort = null;
    this.systemPortCache = new Map(); // Cache system ports for 5 seconds
    this.cacheTimeout = 5000;
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
   * Check if a specific port is available by attempting to bind to it
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = createServer();

      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          // Other errors (EACCES, etc.) also mean port is not available for our use
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });

      // Try both localhost and 0.0.0.0 to catch more conflicts
      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Get all ports currently in use by the system
   * This provides additional conflict detection beyond just bind testing
   */
  async getSystemPorts() {
    const cacheKey = 'system-ports';
    const cached = this.systemPortCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.ports;
    }

    try {
      const platform = os.platform();
      let ports = [];

      if (platform === 'win32') {
        // Windows: use netstat
        try {
          const output = execSync('netstat -an -p TCP', { encoding: 'utf8', timeout: 3000 });
          const lines = output.split('\n');
          for (const line of lines) {
            const match = line.match(/:(\d+)\s+.*LISTENING/);
            if (match) {
              ports.push(parseInt(match[1], 10));
            }
          }
        } catch (e) {
          // Fallback to empty if netstat fails
        }
      } else {
        // Unix/Linux/Mac: use lsof or netstat
        try {
          const output = execSync('lsof -iTCP -sTCP:LISTEN -P -n | grep LISTEN || netstat -an | grep LISTEN',
            { encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] });
          const lines = output.split('\n');
          for (const line of lines) {
            // Match patterns like :8080 or .8080 or 127.0.0.1:8080
            const match = line.match(/[:\.](\d+)\s/);
            if (match) {
              ports.push(parseInt(match[1], 10));
            }
          }
        } catch (e) {
          // Fallback to empty if commands fail
        }
      }

      // Remove duplicates and sort
      ports = [...new Set(ports)].sort((a, b) => a - b);

      this.systemPortCache.set(cacheKey, {
        ports,
        timestamp: Date.now()
      });

      return ports;
    } catch (error) {
      // If system port detection fails, return empty array
      // The bind test in isPortAvailable will still catch conflicts
      return [];
    }
  }

  /**
   * Enhanced port availability check using both bind test and system check
   */
  async isPortReallyAvailable(port) {
    // First check system-wide
    const systemPorts = await this.getSystemPorts();
    if (systemPorts.includes(port)) {
      return false;
    }

    // Then try to bind to the port
    return await this.isPortAvailable(port);
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
   * Uses enhanced detection including system-wide port checking
   */
  async allocatePortAvoiding(existingPorts = []) {
    // Get system ports once for efficiency
    const systemPorts = await this.getSystemPorts();
    const conflictPorts = [...new Set([...existingPorts, ...systemPorts])];

    for (let port = this.startPort; port <= this.endPort; port++) {
      // Skip ports already in use by config or system
      if (conflictPorts.includes(port)) {
        continue;
      }

      // Final verification by attempting to bind
      if (await this.isPortAvailable(port)) {
        this.lastAllocatedPort = port;
        return port;
      }
    }

    throw new Error(
      `No available ports found between ${this.startPort} and ${this.endPort}. ` +
      `Found ${conflictPorts.length} ports in use. Try expanding the port range or closing some services.`
    );
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

  /**
   * Get diagnostic information about port usage
   * Useful for troubleshooting port conflicts
   */
  async getDiagnostics(config = {}) {
    const mcpPorts = this.getAllocatedPorts(config);
    const systemPorts = await this.getSystemPorts();
    const portRange = this.getPortRange();

    // Find conflicts (MCP ports that are also in system ports)
    const conflicts = mcpPorts.filter(port => systemPorts.includes(port));

    // Count available ports in range
    const usedInRange = systemPorts.filter(
      port => port >= this.startPort && port <= this.endPort
    );
    const availableCount = portRange.total - usedInRange.length;

    return {
      portRange,
      mcpPorts: {
        count: mcpPorts.length,
        ports: mcpPorts.sort((a, b) => a - b)
      },
      systemPorts: {
        total: systemPorts.length,
        inRange: usedInRange.length,
        ports: usedInRange.sort((a, b) => a - b)
      },
      conflicts: {
        count: conflicts.length,
        ports: conflicts.sort((a, b) => a - b)
      },
      available: {
        count: availableCount,
        percentage: ((availableCount / portRange.total) * 100).toFixed(1)
      }
    };
  }

  /**
   * Pretty print diagnostic information
   */
  async printDiagnostics(config = {}) {
    const diag = await this.getDiagnostics(config);

    console.log('\n📊 Port Usage Diagnostics\n');
    console.log(`Port Range: ${diag.portRange.start} - ${diag.portRange.end} (${diag.portRange.total} ports)`);
    console.log('');

    console.log(`MCP Servers: ${diag.mcpPorts.count} ports allocated`);
    if (diag.mcpPorts.count > 0) {
      console.log(`  Ports: ${diag.mcpPorts.ports.join(', ')}`);
    }
    console.log('');

    console.log(`System Usage: ${diag.systemPorts.inRange} ports in range (${diag.systemPorts.total} total)`);
    if (diag.systemPorts.inRange > 0 && diag.systemPorts.inRange <= 20) {
      console.log(`  Ports: ${diag.systemPorts.ports.join(', ')}`);
    }
    console.log('');

    if (diag.conflicts.count > 0) {
      console.log(`⚠️  Conflicts: ${diag.conflicts.count} MCP ports conflicting with system`);
      console.log(`  Conflicting ports: ${diag.conflicts.ports.join(', ')}`);
      console.log('');
    }

    console.log(`Available: ${diag.available.count} ports (${diag.available.percentage}%)`);

    if (diag.available.count < 10) {
      console.log('\n⚠️  Warning: Low port availability. Consider:');
      console.log('  - Closing unused services');
      console.log('  - Expanding port range (use --port-start and --port-end options)');
    }

    console.log('');
  }
}