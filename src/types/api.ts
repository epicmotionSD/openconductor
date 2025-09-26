/**
 * OpenConductor API Types
 * 
 * REST, WebSocket, and GraphQL API definitions that enable developers
 * to integrate with OpenConductor using any approach they prefer.
 * 
 * "The Universal Conductor for Your AI Agents"
 */

import { Agent, AgentConfig, AgentRegistryEntry } from './agent';
import { WorkflowDefinition, WorkflowExecution } from './orchestration';
import { OpenConductorEvent } from './events';
import { Tool, ToolExecutionResult } from './tools';
import { Plugin } from './plugins';

/**
 * API Response Wrapper
 * 
 * Standard response format for all API endpoints
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: Date;
    version: string;
    requestId: string;
    executionTime?: number;
  };
  pagination?: PaginationInfo;
}

/**
 * API Error
 * 
 * Standard error format
 */
export interface APIError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  stack?: string;
}

/**
 * Pagination Information
 * 
 * Pagination metadata for list responses
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Query Parameters
 * 
 * Common query parameters for API endpoints
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

/**
 * REST API Endpoints
 * 
 * Type definitions for REST API endpoints
 */

// Agent Management API
export interface AgentAPI {
  // List agents
  listAgents(params?: QueryParams): Promise<APIResponse<Agent[]>>;
  
  // Get agent by ID
  getAgent(id: string): Promise<APIResponse<Agent>>;
  
  // Create new agent
  createAgent(config: AgentConfig): Promise<APIResponse<Agent>>;
  
  // Update agent
  updateAgent(id: string, config: Partial<AgentConfig>): Promise<APIResponse<Agent>>;
  
  // Delete agent
  deleteAgent(id: string): Promise<APIResponse<void>>;
  
  // Execute agent
  executeAgent(id: string, input: any): Promise<APIResponse<any>>;
  
  // Get agent health
  getAgentHealth(id: string): Promise<APIResponse<AgentHealthStatus>>;
  
  // Get agent metrics
  getAgentMetrics(id: string): Promise<APIResponse<AgentMetrics>>;
}

// Workflow Management API
export interface WorkflowAPI {
  // List workflows
  listWorkflows(params?: QueryParams): Promise<APIResponse<WorkflowDefinition[]>>;
  
  // Get workflow by ID
  getWorkflow(id: string): Promise<APIResponse<WorkflowDefinition>>;
  
  // Create new workflow
  createWorkflow(definition: WorkflowDefinition): Promise<APIResponse<WorkflowDefinition>>;
  
  // Update workflow
  updateWorkflow(id: string, definition: Partial<WorkflowDefinition>): Promise<APIResponse<WorkflowDefinition>>;
  
  // Delete workflow
  deleteWorkflow(id: string): Promise<APIResponse<void>>;
  
  // Execute workflow
  executeWorkflow(id: string, input?: any): Promise<APIResponse<WorkflowExecution>>;
  
  // Get workflow execution
  getExecution(executionId: string): Promise<APIResponse<WorkflowExecution>>;
  
  // List workflow executions
  listExecutions(workflowId?: string, params?: QueryParams): Promise<APIResponse<WorkflowExecution[]>>;
  
  // Cancel workflow execution
  cancelExecution(executionId: string): Promise<APIResponse<void>>;
  
  // Pause workflow execution
  pauseExecution(executionId: string): Promise<APIResponse<void>>;
  
  // Resume workflow execution
  resumeExecution(executionId: string): Promise<APIResponse<void>>;
}

// Tool Management API
export interface ToolAPI {
  // List tools
  listTools(params?: QueryParams): Promise<APIResponse<Tool[]>>;
  
  // Get tool by ID
  getTool(id: string): Promise<APIResponse<Tool>>;
  
  // Register new tool
  registerTool(tool: Tool): Promise<APIResponse<Tool>>;
  
  // Update tool
  updateTool(id: string, updates: Partial<Tool>): Promise<APIResponse<Tool>>;
  
