import { db, cache } from '../db/connection';
import { CACHE_TTL } from '@openconductor/shared';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

interface RawMetrics {
  stars: number;
  installs: number;
  upvotes: number;
  pageViews: number;
  npmDownloads: number;
  lastCommitDays: number;
  forks: number;
  openIssues: number;
  releaseFrequency: number;
}

interface HistoricalData {
  serverId: string;
  date: Date;
  stars: number;
  installs: number;
  pageViews: number;
}

/**
 * Advanced statistics calculation engine
 * Implements sophisticated algorithms for popularity, trending, and quality scoring
 */
export class StatsCalculationEngine {
  private static instance: StatsCalculationEngine;

  private constructor() {}

  public static getInstance(): StatsCalculationEngine {
    if (!StatsCalculationEngine.instance) {
      StatsCalculationEngine.instance = new StatsCalculationEngine();
    }
    return StatsCalculationEngine.instance;
  }

  /**
   * Calculate popularity score using weighted metrics with decay functions
   * Formula: Weighted combination of normalized metrics with recency decay
   */
  calculatePopularityScore(metrics: RawMetrics): number {
    // Metric weights (total = 1.0)
    const weights = {
      stars: 0.25,        // GitHub stars (community validation)
      installs: 0.30,     // CLI installs (actual usage)
      upvotes: 0.15,      // Community upvotes
      pageViews: 0.10,    // Interest/discovery
      npmDownloads: 0.10, // Package ecosystem usage
      recency: 0.05,      // Recent activity bonus
      quality: 0.05       // Code quality indicators
    };

    // Normalize metrics using logarithmic scaling
    const normalizedStars = this.normalizeMetric(metrics.stars, 'stars');
    const normalizedInstalls = this.normalizeMetric(metrics.installs, 'installs');
    const normalizedUpvotes = this.normalizeMetric(metrics.upvotes, 'upvotes');
    const normalizedPageViews = this.normalizeMetric(metrics.pageViews, 'pageViews');
    const normalizedNpmDownloads = this.normalizeMetric(metrics.npmDownloads, 'npmDownloads');

    // Calculate recency score (decay over time)
    const recencyScore = this.calculateRecencyScore(metrics.lastCommitDays);

    // Calculate quality score (based on maintenance indicators)
    const qualityScore = this.calculateQualityScore(metrics);

    // Compute weighted score
    const rawScore = 
      weights.stars * normalizedStars +
      weights.installs * normalizedInstalls +
      weights.upvotes * normalizedUpvotes +
      weights.pageViews * normalizedPageViews +
      weights.npmDownloads * normalizedNpmDownloads +
      weights.recency * recencyScore +
      weights.quality * qualityScore;

    // Scale to 0-100 range with sigmoid function for distribution
    const popularityScore = this.sigmoidScale(rawScore, 100);

    return Math.round(popularityScore * 100) / 100;
  }

  /**
   * Calculate trending score based on growth velocity and acceleration
   */
  async calculateTrendingScore(
    serverId: string, 
    currentMetrics: RawMetrics, 
    period: '24h' | '7d' | '30d'
  ): Promise<number> {
    try {
      const historicalData = await this.getHistoricalMetrics(serverId, period);
      
      if (!historicalData) {
        // No historical data - return moderate score for new servers
        return this.calculateNewServerTrendingScore(currentMetrics);
      }

      // Calculate growth rates for each metric
      const periodDays = this.getPeriodDays(period);
      
      const growthRates = {
        stars: this.calculateGrowthRate(currentMetrics.stars, historicalData.stars, periodDays),
        installs: this.calculateGrowthRate(currentMetrics.installs, historicalData.installs, periodDays),
        pageViews: this.calculateGrowthRate(currentMetrics.pageViews, historicalData.pageViews, periodDays)
      };

      // Calculate velocity (first derivative of growth)
      const velocity = await this.calculateVelocity(serverId, period);
      
      // Calculate acceleration (second derivative - change in velocity)
      const acceleration = await this.calculateAcceleration(serverId, period);

      // Weighted combination with momentum factors
      const weights = {
        starGrowth: 0.35,
        installGrowth: 0.40,
        pageViewGrowth: 0.15,
        velocity: 0.07,
        acceleration: 0.03
      };

      const trendingScore = 
        weights.starGrowth * this.normalizeGrowthRate(growthRates.stars) +
        weights.installGrowth * this.normalizeGrowthRate(growthRates.installs) +
        weights.pageViewGrowth * this.normalizeGrowthRate(growthRates.pageViews) +
        weights.velocity * this.normalizeVelocity(velocity) +
        weights.acceleration * this.normalizeAcceleration(acceleration);

      // Apply period-specific scaling
      const periodMultiplier = this.getPeriodMultiplier(period);
      const finalScore = trendingScore * periodMultiplier;

      return Math.max(0, Math.round(finalScore * 100) / 100);

    } catch (error) {
      logger.error('Failed to calculate trending score', { serverId, period, error });
      return 0;
    }
  }

