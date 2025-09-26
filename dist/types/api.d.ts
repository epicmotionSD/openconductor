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
export interface AgentAPI {
    listAgents(params?: QueryParams): Promise<APIResponse<Agent[]>>;
    getAgent(id: string): Promise<APIResponse<Agent>>;
    createAgent(config: AgentConfig): Promise<APIResponse<Agent>>;
    updateAgent(id: string, config: Partial<AgentConfig>): Promise<APIResponse<Agent>>;
    deleteAgent(id: string): Promise<APIResponse<void>>;
    executeAgent(id: string, input: any): Promise<APIResponse<any>>;
    getAgentHealth(id: string): Promise<APIResponse<AgentHealthStatus>>;
    getAgentMetrics(id: string): Promise<APIResponse<AgentMetrics>>;
}
export interface WorkflowAPI {
    listWorkflows(params?: QueryParams): Promise<APIResponse<WorkflowDefinition[]>>;
    getWorkflow(id: string): Promise<APIResponse<WorkflowDefinition>>;
    createWorkflow(definition: WorkflowDefinition): Promise<APIResponse<WorkflowDefinition>>;
    updateWorkflow(id: string, definition: Partial<WorkflowDefinition>): Promise<APIResponse<WorkflowDefinition>>;
    deleteWorkflow(id: string): Promise<APIResponse<void>>;
    executeWorkflow(id: string, input?: any): Promise<APIResponse<WorkflowExecution>>;
    getExecution(executionId: string): Promise<APIResponse<WorkflowExecution>>;
    listExecutions(workflowId?: string, params?: QueryParams): Promise<APIResponse<WorkflowExecution[]>>;
    cancelExecution(executionId: string): Promise<APIResponse<void>>;
    pauseExecution(executionId: string): Promise<APIResponse<void>>;
    resumeExecution(executionId: string): Promise<APIResponse<void>>;
}
export interface ToolAPI {
    listTools(params?: QueryParams): Promise<APIResponse<Tool[]>>;
    getTool(id: string): Promise<APIResponse<Tool>>;
    registerTool(tool: Tool): Promise<APIResponse<Tool>>;
    updateTool(id: string, updates: Partial<Tool>): Promise<APIResponse<Tool>>;
    unregisterTool(id: string): Promise<APIResponse<void>>;
    executeTool(id: string, operation: string, params: any): Promise<APIResponse<ToolExecutionResult>>;
    getToolHealth(id: string): Promise<APIResponse<ToolHealthStatus>>;
    testTool(id: string): Promise<APIResponse<ToolTestResult>>;
}
export interface PluginAPI {
    listPlugins(params?: QueryParams): Promise<APIResponse<Plugin[]>>;
    getPlugin(id: string): Promise<APIResponse<Plugin>>;
    installPlugin(source: PluginSource): Promise<APIResponse<Plugin>>;
    updatePlugin(id: string, version?: string): Promise<APIResponse<Plugin>>;
    removePlugin(id: string): Promise<APIResponse<void>>;
    activatePlugin(id: string): Promise<APIResponse<void>>;
    deactivatePlugin(id: string): Promise<APIResponse<void>>;
    getPluginHealth(id: string): Promise<APIResponse<PluginHealthStatus>>;
    searchPlugins(query: PluginSearchQuery): Promise<APIResponse<PluginRegistryEntry[]>>;
}
export interface EventAPI {
    getEvents(filter?: EventFilter, params?: QueryParams): Promise<APIResponse<OpenConductorEvent[]>>;
    publishEvent(event: OpenConductorEvent): Promise<APIResponse<void>>;
    createSubscription(subscription: EventSubscription): Promise<APIResponse<EventSubscription>>;
    listSubscriptions(params?: QueryParams): Promise<APIResponse<EventSubscription[]>>;
    updateSubscription(id: string, updates: Partial<EventSubscription>): Promise<APIResponse<EventSubscription>>;
    deleteSubscription(id: string): Promise<APIResponse<void>>;
}
export interface RegistryAPI {
    searchAgents(query: AgentSearchQuery): Promise<APIResponse<AgentRegistryEntry[]>>;
    getAgentInfo(id: string): Promise<APIResponse<AgentRegistryEntry>>;
    publishAgent(agent: AgentRegistryEntry): Promise<APIResponse<void>>;
    updateAgentListing(id: string, updates: Partial<AgentRegistryEntry>): Promise<APIResponse<void>>;
    getAgentStats(id: string): Promise<APIResponse<AgentStats>>;
}
export interface SystemAPI {
    getHealth(): Promise<APIResponse<SystemHealth>>;
    getMetrics(): Promise<APIResponse<SystemMetrics>>;
    getInfo(): Promise<APIResponse<SystemInfo>>;
    getStatus(): Promise<APIResponse<SystemStatus>>;
    enableMaintenance(message?: string): Promise<APIResponse<void>>;
    disableMaintenance(): Promise<APIResponse<void>>;
}
/**
 * WebSocket API Types
 *
 * Real-time communication via WebSocket
 */
export type WebSocketMessageType = 'subscribe' | 'unsubscribe' | 'event' | 'ping' | 'pong' | 'error';
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
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(subscription: WebSocketSubscription): Promise<string>;
    unsubscribe(subscriptionId: string): Promise<void>;
    onEvent(handler: (event: OpenConductorEvent) => void): void;
    onError(handler: (error: Error) => void): void;
    onClose(handler: () => void): void;
    isConnected(): boolean;
    getConnectionStats(): ConnectionStats;
}
/**
 * GraphQL API Types
 *
 * GraphQL schema definitions
 */
export interface GraphQLSchema {
    Query: {
        agent: (id: string) => Agent | null;
        agents: (filter?: AgentFilter) => Agent[];
        workflow: (id: string) => WorkflowDefinition | null;
        workflows: (filter?: WorkflowFilter) => WorkflowDefinition[];
        execution: (id: string) => WorkflowExecution | null;
        executions: (filter?: ExecutionFilter) => WorkflowExecution[];
        events: (filter?: EventFilter) => OpenConductorEvent[];
        tool: (id: string) => Tool | null;
        tools: (filter?: ToolFilter) => Tool[];
        systemHealth: () => SystemHealth;
        systemMetrics: () => SystemMetrics;
    };
    Mutation: {
        createAgent: (input: CreateAgentInput) => Agent;
        updateAgent: (id: string, input: UpdateAgentInput) => Agent;
        deleteAgent: (id: string) => boolean;
        executeAgent: (id: string, input: any) => any;
        createWorkflow: (input: CreateWorkflowInput) => WorkflowDefinition;
        updateWorkflow: (id: string, input: UpdateWorkflowInput) => WorkflowDefinition;
        deleteWorkflow: (id: string) => boolean;
        executeWorkflow: (id: string, input?: any) => WorkflowExecution;
        registerTool: (input: RegisterToolInput) => Tool;
        updateTool: (id: string, input: UpdateToolInput) => Tool;
        unregisterTool: (id: string) => boolean;
        publishEvent: (input: PublishEventInput) => boolean;
    };
    Subscription: {
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
    agents: AgentAPI;
    workflows: WorkflowAPI;
    tools: ToolAPI;
    plugins: PluginAPI;
    events: EventAPI;
    registry: RegistryAPI;
    system: SystemAPI;
    websocket: WebSocketClient;
    configure(config: ClientConfig): void;
    authenticate(credentials: AuthCredentials): Promise<void>;
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
//# sourceMappingURL=api.d.ts.map