  // Unregister tool
  unregisterTool(id: string): Promise<APIResponse<void>>;
  
  // Execute tool
  executeTool(id: string, operation: string, params: any): Promise<APIResponse<ToolExecutionResult>>;
  
  // Get tool health
  getToolHealth(id: string): Promise<APIResponse<ToolHealthStatus>>;
  
  // Test tool connection
  testTool(id: string): Promise<APIResponse<ToolTestResult>>;
}

// Plugin Management API
export interface PluginAPI {
  // List plugins
  listPlugins(params?: QueryParams): Promise<APIResponse<Plugin[]>>;
  
  // Get plugin by ID
  getPlugin(id: string): Promise<APIResponse<Plugin>>;
  
  // Install plugin
  installPlugin(source: PluginSource): Promise<APIResponse<Plugin>>;
  
  // Update plugin
  updatePlugin(id: string, version?: string): Promise<APIResponse<Plugin>>;
  
  // Remove plugin
  removePlugin(id: string): Promise<APIResponse<void>>;
  
  // Activate plugin
  activatePlugin(id: string): Promise<APIResponse<void>>;
  
  // Deactivate plugin
  deactivatePlugin(id: string): Promise<APIResponse<void>>;
  
  // Get plugin health
  getPluginHealth(id: string): Promise<APIResponse<PluginHealthStatus>>;
  
  // Search plugin registry
  searchPlugins(query: PluginSearchQuery): Promise<APIResponse<PluginRegistryEntry[]>>;
}

// Event Management API
export interface EventAPI {
  // Get events
  getEvents(filter?: EventFilter, params?: QueryParams): Promise<APIResponse<OpenConductorEvent[]>>;
  
  // Publish event
  publishEvent(event: OpenConductorEvent): Promise<APIResponse<void>>;
  
  // Create subscription
  createSubscription(subscription: EventSubscription): Promise<APIResponse<EventSubscription>>;
  
  // List subscriptions
  listSubscriptions(params?: QueryParams): Promise<APIResponse<EventSubscription[]>>;
  
  // Update subscription
  updateSubscription(id: string, updates: Partial<EventSubscription>): Promise<APIResponse<EventSubscription>>;
  
  // Delete subscription
  deleteSubscription(id: string): Promise<APIResponse<void>>;
}

// Registry API
export interface RegistryAPI {
  // Search agents
  searchAgents(query: AgentSearchQuery): Promise<APIResponse<AgentRegistryEntry[]>>;
  
  // Get agent info
  getAgentInfo(id: string): Promise<APIResponse<AgentRegistryEntry>>;
  
  // Publish agent
  publishAgent(agent: AgentRegistryEntry): Promise<APIResponse<void>>;
  
  // Update agent listing
  updateAgentListing(id: string, updates: Partial<AgentRegistryEntry>): Promise<APIResponse<void>>;
  
  // Get agent statistics
  getAgentStats(id: string): Promise<APIResponse<AgentStats>>;
}

// System API
export interface SystemAPI {
  // Get system health
  getHealth(): Promise<APIResponse<SystemHealth>>;
  
  // Get system metrics
  getMetrics(): Promise<APIResponse<SystemMetrics>>;
  
  // Get system info
  getInfo(): Promise<APIResponse<SystemInfo>>;
  
  // Get system status
  getStatus(): Promise<APIResponse<SystemStatus>>;
  
  // Maintenance mode
  enableMaintenance(message?: string): Promise<APIResponse<void>>;
  disableMaintenance(): Promise<APIResponse<void>>;
}

/**
 * WebSocket API Types
 * 
 * Real-time communication via WebSocket
 */

export type WebSocketMessageType = 
  | 'subscribe'
  | 'unsubscribe' 
  | 'event'
  | 'ping'
  | 'pong'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  id?: string;
  data?: any;
  timestamp: Date;
}

