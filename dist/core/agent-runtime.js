"use strict";
/**
 * AgentRuntime Implementation
 *
 * Sandboxed runtime environment for executing agents
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
class AgentRuntime {
    agents = new Map();
    runtimes = new Map();
    logger;
    errorManager;
    eventBus;
    constructor(logger, errorManager, eventBus) {
        this.logger = logger;
        this.errorManager = errorManager;
        this.eventBus = eventBus;
    }
    /**
     * Register a new agent with the runtime
     */
    async registerAgent(agent) {
        this.logger.info(`Registering agent: ${agent.id}`, { agentType: agent.type });
        // Validate agent configuration
        this.validateAgent(agent);
        // Create runtime environment
        const runtime = await this.createRuntime(agent);
        // Store agent and runtime
        this.agents.set(agent.id, agent);
        this.runtimes.set(agent.id, runtime);
        // Initialize agent in runtime
        await this.initializeAgent(agent, runtime);
        // Emit registration event
        await this.eventBus.emit({
            type: 'agent.registered',
            agentId: agent.id,
            timestamp: new Date(),
            data: { agentType: agent.type }
        });
        this.logger.info(`Agent registered successfully: ${agent.id}`);
    }
    /**
     * Unregister an agent from the runtime
     */
    async unregisterAgent(agentId) {
        this.logger.info(`Unregistering agent: ${agentId}`);
        const agent = this.agents.get(agentId);
        const runtime = this.runtimes.get(agentId);
        if (!agent || !runtime) {
            throw this.errorManager.createAgentError('AGENT_NOT_FOUND', `Agent ${agentId} not found in runtime`, agentId, 'low');
        }
        // Stop agent if running
        if (runtime.status === 'running') {
            await this.stopAgent(agentId);
        }
        // Clean up runtime
        await this.destroyRuntime(agentId);
        // Remove from maps
        this.agents.delete(agentId);
        this.runtimes.delete(agentId);
        // Emit unregistration event
        await this.eventBus.emit({
            type: 'agent.unregistered',
            agentId,
            timestamp: new Date(),
            data: {}
        });
        this.logger.info(`Agent unregistered successfully: ${agentId}`);
    }
    /**
     * Start an agent
     */
    async startAgent(agentId) {
        const agent = this.agents.get(agentId);
        const runtime = this.runtimes.get(agentId);
        if (!agent || !runtime) {
            throw this.errorManager.createAgentError('AGENT_NOT_FOUND', `Agent ${agentId} not found`, agentId, 'medium');
        }
        if (runtime.status === 'running') {
            this.logger.warn(`Agent ${agentId} is already running`);
            return;
        }
        this.logger.info(`Starting agent: ${agentId}`);
        try {
            // Update status
            runtime.status = 'starting';
            // Start agent process
            await this.executeInRuntime(runtime, async () => {
                await agent.start?.();
            });
            // Update status
            runtime.status = 'running';
            runtime.startTime = new Date();
            // Start heartbeat
            this.startHeartbeat(agentId);
            // Emit start event
            await this.eventBus.emit({
                type: 'agent.started',
                agentId,
                timestamp: new Date(),
                data: {}
            });
            this.logger.info(`Agent started successfully: ${agentId}`);
        }
        catch (error) {
            runtime.status = 'error';
            const agentError = this.errorManager.createAgentError('AGENT_START_FAILED', `Failed to start agent: ${error instanceof Error ? error.message : String(error)}`, agentId, 'high');
            this.errorManager.handleError(agentError);
            await this.eventBus.emit({
                type: 'agent.error',
                agentId,
                timestamp: new Date(),
                data: { error: agentError }
            });
            throw agentError;
        }
    }
    /**
     * Stop an agent
     */
    async stopAgent(agentId) {
        const agent = this.agents.get(agentId);
        const runtime = this.runtimes.get(agentId);
        if (!agent || !runtime) {
            throw this.errorManager.createAgentError('AGENT_NOT_FOUND', `Agent ${agentId} not found`, agentId, 'medium');
        }
        if (runtime.status !== 'running') {
            this.logger.warn(`Agent ${agentId} is not running`);
            return;
        }
        this.logger.info(`Stopping agent: ${agentId}`);
        try {
            // Update status
            runtime.status = 'stopping';
            // Stop heartbeat
            this.stopHeartbeat(agentId);
            // Stop agent process
            await this.executeInRuntime(runtime, async () => {
                await agent.stop?.();
            });
            // Update status
            runtime.status = 'stopped';
            runtime.stopTime = new Date();
            // Emit stop event
            await this.eventBus.emit({
                type: 'agent.stopped',
                agentId,
                timestamp: new Date(),
                data: {}
            });
            this.logger.info(`Agent stopped successfully: ${agentId}`);
        }
        catch (error) {
            runtime.status = 'error';
            const agentError = this.errorManager.createAgentError('AGENT_STOP_FAILED', `Failed to stop agent: ${error instanceof Error ? error.message : String(error)}`, agentId, 'high');
            this.errorManager.handleError(agentError);
            throw agentError;
        }
    }
    /**
     * Execute a task on an agent
     */
    async executeTask(agentId, task, context) {
        const agent = this.agents.get(agentId);
        const runtime = this.runtimes.get(agentId);
        if (!agent || !runtime) {
            throw this.errorManager.createAgentError('AGENT_NOT_FOUND', `Agent ${agentId} not found`, agentId, 'medium');
        }
        if (runtime.status !== 'running') {
            throw this.errorManager.createAgentError('AGENT_NOT_RUNNING', `Agent ${agentId} is not running`, agentId, 'medium');
        }
        this.logger.debug(`Executing task on agent: ${agentId}`, { task });
        try {
            const result = await this.executeInRuntime(runtime, async () => {
                return await agent.execute(task, context);
            });
            this.logger.debug(`Task executed successfully on agent: ${agentId}`, { result });
            return result;
        }
        catch (error) {
            const agentError = this.errorManager.createAgentError('AGENT_EXECUTION_FAILED', `Agent execution failed: ${error instanceof Error ? error.message : String(error)}`, agentId, 'high');
            this.errorManager.handleError(agentError);
            throw agentError;
        }
    }
    /**
     * Get agent status and metrics
     */
    getAgentStatus(agentId) {
        const runtime = this.runtimes.get(agentId);
        if (!runtime)
            return null;
        return runtime.status === 'registered' ? 'idle' : runtime.status;
    }
    /**
     * Get all registered agents
     */
    getRegisteredAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get health status of the runtime
     */
    getHealthStatus() {
        return {
            status: this.agents.size > 0 ? 'running' : 'idle',
            agentCount: this.agents.size,
            runningAgents: Array.from(this.runtimes.values()).filter(r => r.status === 'running').length,
            totalRequests: Array.from(this.runtimes.values()).reduce((sum, r) => sum + r.metrics.executionCount, 0),
            uptime: Date.now() - this.startTime,
            memory: process.memoryUsage()
        };
    }
    /**
     * Event listener method for EventBus compatibility
     */
    on(event, callback) {
        // Delegate to EventBus - simplified implementation
        this.eventBus.subscribe(event, callback);
    }
    /**
     * Cleanup method
     */
    async cleanup() {
        // Stop all agents
        for (const [agentId, runtime] of this.runtimes) {
            if (runtime.status === 'running') {
                try {
                    await this.stopAgent(agentId);
                }
                catch (error) {
                    this.logger.error(`Failed to stop agent ${agentId} during cleanup:`, error);
                }
            }
        }
        // Clear intervals
        for (const interval of this.heartbeatIntervals.values()) {
            clearInterval(interval);
        }
        this.heartbeatIntervals.clear();
        // Clear maps
        this.agents.clear();
        this.runtimes.clear();
    }
    startTime = Date.now();
    validateAgent(agent) {
        if (!agent.id) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Agent ID is required', 'validation', 'high');
        }
        if (!agent.type) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Agent type is required', 'validation', 'high');
        }
        if (!agent.execute) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Agent must have an execute method', 'validation', 'high');
        }
    }
    async createRuntime(agent) {
        // In a full implementation, this would create a sandboxed environment
        // For now, we'll create a basic runtime instance
        return {
            agentId: agent.id,
            status: 'registered',
            environment: this.createEnvironment(agent),
            securityPolicy: this.createSecurityPolicy(agent),
            metrics: {
                executionCount: 0,
                successRate: 0,
                averageExecutionTime: 0,
                lastExecuted: undefined,
                lastExecutionTime: undefined,
                errorCount: 0,
                uptime: 0,
                memoryUsage: 0,
                cpuUsage: 0
            },
            startTime: null,
            stopTime: null,
            lastHeartbeat: null
        };
    }
    createEnvironment(agent) {
        return {
            runtime: 'nodejs',
            version: process.version,
            resources: {
                maxMemory: 128, // MB
                maxCpu: 0.5, // CPU cores
                timeout: 30000 // ms
            },
            variables: agent.config?.environment || {},
            allowedModules: []
        };
    }
    createSecurityPolicy(_agent) {
        return {
            sandboxed: true,
            allowNetworkAccess: false,
            allowFileSystemAccess: false,
            allowedDomains: [],
            allowedPaths: []
        };
    }
    async initializeAgent(agent, runtime) {
        if (agent.initialize) {
            await this.executeInRuntime(runtime, async () => {
                await agent.initialize();
            });
        }
    }
    async executeInRuntime(runtime, fn) {
        // In a full implementation, this would execute in a sandboxed environment
        // For now, we'll execute directly but with timeout and error handling
        const timeout = runtime.environment.resources.timeout;
        const startTime = Date.now();
        try {
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Execution timeout')), timeout);
                })
            ]);
            // Update metrics
            const executionTime = Date.now() - startTime;
            runtime.metrics.executionCount++;
            runtime.metrics.lastExecutionTime = new Date();
            runtime.metrics.averageExecutionTime =
                (runtime.metrics.averageExecutionTime + executionTime) / 2;
            return result;
        }
        catch (error) {
            runtime.metrics.errorCount++;
            throw error instanceof Error ? error : new Error(String(error));
        }
    }
    async destroyRuntime(agentId) {
        // Clean up runtime resources
        const runtime = this.runtimes.get(agentId);
        if (runtime) {
            this.stopHeartbeat(agentId);
            // Additional cleanup would go here
        }
    }
    heartbeatIntervals = new Map();
    startHeartbeat(agentId) {
        const interval = setInterval(async () => {
            const runtime = this.runtimes.get(agentId);
            if (runtime && runtime.status === 'running') {
                runtime.lastHeartbeat = new Date();
                await this.eventBus.emit({
                    type: 'agent.heartbeat',
                    agentId,
                    timestamp: new Date(),
                    data: {
                        status: runtime.status,
                        metrics: runtime.metrics
                    }
                });
            }
        }, 30000); // 30 second heartbeat
        this.heartbeatIntervals.set(agentId, interval);
    }
    stopHeartbeat(agentId) {
        const interval = this.heartbeatIntervals.get(agentId);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(agentId);
        }
    }
}
exports.AgentRuntime = AgentRuntime;
//# sourceMappingURL=agent-runtime.js.map