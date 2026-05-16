// Agent Orchestrator - Manages the Board of Directors
// Coordinates all agents: CEO (Atlas), CTO (Nova), CMO (Pulse), CFO (Apex)

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import { AgentService, AgentRole, AgentStatus } from '../services/agent-service';
import { CEOAgent } from './ceo-agent';
import { CTOAgent } from './cto-agent';
import { CMOAgent } from './cmo-agent';
import { CFOAgent } from './cfo-agent';
import { BaseAgent } from './base-agent';

export interface OrchestratorConfig {
  autoStart?: boolean;
  pollInterval?: number;
  enableLogging?: boolean;
}

export interface AgentInfo {
  role: AgentRole;
  name: string;
  status: AgentStatus;
  metrics: {
    tasksCompleted: number;
    tasksInProgress: number;
    tasksFailed: number;
    avgResponseTime: number;
    successRate: number;
  };
  lastActiveAt: Date | null;
}

export interface OrchestratorStatus {
  isRunning: boolean;
  startedAt: Date | null;
  agents: AgentInfo[];
  summary: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalTasksCompleted: number;
    totalTasksPending: number;
  };
}

export class AgentOrchestrator extends EventEmitter {
  private pool: Pool;
  private agentService: AgentService;
  private config: OrchestratorConfig;

  private ceoAgent: CEOAgent | null = null;
  private ctoAgent: CTOAgent | null = null;
  private cmoAgent: CMOAgent | null = null;
  private cfoAgent: CFOAgent | null = null;

  private agents: Map<AgentRole, BaseAgent> = new Map();
  private isRunning: boolean = false;
  private startedAt: Date | null = null;

