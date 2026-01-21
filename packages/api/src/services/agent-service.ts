// Agent Service - Core orchestration for Board of Directors
// Manages agent lifecycle, task routing, and inter-agent communication

import { Pool } from 'pg';

// Types
export type AgentRole = 'ceo' | 'cto' | 'cmo' | 'cfo' | 'researcher' | 'architect' | 'coder' | 'reviewer';
export type AgentStatus = 'idle' | 'active' | 'paused' | 'error' | 'offline';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DecisionType = 'deploy_template' | 'pause_keyword' | 'adjust_budget' | 'create_campaign' | 'flag_ad_bleed' | 'recommend_action' | 'escalate_to_human';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  avatar: string;
  status: AgentStatus;
  capabilities: string[];
  permissions: AgentPermissions;
  manifest: Record<string, any>;
  metrics: AgentMetrics;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPermissions {
  canDeploy: boolean;
  canModifyBudget: boolean;
  canAccessApify: boolean;
  canAccessGoogleAds: boolean;
  canCreateTasks: boolean;
  canApproveDecisions: boolean;
  maxBudgetLimit?: number;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  avgResponseTime: number;
  successRate: number;
}

export interface AgentTask {
  id: string;
  fromAgentId: string | null;
  toAgentId: string;
  taskType: string;
  title: string;
  description?: string;
  payload: Record<string, any>;
  priority: TaskPriority;
  status: TaskStatus;
  result?: Record<string, any>;
  error?: string;
  deadline?: Date;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentDecision {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  decisionType: DecisionType;
  title: string;
  description: string;
  reasoning: string;
  data: Record<string, any>;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  approved: boolean;
  approvedBy?: string;
  executedAt?: Date;
  createdAt: Date;
}

export interface CommandCenterSummary {
  activeAgents: number;
  pendingTasks: number;
  pendingDecisions: number;
  recentSignals: number;
  activeAlerts: number;
  deploymentsToday: number;
  totalAdBleed: number;
}

export class AgentService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ============================================
  // AGENT MANAGEMENT
  // ============================================

  async getAllAgents(): Promise<Agent[]> {
    const result = await this.pool.query(`
      SELECT
        id, name, role, description, avatar, status,
        capabilities, permissions, manifest,
        tasks_completed, tasks_in_progress, tasks_failed,
        avg_response_time, success_rate,
        last_active_at, created_at, updated_at
      FROM agents
      ORDER BY
        CASE role
          WHEN 'ceo' THEN 1
          WHEN 'cto' THEN 2
          WHEN 'cmo' THEN 3
          WHEN 'cfo' THEN 4
          ELSE 5
        END
    `);

    return result.rows.map(this.mapAgentRow);
  }

  async getAgentByRole(role: AgentRole): Promise<Agent | null> {
    const result = await this.pool.query(`
      SELECT * FROM agents WHERE role = $1
    `, [role]);

    return result.rows[0] ? this.mapAgentRow(result.rows[0]) : null;
  }

  async getAgentById(id: string): Promise<Agent | null> {
    const result = await this.pool.query(`
      SELECT * FROM agents WHERE id = $1
    `, [id]);

    return result.rows[0] ? this.mapAgentRow(result.rows[0]) : null;
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    await this.pool.query(`
      UPDATE agents
      SET status = $2, last_active_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [agentId, status]);
  }

  async startAgent(agentId: string): Promise<void> {
    await this.updateAgentStatus(agentId, 'active');

    // Create a new session
    await this.pool.query(`
      INSERT INTO agent_sessions (agent_id)
      VALUES ($1)
    `, [agentId]);
  }

  async stopAgent(agentId: string): Promise<void> {
    await this.updateAgentStatus(agentId, 'idle');

    // End current session
    await this.pool.query(`
      UPDATE agent_sessions
      SET ended_at = NOW()
      WHERE agent_id = $1 AND ended_at IS NULL
    `, [agentId]);
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  async createTask(task: Omit<AgentTask, 'id' | 'createdAt'>): Promise<AgentTask> {
    const result = await this.pool.query(`
      INSERT INTO agent_tasks (
        from_agent_id, to_agent_id, task_type, title, description,
        payload, priority, status, deadline
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      task.fromAgentId,
      task.toAgentId,
      task.taskType,
      task.title,
      task.description,
      JSON.stringify(task.payload),
      task.priority,
      task.status || 'pending',
      task.deadline
    ]);

    return this.mapTaskRow(result.rows[0]);
  }

