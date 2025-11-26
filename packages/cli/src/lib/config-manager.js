import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { parse, stringify } from 'comment-json';

/**
 * Manages MCP configuration files
 * Default locations:
 * - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
 * - Linux: ~/.config/claude/claude_desktop_config.json
 * - Windows: %APPDATA%\Claude\claude_desktop_config.json
 */
export class ConfigManager {
  constructor(customPath) {
    this.configPath = customPath || this.getDefaultConfigPath();
  }

  getDefaultConfigPath() {
    const platform = process.platform;
    
    if (platform === 'darwin') {
      // macOS
      return join(homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
    } else if (platform === 'win32') {
      // Windows
      const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
      return join(appData, 'Claude', 'claude_desktop_config.json');
    } else {
      // Linux and others
      const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
      return join(configHome, 'claude', 'claude_desktop_config.json');
    }
  }

  /**
   * Read existing config or create new one
   */
  async readConfig() {
    try {
      await access(this.configPath);
      const content = await readFile(this.configPath, 'utf-8');
      return parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Config doesn't exist, return default
        return {
          mcpServers: {}
        };
      }
      throw error;
    }
  }

  /**
   * Write config to file
   */
  async writeConfig(config) {
    // Ensure directory exists
    await mkdir(dirname(this.configPath), { recursive: true });

    // Write with pretty formatting (preserves comments)
    await writeFile(
      this.configPath,
      stringify(config, null, 2),
      'utf-8'
    );
  }

  /**
   * Add a server to config
   */
  async addServer(serverId, serverConfig) {
    const config = await this.readConfig();
    
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    config.mcpServers[serverId] = serverConfig;
    
    await this.writeConfig(config);
  }

  /**
   * Remove a server from config
   */
  async removeServer(serverId) {
    const config = await this.readConfig();
    
    if (config.mcpServers && config.mcpServers[serverId]) {
      delete config.mcpServers[serverId];
      await this.writeConfig(config);
      return true;
    }
    
    return false;
  }

  /**
   * Update a server's config
   */
  async updateServer(serverId, updates) {
    const config = await this.readConfig();
    
    if (config.mcpServers && config.mcpServers[serverId]) {
      config.mcpServers[serverId] = {
        ...config.mcpServers[serverId],
        ...updates
      };
      await this.writeConfig(config);
      return true;
    }
    
    return false;
  }

  /**
   * Check if server is installed
   */
  async isInstalled(serverId) {
    const config = await this.readConfig();
    return config.mcpServers && !!config.mcpServers[serverId];
  }

  /**
   * Get all installed servers
   */
  async getInstalledServers() {
    const config = await this.readConfig();
    return Object.keys(config.mcpServers || {});
  }

  /**
   * Get specific server config
   */
  async getServerConfig(serverId) {
    const config = await this.readConfig();
    return config.mcpServers?.[serverId] || null;
  }

  /**
   * Validate config structure
   */
  async validateConfig() {
    const config = await this.readConfig();
    
    // Basic validation
    if (typeof config !== 'object') {
      throw new Error('Config must be an object');
    }
    
    if (config.mcpServers && typeof config.mcpServers !== 'object') {
      throw new Error('mcpServers must be an object');
    }
    
    // Validate each server config
    if (config.mcpServers) {
      for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
        if (!serverConfig.command) {
          throw new Error(`Server "${serverId}" missing required "command" field`);
        }
      }
    }
    
    return true;
  }

  /**
   * Backup current config
   */
  async backupConfig() {
    if (!existsSync(this.configPath)) {
      return null;
    }
    
    const backupPath = `${this.configPath}.backup.${Date.now()}`;
    const content = await readFile(this.configPath, 'utf-8');
    await writeFile(backupPath, content, 'utf-8');
    
    return backupPath;
  }

  /**
   * Get config file info
   */
  getConfigInfo() {
    return {
      path: this.configPath,
      exists: existsSync(this.configPath),
      platform: process.platform
    };
  }

  /**
   * Initialize config with default structure
   */
  async initializeConfig(force = false) {
    if (existsSync(this.configPath) && !force) {
      throw new Error('Config file already exists. Use --force to overwrite.');
    }

    const defaultConfig = {
      mcpServers: {},
      globalShortcut: "Cmd+Shift+.",
      // Add any other default Claude Desktop settings
    };

    await this.writeConfig(defaultConfig);
    return this.configPath;
  }
}