/**
 * SportIntel MCP Server Registry
 *
 * Central registry for all SportIntel MCP servers that integrates with
 * OpenConductor's ToolRegistry for unified tool execution and management.
 *
 * This registry provides the bridge between MCP servers and OpenConductor's
 * enterprise-grade tool management capabilities.
 */
import { Logger } from '../../utils/logger';
import { ToolRegistry } from '../../core/tool-registry';
import { EventBus } from '../../types/events';
import { SportsDataServerConfig } from './sports-data-server';
import { MLPipelineServerConfig } from './ml-pipeline-server';
import { AnalyticsServerConfig } from './analytics-server';
import { AlertsServerConfig } from './alerts-server';
import { SportsDataPlugin } from '../../plugins/sportintel/sports-data-plugin';
import { SportsDataManager } from '../../storage/sportintel/sports-data-manager';
import { SportsOracleAgent } from '../../agents/sportintel/sports-oracle-agent';
import { SportsSentinelAgent } from '../../agents/sportintel/sports-sentinel-agent';
export interface MCPServerRegistryConfig {
    enabled: boolean;
    autoStart: boolean;
    healthCheckIntervalMs: number;
    toolRegistration: {
        enabled: boolean;
        categoryPrefix: string;
        namePrefix: string;
    };
    servers: {
        sportsData: SportsDataServerConfig & {
            enabled: boolean;
        };
        mlPipeline: MLPipelineServerConfig & {
            enabled: boolean;
        };
        analytics: AnalyticsServerConfig & {
            enabled: boolean;
        };
        alerts: AlertsServerConfig & {
            enabled: boolean;
        };
    };
}
export declare class MCPServerRegistry {
    private toolRegistry;
    private eventBus;
    private logger;
    private config;
    private sportsDataServer?;
    private mlPipelineServer?;
    private analyticsServer?;
    private alertsServer?;
    private sportsDataPlugin;
    private sportsDataManager;
    private sportsOracleAgent;
    private sportsSentinelAgent;
    private registeredTools;
    private serverStatus;
    private healthCheckInterval?;
    constructor(config: MCPServerRegistryConfig, toolRegistry: ToolRegistry, eventBus: EventBus, logger: Logger, dependencies: {
        sportsDataPlugin: SportsDataPlugin;
        sportsDataManager: SportsDataManager;
        sportsOracleAgent: SportsOracleAgent;
        sportsSentinelAgent: SportsSentinelAgent;
    });
    /**
     * Initialize and start all MCP servers
     */
    initialize(): Promise<void>;
    /**
     * Create MCP server instances based on configuration
     */
    private createMCPServers;
    /**
     * Register MCP server tools with OpenConductor's ToolRegistry
     */
    private registerToolsWithOpenConductor;
    /**
     * Execute MCP tool through the appropriate server
     */
    private executeMCPTool;
    /**
     * Call MCP server tool (simplified implementation)
     */
    private callMCPServerTool;
    /**
     * Validate MCP tool input against schema
     */
    private validateMCPToolInput;
    /**
     * Start all enabled MCP servers
     */
    startAllServers(): Promise<void>;
    /**
     * Stop all MCP servers
     */
    stopAllServers(): Promise<void>;
    /**
     * Get health status of all MCP servers
     */
    getHealthStatus(): any;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    private getEnabledServers;
    private getRunningServers;
    private isServerEnabled;
    private getServerInstance;
    private getOverallHealth;
    private getToolCountForServer;
    private getSportsDataTools;
    private getMLPipelineTools;
    private getAnalyticsTools;
    private getAlertsTools;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export declare function createMCPServerRegistry(config: MCPServerRegistryConfig, toolRegistry: ToolRegistry, eventBus: EventBus, logger: Logger, dependencies: {
    sportsDataPlugin: SportsDataPlugin;
    sportsDataManager: SportsDataManager;
    sportsOracleAgent: SportsOracleAgent;
    sportsSentinelAgent: SportsSentinelAgent;
}): MCPServerRegistry;
export declare const defaultMCPServerConfig: MCPServerRegistryConfig;
//# sourceMappingURL=mcp-server-registry.d.ts.map