  async getTasksForAgent(agentId: string, status?: TaskStatus): Promise<AgentTask[]> {
    let query = `
      SELECT * FROM agent_tasks
      WHERE to_agent_id = $1
    `;
    const params: any[] = [agentId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY priority DESC, created_at ASC`;

    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapTaskRow);
  }

  async getPendingTasks(): Promise<AgentTask[]> {
    const result = await this.pool.query(`
      SELECT * FROM agent_tasks
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
    `);

    return result.rows.map(this.mapTaskRow);
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    result?: Record<string, any>,
    error?: string
  ): Promise<void> {
    const updates: string[] = ['status = $2'];
    const params: any[] = [taskId, status];
    let paramIndex = 3;

    if (status === 'in_progress') {
      updates.push(`started_at = NOW()`);
    }

    if (status === 'completed' || status === 'failed') {
      updates.push(`completed_at = NOW()`);
    }

    if (result) {
      updates.push(`result = $${paramIndex}`);
      params.push(JSON.stringify(result));
      paramIndex++;
    }

    if (error) {
      updates.push(`error = $${paramIndex}`);
      params.push(error);
    }

    await this.pool.query(`
      UPDATE agent_tasks
      SET ${updates.join(', ')}
      WHERE id = $1
    `, params);
  }

  // ============================================
  // DECISION MANAGEMENT
  // ============================================

  async createDecision(decision: Omit<AgentDecision, 'id' | 'createdAt'>): Promise<AgentDecision> {
    const result = await this.pool.query(`
      INSERT INTO agent_decisions (
        agent_id, agent_role, decision_type, title, description,
        reasoning, data, confidence, impact, approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      decision.agentId,
      decision.agentRole,
      decision.decisionType,
      decision.title,
      decision.description,
      decision.reasoning,
      JSON.stringify(decision.data),
      decision.confidence,
      decision.impact,
      decision.approved
    ]);

    return this.mapDecisionRow(result.rows[0]);
  }

  async getRecentDecisions(limit: number = 20): Promise<AgentDecision[]> {
    const result = await this.pool.query(`
      SELECT * FROM agent_decisions
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(this.mapDecisionRow);
  }

  async getPendingDecisions(): Promise<AgentDecision[]> {
    const result = await this.pool.query(`
      SELECT * FROM agent_decisions
      WHERE approved = FALSE
      ORDER BY
        CASE impact
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        created_at ASC
    `);

    return result.rows.map(this.mapDecisionRow);
  }

  async approveDecision(decisionId: string, approvedBy: string): Promise<void> {
    await this.pool.query(`
      UPDATE agent_decisions
      SET approved = TRUE, approved_by = $2, executed_at = NOW()
      WHERE id = $1
    `, [decisionId, approvedBy]);
  }

  async rejectDecision(decisionId: string, rejectedBy: string, reason: string): Promise<void> {
    await this.pool.query(`
      UPDATE agent_decisions
      SET approved = FALSE, approved_by = $2, reasoning = reasoning || ' | REJECTED: ' || $3
      WHERE id = $1
    `, [decisionId, rejectedBy, reason]);
  }

  async getPendingApprovals(): Promise<AgentDecision[]> {
    return this.getPendingDecisions();
  }

  async getPendingTasksCount(): Promise<number> {
    const result = await this.pool.query(`
      SELECT COUNT(*) as count FROM agent_tasks WHERE status = 'pending'
    `);
    return parseInt(result.rows[0]?.count) || 0;
  }

  async getActiveAlerts(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT * FROM ad_bleed_alerts
      WHERE resolved = FALSE
      ORDER BY severity DESC, created_at DESC
      LIMIT 50
    `);
    return result.rows;
  }

