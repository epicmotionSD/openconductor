/**
 * OpenConductor Plugin System
 * 
 * Extensible plugin architecture that enables the community to extend
 * OpenConductor with custom functionality while maintaining security and stability.
 * 
 * "Your platform, your rules. No lock-in."
 */

export type PluginType = 
  | 'agent'
  | 'tool'
  | 'middleware'
  | 'ui-extension'
  | 'workflow-step'
  | 'authentication'
  | 'monitoring'
  | 'storage'
  | 'custom';

export type PluginStatus = 'active' | 'inactive' | 'error' | 'loading' | 'uninstalling';

export type PluginScope = 'system' | 'workflow' | 'agent' | 'user';

/**
 * Plugin Metadata
 *
 * Plugin metadata information
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  documentation?: string;
  tags?: string[];
  dependencies?: string[];
  conflicts?: string[];
  priority?: number;
}

/**
 * Plugin API
 *
 * API provided to plugins during initialization
 */
export interface PluginAPI {
  logger: any; // Logger interface
  eventBus: any; // EventBus interface
  executeHooks: (hookName: string, data?: any) => Promise<any>;
  getPlugin: (pluginId: string) => Plugin | null;
  getConfig: () => any;
}

/**
 * Plugin Hook
 *
 * Hook registration for plugins
 */
export interface PluginHook {
  pluginId: string;
  name: string;
  handler: (data: any, api: PluginAPI) => Promise<any>;
  priority: number;
  critical: boolean;
}

/**
 * Plugin Lifecycle Event
 */
export type PluginLifecycleEvent = 'installed' | 'uninstalled' | 'enabled' | 'disabled';

/**
 * Plugin Interface
 *
 * All OpenConductor plugins must implement this interface
 */
export interface Plugin {
  metadata: PluginMetadata;
  
  // Runtime state
  status?: PluginStatus;
  loadedAt?: Date;
  
  // Lifecycle methods
  install?(api: PluginAPI, config: PluginConfig): Promise<void>;
  uninstall?(api: PluginAPI): Promise<void>;
  enable?(api: PluginAPI, config: PluginConfig): Promise<void>;
  disable?(api: PluginAPI): Promise<void>;
  initialize?(context: PluginContext): Promise<void>;
  activate?(): Promise<void>;
  deactivate?(): Promise<void>;
  cleanup?(): Promise<void>;
  
  // Hook system
  hooks?: Record<string, (data: any, api: PluginAPI) => Promise<any>>;
  
  // Health monitoring
  healthCheck?(): Promise<PluginHealthStatus>;
  
  // Plugin capabilities
  getCapabilities?(): PluginCapability[];
  
  // Extension points
  extendCore?(extensions: CoreExtensions): void;
  extendAPI?(router: any): void;
  extendUI?(components: UIExtensions): void;
  
  // Event handling
  onEvent?(event: PluginEvent): Promise<void>;
  
  // Dependencies
  getDependencies?(): PluginDependency[];
  
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Plugin Configuration
 *
 * Configuration settings for plugins
 */
export interface PluginConfig {
  // Runtime configuration
  enabled: boolean;
  autoStart?: boolean;
  autoEnable?: boolean;
  scope?: PluginScope;
  priority?: number;
  
  // Resource limits
  resources?: {
    maxMemory?: string;
    maxCPU?: string;
    maxStorage?: string;
    maxNetworkBandwidth?: string;
  };
  
  // Security settings
  security?: {
    permissions: string[];
    sandbox: boolean;
    allowNetworkAccess: boolean;
    allowFileSystemAccess: boolean;
    allowDatabaseAccess: boolean;
  };
  
  // Plugin-specific configuration
  settings?: Record<string, any>;
  
  // Environment configuration
  environment?: Record<string, string>;
}

/**
 * Plugin Context
 * 
 * Context provided to plugins during initialization
 */
export interface PluginContext {
  // OpenConductor core services
  conductor: any; // ConductorEngine interface
  eventBus: any; // EventBus interface
  toolRegistry: any; // ToolRegistry interface
  
  // Plugin information
  pluginId: string;
  pluginDir: string;
  config: PluginConfig;
  
  // Logging
  logger: PluginLogger;
  
  // Storage
  storage: PluginStorage;
  
  // HTTP client
  http: PluginHttpClient;
  
  // Utilities
  utils: PluginUtils;
}

/**
 * Plugin Capability
 * 
 * Describes what a plugin can do
 */
export interface PluginCapability {
  name: string;
  description: string;
  version: string;
  
  // Capability interface
  interface: {
    methods: PluginMethod[];
    events?: PluginEventDefinition[];
  };
  
  // Requirements
  requiredPermissions?: string[];
  optionalPermissions?: string[];
  
