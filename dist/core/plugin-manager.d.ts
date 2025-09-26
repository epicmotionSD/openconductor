/**
 * PluginManager Implementation
 *
 * Plugin system for extending OpenConductor functionality
 */
import { Plugin, PluginConfig, PluginStatus, PluginType } from '../types/plugins';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
export declare class PluginManager {
    private plugins;
    private hooks;
    private pluginAPI;
    private logger;
    private errorManager;
    private eventBus;
    constructor(logger: Logger, errorManager: ErrorManager, eventBus: EventBus);
    /**
     * Install and register a plugin
     */
    installPlugin(plugin: Plugin, config?: PluginConfig): Promise<void>;
    /**
     * Uninstall a plugin
     */
    uninstallPlugin(pluginId: string): Promise<void>;
    /**
     * Enable a plugin
     */
    enablePlugin(pluginId: string): Promise<void>;
    /**
     * Disable a plugin
     */
    disablePlugin(pluginId: string): Promise<void>;
    /**
     * Execute plugin hooks for a specific event
     */
    executeHooks(hookName: string, data?: any): Promise<any>;
    /**
     * Get plugin by ID
     */
    getPlugin(pluginId: string): Plugin | null;
    /**
     * Get plugins by type
     */
    getPluginsByType(type: PluginType): Plugin[];
    /**
     * Get all plugins
     */
    getAllPlugins(): Plugin[];
    /**
     * Get plugin status
     */
    getPluginStatus(pluginId: string): PluginStatus | null;
    /**
     * Search plugins
     */
    searchPlugins(query: string): Plugin[];
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
    };
    /**
     * Get health status of the PluginManager
     */
    getHealthStatus(): any;
    private startTime;
    private validatePlugin;
    private checkPluginConflicts;
    private checkDependencies;
    private registerPluginHooks;
    private removePluginHooks;
    private createPluginAPI;
    private getDefaultConfig;
    private emitLifecycleEvent;
}
//# sourceMappingURL=plugin-manager.d.ts.map