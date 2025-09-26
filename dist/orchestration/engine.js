"use strict";
/**
 * OrchestrationEngine Implementation
 *
 * Workflow orchestration and execution engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestrationEngineImpl = void 0;
class OrchestrationEngineImpl {
    workflows = new Map();
    executions = new Map();
    agents = new Map();
    logger;
    errorManager;
    eventBus;
    initialized = false;
    running = false;
    constructor(logger, errorManager, eventBus) {
        this.logger = logger;
        this.errorManager = errorManager;
        this.eventBus = eventBus;
    }
    // Component lifecycle methods
    async initialize() {
        if (this.initialized)
            return;
        this.logger.info('Initializing orchestration engine');
        this.initialized = true;
    }
    async start() {
        if (!this.initialized)
            await this.initialize();
        if (this.running)
            return;
        this.logger.info('Starting orchestration engine');
        this.running = true;
    }
    async stop() {
        if (!this.running)
            return;
        this.logger.info('Stopping orchestration engine');
        this.running = false;
    }
    /**
     * Register an agent with the orchestration engine
     */
    async registerAgent(agent) {
        this.agents.set(agent.id, agent);
        this.logger.info(`Agent registered with orchestration engine: ${agent.id}`);
    }
    /**
     * Unregister an agent
     */
    async unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.logger.info(`Agent unregistered from orchestration engine: ${agentId}`);
    }
    /**
     * Create a new workflow
     */
    async createWorkflow(definition) {
        this.logger.info(`Creating workflow: ${definition.id}`, {
            name: definition.name,
            steps: definition.steps.length
        });
        // Validate workflow
        this.validateWorkflow(definition);
        // Store workflow
        this.workflows.set(definition.id, definition);
        // Emit workflow created event
        await this.eventBus.emit({
            type: 'workflow.created',
            workflowId: definition.id,
            timestamp: new Date(),
            data: {
                name: definition.name,
                stepCount: definition.steps.length
            }
        });
        this.logger.info(`Workflow created successfully: ${definition.id}`);
    }
    /**
     * Update an existing workflow
     */
    async updateWorkflow(id, definition) {
        const existing = this.workflows.get(id);
        if (!existing) {
            throw this.errorManager.createOrchestrationError('WORKFLOW_NOT_FOUND', `Workflow ${id} not found`, id, undefined, 'medium');
        }
        const updated = { ...existing, ...definition, id };
        this.workflows.set(id, updated);
        this.logger.info(`Workflow updated: ${id}`);
    }
    /**
     * Get workflow by ID
     */
    async getWorkflow(id) {
        return this.workflows.get(id) || null;
    }
    /**
     * List workflows with optional filtering
     */
    async listWorkflows(filter) {
        let workflows = Array.from(this.workflows.values());
        if (filter) {
            if (filter.author) {
                workflows = workflows.filter(w => w.author === filter.author);
            }
            if (filter.category) {
                workflows = workflows.filter(w => w.category === filter.category);
            }
            if (filter.tags) {
                workflows = workflows.filter(w => filter.tags.some(tag => w.tags?.includes(tag)));
            }
        }
        return workflows;
    }
    /**
     * Execute workflow - main entry point for workflow execution
     */
    async executeWorkflow(workflowId, input, context) {
        return this.startWorkflow(workflowId, input, context);
    }
    /**
     * Start workflow execution
     */
    async startWorkflow(workflowId, input, context) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw this.errorManager.createOrchestrationError('WORKFLOW_NOT_FOUND', `Workflow ${workflowId} not found`, workflowId, undefined, 'medium');
        }
        this.logger.info(`Starting workflow execution: ${workflowId}`);
        const execution = {
            id: this.generateExecutionId(),
            workflowId,
            status: 'running',
            startedAt: new Date(),
            startTime: new Date(),
            completedAt: undefined,
            endTime: undefined,
            duration: undefined,
            input: input || {},
            output: undefined,
            result: undefined,
            context: context || {},
            steps: [],
            stepExecutions: [],
            currentStep: undefined,
            error: undefined,
            metrics: {
                totalSteps: workflow.steps.length,
                completedSteps: 0,
                failedSteps: 0,
                averageStepDuration: undefined,
                resourceUsage: undefined
            },
            events: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Store execution
        this.executions.set(execution.id, execution);
        // Emit workflow started event
        await this.eventBus.emit({
            type: 'workflow.started',
            workflowId,
            timestamp: new Date(),
            data: { executionId: execution.id }
        });
        // Start executing steps
        this.executeWorkflowSteps(execution, workflow).catch(error => {
            this.logger.error(`Workflow execution failed: ${workflowId}`, error);
        });
        return execution;
    }
    /**
     * Pause workflow execution
     */
    async pauseExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw this.errorManager.createOrchestrationError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`, undefined, undefined, 'medium');
        }
        if (execution.status !== 'running') {
            this.logger.warn(`Cannot pause execution ${executionId}: status is ${execution.status}`);
            return;
        }
        execution.status = 'paused';
        this.logger.info(`Workflow execution paused: ${executionId}`);
    }
    /**
     * Resume workflow execution
     */
    async resumeExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw this.errorManager.createOrchestrationError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`, undefined, undefined, 'medium');
        }
        if (execution.status !== 'paused') {
            this.logger.warn(`Cannot resume execution ${executionId}: status is ${execution.status}`);
            return;
        }
        execution.status = 'running';
        this.logger.info(`Workflow execution resumed: ${executionId}`);
    }
    /**
     * Cancel workflow execution
     */
    async cancelExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw this.errorManager.createOrchestrationError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`, undefined, undefined, 'medium');
        }
        if (!['running', 'paused'].includes(execution.status)) {
            this.logger.warn(`Cannot cancel execution ${executionId}: status is ${execution.status}`);
            return;
        }
        execution.status = 'cancelled';
        execution.completedAt = new Date();
        execution.endTime = new Date();
        this.logger.info(`Workflow execution cancelled: ${executionId}`);
    }
    /**
     * Stop workflow execution
     */
    async stopWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw this.errorManager.createOrchestrationError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`, undefined, undefined, 'medium');
        }
        if (execution.status !== 'running') {
            this.logger.warn(`Cannot stop execution ${executionId}: status is ${execution.status}`);
            return;
        }
        this.logger.info(`Stopping workflow execution: ${executionId}`);
        execution.status = 'cancelled';
        execution.endTime = new Date();
        // Emit workflow cancelled event
        await this.eventBus.emit({
            type: 'workflow.cancelled',
            workflowId: execution.workflowId,
            timestamp: new Date(),
            data: { executionId }
        });
        this.logger.info(`Workflow execution stopped: ${executionId}`);
    }
    /**
     * Get workflow execution status
     */
    async getExecution(executionId) {
        return this.executions.get(executionId) || null;
    }
    /**
     * List executions with optional filtering
     */
    async listExecutions(filter) {
        let executions = Array.from(this.executions.values());
        if (filter) {
            if (filter.workflowId) {
                executions = executions.filter(e => e.workflowId === filter.workflowId);
            }
            if (filter.status) {
                executions = executions.filter(e => e.status === filter.status);
            }
            if (filter.startedAfter) {
                executions = executions.filter(e => e.startedAt >= filter.startedAfter);
            }
            if (filter.startedBefore) {
                executions = executions.filter(e => e.startedAt <= filter.startedBefore);
            }
            if (filter.limit) {
                executions = executions.slice(0, filter.limit);
            }
            if (filter.offset) {
                executions = executions.slice(filter.offset);
            }
        }
        return executions;
    }
    /**
     * Get execution event logs
     */
    async getExecutionLogs(executionId) {
        const execution = this.executions.get(executionId);
        return execution?.events || [];
    }
    /**
     * Get agent by ID
     */
    async getAgent(agentId) {
        return this.agents.get(agentId) || null;
    }
    /**
     * List all registered agents
     */
    async listAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Subscribe to execution events
     */
    subscribeToExecution(executionId, callback) {
        // Implementation would depend on EventBus capabilities
        this.logger.debug(`Subscribing to execution events: ${executionId}`);
    }
    /**
     * Unsubscribe from execution events
     */
    unsubscribeFromExecution(executionId, callback) {
        // Implementation would depend on EventBus capabilities
        this.logger.debug(`Unsubscribing from execution events: ${executionId}`);
    }
    /**
     * Get health status
     */
    async getHealthStatus() {
        return {
            status: this.running ? 'healthy' : 'unhealthy',
            timestamp: new Date(),
            components: {
                database: 'healthy',
                redis: 'healthy',
                agents: this.agents.size > 0 ? 'healthy' : 'degraded',
                storage: 'healthy'
            },
            metrics: {
                activeExecutions: Array.from(this.executions.values()).filter(e => e.status === 'running').length,
                queuedExecutions: Array.from(this.executions.values()).filter(e => e.status === 'pending').length,
                registeredAgents: this.agents.size,
                uptime: Date.now() // Simplified uptime
            }
        };
    }
    /**
     * Get performance metrics
     */
    async getMetrics() {
        const executions = Array.from(this.executions.values());
        const successful = executions.filter(e => e.status === 'completed').length;
        const failed = executions.filter(e => e.status === 'failed').length;
        const cancelled = executions.filter(e => e.status === 'cancelled').length;
        return {
            timestamp: new Date(),
            executions: {
                total: executions.length,
                successful,
                failed,
                cancelled,
                averageDuration: 0, // Would calculate from execution durations
                throughput: 0 // Would calculate executions per minute
            },
            agents: {
                registered: this.agents.size,
                active: this.agents.size, // Simplified
                averageResponseTime: 0,
                totalRequests: 0,
                errorRate: 0
            },
            resources: {
                cpu: 0,
                memory: 0,
                storage: 0,
                networkIO: 0
            },
            queues: {
                pending: executions.filter(e => e.status === 'pending').length,
                processing: executions.filter(e => e.status === 'running').length,
                failed: failed,
                avgWaitTime: 0
            }
        };
    }
    /**
     * Event listener method for compatibility with conductor
     */
    on(event, callback) {
        // Simple implementation - in production would use EventBus subscription
        this.logger.debug(`Orchestration engine subscribing to event: ${event}`);
        // Would delegate to EventBus in real implementation
    }
    /**
     * Delete a workflow
     */
    async deleteWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw this.errorManager.createOrchestrationError('WORKFLOW_NOT_FOUND', `Workflow ${workflowId} not found`, workflowId, undefined, 'low');
        }
        // Check if there are running executions
        const runningExecutions = this.getWorkflowExecutions(workflowId)
            .filter(execution => execution.status === 'running');
        if (runningExecutions.length > 0) {
            throw this.errorManager.createOrchestrationError('WORKFLOW_ACTIVE_EXECUTIONS', `Cannot delete workflow ${workflowId}: has ${runningExecutions.length} running executions`, workflowId, undefined, 'medium');
        }
        // Delete workflow
        this.workflows.delete(workflowId);
        this.logger.info(`Workflow deleted: ${workflowId}`);
    }
    /**
     * Execute workflow steps
     */
    async executeWorkflowSteps(execution, workflow) {
        try {
            this.logger.info(`Executing workflow: ${workflow.id}`, {
                executionId: execution.id,
                steps: workflow.steps.length
            });
            // Execute steps sequentially
            for (let i = 0; i < workflow.steps.length; i++) {
                if (execution.status !== 'running') {
                    break; // Execution was cancelled or paused
                }
                const step = workflow.steps[i];
                if (!step) {
                    throw new Error(`Step at index ${i} is undefined`);
                }
                execution.currentStep = step.id;
                await this.executeStep(execution, step, i);
                // Check if step failed and should stop execution
                const stepExecution = execution.stepExecutions[i];
                if (stepExecution && stepExecution.status === 'failed' && step.continueOnError !== true) {
                    throw new Error(`Step ${step.id} failed: ${stepExecution.error?.message}`);
                }
                // Update metrics
                execution.metrics.completedSteps = execution.stepExecutions.filter(se => se.status === 'completed').length;
                execution.metrics.failedSteps = execution.stepExecutions.filter(se => se.status === 'failed').length;
            }
            // All steps completed successfully
            execution.status = 'completed';
            execution.completedAt = new Date();
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startedAt.getTime();
            // Collect results from step executions
            execution.result = {
                success: true,
                outputs: execution.stepExecutions.map(se => se.output).filter(Boolean),
                metadata: {
                    executionTime: execution.duration,
                    stepsExecuted: execution.stepExecutions.length,
                    stepsSucceeded: execution.stepExecutions.filter(se => se.status === 'completed').length,
                    stepsFailed: execution.stepExecutions.filter(se => se.status === 'failed').length
                }
            };
            execution.output = execution.result;
            // Add completion event
            const completionEvent = {
                id: this.generateEventId(),
                type: 'completed',
                timestamp: new Date(),
                data: { result: execution.result }
            };
            execution.events.push(completionEvent);
            // Emit workflow completed event
            await this.eventBus.emit({
                type: 'workflow.completed',
                workflowId: workflow.id,
                timestamp: new Date(),
                data: {
                    executionId: execution.id,
                    result: execution.result
                }
            });
            this.logger.info(`Workflow execution completed: ${workflow.id}`, {
                executionId: execution.id,
                executionTime: execution.duration
            });
        }
        catch (error) {
            const errorObj = error;
            execution.status = 'failed';
            execution.completedAt = new Date();
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startedAt.getTime();
            execution.error = {
                code: 'WORKFLOW_EXECUTION_FAILED',
                message: errorObj.message,
                timestamp: new Date()
            };
            execution.result = {
                success: false,
                error: errorObj.message,
                outputs: execution.stepExecutions.map(se => se.output).filter(Boolean),
                metadata: {
                    executionTime: execution.duration,
                    stepsExecuted: execution.stepExecutions.length,
                    stepsSucceeded: execution.stepExecutions.filter(se => se.status === 'completed').length,
                    stepsFailed: execution.stepExecutions.filter(se => se.status === 'failed').length
                }
            };
            execution.output = execution.result;
            // Add failure event
            const failureEvent = {
                id: this.generateEventId(),
                type: 'failed',
                timestamp: new Date(),
                message: errorObj.message,
                data: { error: errorObj.message }
            };
            execution.events.push(failureEvent);
            // Emit workflow failed event
            await this.eventBus.emit({
                type: 'workflow.failed',
                workflowId: workflow.id,
                timestamp: new Date(),
                data: {
                    executionId: execution.id,
                    error: errorObj.message
                }
            });
            this.logger.error(`Workflow execution failed: ${workflow.id}`, {
                executionId: execution.id,
                error: errorObj.message
            });
        }
        execution.updatedAt = new Date();
    }
    /**
     * Execute a single workflow step
     */
    async executeStep(execution, step, stepIndex) {
        this.logger.debug(`Executing step: ${step.id}`, {
            executionId: execution.id,
            stepIndex
        });
        const stepExecution = {
            stepId: step.id,
            status: 'running',
            startedAt: new Date(),
            completedAt: undefined,
            duration: undefined,
            input: this.prepareStepInput(execution, step),
            output: undefined,
            error: undefined,
            attempts: 1,
            maxAttempts: step.retryPolicy?.maxRetries || 1,
            agentExecution: undefined
        };
        execution.stepExecutions.push(stepExecution);
        // Add step started event
        const startEvent = {
            id: this.generateEventId(),
            type: 'step-started',
            timestamp: new Date(),
            stepId: step.id,
            data: { stepIndex }
        };
        execution.events.push(startEvent);
        // Emit step started event
        await this.eventBus.emit({
            type: 'step.started',
            workflowId: execution.workflowId,
            timestamp: new Date(),
            data: {
                executionId: execution.id,
                stepId: step.id,
                stepIndex
            }
        });
        try {
            // Get agent for this step - check both agent and agentId fields
            const agentId = step.agent || step.agentId;
            const agent = agentId ? this.agents.get(agentId) : undefined;
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }
            // Execute step with agent
            const output = await agent.execute(stepExecution.input, execution.context);
            stepExecution.status = 'completed';
            stepExecution.completedAt = new Date();
            stepExecution.duration = stepExecution.completedAt.getTime() - stepExecution.startedAt.getTime();
            stepExecution.output = output;
            stepExecution.agentExecution = {
                agentId: agent.id,
                executionId: this.generateEventId(),
                metrics: {}
            };
            // Update execution context with step output
            if (step.outputMapping) {
                for (const [key, path] of Object.entries(step.outputMapping)) {
                    execution.context[key] = this.extractValue(output, path);
                }
            }
            // Add step completed event
            const completedEvent = {
                id: this.generateEventId(),
                type: 'step-completed',
                timestamp: new Date(),
                stepId: step.id,
                agentId: agent.id,
                data: { stepIndex, output }
            };
            execution.events.push(completedEvent);
            // Emit step completed event
            await this.eventBus.emit({
                type: 'step.completed',
                workflowId: execution.workflowId,
                timestamp: new Date(),
                data: {
                    executionId: execution.id,
                    stepId: step.id,
                    stepIndex,
                    output
                }
            });
            this.logger.debug(`Step completed: ${step.id}`, {
                executionId: execution.id,
                stepIndex
            });
        }
        catch (error) {
            const errorObj = error;
            stepExecution.status = 'failed';
            stepExecution.completedAt = new Date();
            stepExecution.duration = stepExecution.completedAt.getTime() - stepExecution.startedAt.getTime();
            stepExecution.error = {
                code: 'STEP_EXECUTION_FAILED',
                message: errorObj.message,
                details: errorObj.stack
            };
            // Add step failed event
            const failedEvent = {
                id: this.generateEventId(),
                type: 'step-failed',
                timestamp: new Date(),
                stepId: step.id,
                message: errorObj.message,
                data: { stepIndex, error: errorObj.message }
            };
            execution.events.push(failedEvent);
            // Emit step failed event
            await this.eventBus.emit({
                type: 'step.failed',
                workflowId: execution.workflowId,
                timestamp: new Date(),
                data: {
                    executionId: execution.id,
                    stepId: step.id,
                    stepIndex,
                    error: errorObj.message
                }
            });
            this.logger.error(`Step failed: ${step.id}`, {
                executionId: execution.id,
                stepIndex,
                error: errorObj.message
            });
            if (!step.continueOnError) {
                throw error;
            }
        }
    }
    validateWorkflow(workflow) {
        if (!workflow.id) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Workflow ID is required', 'validation', 'high');
        }
        if (!workflow.name) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Workflow name is required', 'validation', 'high');
        }
        if (!workflow.steps || workflow.steps.length === 0) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Workflow must have at least one step', 'validation', 'high');
        }
        // Validate each step
        for (const step of workflow.steps) {
            this.validateStep(step);
        }
    }
    validateStep(step) {
        if (!step.id) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Step ID is required', 'validation', 'high');
        }
        const agentId = step.agent || step.agentId;
        if (!agentId) {
            throw this.errorManager.createError('VALIDATION_FAILED', 'Step agent ID is required', 'validation', 'high');
        }
    }
    prepareStepInput(execution, step) {
        let input = step.input || {};
        // Apply input mapping from execution context
        if (step.inputMapping) {
            for (const [key, path] of Object.entries(step.inputMapping)) {
                input[key] = this.extractValue(execution.context, path);
            }
        }
        return input;
    }
    extractValue(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getWorkflowExecutions(workflowId) {
        return Array.from(this.executions.values()).filter(e => e.workflowId === workflowId);
    }
}
exports.OrchestrationEngineImpl = OrchestrationEngineImpl;
//# sourceMappingURL=engine.js.map