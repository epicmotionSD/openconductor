/**
 * SportIntel Intelligent Caching System
 * 
 * Export all caching components for cost-optimized data management
 * targeting $150/month budget through intelligent cache strategies.
 */

export { default as IntelligentCacheManager } from './intelligent-cache-manager';
export type { CacheConfig, CacheStats, CacheEntry } from './intelligent-cache-manager';

export { default as CostAwareApiRouter } from './cost-aware-api-router';
export type { 
  ApiProvider, 
  RouteDecision, 
  ApiRequest, 
  ApiResponse 
} from './cost-aware-api-router';

export { default as CacheIntegrationService } from './cache-integration-service';
export type { 
  CacheIntegrationConfig,
  DataRequest, 
  OptimizationReport 
} from './cache-integration-service';

// Configuration factory
export function createSportIntelCacheConfig(): CacheIntegrationConfig {
  return {
    cache: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: 1,
        maxMemoryPolicy: 'allkeys-lru',
        maxMemory: '1gb'
      },
      ttl: {
        playerData: 300,      // 5 minutes
        gameData: 120,        // 2 minutes
        marketData: 30,       // 30 seconds
        predictions: 900,     // 15 minutes
        historicalData: 86400, // 24 hours
        staticData: 604800    // 7 days
      },
      costLimits: {
        monthlyBudget: 150,   // $150/month
        dailyBudget: 5,       // $5/day
        hourlyBudget: 0.21,   // $0.21/hour
        warningThreshold: 80  // 80%
      },
      performance: {
        targetHitRate: 0.95,     // 95%
        maxResponseTime: 50,     // 50ms
        warmupThreshold: 2       // 2 hours
      }
    },
    providers: [
      {
        name: 'api-sports',
        baseUrl: 'https://v3.football.api-sports.io',
        apiKey: process.env.API_SPORTS_KEY || '',
        costPerRequest: 0.01,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        },
        reliability: 0.95,
        dataQuality: 0.9,
        specialties: ['player', 'game', 'historical'],
        fallbackPriority: 1
      },
      {
        name: 'mysports-feeds',
        baseUrl: 'https://api.mysportsfeeds.com/v2.1/pull',
        apiKey: process.env.MYSPORTS_FEEDS_KEY || '',
        costPerRequest: 0.005,
        rateLimit: {
          requestsPerMinute: 200,
          requestsPerHour: 2000,
          requestsPerDay: 20000
        },
        reliability: 0.92,
        dataQuality: 0.85,
        specialties: ['market', 'player', 'historical'],
        fallbackPriority: 2
      },
      {
        name: 'espn-api',
        baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
        apiKey: '', // Free tier
        costPerRequest: 0.001,
        rateLimit: {
          requestsPerMinute: 50,
          requestsPerHour: 500,
          requestsPerDay: 5000
        },
        reliability: 0.88,
        dataQuality: 0.75,
        specialties: ['game', 'player'],
        fallbackPriority: 3
      }
    ],
    optimization: {
      enablePredictiveWarming: true,
      enableBatchOptimization: true,
      enableCostAlerts: true,
      maxConcurrentRequests: 100,
      gameWarmupHours: 2
    },
    monitoring: {
      metricsInterval: 60000, // 1 minute
      alertThresholds: {
        hitRate: 0.9,           // 90%
        responseTime: 100,      // 100ms
        costPerHour: 0.21       // $0.21/hour
      }
    }
  };
}

// Default providers configuration
export const DEFAULT_PROVIDERS: ApiProvider[] = [
  {
    name: 'api-sports-primary',
    baseUrl: 'https://v3.football.api-sports.io',
    apiKey: process.env.API_SPORTS_KEY || '',
    costPerRequest: 0.01,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    reliability: 0.95,
    dataQuality: 0.9,
    specialties: ['player', 'game', 'historical', 'prediction'],
    fallbackPriority: 1
  },
  {
    name: 'mysports-feeds-secondary',
    baseUrl: 'https://api.mysportsfeeds.com/v2.1/pull',
    apiKey: process.env.MYSPORTS_FEEDS_KEY || '',
    costPerRequest: 0.005,
    rateLimit: {
      requestsPerMinute: 200,
      requestsPerHour: 2000,
      requestsPerDay: 20000
    },
    reliability: 0.92,
    dataQuality: 0.85,
    specialties: ['market', 'player', 'historical'],
    fallbackPriority: 2
  }
];

// Cost optimization utilities
export class CostOptimizer {
  static calculateOptimalTTL(dataType: string, accessFrequency: number): number {
    const baseTTLs = {
      player: 300,
      game: 120,
      market: 30,
      historical: 86400,
      prediction: 900
    };

    let ttl = baseTTLs[dataType as keyof typeof baseTTLs] || 300;

    // Adjust based on access frequency
    if (accessFrequency > 10) { // High frequency
      ttl *= 1.5;
    } else if (accessFrequency < 2) { // Low frequency
      ttl *= 0.7;
    }

    return Math.max(30, Math.min(3600, ttl)); // Between 30s and 1h
  }

  static selectCostOptimalProvider(
    providers: ApiProvider[], 
    dataType: string, 
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): ApiProvider | null {
    const candidates = providers.filter(p => 
      p.specialties.includes(dataType) || p.specialties.includes('all')
    );

    if (candidates.length === 0) return null;

    // Score providers based on cost, quality, and urgency
    const scored = candidates.map(provider => {
      let score = 100;
      
      // Cost efficiency (lower cost = higher score)
      score += (0.02 - provider.costPerRequest) * 1000;
      
      // Quality bonus
      score += provider.dataQuality * 20;
      score += provider.reliability * 20;
      
      // Urgency adjustments
      if (urgency === 'high') {
        score += provider.reliability * 30; // Prioritize reliability
      } else if (urgency === 'low') {
        score += (0.02 - provider.costPerRequest) * 2000; // Prioritize cost
      }

      return { provider, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].provider;
  }

  static estimateMonthlyCost(
    requestsPerDay: number, 
    avgCostPerRequest: number,
    cacheHitRate: number = 0.95
  ): number {
    const actualRequests = requestsPerDay * (1 - cacheHitRate);
    const dailyCost = actualRequests * avgCostPerRequest;
    return dailyCost * 30; // Monthly estimate
  }
}

// Cache warming strategies
export class CacheWarmingStrategy {
  static getGameWarmupRequests(gameId: string): DataRequest[] {
    return [
      {
        key: `game_${gameId}_details`,
        dataType: 'game',
        params: { gameId },
        priority: 'high',
        batchable: false
      },
      {
        key: `game_${gameId}_roster`,
        dataType: 'player',
        params: { gameId },
        priority: 'high',
        batchable: true
      },
      {
        key: `game_${gameId}_market`,
        dataType: 'market',
        params: { gameId },
        priority: 'medium',
        batchable: true
      },
      {
        key: `game_${gameId}_predictions`,
        dataType: 'prediction',
        params: { gameId },
        priority: 'medium',
        batchable: true
      }
    ];
  }

  static getPrimeTimeWarmupRequests(): DataRequest[] {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return [
      {
        key: `today_games_${today}`,
        dataType: 'game',
        params: { date: today },
        priority: 'high',
        batchable: true
      },
      {
        key: `top_players_${today}`,
        dataType: 'player',
        params: { date: today, limit: 100 },
        priority: 'medium',
        batchable: true
      },
      {
        key: `market_overview_${today}`,
        dataType: 'market',
        params: { date: today },
        priority: 'medium',
        batchable: true
      }
    ];
  }
}

export { CacheIntegrationConfig, DataRequest, OptimizationReport };