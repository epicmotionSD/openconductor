"use strict";
/**
 * OpenConductor Core Engine
 *
 * The central orchestration engine that coordinates all AI agents,
 * workflows, and system components. This is the "conductor" that
 * brings harmony to complex AI agent ecosystems.
 *
 * "The Universal Conductor for Your AI Agents"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenConductor = void 0;
const events_1 = require("events");
const config_manager_1 = require("../utils/config-manager");
const logger_1 = require("../utils/logger");
const error_manager_1 = require("../utils/error-manager");
const agent_runtime_1 = require("./agent-runtime");
const event_bus_1 = require("./event-bus");
const tool_registry_1 = require("./tool-registry");
const plugin_manager_1 = require("./plugin-manager");
const engine_1 = require("../orchestration/engine");
/**
 * OpenConductor Main Class
 *
 * The primary interface for the OpenConductor platform.
 * This class orchestrates all components and provides the main API.
 */
class OpenConductor extends events_1.EventEmitter {
    config;
    logger;
    errorManager;
    // Core components
    agentRuntime;
    eventBus;
    toolRegistry;
    pluginManager;
    orchestrationEngine;
    // State management
    isInitialized = false;
    isStarted = false;
    startTime;
    // Registered components
    agents = new Map();
    workflows = new Map();
    executions = new Map();
    constructor(userConfig) {
        super();
        // Initialize configuration
        this.config = new config_manager_1.ConfigManager(userConfig);
        // Initialize core services
        this.logger = new logger_1.Logger(this.config.get('logging'));
        this.errorManager = new error_manager_1.ErrorManager(this.logger);
        // Initialize components
        this.eventBus = new event_bus_1.EventBusImpl(this.logger, this.errorManager);
        this.agentRuntime = new agent_runtime_1.AgentRuntime(this.logger, this.errorManager, this.eventBus);
        this.toolRegistry = new tool_registry_1.ToolRegistry(this.logger, this.errorManager, this.eventBus);
        this.pluginManager = new plugin_manager_1.PluginManager(this.logger, this.errorManager, this.eventBus);
        this.orchestrationEngine = new engine_1.OrchestrationEngineImpl(this.logger, this.errorManager, this.eventBus);
        this.logger.info('OpenConductor instance created', {
            instanceId: this.config.get('core.instanceId'),
            version: this.config.get('core.version'),
        });
    }
    /**
     * Initialize the OpenConductor platform
     */
    async initialize() {
        if (this.isInitialized) {
            throw new Error('OpenConductor is already initialized');
        }
        this.logger.info('Initializing OpenConductor platform...');
        try {
            // Set up event listeners
            this.setupEventListeners();
            this.isInitialized = true;
            // Emit initialization event
            await this.eventBus.emit({
                type: 'system.initialized',
                timestamp: new Date(),
                data: {
                    instanceId: this.config.get('core.instanceId'),
                    version: this.config.get('core.version'),
                },
            });
            this.logger.info('OpenConductor platform initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize OpenConductor platform', error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'initialization',
                instanceId: this.config.get('core.instanceId')
            });
            this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Start the OpenConductor platform
     */
    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (this.isStarted) {
            throw new Error('OpenConductor is already started');
        }
        this.logger.info('Starting OpenConductor platform...');
        try {
            this.isStarted = true;
            this.startTime = new Date();
            // Emit start event
            await this.eventBus.emit({
                type: 'system.started',
                timestamp: new Date(),
                data: {
                    instanceId: this.config.get('core.instanceId'),
                    startTime: this.startTime,
                },
            });
            this.logger.info('OpenConductor platform started successfully');
            this.emit('started');
        }
        catch (error) {
            this.logger.error('Failed to start OpenConductor platform', error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'startup',
                instanceId: this.config.get('core.instanceId')
            });
            this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Stop the OpenConductor platform
     */
    async stop() {
        if (!this.isStarted) {
            return;
        }
        this.logger.info('Stopping OpenConductor platform...');
        try {
            // Emit stop event
            await this.eventBus.emit({
                type: 'system.stopping',
                timestamp: new Date(),
                data: {
                    instanceId: this.config.get('core.instanceId'),
                    uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
                },
            });
            this.isStarted = false;
            this.startTime = undefined;
            this.logger.info('OpenConductor platform stopped successfully');
            this.emit('stopped');
        }
        catch (error) {
            this.logger.error('Failed to stop OpenConductor platform', error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'shutdown',
                instanceId: this.config.get('core.instanceId')
            });
            this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Gracefully shutdown the OpenConductor platform
     */
    async shutdown() {
        this.logger.info('Shutting down OpenConductor platform...');
        try {
            // Stop the platform
            await this.stop();
            // Cleanup resources
            await this.cleanup();
            this.logger.info('OpenConductor platform shutdown complete');
            this.emit('shutdown');
        }
        catch (error) {
            this.logger.error('Error during shutdown', error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'shutdown'
            });
            await this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Register an agent with the platform
     */
    async registerAgent(agent) {
        this.ensureStarted();
        if (this.agents.has(agent.id)) {
            throw new Error(`Agent already registered: ${agent.id}`);
        }
        try {
            // Register with agent runtime
            await this.agentRuntime.registerAgent(agent);
            // Store agent reference
            this.agents.set(agent.id, agent);
            // Emit registration event
            await this.eventBus.emit({
                type: 'agent.registered',
                agentId: agent.id,
                timestamp: new Date(),
                data: {
                    agentId: agent.id,
                    name: agent.name,
                    type: agent.type,
                    version: agent.version,
                },
            });
            this.logger.info(`Agent registered: ${agent.name} (${agent.id})`);
        }
        catch (error) {
            this.logger.error(`Failed to register agent: ${agent.id}`, error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'agent-registration',
                agentId: agent.id
            });
            this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Unregister an agent from the platform
     */
    async unregisterAgent(agentId) {
        this.ensureStarted();
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        try {
            // Unregister from agent runtime
            await this.agentRuntime.unregisterAgent(agentId);
            // Remove agent reference
            this.agents.delete(agentId);
            // Emit unregistration event
            await this.eventBus.emit({
                type: 'agent.unregistered',
                agentId,
                timestamp: new Date(),
                data: {
                    agentId,
                    name: agent.name,
                },
            });
            this.logger.info(`Agent unregistered: ${agent.name} (${agentId})`);
        }
        catch (error) {
            this.logger.error(`Failed to unregister agent: ${agentId}`, error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'agent-unregistration',
                agentId
            });
            this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Get an agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId) || null;
    }
    /**
     * List all registered agents
     */
    listAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Execute an agent
     */
    async executeAgent(agentId, input) {
        this.ensureStarted();
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        return this.agentRuntime.executeTask(agentId, input);
    }
    /**
     * Create a new workflow
     */
    async createWorkflow(definition) {
        this.ensureStarted();
        if (this.workflows.has(definition.id)) {
            throw new Error(`Workflow already exists: ${definition.id}`);
        }
        try {
            // Create workflow in orchestration engine
            await this.orchestrationEngine.createWorkflow(definition);
            // Store workflow reference
            this.workflows.set(definition.id, definition);
            this.logger.info(`Workflow created: ${definition.name} (${definition.id})`);
        }
        catch (error) {
            this.logger.error(`Failed to create workflow: ${definition.id}`, error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'workflow-creation',
                workflowId: definition.id
            });
            this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Execute a workflow
     */
    async executeWorkflow(workflowId, input) {
        this.ensureStarted();
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        try {
            const execution = await this.orchestrationEngine.startWorkflow(workflowId, input);
            this.executions.set(execution.id, execution);
            return execution;
        }
        catch (error) {
            this.logger.error(`Failed to execute workflow: ${workflowId}`, error);
            const wrappedError = this.errorManager.wrapError(error, {
                context: 'workflow-execution',
                workflowId
            });
            this.errorManager.handleError(wrappedError);
            throw error;
        }
    }
    /**
     * Register a tool
     */
    async registerTool(tool) {
        this.ensureStarted();
        return this.toolRegistry.registerTool(tool);
    }
    /**
     * Install a plugin
     */
    async installPlugin(pluginSource) {
        this.ensureStarted();
        await this.pluginManager.installPlugin(pluginSource);
    }
    /**
     * Get system health status
     */
    async getHealth() {
        const components = {
            conductor: this.isStarted ? 'healthy' : 'unhealthy',
            agentRuntime: await this.agentRuntime.getHealthStatus(),
            orchestrationEngine: await this.orchestrationEngine.getHealthStatus(),
            eventBus: this.eventBus.getHealthStatus ? await this.eventBus.getHealthStatus() : 'running',
            toolRegistry: await this.toolRegistry.getHealthStatus(),
            pluginManager: await this.pluginManager.getHealthStatus(),
        };
        // Determine overall status
        const unhealthyComponents = Object.values(components).filter(status => status === 'unhealthy');
        const degradedComponents = Object.values(components).filter(status => status === 'degraded');
        let overallStatus;
        if (unhealthyComponents.length > 0) {
            overallStatus = 'unhealthy';
        }
        else if (degradedComponents.length > 0) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'healthy';
        }
        return {
            status: overallStatus,
            timestamp: new Date(),
            components,
            metrics: {
                activeAgents: this.agents.size,
                activeWorkflows: this.workflows.size,
                activeExecutions: Array.from(this.executions.values()).filter(e => e.status === 'running').length,
                uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
            },
        };
    }
    /**
     * Get system metrics
     */
    async getMetrics() {
        const runningExecutions = Array.from(this.executions.values()).filter(e => e.status === 'running');
        const completedExecutions = Array.from(this.executions.values()).filter(e => e.status === 'completed');
        return {
            timestamp: new Date(),
            agents: {
                total: this.agents.size,
                active: Array.from(this.agents.values()).filter(a => a.status === 'running').length,
                executing: runningExecutions.length,
            },
            workflows: {
                total: this.workflows.size,
                running: runningExecutions.length,
                completed: completedExecutions.length,
            },
            system: {
                cpu: process.cpuUsage().user / 1000000, // Convert to seconds
                memory: process.memoryUsage().heapUsed,
                uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
            },
        };
    }
    /**
     * Get configuration value
     */
    getConfig(path) {
        return this.config.get(path);
    }
    /**
     * Update configuration
     */
    setConfig(path, value) {
        this.config.set(path, value);
    }
    // Private methods
    setupEventListeners() {
        // Listen for agent events
        this.agentRuntime.on('agent.started', (event) => {
            this.emit('agent.started', event);
        });
        this.agentRuntime.on('agent.completed', (event) => {
            this.emit('agent.completed', event);
        });
        this.agentRuntime.on('agent.failed', (event) => {
            this.emit('agent.failed', event);
        });
        // Listen for workflow events
        this.orchestrationEngine.on('workflow.started', (event) => {
            this.emit('workflow.started', event);
        });
        this.orchestrationEngine.on('workflow.completed', (event) => {
            this.emit('workflow.completed', event);
        });
        this.orchestrationEngine.on('workflow.failed', (event) => {
            this.emit('workflow.failed', event);
        });
        // Listen for error events
        this.errorManager.on('error', (error) => {
            this.emit('error', error);
        });
    }
    async cleanup() {
        try {
            // Clear collections
            this.agents.clear();
            this.workflows.clear();
            this.executions.clear();
            // Cleanup components
            await this.errorManager.cleanup();
            this.isInitialized = false;
        }
        catch (error) {
            this.logger.error('Error during cleanup', error);
            throw error;
        }
    }
    ensureStarted() {
        if (!this.isStarted) {
            throw new Error('OpenConductor is not started. Call start() first.');
        }
    }
    // Helper method for generating event IDs (reserved for future use)
    _generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Getters for component access
    get version() {
        return this.config.get('core.version');
    }
    get instanceId() {
        return this.config.get('core.instanceId');
    }
    get uptime() {
        return this.startTime ? Date.now() - this.startTime.getTime() : 0;
    }
    get isHealthy() {
        return this.isStarted && this.isInitialized;
    }
    // Component accessors (read-only)
    get events() {
        return this.eventBus;
    }
    get tools() {
        return this.toolRegistry;
    }
    get plugins() {
        return this.pluginManager;
    }
    get orchestration() {
        return this.orchestrationEngine;
    }
}
exports.OpenConductor = OpenConductor;
exports.default = OpenConductor;
//# sourceMappingURL=conductor.js.map