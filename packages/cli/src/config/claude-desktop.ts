import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { ClaudeDesktopConfig } from '@openconductor/shared';

export class ClaudeDesktopConfigManager {
  private configPath: string;

  constructor(customPath?: string) {
    this.configPath = customPath || this.getDefaultConfigPath();
  }

  private getDefaultConfigPath(): string {
    const platform = os.platform();
    
    switch (platform) {
      case 'darwin': // macOS
        return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      case 'win32': // Windows
        return path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
      case 'linux': // Linux
        return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async readConfig(): Promise<ClaudeDesktopConfig> {
    try {
      if (!(await fs.pathExists(this.configPath))) {
        return { mcpServers: {} };
      }

      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      
      // Ensure mcpServers object exists
      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to read Claude Desktop config: ${error.message}`);
    }
  }

  async writeConfig(config: ClaudeDesktopConfig): Promise<void> {
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(this.configPath));
      
      // Write config with pretty formatting
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write Claude Desktop config: ${error.message}`);
    }
  }

  async addServer(serverName: string, serverConfig: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }): Promise<void> {
    const config = await this.readConfig();
    
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers[serverName] = serverConfig;
    await this.writeConfig(config);
  }

  async removeServer(serverName: string): Promise<boolean> {
    const config = await this.readConfig();
    
    if (!config.mcpServers || !config.mcpServers[serverName]) {
      return false;
    }

    delete config.mcpServers[serverName];
    await this.writeConfig(config);
    return true;
  }

  async listServers(): Promise<Record<string, any>> {
    const config = await this.readConfig();
    return config.mcpServers || {};
  }

  async hasServer(serverName: string): Promise<boolean> {
    const config = await this.readConfig();
    return !!(config.mcpServers && config.mcpServers[serverName]);
  }

  async backupConfig(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.configPath}.backup.${timestamp}`;
    
    if (await fs.pathExists(this.configPath)) {
      await fs.copy(this.configPath, backupPath);
    }
    
    return backupPath;
  }

  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const config = await this.readConfig();
      
      if (config.mcpServers) {
        for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
          if (!serverConfig.command) {
            errors.push(`Server '${serverName}' missing required 'command' field`);
          }
          
          if (serverConfig.args && !Array.isArray(serverConfig.args)) {
            errors.push(`Server '${serverName}' has invalid 'args' field (must be array)`);
          }
          
          if (serverConfig.env && typeof serverConfig.env !== 'object') {
            errors.push(`Server '${serverName}' has invalid 'env' field (must be object)`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to parse config: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  getConfigPath(): string {
    return this.configPath;
  }
}

export const claudeDesktopConfig = new ClaudeDesktopConfigManager();