export interface WebSocketSubscription {
  type: 'events' | 'agent-status' | 'workflow-progress' | 'system-metrics';
  filter?: any;
  id?: string;
}

export interface WebSocketClient {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Subscriptions
  subscribe(subscription: WebSocketSubscription): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
  
  // Event handling
  onEvent(handler: (event: OpenConductorEvent) => void): void;
  onError(handler: (error: Error) => void): void;
  onClose(handler: () => void): void;
  
  // Status
  isConnected(): boolean;
  getConnectionStats(): ConnectionStats;
}

/**
 * GraphQL API Types
 * 
 * GraphQL schema definitions
 */

export interface GraphQLSchema {
  // Queries
  Query: {
    // Agent queries
    agent: (id: string) => Agent | null;
    agents: (filter?: AgentFilter) => Agent[];
    
    // Workflow queries
    workflow: (id: string) => WorkflowDefinition | null;
    workflows: (filter?: WorkflowFilter) => WorkflowDefinition[];
    
    // Execution queries
    execution: (id: string) => WorkflowExecution | null;
    executions: (filter?: ExecutionFilter) => WorkflowExecution[];
    
    // Event queries
    events: (filter?: EventFilter) => OpenConductorEvent[];
    
    // Tool queries
    tool: (id: string) => Tool | null;
    tools: (filter?: ToolFilter) => Tool[];
    
    // System queries
    systemHealth: () => SystemHealth;
    systemMetrics: () => SystemMetrics;
  };
  
  // Mutations
  Mutation: {
    // Agent mutations
    createAgent: (input: CreateAgentInput) => Agent;
    updateAgent: (id: string, input: UpdateAgentInput) => Agent;
    deleteAgent: (id: string) => boolean;
    executeAgent: (id: string, input: any) => any;
    
    // Workflow mutations
    createWorkflow: (input: CreateWorkflowInput) => WorkflowDefinition;
    updateWorkflow: (id: string, input: UpdateWorkflowInput) => WorkflowDefinition;
    deleteWorkflow: (id: string) => boolean;
    executeWorkflow: (id: string, input?: any) => WorkflowExecution;
    
    // Tool mutations
    registerTool: (input: RegisterToolInput) => Tool;
    updateTool: (id: string, input: UpdateToolInput) => Tool;
    unregisterTool: (id: string) => boolean;
    
    // Event mutations
    publishEvent: (input: PublishEventInput) => boolean;
  };
  
  // Subscriptions
  Subscription: {
    // Real-time subscriptions
    agentStatusUpdates: (agentId?: string) => AgentStatusUpdate;
    workflowProgress: (executionId: string) => WorkflowProgressUpdate;
    systemMetrics: () => SystemMetrics;
    events: (filter?: EventFilter) => OpenConductorEvent;
  };
}

/**
 * GraphQL Input Types
 */
export interface CreateAgentInput {
  name: string;
  type: string;
  version: string;
  description?: string;
  config: AgentConfigInput;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  config?: Partial<AgentConfigInput>;
}

export interface AgentConfigInput {
  capabilities: string[];
  tools: string[];
  memory: MemoryConfigInput;
  resources?: ResourceLimitsInput;
}

export interface MemoryConfigInput {
  type: string;
  store: string;
  ttl?: number;
  maxSize?: number;
}

export interface ResourceLimitsInput {
  cpu?: string;
  memory?: string;
  storage?: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  version: string;
  strategy: string;
  steps: WorkflowStepInput[];
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  steps?: WorkflowStepInput[];
}

export interface WorkflowStepInput {
  id: string;
  name: string;
  type: string;
  config: any;
}

export interface RegisterToolInput {
  name: string;
  type: string;
  version: string;
  description: string;
  config: any;
}

export interface UpdateToolInput {
  name?: string;
  description?: string;
  config?: any;
}

export interface PublishEventInput {
  type: string;
  source: string;
  data: any;
  priority?: string;
  target?: string;
}

/**
 * Supporting Types
 */

