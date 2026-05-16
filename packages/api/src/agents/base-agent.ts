// Base Agent Class - Foundation for all Board of Directors agents
// Provides common functionality for agent lifecycle, task processing, and decision making

import { EventEmitter } from 'events';
import {
  AgentService,
  Agent,
  AgentTask,
  AgentDecision,
  AgentRole,
  AgentStatus,
  TaskStatus,
  TaskPriority,
  DecisionType
} from '../services/agent-service';

export interface AgentConfig {
  role: AgentRole;
  pollInterval?: number; // ms between task checks
  maxConcurrentTasks?: number;
}

export interface TaskHandler {
  taskType: string;
  handler: (task: AgentTask) => Promise<any>;
}

export abstract class BaseAgent extends EventEmitter {
  protected agentService: AgentService;
  protected config: AgentConfig;
  protected agent: Agent | null = null;
  protected isRunning: boolean = false;
  protected taskHandlers: Map<string, TaskHandler['handler']> = new Map();
  protected pollTimer: NodeJS.Timeout | null = null;

  constructor(agentService: AgentService, config: AgentConfig) {
    super();
    this.agentService = agentService;
    this.config = {
      pollInterval: 5000, // Default 5 seconds
      maxConcurrentTasks: 3,
      ...config
    };
  }

  // Abstract methods to be implemented by specific agents
  abstract get name(): string;
  abstract get description(): string;
  abstract get capabilities(): string[];

  // Initialize the agent and register task handlers
  protected abstract registerTaskHandlers(): void;

  // ============================================
  // LIFECYCLE MANAGEMENT
  // ============================================

  async initialize(): Promise<void> {
    // Load agent from database
    this.agent = await this.agentService.getAgentByRole(this.config.role);

    if (!this.agent) {
      throw new Error(`Agent with role '${this.config.role}' not found in database`);
    }

    // Register task handlers
    this.registerTaskHandlers();

    this.emit('initialized', { agentId: this.agent.id, role: this.config.role });
  }

  async start(): Promise<void> {
    if (!this.agent) {
      await this.initialize();
    }

    if (this.isRunning) {
      console.log(`[${this.name}] Already running`);
      return;
    }

    this.isRunning = true;
    await this.agentService.startAgent(this.agent!.id);

    // Start polling for tasks
    this.startPolling();

    this.emit('started', { agentId: this.agent!.id });
    console.log(`[${this.name}] Started`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.stopPolling();

    if (this.agent) {
      await this.agentService.stopAgent(this.agent.id);
    }

    this.emit('stopped', { agentId: this.agent?.id });
    console.log(`[${this.name}] Stopped`);
  }

  async pause(): Promise<void> {
    if (this.agent) {
      await this.agentService.updateAgentStatus(this.agent.id, 'paused');
      this.stopPolling();
      this.emit('paused', { agentId: this.agent.id });
    }
  }

  async resume(): Promise<void> {
    if (this.agent && this.isRunning) {
      await this.agentService.updateAgentStatus(this.agent.id, 'active');
      this.startPolling();
      this.emit('resumed', { agentId: this.agent.id });
    }
  }

  // ============================================
  // TASK POLLING & PROCESSING
  // ============================================

  private startPolling(): void {
    if (this.pollTimer) {
      return;
    }

    this.pollTimer = setInterval(
      () => this.pollTasks(),
      this.config.pollInterval
    );

    // Also run immediately
    this.pollTasks();
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollTasks(): Promise<void> {
    if (!this.agent || !this.isRunning) {
      return;
    }

    try {
      // Get pending tasks for this agent
      const tasks = await this.agentService.getTasksForAgent(
        this.agent.id,
        'pending'
      );

      // Process tasks up to max concurrent limit
      const tasksToProcess = tasks.slice(0, this.config.maxConcurrentTasks);

      for (const task of tasksToProcess) {
        await this.processTask(task);
      }
    } catch (error) {
      console.error(`[${this.name}] Error polling tasks:`, error);
      this.emit('error', { error, context: 'polling' });
    }
  }

  private async processTask(task: AgentTask): Promise<void> {
    const handler = this.taskHandlers.get(task.taskType);

    if (!handler) {
      console.warn(`[${this.name}] No handler for task type: ${task.taskType}`);
      await this.agentService.updateTaskStatus(
        task.id,
        'failed',
        undefined,
        `No handler registered for task type: ${task.taskType}`
      );
      return;
    }

    try {
      // Mark task as in progress
      await this.agentService.updateTaskStatus(task.id, 'in_progress');
      this.emit('task:started', { task });

      // Execute the handler
      const result = await handler(task);

      // Mark task as completed
      await this.agentService.updateTaskStatus(task.id, 'completed', result);
      this.emit('task:completed', { task, result });

    } catch (error: any) {
      console.error(`[${this.name}] Error processing task ${task.id}:`, error);

      await this.agentService.updateTaskStatus(
        task.id,
        'failed',
        undefined,
        error.message || 'Unknown error'
      );

      this.emit('task:failed', { task, error });
    }
  }

  // ============================================
  // TASK CREATION
  // ============================================

  protected async delegateTask(
    toRole: AgentRole,
    taskType: string,
    title: string,
    payload: Record<string, any>,
    options?: {
      description?: string;
      priority?: TaskPriority;
      deadline?: Date;
    }
  ): Promise<AgentTask> {
    const targetAgent = await this.agentService.getAgentByRole(toRole);

    if (!targetAgent) {
      throw new Error(`No agent found with role: ${toRole}`);
    }

    return this.agentService.createTask({
      fromAgentId: this.agent?.id || null,
      toAgentId: targetAgent.id,
      taskType,
      title,
      description: options?.description,
      payload,
      priority: options?.priority || 'medium',
      status: 'pending',
      deadline: options?.deadline
    });
  }

  // ============================================
  // DECISION MAKING
  // ============================================

  protected async makeDecision(
    decisionType: DecisionType,
    title: string,
    description: string,
    options: {
      reasoning: string;
      data: Record<string, any>;
      confidence: number; // 0-1
      impact: 'low' | 'medium' | 'high' | 'critical';
      autoApprove?: boolean;
    }
  ): Promise<AgentDecision> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    const decision = await this.agentService.createDecision({
      agentId: this.agent.id,
      agentRole: this.config.role,
      decisionType,
      title,
      description,
      reasoning: options.reasoning,
      data: options.data,
      confidence: options.confidence,
      impact: options.impact,
      approved: options.autoApprove || false,
      approvedBy: options.autoApprove ? this.agent.id : undefined,
      executedAt: options.autoApprove ? new Date() : undefined
    });

    this.emit('decision:made', { decision });

    return decision;
  }

  protected async escalateToHuman(
    title: string,
    description: string,
    data: Record<string, any>
  ): Promise<AgentDecision> {
    return this.makeDecision(
      'escalate_to_human',
      title,
      description,
      {
        reasoning: 'Requires human approval due to impact or uncertainty',
        data,
        confidence: 0.5,
        impact: 'high',
        autoApprove: false
      }
    );
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  protected registerTaskHandler(taskType: string, handler: TaskHandler['handler']): void {
    this.taskHandlers.set(taskType, handler);
  }

  getStatus(): AgentStatus {
    return this.agent?.status || 'offline';
  }

  getMetrics() {
    return this.agent?.metrics || {
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksFailed: 0,
      avgResponseTime: 0,
      successRate: 0
    };
  }
}

export default BaseAgent;
