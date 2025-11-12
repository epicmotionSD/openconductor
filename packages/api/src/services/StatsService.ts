import { 
  TrendingRequest, 
  TrendingResponse, 
  TrendingServer,
  PopularResponse,
  ServerSummary,
  ServerCategory,
  CACHE_TTL
} from '@openconductor/shared';
import { mcpServerRepository, statsRepository } from '../db/models';
import { cache, db } from '../db/connection';
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

interface RawStats {
  stars: number;
  installs: number;
  upvotes: number;
  lastCommit: Date;
  pageViews: number;
  npmDownloads: number;
}

interface HistoricalStats {
  stars: number;
  installs: number;
  pageViews: number;
  date: Date;
}

export class StatsService {
  private static instance: StatsService;

  private constructor() {}

  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  /**
   * Get trending servers with growth metrics
   */
  async getTrending(request: TrendingRequest): Promise<TrendingResponse> {
    const { period = '7d', category, limit = 10 } = request;
    
    const cacheKey = cache.generateKey('trending', JSON.stringify(request));
    const cached = await cache.get<TrendingResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get trending servers from repository
      const response = await mcpServerRepository.getTrending(request);
      
      // Enhance with growth metrics
      const enhancedServers = await Promise.all(
        response.servers.map(async (server) => {
          const growth = await this.calculateGrowthMetrics(server.id, period);
          return {
            ...server,
            growth
          };
        })
      );

      const result: TrendingResponse = {
        servers: enhancedServers,
        period
      };

      await cache.set(cacheKey, result, CACHE_TTL.TRENDING);
      return result;
    } catch (error) {
      logger.error('Error getting trending servers', { request, error });
      throw error;
    }
  }

  /**
   * Get popular servers by category
   */
  async getPopular(category?: ServerCategory, limit: number = 10): Promise<PopularResponse> {
    const cacheKey = cache.generateKey('popular', category || 'all', limit.toString());
    const cached = await cache.get<PopularResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const servers = await mcpServerRepository.list({
        category,
        verified: true,
        sort: 'popular',
        limit
      });

      const response: PopularResponse = {
        servers: servers.servers,
        category
      };

      await cache.set(cacheKey, response, CACHE_TTL.STATS);
      return response;
    } catch (error) {
      logger.error('Error getting popular servers', { category, limit, error });
      throw error;
    }
  }

  /**
   * Calculate popularity score for a server
   * Formula: weighted combination of metrics with decay
   */
  calculatePopularityScore(stats: RawStats): number {
    const weights = {
      stars: 0.25,
      installs: 0.35,
      upvotes: 0.15,
      recency: 0.15,
      downloads: 0.10
    };

    // Normalize values using logarithmic scaling
    const normalizedStars = Math.log10(Math.max(stats.stars, 1));
    const normalizedInstalls = Math.log10(Math.max(stats.installs, 1));
    const normalizedUpvotes = Math.log10(Math.max(stats.upvotes, 1));
    const normalizedDownloads = Math.log10(Math.max(stats.npmDownloads, 1));
    
    // Recency score: higher for recent activity (decay over time)
    const daysSinceCommit = this.daysSince(stats.lastCommit);
    const recencyScore = Math.max(0, 10 - Math.log10(daysSinceCommit + 1));

    const score = 
      weights.stars * normalizedStars +
      weights.installs * normalizedInstalls +
      weights.upvotes * normalizedUpvotes +
      weights.recency * recencyScore +
      weights.downloads * normalizedDownloads;

    // Scale to 0-100 range
    return Math.round(Math.min(score * 10, 100) * 100) / 100;
  }

  /**
   * Calculate trending score based on growth rate
   * Considers velocity and acceleration of growth
   */
  async calculateTrendingScore(serverId: string, period: '24h' | '7d' | '30d'): Promise<number> {
    try {
      const current = await this.getCurrentStats(serverId);
      if (!current) return 0;

      const historical = await this.getHistoricalStats(serverId, period);
      if (!historical) return 0;

      // Calculate growth rates
      const starGrowth = this.calculateGrowthRate(
        current.stars, 
        historical.stars, 
        this.getPeriodDays(period)
      );
      
      const installGrowth = this.calculateGrowthRate(
        current.installs, 
        historical.installs, 
        this.getPeriodDays(period)
      );

      const pageViewGrowth = this.calculateGrowthRate(
        current.pageViews,
        historical.pageViews,
        this.getPeriodDays(period)
      );

      // Weighted combination of growth rates
      const weights = { stars: 0.4, installs: 0.5, pageViews: 0.1 };
      const trendingScore = 
        weights.stars * starGrowth +
        weights.installs * installGrowth +
        weights.pageViews * pageViewGrowth;

      // Apply velocity bonus for consistent growth
      const velocityBonus = await this.calculateVelocityBonus(serverId);
      
      return Math.max(0, Math.round((trendingScore + velocityBonus) * 100) / 100);
    } catch (error) {
      logger.error('Error calculating trending score', { serverId, period, error });
      return 0;
    }
  }

  /**
   * Update all statistics for all servers
   * Called by background job
   */
  async updateAllStats(): Promise<{ updated: number; errors: number }> {
    logger.info('Starting bulk stats update');
    
    let updated = 0;
    let errors = 0;

    try {
      // Get all servers
      const servers = await mcpServerRepository.list({ limit: 1000 });
      
      // Update stats for each server
      for (const server of servers.servers) {
        try {
          await this.updateServerStats(server.id);
          updated++;
        } catch (error) {
          logger.error(`Error updating stats for server ${server.id}`, error);
          errors++;
        }
      }

      // Clear stats caches after bulk update
      await this.clearStatsCache();

      logger.info('Bulk stats update completed', { updated, errors });
      return { updated, errors };
    } catch (error) {
      logger.error('Bulk stats update failed', error);
      throw error;
    }
  }

  /**
   * Update statistics for a specific server
   */
  async updateServerStats(serverId: string): Promise<void> {
    try {
      const server = await mcpServerRepository.findById(serverId);
      if (!server) {
        throw new Error('Server not found');
      }

      // Gather current stats
      const stats: RawStats = {
        stars: server.repository.stars,
        installs: server.stats.installs,
        upvotes: server.stats.upvotes,
        lastCommit: new Date(server.repository.lastCommit),
        pageViews: server.stats.pageViews,
        npmDownloads: server.packages.npm?.downloadsWeekly || 0
      };

      // Calculate scores
      const popularityScore = this.calculatePopularityScore(stats);
      const trendingScore = await this.calculateTrendingScore(serverId, '7d');

      // Update database
      await statsRepository.updateStats(serverId, {
        github_stars: stats.stars,
        cli_installs: stats.installs,
        upvotes: stats.upvotes,
        page_views: stats.pageViews,
        npm_downloads_weekly: stats.npmDownloads,
        popularity_score: popularityScore,
        trending_score: trendingScore
      });

      // Create analytics snapshot for trending calculations
      await this.createAnalyticsSnapshot(serverId, stats);

    } catch (error) {
      logger.error('Error updating server stats', { serverId, error });
      throw error;
    }
  }

  /**
   * Track page view for a server
   */
  async trackPageView(serverId: string, userAgent?: string, ip?: string): Promise<void> {
    try {
      // TODO: Increment page_views in server_stats
      // TODO: Log to analytics for detailed tracking
      logger.info('Page view tracked', { serverId });
    } catch (error) {
      logger.warn('Error tracking page view', { serverId, error });
      // Don't throw - this is analytics
    }
  }

  /**
   * Track CLI install event
   */
  async trackInstallEvent(serverId: string, metadata: any): Promise<void> {
    try {
      // TODO: Increment cli_installs in server_stats  
      // TODO: Log install event with metadata
      logger.info('Install event tracked', { serverId, metadata });
    } catch (error) {
      logger.warn('Error tracking install', { serverId, error });
    }
  }

  /**
   * Get registry-wide statistics
   */
  async getRegistryStats(): Promise<{
    totalServers: number;
    verifiedServers: number;
    totalInstalls: number;
    categoryCounts: Record<ServerCategory, number>;
    topTags: { tag: string; count: number }[];
  }> {
    const cacheKey = cache.generateKey('registry-stats');
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get comprehensive stats from database
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_servers,
          COUNT(*) FILTER (WHERE verified = true) as verified_servers,
          SUM(st.cli_installs) as total_installs,
          s.category,
          UNNEST(s.tags) as tag
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        GROUP BY s.category, tag
      `);

      // Process results
      const stats = {
        totalServers: 0,
        verifiedServers: 0, 
        totalInstalls: 0,
        categoryCounts: {} as Record<ServerCategory, number>,
        topTags: [] as { tag: string; count: number }[]
      };

      // Aggregate data
      const tagCounts: Record<string, number> = {};
      
      for (const row of result.rows) {
        stats.totalServers = parseInt(row.total_servers) || 0;
        stats.verifiedServers = parseInt(row.verified_servers) || 0;
        stats.totalInstalls = parseInt(row.total_installs) || 0;
        
        if (row.category) {
          stats.categoryCounts[row.category] = (stats.categoryCounts[row.category] || 0) + 1;
        }
        
        if (row.tag) {
          tagCounts[row.tag] = (tagCounts[row.tag] || 0) + 1;
        }
      }

      // Sort and limit tags
      stats.topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }));

      await cache.set(cacheKey, stats, CACHE_TTL.STATS);
      return stats;
    } catch (error) {
      logger.error('Error getting registry stats', error);
      // Return defaults on error
      return {
        totalServers: 0,
        verifiedServers: 0,
        totalInstalls: 0,
        categoryCounts: {} as Record<ServerCategory, number>,
        topTags: []
      };
    }
  }

  // Private helper methods

  private async getCurrentStats(serverId: string): Promise<RawStats | null> {
    try {
      const result = await db.query(`
        SELECT 
          st.github_stars as stars,
          st.cli_installs as installs, 
          st.upvotes,
          st.page_views,
          st.npm_downloads_weekly,
          s.updated_at as last_commit
        FROM server_stats st
        JOIN mcp_servers s ON st.server_id = s.id
        WHERE st.server_id = $1
      `, [serverId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        stars: row.stars || 0,
        installs: row.installs || 0,
        upvotes: row.upvotes || 0,
        lastCommit: new Date(row.last_commit),
        pageViews: row.page_views || 0,
        npmDownloads: row.npm_downloads_weekly || 0
      };
    } catch (error) {
      logger.error('Error getting current stats', { serverId, error });
      return null;
    }
  }

  private async getHistoricalStats(
    serverId: string, 
    period: '24h' | '7d' | '30d'
  ): Promise<HistoricalStats | null> {
    try {
      const days = this.getPeriodDays(period);
      const result = await db.query(`
        SELECT github_stars as stars, cli_installs as installs, page_views, snapshot_date
        FROM server_analytics_snapshots
        WHERE server_id = $1 
          AND snapshot_date <= NOW() - INTERVAL '${days} days'
        ORDER BY snapshot_date DESC
        LIMIT 1
      `, [serverId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        stars: row.stars || 0,
        installs: row.installs || 0,
        pageViews: row.page_views || 0,
        date: new Date(row.snapshot_date)
      };
    } catch (error) {
      logger.error('Error getting historical stats', { serverId, period, error });
      return null;
    }
  }

  private calculateGrowthRate(current: number, historical: number, days: number): number {
    if (historical === 0) return current > 0 ? 100 : 0;
    
    const growth = (current - historical) / historical;
    const dailyGrowthRate = Math.pow(1 + growth, 1 / days) - 1;
    
    // Convert to percentage and apply logarithmic scaling for very high growth
    const percentage = dailyGrowthRate * 100;
    return Math.min(percentage, Math.log10(Math.abs(percentage) + 1) * 10);
  }

  private async calculateVelocityBonus(serverId: string): Promise<number> {
    // TODO: Implement velocity calculation based on consistent growth patterns
    return 0;
  }

  private async calculateGrowthMetrics(serverId: string, period: string): Promise<{
    stars: number;
    installs: number;
    percentage: number;
  }> {
    const current = await this.getCurrentStats(serverId);
    const historical = await this.getHistoricalStats(serverId, period as any);

    if (!current || !historical) {
      return { stars: 0, installs: 0, percentage: 0 };
    }

    const starGrowth = current.stars - historical.stars;
    const installGrowth = current.installs - historical.installs;
    
    const totalGrowth = starGrowth + installGrowth;
    const totalHistorical = historical.stars + historical.installs;
    
    const percentage = totalHistorical > 0 
      ? Math.round((totalGrowth / totalHistorical) * 100)
      : 0;

    return {
      stars: starGrowth,
      installs: installGrowth,
      percentage
    };
  }

  private async createAnalyticsSnapshot(serverId: string, stats: RawStats): Promise<void> {
    try {
      await db.query(`
        INSERT INTO server_analytics_snapshots (
          server_id, snapshot_date, github_stars, cli_installs, page_views
        ) VALUES ($1, CURRENT_DATE, $2, $3, $4)
        ON CONFLICT (server_id, snapshot_date) 
        DO UPDATE SET 
          github_stars = $2,
          cli_installs = $3, 
          page_views = $4
      `, [serverId, stats.stars, stats.installs, stats.pageViews]);
    } catch (error) {
      logger.error('Error creating analytics snapshot', { serverId, error });
    }
  }

  private async clearStatsCache(): Promise<void> {
    const patterns = ['trending:*', 'popular:*', 'registry-stats', 'server:*'];
    for (const pattern of patterns) {
      // TODO: Implement pattern-based cache clearing
    }
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getPeriodDays(period: '24h' | '7d' | '30d'): number {
    switch (period) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      default: return 7;
    }
  }
}

// Export singleton instance
export const statsService = StatsService.getInstance();