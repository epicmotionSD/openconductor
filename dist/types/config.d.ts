/**
 * OpenConductor Configuration Types
 *
 * Configuration interfaces for all aspects of the OpenConductor platform,
 * supporting both open-source and enterprise deployments.
 *
 * "Built on open standards for maximum flexibility"
 */
export interface OpenConductorConfig {
    core: CoreConfig;
    database: DatabaseConfig;
    cache: CacheConfig;
    api: APIConfig;
    auth: AuthConfig;
    logging: LoggingConfig;
    monitoring: MonitoringConfig;
    plugins: PluginConfig;
    enterprise?: EnterpriseConfig;
    environment: EnvironmentConfig;
}
/**
 * Core Configuration
 */
export interface CoreConfig {
    instanceId: string;
    name: string;
    version: string;
    runtime: {
        maxConcurrentAgents: number;
        maxConcurrentWorkflows: number;
        defaultTimeout: number;
        gracefulShutdownTimeout: number;
    };
    agents: {
        defaultMemoryType: 'persistent' | 'ephemeral';
        defaultMemoryStore: 'redis' | 'postgresql' | 'memory';
        maxExecutionTime: number;
        enableSandboxing: boolean;
        resourceLimits: {
            cpu: string;
            memory: string;
            storage: string;
        };
    };
    orchestration: {
        maxWorkflowDepth: number;
        maxStepsPerWorkflow: number;
        enableParallelExecution: boolean;
        defaultRetryPolicy: {
            maxRetries: number;
            backoffStrategy: 'linear' | 'exponential';
            initialDelay: number;
        };
    };
    events: {
        enableEventStore: boolean;
        eventRetentionDays: number;
        maxEventsPerSecond: number;
        enableBatching: boolean;
        batchSize: number;
        batchTimeout: number;
    };
}
/**
 * Database Configuration
 */
export interface DatabaseConfig {
    primary: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
        pool: {
            min: number;
            max: number;
            idleTimeoutMillis: number;
            acquireTimeoutMillis: number;
        };
        queryTimeout: number;
        statementTimeout: number;
    };
    replicas?: Array<{
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
        weight?: number;
    }>;
    migrations: {
        directory: string;
        tableName: string;
        autoMigrate: boolean;
    };
    backup?: {
        enabled: boolean;
        schedule: string;
        retention: number;
        s3?: {
            bucket: string;
            region: string;
            accessKeyId: string;
            secretAccessKey: string;
        };
    };
}
/**
 * Cache Configuration
 */
export interface CacheConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        database: number;
        connectTimeout: number;
        commandTimeout: number;
        retryDelayOnFailover: number;
        maxRetriesPerRequest: number;
        cluster?: {
            enabled: boolean;
            nodes: Array<{
                host: string;
                port: number;
            }>;
            redisOptions?: any;
        };
        sentinel?: {
            enabled: boolean;
            masterName: string;
            sentinels: Array<{
                host: string;
                port: number;
            }>;
        };
    };
    policies: {
        defaultTTL: number;
        maxKeySize: number;
        maxValueSize: number;
        evictionPolicy: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu';
    };
    prefixes: {
        agents: string;
        workflows: string;
        events: string;
        sessions: string;
    };
}
/**
 * API Configuration
 */
export interface APIConfig {
    server: {
        host: string;
        port: number;
        enableHTTPS: boolean;
        ssl?: {
            keyFile: string;
            certFile: string;
            caFile?: string;
        };
        cors: {
            enabled: boolean;
            origins: string[];
            methods: string[];
            allowedHeaders: string[];
            credentials: boolean;
        };
    };
    versioning: {
        enabled: boolean;
        defaultVersion: string;
        supportedVersions: string[];
        headerName: string;
    };
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
        keyGenerator?: string;
    };
    request: {
        maxBodySize: string;
        timeout: number;
        enableCompression: boolean;
    };
    docs: {
        enabled: boolean;
        path: string;
        title: string;
        version: string;
    };
    websocket: {
        enabled: boolean;
        path: string;
        maxConnections: number;
        pingInterval: number;
        pongTimeout: number;
    };
    graphql?: {
        enabled: boolean;
        path: string;
        playground: boolean;
        introspection: boolean;
        subscriptions: boolean;
    };
}
/**
 * Authentication Configuration
 */
