/**
 * OpenConductor Core Types
 *
 * Foundational type definitions for the OpenConductor platform,
 * inspired by Trinity AI patterns (Oracle, Sentinel, Sage) but generalized
 * for broader agent orchestration use cases.
 */

// Agent types
export {
  AgentType,
  AgentStatus,
  CapabilityType,
  AgentCapability,
  AgentTool,
  AgentMemory,
  AgentMetrics,
  AgentConfig,
  RuntimeEnvironment,
  SecurityPolicy,
  AgentInput,
  AgentOutput,
  AgentLifecycleMethods,
  Agent,
  PredictionAgent,
  MonitoringAgent,
  AdvisoryAgent,
  AgentRegistryEntry,
  AgentDeployment
} from './agent';

// Orchestration types
export {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStatus,
  StepExecution,
  StepStatus,
  OrchestrationEngine,
  WorkflowEvent,
  EngineHealthStatus,
  EngineMetrics,
  WorkflowFilter as OrchestrationWorkflowFilter,
  ExecutionFilter as OrchestrationExecutionFilter
} from './orchestration';

// Event types
export {
  EventType,
  OpenConductorEvent,
  EventBus,
  EventSubscription as EventsEventSubscription,
  EventFilter as EventsEventFilter,
  EventHandler,
  EventBusMetrics
} from './events';

// Tool types
export {
  Tool,
  ToolConfig,
  ToolCategory,
  ToolStatus,
  ToolExecution,
  ToolExecutionResult,
  ToolFilter as ToolsToolFilter,
  ToolHealthStatus as ToolsToolHealthStatus,
  ValidationResult as ToolsValidationResult
} from './tools';

// Plugin types
export {
  Plugin,
  PluginConfig as PluginsPluginConfig,
  PluginMetadata,
  PluginStatus,
  PluginType,
  PluginAPI as PluginsPluginAPI,
  PluginHook,
  PluginLifecycleEvent,
  PluginHealthStatus as PluginsPluginHealthStatus,
  PluginRegistryEntry as PluginsPluginRegistryEntry,
  PluginSearchQuery as PluginsPluginSearchQuery,
  PluginSource as PluginsPluginSource
} from './plugins';

// API types
export {
  APIResponse,
  APIError as APIErrorType,
  OpenConductorClient,
  WebSocketClient
} from './api';

// Config types
export {
  OpenConductorConfig
} from './config';

// Error types
export {
  OpenConductorError,
  ErrorSeverity,
  ErrorCategory,
  AgentError,
  OrchestrationError,
  PluginError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  SystemError,
  ConfigurationError,
  ErrorJSON
} from './errors';