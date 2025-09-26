/**
 * OpenConductor Configuration Types
 * 
 * Configuration interfaces for all aspects of the OpenConductor platform,
 * supporting both open-source and enterprise deployments.
 * 
 * "Built on open standards for maximum flexibility"
 */

export interface OpenConductorConfig {
  // Core configuration
  core: CoreConfig;
  
  // Database configuration
  database: DatabaseConfig;
  
  // Cache configuration
  cache: CacheConfig;
  
  // API configuration
  api: APIConfig;
  
  // Authentication configuration
  auth: AuthConfig;
  
  // Logging configuration
  logging: LoggingConfig;
  
  // Monitoring configuration
  monitoring: MonitoringConfig;
  
  // Plugin configuration
  plugins: PluginConfig;
  
  // Enterprise features
  enterprise?: EnterpriseConfig;
  
  // Environment configuration
  environment: EnvironmentConfig;
}

/**
 * Core Configuration
 */
export interface CoreConfig {
  // Instance identification
  instanceId: string;
  name: string;
  version: string;
  
  // Runtime configuration
  runtime: {
    maxConcurrentAgents: number;
    maxConcurrentWorkflows: number;
    defaultTimeout: number;
    gracefulShutdownTimeout: number;
  };
  
  // Agent configuration
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
  
  // Orchestration configuration
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
  
  // Event system configuration
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
  // Primary database (PostgreSQL)
  primary: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    
    // Connection pool
    pool: {
      min: number;
      max: number;
      idleTimeoutMillis: number;
      acquireTimeoutMillis: number;
    };
    
