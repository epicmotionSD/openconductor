/**
 * OpenConductor Orchestration Types
 *
 * Core orchestration primitives that enable the universal conductor
 * to bring harmony to complex AI agent ecosystems.
 *
 * "From Agent Chaos to Business Harmony"
 */
import { Agent } from './agent';
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type Workflow = WorkflowDefinition;
export type ExecutionContext = OrchestrationContext;
export type WorkflowResult = WorkflowExecution;
export type ExecutionStrategy = 'sequential' | 'parallel' | 'conditional' | 'hybrid';
export type TriggerType = 'manual' | 'scheduled' | 'event' | 'webhook' | 'data' | 'threshold';
/**
 * Workflow Definition
 *
 * Defines how multiple agents work together to achieve a business outcome
 */
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    version: string;
    strategy: ExecutionStrategy;
    timeout?: number;
    maxRetries?: number;
    triggers: WorkflowTrigger[];
    steps: WorkflowStep[];
    conditions?: WorkflowCondition[];
    errorHandling?: ErrorHandlingPolicy;
    compliance?: {
        auditRequired?: boolean;
        dataRetention?: number;
        approvalRequired?: boolean;
    };
    tags?: string[];
    author?: string;
    category?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Workflow Trigger
 *
 * Conditions that initiate workflow execution
 */
export interface WorkflowTrigger {
    id: string;
    type: TriggerType;
    name: string;
    enabled: boolean;
    config: {
        schedule?: {
            cron: string;
            timezone?: string;
        };
        event?: {
            source: string;
            eventType: string;
            filter?: Record<string, any>;
        };
        webhook?: {
            path: string;
            method: 'GET' | 'POST' | 'PUT' | 'PATCH';
            authentication?: 'none' | 'api-key' | 'bearer' | 'basic';
        };
        data?: {
            source: string;
            condition: string;
            pollInterval?: number;
        };
        threshold?: {
            metric: string;
            operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
            value: number;
            window?: number;
        };
    };
}
/**
 * Workflow Step
 *
 * Individual steps in a workflow that execute agents or perform actions
 */
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'agent' | 'condition' | 'loop' | 'parallel' | 'delay' | 'custom';
    dependsOn?: string[];
    timeout?: number;
    continueOnError?: boolean;
    retryPolicy?: {
        maxRetries: number;
        backoffStrategy: 'linear' | 'exponential';
        initialDelay: number;
    };
    agent?: string;
    agentId?: string;
    input?: any;
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
    agentConfig?: {
        id: string;
        version?: string;
        input: any;
        outputMapping?: Record<string, string>;
    };
    condition?: {
        expression: string;
        trueBranch?: string[];
        falseBranch?: string[];
    };
    loop?: {
        collection: string;
        itemVariable: string;
        steps: string[];
        maxIterations?: number;
    };
    parallel?: {
        steps: string[];
        waitForAll?: boolean;
        maxConcurrency?: number;
    };
    delay?: {
        duration: number;
        unit: 'seconds' | 'minutes' | 'hours';
    };
    custom?: {
        handler: string;
        config: Record<string, any>;
    };
}
/**
 * Workflow Condition
 *
 * Conditional logic for flow control
 */
export interface WorkflowCondition {
    id: string;
    name: string;
    expression: string;
    description?: string;
}
/**
 * Error Handling Policy
 *
 * Defines how errors are handled during workflow execution
 */
export interface ErrorHandlingPolicy {
    strategy: 'fail-fast' | 'continue' | 'retry' | 'compensate';
    maxRetries?: number;
    retryDelay?: number;
    compensationSteps?: string[];
    notificationChannels?: string[];
}
/**
 * Workflow Execution
 *
 * Runtime state of a workflow execution
 */
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: WorkflowStatus;
    startedAt: Date;
    startTime: Date;
    completedAt?: Date;
    endTime?: Date;
    duration?: number;
    input: any;
    output?: any;
    result?: any;
    context: Record<string, any>;
    steps: StepExecution[];
    stepExecutions: StepExecution[];
    currentStep?: string;
    error?: {
        step?: string;
        code: string;
        message: string;
        details?: any;
        timestamp: Date;
    };
    metrics: {
        totalSteps: number;
        completedSteps: number;
        failedSteps: number;
        averageStepDuration?: number;
        resourceUsage?: {
            cpu: number;
            memory: number;
            storage: number;
        };
    };
    events: WorkflowEvent[];
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Step Execution
 *
 * Runtime state of individual workflow steps
 */
export interface StepExecution {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    input?: any;
    output?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    attempts: number;
    maxAttempts: number;
    agentExecution?: {
        agentId: string;
        executionId: string;
        metrics?: Record<string, any>;
    };
}
/**
 * Workflow Event
 *
 * Events that occur during workflow execution
 */
