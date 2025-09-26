/**
 * OrchestrationEngine Implementation
 * 
 * Workflow orchestration and execution engine
 */

import {
  WorkflowDefinition,
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStatus,
  StepExecution,
  StepStatus,
  OrchestrationContext,
  ExecutionContext,
  WorkflowResult,
  OrchestrationEngine,
  WorkflowFilter,
  ExecutionFilter,
  WorkflowEvent,
  EngineHealthStatus,
  EngineMetrics
} from '../types/orchestration';
import { Agent } from '../types/agent';
import { EventBus } from '../types/events';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';

export class OrchestrationEngineImpl implements OrchestrationEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private agents: Map<string, Agent> = new Map();
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private initialized: boolean = false;
  private running: boolean = false;

  constructor(
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
  }

  // Component lifecycle methods
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.logger.info('Initializing orchestration engine');
    this.initialized = true;
  }

  async start(): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (this.running) return;
    this.logger.info('Starting orchestration engine');
    this.running = true;
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.logger.info('Stopping orchestration engine');
    this.running = false;
  }

  /**
   * Register an agent with the orchestration engine
   */
  async registerAgent(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);
    this.logger.info(`Agent registered with orchestration engine: ${agent.id}`);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
    this.logger.info(`Agent unregistered from orchestration engine: ${agentId}`);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(definition: WorkflowDefinition): Promise<void> {
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
  async updateWorkflow(id: string, definition: Partial<WorkflowDefinition>): Promise<void> {
    const existing = this.workflows.get(id);
    if (!existing) {
      throw this.errorManager.createOrchestrationError(
        'WORKFLOW_NOT_FOUND',
        `Workflow ${id} not found`,
        id,
        undefined,
        'medium'
      );
    }

    const updated = { ...existing, ...definition, id };
    this.workflows.set(id, updated);
    this.logger.info(`Workflow updated: ${id}`);
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(id) || null;
  }

  /**
   * List workflows with optional filtering
   */
  async listWorkflows(filter?: WorkflowFilter): Promise<WorkflowDefinition[]> {
    let workflows = Array.from(this.workflows.values());
    
    if (filter) {
      if (filter.author) {
        workflows = workflows.filter(w => w.author === filter.author);
      }
      if (filter.category) {
        workflows = workflows.filter(w => w.category === filter.category);
      }
      if (filter.tags) {
        workflows = workflows.filter(w =>
          filter.tags!.some(tag => w.tags?.includes(tag))
        );
      }
    }

    return workflows;
  }

  /**
   * Execute workflow - main entry point for workflow execution
   */
  async executeWorkflow(workflowId: string, input?: any, context?: Record<string, any>): Promise<WorkflowExecution> {
    return this.startWorkflow(workflowId, input, context);
  }

  /**
   * Start workflow execution
   */
  async startWorkflow(
    workflowId: string,
    input?: any,
    context?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw this.errorManager.createOrchestrationError(
        'WORKFLOW_NOT_FOUND',
        `Workflow ${workflowId} not found`,
        workflowId,
        undefined,
        'medium'
      );
    }

    this.logger.info(`Starting workflow execution: ${workflowId}`);

    const execution: WorkflowExecution = {
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
  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw this.errorManager.createOrchestrationError(
        'EXECUTION_NOT_FOUND',
        `Execution ${executionId} not found`,
        undefined,
        undefined,
        'medium'
      );
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
  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw this.errorManager.createOrchestrationError(
        'EXECUTION_NOT_FOUND',
        `Execution ${executionId} not found`,
        undefined,
        undefined,
        'medium'
      );
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
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw this.errorManager.createOrchestrationError(
        'EXECUTION_NOT_FOUND',
        `Execution ${executionId} not found`,
        undefined,
        undefined,
        'medium'
      );
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
  async stopWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw this.errorManager.createOrchestrationError(
        'EXECUTION_NOT_FOUND',
        `Execution ${executionId} not found`,
        undefined,
        undefined,
        'medium'
      );
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
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null;
  }

  /**
   * List executions with optional filtering
   */
  async listExecutions(filter?: ExecutionFilter): Promise<WorkflowExecution[]> {
    let executions = Array.from(this.executions.values());
    
    if (filter) {
      if (filter.workflowId) {
        executions = executions.filter(e => e.workflowId === filter.workflowId);
      }
      if (filter.status) {
        executions = executions.filter(e => e.status === filter.status);
      }
      if (filter.startedAfter) {
        executions = executions.filter(e => e.startedAt >= filter.startedAfter!);
      }
      if (filter.startedBefore) {
        executions = executions.filter(e => e.startedAt <= filter.startedBefore!);
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
  async getExecutionLogs(executionId: string): Promise<WorkflowEvent[]> {
    const execution = this.executions.get(executionId);
    return execution?.events || [];
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * List all registered agents
   */
  async listAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Subscribe to execution events
   */
  subscribeToExecution(executionId: string, callback: (event: WorkflowEvent) => void): void {
    // Implementation would depend on EventBus capabilities
    this.logger.debug(`Subscribing to execution events: ${executionId}`);
  }

  /**
   * Unsubscribe from execution events
   */
  unsubscribeFromExecution(executionId: string, callback: (event: WorkflowEvent) => void): void {
    // Implementation would depend on EventBus capabilities
    this.logger.debug(`Unsubscribing from execution events: ${executionId}`);
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<EngineHealthStatus> {
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
  async getMetrics(): Promise<EngineMetrics> {
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
  on(event: string, callback: (event: any) => void): void {
    // Simple implementation - in production would use EventBus subscription
    this.logger.debug(`Orchestration engine subscribing to event: ${event}`);
    // Would delegate to EventBus in real implementation
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw this.errorManager.createOrchestrationError(
        'WORKFLOW_NOT_FOUND',
        `Workflow ${workflowId} not found`,
        workflowId,
        undefined,
        'low'
      );
    }

    // Check if there are running executions
    const runningExecutions = this.getWorkflowExecutions(workflowId)
      .filter(execution => execution.status === 'running');

    if (runningExecutions.length > 0) {
      throw this.errorManager.createOrchestrationError(
        'WORKFLOW_ACTIVE_EXECUTIONS',
        `Cannot delete workflow ${workflowId}: has ${runningExecutions.length} running executions`,
        workflowId,
        undefined,
        'medium'
      );
    }

    // Delete workflow
    this.workflows.delete(workflowId);
    
    this.logger.info(`Workflow deleted: ${workflowId}`);
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<void> {
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
      const completionEvent: WorkflowEvent = {
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

    } catch (error) {
      const errorObj = error as Error;
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
      const failureEvent: WorkflowEvent = {
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
  private async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    stepIndex: number
  ): Promise<void> {
    this.logger.debug(`Executing step: ${step.id}`, {
      executionId: execution.id,
      stepIndex
    });

    const stepExecution: StepExecution = {
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
    const startEvent: WorkflowEvent = {
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
      stepExecution.duration = stepExecution.completedAt!.getTime() - stepExecution.startedAt!.getTime();
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
      const completedEvent: WorkflowEvent = {
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

    } catch (error) {
      const errorObj = error as Error;
      stepExecution.status = 'failed';
      stepExecution.completedAt = new Date();
      stepExecution.duration = stepExecution.completedAt.getTime() - stepExecution.startedAt!.getTime();
      stepExecution.error = {
        code: 'STEP_EXECUTION_FAILED',
        message: errorObj.message,
        details: errorObj.stack
      };

      // Add step failed event
      const failedEvent: WorkflowEvent = {
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

  private validateWorkflow(workflow: WorkflowDefinition): void {
    if (!workflow.id) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Workflow ID is required',
        'validation',
        'high'
      );
    }

    if (!workflow.name) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Workflow name is required',
        'validation',
        'high'
      );
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Workflow must have at least one step',
        'validation',
        'high'
      );
    }

    // Validate each step
    for (const step of workflow.steps) {
      this.validateStep(step);
    }
  }

  private validateStep(step: WorkflowStep): void {
    if (!step.id) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Step ID is required',
        'validation',
        'high'
      );
    }

    const agentId = step.agent || step.agentId;
    if (!agentId) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Step agent ID is required',
        'validation',
        'high'
      );
    }
  }

  private prepareStepInput(execution: WorkflowExecution, step: WorkflowStep): any {
    let input = step.input || {};

    // Apply input mapping from execution context
    if (step.inputMapping) {
      for (const [key, path] of Object.entries(step.inputMapping)) {
        input[key] = this.extractValue(execution.context, path);
      }
    }

    return input;
  }

  private extractValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(e => e.workflowId === workflowId);
  }
}