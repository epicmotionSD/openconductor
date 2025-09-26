/**
 * Intelligent Cache Manager for SportIntel
 * 
 * Cost-optimized caching system targeting $150/month data budget through:
 * - Multi-layer cache architecture (L1: Memory, L2: Redis, L3: Database)
 * - Intelligent cache invalidation based on data freshness requirements
 * - Cost-aware API provider routing
 * - Predictive cache warming for upcoming games
 */

import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../utils/config-manager';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    maxMemoryPolicy: string;
    maxMemory: string;
  };
  ttl: {
    playerData: number;        // 5 minutes
    gameData: number;          // 2 minutes  
    marketData: number;        // 30 seconds
    predictions: number;       // 15 minutes
    historicalData: number;    // 24 hours
    staticData: number;        // 7 days
  };
  costLimits: {
    monthlyBudget: number;     // $150
    dailyBudget: number;       // $5
    hourlyBudget: number;      // $0.21
    warningThreshold: number;  // 80%
  };
  performance: {
    targetHitRate: number;     // 95%
    maxResponseTime: number;   // 50ms
    warmupThreshold: number;   // 2 hours before games
  };
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  costSavings: number;
  apiCallsAvoided: number;
  averageResponseTime: number;
  cacheSize: number;
  evictionCount: number;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  cost: number; // API cost saved by caching
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export class IntelligentCacheManager extends EventEmitter {
  private redis: Redis;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private logger: Logger;
  private stats: CacheStats;
  private costTracker: CostTracker;
  private invalidationScheduler: InvalidationScheduler;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    this.logger = Logger.getInstance();
    this.redis = new Redis(config.redis);
    this.stats = this.initializeStats();
    this.costTracker = new CostTracker(config.costLimits);
    this.invalidationScheduler = new InvalidationScheduler();

    this.setupRedisListeners();
    this.startPerformanceMonitoring();
    this.startCostMonitoring();
  }

  /**
   * Get cached data with intelligent fallback strategy
   */
  async get<T>(key: string, options?: {
    fallback?: () => Promise<T>;
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  }): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // L1: Memory cache (fastest)
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult !== null) {
        this.recordHit('memory', Date.now() - startTime);
        return memoryResult;
      }

      // L2: Redis cache (fast)
      const redisResult = await this.getFromRedis<T>(key);
      if (redisResult !== null) {
        // Promote to memory cache if frequently accessed
        await this.promoteToMemoryIfNeeded(key, redisResult);
        this.recordHit('redis', Date.now() - startTime);
        return redisResult;
      }

      // L3: Fallback to data source (slowest, costs money)
      if (options?.fallback) {
        // Check cost constraints before expensive API call
        const canMakeApiCall = await this.costTracker.canMakeApiCall(key);
        if (!canMakeApiCall) {
          this.logger.warn(`Cost limit reached, cannot make API call for key: ${key}`);
          this.recordMiss('cost_limited', Date.now() - startTime);
          return null;
        }

        const fallbackResult = await options.fallback();
        if (fallbackResult !== null) {
          // Cache the result with intelligent TTL
          const ttl = options.ttl || this.calculateIntelligentTTL(key, options.priority);
          await this.set(key, fallbackResult, {
            ttl,
            priority: options.priority || 'medium',
            tags: options.tags || []
          });
          
          // Track API cost
          await this.costTracker.recordApiCall(key, this.estimateApiCost(key));
        }
        
        this.recordMiss('fallback', Date.now() - startTime);
        return fallbackResult;
      }

      this.recordMiss('not_found', Date.now() - startTime);
      return null;

    } catch (error) {
      this.logger.error('Cache get error', { key, error });
      this.recordMiss('error', Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set cached data with intelligent storage strategy
   */
  async set<T>(key: string, value: T, options?: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  }): Promise<boolean> {
    try {
      const ttl = options?.ttl || this.calculateIntelligentTTL(key, options?.priority);
      const priority = options?.priority || 'medium';
      const tags = options?.tags || [];

      const entry: CacheEntry<T> = {
        key,
        value,
        ttl,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
        cost: this.estimateApiCost(key),
        priority,
        tags
      };

      // Store in both memory and Redis based on priority and size
      const shouldStoreInMemory = this.shouldStoreInMemory(entry);
      const shouldStoreInRedis = this.shouldStoreInRedis(entry);

      if (shouldStoreInMemory) {
        this.setInMemory(key, entry);
      }

      if (shouldStoreInRedis) {
        await this.setInRedis(key, entry, ttl);
      }

      // Schedule invalidation if needed
      this.invalidationScheduler.schedule(key, ttl, tags);

      this.emit('cache_set', { key, priority, ttl });
      return true;

    } catch (error) {
      this.logger.error('Cache set error', { key, error });
      return false;
    }
  }

  /**
   * Batch get for multiple keys with parallel processing
   */
  async mget<T>(keys: string[], options?: {
    fallback?: (missedKeys: string[]) => Promise<Record<string, T>>;
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};
    const missedKeys: string[] = [];

    // Parallel cache lookups
    const cachePromises = keys.map(async key => {
      const cached = await this.get<T>(key);
      return { key, value: cached };
    });

    const cacheResults = await Promise.all(cachePromises);
    
    cacheResults.forEach(({ key, value }) => {
      if (value !== null) {
        results[key] = value;
      } else {
        missedKeys.push(key);
      }
    });

    // Fallback for missed keys
    if (missedKeys.length > 0 && options?.fallback) {
      const canMakeBatchCall = await this.costTracker.canMakeBatchApiCall(missedKeys);
      if (canMakeBatchCall) {
        const fallbackResults = await options.fallback(missedKeys);
        
        // Cache the fallback results
        const setPromises = Object.entries(fallbackResults).map(([key, value]) =>
          this.set(key, value, {
            ttl: options.ttl,
            priority: options.priority
          })
        );
        
        await Promise.all(setPromises);
        Object.assign(results, fallbackResults);

        // Track batch API cost
        await this.costTracker.recordBatchApiCall(missedKeys, this.estimateBatchApiCost(missedKeys));
      }
    }

    return results;
  }

  /**
   * Invalidate cache entries by key or tags
   */
  async invalidate(pattern: string | string[] | { tags: string[] }): Promise<number> {
    let deletedCount = 0;

    try {
      if (typeof pattern === 'string') {
        // Single key invalidation
        deletedCount += await this.deleteKey(pattern);
      } else if (Array.isArray(pattern)) {
        // Multiple keys invalidation
        const deletePromises = pattern.map(key => this.deleteKey(key));
        const results = await Promise.all(deletePromises);
        deletedCount = results.reduce((sum, count) => sum + count, 0);
      } else if (pattern.tags) {
        // Tag-based invalidation
        deletedCount += await this.deleteByTags(pattern.tags);
      }

      this.emit('cache_invalidated', { pattern, deletedCount });
      return deletedCount;

    } catch (error) {
      this.logger.error('Cache invalidation error', { pattern, error });
      return 0;
    }
  }

  /**
   * Warm cache for upcoming games (predictive caching)
   */
  async warmCache(gameIds: string[]): Promise<void> {
    this.logger.info(`Starting cache warm-up for ${gameIds.length} games`);

    const warmUpTasks = gameIds.map(async gameId => {
      try {
        // Pre-load critical game data
        await this.preloadGameData(gameId);
        await this.preloadPlayerData(gameId);
        await this.preloadMarketData(gameId);
        
        this.logger.debug(`Cache warmed for game: ${gameId}`);
      } catch (error) {
        this.logger.error(`Cache warm-up failed for game: ${gameId}`, error);
      }
    });

    await Promise.all(warmUpTasks);
    this.logger.info('Cache warm-up completed');
    this.emit('cache_warmed', { gameIds });
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      hitRate: this.stats.totalRequests > 0 ? this.stats.totalHits / this.stats.totalRequests : 0,
      missRate: this.stats.totalRequests > 0 ? this.stats.totalMisses / this.stats.totalRequests : 0,
      cacheSize: this.memoryCache.size,
    };
  }

  /**
   * Get cost tracking information
   */
  getCostStats() {
    return this.costTracker.getStats();
  }

  /**
   * Optimize cache performance by removing least valuable entries
   */
  async optimize(): Promise<void> {
    this.logger.info('Starting cache optimization');

    // Memory cache optimization
    await this.optimizeMemoryCache();
    
    // Redis cache optimization
    await this.optimizeRedisCache();

    // Update performance metrics
    await this.updatePerformanceMetrics();

    this.emit('cache_optimized');
    this.logger.info('Cache optimization completed');
  }

  // Private helper methods
  private initializeStats(): CacheStats {
    return {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      costSavings: 0,
      apiCallsAvoided: 0,
      averageResponseTime: 0,
      cacheSize: 0,
      evictionCount: 0
    };
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }

    // Update access information
    entry.lastAccessed = new Date();
    entry.accessCount++;

    return entry.value as T;
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const entry = JSON.parse(data) as CacheEntry<T>;
      
      // Update access count in Redis (async, don't wait)
      this.redis.hincrby(`${key}:meta`, 'accessCount', 1).catch(err => 
        this.logger.warn('Failed to update Redis access count', { key, error: err })
      );

      return entry.value;
    } catch (error) {
      this.logger.error('Redis get error', { key, error });
      return null;
    }
  }

  private setInMemory<T>(key: string, entry: CacheEntry<T>): void {
    // Implement LRU eviction if memory cache is full
    if (this.memoryCache.size >= 10000) { // Max 10k entries in memory
      this.evictLRUFromMemory();
    }

    this.memoryCache.set(key, entry);
  }

  private async setInRedis<T>(key: string, entry: CacheEntry<T>, ttl: number): Promise<void> {
    try {
      const data = JSON.stringify(entry);
      await this.redis.setex(key, ttl, data);
      
      // Store metadata for analytics
      await this.redis.hmset(`${key}:meta`, {
        createdAt: entry.createdAt.toISOString(),
        priority: entry.priority,
        tags: JSON.stringify(entry.tags)
      });
      await this.redis.expire(`${key}:meta`, ttl);
    } catch (error) {
      this.logger.error('Redis set error', { key, error });
    }
  }

  private calculateIntelligentTTL(key: string, priority?: string): number {
    // Base TTL on data type and priority
    let baseTTL = this.config.ttl.playerData; // Default

    if (key.includes('game:')) baseTTL = this.config.ttl.gameData;
    else if (key.includes('market:')) baseTTL = this.config.ttl.marketData;
    else if (key.includes('prediction:')) baseTTL = this.config.ttl.predictions;
    else if (key.includes('historical:')) baseTTL = this.config.ttl.historicalData;
    else if (key.includes('static:')) baseTTL = this.config.ttl.staticData;

    // Adjust based on priority
    switch (priority) {
      case 'critical': return Math.max(baseTTL * 0.5, 30); // Shorter TTL for critical data
      case 'high': return baseTTL;
      case 'medium': return baseTTL * 1.5;
      case 'low': return baseTTL * 3;
      default: return baseTTL;
    }
  }

  private shouldStoreInMemory<T>(entry: CacheEntry<T>): boolean {
    // Store in memory if high priority or frequently accessed
    return entry.priority === 'critical' || 
           entry.priority === 'high' ||
           this.isFrequentlyAccessed(entry.key);
  }

  private shouldStoreInRedis<T>(entry: CacheEntry<T>): boolean {
    // Always store in Redis unless entry is too large
    const entrySize = JSON.stringify(entry).length;
    return entrySize < 1024 * 1024; // Max 1MB per entry
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const expiryTime = entry.createdAt.getTime() + (entry.ttl * 1000);
    return now > expiryTime;
  }

  private isFrequentlyAccessed(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    const accessRate = entry.accessCount / ((Date.now() - entry.createdAt.getTime()) / 3600000); // accesses per hour
    return accessRate > 10; // More than 10 accesses per hour
  }

  private estimateApiCost(key: string): number {
    // Cost estimates based on API provider and data type
    if (key.includes('api-sports:')) return 0.01;
    if (key.includes('mysports:')) return 0.005;
    if (key.includes('prediction:')) return 0.02;
    return 0.001; // Default minimal cost
  }

  private estimateBatchApiCost(keys: string[]): number {
    return keys.reduce((total, key) => total + this.estimateApiCost(key), 0);
  }

  private recordHit(source: string, responseTime: number): void {
    this.stats.totalRequests++;
    this.stats.totalHits++;
    this.updateAverageResponseTime(responseTime);
    this.emit('cache_hit', { source, responseTime });
  }

  private recordMiss(reason: string, responseTime: number): void {
    this.stats.totalRequests++;
    this.stats.totalMisses++;
    this.updateAverageResponseTime(responseTime);
    this.emit('cache_miss', { reason, responseTime });
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
    this.stats.averageResponseTime = (totalTime + responseTime) / this.stats.totalRequests;
  }

  private evictLRUFromMemory(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.stats.evictionCount++;
    }
  }

  private async deleteKey(key: string): Promise<number> {
    let deleted = 0;
    
    if (this.memoryCache.delete(key)) {
      deleted++;
    }

    const redisDeleted = await this.redis.del(key);
    deleted += redisDeleted;

    // Also delete metadata
    await this.redis.del(`${key}:meta`);

    return deleted;
  }

  private async deleteByTags(tags: string[]): Promise<number> {
    // This would require a more sophisticated tag tracking system
    // For now, we'll implement a basic pattern matching approach
    let deleted = 0;
    
    const pattern = tags.join('*');
    const keys = await this.redis.keys(`*${pattern}*`);
    
    for (const key of keys) {
      deleted += await this.deleteKey(key);
    }
    
    return deleted;
  }

  private async preloadGameData(gameId: string): Promise<void> {
    // Implementation would fetch and cache game-specific data
    this.logger.debug(`Preloading game data for: ${gameId}`);
  }

  private async preloadPlayerData(gameId: string): Promise<void> {
    // Implementation would fetch and cache player data for game
    this.logger.debug(`Preloading player data for: ${gameId}`);
  }

  private async preloadMarketData(gameId: string): Promise<void> {
    // Implementation would fetch and cache market data for game
    this.logger.debug(`Preloading market data for: ${gameId}`);
  }

  private async optimizeMemoryCache(): Promise<void> {
    // Remove expired entries and low-priority items if memory is full
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry) || (entry.priority === 'low' && this.memoryCache.size > 8000)) {
        this.memoryCache.delete(key);
      }
    }
  }

  private async optimizeRedisCache(): Promise<void> {
    // Redis optimization would involve analyzing usage patterns
    // and adjusting memory policies
    const info = await this.redis.info('memory');
    this.logger.debug('Redis memory info', { info });
  }

  private async updatePerformanceMetrics(): Promise<void> {
    // Update internal performance tracking
    const hitRate = this.getStats().hitRate;
    if (hitRate < this.config.performance.targetHitRate) {
      this.logger.warn(`Cache hit rate below target: ${hitRate * 100}%`);
      this.emit('performance_warning', { metric: 'hit_rate', value: hitRate });
    }
  }

  private setupRedisListeners(): void {
    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
      this.emit('redis_error', error);
    });

    this.redis.on('connect', () => {
      this.logger.info('Redis connected successfully');
      this.emit('redis_connected');
    });
  }

  private startPerformanceMonitoring(): void {
    // Monitor cache performance every minute
    setInterval(() => {
      const stats = this.getStats();
      this.emit('performance_stats', stats);
      
      if (stats.hitRate < this.config.performance.targetHitRate) {
        this.logger.warn('Cache hit rate below target', { hitRate: stats.hitRate });
      }
    }, 60000);
  }

  private startCostMonitoring(): void {
    // Monitor costs every hour
    setInterval(async () => {
      const costStats = this.getCostStats();
      this.emit('cost_stats', costStats);
      
      if (costStats.isNearBudgetLimit) {
        this.logger.warn('Approaching cost budget limit', costStats);
        this.emit('cost_warning', costStats);
      }
    }, 3600000);
  }

  private async promoteToMemoryIfNeeded<T>(key: string, value: T): Promise<void> {
    // Promote frequently accessed Redis entries to memory cache
    if (this.isFrequentlyAccessed(key)) {
      const entry: CacheEntry<T> = {
        key,
        value,
        ttl: 300, // 5 minutes default
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
        cost: this.estimateApiCost(key),
        priority: 'medium',
        tags: []
      };
      
      this.setInMemory(key, entry);
    }
  }
}

