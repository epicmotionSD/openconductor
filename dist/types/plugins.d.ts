/**
 * OpenConductor Plugin System
 *
 * Extensible plugin architecture that enables the community to extend
 * OpenConductor with custom functionality while maintaining security and stability.
 *
 * "Your platform, your rules. No lock-in."
 */
export type PluginType = 'agent' | 'tool' | 'middleware' | 'ui-extension' | 'workflow-step' | 'authentication' | 'monitoring' | 'storage' | 'custom';
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
    logger: any;
    eventBus: any;
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
    status?: PluginStatus;
    loadedAt?: Date;
    install?(api: PluginAPI, config: PluginConfig): Promise<void>;
    uninstall?(api: PluginAPI): Promise<void>;
    enable?(api: PluginAPI, config: PluginConfig): Promise<void>;
    disable?(api: PluginAPI): Promise<void>;
    initialize?(context: PluginContext): Promise<void>;
    activate?(): Promise<void>;
    deactivate?(): Promise<void>;
    cleanup?(): Promise<void>;
    hooks?: Record<string, (data: any, api: PluginAPI) => Promise<any>>;
    healthCheck?(): Promise<PluginHealthStatus>;
    getCapabilities?(): PluginCapability[];
    extendCore?(extensions: CoreExtensions): void;
    extendAPI?(router: any): void;
    extendUI?(components: UIExtensions): void;
    onEvent?(event: PluginEvent): Promise<void>;
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
    enabled: boolean;
    autoStart?: boolean;
    autoEnable?: boolean;
    scope?: PluginScope;
    priority?: number;
    resources?: {
        maxMemory?: string;
        maxCPU?: string;
        maxStorage?: string;
        maxNetworkBandwidth?: string;
    };
    security?: {
        permissions: string[];
        sandbox: boolean;
        allowNetworkAccess: boolean;
        allowFileSystemAccess: boolean;
        allowDatabaseAccess: boolean;
    };
    settings?: Record<string, any>;
    environment?: Record<string, string>;
}
/**
 * Plugin Context
 *
 * Context provided to plugins during initialization
 */
export interface PluginContext {
    conductor: any;
    eventBus: any;
    toolRegistry: any;
    pluginId: string;
    pluginDir: string;
    config: PluginConfig;
    logger: PluginLogger;
    storage: PluginStorage;
    http: PluginHttpClient;
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
    interface: {
        methods: PluginMethod[];
        events?: PluginEventDefinition[];
    };
    requiredPermissions?: string[];
    optionalPermissions?: string[];
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
    parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    returnType: string;
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
    dataSchema: any;
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
    details: {
        memoryUsage: number;
        cpuUsage: number;
        errorCount: number;
        lastError?: {
            message: string;
            timestamp: Date;
        };
    };
    dependencies: Array<{
        name: string;
        status: 'available' | 'unavailable' | 'degraded';
    }>;
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
    registerAgentType(type: string, factory: any): void;
    registerToolType(type: string, factory: any): void;
    registerWorkflowStep(type: string, handler: any): void;
    registerMiddleware(name: string, middleware: any): void;
    registerEventHandler(eventType: string, handler: any): void;
    registerAuthProvider(name: string, provider: any): void;
    registerStorageProvider(name: string, provider: any): void;
}
/**
 * UI Extensions
 *
 * UI components that plugins can contribute
 */
export interface UIExtensions {
    registerWidget(widget: WidgetDefinition): void;
    registerNavItem(item: NavItemDefinition): void;
    registerAgentEditor(agentType: string, editor: any): void;
    registerSettingsPanel(panel: SettingsPanelDefinition): void;
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
    log(level: string, message: string, meta?: any): void;
    child(metadata: Record<string, any>): PluginLogger;
}
/**
 * Plugin Storage
 *
 * Storage interface for plugins
 */
export interface PluginStorage {
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    mget(keys: string[]): Promise<Record<string, any>>;
    mset(data: Record<string, any>): Promise<void>;
    list(pattern: string): Promise<string[]>;
    clear(): Promise<void>;
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
    setDefaults(config: RequestConfig): void;
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
    validateSchema(data: any, schema: any): ValidationResult;
    encrypt(data: string): Promise<string>;
    decrypt(encrypted: string): Promise<string>;
    hash(data: string, algorithm?: string): string;
    generateId(): string;
    formatDate(date: Date, format?: string): string;
    parseDate(dateString: string, format?: string): Date;
    parseJSON<T = any>(json: string): T | null;
    stringifyJSON(data: any, pretty?: boolean): string;
    joinPath(...parts: string[]): string;
    resolvePath(path: string): string;
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
    loadPlugin(pluginPath: string): Promise<Plugin>;
    unloadPlugin(pluginId: string): Promise<void>;
    listPlugins(filter?: PluginFilter): Promise<Plugin[]>;
    getPlugin(pluginId: string): Promise<Plugin | null>;
    activatePlugin(pluginId: string): Promise<void>;
    deactivatePlugin(pluginId: string): Promise<void>;
    restartPlugin(pluginId: string): Promise<void>;
    checkPluginHealth(pluginId: string): Promise<PluginHealthStatus>;
    getAllPluginHealth(): Promise<Map<string, PluginHealthStatus>>;
    installPlugin(source: PluginSource): Promise<Plugin>;
    updatePlugin(pluginId: string, version?: string): Promise<Plugin>;
    removePlugin(pluginId: string): Promise<void>;
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
    author: string;
    license: string;
    homepage?: string;
    repository?: string;
    downloads: number;
    rating: number;
    reviews: number;
    coreVersions: string[];
    platforms: string[];
    installCommand: string;
    packageSize: number;
    publishedAt: Date;
    updatedAt: Date;
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
    name: string;
    version: string;
    description: string;
    type: PluginType;
    author: string;
    license: string;
    homepage?: string;
    repository?: string;
    main: string;
    engines: {
        openconductor: string;
        node?: string;
    };
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    permissions: string[];
    optionalPermissions?: string[];
    capabilities: PluginCapability[];
    configSchema?: any;
    files?: string[];
    assets?: string[];
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
//# sourceMappingURL=plugins.d.ts.map