export interface WorkflowEvent {
    id: string;
    type: 'started' | 'step-started' | 'step-completed' | 'step-failed' | 'completed' | 'failed' | 'cancelled';
    timestamp: Date;
    stepId?: string;
    agentId?: string;
    message?: string;
    data?: any;
    correlationId?: string;
    causedBy?: string;
}
/**
 * Orchestration Context
 *
 * Shared context and state during workflow execution
 */
export interface OrchestrationContext {
    workflowId: string;
    executionId: string;
    variables: Record<string, any>;
    agents: Map<string, Agent>;
    currentStep?: string;
    stepHistory: string[];
    auditTrail: AuditEntry[];
    securityContext?: {
        userId?: string;
        permissions: string[];
        dataClassification?: string;
    };
    metrics: {
        startTime: Date;
        stepCount: number;
        errorCount: number;
        warnings: string[];
    };
}
/**
 * Audit Entry
 *
 * Enterprise-grade audit logging for compliance
 */
export interface AuditEntry {
    id: string;
    timestamp: Date;
    action: string;
    resource: string;
    resourceId: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    oldValue?: any;
    newValue?: any;
    success: boolean;
    errorMessage?: string;
    dataClassification?: string;
    retentionPeriod?: number;
}
/**
 * Orchestration Engine Interface
 *
 * The conductor that coordinates all agent orchestration
 */
export interface OrchestrationEngine {
    createWorkflow(definition: WorkflowDefinition): Promise<void>;
    updateWorkflow(id: string, definition: Partial<WorkflowDefinition>): Promise<void>;
    deleteWorkflow(id: string): Promise<void>;
    getWorkflow(id: string): Promise<WorkflowDefinition | null>;
    listWorkflows(filter?: WorkflowFilter): Promise<WorkflowDefinition[]>;
    executeWorkflow(workflowId: string, input?: any, context?: Record<string, any>): Promise<WorkflowExecution>;
    startWorkflow(workflowId: string, input?: any, context?: Record<string, any>): Promise<WorkflowExecution>;
    pauseExecution(executionId: string): Promise<void>;
    resumeExecution(executionId: string): Promise<void>;
    cancelExecution(executionId: string): Promise<void>;
    getExecution(executionId: string): Promise<WorkflowExecution | null>;
    listExecutions(filter?: ExecutionFilter): Promise<WorkflowExecution[]>;
    getExecutionLogs(executionId: string): Promise<WorkflowEvent[]>;
    registerAgent(agent: Agent): Promise<void>;
    unregisterAgent(agentId: string): Promise<void>;
    getAgent(agentId: string): Promise<Agent | null>;
    listAgents(): Promise<Agent[]>;
    subscribeToExecution(executionId: string, callback: (event: WorkflowEvent) => void): void;
    unsubscribeFromExecution(executionId: string, callback: (event: WorkflowEvent) => void): void;
    getHealthStatus(): Promise<EngineHealthStatus>;
    getMetrics(): Promise<EngineMetrics>;
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    on(event: string, callback: (event: any) => void): void;
}
/**
 * Workflow Filter
 *
 * Filtering options for workflow queries
 */
export interface WorkflowFilter {
    author?: string;
    category?: string;
    tags?: string[];
    status?: WorkflowStatus;
    createdAfter?: Date;
    createdBefore?: Date;
    limit?: number;
    offset?: number;
}
/**
 * Execution Filter
 *
 * Filtering options for execution queries
 */
export interface ExecutionFilter {
    workflowId?: string;
    status?: WorkflowStatus;
    startedAfter?: Date;
    startedBefore?: Date;
    completedAfter?: Date;
    completedBefore?: Date;
    limit?: number;
    offset?: number;
}
/**
 * Engine Health Status
 *
 * Overall health status of the orchestration engine
 */
export interface EngineHealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    components: {
        database: 'healthy' | 'degraded' | 'unhealthy';
        redis: 'healthy' | 'degraded' | 'unhealthy';
        agents: 'healthy' | 'degraded' | 'unhealthy';
        storage: 'healthy' | 'degraded' | 'unhealthy';
    };
    metrics: {
        activeExecutions: number;
        queuedExecutions: number;
        registeredAgents: number;
        uptime: number;
    };
    issues?: Array<{
        component: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        timestamp: Date;
    }>;
}
/**
 * Engine Metrics
 *
 * Performance and operational metrics
 */
export interface EngineMetrics {
    timestamp: Date;
    executions: {
        total: number;
        successful: number;
        failed: number;
        cancelled: number;
        averageDuration: number;
        throughput: number;
    };
    agents: {
        registered: number;
        active: number;
        averageResponseTime: number;
        totalRequests: number;
        errorRate: number;
    };
    resources: {
        cpu: number;
        memory: number;
        storage: number;
        networkIO: number;
    };
    queues: {
        pending: number;
        processing: number;
        failed: number;
        avgWaitTime: number;
    };
}
//# sourceMappingURL=orchestration.d.ts.map