/**
 * Cost tracking helper class
 */
class CostTracker {
  private costs: Map<string, number> = new Map();
  private dailyCost: number = 0;
  private hourlyCost: number = 0;
  private lastResetHour: number = new Date().getHours();
  private lastResetDay: number = new Date().getDate();
  
  constructor(private limits: CacheConfig['costLimits']) {}

  async canMakeApiCall(key: string): Promise<boolean> {
    this.resetCostsIfNeeded();
    const estimatedCost = this.estimateCallCost(key);
    return (this.hourlyCost + estimatedCost) <= this.limits.hourlyBudget;
  }

  async canMakeBatchApiCall(keys: string[]): Promise<boolean> {
    this.resetCostsIfNeeded();
    const estimatedCost = keys.reduce((total, key) => total + this.estimateCallCost(key), 0);
    return (this.hourlyCost + estimatedCost) <= this.limits.hourlyBudget;
  }

  async recordApiCall(key: string, cost: number): Promise<void> {
    this.costs.set(key, (this.costs.get(key) || 0) + cost);
    this.dailyCost += cost;
    this.hourlyCost += cost;
  }

  async recordBatchApiCall(keys: string[], cost: number): Promise<void> {
    const costPerKey = cost / keys.length;
    for (const key of keys) {
      this.costs.set(key, (this.costs.get(key) || 0) + costPerKey);
    }
    this.dailyCost += cost;
    this.hourlyCost += cost;
  }

