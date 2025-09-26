"use strict";
/**
 * Cost-Aware API Router for SportIntel
 *
 * Intelligent routing system that minimizes API costs by:
 * - Dynamic provider selection based on cost and data quality
 * - Request deduplication and batching
 * - Fallback hierarchies for cost optimization
 * - Rate limiting and quota management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostAwareApiRouter = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
class CostAwareApiRouter extends events_1.EventEmitter {
    providers = new Map();
    requestQueue = new Map();
    rateLimiters = new Map();
    costTracker;
    logger;
    cacheManager;
    batchProcessor;
    constructor(providers, cacheManager) {
        super();
        this.logger = logger_1.Logger.getInstance();
        this.cacheManager = cacheManager;
        this.costTracker = new CostTracker();
        this.batchProcessor = new BatchProcessor();
        // Initialize providers
        providers.forEach(provider => {
            this.providers.set(provider.name, provider);
            this.rateLimiters.set(provider.name, new RateLimiter(provider.rateLimit));
        });
        this.startBatchProcessor();
        this.startCostMonitoring();
    }
    /**
     * Route API request through optimal provider
     */
    async route(request) {
        const routeKey = this.generateRouteKey(request);
        // Check cache first
        const cached = await this.checkCache(request);
        if (cached) {
            return {
                data: cached.data,
                provider: 'cache',
                cost: 0,
                cached: true,
                responseTime: cached.responseTime,
                quality: 1.0
            };
        }
        // Get routing decision
        const decision = await this.makeRoutingDecision(request);
        // Execute request through selected provider
        const response = await this.executeRequest(request, decision);
        // Cache the response
        if (request.cacheable && response.data) {
            await this.cacheResponse(request, response);
        }
        // Track costs and performance
        await this.trackRequest(request, decision, response);
        return response;
    }
    /**
     * Batch multiple requests for cost efficiency
     */
    async routeBatch(requests) {
        // Group requests by provider and batchability
        const batchGroups = this.groupForBatching(requests);
        const results = [];
        for (const [provider, batchRequests] of batchGroups.entries()) {
            try {
                if (batchRequests.length === 1) {
                    // Single request
                    const result = await this.route(batchRequests[0]);
                    results.push(result);
                }
                else {
                    // Batch request
                    const batchResults = await this.executeBatchRequest(provider, batchRequests);
                    results.push(...batchResults);
                }
            }
            catch (error) {
                this.logger.error(`Batch request failed for provider: ${provider}`, error);
                // Fallback to individual requests
                for (const request of batchRequests) {
                    try {
                        const fallbackResult = await this.route(request);
                        results.push(fallbackResult);
                    }
                    catch (fallbackError) {
                        this.logger.error(`Fallback request failed`, { request, error: fallbackError });
                        // Return error response
                        results.push({
                            data: null,
                            provider: 'error',
                            cost: 0,
                            cached: false,
                            responseTime: 0,
                            quality: 0
                        });
                    }
                }
            }
        }
        return results;
    }
    /**
     * Get the best provider for a specific data type
     */
    getBestProvider(dataType, maxCost) {
        const candidates = Array.from(this.providers.values())
            .filter(provider => {
            // Filter by specialties and cost
            const hasSpecialty = provider.specialties.includes(dataType);
            const withinBudget = !maxCost || provider.costPerRequest <= maxCost;
            const hasCapacity = this.rateLimiters.get(provider.name)?.hasCapacity() || false;
            return hasSpecialty && withinBudget && hasCapacity;
        })
            .sort((a, b) => {
            // Score based on cost, quality, and reliability
            const scoreA = this.calculateProviderScore(a, dataType);
            const scoreB = this.calculateProviderScore(b, dataType);
            return scoreB - scoreA; // Higher score first
        });
        return candidates[0] || null;
    }
    /**
     * Add or update API provider
     */
    updateProvider(provider) {
        this.providers.set(provider.name, provider);
        this.rateLimiters.set(provider.name, new RateLimiter(provider.rateLimit));
        this.logger.info(`Provider updated: ${provider.name}`, {
            cost: provider.costPerRequest,
            reliability: provider.reliability,
            dataQuality: provider.dataQuality
        });
        this.emit('provider_updated', provider);
    }
    /**
     * Get routing statistics and cost analysis
     */
    getStats() {
        return {
            totalRequests: this.costTracker.getTotalRequests(),
            totalCost: this.costTracker.getTotalCost(),
            costSavings: this.costTracker.getCostSavings(),
            providerStats: this.getProviderStats(),
            cacheStats: this.cacheManager.getStats(),
            averageResponseTime: this.costTracker.getAverageResponseTime()
        };
    }
    // Private methods
    generateRouteKey(request) {
        return `${request.endpoint}:${JSON.stringify(request.params)}`;
    }
    async checkCache(request) {
        if (!request.cacheable)
            return null;
        const cacheKey = this.generateCacheKey(request);
        const startTime = Date.now();
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return {
                data: cached,
                responseTime: Date.now() - startTime
            };
        }
        return null;
    }
    async makeRoutingDecision(request) {
        // Get all viable providers
        const viableProviders = this.getViableProviders(request);
        if (viableProviders.length === 0) {
            throw new Error(`No viable providers for request: ${request.endpoint}`);
        }
        // Select best provider based on multiple factors
        const selectedProvider = this.selectOptimalProvider(viableProviders, request);
        // Calculate alternatives
        const alternatives = viableProviders
            .filter(p => p.name !== selectedProvider.name)
            .slice(0, 2); // Top 2 alternatives
        return {
            provider: selectedProvider,
            estimatedCost: selectedProvider.costPerRequest,
            cacheStrategy: 'miss',
            reason: this.getSelectionReason(selectedProvider, request),
            alternatives
        };
    }
    getViableProviders(request) {
        return Array.from(this.providers.values())
            .filter(provider => {
            // Check if provider can handle this request
            const hasCapability = this.providerCanHandle(provider, request);
            const withinBudget = provider.costPerRequest <= request.maxCost;
            const hasCapacity = this.rateLimiters.get(provider.name)?.hasCapacity() || false;
            const meetsDeadline = this.canMeetDeadline(provider, request.requiredBy);
            return hasCapability && withinBudget && hasCapacity && meetsDeadline;
        })
            .sort((a, b) => a.fallbackPriority - b.fallbackPriority);
    }
    selectOptimalProvider(providers, request) {
        let bestProvider = providers[0];
        let bestScore = -1;
        for (const provider of providers) {
            const score = this.calculateProviderScore(provider, request.dataType);
            // Adjust score based on current load and cost constraints
            const loadPenalty = this.calculateLoadPenalty(provider);
            const costBonus = this.calculateCostBonus(provider, request.maxCost);
            const finalScore = score - loadPenalty + costBonus;
            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestProvider = provider;
            }
        }
        return bestProvider;
    }
    calculateProviderScore(provider, dataType) {
        let score = 0;
        // Base score from reliability and data quality
        score += provider.reliability * 40;
        score += provider.dataQuality * 40;
        // Bonus for specialization
        if (provider.specialties.includes(dataType)) {
            score += 20;
        }
        // Cost efficiency (lower cost = higher score)
        const costEfficiency = Math.max(0, (0.05 - provider.costPerRequest) / 0.05);
        score += costEfficiency * 10;
        return Math.min(100, Math.max(0, score));
    }
    calculateLoadPenalty(provider) {
        const rateLimiter = this.rateLimiters.get(provider.name);
        if (!rateLimiter)
            return 0;
        const utilization = rateLimiter.getUtilization();
        return utilization * 20; // Up to 20 point penalty for high utilization
    }
    calculateCostBonus(provider, maxCost) {
        if (provider.costPerRequest >= maxCost)
            return 0;
        const costSavings = (maxCost - provider.costPerRequest) / maxCost;
        return costSavings * 10; // Up to 10 point bonus for cost savings
    }
    providerCanHandle(provider, request) {
        // Check if provider specializes in this data type
        return provider.specialties.includes(request.dataType) ||
            provider.specialties.includes('all');
    }
    canMeetDeadline(provider, deadline) {
        const now = new Date();
        const timeToDeadline = deadline.getTime() - now.getTime();
        // Assume average response time of 2 seconds
        const estimatedResponseTime = 2000;
        return timeToDeadline > estimatedResponseTime;
    }
    getSelectionReason(provider, request) {
        const reasons = [];
        if (provider.specialties.includes(request.dataType)) {
            reasons.push('specializes in ' + request.dataType);
        }
        if (provider.costPerRequest <= request.maxCost * 0.5) {
            reasons.push('cost efficient');
        }
        if (provider.reliability > 0.9) {
            reasons.push('highly reliable');
        }
        if (provider.dataQuality > 0.9) {
            reasons.push('high data quality');
        }
        return reasons.join(', ') || 'best available option';
    }
    async executeRequest(request, decision) {
        const provider = decision.provider;
        const rateLimiter = this.rateLimiters.get(provider.name);
        // Wait for rate limit if needed
        if (rateLimiter && !rateLimiter.hasCapacity()) {
            await rateLimiter.waitForCapacity();
        }
        const startTime = Date.now();
        try {
            // Record rate limit usage
            rateLimiter?.recordRequest();
            // Make the actual API call (this would be implemented based on specific provider)
            const data = await this.makeApiCall(provider, request);
            const responseTime = Date.now() - startTime;
            return {
                data,
                provider: provider.name,
                cost: provider.costPerRequest,
                cached: false,
                responseTime,
                quality: provider.dataQuality
            };
        }
        catch (error) {
            this.logger.error(`API request failed for provider: ${provider.name}`, {
                request: request.endpoint,
                error
            });
            // Try fallback providers
            if (decision.alternatives.length > 0) {
                const fallbackProvider = decision.alternatives[0];
                this.logger.info(`Attempting fallback to: ${fallbackProvider.name}`);
                const fallbackDecision = {
                    provider: fallbackProvider,
                    estimatedCost: fallbackProvider.costPerRequest,
                    cacheStrategy: 'miss',
                    reason: 'fallback after primary failure',
                    alternatives: decision.alternatives.slice(1)
                };
                return await this.executeRequest(request, fallbackDecision);
            }
            throw error;
        }
    }
    async makeApiCall(provider, request) {
        // This would contain the actual HTTP request logic
        // Implementation would vary by provider
        // Mock implementation for now
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
        return {};
    }
    async cacheResponse(request, response) {
        const cacheKey = this.generateCacheKey(request);
        const ttl = this.calculateCacheTTL(request);
        await this.cacheManager.set(cacheKey, response.data, {
            ttl,
            priority: request.priority,
            tags: [request.dataType, response.provider]
        });
    }
    generateCacheKey(request) {
        const paramString = Object.keys(request.params)
            .sort()
            .map(key => `${key}=${request.params[key]}`)
            .join('&');
        return `${request.dataType}:${request.endpoint}:${paramString}`;
    }
    calculateCacheTTL(request) {
        // Base TTL on data type and priority
        const baseTTL = {
            player: 300, // 5 minutes
            game: 120, // 2 minutes
            market: 30, // 30 seconds
            historical: 86400, // 24 hours
            prediction: 900 // 15 minutes
        };
        let ttl = baseTTL[request.dataType] || 300;
        // Adjust based on priority
        switch (request.priority) {
            case 'critical':
                ttl = Math.min(ttl, 60); // Max 1 minute for critical
                break;
            case 'high':
                ttl = Math.min(ttl, ttl * 0.5);
                break;
            case 'low':
                ttl = ttl * 2;
                break;
        }
        return ttl;
    }
    groupForBatching(requests) {
        const groups = new Map();
        for (const request of requests) {
            if (!request.batchable) {
                // Non-batchable requests get their own group
                const key = `${request.endpoint}:${Date.now()}:${Math.random()}`;
                groups.set(key, [request]);
                continue;
            }
            // Group by endpoint and compatible parameters
            const groupKey = `${request.endpoint}:${request.dataType}`;
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(request);
        }
        return groups;
    }
    async executeBatchRequest(provider, requests) {
        // Implementation would depend on provider's batch API capabilities
        // For now, fall back to individual requests
        const results = [];
        for (const request of requests) {
            const result = await this.route(request);
            results.push(result);
        }
        return results;
    }
    async trackRequest(request, decision, response) {
        await this.costTracker.recordRequest({
            provider: decision.provider.name,
            cost: response.cost,
            responseTime: response.responseTime,
            cached: response.cached,
            dataType: request.dataType
        });
        this.emit('request_completed', {
            request,
            decision,
            response,
            timestamp: new Date()
        });
    }
    getProviderStats() {
        const stats = {};
        for (const [name, provider] of this.providers.entries()) {
            const rateLimiter = this.rateLimiters.get(name);
            stats[name] = {
                costPerRequest: provider.costPerRequest,
                reliability: provider.reliability,
                dataQuality: provider.dataQuality,
                utilization: rateLimiter?.getUtilization() || 0,
                requestCount: rateLimiter?.getRequestCount() || 0
            };
        }
        return stats;
    }
    startBatchProcessor() {
        // Process batch requests every 100ms
        setInterval(() => {
            this.batchProcessor.processPendingBatches();
        }, 100);
    }
    startCostMonitoring() {
        // Monitor costs every minute
        setInterval(() => {
            const stats = this.getStats();
            this.emit('cost_update', stats);
            if (stats.totalCost > 150) { // Monthly budget
                this.logger.warn('Monthly cost budget exceeded', stats);
                this.emit('budget_exceeded', stats);
            }
        }, 60000);
    }
}
exports.CostAwareApiRouter = CostAwareApiRouter;
/**
 * Rate limiter helper class
 */
