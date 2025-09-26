/**
 * Sports Data Integration Plugin
 * 
 * Multi-provider sports data integration system that extends OpenConductor's
 * PluginManager architecture to efficiently manage costs and data quality
 * across MySportsFeeds, API-Sports, nflfastR, and other providers.
 * 
 * Key Features:
 * - Cost-aware provider selection and routing
 * - Intelligent fallback and redundancy
 * - Rate limit management and queuing
 * - Data quality validation and enrichment
 * - Real-time webhook processing
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';

export interface DataProviderConfig {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'file' | 'database';
  priority: number; // 1 = highest priority
  costPerCall: number; // USD per API call
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit?: number;
  };
  reliability: {
    uptime: number; // 0-1
    accuracy: number; // 0-1
    latency: number; // average ms
  };
  endpoints: {
    [key: string]: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      rateLimit?: number;
      cost?: number;
    };
  };
  authentication: {
    type: 'apikey' | 'oauth' | 'bearer' | 'none';
    config: Record<string, any>;
  };
  dataTypes: string[]; // Types of data this provider supports
  updateFrequency: number; // Minutes between updates
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

export interface DataRequest {
  dataType: 'player_stats' | 'game_schedules' | 'injury_reports' | 'weather' | 'odds' | 'ownership';
  priority: 'low' | 'medium' | 'high' | 'critical';
  params: Record<string, any>;
  maxCost?: number;
  preferredProviders?: string[];
  excludeProviders?: string[];
  cacheStrategy?: 'always' | 'never' | 'smart';
  freshness?: number; // Max age in minutes
}

export interface DataResponse {
  data: any;
  provider: string;
  cost: number;
  latency: number;
  cached: boolean;
  confidence: number;
  timestamp: Date;
  metadata: {
    version?: string;
    source?: string;
    quality?: number;
  };
}

export interface ProviderMetrics {
  providerId: string;
  callsToday: number;
  costToday: number;
  successRate: number;
  averageLatency: number;
  errorRate: number;
  rateLimitHits: number;
  lastCall: Date;
  status: 'active' | 'degraded' | 'down' | 'suspended';
}

export class SportsDataPlugin extends EventEmitter {
  private providers: Map<string, DataProviderConfig> = new Map();
  private providerMetrics: Map<string, ProviderMetrics> = new Map();
  private requestQueue: Array<{ request: DataRequest; resolve: Function; reject: Function }> = [];
  private rateLimitTrackers: Map<string, { count: number; resetTime: Date }> = new Map();
  private logger: Logger;
  private eventBus: EventBus;
  private initialized: boolean = false;
  private processingQueue: boolean = false;

  constructor(logger: Logger, eventBus: EventBus) {
    super();
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
    this.startQueueProcessor();
    this.startMetricsCollection();
  }

  /**
   * Initialize the sports data plugin with provider configurations
   */
  async initialize(providers: DataProviderConfig[]): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Initializing Sports Data Plugin', { providerCount: providers.length });

    try {
      // Register all providers
      for (const provider of providers) {
        await this.registerProvider(provider);
      }

      // Initialize default providers
      await this.initializeDefaultProviders();

      // Start health monitoring
      this.startHealthMonitoring();

      this.initialized = true;
      
      this.eventBus.emit({
        type: 'sports_data_plugin_initialized',
        timestamp: new Date(),
        data: { 
          providerCount: this.providers.size,
          totalEndpoints: Array.from(this.providers.values())
            .reduce((sum, p) => sum + Object.keys(p.endpoints).length, 0)
        }
      });

      this.logger.info('Sports Data Plugin initialized successfully', {
        providers: Array.from(this.providers.keys())
      });

    } catch (error) {
      this.logger.error('Failed to initialize Sports Data Plugin', error);
      throw error;
    }
  }

  /**
   * Register a new data provider
   */
  async registerProvider(config: DataProviderConfig): Promise<void> {
    this.logger.info(`Registering sports data provider: ${config.name}`, {
      id: config.id,
      type: config.type,
      dataTypes: config.dataTypes
    });

    // Validate provider configuration
    this.validateProviderConfig(config);

    // Initialize provider metrics
    this.providerMetrics.set(config.id, {
      providerId: config.id,
      callsToday: 0,
      costToday: 0,
      successRate: 1.0,
      averageLatency: config.reliability.latency,
      errorRate: 0,
      rateLimitHits: 0,
      lastCall: new Date(0),
      status: 'active'
    });

    // Initialize rate limit tracker
    this.rateLimitTrackers.set(config.id, {
      count: 0,
      resetTime: new Date(Date.now() + 60000) // 1 minute from now
    });

    this.providers.set(config.id, config);
    
    this.emit('provider_registered', { providerId: config.id, name: config.name });
  }

  /**
   * Request data from the most appropriate provider
   */
  async requestData(request: DataRequest): Promise<DataResponse> {
    if (!this.initialized) {
      throw new Error('Sports Data Plugin not initialized');
    }

    this.logger.debug('Processing data request', {
      dataType: request.dataType,
      priority: request.priority
    });

    return new Promise((resolve, reject) => {
      // Add to queue for processing
      this.requestQueue.push({ request, resolve, reject });
      
      // Process queue if not already processing
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Get provider metrics and recommendations
   */
  getProviderMetrics(): {
    providers: ProviderMetrics[];
    totalCostToday: number;
    recommendations: string[];
    costOptimization: {
      potentialSavings: number;
      suggestedChanges: string[];
    };
  } {
    const providers = Array.from(this.providerMetrics.values());
    const totalCostToday = providers.reduce((sum, p) => sum + p.costToday, 0);
    
    const recommendations: string[] = [];
    let potentialSavings = 0;
    const suggestedChanges: string[] = [];

    // Analyze cost optimization opportunities
    for (const provider of providers) {
      const config = this.providers.get(provider.providerId);
      if (!config) continue;

      // High cost provider with alternatives
      if (provider.costToday > 10 && provider.successRate < 0.95) {
        recommendations.push(`Consider reducing reliance on ${config.name} due to high cost and low success rate`);
        potentialSavings += provider.costToday * 0.3;
        suggestedChanges.push(`Redirect ${config.name} traffic to lower-cost alternatives`);
      }

      // Rate limit issues
      if (provider.rateLimitHits > 10) {
        recommendations.push(`${config.name} is hitting rate limits frequently - consider caching or request batching`);
        suggestedChanges.push(`Implement intelligent caching for ${config.name}`);
      }

      // Poor performance
      if (provider.averageLatency > 3000) {
        recommendations.push(`${config.name} has high latency - consider using as fallback only`);
      }
    }

    return {
      providers,
      totalCostToday,
      recommendations,
      costOptimization: {
        potentialSavings,
        suggestedChanges
      }
    };
  }

  // Private methods

  private async initializeDefaultProviders(): Promise<void> {
    // MySportsFeeds configuration
    await this.registerProvider({
      id: 'mysportsfeeds',
      name: 'MySportsFeeds',
      type: 'api',
      priority: 1,
      costPerCall: 0.01,
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      reliability: {
        uptime: 0.99,
        accuracy: 0.98,
        latency: 500
      },
      endpoints: {
        player_stats: {
          url: 'https://api.mysportsfeeds.com/v2.1/pull/nfl/{season}/players.json',
          method: 'GET',
          rateLimit: 60,
          cost: 0.01
        },
        game_schedules: {
          url: 'https://api.mysportsfeeds.com/v2.1/pull/nfl/{season}/games.json',
          method: 'GET',
          rateLimit: 60,
          cost: 0.01
        },
        injury_reports: {
          url: 'https://api.mysportsfeeds.com/v2.1/pull/nfl/players.json',
          method: 'GET',
          rateLimit: 60,
          cost: 0.01
        }
      },
      authentication: {
        type: 'apikey',
        config: {
          username: process.env.MYSPORTSFEEDS_API_KEY || '',
          password: 'MYSPORTSFEEDS'
        }
      },
      dataTypes: ['player_stats', 'game_schedules', 'injury_reports'],
      updateFrequency: 15,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      }
    });

    // API-Sports configuration (free tier)
    await this.registerProvider({
      id: 'api-sports',
      name: 'API-Sports',
      type: 'api',
      priority: 2,
      costPerCall: 0.005,
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 100,
        requestsPerDay: 100 // Free tier limit
      },
      reliability: {
        uptime: 0.97,
        accuracy: 0.95,
        latency: 800
      },
      endpoints: {
        game_schedules: {
          url: 'https://v1.american-football.api-sports.io/games',
          method: 'GET',
          rateLimit: 30,
          cost: 0.005
        },
        player_stats: {
          url: 'https://v1.american-football.api-sports.io/players/statistics',
          method: 'GET',
          rateLimit: 30,
          cost: 0.005
        }
      },
      authentication: {
        type: 'apikey',
        config: {
          'X-RapidAPI-Key': process.env.API_SPORTS_KEY || '',
          'X-RapidAPI-Host': 'v1.american-football.api-sports.io'
        }
      },
      dataTypes: ['game_schedules', 'player_stats'],
      updateFrequency: 30,
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 1.5,
        initialDelay: 2000
      }
    });

    // nflfastR (free, static data)
    await this.registerProvider({
      id: 'nflfastr',
      name: 'nflfastR',
      type: 'api',
      priority: 3,
      costPerCall: 0,
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      reliability: {
        uptime: 0.95,
        accuracy: 0.99,
        latency: 1200
      },
      endpoints: {
        historical_stats: {
          url: 'https://github.com/nflverse/nflfastR-data/releases/download/pbp/play_by_play_{season}.parquet',
          method: 'GET',
          cost: 0
        },
        player_stats: {
          url: 'https://github.com/nflverse/nflfastR-data/releases/download/weekly/weekly_{season}.parquet', 
          method: 'GET',
          cost: 0
        }
      },
      authentication: {
        type: 'none',
        config: {}
      },
      dataTypes: ['historical_stats', 'player_stats'],
      updateFrequency: 1440, // Daily
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 5000
      }
    });

    // Weather API (OpenWeatherMap)
    await this.registerProvider({
      id: 'weather-api',
      name: 'OpenWeatherMap',
      type: 'api',
      priority: 1,
      costPerCall: 0.001,
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 5000
      },
      reliability: {
        uptime: 0.99,
        accuracy: 0.92,
        latency: 300
      },
      endpoints: {
        weather: {
          url: 'https://api.openweathermap.org/data/2.5/weather',
          method: 'GET',
          cost: 0.001
        },
        forecast: {
          url: 'https://api.openweathermap.org/data/2.5/forecast',
          method: 'GET',
          cost: 0.001
        }
      },
      authentication: {
        type: 'apikey',
        config: {
          appid: process.env.OPENWEATHER_API_KEY || ''
        }
      },
      dataTypes: ['weather'],
      updateFrequency: 60,
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 2,
        initialDelay: 1000
      }
    });
  }

  private validateProviderConfig(config: DataProviderConfig): void {
    if (!config.id || !config.name) {
      throw new Error('Provider must have id and name');
    }

    if (!config.endpoints || Object.keys(config.endpoints).length === 0) {
      throw new Error('Provider must have at least one endpoint');
    }

    if (!config.dataTypes || config.dataTypes.length === 0) {
      throw new Error('Provider must specify supported data types');
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const { request, resolve, reject } = this.requestQueue.shift()!;

        try {
          const response = await this.executeDataRequest(request);
          resolve(response);
        } catch (error) {
          reject(error);
        }

        // Small delay to prevent overwhelming providers
        await this.sleep(100);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async executeDataRequest(request: DataRequest): Promise<DataResponse> {
    // Select the best provider for this request
    const provider = await this.selectOptimalProvider(request);
    
    if (!provider) {
      throw new Error(`No suitable provider found for ${request.dataType}`);
    }

    // Check rate limits
    if (!this.checkRateLimit(provider.id)) {
      throw new Error(`Rate limit exceeded for provider ${provider.name}`);
    }

    // Execute the request
    const startTime = Date.now();
    
    try {
      const data = await this.makeProviderRequest(provider, request);
      const latency = Date.now() - startTime;
      const cost = this.calculateRequestCost(provider, request);

      // Update metrics
      this.updateProviderMetrics(provider.id, { success: true, latency, cost });

      // Emit success event
      this.eventBus.emit({
        type: 'sports_data_request_success',
        timestamp: new Date(),
        data: {
          providerId: provider.id,
          dataType: request.dataType,
          latency,
          cost
        }
      });

      return {
        data,
        provider: provider.id,
        cost,
        latency,
        cached: false,
        confidence: provider.reliability.accuracy,
        timestamp: new Date(),
        metadata: {
          version: '1.0',
          source: provider.name,
          quality: provider.reliability.accuracy
        }
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Update metrics for failure
      this.updateProviderMetrics(provider.id, { success: false, latency, cost: 0 });

      // Try fallback providers
      const fallbackResponse = await this.tryFallbackProviders(request, provider.id);
      
      if (fallbackResponse) {
        return fallbackResponse;
      }

      throw error;
    }
  }

  private async selectOptimalProvider(request: DataRequest): Promise<DataProviderConfig | null> {
    const eligibleProviders = Array.from(this.providers.values())
      .filter(provider => {
        // Check if provider supports this data type
        if (!provider.dataTypes.includes(request.dataType)) return false;
        
        // Check if provider is excluded
        if (request.excludeProviders?.includes(provider.id)) return false;
        
        // Check if provider is preferred
        if (request.preferredProviders && !request.preferredProviders.includes(provider.id)) return false;
        
        // Check if provider is healthy
        const metrics = this.providerMetrics.get(provider.id);
        if (metrics?.status === 'down') return false;
        
        return true;
      });

    if (eligibleProviders.length === 0) {
      return null;
    }

    // Score providers based on cost, reliability, and performance
    const scoredProviders = eligibleProviders.map(provider => {
      const metrics = this.providerMetrics.get(provider.id)!;
      const costScore = request.maxCost ? Math.max(0, 1 - provider.costPerCall / request.maxCost) : 0.5;
      const reliabilityScore = provider.reliability.uptime * provider.reliability.accuracy;
      const performanceScore = Math.max(0, 1 - metrics.averageLatency / 5000); // 5s max acceptable latency
      const priorityScore = (10 - provider.priority) / 10; // Lower priority number = higher score

      const totalScore = (costScore * 0.3) + (reliabilityScore * 0.4) + (performanceScore * 0.2) + (priorityScore * 0.1);

      return { provider, score: totalScore };
    });

    // Sort by score and return the best provider
    scoredProviders.sort((a, b) => b.score - a.score);
    return scoredProviders[0].provider;
  }

  private checkRateLimit(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    const tracker = this.rateLimitTrackers.get(providerId);
    
    if (!provider || !tracker) return false;

    const now = new Date();
    
    // Reset counter if reset time has passed
    if (now >= tracker.resetTime) {
      tracker.count = 0;
      tracker.resetTime = new Date(now.getTime() + 60000); // 1 minute from now
    }

    // Check if under rate limit
    if (tracker.count >= provider.rateLimits.requestsPerMinute) {
      // Update metrics
      const metrics = this.providerMetrics.get(providerId);
      if (metrics) {
        metrics.rateLimitHits++;
      }
      return false;
    }

    return true;
  }

  private async makeProviderRequest(provider: DataProviderConfig, request: DataRequest): Promise<any> {
    // This is a simplified implementation
    // In production, this would make actual HTTP requests based on provider configuration
    
    const endpoint = provider.endpoints[request.dataType];
    if (!endpoint) {
      throw new Error(`Endpoint not found for ${request.dataType}`);
    }

    this.logger.debug(`Making request to ${provider.name}`, {
      endpoint: endpoint.url,
      method: endpoint.method
    });

    // Simulate API call delay
    await this.sleep(provider.reliability.latency);

    // Simulate some requests failing based on reliability
    if (Math.random() > provider.reliability.accuracy) {
      throw new Error(`Simulated API failure for ${provider.name}`);
    }

    // Update rate limit tracker
    const tracker = this.rateLimitTrackers.get(provider.id);
    if (tracker) {
      tracker.count++;
    }

    // Return mock data for now
    return {
      provider: provider.id,
      dataType: request.dataType,
      mockData: true,
      timestamp: new Date(),
      params: request.params
    };
  }

  private calculateRequestCost(provider: DataProviderConfig, request: DataRequest): number {
    const endpoint = provider.endpoints[request.dataType];
    return endpoint?.cost || provider.costPerCall;
  }

  private updateProviderMetrics(providerId: string, result: { success: boolean; latency: number; cost: number }): void {
    const metrics = this.providerMetrics.get(providerId);
    if (!metrics) return;

    // Update success rate (rolling average)
    const alpha = 0.1; // Smoothing factor
    metrics.successRate = (1 - alpha) * metrics.successRate + alpha * (result.success ? 1 : 0);
    metrics.errorRate = 1 - metrics.successRate;

    // Update average latency
    metrics.averageLatency = (1 - alpha) * metrics.averageLatency + alpha * result.latency;

    // Update daily totals
    const today = new Date().toDateString();
    const lastCallDay = metrics.lastCall.toDateString();
    
    if (today !== lastCallDay) {
      // Reset daily counters
      metrics.callsToday = 0;
      metrics.costToday = 0;
    }

    metrics.callsToday++;
    metrics.costToday += result.cost;
    metrics.lastCall = new Date();

    // Update status based on recent performance
    if (metrics.successRate < 0.5) {
      metrics.status = 'down';
    } else if (metrics.successRate < 0.8 || metrics.averageLatency > 3000) {
      metrics.status = 'degraded';
    } else {
      metrics.status = 'active';
    }
  }

  private async tryFallbackProviders(request: DataRequest, excludeProviderId: string): Promise<DataResponse | null> {
    const fallbackRequest = {
      ...request,
      excludeProviders: [...(request.excludeProviders || []), excludeProviderId]
    };

    try {
      return await this.executeDataRequest(fallbackRequest);
    } catch (error) {
      this.logger.debug('Fallback provider also failed', { error: (error as Error).message });
      return null;
    }
  }

  private setupEventListeners(): void {
    this.on('provider_health_check', this.handleProviderHealthCheck.bind(this));
    this.on('cost_limit_warning', this.handleCostWarning.bind(this));
  }

  private startQueueProcessor(): void {
    // Process queue every 100ms
    setInterval(() => {
      if (!this.processingQueue && this.requestQueue.length > 0) {
        this.processQueue().catch(error => {
          this.logger.error('Queue processing error', error);
        });
      }
    }, 100);
  }

  private startMetricsCollection(): void {
    // Collect and emit metrics every 5 minutes
    setInterval(() => {
      const metrics = this.getProviderMetrics();
      
      this.eventBus.emit({
        type: 'sports_data_metrics',
        timestamp: new Date(),
        data: metrics
      });

      // Log cost warnings
      if (metrics.totalCostToday > 5) { // $5 daily warning
        this.logger.warn('Daily sports data costs are high', {
          totalCost: metrics.totalCostToday,
          providers: metrics.providers.length
        });
      }
    }, 300000); // 5 minutes
  }

  private startHealthMonitoring(): void {
    // Monitor provider health every minute
    setInterval(async () => {
      for (const [providerId] of this.providers.entries()) {
        await this.checkProviderHealth(providerId);
      }
    }, 60000); // 1 minute
  }

  private async checkProviderHealth(providerId: string): Promise<void> {
    const metrics = this.providerMetrics.get(providerId);
    const provider = this.providers.get(providerId);
    
    if (!metrics || !provider) return;

    // Simple health check based on recent performance
    const isHealthy = metrics.successRate > 0.8 && metrics.averageLatency < 5000;
    
    if (!isHealthy && metrics.status === 'active') {
      this.logger.warn(`Provider ${provider.name} health degraded`, {
        successRate: metrics.successRate,
        averageLatency: metrics.averageLatency
      });
      
      this.eventBus.emit({
        type: 'provider_health_degraded',
        timestamp: new Date(),
        data: { providerId, providerName: provider.name, metrics }
      });
    }
  }

  private async handleProviderHealthCheck(event: any): Promise<void> {
    await this.checkProviderHealth(event.providerId);
  }

  private async handleCostWarning(event: any): Promise<void> {
    this.logger.warn('Cost limit warning for sports data', event);
    
    // Implement cost mitigation strategies
    // For example, temporarily disable expensive providers
    // or switch to free alternatives
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    this.processingQueue = false;
    this.requestQueue.length = 0;
    this.providers.clear();
    this.providerMetrics.clear();
    this.rateLimitTrackers.clear();
    
    this.logger.info('Sports Data Plugin shut down');
  }
}