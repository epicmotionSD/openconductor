/**
 * OpenConductor Tools & Integrations
 * 
 * Tool definitions that enable agents to integrate with external systems.
 * These tools embody the "Open" principle - integrate any agent, from any vendor, seamlessly.
 */

export type ToolType =
  | 'api'
  | 'database'
  | 'file-system'
  | 'messaging'
  | 'notification'
  | 'ml-model'
  | 'workflow'
  | 'monitoring'
  | 'custom';

export type ToolCategory = 'communication' | 'data' | 'ai' | 'workflow' | 'monitoring' | 'security' | 'utility';

export type AuthenticationType = 'none' | 'api-key' | 'bearer' | 'basic' | 'oauth2' | 'custom';

export type ToolStatus = 'active' | 'inactive' | 'error' | 'deprecated';

/**
 * Tool Execution
 *
 * Represents a tool execution in progress
 */
export interface ToolExecution {
  id: string;
  toolId: string;
  input: any;
  context: Record<string, any>;
  startTime: Date;
  status: 'running' | 'completed' | 'failed';
  endTime?: Date;
  output?: any;
  error?: string;
  executionTime?: number;
}

/**
 * Tool Metadata
 *
 * Extended metadata for tools
 */
export interface ToolMetadata {
  tags?: string[];
  author?: string;
  documentation?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
}

/**
 * Base Tool Interface
 *
 * All tools in OpenConductor implement this interface
 */
export interface Tool {
  id: string;
  name: string;
  type: ToolType;
  category: ToolCategory;
  version: string;
  description: string;
  
  // Configuration
  config?: ToolConfig;
  
  // Capabilities
  capabilities?: ToolCapability[];
  
  // Status and health
  status?: ToolStatus;
  lastHealthCheck?: Date;
  
  // Lifecycle methods
  initialize?(config?: ToolConfig): Promise<void>;
  execute(input: any, context?: Record<string, any>): Promise<any>;
  healthCheck?(): Promise<ToolHealthStatus>;
  cleanup?(): Promise<void>;
  
  // Metadata
  metadata?: ToolMetadata;
  tags?: string[];
  author?: string;
  documentation?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Tool Configuration
 * 
 * Configuration settings for tools
 */
export interface ToolConfig {
  // Connection settings
  endpoint?: string;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
  };
  
  // Authentication
  authentication?: {
    type: AuthenticationType;
    credentials?: Record<string, string>;
    refreshToken?: string;
    tokenEndpoint?: string;
  };
  
  // Rate limiting
  rateLimit?: {
    requestsPerSecond: number;
    burstCapacity: number;
    maxRequests?: number;
    windowMs?: number;
  };
  
  // Caching
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  
  // Custom configuration
  custom?: Record<string, any>;
}

/**
 * Tool Capability
 * 
 * Defines what operations a tool can perform
 */
export interface ToolCapability {
  name: string;
  description: string;
  operations: ToolOperation[];
  
  // Input/output schema
  inputSchema?: any; // JSON Schema
  outputSchema?: any; // JSON Schema
  
  // Requirements
  requiredPermissions?: string[];
  minimumVersion?: string;
}

/**
 * Tool Operation
 * 
 * Individual operations that can be performed by a tool
 */
export interface ToolOperation {
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CUSTOM';
  
  // Parameters
  parameters: ToolParameter[];
  
  // Response
  responseType: 'json' | 'text' | 'binary' | 'stream';
  
  // Metadata
  idempotent?: boolean;
  deprecated?: boolean;
  estimatedLatency?: number;
}

/**
 * Tool Parameter
 * 
 * Parameters for tool operations
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minimum?: number;
    maximum?: number;
    enum?: any[];
  };
}

/**
 * Tool Execution Result
 * 
 * Result of executing a tool operation
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // Execution metrics
  executionTime: number;
  retryCount?: number;
  cached?: boolean;
  
  // Metadata
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Tool Health Status
 * 
 * Health information for a tool
 */
export interface ToolHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  
  // Connectivity
  connectivity: {
    reachable: boolean;
    latency?: number;
    lastSuccessfulConnection?: Date;
  };
  
  // Authentication
  authentication: {
    valid: boolean;
    expiresAt?: Date;
    lastRefresh?: Date;
  };
  
  // Metrics
  metrics: {
    successRate: number;
    averageLatency: number;
    errorRate: number;
    requestCount: number;
  };
  
  // Issues
  issues?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    code?: string;
  }>;
}

/**
 * Built-in Tool Types
 * 
 * Pre-built tools for common integration patterns
 */

/**
 * API Tool
 * 
 * Generic REST API integration tool
 */
export interface APITool extends Tool {
  type: 'api';
  config: ToolConfig & {
    baseURL: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
  };
}

/**
 * Database Tool  
 * 
 * Database integration tool
 */
export interface DatabaseTool extends Tool {
  type: 'database';
  config: ToolConfig & {
    connectionString: string;
    database: string;
    pool?: {
      min: number;
      max: number;
      idleTimeoutMillis: number;
    };
  };
}

/**
 * HubSpot Tool
 * 
 * HubSpot CRM integration (inspired by Command Center)
 */
export interface HubSpotTool extends APITool {
  config: ToolConfig & {
    baseURL: 'https://api.hubapi.com';
    apiKey: string;
    portalId?: string;
    rateLimits: {
      daily: number;
      tenSecond: number;
    };
  };
}