  /**
   * Calculate server quality score based on maintenance and community indicators
   */
  private calculateQualityScore(metrics: RawMetrics): number {
    const factors = {
      // Recent activity (commits in last 30 days)
      recency: Math.max(0, 1 - (metrics.lastCommitDays / 30)),
      
      // Community engagement (stars vs forks ratio)
      engagement: metrics.forks > 0 ? Math.min(1, metrics.stars / (metrics.forks * 5)) : 0.5,
      
      // Maintenance (low open issues relative to activity)
      maintenance: metrics.stars > 0 ? Math.max(0, 1 - (metrics.openIssues / metrics.stars)) : 0.5,
      
      // Release frequency (regular releases indicate active maintenance)
      releases: Math.min(1, metrics.releaseFrequency / 12) // 12 releases per year = max score
    };

    // Weighted average
    return (
      factors.recency * 0.3 +
      factors.engagement * 0.3 +
      factors.maintenance * 0.2 +
      factors.releases * 0.2
    );
  }

  /**
   * Normalize metrics using appropriate scaling for each type
   */
  private normalizeMetric(value: number, metricType: string): number {
    const scalingFunctions = {
      stars: (v: number) => Math.log10(Math.max(v, 1)) / 5,           // Log scale, max ~100k stars
      installs: (v: number) => Math.log10(Math.max(v, 1)) / 4,        // Log scale, max ~10k installs  
      upvotes: (v: number) => Math.min(v / 100, 1),                   // Linear scale, max 100
      pageViews: (v: number) => Math.log10(Math.max(v, 1)) / 6,       // Log scale, max ~1M views
      npmDownloads: (v: number) => Math.log10(Math.max(v, 1)) / 7     // Log scale, max ~10M downloads
    };

    const scalingFn = scalingFunctions[metricType as keyof typeof scalingFunctions];
    return scalingFn ? Math.min(1, scalingFn(value)) : 0;
  }

  /**
   * Calculate recency score with exponential decay
   */
  private calculateRecencyScore(daysSinceCommit: number): number {
    // Exponential decay: full score for recent commits, decays over 90 days
    const decayConstant = 0.05; // Adjust for steeper/gentler decay
    return Math.exp(-decayConstant * daysSinceCommit);
  }

  /**
   * Calculate growth rate with smoothing for volatile metrics
   */
  private calculateGrowthRate(current: number, historical: number, periodDays: number): number {
    if (historical === 0) {
      return current > 0 ? 100 : 0; // 100% growth from zero
    }

    const absoluteGrowth = current - historical;
    const relativeGrowth = absoluteGrowth / historical;
    
    // Annualize the growth rate
    const annualizedGrowth = Math.pow(1 + relativeGrowth, 365 / periodDays) - 1;
    
    // Apply smoothing to reduce impact of outliers
    return this.smoothGrowthRate(annualizedGrowth * 100);
  }

  /**
   * Smooth growth rates to handle volatility
   */
  private smoothGrowthRate(growthPercent: number): number {
    // Apply logarithmic smoothing for very high growth rates
    if (growthPercent > 100) {
      return 100 + Math.log10(growthPercent / 100) * 20;
    } else if (growthPercent < -50) {
      return -50 + Math.log10(Math.abs(growthPercent) / 50) * -10;
    }
    return growthPercent;
  }

  /**
   * Calculate velocity (rate of change of growth)
   */
  private async calculateVelocity(serverId: string, period: string): Promise<number> {
    try {
      // Get growth rates for current and previous periods
      const currentPeriodData = await this.getHistoricalMetrics(serverId, period);
      const previousPeriodData = await this.getHistoricalMetrics(
        serverId, 
        period, 
        this.getPeriodDays(period) * 2 // Look back twice as far
      );

      if (!currentPeriodData || !previousPeriodData) {
        return 0;
      }

      // Calculate velocity as change in growth rate
      const periodDays = this.getPeriodDays(period);
      const currentGrowth = this.calculateGrowthRate(
        currentPeriodData.stars, 
        previousPeriodData.stars, 
        periodDays
      );
      
      // For velocity, we need another historical point
      // Simplified: return normalized current growth as proxy for velocity
      return Math.min(currentGrowth / 50, 1); // Normalize to 0-1

    } catch (error) {
      logger.debug('Velocity calculation failed', { serverId, error });
      return 0;
    }
  }

