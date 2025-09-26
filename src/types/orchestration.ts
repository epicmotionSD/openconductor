/**
 * OpenConductor Orchestration Types
 * 
 * Core orchestration primitives that enable the universal conductor
 * to bring harmony to complex AI agent ecosystems.
 * 
 * "From Agent Chaos to Business Harmony"
 */

import { Agent, AgentInput, AgentOutput } from './agent';

export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// Add missing type aliases for backwards compatibility
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
  
  // Workflow configuration
  strategy: ExecutionStrategy;
  timeout?: number;
  maxRetries?: number;
  
  // Triggers that start the workflow
  triggers: WorkflowTrigger[];
  
  // Steps in the workflow
  steps: WorkflowStep[];
  
  // Flow control
  conditions?: WorkflowCondition[];
  errorHandling?: ErrorHandlingPolicy;
  
  // Enterprise features
  compliance?: {
    auditRequired?: boolean;
    dataRetention?: number;
    approvalRequired?: boolean;
  };
  
  // Metadata
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
  
  // Trigger-specific configuration
  config: {
    // Schedule trigger
    schedule?: {
      cron: string;
      timezone?: string;
    };
    
    // Event trigger
    event?: {
      source: string;
      eventType: string;
      filter?: Record<string, any>;
    };
    
    // Webhook trigger
    webhook?: {
      path: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH';
      authentication?: 'none' | 'api-key' | 'bearer' | 'basic';
    };
    
    // Data trigger
    data?: {
      source: string;
      condition: string;
      pollInterval?: number;
    };
    
    // Threshold trigger
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
  
  // Step execution
  dependsOn?: string[]; // Prerequisites
  timeout?: number;
  continueOnError?: boolean; // Whether to continue if this step fails
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
  };
  
  // Agent step configuration
  agent?: string; // Agent ID for simple configuration
  agentId?: string; // Alias for agent for backward compatibility
  input?: any; // Input data for the step
  inputMapping?: Record<string, string>; // Input data mapping
  outputMapping?: Record<string, string>; // Output data mapping
  
  // Enhanced agent step configuration
  agentConfig?: {
    id: string;
    version?: string;
    input: any;
    outputMapping?: Record<string, string>;
  };
  
  // Condition step configuration
  condition?: {
    expression: string;
    trueBranch?: string[];
    falseBranch?: string[];
  };
  
  // Loop step configuration  
  loop?: {
    collection: string;
    itemVariable: string;
    steps: string[];
    maxIterations?: number;
  };
  
  // Parallel step configuration
  parallel?: {
    steps: string[];
    waitForAll?: boolean;
    maxConcurrency?: number;
  };
  
  // Delay step configuration
  delay?: {
    duration: number;
    unit: 'seconds' | 'minutes' | 'hours';
  };
  
  // Custom step configuration
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
  
  // Execution details
  startedAt: Date;
  startTime: Date; // Alias for startedAt for backward compatibility
  completedAt?: Date;
  endTime?: Date; // Alias for completedAt for backward compatibility
  duration?: number;
  
  // Input and output
  input: any;
  output?: any;
  result?: any; // Alias for output for backward compatibility
  context: Record<string, any>;
  
  // Step execution tracking
  steps: StepExecution[];
  stepExecutions: StepExecution[]; // Alias for steps for backward compatibility
  currentStep?: string;
  
  // Error information
  error?: {
    step?: string;
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
  
  // Metrics and monitoring
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
  
  // Audit trail
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
  
  // Execution timing
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  
  // Input and output
  input?: any;
  output?: any;
  
  // Error information
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // Retry information
  attempts: number;
  maxAttempts: number;
  
  // Agent-specific data
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
  
  // Event details
  stepId?: string;
  agentId?: string;
  message?: string;
  data?: any;
  
  // Correlation
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
  
  // Shared data between steps
  variables: Record<string, any>;
  
  // Agent registry and instances
  agents: Map<string, Agent>;
  
  // Execution state
  currentStep?: string;
  stepHistory: string[];
  
  // Enterprise features
  auditTrail: AuditEntry[];
  securityContext?: {
    userId?: string;
    permissions: string[];
    dataClassification?: string;
  };
  
  // Monitoring
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
  
  // Action details
  action: string;
  resource: string;
  resourceId: string;
  
  // User context
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Data
  oldValue?: any;
  newValue?: any;
  
  // Results
  success: boolean;
  errorMessage?: string;
  
  // Compliance
  dataClassification?: string;
  retentionPeriod?: number;
}

/**
 * Orchestration Engine Interface
 * 
 * The conductor that coordinates all agent orchestration
 */
export interface OrchestrationEngine {
  // Workflow management
  createWorkflow(definition: WorkflowDefinition): Promise<void>;
  updateWorkflow(id: string, definition: Partial<WorkflowDefinition>): Promise<void>;
  deleteWorkflow(id: string): Promise<void>;
  getWorkflow(id: string): Promise<WorkflowDefinition | null>;
  listWorkflows(filter?: WorkflowFilter): Promise<WorkflowDefinition[]>;
  
  // Workflow execution
  executeWorkflow(workflowId: string, input?: any, context?: Record<string, any>): Promise<WorkflowExecution>;
  startWorkflow(workflowId: string, input?: any, context?: Record<string, any>): Promise<WorkflowExecution>;
  pauseExecution(executionId: string): Promise<void>;
  resumeExecution(executionId: string): Promise<void>;
  cancelExecution(executionId: string): Promise<void>;
  
  // Execution monitoring
  getExecution(executionId: string): Promise<WorkflowExecution | null>;
  listExecutions(filter?: ExecutionFilter): Promise<WorkflowExecution[]>;
  getExecutionLogs(executionId: string): Promise<WorkflowEvent[]>;
  
  // Agent registration and management
  registerAgent(agent: Agent): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  getAgent(agentId: string): Promise<Agent | null>;
  listAgents(): Promise<Agent[]>;
  
  // Real-time monitoring
  subscribeToExecution(executionId: string, callback: (event: WorkflowEvent) => void): void;
  unsubscribeFromExecution(executionId: string, callback: (event: WorkflowEvent) => void): void;
  
  // Health and metrics
  getHealthStatus(): Promise<EngineHealthStatus>;
  getMetrics(): Promise<EngineMetrics>;
  
  // Component lifecycle methods
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Event listener support for conductor integration
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
  
  // Execution metrics
  executions: {
    total: number;
    successful: number;
    failed: number;
    cancelled: number;
    averageDuration: number;
    throughput: number; // executions per minute
  };
  
  // Agent metrics
  agents: {
    registered: number;
    active: number;
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
  
  // Resource metrics
  resources: {
    cpu: number;
    memory: number;
    storage: number;
    networkIO: number;
  };
  
  // Queue metrics
  queues: {
    pending: number;
    processing: number;
    failed: number;
    avgWaitTime: number;
  };
}