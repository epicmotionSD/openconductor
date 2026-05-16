// Board of Directors - Revenue Sniper DevOps Agent Types
// Multi-agent supervisor system for autonomous revenue operations

// Agent role hierarchy
export type AgentRole =
  | 'ceo'       // Chief Executive - Supervisor, strategic decisions
  | 'cto'       // Chief Technology - Architecture, template selection
  | 'cmo'       // Chief Marketing - Trend analysis, campaigns
  | 'cfo'       // Chief Financial - Revenue analysis, ad bleed detection
  | 'researcher'  // Intelligence gathering
  | 'architect'   // Technical design
  | 'coder'       // Code generation
  | 'reviewer';   // Quality assurance

export type AgentStatus = 'idle' | 'active' | 'paused' | 'error' | 'offline';

// Core Agent interface
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  description: string;
  avatar?: string;
  capabilities: string[];
  permissions: AgentPermissions;
  manifest: AgentManifest;
  metrics: AgentMetrics;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
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

export interface AgentManifest {
  version: string;
  tools: string[];
  env: Record<string, EnvVarConfig>;
  triggers: AgentTrigger[];
  schedule?: CronSchedule;
}

export interface EnvVarConfig {
  description: string;
  required: boolean;
  default?: string;
  secret?: boolean;
}

export interface AgentTrigger {
  type: 'cron' | 'event' | 'signal' | 'manual';
  config: Record<string, any>;
  description: string;
}

export interface CronSchedule {
  expression: string;
  timezone: string;
  enabled: boolean;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  avgResponseTime: number;
  successRate: number;
  lastDecisionAt?: string;
  revenueImpact?: number;
}

// Inter-agent communication
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentTask {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  taskType: string;
  title: string;
  description?: string;
  payload: Record<string, any>;
  priority: TaskPriority;
  status: TaskStatus;
  result?: Record<string, any>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
}

// Agent decision audit trail
export type DecisionType =
  | 'deploy_template'
  | 'pause_keyword'
  | 'adjust_budget'
  | 'create_campaign'
  | 'flag_ad_bleed'
  | 'recommend_action'
  | 'escalate_to_human';

export interface AgentDecision {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  decisionType: DecisionType;
  title: string;
  description: string;
  reasoning: string;
  data: Record<string, any>;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  approved: boolean;
  approvedBy?: string; // agent ID or 'human'
  executedAt?: string;
  createdAt: string;
}

// Revenue Intelligence Types
export type SignalType = 'trend' | 'ad_bleed' | 'opportunity' | 'threat' | 'competitor';
export type SignalSource = 'apify' | 'google_ads' | 'google_trends' | 'social' | 'serp';

export interface RevenueSignal {
  id: string;
  signalType: SignalType;
  source: SignalSource;
  keyword?: string;
  title: string;
  description: string;
  data: Record<string, any>;
  confidence: number; // 0-1
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionTaken: boolean;
  actionDetails?: string;
  createdAt: string;
  expiresAt?: string;
}

// Trend Arbitrage Types
export type TrendCategory = 'rising' | 'breakout' | 'declining' | 'stable';
export type CompetitionLevel = 'low' | 'medium' | 'high' | 'saturated';
export type RecommendedAction = 'attack' | 'defend' | 'monitor' | 'ignore';

export interface TrendSignal {
  keyword: string;
  category: TrendCategory;
  growthRate: number; // percentage
  currentVolume: number;
  predictedVolume: number;
  competitionLevel: CompetitionLevel;
  recommendedAction: RecommendedAction;
  relatedKeywords: string[];
  geo?: string;
  timeframe: string;
}

// Ad Bleed Detection Types
export type AdBleedType =
  | 'intent_mismatch'      // Informational keyword with transactional ad
  | 'cannibalization'      // Paid ad competing with top organic
  | 'dead_trend'           // High spend on declining keyword
  | 'negative_keyword'     // Low-intent traffic leakage
  | 'competitor_gap';      // Missing keyword where competitor appears

