/**
 * SportIntel Development Configuration
 *
 * Extends OpenConductor configuration management with sports analytics
 * specific settings for development, testing, and production environments.
 */
import { ConfigManager } from '../../utils/config-manager';
export interface SportIntelDevConfig {
    environment: 'development' | 'testing' | 'staging' | 'production';
    debug: {
        enabled: boolean;
        level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
        logToFile: boolean;
        logToConsole: boolean;
        enableProfiler: boolean;
        enableMemoryLeakDetection: boolean;
    };
    database: {
        timescale: {
            host: string;
            port: number;
            database: string;
            username: string;
            password: string;
            ssl: boolean;
            maxConnections: number;
            connectionTimeout: number;
        };
        redis: {
            host: string;
            port: number;
            password?: string;
            database: number;
            maxMemory: string;
            evictionPolicy: string;
        };
    };
    api: {
        providers: {
            apiSports: {
                baseUrl: string;
                apiKey: string;
                timeout: number;
                retries: number;
                rateLimit: number;
                enabled: boolean;
            };
            mySportsFeeds: {
                baseUrl: string;
                username: string;
                password: string;
                timeout: number;
                retries: number;
                rateLimit: number;
                enabled: boolean;
            };
            espn: {
                baseUrl: string;
                timeout: number;
                retries: number;
                rateLimit: number;
                enabled: boolean;
            };
        };
        mock: {
            enabled: boolean;
            dataPath: string;
            latencyMs: number;
            errorRate: number;
        };
    };
    cache: {
        enabled: boolean;
        ttl: {
            players: number;
            games: number;
            market: number;
            predictions: number;
        };
        maxMemory: string;
        compression: boolean;
        persistToDisk: boolean;
    };
    features: {
        explainableAI: boolean;
        realTimePredictions: boolean;
        portfolioOptimization: boolean;
        alertSystem: boolean;
        performanceMonitoring: boolean;
    };
    testing: {
        enableTestData: boolean;
        mockExternalAPIs: boolean;
        enableIntegrationTests: boolean;
        testDatabaseUrl: string;
        testRedisUrl: string;
    };
    monitoring: {
        prometheus: {
            enabled: boolean;
            port: number;
            path: string;
        };
        healthCheck: {
            enabled: boolean;
            interval: number;
            timeout: number;
        };
        alerts: {
            email?: string[];
            slack?: string;
            webhook?: string;
        };
    };
    security: {
        enableCORS: boolean;
        allowedOrigins: string[];
        jwtSecret: string;
        bcryptRounds: number;
        rateLimiting: {
            windowMs: number;
            maxRequests: number;
        };
    };
}
export declare class SportIntelConfigManager extends ConfigManager {
    private static instance;
    private config;
    private logger;
    constructor();
    static getInstance(): SportIntelConfigManager;
    /**
     * Load configuration based on environment
     */
    private loadConfiguration;
    /**
     * Apply environment-specific configuration overrides
     */
    private applyEnvironmentOverrides;
    /**
     * Validate configuration and log warnings for missing required settings
     */
    private validateConfiguration;
    /**
     * Get current configuration
     */
    getConfig(): SportIntelDevConfig;
    /**
     * Get specific configuration section
     */
    getSection<K extends keyof SportIntelDevConfig>(section: K): SportIntelDevConfig[K];
    /**
     * Update configuration at runtime (for development/testing)
     */
    updateConfig<K extends keyof SportIntelDevConfig>(section: K, updates: Partial<SportIntelDevConfig[K]>): void;
    /**
     * Get database connection string
     */
    getDatabaseUrl(): string;
    /**
     * Get Redis connection string
     */
    getRedisUrl(): string;
    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature: keyof SportIntelDevConfig['features']): boolean;
    /**
     * Check if we're in development mode
     */
    isDevelopment(): boolean;
    /**
     * Check if we're in testing mode
     */
    isTesting(): boolean;
    /**
     * Check if we're in production mode
     */
    isProduction(): boolean;
    /**
     * Get environment-appropriate logger level
     */
    getLogLevel(): string;
    /**
     * Get API provider configuration
     */
    getApiProvider<K extends keyof SportIntelDevConfig['api']['providers']>(provider: K): SportIntelDevConfig['api']['providers'][K];
    /**
     * Generate a secure secret key if none provided
     */
    private generateSecretKey;
    /**
     * Export configuration for debugging
     */
    exportConfig(includeSecrets?: boolean): Record<string, any>;
    /**
     * Reload configuration from environment
     */
    reloadConfiguration(): void;
}
export declare const sportIntelConfig: SportIntelConfigManager;
export default SportIntelConfigManager;
//# sourceMappingURL=development-config.d.ts.map