  // ============================================
  // COMMAND CENTER SUMMARY
  // ============================================

  async getCommandCenterSummary(): Promise<CommandCenterSummary> {
    const result = await this.pool.query(`
      SELECT * FROM command_center_summary
    `);

    const row = result.rows[0] || {};
    return {
      activeAgents: parseInt(row.active_agents) || 0,
      pendingTasks: parseInt(row.pending_tasks) || 0,
      pendingDecisions: parseInt(row.pending_decisions) || 0,
      recentSignals: parseInt(row.recent_signals) || 0,
      activeAlerts: parseInt(row.active_alerts) || 0,
      deploymentsToday: parseInt(row.deployments_today) || 0,
      totalAdBleed: parseFloat(row.total_ad_bleed) || 0
    };
  }

  // ============================================
  // BOARD MEMBERS SUMMARY (for UI)
  // ============================================

  async getBoardMembers(): Promise<any[]> {
    const agents = await this.getAllAgents();

    return agents
      .filter(a => ['ceo', 'cto', 'cmo', 'cfo'].includes(a.role))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        title: this.getRoleTitle(agent.role),
        status: agent.status,
        avatar: agent.avatar,
        currentTask: null, // TODO: Get from active tasks
        metrics: {
          decisionsToday: agent.metrics.tasksCompleted,
          successRate: agent.metrics.successRate,
          avgResponseTime: agent.metrics.avgResponseTime
        }
      }));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getRoleTitle(role: AgentRole): string {
    const titles: Record<AgentRole, string> = {
      ceo: 'Chief Executive Officer',
      cto: 'Chief Technology Officer',
      cmo: 'Chief Marketing Officer',
      cfo: 'Chief Financial Officer',
      researcher: 'Research Analyst',
      architect: 'Solutions Architect',
      coder: 'Software Engineer',
      reviewer: 'Quality Assurance'
    };
    return titles[role] || role;
  }

  private mapAgentRow(row: any): Agent {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      description: row.description,
      avatar: row.avatar,
      status: row.status,
      capabilities: row.capabilities || [],
      permissions: row.permissions || {},
      manifest: row.manifest || {},
      metrics: {
        tasksCompleted: parseInt(row.tasks_completed) || 0,
        tasksInProgress: parseInt(row.tasks_in_progress) || 0,
        tasksFailed: parseInt(row.tasks_failed) || 0,
        avgResponseTime: parseFloat(row.avg_response_time) || 0,
        successRate: parseFloat(row.success_rate) || 0
      },
      lastActiveAt: row.last_active_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapTaskRow(row: any): AgentTask {
    return {
      id: row.id,
      fromAgentId: row.from_agent_id,
      toAgentId: row.to_agent_id,
      taskType: row.task_type,
      title: row.title,
      description: row.description,
      payload: row.payload || {},
      priority: row.priority,
      status: row.status,
      result: row.result,
      error: row.error,
      deadline: row.deadline,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at
    };
  }

  private mapDecisionRow(row: any): AgentDecision {
    return {
      id: row.id,
      agentId: row.agent_id,
      agentRole: row.agent_role,
      decisionType: row.decision_type,
      title: row.title,
      description: row.description,
      reasoning: row.reasoning,
      data: row.data || {},
      confidence: parseFloat(row.confidence) || 0,
      impact: row.impact,
      approved: row.approved,
      approvedBy: row.approved_by,
      executedAt: row.executed_at,
      createdAt: row.created_at
    };
  }
}

export default AgentService;
