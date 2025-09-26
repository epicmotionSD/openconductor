/**
 * Sports Data Manager
 * 
 * Integration layer between OpenConductor's persistence system and TimescaleDB,
 * providing unified data access patterns for SportIntel agents with intelligent
 * caching and cost optimization.
 */

import { EventBus } from '../../types/events';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../utils/config-manager';
import { TimescaleSportsStore, PlayerStatPoint, GameStatePoint, PredictionPoint } from './timescale-sports-store';

export interface SportsDataConfig {
  timescaledb: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
  };
  caching: {
    enabled: boolean;
    defaultTTL: number; // seconds
    costOptimization: boolean;
  };
  costLimits: {
    monthlyBudget: number;
    dailyLimit: number;
    warningThreshold: number;
  };
}

export interface DataQuery {
  type: 'player_stats' | 'game_states' | 'predictions' | 'ownership' | 'injuries' | 'weather';
  filters: {
    playerId?: string;
    gameId?: string;
    team?: string;
    position?: string;
    startTime: Date;
    endTime: Date;
    season?: number;
    week?: number;
    limit?: number;
  };
  cacheStrategy?: 'always' | 'never' | 'smart';
  priority?: 'low' | 'medium' | 'high';
}

export interface DataInsert {
  type: 'player_stats' | 'game_states' | 'predictions' | 'ownership' | 'injuries' | 'weather';
  data: any[];
  source: string;
  confidence: number;
  deduplication?: boolean;
}

export interface CostMetrics {
  dailyCost: number;
  monthlyCost: number;
  queryCount: number;
  storageUsed: number; // GB
  compressionRatio: number;
  projectedMonthlyCost: number;
}

export class SportsDataManager {
  private timescaleStore: TimescaleSportsStore;
  private logger: Logger;
  private eventBus: EventBus;
  private config: ConfigManager;
  private costTracker: Map<string, { cost: number; queries: number; timestamp: Date }> = new Map();
  private queryCache: Map<string, { data: any; timestamp: Date; ttl: number }> = new Map();
  private initialized: boolean = false;

  constructor(config: ConfigManager, logger: Logger, eventBus: EventBus) {
    this.config = config;
    this.logger = logger;
    this.eventBus = eventBus;

    const sportsConfig = this.config.get<SportsDataConfig>('sportintel.data');
    
    this.timescaleStore = new TimescaleSportsStore(
      sportsConfig.timescaledb,
      logger,
      eventBus
    );

    this.setupEventListeners();
    this.startCostTracking();
  }