class RateLimiter {
    limits;
    requests = [];
    constructor(limits) {
        this.limits = limits;
    }
    hasCapacity() {
        this.cleanupOldRequests();
        const now = Date.now();
        const minuteAgo = now - 60000;
        const hourAgo = now - 3600000;
        const dayAgo = now - 86400000;
        const requestsLastMinute = this.requests.filter(t => t > minuteAgo).length;
        const requestsLastHour = this.requests.filter(t => t > hourAgo).length;
        const requestsLastDay = this.requests.filter(t => t > dayAgo).length;
        return requestsLastMinute < this.limits.requestsPerMinute &&
            requestsLastHour < this.limits.requestsPerHour &&
            requestsLastDay < this.limits.requestsPerDay;
    }
    recordRequest() {
        this.requests.push(Date.now());
    }
    async waitForCapacity() {
        while (!this.hasCapacity()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    getUtilization() {
        this.cleanupOldRequests();
        const now = Date.now();
        const minuteAgo = now - 60000;
        const requestsLastMinute = this.requests.filter(t => t > minuteAgo).length;
        return requestsLastMinute / this.limits.requestsPerMinute;
    }
    getRequestCount() {
        this.cleanupOldRequests();
        return this.requests.length;
    }
    cleanupOldRequests() {
        const dayAgo = Date.now() - 86400000;
        this.requests = this.requests.filter(t => t > dayAgo);
    }
}
/**
 * Cost tracking helper class
 */
class CostTracker {
    requests = [];
    async recordRequest(request) {
        this.requests.push({
            ...request,
            timestamp: new Date()
        });
        // Keep only last 24 hours of data
        const dayAgo = new Date(Date.now() - 86400000);
        this.requests = this.requests.filter(r => r.timestamp > dayAgo);
    }
    getTotalRequests() {
        return this.requests.length;
    }
    getTotalCost() {
        return this.requests.reduce((sum, r) => sum + (r.cached ? 0 : r.cost), 0);
    }
    getCostSavings() {
        return this.requests.filter(r => r.cached).reduce((sum, r) => sum + r.cost, 0);
    }
    getAverageResponseTime() {
        if (this.requests.length === 0)
            return 0;
        return this.requests.reduce((sum, r) => sum + r.responseTime, 0) / this.requests.length;
    }
}
/**
 * Batch processor helper class
 */
class BatchProcessor {
    pendingBatches = new Map();
    addToBatch(key, request) {
        if (!this.pendingBatches.has(key)) {
            this.pendingBatches.set(key, []);
        }
        this.pendingBatches.get(key).push(request);
    }
    processPendingBatches() {
        // Implementation would process batched requests
        // This is a placeholder for the actual batch processing logic
    }
}
exports.default = CostAwareApiRouter;
//# sourceMappingURL=cost-aware-api-router.js.map