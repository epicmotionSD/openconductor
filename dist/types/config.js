"use strict";
/**
 * OpenConductor Configuration Types
 *
 * Configuration interfaces for all aspects of the OpenConductor platform,
 * supporting both open-source and enterprise deployments.
 *
 * "Built on open standards for maximum flexibility"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
/**
 * Default Configuration Values
 */
exports.DEFAULT_CONFIG = {
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
//# sourceMappingURL=config.js.map