/**
 * SportIntel Development Configuration
 * 
 * Extends OpenConductor configuration management with sports analytics
 * specific settings for development, testing, and production environments.
 */

import { ConfigManager } from '../../utils/config-manager';
import { Logger } from '../../utils/logger';

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

export class SportIntelConfigManager extends ConfigManager {
  private static instance: SportIntelConfigManager;
  private config: SportIntelDevConfig;
  private logger: Logger;

  constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): SportIntelConfigManager {
    if (!SportIntelConfigManager.instance) {
      SportIntelConfigManager.instance = new SportIntelConfigManager();
    }
    return SportIntelConfigManager.instance;
  }

  /**
   * Load configuration based on environment
   */
  private loadConfiguration(): SportIntelDevConfig {
    const environment = (process.env.NODE_ENV || 'development') as SportIntelDevConfig['environment'];
    
    const baseConfig: SportIntelDevConfig = {
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
          players: environment === 'development' ? 60 : 300,      // 1min dev, 5min prod
          games: environment === 'development' ? 30 : 120,        // 30s dev, 2min prod
          market: environment === 'development' ? 10 : 30,        // 10s dev, 30s prod
          predictions: environment === 'development' ? 300 : 900  // 5min dev, 15min prod
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
  private applyEnvironmentOverrides(
    baseConfig: SportIntelDevConfig,
    environment: SportIntelDevConfig['environment']
  ): SportIntelDevConfig {
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
  private validateConfiguration(): void {
    const errors: string[] = [];
    const warnings: string[] = [];

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
  public getConfig(): SportIntelDevConfig {
    return { ...this.config };
  }

  /**
   * Get specific configuration section
   */
  public getSection<K extends keyof SportIntelDevConfig>(section: K): SportIntelDevConfig[K] {
    return this.config[section];
  }

  /**
   * Update configuration at runtime (for development/testing)
   */
  public updateConfig<K extends keyof SportIntelDevConfig>(
    section: K,
    updates: Partial<SportIntelDevConfig[K]>
  ): void {
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
  public getDatabaseUrl(): string {
    const db = this.config.database.timescale;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
  }

  /**
   * Get Redis connection string  
   */
  public getRedisUrl(): string {
    const redis = this.config.database.redis;
    const auth = redis.password ? `:${redis.password}@` : '';
    return `redis://${auth}${redis.host}:${redis.port}/${redis.database}`;
  }

  /**
   * Check if feature is enabled
   */
  public isFeatureEnabled(feature: keyof SportIntelDevConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Check if we're in development mode
   */
  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Check if we're in testing mode
   */
  public isTesting(): boolean {
    return this.config.environment === 'testing';
  }

  /**
   * Check if we're in production mode
   */
  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Get environment-appropriate logger level
   */
  public getLogLevel(): string {
    return this.config.debug.level;
  }

  /**
   * Get API provider configuration
   */
  public getApiProvider<K extends keyof SportIntelDevConfig['api']['providers']>(
    provider: K
  ): SportIntelDevConfig['api']['providers'][K] {
    return this.config.api.providers[provider];
  }

  /**
   * Generate a secure secret key if none provided
   */
  private generateSecretKey(): string {
    if (this.config.environment === 'production') {
      throw new Error('JWT_SECRET must be provided in production environment');
    }
    
    // Generate a random key for development/testing
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Export configuration for debugging
   */
  public exportConfig(includeSecrets: boolean = false): Record<string, any> {
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
  public reloadConfiguration(): void {
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

// Export default instance
export const sportIntelConfig = SportIntelConfigManager.getInstance();

export default SportIntelConfigManager;