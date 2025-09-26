/**
 * OrchestrationEngine Implementation
 *
 * Workflow orchestration and execution engine
 */
import { WorkflowDefinition, WorkflowExecution, OrchestrationEngine, WorkflowFilter, ExecutionFilter, WorkflowEvent, EngineHealthStatus, EngineMetrics } from '../types/orchestration';
import { Agent } from '../types/agent';
import { EventBus } from '../types/events';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
export declare class OrchestrationEngineImpl implements OrchestrationEngine {
    private workflows;
    private executions;
    private agents;
    private logger;
    private errorManager;
    private eventBus;
    private initialized;
    private running;
    constructor(logger: Logger, errorManager: ErrorManager, eventBus: EventBus);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    /**
     * Register an agent with the orchestration engine
     */
    registerAgent(agent: Agent): Promise<void>;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Create a new workflow
     */
    createWorkflow(definition: WorkflowDefinition): Promise<void>;
    /**
     * Update an existing workflow
     */
    updateWorkflow(id: string, definition: Partial<WorkflowDefinition>): Promise<void>;
    /**
     * Get workflow by ID
     */
    getWorkflow(id: string): Promise<WorkflowDefinition | null>;
    /**
     * List workflows with optional filtering
     */
    listWorkflows(filter?: WorkflowFilter): Promise<WorkflowDefinition[]>;
    /**
     * Execute workflow - main entry point for workflow execution
     */
    executeWorkflow(workflowId: string, input?: any, context?: Record<string, any>): Promise<WorkflowExecution>;
    /**
     * Start workflow execution
     */
    startWorkflow(workflowId: string, input?: any, context?: Record<string, any>): Promise<WorkflowExecution>;
    /**
     * Pause workflow execution
     */
    pauseExecution(executionId: string): Promise<void>;
    /**
     * Resume workflow execution
     */
    resumeExecution(executionId: string): Promise<void>;
    /**
     * Cancel workflow execution
     */
    cancelExecution(executionId: string): Promise<void>;
    /**
     * Stop workflow execution
     */
    stopWorkflow(executionId: string): Promise<void>;
    /**
     * Get workflow execution status
     */
    getExecution(executionId: string): Promise<WorkflowExecution | null>;
    /**
     * List executions with optional filtering
     */
    listExecutions(filter?: ExecutionFilter): Promise<WorkflowExecution[]>;
    /**
     * Get execution event logs
     */
    getExecutionLogs(executionId: string): Promise<WorkflowEvent[]>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): Promise<Agent | null>;
    /**
     * List all registered agents
     */
    listAgents(): Promise<Agent[]>;
    /**
     * Subscribe to execution events
     */
    subscribeToExecution(executionId: string, callback: (event: WorkflowEvent) => void): void;
    /**
     * Unsubscribe from execution events
     */
    unsubscribeFromExecution(executionId: string, callback: (event: WorkflowEvent) => void): void;
    /**
     * Get health status
     */
    getHealthStatus(): Promise<EngineHealthStatus>;
    /**
     * Get performance metrics
     */
    getMetrics(): Promise<EngineMetrics>;
    /**
     * Event listener method for compatibility with conductor
     */
    on(event: string, callback: (event: any) => void): void;
    /**
     * Delete a workflow
     */
    deleteWorkflow(workflowId: string): Promise<void>;
    /**
     * Execute workflow steps
     */
    private executeWorkflowSteps;
    /**
     * Execute a single workflow step
     */
    private executeStep;
    private validateWorkflow;
    private validateStep;
    private prepareStepInput;
    private extractValue;
    private generateExecutionId;
    private generateEventId;
    private getWorkflowExecutions;
}
//# sourceMappingURL=engine.d.ts.map