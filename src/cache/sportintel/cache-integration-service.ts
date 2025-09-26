/**
 * Cache Integration Service for SportIntel
 * 
 * Central service that orchestrates intelligent caching, cost-aware routing,
 * and data optimization to achieve the $150/month cost target.
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../utils/config-manager';
import IntelligentCacheManager, { CacheConfig } from './intelligent-cache-manager';
import CostAwareApiRouter, { ApiProvider, ApiRequest, ApiResponse } from './cost-aware-api-router';

export interface CacheIntegrationConfig {
  cache: CacheConfig;
  providers: ApiProvider[];
  optimization: {
    enablePredictiveWarming: boolean;
    enableBatchOptimization: boolean;
    enableCostAlerts: boolean;
    maxConcurrentRequests: number;
    gameWarmupHours: number;
  };
  monitoring: {
    metricsInterval: number;
    alertThresholds: {
      hitRate: number;
      responseTime: number;
      costPerHour: number;
    };
  };
}

export interface DataRequest<T = any> {
  key: string;
  dataType: 'player' | 'game' | 'market' | 'historical' | 'prediction';
  params: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  maxCost?: number;
  requiredBy?: Date;
  forceFresh?: boolean;
  batchable?: boolean;
}

export interface OptimizationReport {
  period: string;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalCost: number;
  costSavings: number;
  averageResponseTime: number;
  topCostDrivers: Array<{
    dataType: string;
    cost: number;
    requests: number;
  }>;
  recommendations: string[];
}

export class CacheIntegrationService extends EventEmitter {
  private cacheManager: IntelligentCacheManager;
  private apiRouter: CostAwareApiRouter;
  private config: CacheIntegrationConfig;
  private logger: Logger;
  private requestQueue: Map<string, DataRequest[]> = new Map();
  private batchTimer: NodeJS.Timer | null = null;
  private metricsTimer: NodeJS.Timer | null = null;

  constructor(config: CacheIntegrationConfig) {
    super();
    this.config = config;
    this.logger = Logger.getInstance();
    
    // Initialize cache manager and API router
    this.cacheManager = new IntelligentCacheManager(config.cache);
    this.apiRouter = new CostAwareApiRouter(config.providers, this.cacheManager);

    this.setupEventHandlers();
    this.startBatchProcessor();
    this.startMetricsCollection();
    this.setupGameWarmup();
  }

  /**
   * Primary data fetching method with intelligent caching and routing
   */
  async getData<T>(request: DataRequest<T>): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(request);

      // Check cache first (unless forceFresh is true)
      if (!request.forceFresh) {
        const cached = await this.cacheManager.get<T>(cacheKey, {
          priority: request.priority || 'medium',
          tags: [request.dataType]
        });

        if (cached !== null) {
          this.emit('data_served', {
            source: 'cache',
            key: request.key,
            responseTime: Date.now() - startTime
          });
          return cached;
        }
      }

      // Convert to API request format
      const apiRequest: ApiRequest = {
        endpoint: this.getEndpointForDataType(request.dataType),
        params: request.params,
        dataType: request.dataType,
        priority: request.priority || 'medium',
        maxCost: request.maxCost || this.getDefaultMaxCost(request.dataType),
        cacheable: true,
        batchable: request.batchable || false,
        requiredBy: request.requiredBy || new Date(Date.now() + 300000) // 5 minutes default
      };

      // Route through API router
      const response = await this.apiRouter.route<T>(apiRequest);

      this.emit('data_served', {
        source: response.provider,
        key: request.key,
        responseTime: Date.now() - startTime,
        cost: response.cost
      });

      return response.data;

    } catch (error) {
      this.logger.error('Data fetch failed', { request: request.key, error });
      this.emit('data_error', { request, error });
      return null;
    }
  }

  /**
   * Batch data fetching with optimization
   */
  async getBatch<T>(requests: DataRequest<T>[]): Promise<Array<{ key: string; data: T | null }>> {
    if (!this.config.optimization.enableBatchOptimization) {
      // Process individually
      const results = await Promise.all(
        requests.map(async request => ({
          key: request.key,
          data: await this.getData<T>(request)
        }))
      );
      return results;
    }

    // Group requests by data type and batchability
    const batchGroups = this.groupRequestsForBatching(requests);
    const results: Array<{ key: string; data: T | null }> = [];

    for (const [groupKey, groupRequests] of batchGroups.entries()) {
      try {
        const groupResults = await this.processBatchGroup<T>(groupRequests);
        results.push(...groupResults);
      } catch (error) {
        this.logger.error('Batch group processing failed', { groupKey, error });
        
        // Fallback to individual processing
        for (const request of groupRequests) {
          const data = await this.getData<T>(request);
          results.push({ key: request.key, data });
        }
      }
    }

    return results;
  }

  /**
   * Predictive cache warming for upcoming games
   */
  async warmCacheForGames(gameIds: string[]): Promise<void> {
    if (!this.config.optimization.enablePredictiveWarming) {
      return;
    }

    this.logger.info(`Starting predictive cache warming for ${gameIds.length} games`);

    const warmupPromises = gameIds.map(async gameId => {
      try {
        await this.warmGameData(gameId);
        this.logger.debug(`Cache warmed for game: ${gameId}`);
      } catch (error) {
        this.logger.error(`Cache warming failed for game: ${gameId}`, error);
      }
    });

    await Promise.all(warmupPromises);
    await this.cacheManager.warmCache(gameIds);
    
    this.emit('cache_warmed', { gameIds, timestamp: new Date() });
  }

  /**
   * Generate optimization report
   */
  async generateOptimizationReport(period: 'hour' | 'day' | 'week' = 'day'): Promise<OptimizationReport> {
    const cacheStats = this.cacheManager.getStats();
    const routerStats = this.apiRouter.getStats();
    const costStats = this.cacheManager.getCostStats();

    // Calculate cost drivers
    const topCostDrivers = this.calculateTopCostDrivers();

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(cacheStats, costStats);

    return {
      period,
      totalRequests: cacheStats.totalRequests,
      cacheHits: cacheStats.totalHits,
      cacheMisses: cacheStats.totalMisses,
      hitRate: cacheStats.hitRate,
      totalCost: routerStats.totalCost,
      costSavings: routerStats.costSavings,
      averageResponseTime: cacheStats.averageResponseTime,
      topCostDrivers,
      recommendations
    };
  }

  /**
   * Optimize cache configuration based on usage patterns
   */
  async optimizeConfiguration(): Promise<void> {
    this.logger.info('Starting cache configuration optimization');

    const report = await this.generateOptimizationReport();
    
    // Adjust cache TTLs based on hit rates
    await this.optimizeCacheTTLs(report);
    
    // Adjust provider priorities based on cost and performance
    await this.optimizeProviderConfiguration(report);
    
    // Optimize memory allocation
    await this.cacheManager.optimize();

    this.emit('configuration_optimized', { report, timestamp: new Date() });
    this.logger.info('Cache configuration optimization completed');
  }

  /**
   * Get comprehensive metrics for monitoring
   */
  getMetrics() {
    return {
      cache: this.cacheManager.getStats(),
      routing: this.apiRouter.getStats(),
      cost: this.cacheManager.getCostStats(),
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  /**
   * Health check for the caching system
   */
  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    const metrics = this.getMetrics();

    // Check cache hit rate
    if (metrics.cache.hitRate < this.config.monitoring.alertThresholds.hitRate) {
      issues.push(`Cache hit rate below threshold: ${(metrics.cache.hitRate * 100).toFixed(1)}%`);
    }

    // Check response times
    if (metrics.cache.averageResponseTime > this.config.monitoring.alertThresholds.responseTime) {
      issues.push(`Average response time above threshold: ${metrics.cache.averageResponseTime}ms`);
    }

    // Check cost rate
    const hourlyRate = metrics.cost.hourlyCost;
    if (hourlyRate > this.config.monitoring.alertThresholds.costPerHour) {
      issues.push(`Hourly cost rate above threshold: $${hourlyRate.toFixed(4)}`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  // Private helper methods

  private generateCacheKey(request: DataRequest): string {
    const paramString = Object.keys(request.params)
      .sort()
      .map(key => `${key}=${request.params[key]}`)
      .join('&');
    
    return `${request.dataType}:${request.key}:${paramString}`;
  }

  private getEndpointForDataType(dataType: string): string {
    const endpoints = {
      player: '/api/players',
      game: '/api/games',
      market: '/api/market',
      historical: '/api/historical',
      prediction: '/api/predictions'
    };
    return endpoints[dataType as keyof typeof endpoints] || '/api/data';
  }

  private getDefaultMaxCost(dataType: string): number {
    const costs = {
      player: 0.01,
      game: 0.01,
      market: 0.005,
      historical: 0.02,
      prediction: 0.02
    };
    return costs[dataType as keyof typeof costs] || 0.01;
  }

  private groupRequestsForBatching<T>(requests: DataRequest<T>[]): Map<string, DataRequest<T>[]> {
    const groups = new Map<string, DataRequest<T>[]>();

    for (const request of requests) {
      if (!request.batchable) {
        // Non-batchable requests get unique keys
        const uniqueKey = `${request.dataType}:${Date.now()}:${Math.random()}`;
        groups.set(uniqueKey, [request]);
        continue;
      }

      // Group by data type and similar parameters
      const groupKey = `${request.dataType}:${JSON.stringify(request.params)}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(request);
    }

    return groups;
  }

  private async processBatchGroup<T>(requests: DataRequest<T>[]): Promise<Array<{ key: string; data: T | null }>> {
    // Convert to API requests
    const apiRequests = requests.map(req => ({
      endpoint: this.getEndpointForDataType(req.dataType),
      params: req.params,
      dataType: req.dataType,
      priority: req.priority || 'medium' as const,
      maxCost: req.maxCost || this.getDefaultMaxCost(req.dataType),
      cacheable: true,
      batchable: req.batchable || false,
      requiredBy: req.requiredBy || new Date(Date.now() + 300000)
    }));

    // Route through batch API
    const responses = await this.apiRouter.routeBatch<T>(apiRequests);

    // Map responses back to original requests
    return requests.map((request, index) => ({
      key: request.key,
      data: responses[index]?.data || null
    }));
  }

  private async warmGameData(gameId: string): Promise<void> {
    // Pre-fetch critical data for an upcoming game
    const warmupRequests: DataRequest[] = [
      {
        key: `game_${gameId}`,
        dataType: 'game',
        params: { gameId },
        priority: 'high',
        batchable: false
      },
      {
        key: `players_${gameId}`,
        dataType: 'player',
        params: { gameId },
        priority: 'high',
        batchable: true
      },
      {
        key: `market_${gameId}`,
        dataType: 'market',
        params: { gameId },
        priority: 'medium',
        batchable: true
      }
    ];

    await Promise.all(
      warmupRequests.map(request => this.getData(request))
    );
  }

  private calculateTopCostDrivers(): Array<{ dataType: string; cost: number; requests: number }> {
    // This would analyze actual usage data to identify cost drivers
    // For now, return mock data
    return [
      { dataType: 'prediction', cost: 45.20, requests: 2260 },
      { dataType: 'market', cost: 32.15, requests: 6430 },
      { dataType: 'player', cost: 28.90, requests: 2890 },
      { dataType: 'game', cost: 15.75, requests: 1575 }
    ];
  }

  private generateOptimizationRecommendations(cacheStats: any, costStats: any): string[] {
    const recommendations: string[] = [];

    if (cacheStats.hitRate < 0.9) {
      recommendations.push('Increase cache TTLs for frequently accessed data types');
    }

    if (costStats.hourlyCost > 0.2) {
      recommendations.push('Reduce API call frequency for non-critical data');
    }

    if (cacheStats.averageResponseTime > 100) {
      recommendations.push('Consider increasing Redis memory or optimizing query patterns');
    }

    if (cacheStats.evictionCount > 100) {
      recommendations.push('Increase memory cache size or adjust eviction policy');
    }

    return recommendations;
  }

  private async optimizeCacheTTLs(report: OptimizationReport): Promise<void> {
    // Analyze hit rates by data type and adjust TTLs accordingly
    this.logger.info('Optimizing cache TTLs based on usage patterns');
    
    // Implementation would adjust TTL configurations
    // based on actual usage patterns from the report
  }

  private async optimizeProviderConfiguration(report: OptimizationReport): Promise<void> {
    // Analyze provider performance and adjust routing preferences
    this.logger.info('Optimizing API provider configuration');
    
    // Implementation would adjust provider priorities and routing
    // based on cost effectiveness and performance metrics
  }

  private setupEventHandlers(): void {
    // Cache manager events
    this.cacheManager.on('cache_hit', (data) => {
      this.emit('cache_hit', data);
    });

    this.cacheManager.on('cache_miss', (data) => {
      this.emit('cache_miss', data);
    });

    this.cacheManager.on('performance_warning', (data) => {
      this.logger.warn('Cache performance warning', data);
      this.emit('performance_warning', data);
    });

    this.cacheManager.on('cost_warning', (data) => {
      this.logger.warn('Cost warning', data);
      this.emit('cost_warning', data);
    });

    // API router events
    this.apiRouter.on('request_completed', (data) => {
      this.emit('request_completed', data);
    });

    this.apiRouter.on('budget_exceeded', (data) => {
      this.logger.error('Budget exceeded', data);
      this.emit('budget_exceeded', data);
    });
  }

  private startBatchProcessor(): void {
    if (!this.config.optimization.enableBatchOptimization) {
      return;
    }

    // Process batch requests every 100ms
    this.batchTimer = setInterval(() => {
      this.processPendingBatches();
    }, 100);
  }

  private processPendingBatches(): void {
    // Implementation for processing queued batch requests
    // This would collect similar requests and batch them together
  }

  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      const metrics = this.getMetrics();
      this.emit('metrics_collected', metrics);
      
      // Check for alerts
      if (this.config.optimization.enableCostAlerts) {
        this.checkForAlerts(metrics);
      }
    }, this.config.monitoring.metricsInterval);
  }

  private checkForAlerts(metrics: any): void {
    const thresholds = this.config.monitoring.alertThresholds;

    if (metrics.cache.hitRate < thresholds.hitRate) {
      this.emit('alert', {
        type: 'hit_rate_low',
        value: metrics.cache.hitRate,
        threshold: thresholds.hitRate
      });
    }

    if (metrics.cache.averageResponseTime > thresholds.responseTime) {
      this.emit('alert', {
        type: 'response_time_high',
        value: metrics.cache.averageResponseTime,
        threshold: thresholds.responseTime
      });
    }

    if (metrics.cost.hourlyCost > thresholds.costPerHour) {
      this.emit('alert', {
        type: 'cost_rate_high',
        value: metrics.cost.hourlyCost,
        threshold: thresholds.costPerHour
      });
    }
  }

  private setupGameWarmup(): void {
    if (!this.config.optimization.enablePredictiveWarming) {
      return;
    }

    // Check for upcoming games every hour and warm cache
    setInterval(async () => {
      try {
        const upcomingGames = await this.getUpcomingGames();
        if (upcomingGames.length > 0) {
          await this.warmCacheForGames(upcomingGames);
        }
      } catch (error) {
        this.logger.error('Game warmup check failed', error);
      }
    }, 3600000); // Every hour
  }

  private async getUpcomingGames(): Promise<string[]> {
    // This would fetch upcoming games within the warmup window
    // For now, return empty array
    return [];
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    // Additional cleanup if needed
    this.removeAllListeners();
    
    this.logger.info('Cache integration service destroyed');
  }
}

export default CacheIntegrationService;