  // Compatibility
  minimumCoreVersion?: string;
  maximumCoreVersion?: string;
}

/**
 * Plugin Method
 * 
 * Method exposed by a plugin capability
 */
export interface PluginMethod {
  name: string;
  description: string;
  
  // Parameters
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  
  // Return type
  returnType: string;
  
  // Method metadata
  async: boolean;
  deprecated?: boolean;
}

/**
 * Plugin Event Definition
 * 
 * Events that a plugin can emit or listen to
 */
export interface PluginEventDefinition {
  name: string;
  description: string;
  dataSchema: any; // JSON Schema
  
  // Event metadata
  direction: 'emit' | 'listen' | 'both';
  frequency?: 'rare' | 'occasional' | 'frequent' | 'high';
}

/**
 * Plugin Dependency
 * 
 * Dependencies required by a plugin
 */
export interface PluginDependency {
  type: 'plugin' | 'npm' | 'system' | 'service';
  name: string;
  version?: string;
  optional: boolean;
  description?: string;
}

/**
 * Plugin Health Status
 * 
 * Health information for a plugin
 */
export interface PluginHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  
  // Health details
  details: {
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
    lastError?: {
      message: string;
      timestamp: Date;
    };
  };
  
  // Dependency health
  dependencies: Array<{
    name: string;
    status: 'available' | 'unavailable' | 'degraded';
  }>;
  
  // Custom health checks
  customChecks?: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
  }>;
}

/**
 * Plugin Event
 * 
 * Events that can be sent to plugins
 */
export interface PluginEvent {
  type: 'system' | 'workflow' | 'agent' | 'plugin';
  name: string;
  data: any;
  timestamp: Date;
  source: string;
  correlationId?: string;
}

/**
 * Core Extensions
 * 
 * Extensions that plugins can make to the core system
 */
export interface CoreExtensions {
  // Agent types
  registerAgentType(type: string, factory: any): void;
  
  // Tool types
  registerToolType(type: string, factory: any): void;
  
  // Workflow steps
  registerWorkflowStep(type: string, handler: any): void;
  
  // Middleware
  registerMiddleware(name: string, middleware: any): void;
  
  // Event handlers
  registerEventHandler(eventType: string, handler: any): void;
  
  // Authentication providers
  registerAuthProvider(name: string, provider: any): void;
  
  // Storage providers
  registerStorageProvider(name: string, provider: any): void;
}

/**
 * UI Extensions
 * 
 * UI components that plugins can contribute
 */
export interface UIExtensions {
  // Dashboard widgets
  registerWidget(widget: WidgetDefinition): void;
  
  // Navigation items
  registerNavItem(item: NavItemDefinition): void;
  
  // Agent editors
  registerAgentEditor(agentType: string, editor: any): void;
  
  // Settings panels
  registerSettingsPanel(panel: SettingsPanelDefinition): void;
  
  // Custom pages
  registerPage(page: PageDefinition): void;
}

/**
 * Widget Definition
 * 
 * Definition for dashboard widgets
 */
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: string;
  size: 'small' | 'medium' | 'large';
  permissions?: string[];
  config?: Record<string, any>;
}

/**
 * Navigation Item Definition
 * 
 * Definition for navigation items
 */
export interface NavItemDefinition {
  id: string;
  label: string;
  icon?: string;
  path: string;
  permissions?: string[];
  order?: number;
}

/**
 * Settings Panel Definition
 * 
 * Definition for settings panels
 */
export interface SettingsPanelDefinition {
  id: string;
  title: string;
  description?: string;
  component: string;
  section: string;
  permissions?: string[];
  order?: number;
}

/**
 * Page Definition
 * 
 * Definition for custom pages
 */
export interface PageDefinition {
  id: string;
  title: string;
  path: string;
  component: string;
  permissions?: string[];
  showInNav?: boolean;
}

/**
 * Plugin Logger
 * 
 * Logging interface for plugins
 */
export interface PluginLogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  
  // Structured logging
  log(level: string, message: string, meta?: any): void;
  
  // Child logger
  child(metadata: Record<string, any>): PluginLogger;
}

/**
 * Plugin Storage
 * 
 * Storage interface for plugins
 */
export interface PluginStorage {
  // Key-value storage
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  
  // Batch operations
  mget(keys: string[]): Promise<Record<string, any>>;
  mset(data: Record<string, any>): Promise<void>;
  
  // Collections
  list(pattern: string): Promise<string[]>;
  clear(): Promise<void>;
  
  // Transactions
  transaction(): PluginStorageTransaction;
}

/**
 * Plugin Storage Transaction
 * 
 * Transactional storage operations
 */
export interface PluginStorageTransaction {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any): void;
  delete(key: string): void;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Plugin HTTP Client
 * 
 * HTTP client interface for plugins
 */