/**
 * OpenAI Tool
 * 
 * OpenAI API integration for AI capabilities
 */
export interface OpenAITool extends APITool {
  config: ToolConfig & {
    baseURL: 'https://api.openai.com/v1';
    apiKey: string;
    organization?: string;
    defaultModel?: string;
  };
}

/**
 * Slack Tool
 * 
 * Slack messaging integration
 */
export interface SlackTool extends APITool {
  config: ToolConfig & {
    baseURL: 'https://slack.com/api';
    botToken: string;
    userToken?: string;
    webhookURL?: string;
  };
}

/**
 * Tool Registry
 * 
 * Registry for managing available tools
 */
export interface ToolRegistry {
  // Tool management
  registerTool(tool: Tool): Promise<void>;
  unregisterTool(toolId: string): Promise<void>;
  getTool(toolId: string): Promise<Tool | null>;
  listTools(filter?: ToolFilter): Promise<Tool[]>;
  
  // Tool discovery
  findToolsByType(type: ToolType): Promise<Tool[]>;
  findToolsByCapability(capability: string): Promise<Tool[]>;
  
  // Tool health
  checkToolHealth(toolId: string): Promise<ToolHealthStatus>;
  getAllToolHealth(): Promise<Map<string, ToolHealthStatus>>;
  
  // Tool execution
  executeTool(toolId: string, operation: string, params: any): Promise<ToolExecutionResult>;
  
  // Tool factory
  createTool(definition: ToolDefinition): Promise<Tool>;
}

/**
 * Tool Filter
 * 
 * Filtering options for tool queries
 */
export interface ToolFilter {
  type?: ToolType;
  status?: ToolStatus;
  tags?: string[];
  author?: string;
  capabilities?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Tool Definition
 * 
 * Template for creating new tools
 */
export interface ToolDefinition {
  name: string;
  type: ToolType;
  version: string;
  description: string;
  
  // Implementation
  implementation: {
    language: 'typescript' | 'javascript' | 'python' | 'go' | 'rust';
    entrypoint: string;
    dependencies?: string[];
  };
  
  // Configuration schema
  configSchema: any; // JSON Schema
  
  // Capabilities
  capabilities: ToolCapability[];
  
  // Metadata
  author?: string;
  license?: string;
  documentation?: string;
  repository?: string;
  tags?: string[];
}

/**
 * Tool Manager
 * 
 * Service for managing tool lifecycle and execution
 */
export interface ToolManager {
  // Lifecycle management
  initializeTools(): Promise<void>;
  shutdownTools(): Promise<void>;
  
  // Health monitoring
  startHealthMonitoring(): void;
  stopHealthMonitoring(): void;
  
  // Metrics collection
  getToolMetrics(toolId?: string): Promise<ToolMetrics>;
  
  // Tool execution with monitoring
  executeWithMonitoring(
    toolId: string, 
    operation: string, 
    params: any,
    context?: ExecutionContext
  ): Promise<ToolExecutionResult>;
}

/**
 * Tool Metrics
 * 
 * Performance and usage metrics for tools
 */
export interface ToolMetrics {
  toolId: string;
  timestamp: Date;
  
  // Usage metrics
  usage: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    executionsPerHour: number;
  };
  
  // Performance metrics
  performance: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    timeoutRate: number;
  };
  
  // Resource metrics
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    networkIO: number;
    cacheHitRate: number;
  };
  
  // Health metrics
  health: {
    uptime: number;
    lastHealthCheck: Date;
    healthCheckFailures: number;
    connectivity: boolean;
  };
}

/**
 * Execution Context
 * 
 * Context for tool execution
 */
export interface ExecutionContext {
  workflowId?: string;
  executionId?: string;
  stepId?: string;
  agentId?: string;
  userId?: string;
  correlationId?: string;
  
  // Enterprise context
  securityContext?: {
    permissions: string[];
    dataClassification?: string;
    auditRequired?: boolean;
  };
  
  // Performance context
  timeout?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Tool Factory
 * 
 * Factory for creating tool instances
 */
export interface ToolFactory {
  // Built-in tools
  createHubSpotTool(config: HubSpotTool['config']): Promise<HubSpotTool>;
  createOpenAITool(config: OpenAITool['config']): Promise<OpenAITool>;
  createSlackTool(config: SlackTool['config']): Promise<SlackTool>;
  createDatabaseTool(config: DatabaseTool['config']): Promise<DatabaseTool>;
  
  // Generic tools
  createAPITool(config: APITool['config']): Promise<APITool>;
  createCustomTool(definition: ToolDefinition, config: ToolConfig): Promise<Tool>;
  
  // Tool validation
  validateToolDefinition(definition: ToolDefinition): Promise<ValidationResult>;
  validateToolConfig(config: ToolConfig): Promise<ValidationResult>;
}

/**
 * Validation Result
 * 
 * Result of tool validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Tool Event Types
 * 
 * Events related to tool operations
 */
export interface ToolExecutedEvent {
  toolId: string;
  operation: string;
  success: boolean;
  duration: number;
  timestamp: Date;
  context?: ExecutionContext;
}

export interface ToolHealthChangedEvent {
  toolId: string;
  previousStatus: ToolStatus;
  currentStatus: ToolStatus;
  timestamp: Date;
  issues?: string[];
}

export interface ToolRegisteredEvent {
  toolId: string;
  toolName: string;
  toolType: ToolType;
  timestamp: Date;
  author?: string;
}