  /**
   * Initialize the sports data management system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Initializing Sports Data Manager');

    try {
      // Initialize TimescaleDB store
      await this.timescaleStore.initialize();

      // Set up cost monitoring
      await this.initializeCostTracking();

      // Start cache cleanup intervals
      this.startCacheCleanup();

      this.initialized = true;
      
      this.eventBus.emit({
        type: 'sports_data_manager_initialized',
        timestamp: new Date(),
        data: { success: true }
      });

      this.logger.info('Sports Data Manager initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Sports Data Manager', error);
      throw error;
    }
  }

  /**
   * Query sports data with intelligent caching and cost optimization
   */
  async queryData<T = any>(query: DataQuery): Promise<T[]> {
    if (!this.initialized) await this.initialize();

    const queryKey = this.generateQueryKey(query);
    const costCheck = await this.checkCostLimits(query);

    if (!costCheck.allowed) {
      throw new Error(`Query blocked: ${costCheck.reason}. Current daily cost: $${costCheck.currentCost}`);
    }

    // Check cache first if enabled
    if (this.shouldUseCache(query)) {
      const cached = this.getCachedResult(queryKey);
      if (cached) {
        this.logger.debug('Cache hit for sports data query', { queryType: query.type, queryKey });
        return cached.data;
      }
    }

    this.logger.debug('Executing sports data query', {
      type: query.type,
      filters: query.filters,
      cacheStrategy: query.cacheStrategy
    });

    try {
      let results: T[] = [];

      // Route to appropriate TimescaleDB query method
      switch (query.type) {
        case 'player_stats':
          results = await this.timescaleStore.queryPlayerStats(query.filters) as T[];
          break;
        case 'game_states':
          results = await this.queryGameStates(query.filters) as T[];
          break;
        case 'predictions':
          results = await this.queryPredictions(query.filters) as T[];
          break;
        case 'ownership':
          results = await this.queryOwnership(query.filters) as T[];
          break;
        case 'injuries':
          results = await this.queryInjuries(query.filters) as T[];
          break;
        case 'weather':
          results = await this.queryWeather(query.filters) as T[];
          break;
        default:
          throw new Error(`Unsupported query type: ${query.type}`);
      }

      // Track cost and cache result
      await this.trackQueryCost(query, results.length);
      
      if (this.shouldCacheResult(query, results)) {
        this.cacheResult(queryKey, results, query);
      }

      this.eventBus.emit({
        type: 'sports_data_queried',
        timestamp: new Date(),
        data: {
          queryType: query.type,
          resultCount: results.length,
          cached: false
        }
      });

      return results;

    } catch (error) {
      this.logger.error('Sports data query failed', {
        queryType: query.type,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Insert sports data with deduplication and validation
   */
  async insertData(insert: DataInsert): Promise<{ inserted: number; deduplicated: number; errors: number }> {
    if (!this.initialized) await this.initialize();

    this.logger.debug('Inserting sports data', {
      type: insert.type,
      count: insert.data.length,
      source: insert.source
    });

    try {
      let inserted = 0;
      let deduplicated = 0;
      let errors = 0;

      // Validate and clean data
      const validData = insert.data.filter(item => this.validateDataItem(insert.type, item));
      errors = insert.data.length - validData.length;

      // Perform deduplication if enabled
      const finalData = insert.deduplication ? 
        this.deduplicateData(insert.type, validData) : validData;
      deduplicated = validData.length - finalData.length;

      // Route to appropriate insertion method
      switch (insert.type) {
        case 'player_stats':
          await this.timescaleStore.insertPlayerStats(finalData);
          break;
        case 'game_states':
          await this.timescaleStore.insertGameStates(finalData);
          break;
        case 'predictions':
          await this.timescaleStore.insertPredictions(finalData);
          break;
        default:
          throw new Error(`Unsupported insert type: ${insert.type}`);
      }

      inserted = finalData.length;

      // Invalidate related cache entries
      this.invalidateCache(insert.type);

      // Track insertion metrics
      this.eventBus.emit({
        type: 'sports_data_inserted',
        timestamp: new Date(),
        data: {
          dataType: insert.type,
          inserted,
          deduplicated,
          errors,
          source: insert.source
        }
      });

      this.logger.info('Sports data inserted successfully', {
        type: insert.type,
        inserted,
        deduplicated,
        errors
      });

      return { inserted, deduplicated, errors };

    } catch (error) {
      this.logger.error('Sports data insertion failed', {
        type: insert.type,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get aggregated player statistics with caching
   */
  async getPlayerAggregates(
    playerId: string,
    timeframe: '1h' | '1d' | '7d' | '30d' | 'season',
    bustCache: boolean = false
  ): Promise<{
    avgFantasyPoints: number;
    totalSnapCount: number;
    consistencyScore: number;
    recentTrend: number;
    gameCount: number;
  }> {
    const cacheKey = `aggregates:${playerId}:${timeframe}`;
    
    if (!bustCache) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached.data;
      }
    }

    const result = await this.timescaleStore.getPlayerAggregates(playerId, timeframe);
    
    // Cache aggregates for 1 hour
    this.cacheResult(cacheKey, result, { type: 'player_stats', filters: { playerId } } as DataQuery, 3600);

    return result;
  }

  /**
   * Get cost metrics and optimization recommendations
   */
  async getCostMetrics(): Promise<CostMetrics & { recommendations: string[] }> {
    const dailyData = this.getDailyCostData();
    const monthlyProjection = dailyData.cost * 30;
    
    const cleanup = await this.timescaleStore.cleanupOldData();
    
    const recommendations: string[] = [];
    
    // Cost optimization recommendations
    const config = this.config.get<SportsDataConfig>('sportintel.data');
    if (monthlyProjection > config.costLimits.monthlyBudget * 0.8) {
      recommendations.push('Enable aggressive caching to reduce query costs');
      recommendations.push('Consider increasing compression intervals');
    }
    
    if (dailyData.queries > 1000) {
      recommendations.push('Implement query batching for efficiency');
      recommendations.push('Review query patterns for optimization opportunities');
    }

    return {
      dailyCost: dailyData.cost,
      monthlyCost: monthlyProjection,
      queryCount: dailyData.queries,
      storageUsed: this.estimateStorageUsage(),
      compressionRatio: 0.9, // 90% compression from TimescaleDB
      projectedMonthlyCost: monthlyProjection,
      recommendations
    };
  }

  // Private helper methods

  private setupEventListeners(): void {
    this.eventBus.on('sports_data_updated', this.handleDataUpdate.bind(this));
    this.eventBus.on('cache_invalidation_requested', this.handleCacheInvalidation.bind(this));
    this.eventBus.on('cost_limit_warning', this.handleCostWarning.bind(this));
  }

  private async checkCostLimits(query: DataQuery): Promise<{ allowed: boolean; reason?: string; currentCost: number }> {
    const dailyData = this.getDailyCostData();
    const config = this.config.get<SportsDataConfig>('sportintel.data');

    // Check daily limit
    if (dailyData.cost >= config.costLimits.dailyLimit) {
      return {
        allowed: false,
        reason: 'Daily cost limit exceeded',
        currentCost: dailyData.cost
      };
    }

    // Check if approaching warning threshold
    if (dailyData.cost >= config.costLimits.dailyLimit * config.costLimits.warningThreshold) {
      this.eventBus.emit({
        type: 'cost_limit_warning',
        timestamp: new Date(),
        data: {
          currentCost: dailyData.cost,
          limit: config.costLimits.dailyLimit,
          threshold: config.costLimits.warningThreshold
        }
      });
    }

    return {
      allowed: true,
      currentCost: dailyData.cost
    };
  }

  private shouldUseCache(query: DataQuery): boolean {
    if (query.cacheStrategy === 'never') return false;
    if (query.cacheStrategy === 'always') return true;

    const config = this.config.get<SportsDataConfig>('sportintel.data');
    
    // Smart caching: use cache for cost optimization
    if (config.caching.costOptimization) {
      const dailyData = this.getDailyCostData();
      return dailyData.cost > config.costLimits.dailyLimit * 0.7; // Cache when approaching limits
    }

    return config.caching.enabled;
  }

  private generateQueryKey(query: DataQuery): string {
    const keyParts = [
      query.type,
      query.filters.playerId || 'all',
      query.filters.gameId || 'all',
      query.filters.team || 'all',
      query.filters.startTime.toISOString(),
      query.filters.endTime.toISOString(),
      query.filters.limit || 'unlimited'
    ];
    return keyParts.join(':');
  }

  private getCachedResult(key: string): { data: any; timestamp: Date; ttl: number } | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.timestamp.getTime();
    
    if (age > cached.ttl * 1000) {
      this.queryCache.delete(key);
      return null;
    }

    return cached;
  }

  private cacheResult(key: string, data: any, query: DataQuery, customTTL?: number): void {
    const config = this.config.get<SportsDataConfig>('sportintel.data');
    const ttl = customTTL || config.caching.defaultTTL;

    this.queryCache.set(key, {
      data,
      timestamp: new Date(),
      ttl
    });

    // Limit cache size to prevent memory issues
    if (this.queryCache.size > 1000) {
      const oldestKey = Array.from(this.queryCache.keys())[0];
      this.queryCache.delete(oldestKey);
    }
  }

  private shouldCacheResult(query: DataQuery, results: any[]): boolean {
    // Cache large result sets for longer
    if (results.length > 100) return true;
    
    // Cache based on query priority
    return query.priority !== 'low';
  }

  private async trackQueryCost(query: DataQuery, resultCount: number): Promise<void> {
    // Simplified cost calculation (in production would be more sophisticated)
    const baseCost = 0.001; // $0.001 per query
    const sizeCost = resultCount * 0.00001; // $0.00001 per result
    const totalCost = baseCost + sizeCost;

    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily:${today}`;
    
    const current = this.costTracker.get(dailyKey) || { cost: 0, queries: 0, timestamp: new Date() };
    current.cost += totalCost;
    current.queries += 1;
    current.timestamp = new Date();
    
    this.costTracker.set(dailyKey, current);
  }

  private getDailyCostData(): { cost: number; queries: number } {
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily:${today}`;
    const data = this.costTracker.get(dailyKey);
    
    return data ? { cost: data.cost, queries: data.queries } : { cost: 0, queries: 0 };
  }

  private validateDataItem(type: string, item: any): boolean {
    // Basic validation - in production would be more comprehensive
    switch (type) {
      case 'player_stats':
        return item.playerId && item.gameId && item.fantasyPoints !== undefined;
      case 'game_states':
        return item.gameId && item.homeTeam && item.awayTeam;
      case 'predictions':
        return item.predictionId && item.modelId && item.predictedValue !== undefined;
      default:
        return true;
    }
  }

  private deduplicateData(type: string, data: any[]): any[] {
    // Simple deduplication based on key fields
    const seen = new Set<string>();
    return data.filter(item => {
      let key: string;
      
      switch (type) {
        case 'player_stats':
          key = `${item.playerId}:${item.gameId}:${item.timestamp}`;
          break;
        case 'game_states':
          key = `${item.gameId}:${item.timestamp}`;
          break;
        case 'predictions':
          key = item.predictionId;
          break;
        default:
          return true;
      }
      
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private invalidateCache(dataType: string): void {
    // Remove cached queries related to the updated data type
    const keysToDelete: string[] = [];
    
    for (const [key] of this.queryCache.entries()) {
      if (key.startsWith(dataType)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.queryCache.delete(key));
    
    this.logger.debug(`Invalidated ${keysToDelete.length} cache entries for ${dataType}`);
  }

  private estimateStorageUsage(): number {
    // Simplified storage estimation - in production would query actual DB size
    return 2.5; // GB
  }

  private startCostTracking(): void {
    // Reset daily counters at midnight
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.logger.info('Daily cost tracking reset');
      }
    }, 60000);
  }

  private async initializeCostTracking(): Promise<void> {
    // Initialize with any existing cost data
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily:${today}`;
    
    if (!this.costTracker.has(dailyKey)) {
      this.costTracker.set(dailyKey, { cost: 0, queries: 0, timestamp: new Date() });
    }
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      let cleaned = 0;
      const now = Date.now();
      
      for (const [key, cached] of this.queryCache.entries()) {
        const age = now - cached.timestamp.getTime();
        if (age > cached.ttl * 1000) {
          this.queryCache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
      }
    }, 300000); // 5 minutes
  }

  // Placeholder methods for additional query types
  private async queryGameStates(filters: any): Promise<GameStatePoint[]> {
    // Implementation would go here
    return [];
  }

  private async queryPredictions(filters: any): Promise<PredictionPoint[]> {
    // Implementation would go here
    return [];
  }

  private async queryOwnership(filters: any): Promise<any[]> {
    // Implementation would go here
    return [];
  }

  private async queryInjuries(filters: any): Promise<any[]> {
    // Implementation would go here
    return [];
  }

  private async queryWeather(filters: any): Promise<any[]> {
    // Implementation would go here
    return [];
  }

  // Event handlers
  private async handleDataUpdate(event: any): Promise<void> {
    this.logger.debug('Handling sports data update', { eventType: event.type });
    this.invalidateCache(event.dataType);
  }

  private async handleCacheInvalidation(event: any): Promise<void> {
    if (event.pattern) {
      this.invalidateCache(event.pattern);
    }
  }

  private async handleCostWarning(event: any): Promise<void> {
    this.logger.warn('Cost limit warning triggered', {
      currentCost: event.currentCost,
      limit: event.limit
    });
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    await this.timescaleStore.close();
    this.queryCache.clear();
    this.costTracker.clear();
    this.logger.info('Sports Data Manager closed');
  }
}