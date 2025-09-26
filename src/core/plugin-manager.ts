/**
 * PluginManager Implementation
 * 
 * Plugin system for extending OpenConductor functionality
 */

import { 
  Plugin, 
  PluginConfig, 
  PluginMetadata, 
  PluginStatus,
  PluginType,
  PluginAPI,
  PluginHook,
  PluginLifecycleEvent
} from '../types/plugins';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export class PluginManager {
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();
  private pluginAPI: PluginAPI;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;

  constructor(
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    this.pluginAPI = this.createPluginAPI();
  }

  /**
   * Install and register a plugin
   */
  async installPlugin(plugin: Plugin, config?: PluginConfig): Promise<void> {
    this.logger.info(`Installing plugin: ${plugin.metadata.name}`, {
      version: plugin.metadata.version,
      type: plugin.metadata.type
    });

    // Validate plugin
    this.validatePlugin(plugin);

    // Check for conflicts
    await this.checkPluginConflicts(plugin);

    // Check dependencies
    await this.checkDependencies(plugin);

    const registeredPlugin: RegisteredPlugin = {
      plugin,
      config: config || this.getDefaultConfig(),
      status: 'installing',
      installedAt: new Date(),
      enabledAt: null,
      lastUsed: null,
      executionCount: 0,
      errorCount: 0
    };

    try {
      // Store plugin
      this.plugins.set(plugin.metadata.id, registeredPlugin);

      // Install plugin
      if (plugin.install) {
        await plugin.install(this.pluginAPI, registeredPlugin.config);
      }

      registeredPlugin.status = 'installed';

      // Enable plugin if auto-enable is configured
      if (registeredPlugin.config.autoEnable) {
        await this.enablePlugin(plugin.metadata.id);
      }

      // Emit lifecycle event
      await this.emitLifecycleEvent('installed', plugin.metadata.id);

      this.logger.info(`Plugin installed successfully: ${plugin.metadata.name}`);

    } catch (error) {
      registeredPlugin.status = 'error';
      
      const pluginError = this.errorManager.createError(
        'PLUGIN_INSTALLATION_FAILED',
        `Failed to install plugin ${plugin.metadata.name}: ${error instanceof Error ? error.message : String(error)}`,
        'system',
        'high',
        { pluginId: plugin.metadata.id },
        error instanceof Error ? error : undefined
      );

      this.errorManager.handleError(pluginError);
      throw pluginError;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    this.logger.info(`Uninstalling plugin: ${pluginId}`);

    const registeredPlugin = this.plugins.get(pluginId);
    if (!registeredPlugin) {
      throw this.errorManager.createError(
        'PLUGIN_NOT_FOUND',
        `Plugin ${pluginId} not found`,
        'system',
        'medium'
      );
    }

    try {
      // Disable plugin first
      if (registeredPlugin.status === 'enabled') {
        await this.disablePlugin(pluginId);
      }

      // Uninstall plugin
      if (registeredPlugin.plugin.uninstall) {
        await registeredPlugin.plugin.uninstall(this.pluginAPI);
      }

      // Remove hooks
      this.removePluginHooks(pluginId);

      // Remove from registry
      this.plugins.delete(pluginId);

      // Emit lifecycle event
      await this.emitLifecycleEvent('uninstalled', pluginId);

      this.logger.info(`Plugin uninstalled successfully: ${pluginId}`);

    } catch (error) {
      const pluginError = this.errorManager.createError(
        'PLUGIN_UNINSTALL_FAILED',
        `Failed to uninstall plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`,
        'system',
        'high',
        { pluginId },
        error instanceof Error ? error : undefined
      );

      this.errorManager.handleError(pluginError);
      throw pluginError;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const registeredPlugin = this.plugins.get(pluginId);
    if (!registeredPlugin) {
      throw this.errorManager.createError(
        'PLUGIN_NOT_FOUND',
        `Plugin ${pluginId} not found`,
        'system',
        'medium'
      );
    }

    if (registeredPlugin.status === 'enabled') {
      this.logger.warn(`Plugin ${pluginId} is already enabled`);
      return;
    }

    this.logger.info(`Enabling plugin: ${pluginId}`);

    try {
      // Enable plugin
      if (registeredPlugin.plugin.enable) {
        await registeredPlugin.plugin.enable(this.pluginAPI, registeredPlugin.config);
      }

      // Register hooks
      this.registerPluginHooks(registeredPlugin.plugin);

      // Update status
      registeredPlugin.status = 'enabled';
      registeredPlugin.enabledAt = new Date();

      // Emit lifecycle event
      await this.emitLifecycleEvent('enabled', pluginId);

      this.logger.info(`Plugin enabled successfully: ${pluginId}`);

    } catch (error) {
      registeredPlugin.status = 'error';
      
      const pluginError = this.errorManager.createError(
        'PLUGIN_ENABLE_FAILED',
        `Failed to enable plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`,
        'system',
        'high',
        { pluginId },
        error instanceof Error ? error : undefined
      );

      this.errorManager.handleError(pluginError);
      throw pluginError;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const registeredPlugin = this.plugins.get(pluginId);
    if (!registeredPlugin) {
      throw this.errorManager.createError(
        'PLUGIN_NOT_FOUND',
        `Plugin ${pluginId} not found`,
        'system',
        'medium'
      );
    }

    if (registeredPlugin.status !== 'enabled') {
      this.logger.warn(`Plugin ${pluginId} is not enabled`);
      return;
    }

    this.logger.info(`Disabling plugin: ${pluginId}`);

    try {
      // Disable plugin
      if (registeredPlugin.plugin.disable) {
        await registeredPlugin.plugin.disable(this.pluginAPI);
      }

      // Remove hooks
      this.removePluginHooks(pluginId);

      // Update status
      registeredPlugin.status = 'installed';
      registeredPlugin.enabledAt = null;

      // Emit lifecycle event
      await this.emitLifecycleEvent('disabled', pluginId);

      this.logger.info(`Plugin disabled successfully: ${pluginId}`);

    } catch (error) {
      registeredPlugin.status = 'error';
      
      const pluginError = this.errorManager.createError(
        'PLUGIN_DISABLE_FAILED',
        `Failed to disable plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`,
        'system',
        'high',
        { pluginId },
        error instanceof Error ? error : undefined
      );

      this.errorManager.handleError(pluginError);
      throw pluginError;
    }
  }

  /**
   * Execute plugin hooks for a specific event
   */
  async executeHooks(hookName: string, data?: any): Promise<any> {
    const hooks = this.hooks.get(hookName) || [];
    
    if (hooks.length === 0) {
      return data;
    }

    this.logger.debug(`Executing ${hooks.length} hooks for: ${hookName}`);

    let result = data;
    
    for (const hook of hooks) {
      try {
        const pluginId = hook.pluginId;
        const registeredPlugin = this.plugins.get(pluginId);
        
        if (registeredPlugin && registeredPlugin.status === 'enabled') {
          result = await hook.handler(result, this.pluginAPI);
          registeredPlugin.executionCount++;
          registeredPlugin.lastUsed = new Date();
        }
      } catch (error) {
        const pluginId = hook.pluginId;
        const registeredPlugin = this.plugins.get(pluginId);
        
        if (registeredPlugin) {
          registeredPlugin.errorCount++;
        }

        const hookError = this.errorManager.createError(
          'PLUGIN_HOOK_FAILED',
          `Plugin hook execution failed: ${error instanceof Error ? error.message : String(error)}`,
          'system',
          'medium',
          { pluginId, hookName },
          error instanceof Error ? error : undefined
        );

        this.errorManager.handleError(hookError);
        
        // Continue with other hooks unless it's a critical hook
        if (!hook.critical) {
          continue;
        } else {
          throw hookError;
        }
      }
    }

    return result;
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | null {
    const registeredPlugin = this.plugins.get(pluginId);
    return registeredPlugin ? registeredPlugin.plugin : null;
  }

  /**
   * Get plugins by type
   */
  getPluginsByType(type: PluginType): Plugin[] {
    return Array.from(this.plugins.values())
      .filter(rp => rp.plugin.metadata.type === type)
      .map(rp => rp.plugin);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).map(rp => rp.plugin);
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginId: string): PluginStatus | null {
    const registeredPlugin = this.plugins.get(pluginId);
    if (!registeredPlugin) return null;

    return {
      id: pluginId,
      status: registeredPlugin.status,
      installedAt: registeredPlugin.installedAt,
      enabledAt: registeredPlugin.enabledAt,
      lastUsed: registeredPlugin.lastUsed,
      executionCount: registeredPlugin.executionCount,
      errorCount: registeredPlugin.errorCount,
      errorRate: registeredPlugin.executionCount > 0
        ? registeredPlugin.errorCount / registeredPlugin.executionCount
        : 0
    } as any as PluginStatus;
  }

  /**
   * Search plugins
   */
  searchPlugins(query: string): Plugin[] {
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.plugins.values())
      .map(rp => rp.plugin)
      .filter(plugin => {
        const metadata = plugin.metadata;
        return (
          metadata.name.toLowerCase().includes(normalizedQuery) ||
          metadata.description.toLowerCase().includes(normalizedQuery) ||
          metadata.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
        );
      });
  }

  /**
   * Get plugin manager statistics
   */
  getManagerStats(): {
    totalPlugins: number;
    pluginsByStatus: Record<string, number>;
    pluginsByType: Record<PluginType, number>;
    totalExecutions: number;
    totalErrors: number;
    enabledPlugins: number;
  } {
    const stats = {
      totalPlugins: this.plugins.size,
      pluginsByStatus: {} as Record<string, number>,
      pluginsByType: {} as Record<PluginType, number>,
      totalExecutions: 0,
      totalErrors: 0,
      enabledPlugins: 0
    };

    for (const registeredPlugin of this.plugins.values()) {
      const { plugin, status, executionCount, errorCount } = registeredPlugin;
      
      stats.pluginsByStatus[status] = (stats.pluginsByStatus[status] || 0) + 1;
      stats.pluginsByType[plugin.metadata.type] =
        (stats.pluginsByType[plugin.metadata.type] || 0) + 1;
      stats.totalExecutions += executionCount;
      stats.totalErrors += errorCount;
      
      if (status === 'enabled') {
        stats.enabledPlugins++;
      }
    }

    return stats;
  }

  /**
   * Get health status of the PluginManager
   */
  getHealthStatus(): any {
    const stats = this.getManagerStats();
    return {
      status: 'running',
      totalPlugins: stats.totalPlugins,
      enabledPlugins: stats.enabledPlugins,
      installedPlugins: stats.pluginsByStatus.installed || 0,
      errorPlugins: stats.pluginsByStatus.error || 0,
      totalExecutions: stats.totalExecutions,
      totalErrors: stats.totalErrors,
      errorRate: stats.totalExecutions > 0 ? stats.totalErrors / stats.totalExecutions : 0,
      pluginsByType: stats.pluginsByType,
      totalHooks: Array.from(this.hooks.values()).reduce((sum, hooks) => sum + hooks.length, 0),
      uptime: Date.now() - this.startTime
    };
  }

  private startTime = Date.now();

  private validatePlugin(plugin: Plugin): void {
    const { metadata } = plugin;
    
    if (!metadata.id) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Plugin ID is required',
        'validation',
        'high'
      );
    }

    if (!metadata.name) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Plugin name is required',
        'validation',
        'high'
      );
    }

    if (!metadata.version) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Plugin version is required',
        'validation',
        'high'
      );
    }

    if (!metadata.type) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Plugin type is required',
        'validation',
        'high'
      );
    }
  }

  private async checkPluginConflicts(plugin: Plugin): Promise<void> {
    const existingPlugin = this.plugins.get(plugin.metadata.id);
    if (existingPlugin) {
      throw this.errorManager.createError(
        'PLUGIN_CONFLICT',
        `Plugin ${plugin.metadata.id} is already installed`,
        'system',
        'medium'
      );
    }

    // Check for conflicts with other plugins
    if (plugin.metadata.conflicts) {
      for (const conflictId of plugin.metadata.conflicts) {
        if (this.plugins.has(conflictId)) {
          throw this.errorManager.createError(
            'PLUGIN_CONFLICT',
            `Plugin ${plugin.metadata.id} conflicts with installed plugin ${conflictId}`,
            'system',
            'medium'
          );
        }
      }
    }
  }

  private async checkDependencies(plugin: Plugin): Promise<void> {
    if (!plugin.metadata.dependencies) return;

    for (const depId of plugin.metadata.dependencies) {
      const dependency = this.plugins.get(depId);
      if (!dependency || dependency.status !== 'enabled') {
        throw this.errorManager.createError(
          'PLUGIN_DEPENDENCY_MISSING',
          `Plugin ${plugin.metadata.id} requires ${depId} to be installed and enabled`,
          'system',
          'high'
        );
      }
    }
  }

  private registerPluginHooks(plugin: Plugin): void {
    if (!plugin.hooks) return;

    for (const [hookName, handler] of Object.entries(plugin.hooks)) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }

      const hook: PluginHook = {
        pluginId: plugin.metadata.id,
        name: hookName,
        handler,
        priority: plugin.metadata.priority || 0,
        critical: false // Could be configured per hook
      };

      this.hooks.get(hookName)!.push(hook);
      
      // Sort hooks by priority
      this.hooks.get(hookName)!.sort((a, b) => b.priority - a.priority);
    }
  }

  private removePluginHooks(pluginId: string): void {
    for (const [hookName, hooks] of this.hooks.entries()) {
      const filteredHooks = hooks.filter(hook => hook.pluginId !== pluginId);
      this.hooks.set(hookName, filteredHooks);
    }
  }

  private createPluginAPI(): PluginAPI {
    return {
      logger: this.logger,
      eventBus: this.eventBus,
      executeHooks: this.executeHooks.bind(this),
      getPlugin: this.getPlugin.bind(this),
      getConfig: () => ({}), // Would return plugin-specific config
      // Additional API methods would be added here
    };
  }

  private getDefaultConfig(): PluginConfig {
    return {
      enabled: true,
      autoEnable: true,
      priority: 0,
      settings: {}
    };
  }

  private async emitLifecycleEvent(
    event: PluginLifecycleEvent,
    pluginId: string
  ): Promise<void> {
    await this.eventBus.emit({
      type: 'system.alert', // Using existing event type
      timestamp: new Date(),
      data: {
        event: `plugin.${event}`,
        pluginId
      }
    });
  }
}

interface RegisteredPlugin {
  plugin: Plugin;
  config: PluginConfig;
  status: 'installing' | 'installed' | 'enabled' | 'disabled' | 'error';
  installedAt: Date;
  enabledAt: Date | null;
  lastUsed: Date | null;
  executionCount: number;
  errorCount: number;
}