export interface AgentHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details: any;
}

export interface AgentMetrics {
  executionCount: number;
  successRate: number;
  averageLatency: number;
  errorRate: number;
  uptime: number;
}

export interface ToolHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  connectivity: boolean;
  latency: number;
}

export interface ToolTestResult {
  success: boolean;
  latency: number;
  error?: string;
  timestamp: Date;
}

export interface PluginSource {
  type: 'registry' | 'npm' | 'git' | 'local';
  location: string;
  version?: string;
}

export interface PluginSearchQuery {
  q?: string;
  type?: string;
  tags?: string[];
  limit?: number;
}

export interface PluginRegistryEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
}

export interface PluginHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  memoryUsage: number;
  errorCount: number;
}

export interface EventFilter {
  types?: string[];
  sources?: string[];
  since?: Date;
  limit?: number;
}

export interface EventSubscription {
  id: string;
  filter: EventFilter;
  endpoint: string;
  active: boolean;
}

export interface AgentSearchQuery {
  q?: string;
  type?: string;
  tags?: string[];
  limit?: number;
}

export interface AgentFilter {
  type?: string;
  status?: string;
  tags?: string[];
}

export interface WorkflowFilter {
  author?: string;
  status?: string;
  tags?: string[];
}

export interface ExecutionFilter {
  workflowId?: string;
  status?: string;
  since?: Date;
}

export interface ToolFilter {
  type?: string;
  status?: string;
  author?: string;
}

export interface AgentStats {
  downloads: number;
  installations: number;
  rating: number;
  reviews: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, string>;
  timestamp: Date;
}

export interface SystemMetrics {
  agents: {
    total: number;
    active: number;
    executing: number;
  };
  workflows: {
    total: number;
    running: number;
    completed: number;
  };
  system: {
    cpu: number;
    memory: number;
    uptime: number;
  };
}

export interface SystemInfo {
  version: string;
  buildDate: Date;
  environment: string;
  features: string[];
}

export interface SystemStatus {
  status: 'running' | 'maintenance' | 'error';
  maintenanceMessage?: string;
  since: Date;
}

export interface ConnectionStats {
  connectedAt: Date;
  messagesSent: number;
  messagesReceived: number;
  reconnections: number;
  latency: number;
}

export interface AgentStatusUpdate {
  agentId: string;
  status: string;
  timestamp: Date;
  metrics?: any;
}

export interface WorkflowProgressUpdate {
  executionId: string;
  progress: number;
  currentStep?: string;
  timestamp: Date;
}

/**
 * API Client Interface
 * 
 * Main client interface for interacting with OpenConductor
 */
export interface OpenConductorClient {
  // API endpoints
  agents: AgentAPI;
  workflows: WorkflowAPI;
  tools: ToolAPI;
  plugins: PluginAPI;
  events: EventAPI;
  registry: RegistryAPI;
  system: SystemAPI;
  
  // Real-time communication
  websocket: WebSocketClient;
  
  // Configuration
  configure(config: ClientConfig): void;
  
  // Authentication
  authenticate(credentials: AuthCredentials): Promise<void>;
  
  // Health
  healthCheck(): Promise<boolean>;
}

/**
 * Client Configuration
 */
export interface ClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  websocket?: {
    url: string;
    autoReconnect: boolean;
    reconnectInterval: number;
  };
}

/**
 * Authentication Credentials
 */
export interface AuthCredentials {
  type: 'api-key' | 'bearer' | 'basic' | 'oauth2';
  token?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Rate Limiting
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

/**
 * API Middleware
 */
export type RequestMiddleware = (request: any) => any | Promise<any>;
export type ResponseMiddleware = (response: any) => any | Promise<any>;

export interface MiddlewareManager {
  addRequestMiddleware(middleware: RequestMiddleware): void;
  addResponseMiddleware(middleware: ResponseMiddleware): void;
  removeMiddleware(middleware: RequestMiddleware | ResponseMiddleware): void;
}