    // Query configuration
    queryTimeout: number;
    statementTimeout: number;
  };
  
  // Read replicas (optional)
  replicas?: Array<{
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    weight?: number; // Load balancing weight
  }>;
  
  // Migration configuration
  migrations: {
    directory: string;
    tableName: string;
    autoMigrate: boolean;
  };
  
  // Backup configuration
  backup?: {
    enabled: boolean;
    schedule: string; // Cron expression
    retention: number; // Days
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
  // Redis configuration
  redis: {
    host: string;
    port: number;
    password?: string;
    database: number;
    
    // Connection configuration
    connectTimeout: number;
    commandTimeout: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    
    // Cluster configuration (optional)
    cluster?: {
      enabled: boolean;
      nodes: Array<{
        host: string;
        port: number;
      }>;
      redisOptions?: any;
    };
    
    // Sentinel configuration (optional)
    sentinel?: {
      enabled: boolean;
      masterName: string;
      sentinels: Array<{
        host: string;
        port: number;
      }>;
    };
  };
  
  // Cache policies
  policies: {
    defaultTTL: number;
    maxKeySize: number;
    maxValueSize: number;
    evictionPolicy: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu';
  };
  
  // Cache prefixes
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
  // Server configuration
  server: {
    host: string;
    port: number;
    enableHTTPS: boolean;
    
    // SSL configuration (if HTTPS enabled)
    ssl?: {
      keyFile: string;
      certFile: string;
      caFile?: string;
    };
    
    // CORS configuration
    cors: {
      enabled: boolean;
      origins: string[];
      methods: string[];
      allowedHeaders: string[];
      credentials: boolean;
    };
  };
  
  // API versioning
  versioning: {
    enabled: boolean;
    defaultVersion: string;
    supportedVersions: string[];
    headerName: string;
  };
  
  // Rate limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    keyGenerator?: string; // Function name or 'ip'
  };
  
  // Request/Response configuration
  request: {
    maxBodySize: string;
    timeout: number;
    enableCompression: boolean;
  };
  
  // Documentation
  docs: {
    enabled: boolean;
    path: string;
    title: string;
    version: string;
  };
  
  // WebSocket configuration
  websocket: {
    enabled: boolean;
    path: string;
    maxConnections: number;
    pingInterval: number;
    pongTimeout: number;
  };
  
  // GraphQL configuration
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
  // Authentication strategy
  strategy: 'none' | 'api-key' | 'jwt' | 'oauth2' | 'ldap' | 'saml';
  
  // JWT configuration (if using JWT)
  jwt?: {
    secret: string;
    issuer: string;
    audience: string;
    expiresIn: string;
    algorithm: string;
    
    // Refresh token configuration
    refreshToken: {
      enabled: boolean;
      expiresIn: string;
    };
  };
  
  // API Key configuration (if using API keys)
  apiKey?: {
    headerName: string;
    queryParamName?: string;
    prefixRequired: boolean;
    prefix?: string;
  };
  
  // OAuth2 configuration (if using OAuth2)
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
  
  // LDAP configuration (if using LDAP)
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
  
  // SAML configuration (if using SAML)
  saml?: {
    entryPoint: string;
    issuer: string;
    cert: string;
    privateKey: string;
    
    // Attribute mapping
    attributeMapping: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  
  // Session configuration
  session: {
    secret: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  
  // Role-based access control
  rbac: {
    enabled: boolean;
    defaultRole: string;
    roles: Record<string, string[]>; // Role -> permissions mapping
  };
}

/**
 * Logging Configuration
 */
export interface LoggingConfig {
  // Log level
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  
  // Log format
  format: 'json' | 'text' | 'combined';
  
  // Console logging
  console: {
    enabled: boolean;
    colorize: boolean;
  };
  
  // File logging
  file?: {
    enabled: boolean;
    filename: string;
    maxSize: string;
    maxFiles: number;
    datePattern?: string;
  };
  
  // HTTP logging (for log aggregation)
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
  
  // Database logging
  database?: {
    enabled: boolean;
    tableName: string;
    level: string;
  };
  
  // Structured logging metadata
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
  // Health check configuration
  health: {
    enabled: boolean;
    path: string;
    interval: number;
    timeout: number;
  };
  
  // Metrics configuration
  metrics: {
    enabled: boolean;
    path: string;
    prefix: string;
    
    // Prometheus configuration
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
  
  // Tracing configuration
  tracing?: {
    enabled: boolean;
    serviceName: string;
    
    // Jaeger configuration
    jaeger?: {
      endpoint: string;
      username?: string;
      password?: string;
    };
    
    // Zipkin configuration
    zipkin?: {
      endpoint: string;
    };
  };
  
  // Alerting configuration
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
    
    // Alert channels
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
  // Plugin directory
  directory: string;
  
  // Plugin loading
  autoLoad: boolean;
  loadTimeout: number;
  
  // Plugin registry
  registry: {
    enabled: boolean;
    urls: string[];
    cache: {
      enabled: boolean;
      ttl: number;
    };
  };
  
  // Plugin security
  security: {
    sandboxEnabled: boolean;
    allowedPermissions: string[];
    restrictedAPIs: string[];
    maxMemoryUsage: string;
    maxCPUUsage: string;
    networkAccess: boolean;
    fileSystemAccess: boolean;
  };
  
  // Plugin development
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
  // License configuration
  license: {
    key: string;
    validationURL?: string;
    offlineValidation: boolean;
  };
  
  // Advanced security
  security: {
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    keyManagement: {
      provider: 'local' | 'aws-kms' | 'azure-key-vault' | 'hashicorp-vault';
      config: Record<string, any>;
    };
  };
  
  // High availability
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
  
  // Compliance
  compliance: {
    auditLogging: {
      enabled: boolean;
      level: 'basic' | 'detailed' | 'comprehensive';
      retention: number; // Days
    };
    dataGovernance: {
      enabled: boolean;
      classification: boolean;
      retention: Record<string, number>; // Data type -> retention days
    };
    encryption: {
      algorithm: string;
      keyRotation: {
        enabled: boolean;
        interval: number; // Days
      };
    };
  };
  
  // Multi-tenancy
  multiTenancy?: {
    enabled: boolean;
    isolation: 'shared-database' | 'separate-database' | 'separate-instance';
    defaultTenant: string;
  };
  
  // Backup and disaster recovery
  backupAndRecovery: {
    backup: {
      enabled: boolean;
      schedule: string; // Cron expression
      retention: number; // Days
      encryption: boolean;
      
      // Storage configuration
      storage: {
        provider: 'local' | 's3' | 'gcs' | 'azure-blob';
        config: Record<string, any>;
      };
    };
    
    disasterRecovery: {
      enabled: boolean;
      rto: number; // Recovery Time Objective (minutes)
      rpo: number; // Recovery Point Objective (minutes)
      
      // Failover configuration
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
  // Environment identification
  name: 'development' | 'testing' | 'staging' | 'production';
  region?: string;
  availabilityZone?: string;
  
  // Feature flags
  features: {
    [key: string]: boolean;
  };
  
  // External services
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
  
  // Resource limits
  resources: {
    maxConcurrency: number;
    memoryLimit: string;
    cpuLimit: string;
    storageLimit: string;
  };
  
  // Development settings
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
  // Configuration loading
  loadConfig(path?: string): Promise<OpenConductorConfig>;
  reloadConfig(): Promise<void>;
  
  // Configuration access
  get<T = any>(path: string): T;
  set(path: string, value: any): void;
  has(path: string): boolean;
  
  // Configuration validation
  validate(): Promise<ConfigValidationResult>;
  
  // Configuration watching
  watch(callback: (config: OpenConductorConfig) => void): void;
  unwatch(callback: (config: OpenConductorConfig) => void): void;
  
  // Environment variables
  getEnvVar(name: string, defaultValue?: string): string;
  setEnvVar(name: string, value: string): void;
  
  // Configuration merging
  merge(config: Partial<OpenConductorConfig>): void;
  
  // Configuration persistence
  save(path?: string): Promise<void>;
}

/**
 * Default Configuration Values
 */
export const DEFAULT_CONFIG: OpenConductorConfig = {
  core: {
    instanceId: 'openconductor-default',
    name: 'OpenConductor',
    version: '1.0.0',
    runtime: {
      maxConcurrentAgents: 100,
      maxConcurrentWorkflows: 50,
      defaultTimeout: 30000,
      gracefulShutdownTimeout: 10000,
    },
    agents: {
      defaultMemoryType: 'persistent',
      defaultMemoryStore: 'redis',
      maxExecutionTime: 300000,
      enableSandboxing: true,
      resourceLimits: {
        cpu: '1000m',
        memory: '512Mi',
        storage: '1Gi',
      },
    },
    orchestration: {
      maxWorkflowDepth: 10,
      maxStepsPerWorkflow: 100,
      enableParallelExecution: true,
      defaultRetryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
      },
    },
    events: {
      enableEventStore: true,
      eventRetentionDays: 30,
      maxEventsPerSecond: 1000,
      enableBatching: true,
      batchSize: 100,
      batchTimeout: 5000,
    },
  },
  database: {
    primary: {
      host: 'localhost',
      port: 5432,
      database: 'openconductor',
      username: 'openconductor',
      password: 'password',
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
      },
      queryTimeout: 30000,
      statementTimeout: 30000,
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      autoMigrate: true,
    },
  },
  cache: {
    redis: {
      host: 'localhost',
      port: 6379,
      database: 0,
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    },
    policies: {
      defaultTTL: 3600,
      maxKeySize: 1024,
      maxValueSize: 1048576,
      evictionPolicy: 'allkeys-lru',
    },
    prefixes: {
      agents: 'oc:agents:',
      workflows: 'oc:workflows:',
      events: 'oc:events:',
      sessions: 'oc:sessions:',
    },
  },
  api: {
    server: {
      host: '0.0.0.0',
      port: 3000,
      enableHTTPS: false,
      cors: {
        enabled: true,
        origins: ['*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
      },
    },
    versioning: {
      enabled: true,
      defaultVersion: 'v1',
      supportedVersions: ['v1'],
      headerName: 'X-API-Version',
    },
    rateLimit: {
      enabled: true,
      windowMs: 900000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
    },
    request: {
      maxBodySize: '10mb',
      timeout: 30000,
      enableCompression: true,
    },
    docs: {
      enabled: true,
      path: '/docs',
      title: 'OpenConductor API',
      version: '1.0.0',
    },
    websocket: {
      enabled: true,
      path: '/ws',
      maxConnections: 1000,
      pingInterval: 30000,
      pongTimeout: 5000,
    },
  },
  auth: {
    strategy: 'api-key',
    apiKey: {
      headerName: 'X-API-Key',
      queryParamName: 'apiKey',
      prefixRequired: false,
    },
    session: {
      secret: 'openconductor-session-secret',
      maxAge: 86400000, // 24 hours
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
    rbac: {
      enabled: false,
      defaultRole: 'user',
      roles: {
        admin: ['*'],
        user: ['agents:read', 'workflows:read', 'workflows:execute'],
        viewer: ['agents:read', 'workflows:read'],
      },
    },
  },
  logging: {
    level: 'info',
    format: 'json',
    console: {
      enabled: true,
      colorize: true,
    },
    metadata: {
      service: 'openconductor',
      environment: 'development',
      version: '1.0.0',
      instanceId: 'openconductor-default',
    },
  },
  monitoring: {
    health: {
      enabled: true,
      path: '/health',
      interval: 30000,
      timeout: 5000,
    },
    metrics: {
      enabled: true,
      path: '/metrics',
      prefix: 'openconductor_',
    },
  },
  plugins: {
    directory: './plugins',
    autoLoad: true,
    loadTimeout: 30000,
    registry: {
      enabled: true,
      urls: ['https://registry.openconductor.ai'],
      cache: {
        enabled: true,
        ttl: 3600,
      },
    },
    security: {
      sandboxEnabled: true,
      allowedPermissions: [],
      restrictedAPIs: [],
      maxMemoryUsage: '256Mi',
      maxCPUUsage: '500m',
      networkAccess: true,
      fileSystemAccess: false,
    },
  },
  environment: {
    name: 'development',
    features: {},
    services: {},
    resources: {
      maxConcurrency: 100,
      memoryLimit: '1Gi',
      cpuLimit: '1000m',
      storageLimit: '10Gi',
    },
  },
};