  constructor(pool: Pool, config: OrchestratorConfig = {}) {
    super();
    this.pool = pool;
    this.agentService = new AgentService(pool);
    this.config = {
      autoStart: false,
      pollInterval: 5000,
      enableLogging: true,
      ...config
    };
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(): Promise<void> {
    this.log('Initializing Board of Directors...');

    try {
      // Create agent instances
      this.ceoAgent = new CEOAgent(this.agentService);
      this.ctoAgent = new CTOAgent(this.agentService);
      this.cmoAgent = new CMOAgent(this.agentService);
      this.cfoAgent = new CFOAgent(this.agentService);

      // Store in map for easy access
      this.agents.set('ceo', this.ceoAgent);
      this.agents.set('cto', this.ctoAgent);
      this.agents.set('cmo', this.cmoAgent);
      this.agents.set('cfo', this.cfoAgent);

      // Initialize all agents
      for (const [role, agent] of this.agents) {
        await agent.initialize();
        this.setupAgentListeners(role, agent);
        this.log(`  ${this.getAgentEmoji(role)} ${agent.name} initialized`);
      }

      this.emit('initialized');
      this.log('Board of Directors initialized successfully');

      // Auto-start if configured
      if (this.config.autoStart) {
        await this.startAll();
      }
    } catch (error) {
      this.log(`Initialization failed: ${error}`, 'error');
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  private setupAgentListeners(role: AgentRole, agent: BaseAgent): void {
    agent.on('started', (data) => {
      this.emit('agent:started', { role, ...data });
    });

    agent.on('stopped', (data) => {
      this.emit('agent:stopped', { role, ...data });
    });

    agent.on('task:started', (data) => {
      this.emit('agent:task:started', { role, ...data });
    });

    agent.on('task:completed', (data) => {
      this.emit('agent:task:completed', { role, ...data });
      this.log(`  ${this.getAgentEmoji(role)} Completed: ${data.task.title}`);
    });

    agent.on('task:failed', (data) => {
      this.emit('agent:task:failed', { role, ...data });
      this.log(`  ${this.getAgentEmoji(role)} Failed: ${data.task.title}`, 'error');
    });

    agent.on('decision:made', (data) => {
      this.emit('agent:decision', { role, ...data });
      this.log(`  ${this.getAgentEmoji(role)} Decision: ${data.decision.title}`);
    });

    agent.on('error', (data) => {
      this.emit('agent:error', { role, ...data });
    });
  }

  // ============================================
  // LIFECYCLE MANAGEMENT
  // ============================================

  async startAll(): Promise<void> {
    if (this.isRunning) {
      this.log('Orchestrator already running');
      return;
    }

    this.log('Starting all agents...');
    this.isRunning = true;
    this.startedAt = new Date();

    // Start agents in order: CEO first, then others
    const startOrder: AgentRole[] = ['ceo', 'cto', 'cmo', 'cfo'];

    for (const role of startOrder) {
      const agent = this.agents.get(role);
      if (agent) {
        await agent.start();
      }
    }

    this.emit('started');
    this.log('All agents started');
  }

  async stopAll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.log('Stopping all agents...');

    // Stop in reverse order
    const stopOrder: AgentRole[] = ['cfo', 'cmo', 'cto', 'ceo'];

    for (const role of stopOrder) {
      const agent = this.agents.get(role);
      if (agent) {
        await agent.stop();
      }
    }

    this.isRunning = false;
    this.startedAt = null;
    this.emit('stopped');
    this.log('All agents stopped');
  }

  async startAgent(role: AgentRole): Promise<void> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent with role '${role}' not found`);
    }
    await agent.start();
    this.log(`${this.getAgentEmoji(role)} ${role.toUpperCase()} started`);
  }

  async stopAgent(role: AgentRole): Promise<void> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent with role '${role}' not found`);
    }
    await agent.stop();
    this.log(`${this.getAgentEmoji(role)} ${role.toUpperCase()} stopped`);
  }

  async pauseAgent(role: AgentRole): Promise<void> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent with role '${role}' not found`);
    }
    await agent.pause();
    this.log(`${this.getAgentEmoji(role)} ${role.toUpperCase()} paused`);
  }

  async resumeAgent(role: AgentRole): Promise<void> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent with role '${role}' not found`);
    }
    await agent.resume();
    this.log(`${this.getAgentEmoji(role)} ${role.toUpperCase()} resumed`);
  }

  // ============================================
  // STATUS & MONITORING
  // ============================================

  async getStatus(): Promise<OrchestratorStatus> {
    const agentInfos: AgentInfo[] = [];
    let totalTasksCompleted = 0;
    let activeCount = 0;
    let idleCount = 0;
    let errorCount = 0;

    for (const [role, agent] of this.agents) {
      const status = agent.getStatus();
      const metrics = agent.getMetrics();

      // Get agent details from database
      const dbAgent = await this.agentService.getAgentByRole(role);

      agentInfos.push({
        role,
        name: agent.name,
        status,
        metrics,
        lastActiveAt: dbAgent?.lastActiveAt || null
      });

      totalTasksCompleted += metrics.tasksCompleted;

      if (status === 'active') activeCount++;
      else if (status === 'idle') idleCount++;
      else if (status === 'error') errorCount++;
    }

    // Get pending tasks count
    const pendingTasks = await this.agentService.getPendingTasksCount();

    return {
      isRunning: this.isRunning,
      startedAt: this.startedAt,
      agents: agentInfos,
      summary: {
        totalAgents: this.agents.size,
        activeAgents: activeCount,
        idleAgents: idleCount,
        errorAgents: errorCount,
        totalTasksCompleted,
        totalTasksPending: pendingTasks
      }
    };
  }

  getAgentStatus(role: AgentRole): AgentStatus {
    const agent = this.agents.get(role);
    return agent?.getStatus() || 'offline';
  }

  // ============================================
  // INTER-AGENT COMMUNICATION
  // ============================================

  async sendTaskToAgent(
    fromRole: AgentRole | null,
    toRole: AgentRole,
    taskType: string,
    title: string,
    payload: Record<string, any>,
    options?: {
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<void> {
    const toAgent = await this.agentService.getAgentByRole(toRole);
    const fromAgent = fromRole ? await this.agentService.getAgentByRole(fromRole) : null;

    if (!toAgent) {
      throw new Error(`Target agent '${toRole}' not found`);
    }

    await this.agentService.createTask({
      fromAgentId: fromAgent?.id || null,
      toAgentId: toAgent.id,
      taskType,
      title,
      description: options?.description,
      payload,
      priority: options?.priority || 'medium',
      status: 'pending'
    });

    this.log(`Task created: ${title} -> ${toRole.toUpperCase()}`);
  }

  // Broadcast a message to all agents
  async broadcastTask(
    taskType: string,
    title: string,
    payload: Record<string, any>
  ): Promise<void> {
    const roles: AgentRole[] = ['ceo', 'cto', 'cmo', 'cfo'];

    for (const role of roles) {
      await this.sendTaskToAgent(null, role, taskType, title, payload);
    }
  }

  // ============================================
  // COMMAND CENTER HELPERS
  // ============================================

  async getCommandCenterSummary(): Promise<{
    orchestrator: OrchestratorStatus;
    recentDecisions: any[];
    activeAlerts: any[];
    pendingApprovals: any[];
  }> {
    const status = await this.getStatus();
    const recentDecisions = await this.agentService.getRecentDecisions(10);
    const activeAlerts = await this.agentService.getActiveAlerts();
    const pendingApprovals = await this.agentService.getPendingApprovals();

    return {
      orchestrator: status,
      recentDecisions,
      activeAlerts,
      pendingApprovals
    };
  }

  async approveDecision(decisionId: string, approvedBy: string): Promise<void> {
    await this.agentService.approveDecision(decisionId, approvedBy);
    this.emit('decision:approved', { decisionId, approvedBy });
    this.log(`Decision ${decisionId} approved by ${approvedBy}`);
  }

  async rejectDecision(decisionId: string, rejectedBy: string, reason: string): Promise<void> {
    await this.agentService.rejectDecision(decisionId, rejectedBy, reason);
    this.emit('decision:rejected', { decisionId, rejectedBy, reason });
    this.log(`Decision ${decisionId} rejected by ${rejectedBy}`);
  }

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================

  async shutdown(): Promise<void> {
    this.log('Initiating graceful shutdown...');

    await this.stopAll();

    // Clear references
    this.agents.clear();
    this.ceoAgent = null;
    this.ctoAgent = null;
    this.cmoAgent = null;
    this.cfoAgent = null;

    this.emit('shutdown');
    this.log('Shutdown complete');
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = '[Orchestrator]';

    switch (level) {
      case 'error':
        console.error(`${timestamp} ${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefix} ${message}`);
        break;
      default:
        console.log(`${timestamp} ${prefix} ${message}`);
    }
  }

  private getAgentEmoji(role: AgentRole): string {
    const emojis: Record<AgentRole, string> = {
      ceo: '🎯',
      cto: '🔧',
      cmo: '📈',
      cfo: '💰',
      researcher: '🔬',
      architect: '🏗️',
      coder: '💻',
      reviewer: '👁️'
    };
    return emojis[role] || '🤖';
  }

  // Get agent instance (for direct access if needed)
  getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role);
  }
}

// Singleton factory for easy access
let orchestratorInstance: AgentOrchestrator | null = null;

export function createOrchestrator(pool: Pool, config?: OrchestratorConfig): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator(pool, config);
  }
  return orchestratorInstance;
}

export function getOrchestrator(): AgentOrchestrator | null {
  return orchestratorInstance;
}

export default AgentOrchestrator;