export interface AuthConfig {
    strategy: 'none' | 'api-key' | 'jwt' | 'oauth2' | 'ldap' | 'saml';
    jwt?: {
        secret: string;
        issuer: string;
        audience: string;
        expiresIn: string;
        algorithm: string;
        refreshToken: {
            enabled: boolean;
            expiresIn: string;
        };
    };
    apiKey?: {
        headerName: string;
        queryParamName?: string;
        prefixRequired: boolean;
        prefix?: string;
    };
    oauth2?: {
        providers: Array<{
            name: string;
            clientId: string;
            clientSecret: string;
            authorizeURL: string;
            tokenURL: string;
            profileURL: string;
            scope: string[];
        }>;
    };
    ldap?: {
        url: string;
        bindDN: string;
        bindPassword: string;
        searchBase: string;
        searchFilter: string;
        attributes: {
            username: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    };
    saml?: {
        entryPoint: string;
        issuer: string;
        cert: string;
        privateKey: string;
        attributeMapping: {
            username: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    };
    session: {
        secret: string;
        maxAge: number;
        secure: boolean;
        httpOnly: boolean;
        sameSite: 'strict' | 'lax' | 'none';
    };
    rbac: {
        enabled: boolean;
        defaultRole: string;
        roles: Record<string, string[]>;
    };
}
/**
 * Logging Configuration
 */
export interface LoggingConfig {
    level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    format: 'json' | 'text' | 'combined';
    console: {
        enabled: boolean;
        colorize: boolean;
    };
    file?: {
        enabled: boolean;
        filename: string;
        maxSize: string;
        maxFiles: number;
        datePattern?: string;
    };
    http?: {
        enabled: boolean;
        host: string;
        port: number;
        path: string;
        ssl?: boolean;
        auth?: {
            username: string;
            password: string;
        };
    };
    database?: {
        enabled: boolean;
        tableName: string;
        level: string;
    };
    metadata: {
        service: string;
        environment: string;
        version: string;
        instanceId: string;
    };
}
/**
 * Monitoring Configuration
 */
export interface MonitoringConfig {
    health: {
        enabled: boolean;
        path: string;
        interval: number;
        timeout: number;
    };
    metrics: {
        enabled: boolean;
        path: string;
        prefix: string;
        prometheus?: {
            enabled: boolean;
            collectDefaultMetrics: boolean;
            customMetrics: Array<{
                name: string;
                help: string;
                type: 'counter' | 'gauge' | 'histogram' | 'summary';
                labels?: string[];
            }>;
        };
    };
    tracing?: {
        enabled: boolean;
        serviceName: string;
        jaeger?: {
            endpoint: string;
            username?: string;
            password?: string;
        };
        zipkin?: {
            endpoint: string;
        };
    };
    alerting?: {
        enabled: boolean;
        rules: Array<{
            name: string;
            condition: string;
            threshold: number;
            duration: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            channels: string[];
        }>;
        channels: {
            slack?: {
                webhookURL: string;
                channel: string;
                username: string;
            };
            email?: {
                smtpHost: string;
                smtpPort: number;
                smtpUser: string;
                smtpPassword: string;
                from: string;
                to: string[];
            };
            pagerduty?: {
                integrationKey: string;
            };
        };
    };
}
/**
 * Plugin Configuration
 */
export interface PluginConfig {
    directory: string;
    autoLoad: boolean;
    loadTimeout: number;
    registry: {
        enabled: boolean;
        urls: string[];
        cache: {
            enabled: boolean;
            ttl: number;
        };
    };
    security: {
        sandboxEnabled: boolean;
        allowedPermissions: string[];
        restrictedAPIs: string[];
        maxMemoryUsage: string;
        maxCPUUsage: string;
        networkAccess: boolean;
        fileSystemAccess: boolean;
    };
    development?: {
        hotReload: boolean;
        watchDirectories: string[];
        buildCommand?: string;
    };
}
/**
 * Enterprise Configuration
 */
export interface EnterpriseConfig {
    license: {
        key: string;
        validationURL?: string;
        offlineValidation: boolean;
    };
    security: {
        encryptionAtRest: boolean;
        encryptionInTransit: boolean;
        keyManagement: {
            provider: 'local' | 'aws-kms' | 'azure-key-vault' | 'hashicorp-vault';
            config: Record<string, any>;
        };
    };
    highAvailability: {
        enabled: boolean;
        replication: {
            mode: 'master-slave' | 'master-master';
            syncMode: 'sync' | 'async';
        };
        loadBalancing: {
            algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
            healthCheck: {
                interval: number;
                timeout: number;
                failureThreshold: number;
            };
        };
    };
    compliance: {
        auditLogging: {
            enabled: boolean;
            level: 'basic' | 'detailed' | 'comprehensive';
            retention: number;
        };
        dataGovernance: {
            enabled: boolean;
            classification: boolean;
            retention: Record<string, number>;
        };
        encryption: {
            algorithm: string;
            keyRotation: {
                enabled: boolean;
                interval: number;
            };
        };
    };
    multiTenancy?: {
        enabled: boolean;
        isolation: 'shared-database' | 'separate-database' | 'separate-instance';
        defaultTenant: string;
    };
    backupAndRecovery: {
        backup: {
            enabled: boolean;
            schedule: string;
            retention: number;
            encryption: boolean;
            storage: {
                provider: 'local' | 's3' | 'gcs' | 'azure-blob';
                config: Record<string, any>;
            };
        };
        disasterRecovery: {
            enabled: boolean;
            rto: number;
            rpo: number;
            failover: {
                automatic: boolean;
                healthCheckInterval: number;
                failureThreshold: number;
            };
        };
    };
}
/**
 * Environment Configuration
 */
export interface EnvironmentConfig {
    name: 'development' | 'testing' | 'staging' | 'production';
    region?: string;
    availabilityZone?: string;
    features: {
        [key: string]: boolean;
    };
    services: {
        [serviceName: string]: {
            enabled: boolean;
            endpoint: string;
            timeout: number;
            retries: number;
            auth?: {
                type: string;
                credentials: Record<string, string>;
            };
        };
    };
    resources: {
        maxConcurrency: number;
        memoryLimit: string;
        cpuLimit: string;
        storageLimit: string;
    };
    development?: {
        hotReload: boolean;
        debugMode: boolean;
        verboseLogging: boolean;
        mockExternalServices: boolean;
        seedData: boolean;
    };
}
/**
 * Configuration Validation
 */
export interface ConfigValidationResult {
    valid: boolean;
    errors: Array<{
        path: string;
        message: string;
        value?: any;
    }>;
    warnings: Array<{
        path: string;
        message: string;
        value?: any;
    }>;
}
/**
 * Configuration Manager Interface
 */
export interface ConfigManager {
    loadConfig(path?: string): Promise<OpenConductorConfig>;
    reloadConfig(): Promise<void>;
    get<T = any>(path: string): T;
    set(path: string, value: any): void;
    has(path: string): boolean;
    validate(): Promise<ConfigValidationResult>;
    watch(callback: (config: OpenConductorConfig) => void): void;
    unwatch(callback: (config: OpenConductorConfig) => void): void;
    getEnvVar(name: string, defaultValue?: string): string;
    setEnvVar(name: string, value: string): void;
    merge(config: Partial<OpenConductorConfig>): void;
    save(path?: string): Promise<void>;
}
/**
 * Default Configuration Values
 */
export declare const DEFAULT_CONFIG: OpenConductorConfig;
//# sourceMappingURL=config.d.ts.map