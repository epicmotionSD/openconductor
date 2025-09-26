"use strict";
/**
 * Intelligent Cache Manager for SportIntel
 *
 * Cost-optimized caching system targeting $150/month data budget through:
 * - Multi-layer cache architecture (L1: Memory, L2: Redis, L3: Database)
 * - Intelligent cache invalidation based on data freshness requirements
 * - Cost-aware API provider routing
 * - Predictive cache warming for upcoming games
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentCacheManager = void 0;
const ioredis_1 = require("ioredis");
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
class IntelligentCacheManager extends events_1.EventEmitter {
    redis;
    memoryCache = new Map();
    config;
    logger;
    stats;
    costTracker;
    invalidationScheduler;
    constructor(config) {
        super();
        this.config = config;
        this.logger = logger_1.Logger.getInstance();
        this.redis = new ioredis_1.Redis(config.redis);
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
    async get(key, options) {
        const startTime = Date.now();
        try {
            // L1: Memory cache (fastest)
            const memoryResult = this.getFromMemory(key);
            if (memoryResult !== null) {
                this.recordHit('memory', Date.now() - startTime);
                return memoryResult;
            }
            // L2: Redis cache (fast)
            const redisResult = await this.getFromRedis(key);
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
        }
        catch (error) {
            this.logger.error('Cache get error', { key, error });
            this.recordMiss('error', Date.now() - startTime);
            return null;
        }
    }
    /**
     * Set cached data with intelligent storage strategy
     */
    async set(key, value, options) {
        try {
            const ttl = options?.ttl || this.calculateIntelligentTTL(key, options?.priority);
            const priority = options?.priority || 'medium';
            const tags = options?.tags || [];
            const entry = {
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
        }
        catch (error) {
            this.logger.error('Cache set error', { key, error });
            return false;
        }
    }
    /**
     * Batch get for multiple keys with parallel processing
     */
    async mget(keys, options) {
        const results = {};
        const missedKeys = [];
        // Parallel cache lookups
        const cachePromises = keys.map(async (key) => {
            const cached = await this.get(key);
            return { key, value: cached };
        });
        const cacheResults = await Promise.all(cachePromises);
        cacheResults.forEach(({ key, value }) => {
            if (value !== null) {
                results[key] = value;
            }
            else {
                missedKeys.push(key);
            }
        });
        // Fallback for missed keys
        if (missedKeys.length > 0 && options?.fallback) {
            const canMakeBatchCall = await this.costTracker.canMakeBatchApiCall(missedKeys);
            if (canMakeBatchCall) {
                const fallbackResults = await options.fallback(missedKeys);
                // Cache the fallback results
                const setPromises = Object.entries(fallbackResults).map(([key, value]) => this.set(key, value, {
                    ttl: options.ttl,
                    priority: options.priority
                }));
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
    async invalidate(pattern) {
        let deletedCount = 0;
        try {
            if (typeof pattern === 'string') {
                // Single key invalidation
                deletedCount += await this.deleteKey(pattern);
            }
            else if (Array.isArray(pattern)) {
                // Multiple keys invalidation
                const deletePromises = pattern.map(key => this.deleteKey(key));
                const results = await Promise.all(deletePromises);
                deletedCount = results.reduce((sum, count) => sum + count, 0);
            }
            else if (pattern.tags) {
                // Tag-based invalidation
                deletedCount += await this.deleteByTags(pattern.tags);
            }
            this.emit('cache_invalidated', { pattern, deletedCount });
            return deletedCount;
        }
        catch (error) {
            this.logger.error('Cache invalidation error', { pattern, error });
            return 0;
        }
    }
    /**
     * Warm cache for upcoming games (predictive caching)
     */
    async warmCache(gameIds) {
        this.logger.info(`Starting cache warm-up for ${gameIds.length} games`);
        const warmUpTasks = gameIds.map(async (gameId) => {
            try {
                // Pre-load critical game data
                await this.preloadGameData(gameId);
                await this.preloadPlayerData(gameId);
                await this.preloadMarketData(gameId);
                this.logger.debug(`Cache warmed for game: ${gameId}`);
            }
            catch (error) {
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
    getStats() {
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
    async optimize() {
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
    initializeStats() {
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
    getFromMemory(key) {
        const entry = this.memoryCache.get(key);
        if (!entry)
            return null;
        // Check if entry is expired
        if (this.isExpired(entry)) {
            this.memoryCache.delete(key);
            return null;
        }
        // Update access information
        entry.lastAccessed = new Date();
        entry.accessCount++;
        return entry.value;
    }
    async getFromRedis(key) {
        try {
            const data = await this.redis.get(key);
            if (!data)
                return null;
            const entry = JSON.parse(data);
            // Update access count in Redis (async, don't wait)
            this.redis.hincrby(`${key}:meta`, 'accessCount', 1).catch(err => this.logger.warn('Failed to update Redis access count', { key, error: err }));
            return entry.value;
        }
        catch (error) {
            this.logger.error('Redis get error', { key, error });
            return null;
        }
    }
    setInMemory(key, entry) {
        // Implement LRU eviction if memory cache is full
        if (this.memoryCache.size >= 10000) { // Max 10k entries in memory
            this.evictLRUFromMemory();
        }
        this.memoryCache.set(key, entry);
    }
    async setInRedis(key, entry, ttl) {
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
        }
        catch (error) {
            this.logger.error('Redis set error', { key, error });
        }
    }
    calculateIntelligentTTL(key, priority) {
        // Base TTL on data type and priority
        let baseTTL = this.config.ttl.playerData; // Default
        if (key.includes('game:'))
            baseTTL = this.config.ttl.gameData;
        else if (key.includes('market:'))
            baseTTL = this.config.ttl.marketData;
        else if (key.includes('prediction:'))
            baseTTL = this.config.ttl.predictions;
        else if (key.includes('historical:'))
            baseTTL = this.config.ttl.historicalData;
        else if (key.includes('static:'))
            baseTTL = this.config.ttl.staticData;
        // Adjust based on priority
        switch (priority) {
            case 'critical': return Math.max(baseTTL * 0.5, 30); // Shorter TTL for critical data
            case 'high': return baseTTL;
            case 'medium': return baseTTL * 1.5;
            case 'low': return baseTTL * 3;
            default: return baseTTL;
        }
    }
    shouldStoreInMemory(entry) {
        // Store in memory if high priority or frequently accessed
        return entry.priority === 'critical' ||
            entry.priority === 'high' ||
            this.isFrequentlyAccessed(entry.key);
    }
    shouldStoreInRedis(entry) {
        // Always store in Redis unless entry is too large
        const entrySize = JSON.stringify(entry).length;
        return entrySize < 1024 * 1024; // Max 1MB per entry
    }
    isExpired(entry) {
        const now = Date.now();
        const expiryTime = entry.createdAt.getTime() + (entry.ttl * 1000);
        return now > expiryTime;
    }
    isFrequentlyAccessed(key) {
        const entry = this.memoryCache.get(key);
        if (!entry)
            return false;
        const accessRate = entry.accessCount / ((Date.now() - entry.createdAt.getTime()) / 3600000); // accesses per hour
        return accessRate > 10; // More than 10 accesses per hour
    }
    estimateApiCost(key) {
        // Cost estimates based on API provider and data type
        if (key.includes('api-sports:'))
            return 0.01;
        if (key.includes('mysports:'))
            return 0.005;
        if (key.includes('prediction:'))
            return 0.02;
        return 0.001; // Default minimal cost
    }
    estimateBatchApiCost(keys) {
        return keys.reduce((total, key) => total + this.estimateApiCost(key), 0);
    }
    recordHit(source, responseTime) {
        this.stats.totalRequests++;
        this.stats.totalHits++;
        this.updateAverageResponseTime(responseTime);
        this.emit('cache_hit', { source, responseTime });
    }
    recordMiss(reason, responseTime) {
        this.stats.totalRequests++;
        this.stats.totalMisses++;
        this.updateAverageResponseTime(responseTime);
        this.emit('cache_miss', { reason, responseTime });
    }
    updateAverageResponseTime(responseTime) {
        const totalTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
        this.stats.averageResponseTime = (totalTime + responseTime) / this.stats.totalRequests;
    }
    evictLRUFromMemory() {
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
    async deleteKey(key) {
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
    async deleteByTags(tags) {
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
    async preloadGameData(gameId) {
        // Implementation would fetch and cache game-specific data
        this.logger.debug(`Preloading game data for: ${gameId}`);
    }
    async preloadPlayerData(gameId) {
        // Implementation would fetch and cache player data for game
        this.logger.debug(`Preloading player data for: ${gameId}`);
    }
    async preloadMarketData(gameId) {
        // Implementation would fetch and cache market data for game
        this.logger.debug(`Preloading market data for: ${gameId}`);
    }
    async optimizeMemoryCache() {
        // Remove expired entries and low-priority items if memory is full
        for (const [key, entry] of this.memoryCache.entries()) {
            if (this.isExpired(entry) || (entry.priority === 'low' && this.memoryCache.size > 8000)) {
                this.memoryCache.delete(key);
            }
        }
    }
    async optimizeRedisCache() {
        // Redis optimization would involve analyzing usage patterns
        // and adjusting memory policies
        const info = await this.redis.info('memory');
        this.logger.debug('Redis memory info', { info });
    }
    async updatePerformanceMetrics() {
        // Update internal performance tracking
        const hitRate = this.getStats().hitRate;
        if (hitRate < this.config.performance.targetHitRate) {
            this.logger.warn(`Cache hit rate below target: ${hitRate * 100}%`);
            this.emit('performance_warning', { metric: 'hit_rate', value: hitRate });
        }
    }
    setupRedisListeners() {
        this.redis.on('error', (error) => {
            this.logger.error('Redis connection error', error);
            this.emit('redis_error', error);
        });
        this.redis.on('connect', () => {
            this.logger.info('Redis connected successfully');
            this.emit('redis_connected');
        });
    }
    startPerformanceMonitoring() {
        // Monitor cache performance every minute
        setInterval(() => {
            const stats = this.getStats();
            this.emit('performance_stats', stats);
            if (stats.hitRate < this.config.performance.targetHitRate) {
                this.logger.warn('Cache hit rate below target', { hitRate: stats.hitRate });
            }
        }, 60000);
    }
    startCostMonitoring() {
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
    async promoteToMemoryIfNeeded(key, value) {
        // Promote frequently accessed Redis entries to memory cache
        if (this.isFrequentlyAccessed(key)) {
            const entry = {
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
exports.IntelligentCacheManager = IntelligentCacheManager;
/**
 * Cost tracking helper class
 */
class CostTracker {
    limits;
    costs = new Map();
    dailyCost = 0;
    hourlyCost = 0;
    lastResetHour = new Date().getHours();
    lastResetDay = new Date().getDate();
    constructor(limits) {
        this.limits = limits;
    }
    async canMakeApiCall(key) {
        this.resetCostsIfNeeded();
        const estimatedCost = this.estimateCallCost(key);
        return (this.hourlyCost + estimatedCost) <= this.limits.hourlyBudget;
    }
    async canMakeBatchApiCall(keys) {
        this.resetCostsIfNeeded();
        const estimatedCost = keys.reduce((total, key) => total + this.estimateCallCost(key), 0);
        return (this.hourlyCost + estimatedCost) <= this.limits.hourlyBudget;
    }
    async recordApiCall(key, cost) {
        this.costs.set(key, (this.costs.get(key) || 0) + cost);
        this.dailyCost += cost;
        this.hourlyCost += cost;
    }
    async recordBatchApiCall(keys, cost) {
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
    estimateCallCost(key) {
        if (key.includes('api-sports:'))
            return 0.01;
        if (key.includes('mysports:'))
            return 0.005;
        if (key.includes('prediction:'))
            return 0.02;
        return 0.001;
    }
    resetCostsIfNeeded() {
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
    scheduledInvalidations = new Map();
    schedule(key, ttl, tags) {
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
    invalidateKey(key, tags) {
        // This would trigger cache invalidation
        // Implementation would depend on the specific cache instance
    }
}
exports.default = IntelligentCacheManager;
//# sourceMappingURL=intelligent-cache-manager.js.map