export interface PluginHttpClient {
  get<T = any>(url: string, config?: RequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  
  // Request configuration
  setDefaults(config: RequestConfig): void;
  
  // Interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
}

/**
 * Request Configuration
 * 
 * Configuration for HTTP requests
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  auth?: {
    username: string;
    password: string;
  } | {
    bearer: string;
  };
}

/**
 * Request/Response Interceptors
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = (response: any) => any | Promise<any>;

/**
 * Plugin Utils
 * 
 * Utility functions for plugins
 */
export interface PluginUtils {
  // Validation
  validateSchema(data: any, schema: any): ValidationResult;
  
  // Encryption/Decryption
  encrypt(data: string): Promise<string>;
  decrypt(encrypted: string): Promise<string>;
  
  // Hashing
  hash(data: string, algorithm?: string): string;
  
  // UUID generation
  generateId(): string;
  
  // Date utilities
  formatDate(date: Date, format?: string): string;
  parseDate(dateString: string, format?: string): Date;
  
  // JSON utilities
  parseJSON<T = any>(json: string): T | null;
  stringifyJSON(data: any, pretty?: boolean): string;
  
  // Path utilities
  joinPath(...parts: string[]): string;
  resolvePath(path: string): string;
  
  // Async utilities
  sleep(ms: number): Promise<void>;
  timeout<T>(promise: Promise<T>, ms: number): Promise<T>;
  retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
}

/**
 * Retry Options
 * 
 * Options for retry utility
 */
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Plugin Manager
 * 
 * Service for managing plugin lifecycle
 */
export interface PluginManager {
  // Plugin lifecycle
  loadPlugin(pluginPath: string): Promise<Plugin>;
  unloadPlugin(pluginId: string): Promise<void>;
  
  // Plugin management
  listPlugins(filter?: PluginFilter): Promise<Plugin[]>;
  getPlugin(pluginId: string): Promise<Plugin | null>;
  
  // Plugin state
  activatePlugin(pluginId: string): Promise<void>;
  deactivatePlugin(pluginId: string): Promise<void>;
  restartPlugin(pluginId: string): Promise<void>;
  
  // Plugin health
  checkPluginHealth(pluginId: string): Promise<PluginHealthStatus>;
  getAllPluginHealth(): Promise<Map<string, PluginHealthStatus>>;
  
  // Plugin installation
  installPlugin(source: PluginSource): Promise<Plugin>;
  updatePlugin(pluginId: string, version?: string): Promise<Plugin>;
  removePlugin(pluginId: string): Promise<void>;
  
  // Plugin registry
  searchPlugins(query: PluginSearchQuery): Promise<PluginRegistryEntry[]>;
  getPluginInfo(pluginId: string): Promise<PluginRegistryEntry | null>;
}

/**
 * Plugin Filter
 * 
 * Filtering options for plugin queries
 */
export interface PluginFilter {
  type?: PluginType;
  status?: PluginStatus;
  scope?: PluginScope;
  author?: string;
  tags?: string[];
  enabled?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Plugin Source
 * 
 * Source for plugin installation
 */
export interface PluginSource {
  type: 'registry' | 'npm' | 'git' | 'local';
  location: string;
  version?: string;
  credentials?: Record<string, string>;
}

/**
 * Plugin Search Query
 * 
 * Query for searching plugins
 */
export interface PluginSearchQuery {
  q?: string;
  type?: PluginType;
  tags?: string[];
  author?: string;
  sort?: 'name' | 'downloads' | 'rating' | 'updated';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Plugin Registry Entry
 * 
 * Plugin information in the registry
 */
export interface PluginRegistryEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  type: PluginType;
  
  // Author and metadata
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  
  // Registry metrics
  downloads: number;
  rating: number;
  reviews: number;
  
  // Compatibility
  coreVersions: string[];
  platforms: string[];
  
  // Installation
  installCommand: string;
  packageSize: number;
  
  // Timestamps
  publishedAt: Date;
  updatedAt: Date;
  
  // Verification
  verified: boolean;
  securityScan?: {
    passed: boolean;
    scanDate: Date;
    issues: number;
  };
}

/**
 * Plugin Manifest
 * 
 * Manifest file for plugins (openconductor.json)
 */
export interface PluginManifest {
  // Plugin identification
  name: string;
  version: string;
  description: string;
  type: PluginType;
  
  // Author information
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  
  // Plugin configuration
  main: string;
  engines: {
    openconductor: string;
    node?: string;
  };
  
  // Dependencies
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  
  // Permissions
  permissions: string[];
  optionalPermissions?: string[];
  
  // Capabilities
  capabilities: PluginCapability[];
  
  // Configuration schema
  configSchema?: any; // JSON Schema
  
  // Files and assets
  files?: string[];
  assets?: string[];
  
  // Keywords and metadata
  keywords?: string[];
  tags?: string[];
  category?: string;
}

/**
 * Validation Result
 * 
 * Result of plugin validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  warnings?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}