export interface AdBleedAlert {
  id: string;
  bleedType: AdBleedType;
  keyword: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  wastedSpend: number; // estimated wasted amount
  wastedSpendPeriod: string; // e.g., '7d', '30d'
  currentCpc: number;
  conversionRate: number;
  organicRank?: number;
  recommendation: string;
  autoFixAvailable: boolean;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

// Template System Types
export type TemplateId = 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07' | 'T08' | 'T09' | 'T10';
export type TemplateIntent = 'transactional' | 'informational' | 'commercial' | 'navigational';

export interface Template {
  id: string;
  templateId: TemplateId;
  name: string;
  description: string;
  purpose: string;
  targetIntent: TemplateIntent;
  features: string[];
  componentSchema: Record<string, any>;
  previewUrl?: string;
  deployCount: number;
  avgConversionRate?: number;
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_DEFINITIONS: Record<TemplateId, { name: string; purpose: string; intent: TemplateIntent }> = {
  T01: { name: 'The Converter', purpose: 'High-intent PPC landing page', intent: 'transactional' },
  T02: { name: 'The Booking Portal', purpose: 'Appointment scheduling', intent: 'transactional' },
  T03: { name: 'The Visual Gallery', purpose: 'Portfolio showcase', intent: 'commercial' },
  T04: { name: 'The Educational Hub', purpose: 'SEO blog posts', intent: 'informational' },
  T05: { name: 'The Comparison Guide', purpose: 'Decision support', intent: 'commercial' },
  T06: { name: 'The Product Drop', purpose: 'E-commerce product', intent: 'transactional' },
  T07: { name: 'The Local Geo-Page', purpose: 'Local SEO', intent: 'transactional' },
  T08: { name: 'The Lead Magnet', purpose: 'Email capture', intent: 'informational' },
  T09: { name: 'The Review Wall', purpose: 'Social proof', intent: 'commercial' },
  T10: { name: 'The Link-in-Bio', purpose: 'Social traffic routing', intent: 'navigational' },
};

// Deployment Types
export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back';

export interface Deployment {
  id: string;
  templateId: TemplateId;
  templateName: string;
  targetKeyword: string;
  targetUrl: string;
  status: DeploymentStatus;
  triggeredBy: string; // agent ID
  approvedBy?: string; // agent ID or 'human'
  vercelDeploymentId?: string;
  previewUrl?: string;
  liveUrl?: string;
  roasPredicted?: number;
  roasActual?: number;
  qualityScore?: number;
  buildLog?: string;
  error?: string;
  createdAt: string;
  deployedAt?: string;
  rolledBackAt?: string;
}

// Board of Directors Summary Types (for UI)
export interface BoardSummary {
  agents: BoardMember[];
  activeTasksCount: number;
  pendingDecisionsCount: number;
  recentSignalsCount: number;
  adBleedAlertsCount: number;
  deploymentsToday: number;
  revenueImpactToday: number;
}

export interface BoardMember {
  id: string;
  name: string;
  role: AgentRole;
  title: string; // e.g., 'Chief Executive Officer'
  status: AgentStatus;
  avatar: string;
  currentTask?: string;
  metrics: {
    decisionsToday: number;
    successRate: number;
    avgResponseTime: number;
  };
}

// Command Center Dashboard Types
export interface CommandCenterStats {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  };
  adSpend: {
    today: number;
    thisWeek: number;
    bleedDetected: number;
    bleedPercentage: number;
  };
  deployments: {
    today: number;
    thisWeek: number;
    successRate: number;
    avgTimeToLive: number; // minutes
  };
  trends: {
    risingCount: number;
    breakoutCount: number;
    opportunitiesCount: number;
  };
}

// API Response types for Command Center
export interface CommandCenterResponse {
  board: BoardSummary;
  stats: CommandCenterStats;
  recentSignals: RevenueSignal[];
  recentDecisions: AgentDecision[];
  activeAlerts: AdBleedAlert[];
  pendingDeployments: Deployment[];
}

// WebSocket/SSE Event Types
export type CommandCenterEventType =
  | 'agent_status_change'
  | 'new_signal'
  | 'new_decision'
  | 'deployment_update'
  | 'ad_bleed_alert'
  | 'task_update'
  | 'metrics_update';

export interface CommandCenterEvent {
  type: CommandCenterEventType;
  timestamp: string;
  data: Record<string, any>;
}