  getStats() {
    this.resetCostsIfNeeded();
    return {
      dailyCost: this.dailyCost,
      hourlyCost: this.hourlyCost,
      dailyBudgetUsed: (this.dailyCost / this.limits.dailyBudget) * 100,
      hourlyBudgetUsed: (this.hourlyCost / this.limits.hourlyBudget) * 100,
      isNearBudgetLimit: this.dailyCost > (this.limits.dailyBudget * this.limits.warningThreshold / 100),
      remainingDailyBudget: Math.max(0, this.limits.dailyBudget - this.dailyCost),
      remainingHourlyBudget: Math.max(0, this.limits.hourlyBudget - this.hourlyCost)
    };
  }

  private estimateCallCost(key: string): number {
    if (key.includes('api-sports:')) return 0.01;
    if (key.includes('mysports:')) return 0.005;
    if (key.includes('prediction:')) return 0.02;
    return 0.001;
  }

  private resetCostsIfNeeded(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();

    if (currentHour !== this.lastResetHour) {
      this.hourlyCost = 0;
      this.lastResetHour = currentHour;
    }

    if (currentDay !== this.lastResetDay) {
      this.dailyCost = 0;
      this.costs.clear();
      this.lastResetDay = currentDay;
    }
  }
}

/**
 * Cache invalidation scheduler
 */
class InvalidationScheduler {
  private scheduledInvalidations: Map<string, NodeJS.Timeout> = new Map();

  schedule(key: string, ttl: number, tags: string[]): void {
    // Clear existing timeout for this key
    const existingTimeout = this.scheduledInvalidations.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new invalidation
    const timeout = setTimeout(() => {
      this.invalidateKey(key, tags);
      this.scheduledInvalidations.delete(key);
    }, ttl * 1000);

    this.scheduledInvalidations.set(key, timeout);
  }

  private invalidateKey(key: string, tags: string[]): void {
    // This would trigger cache invalidation
    // Implementation would depend on the specific cache instance
  }
}

export default IntelligentCacheManager;