  /**
   * Calculate acceleration (rate of change of velocity)
   */
  private async calculateAcceleration(serverId: string, period: string): Promise<number> {
    // Simplified implementation - in production would use multiple velocity points
    try {
      const velocity = await this.calculateVelocity(serverId, period);
      // Acceleration would require velocity history - simplified to velocity proxy
      return Math.min(velocity * 0.5, 1);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate trending score for new servers without historical data
   */
  private calculateNewServerTrendingScore(metrics: RawMetrics): number {
    // For new servers, base trending on current momentum indicators
    const factors = {
      starVelocity: metrics.stars > 10 ? 0.3 : 0,  // Evidence of community interest
      recentActivity: metrics.lastCommitDays < 7 ? 0.4 : 0, // Active development
      qualitySignals: this.calculateQualityScore(metrics) * 0.3
    };

    const newServerScore = Object.values(factors).reduce((sum, value) => sum + value, 0) * 20;
    return Math.min(newServerScore, 50); // Cap new server trending at 50
  }

  /**
   * Normalize growth rates for trending calculation
   */
  private normalizeGrowthRate(growthRate: number): number {
    // Sigmoid normalization for growth rates
    return 1 / (1 + Math.exp(-(growthRate - 50) / 20));
  }

  /**
   * Normalize velocity metrics
   */
  private normalizeVelocity(velocity: number): number {
    return Math.tanh(velocity / 2); // Hyperbolic tangent normalization
  }

  /**
   * Normalize acceleration metrics
   */
  private normalizeAcceleration(acceleration: number): number {
    return Math.tanh(acceleration); // Hyperbolic tangent normalization
  }

  /**
   * Apply sigmoid scaling to final scores
   */
  private sigmoidScale(value: number, maxValue: number): number {
    // Sigmoid function to create natural distribution
    const k = 10; // Steepness parameter
    const x0 = 0.5; // Midpoint
    
    const normalizedInput = value / maxValue;
    const sigmoid = 1 / (1 + Math.exp(-k * (normalizedInput - x0)));
    
    return sigmoid;
  }

  /**
   * Get period multiplier for trending calculations
   */
  private getPeriodMultiplier(period: string): number {
    // Shorter periods should have higher sensitivity to changes
    const multipliers = {
      '24h': 3.0,  // High sensitivity for daily trends
      '7d': 1.0,   // Baseline for weekly trends
      '30d': 0.4   // Lower sensitivity for monthly trends
    };
    
    return multipliers[period as keyof typeof multipliers] || 1.0;
  }

  /**
   * Get historical metrics for trending calculations
   */
  private async getHistoricalMetrics(
    serverId: string, 
    period: string, 
    daysBack?: number
  ): Promise<HistoricalData | null> {
    try {
      const lookbackDays = daysBack || this.getPeriodDays(period);
      
      const result = await db.query(`
        SELECT server_id, snapshot_date, github_stars, cli_installs, page_views
        FROM server_analytics_snapshots
        WHERE server_id = $1 
          AND snapshot_date >= CURRENT_DATE - INTERVAL '${lookbackDays} days'
        ORDER BY snapshot_date DESC
        LIMIT 1
      `, [serverId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        serverId,
        date: new Date(row.snapshot_date),
        stars: row.github_stars || 0,
        installs: row.cli_installs || 0,
        pageViews: row.page_views || 0
      };

    } catch (error) {
      logger.error('Failed to get historical metrics', { serverId, period, error });
      return null;
    }
  }

  /**
   * Convert period strings to days
   */
  private getPeriodDays(period: string): number {
    const periodMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30
    };
    
    return periodMap[period as keyof typeof periodMap] || 7;
  }

  /**
   * Batch calculate scores for all servers
   */
  async calculateAllScores(): Promise<{ updated: number; errors: number }> {
    logger.info('Starting batch score calculation');
    
    let updated = 0;
    let errors = 0;

    try {
      // Get all servers with their current metrics
      const serversResult = await db.query(`
        SELECT 
          s.id,
          s.slug,
          s.name,
          st.github_stars,
          st.github_forks,
          st.github_open_issues,
          st.github_last_commit_at,
          st.cli_installs,
          st.upvotes,
          st.page_views,
          st.npm_downloads_weekly,
          COUNT(sv.id) as release_count
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        LEFT JOIN server_versions sv ON s.id = sv.server_id 
          AND sv.published_at > NOW() - INTERVAL '1 year'
        GROUP BY s.id, st.id
        ORDER BY st.popularity_score DESC NULLS LAST
      `);

      logger.info(`Calculating scores for ${serversResult.rows.length} servers`);

      for (const server of serversResult.rows) {
        try {
          // Build metrics object
          const metrics: RawMetrics = {
            stars: server.github_stars || 0,
            installs: server.cli_installs || 0,
            upvotes: server.upvotes || 0,
            pageViews: server.page_views || 0,
            npmDownloads: server.npm_downloads_weekly || 0,
            lastCommitDays: this.daysSince(new Date(server.github_last_commit_at)),
            forks: server.github_forks || 0,
            openIssues: server.github_open_issues || 0,
            releaseFrequency: server.release_count || 0
          };

          // Calculate scores
          const popularityScore = this.calculatePopularityScore(metrics);
          const trendingScore = await this.calculateTrendingScore(server.id, metrics, '7d');

          // Update database
          await db.query(`
            UPDATE server_stats SET
              popularity_score = $2,
              trending_score = $3,
              updated_at = NOW()
            WHERE server_id = $1
          `, [server.id, popularityScore, trendingScore]);

          updated++;
          
          if (updated % 10 === 0) {
            logger.info(`Score calculation progress: ${updated}/${serversResult.rows.length}`);
          }

        } catch (error) {
          logger.error('Failed to calculate scores for server', { 
            serverId: server.id, 
            serverName: server.name,
            error: error.message 
          });
          errors++;
        }
      }

      // Clear score-related caches
      await this.clearScoreCaches();

      logger.info('Batch score calculation completed', { updated, errors });
      return { updated, errors };

    } catch (error) {
      logger.error('Batch score calculation failed', error);
      throw error;
    }
  }

  /**
   * Create analytics snapshot for trending calculations
   */
  async createDailySnapshots(): Promise<number> {
    logger.info('Creating daily analytics snapshots');
    
    try {
      const result = await db.query(`
        INSERT INTO server_analytics_snapshots (
          server_id, snapshot_date, github_stars, cli_installs, page_views
        )
        SELECT 
          s.id,
          CURRENT_DATE,
          st.github_stars,
          st.cli_installs,
          st.page_views
        FROM mcp_servers s
        JOIN server_stats st ON s.id = st.server_id
        ON CONFLICT (server_id, snapshot_date) 
        DO UPDATE SET
          github_stars = EXCLUDED.github_stars,
          cli_installs = EXCLUDED.cli_installs,
          page_views = EXCLUDED.page_views
      `);

      const snapshotCount = result.rowCount || 0;
      logger.info(`Created ${snapshotCount} analytics snapshots`);
      
      return snapshotCount;

    } catch (error) {
      logger.error('Failed to create daily snapshots', error);
      throw error;
    }
  }

  /**
   * Get trending analysis for a specific period
   */
  async getTrendingAnalysis(period: '24h' | '7d' | '30d' = '7d'): Promise<{
    topGrowing: Array<{ serverId: string; name: string; growthRate: number }>;
    topAccelerating: Array<{ serverId: string; name: string; acceleration: number }>;
    emergingServers: Array<{ serverId: string; name: string; score: number }>;
  }> {
    const cacheKey = `trending-analysis:${period}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get servers with significant trending scores
      const result = await db.query(`
        SELECT 
          s.id,
          s.name,
          s.slug,
          st.trending_score,
          st.popularity_score,
          st.github_stars,
          st.cli_installs,
          s.created_at
        FROM mcp_servers s
        JOIN server_stats st ON s.id = st.server_id
        WHERE st.trending_score > 5
        ORDER BY st.trending_score DESC
        LIMIT 20
      `);

      const trendingServers = result.rows;
      
      // Analyze trending patterns
      const analysis = {
        topGrowing: trendingServers
          .slice(0, 10)
          .map(s => ({
            serverId: s.id,
            name: s.name,
            growthRate: s.trending_score
          })),
        
        topAccelerating: trendingServers
          .filter(s => s.trending_score > 15)
          .slice(0, 5)
          .map(s => ({
            serverId: s.id,
            name: s.name,
            acceleration: s.trending_score
          })),
        
        emergingServers: trendingServers
          .filter(s => {
            const daysSinceCreation = this.daysSince(new Date(s.created_at));
            return daysSinceCreation < 90 && s.trending_score > 10;
          })
          .slice(0, 5)
          .map(s => ({
            serverId: s.id,
            name: s.name,
            score: s.trending_score
          }))
      };

      await cache.set(cacheKey, analysis, CACHE_TTL.TRENDING);
      return analysis;

    } catch (error) {
      logger.error('Failed to get trending analysis', { period, error });
      return { topGrowing: [], topAccelerating: [], emergingServers: [] };
    }
  }

  /**
   * Helper: Calculate days since a date
   */
  private daysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Clear score-related caches
   */
  private async clearScoreCaches(): Promise<void> {
    try {
      // Clear trending and popular caches
      const patterns = [
        'trending:*',
        'popular:*', 
        'servers:list:*',
        'trending-analysis:*'
      ];
      
      // For now, flush all cache - could be optimized with pattern matching
      await cache.flush();
      
    } catch (error) {
      logger.warn('Failed to clear score caches', error);
    }
  }
}

// Export singleton instance
export const statsCalculationEngine = StatsCalculationEngine.getInstance();