// Command Center API Client
// Connects the frontend to the Agent Orchestrator backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  avgResponseTime: number;
  successRate: number;
}

export interface Agent {
  id: string;
  name: string;
  role: 'ceo' | 'cto' | 'cmo' | 'cfo';
  description: string;
  avatar: string;
  status: 'idle' | 'active' | 'paused' | 'error' | 'offline';
  metrics: AgentMetrics;
  lastActiveAt: string | null;
}

export interface OrchestratorStatus {
  isRunning: boolean;
  startedAt: string | null;
  agents: Agent[];
  summary: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalTasksCompleted: number;
    totalTasksPending: number;
  };
}

export interface Decision {
  id: string;
  agentId: string;
  agentRole: 'ceo' | 'cto' | 'cmo' | 'cfo';
  decisionType: string;
  title: string;
  description: string;
  reasoning: string;
  data: Record<string, any>;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  approved: boolean;
  approvedBy: string | null;
  executedAt: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  fromAgentId: string | null;
  toAgentId: string;
  taskType: string;
  title: string;
  description: string;
  payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result: any;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CommandCenterSummary {
  orchestrator: OrchestratorStatus;
  recentDecisions: Decision[];
  activeAlerts: any[];
  pendingApprovals: Decision[];
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/v1/command-center${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data as T;
}

// ============================================
// ORCHESTRATOR MANAGEMENT
// ============================================

export async function getCommandCenterSummary(): Promise<CommandCenterSummary> {
  return apiCall<CommandCenterSummary>('/summary');
}

export async function getOrchestratorStatus(): Promise<OrchestratorStatus> {
  return apiCall<OrchestratorStatus>('/orchestrator/status');
}

export async function startOrchestrator(): Promise<{ message: string; status: OrchestratorStatus }> {
  return apiCall('/orchestrator/start', { method: 'POST' });
}

export async function stopOrchestrator(): Promise<{ message: string }> {
  return apiCall('/orchestrator/stop', { method: 'POST' });
}

// ============================================
// AGENT CONTROL
// ============================================

export async function startAgent(role: string): Promise<{ message: string }> {
  return apiCall(`/agents/${role}/start`, { method: 'POST' });
}

export async function stopAgent(role: string): Promise<{ message: string }> {
  return apiCall(`/agents/${role}/stop`, { method: 'POST' });
}

export async function pauseAgent(role: string): Promise<{ message: string }> {
  return apiCall(`/agents/${role}/pause`, { method: 'POST' });
}

export async function resumeAgent(role: string): Promise<{ message: string }> {
  return apiCall(`/agents/${role}/resume`, { method: 'POST' });
}

// ============================================
// TASKS
// ============================================

export async function getPendingTasks(): Promise<Task[]> {
  return apiCall<Task[]>('/tasks/pending');
}

export async function createTask(task: {
  toRole: string;
  taskType: string;
  title: string;
  description?: string;
  payload?: Record<string, any>;
  priority?: string;
}): Promise<{ message: string }> {
  return apiCall('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

// ============================================
// DECISIONS
// ============================================

export async function getRecentDecisions(limit = 20): Promise<Decision[]> {
  return apiCall<Decision[]>(`/decisions/recent?limit=${limit}`);
}

export async function getPendingDecisions(): Promise<Decision[]> {
  return apiCall<Decision[]>('/decisions/pending');
}

export async function approveDecision(decisionId: string, approvedBy = 'human'): Promise<{ message: string }> {
  return apiCall(`/decisions/${decisionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy }),
  });
}

export async function rejectDecision(
  decisionId: string,
  reason: string,
  rejectedBy = 'human'
): Promise<{ message: string }> {
  return apiCall(`/decisions/${decisionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectedBy, reason }),
  });
}

// ============================================
// ALERTS
// ============================================

export async function getActiveAlerts(): Promise<any[]> {
  return apiCall<any[]>('/alerts');
}

// ============================================
// BOARD MEMBERS
// ============================================

export async function getBoardMembers(): Promise<Agent[]> {
  return apiCall<Agent[]>('/board');
}
