"use strict";
/**
 * SportIntel MCP Server Registry
 *
 * Central registry for all SportIntel MCP servers that integrates with
 * OpenConductor's ToolRegistry for unified tool execution and management.
 *
 * This registry provides the bridge between MCP servers and OpenConductor's
 * enterprise-grade tool management capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMCPServerConfig = exports.MCPServerRegistry = void 0;
exports.createMCPServerRegistry = createMCPServerRegistry;
// Import MCP servers
const sports_data_server_1 = require("./sports-data-server");
const ml_pipeline_server_1 = require("./ml-pipeline-server");
const analytics_server_1 = require("./analytics-server");
const alerts_server_1 = require("./alerts-server");
class MCPServerRegistry {
    toolRegistry;
    eventBus;
    logger;
    config;
    // MCP Server instances
    sportsDataServer;
    mlPipelineServer;
    analyticsServer;
    alertsServer;
    // Dependencies
    sportsDataPlugin;
    sportsDataManager;
    sportsOracleAgent;
    sportsSentinelAgent;
    // Registry state
    registeredTools = new Map();
    serverStatus = new Map();
    healthCheckInterval;
    constructor(config, toolRegistry, eventBus, logger, dependencies) {
        this.config = config;
        this.toolRegistry = toolRegistry;
        this.eventBus = eventBus;
        this.logger = logger;
        this.sportsDataPlugin = dependencies.sportsDataPlugin;
        this.sportsDataManager = dependencies.sportsDataManager;
        this.sportsOracleAgent = dependencies.sportsOracleAgent;
        this.sportsSentinelAgent = dependencies.sportsSentinelAgent;
    }
    /**
     * Initialize and start all MCP servers
     */
    async initialize() {
        if (!this.config.enabled) {
            this.logger.info('MCP Server Registry disabled');
            return;
        }
        this.logger.info('Initializing SportIntel MCP Server Registry...');
        try {
            // Create MCP server instances
            await this.createMCPServers();
            // Register tools with OpenConductor ToolRegistry
            if (this.config.toolRegistration.enabled) {
                await this.registerToolsWithOpenConductor();
            }
            // Start servers if auto-start is enabled
            if (this.config.autoStart) {
                await this.startAllServers();
            }
            // Set up health monitoring
            this.startHealthMonitoring();
            // Emit initialization event
            await this.eventBus.emit({
                type: 'mcp.registry.initialized',
                timestamp: new Date(),
                data: {
                    serversEnabled: this.getEnabledServers().length,
                    toolsRegistered: this.registeredTools.size,
                    autoStart: this.config.autoStart
                }
            });
            this.logger.info('SportIntel MCP Server Registry initialized successfully', {
                enabledServers: this.getEnabledServers(),
                registeredTools: this.registeredTools.size
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize MCP Server Registry', error);
            throw error;
        }
    }
    /**
     * Create MCP server instances based on configuration
     */
    async createMCPServers() {
        // Sports Data MCP Server
        if (this.config.servers.sportsData.enabled) {
            this.logger.debug('Creating Sports Data MCP Server');
            this.sportsDataServer = (0, sports_data_server_1.createSportsDataMCPServer)(this.config.servers.sportsData, this.sportsDataPlugin, this.sportsDataManager, this.eventBus, this.logger);
            this.serverStatus.set('sportsData', 'created');
        }
        // ML Pipeline MCP Server
        if (this.config.servers.mlPipeline.enabled) {
            this.logger.debug('Creating ML Pipeline MCP Server');
            this.mlPipelineServer = (0, ml_pipeline_server_1.createMLPipelineMCPServer)(this.config.servers.mlPipeline, this.eventBus, this.sportsOracleAgent, this.logger);
            this.serverStatus.set('mlPipeline', 'created');
        }
        // Analytics MCP Server
        if (this.config.servers.analytics.enabled) {
            this.logger.debug('Creating Analytics MCP Server');
            this.analyticsServer = (0, analytics_server_1.createAnalyticsMCPServer)(this.config.servers.analytics, this.eventBus, this.sportsDataManager, this.logger);
            this.serverStatus.set('analytics', 'created');
        }
        // Alerts MCP Server
        if (this.config.servers.alerts.enabled) {
            this.logger.debug('Creating Alerts MCP Server');
            this.alertsServer = (0, alerts_server_1.createAlertsMCPServer)(this.config.servers.alerts, this.eventBus, this.sportsSentinelAgent, this.logger);
            this.serverStatus.set('alerts', 'created');
        }
    }
    /**
     * Register MCP server tools with OpenConductor's ToolRegistry
     */
    async registerToolsWithOpenConductor() {
        this.logger.info('Registering MCP tools with OpenConductor ToolRegistry...');
        const toolRegistrations = [
            {
                server: 'sportsData',
                tools: this.getSportsDataTools(),
                category: 'data'
            },
            {
                server: 'mlPipeline',
                tools: this.getMLPipelineTools(),
                category: 'ai'
            },
            {
                server: 'analytics',
                tools: this.getAnalyticsTools(),
                category: 'workflow'
            },
            {
                server: 'alerts',
                tools: this.getAlertsTools(),
                category: 'monitoring'
            }
        ];
        for (const { server, tools, category } of toolRegistrations) {
            if (!this.isServerEnabled(server))
                continue;
            for (const mcpTool of tools) {
                try {
                    // Create OpenConductor Tool wrapper for MCP tool
                    const tool = {
                        id: `${this.config.toolRegistration.namePrefix}${server}_${mcpTool.name}`,
                        name: `${this.config.toolRegistration.namePrefix}${mcpTool.name}`,
                        description: mcpTool.description,
                        category,
                        version: '1.0.0',
                        metadata: {
                            mcpServer: server,
                            mcpToolName: mcpTool.name,
                            originalSchema: mcpTool.inputSchema,
                            tags: ['sportintel', 'mcp', server]
                        },
                        // Execution wrapper that calls the MCP server
                        execute: async (input, context) => {
                            return await this.executeMCPTool(server, mcpTool.name, input, context);
                        },
                        // Validation based on MCP tool schema
                        validate: (input) => {
                            return this.validateMCPToolInput(mcpTool.inputSchema, input);
                        }
                    };
                    // Register with OpenConductor ToolRegistry
                    await this.toolRegistry.registerTool(tool, {
                        timeout: 30000,
                        rateLimit: {
                            requestsPerSecond: 10,
                            burstCapacity: 50,
                            maxRequests: 1000,
                            windowMs: 60000
                        }
                    });
                    this.registeredTools.set(tool.id, tool);
                    this.logger.debug('Registered MCP tool', {
                        toolId: tool.id,
                        mcpServer: server,
                        category
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to register MCP tool ${mcpTool.name}`, error);
                }
            }
        }
        this.logger.info('MCP tools registered with OpenConductor', {
            totalTools: this.registeredTools.size,
            categories: Array.from(new Set(toolRegistrations.map(r => r.category)))
        });
    }
    /**
     * Execute MCP tool through the appropriate server
     */
    async executeMCPTool(serverName, toolName, input, context) {
        const server = this.getServerInstance(serverName);
        if (!server) {
            throw new Error(`MCP server ${serverName} not available`);
        }
        // Emit execution start event
        await this.eventBus.emit({
            type: 'mcp.tool.execution.started',
            timestamp: new Date(),
            data: {
                serverName,
                toolName,
                input,
                context
            }
        });
        try {
            const startTime = Date.now();
            // Execute the MCP tool (simplified - in production would use MCP protocol)
            const result = await this.callMCPServerTool(server, toolName, input);
            const executionTime = Date.now() - startTime;
            // Emit execution completed event
            await this.eventBus.emit({
                type: 'mcp.tool.execution.completed',
                timestamp: new Date(),
                data: {
                    serverName,
                    toolName,
                    executionTime,
                    success: true
                }
            });
            this.logger.debug('MCP tool executed successfully', {
                serverName,
                toolName,
                executionTime
            });
            return result;
        }
        catch (error) {
            // Emit execution failed event
            await this.eventBus.emit({
                type: 'mcp.tool.execution.failed',
                timestamp: new Date(),
                data: {
                    serverName,
                    toolName,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
            this.logger.error('MCP tool execution failed', error);
            throw error;
        }
    }
    /**
     * Call MCP server tool (simplified implementation)
     */
    async callMCPServerTool(server, toolName, input) {
        // This is a simplified implementation - in production, would use proper MCP protocol
        // For now, we'll simulate the call
        if (typeof server.handleToolCall === 'function') {
            return await server.handleToolCall(toolName, input);
        }
        else {
            // Fallback to direct method call if available
            const methodName = `handle${toolName.charAt(0).toUpperCase()}${toolName.slice(1).replace(/_(.)/g, (_, char) => char.toUpperCase())}`;
            if (typeof server[methodName] === 'function') {
                const result = await server[methodName](input);
                return result.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;
            }
        }
        throw new Error(`Tool ${toolName} not found on server`);
    }
    /**
     * Validate MCP tool input against schema
     */
    validateMCPToolInput(schema, input) {
        // Simplified validation - in production would use proper JSON schema validation
        const required = schema.required || [];
        const errors = [];
        for (const field of required) {
            if (!(field in input) || input[field] === undefined || input[field] === null) {
                errors.push(`Required field '${field}' is missing`);
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    /**
     * Start all enabled MCP servers
     */
    async startAllServers() {
        this.logger.info('Starting MCP servers...');
        const startPromises = [];
        if (this.sportsDataServer) {
            startPromises.push(this.sportsDataServer.start().then(() => {
                this.serverStatus.set('sportsData', 'running');
            }));
        }
        if (this.mlPipelineServer) {
            startPromises.push(this.mlPipelineServer.start().then(() => {
                this.serverStatus.set('mlPipeline', 'running');
            }));
        }
        if (this.analyticsServer) {
            startPromises.push(this.analyticsServer.start().then(() => {
                this.serverStatus.set('analytics', 'running');
            }));
        }
        if (this.alertsServer) {
            startPromises.push(this.alertsServer.start().then(() => {
                this.serverStatus.set('alerts', 'running');
            }));
        }
        await Promise.all(startPromises);
        // Emit servers started event
        await this.eventBus.emit({
            type: 'mcp.servers.started',
            timestamp: new Date(),
            data: {
                runningServers: this.getRunningServers(),
                totalServers: this.getEnabledServers().length
            }
        });
        this.logger.info('MCP servers started successfully', {
            runningServers: this.getRunningServers()
        });
    }
    /**
     * Stop all MCP servers
     */
    async stopAllServers() {
        this.logger.info('Stopping MCP servers...');
        const stopPromises = [];
        if (this.sportsDataServer) {
            stopPromises.push(this.sportsDataServer.stop().then(() => {
                this.serverStatus.set('sportsData', 'stopped');
            }));
        }
        if (this.mlPipelineServer) {
            stopPromises.push(this.mlPipelineServer.stop().then(() => {
                this.serverStatus.set('mlPipeline', 'stopped');
            }));
        }
        if (this.analyticsServer) {
            stopPromises.push(this.analyticsServer.stop().then(() => {
                this.serverStatus.set('analytics', 'stopped');
            }));
        }
        if (this.alertsServer) {
            stopPromises.push(this.alertsServer.stop().then(() => {
                this.serverStatus.set('alerts', 'stopped');
            }));
        }
        await Promise.all(stopPromises);
        // Stop health monitoring
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.logger.info('MCP servers stopped successfully');
    }
    /**
     * Get health status of all MCP servers
     */
    getHealthStatus() {
        const serverHealth = {};
        for (const [serverName, status] of this.serverStatus) {
            serverHealth[serverName] = {
                status,
                enabled: this.isServerEnabled(serverName),
                tools: this.getToolCountForServer(serverName)
            };
        }
        return {
            overall: this.getOverallHealth(),
            servers: serverHealth,
            registeredTools: this.registeredTools.size,
            activeServers: this.getRunningServers().length,
            enabledServers: this.getEnabledServers().length
        };
    }
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                const health = this.getHealthStatus();
                await this.eventBus.emit({
                    type: 'mcp.registry.health',
                    timestamp: new Date(),
                    data: health
                });
            }
            catch (error) {
                this.logger.error('Health monitoring failed', error);
            }
        }, this.config.healthCheckIntervalMs);
    }
    // Helper methods
    getEnabledServers() {
        return Object.entries(this.config.servers)
            .filter(([_, config]) => config.enabled)
            .map(([name, _]) => name);
    }
    getRunningServers() {
        return Array.from(this.serverStatus.entries())
            .filter(([_, status]) => status === 'running')
            .map(([name, _]) => name);
    }
    isServerEnabled(serverName) {
        return this.config.servers[serverName]?.enabled || false;
    }
    getServerInstance(serverName) {
        switch (serverName) {
            case 'sportsData': return this.sportsDataServer;
            case 'mlPipeline': return this.mlPipelineServer;
            case 'analytics': return this.analyticsServer;
            case 'alerts': return this.alertsServer;
            default: return null;
        }
    }
    getOverallHealth() {
        const runningCount = this.getRunningServers().length;
        const enabledCount = this.getEnabledServers().length;
        if (runningCount === enabledCount && enabledCount > 0)
            return 'healthy';
        if (runningCount > 0)
            return 'degraded';
        return 'unhealthy';
    }
    getToolCountForServer(serverName) {
        return Array.from(this.registeredTools.values())
            .filter(tool => tool.metadata?.mcpServer === serverName)
            .length;
    }
    // Tool definition methods (simplified)
    getSportsDataTools() {
        return [
            { name: 'get_player_stats', description: 'Get player statistics' },
            { name: 'get_game_data', description: 'Get game data' },
            { name: 'get_injury_reports', description: 'Get injury reports' },
            { name: 'search_players', description: 'Search players' }
        ];
    }
    getMLPipelineTools() {
        return [
            { name: 'predict_player_performance', description: 'Predict player performance' },
            { name: 'optimize_lineup', description: 'Optimize DFS lineups' },
            { name: 'explain_prediction', description: 'Explain predictions' },
            { name: 'train_model', description: 'Train ML models' }
        ];
    }
    getAnalyticsTools() {
        return [
            { name: 'analyze_player_trends', description: 'Analyze player trends' },
            { name: 'create_dashboard', description: 'Create analytics dashboard' },
            { name: 'generate_report', description: 'Generate reports' },
            { name: 'query_timeseries_data', description: 'Query time-series data' }
        ];
    }
    getAlertsTools() {
        return [
            { name: 'create_alert_rule', description: 'Create alert rules' },
            { name: 'monitor_injury_reports', description: 'Monitor injuries' },
            { name: 'get_active_alerts', description: 'Get active alerts' },
            { name: 'acknowledge_alert', description: 'Acknowledge alerts' }
        ];
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.stopAllServers();
        // Unregister tools from OpenConductor
        for (const toolId of this.registeredTools.keys()) {
            try {
                await this.toolRegistry.unregisterTool(toolId);
            }
            catch (error) {
                this.logger.warn(`Failed to unregister tool ${toolId}`, error);
            }
        }
        this.registeredTools.clear();
        this.serverStatus.clear();
    }
}
exports.MCPServerRegistry = MCPServerRegistry;
// Factory function for easy instantiation
function createMCPServerRegistry(config, toolRegistry, eventBus, logger, dependencies) {
    return new MCPServerRegistry(config, toolRegistry, eventBus, logger, dependencies);
}
// Default configuration
exports.defaultMCPServerConfig = {
    enabled: true,
    autoStart: true,
    healthCheckIntervalMs: 30000,
    toolRegistration: {
        enabled: true,
        categoryPrefix: 'sportintel_',
        namePrefix: 'si_'
    },
    servers: {
        sportsData: {
            enabled: true,
            name: 'SportIntel Data Server',
            version: '1.0.0',
            maxConcurrentRequests: 50,
            cacheTTL: 300,
            costOptimization: {
                enabled: true,
                dailyBudget: 150,
                warningThreshold: 0.8
            },
            realTimeUpdates: {
                enabled: true,
                updateIntervalMs: 1000,
                maxSubscriptions: 100
            }
        },
        mlPipeline: {
            enabled: true,
            name: 'SportIntel ML Pipeline',
            version: '1.0.0',
            modelRegistry: {
                enabled: true,
                modelsPath: './models',
                maxModels: 10
            },
            inference: {
                maxConcurrentInference: 20,
                timeoutMs: 30000,
                batchSize: 10
            },
            explainability: {
                enabled: true,
                methods: ['shap', 'lime'],
                maxExplanations: 100
            },
            performance: {
                enableMetrics: true,
                enableProfiling: true
            }
        },
        analytics: {
            enabled: true,
            name: 'SportIntel Analytics',
            version: '1.0.0',
            visualization: {
                enabled: true,
                maxCharts: 50,
                exportFormats: ['png', 'svg', 'json']
            },
            reporting: {
                enabled: true,
                maxReports: 20,
                scheduleEnabled: true
            },
            realTimeAnalytics: {
                enabled: true,
                updateIntervalMs: 5000,
                maxDashboards: 10
            },
            performance: {
                cacheResults: true,
                cacheTTL: 300,
                maxQueryTime: 30000
            }
        },
        alerts: {
            enabled: true,
            name: 'SportIntel Alerts',
            version: '1.0.0',
            realTime: {
                enabled: true,
                processingTimeoutMs: 5000,
                maxConcurrentAlerts: 100
            },
            notifications: {
                channels: ['webhook', 'email'],
                rateLimits: { webhook: 60, email: 10 },
                priorities: ['low', 'medium', 'high', 'critical']
            },
            monitoring: {
                enabled: true,
                healthCheckIntervalMs: 15000,
                alertThresholds: { error_rate: 0.05, response_time: 1000 }
            },
            delivery: {
                retryAttempts: 3,
                retryDelayMs: 1000,
                batchingEnabled: true,
                batchSize: 10
            }
        }
    }
};
//# sourceMappingURL=mcp-server-registry.js.map