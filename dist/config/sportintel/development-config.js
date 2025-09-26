"use strict";
/**
 * SportIntel Development Configuration
 *
 * Extends OpenConductor configuration management with sports analytics
 * specific settings for development, testing, and production environments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sportIntelConfig = exports.SportIntelConfigManager = void 0;
const config_manager_1 = require("../../utils/config-manager");
const logger_1 = require("../../utils/logger");
class SportIntelConfigManager extends config_manager_1.ConfigManager {
    static instance;
    config;
    logger;
    constructor() {
        super();
        this.logger = logger_1.Logger.getInstance();
        this.config = this.loadConfiguration();
        this.validateConfiguration();
    }
    static getInstance() {
        if (!SportIntelConfigManager.instance) {
            SportIntelConfigManager.instance = new SportIntelConfigManager();
        }
        return SportIntelConfigManager.instance;
    }
    /**
     * Load configuration based on environment
     */
    loadConfiguration() {
        const environment = (process.env.NODE_ENV || 'development');
        const baseConfig = {
            environment,
            debug: {
                enabled: environment !== 'production',
                level: environment === 'production' ? 'warn' : 'debug',
                logToFile: true,
                logToConsole: environment !== 'production',
                enableProfiler: environment === 'development',
                enableMemoryLeakDetection: environment === 'development'
            },
            database: {
                timescale: {
                    host: process.env.TIMESCALE_HOST || 'localhost',
                    port: parseInt(process.env.TIMESCALE_PORT || '5432'),
                    database: process.env.TIMESCALE_DATABASE || 'sportintel_dev',
                    username: process.env.TIMESCALE_USERNAME || 'sportintel',
                    password: process.env.TIMESCALE_PASSWORD || 'password',
                    ssl: environment === 'production',
                    maxConnections: environment === 'production' ? 20 : 5,
                    connectionTimeout: 30000
                },
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                    database: environment === 'testing' ? 2 : 1,
                    maxMemory: environment === 'production' ? '2gb' : '512mb',
                    evictionPolicy: 'allkeys-lru'
                }
            },
            api: {
                providers: {
                    apiSports: {
                        baseUrl: 'https://v3.football.api-sports.io',
                        apiKey: process.env.API_SPORTS_KEY || '',
                        timeout: 5000,
                        retries: 3,
                        rateLimit: environment === 'production' ? 100 : 10,
                        enabled: !!process.env.API_SPORTS_KEY
                    },
                    mySportsFeeds: {
                        baseUrl: 'https://api.mysportsfeeds.com/v2.1/pull',
                        username: process.env.MYSPORTS_USERNAME || '',
                        password: process.env.MYSPORTS_PASSWORD || '',
                        timeout: 5000,
                        retries: 3,
                        rateLimit: environment === 'production' ? 200 : 20,
                        enabled: !!(process.env.MYSPORTS_USERNAME && process.env.MYSPORTS_PASSWORD)
                    },
                    espn: {
                        baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
                        timeout: 5000,
                        retries: 2,
                        rateLimit: environment === 'production' ? 50 : 10,
                        enabled: true // Free API
                    }
                },
                mock: {
                    enabled: environment === 'development' || environment === 'testing',
                    dataPath: './test-data/mock-api-responses.json',
                    latencyMs: environment === 'testing' ? 0 : 100,
                    errorRate: environment === 'testing' ? 0.1 : 0
                }
            },
            cache: {
                enabled: true,
                ttl: {
                    players: environment === 'development' ? 60 : 300, // 1min dev, 5min prod
                    games: environment === 'development' ? 30 : 120, // 30s dev, 2min prod
                    market: environment === 'development' ? 10 : 30, // 10s dev, 30s prod
                    predictions: environment === 'development' ? 300 : 900 // 5min dev, 15min prod
                },
                maxMemory: environment === 'production' ? '1gb' : '256mb',
                compression: environment === 'production',
                persistToDisk: environment === 'production'
            },
            features: {
                explainableAI: environment !== 'testing',
                realTimePredictions: environment === 'production' || environment === 'staging',
                portfolioOptimization: true,
                alertSystem: environment !== 'testing',
                performanceMonitoring: true
            },
            testing: {
                enableTestData: environment === 'testing' || environment === 'development',
                mockExternalAPIs: environment === 'testing',
                enableIntegrationTests: environment !== 'production',
                testDatabaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/sportintel_test',
                testRedisUrl: process.env.TEST_REDIS_URL || 'redis://localhost:6379/3'
            },
            monitoring: {
                prometheus: {
                    enabled: environment === 'production' || environment === 'staging',
                    port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
                    path: '/metrics'
                },
                healthCheck: {
                    enabled: true,
                    interval: environment === 'production' ? 30000 : 60000,
                    timeout: 5000
                },
                alerts: {
                    email: process.env.ALERT_EMAILS ? process.env.ALERT_EMAILS.split(',') : undefined,
                    slack: process.env.SLACK_WEBHOOK_URL,
                    webhook: process.env.ALERT_WEBHOOK_URL
                }
            },
            security: {
                enableCORS: true,
                allowedOrigins: environment === 'production'
                    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://sportintel.ai']
                    : ['http://localhost:3000', 'http://localhost:3003'],
                jwtSecret: process.env.JWT_SECRET || this.generateSecretKey(),
                bcryptRounds: environment === 'production' ? 12 : 8,
                rateLimiting: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    maxRequests: environment === 'production' ? 1000 : 100
                }
            }
        };
        // Environment-specific overrides
        return this.applyEnvironmentOverrides(baseConfig, environment);
    }
    /**
     * Apply environment-specific configuration overrides
     */
    applyEnvironmentOverrides(baseConfig, environment) {
        const config = { ...baseConfig };
        switch (environment) {
            case 'development':
                config.debug.enableProfiler = true;
                config.debug.enableMemoryLeakDetection = true;
                config.cache.persistToDisk = false;
                config.api.mock.enabled = true;
                break;
            case 'testing':
                config.debug.logToConsole = false;
                config.api.mock.enabled = true;
                config.api.mock.latencyMs = 0;
                config.cache.enabled = false; // Disable caching in tests
                config.features.explainableAI = false;
                config.features.alertSystem = false;
                break;
            case 'staging':
                config.debug.level = 'info';
                config.api.mock.enabled = false;
                config.monitoring.prometheus.enabled = true;
                break;
            case 'production':
                config.debug.enabled = false;
                config.debug.level = 'error';
                config.debug.logToConsole = false;
                config.debug.enableProfiler = false;
                config.debug.enableMemoryLeakDetection = false;
                config.api.mock.enabled = false;
                config.cache.compression = true;
                config.cache.persistToDisk = true;
                config.monitoring.prometheus.enabled = true;
                break;
        }
        return config;
    }
    /**
     * Validate configuration and log warnings for missing required settings
     */
    validateConfiguration() {
        const errors = [];
        const warnings = [];
        // Required API keys for production
        if (this.config.environment === 'production') {
            if (!this.config.api.providers.apiSports.apiKey) {
                errors.push('API_SPORTS_KEY is required for production');
            }
            if (!this.config.api.providers.mySportsFeeds.username || !this.config.api.providers.mySportsFeeds.password) {
                warnings.push('MySportsFeeds credentials not configured - provider will be disabled');
            }
            if (!this.config.security.jwtSecret || this.config.security.jwtSecret === 'default-secret') {
                errors.push('JWT_SECRET must be configured for production');
            }
        }
        // Database connectivity
        if (!this.config.database.timescale.password || this.config.database.timescale.password === 'password') {
            warnings.push('Using default database password - not secure for production');
        }
        // Redis configuration
        if (this.config.environment === 'production' && !this.config.database.redis.password) {
            warnings.push('Redis password not set - recommended for production');
        }
        // Log validation results
        if (errors.length > 0) {
            this.logger.error('Configuration validation failed', { errors });
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }
        if (warnings.length > 0) {
            this.logger.warn('Configuration warnings', { warnings });
        }
        this.logger.info('Configuration loaded successfully', {
            environment: this.config.environment,
            features: Object.entries(this.config.features).filter(([_, enabled]) => enabled).map(([name]) => name),
            providers: Object.entries(this.config.api.providers).filter(([_, config]) => config.enabled).map(([name]) => name)
        });
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get specific configuration section
     */
    getSection(section) {
        return this.config[section];
    }
    /**
     * Update configuration at runtime (for development/testing)
     */
    updateConfig(section, updates) {
        if (this.config.environment === 'production') {
            this.logger.warn('Attempted to update configuration in production - ignored');
            return;
        }
        this.config[section] = { ...this.config[section], ...updates };
        this.logger.info('Configuration updated', { section, updates });
    }
    /**
     * Get database connection string
     */
    getDatabaseUrl() {
        const db = this.config.database.timescale;
        return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
    }
    /**
     * Get Redis connection string
     */
    getRedisUrl() {
        const redis = this.config.database.redis;
        const auth = redis.password ? `:${redis.password}@` : '';
        return `redis://${auth}${redis.host}:${redis.port}/${redis.database}`;
    }
    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.config.features[feature];
    }
    /**
     * Check if we're in development mode
     */
    isDevelopment() {
        return this.config.environment === 'development';
    }
    /**
     * Check if we're in testing mode
     */
    isTesting() {
        return this.config.environment === 'testing';
    }
    /**
     * Check if we're in production mode
     */
    isProduction() {
        return this.config.environment === 'production';
    }
    /**
     * Get environment-appropriate logger level
     */
    getLogLevel() {
        return this.config.debug.level;
    }
    /**
     * Get API provider configuration
     */
    getApiProvider(provider) {
        return this.config.api.providers[provider];
    }
    /**
     * Generate a secure secret key if none provided
     */
    generateSecretKey() {
        if (this.config.environment === 'production') {
            throw new Error('JWT_SECRET must be provided in production environment');
        }
        // Generate a random key for development/testing
        return require('crypto').randomBytes(32).toString('hex');
    }
    /**
     * Export configuration for debugging
     */
    exportConfig(includeSecrets = false) {
        const config = { ...this.config };
        if (!includeSecrets) {
            // Remove sensitive information
            config.database.timescale.password = '***';
            config.database.redis.password = config.database.redis.password ? '***' : undefined;
            config.api.providers.apiSports.apiKey = config.api.providers.apiSports.apiKey ? '***' : '';
            config.api.providers.mySportsFeeds.password = config.api.providers.mySportsFeeds.password ? '***' : '';
            config.security.jwtSecret = '***';
        }
        return config;
    }
    /**
     * Reload configuration from environment
     */
    reloadConfiguration() {
        if (this.config.environment === 'production') {
            this.logger.warn('Configuration reload not allowed in production');
            return;
        }
        this.logger.info('Reloading configuration...');
        this.config = this.loadConfiguration();
        this.validateConfiguration();
        this.logger.info('Configuration reloaded successfully');
    }
}
exports.SportIntelConfigManager = SportIntelConfigManager;
// Export default instance
exports.sportIntelConfig = SportIntelConfigManager.getInstance();
exports.default = SportIntelConfigManager;
//# sourceMappingURL=development-config.js.map