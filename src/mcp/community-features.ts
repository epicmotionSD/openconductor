/**
 * OpenConductor MCP Community Features
 * 
 * Community-driven features for MCP server sharing, collaboration, and social interactions.
 * Enables the platform to become a thriving ecosystem like npm or GitHub.
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { MCPServer, MCPWorkflow } from './server-registry';

export interface CommunityProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  github_username?: string;
  
  // Community metrics
  reputation_score: number;
  servers_published: number;
  workflows_shared: number;
  total_downloads: number;
  total_stars_received: number;
  
  // Activity metrics
  contributions_this_month: number;
  last_active: Date;
  member_since: Date;
  
  // Social
  followers_count: number;
  following_count: number;
  
  // Achievements
  badges: string[];
  achievements: CommunityAchievement[];
}

export interface CommunityAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  earned_at: Date;
  progress?: {
    current: number;
    target: number;
  };
}

export interface ServerReview {
  id: string;
  user_id: string;
  server_id: string;
  rating: number; // 1-5
  review_title?: string;
  review_text?: string;
  is_verified_user: boolean;
  helpful_count: number;
  replies: ReviewReply[];
  created_at: Date;
  updated_at: Date;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  reply_text: string;
  is_author_reply: boolean; // True if server author is replying
  created_at: Date;
}

export interface CommunityCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  servers: string[]; // Server IDs
  workflows: string[]; // Workflow IDs
  tags: string[];
  star_count: number;
  fork_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TrendingItem {
  id: string;
  type: 'server' | 'workflow' | 'collection';
  name: string;
  description?: string;
  author_name: string;
  trend_score: number;
  growth_rate: number;
  period: string;
  metrics: {
    views: number;
    installs: number;
    stars: number;
    executions?: number;
  };
}

/**
 * MCP Community Features Manager
 */
export class MCPCommunityFeatures {
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;

  // Achievement definitions
  private readonly ACHIEVEMENTS = {
    FIRST_SERVER: {
      name: 'First Server',
      description: 'Published your first MCP server',
      icon: '🎯',
      rarity: 'common' as const
    },
    POPULAR_SERVER: {
      name: 'Popular Creator',
      description: 'Server reached 100+ downloads',
      icon: '🌟',
      rarity: 'uncommon' as const
    },
    WORKFLOW_MASTER: {
      name: 'Workflow Master',
      description: 'Created 50+ workflows',
      icon: '⚡',
      rarity: 'rare' as const
    },
    COMMUNITY_HERO: {
      name: 'Community Hero',
      description: 'Helped 1000+ users with reviews and support',
      icon: '🦸',
      rarity: 'legendary' as const
    }
  };

  constructor(
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.pool = pool;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
  }

  /**
   * Get user's community profile
   */
  async getCommunityProfile(userId: string): Promise<CommunityProfile | null> {
    this.logger.debug('Getting community profile', { userId });

    try {
      const profileQuery = `
        SELECT 
          u.id, u.username, u.name as display_name, u.avatar_url,
          u.preferences->>'bio' as bio,
          u.preferences->>'location' as location,
          u.preferences->>'website' as website,
          u.preferences->>'github_username' as github_username,
          COUNT(DISTINCT s.id) as servers_published,
          COUNT(DISTINCT w.id) as workflows_shared,
          COALESCE(SUM(s.download_count), 0) as total_downloads,
          COALESCE(SUM(s.star_count), 0) as total_stars_received,
          u.created_at as member_since,
          u.updated_at as last_active
        FROM users u
        LEFT JOIN mcp_servers s ON u.id = s.author_id AND s.status = 'active'
        LEFT JOIN mcp_workflows w ON u.id = w.user_id AND w.is_public = true
        WHERE u.id = $1
        GROUP BY u.id
      `;

      const result = await this.pool.query(profileQuery, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const profile = result.rows[0];

      // Get recent contributions
      const contributionsQuery = `
        SELECT COUNT(*) as contributions
        FROM (
          SELECT created_at FROM mcp_servers WHERE author_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at FROM mcp_workflows WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
          UNION ALL  
          SELECT created_at FROM server_ratings WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        ) contributions
      `;

      const contributionsResult = await this.pool.query(contributionsQuery, [userId]);
      const contributionsThisMonth = parseInt(contributionsResult.rows[0]?.contributions) || 0;

      // Get achievements
      const achievements = await this.getUserAchievements(userId);

      // Calculate reputation score
      const reputationScore = this.calculateReputationScore({
        servers_published: parseInt(profile.servers_published),
        total_downloads: parseInt(profile.total_downloads),
        total_stars_received: parseInt(profile.total_stars_received),
        workflows_shared: parseInt(profile.workflows_shared),
        contributions_this_month: contributionsThisMonth
      });

      return {
        user_id: userId,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        github_username: profile.github_username,
        reputation_score: reputationScore,
        servers_published: parseInt(profile.servers_published),
        workflows_shared: parseInt(profile.workflows_shared),
        total_downloads: parseInt(profile.total_downloads),
        total_stars_received: parseInt(profile.total_stars_received),
        contributions_this_month: contributionsThisMonth,
        last_active: profile.last_active,
        member_since: profile.member_since,
        followers_count: 0, // TODO: Implement followers system
        following_count: 0, // TODO: Implement following system
        badges: [], // TODO: Implement badge system
        achievements
      };
    } catch (error) {
      this.logger.error('Failed to get community profile:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'community-profile',
        userId
      });
    }
  }

  /**
   * Submit server review
   */
  async submitServerReview(
    userId: string,
    serverId: string,
    rating: number,
    reviewTitle?: string,
    reviewText?: string
  ): Promise<ServerReview> {
    this.logger.debug('Submitting server review', {
      userId, serverId, rating, hasText: !!reviewText
    });

    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user has already reviewed this server
      const existingQuery = 'SELECT id FROM server_ratings WHERE user_id = $1 AND server_id = $2';
      const existing = await this.pool.query(existingQuery, [userId, serverId]);

      let review;
      if (existing.rows.length > 0) {
        // Update existing review
        const updateQuery = `
          UPDATE server_ratings 
          SET rating = $1, review_title = $2, review_text = $3, updated_at = NOW()
          WHERE user_id = $4 AND server_id = $5
          RETURNING *
        `;
        
        const result = await this.pool.query(updateQuery, [
          rating, reviewTitle, reviewText, userId, serverId
        ]);
        review = result.rows[0];
      } else {
        // Create new review
        const insertQuery = `
          INSERT INTO server_ratings (
            user_id, server_id, rating, review_title, review_text
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const result = await this.pool.query(insertQuery, [
          userId, serverId, rating, reviewTitle, reviewText
        ]);
        review = result.rows[0];
      }

      // Update server rating average
      await this.updateServerRatingAverage(serverId);

      // Check for achievements
      await this.checkReviewAchievements(userId);

      // Emit review event
      await this.eventBus.emit({
        type: 'mcp.server.reviewed',
        timestamp: new Date(),
        data: {
          userId,
          serverId,
          rating,
          reviewId: review.id
        }
      });

      return this.mapReviewFromDB(review);
    } catch (error) {
      this.logger.error('Failed to submit server review:', error);
      throw error;
    }
  }

  /**
   * Get server reviews
   */
  async getServerReviews(
    serverId: string,
    limit: number = 10,
    offset: number = 0,
    sortBy: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful' = 'newest'
  ): Promise<{ reviews: ServerReview[]; total_count: number; rating_summary: any }> {
    try {
      // Get reviews
      let orderBy = 'ORDER BY ';
      switch (sortBy) {
        case 'newest':
          orderBy += 'r.created_at DESC';
          break;
        case 'oldest':
          orderBy += 'r.created_at ASC';
          break;
        case 'highest_rated':
          orderBy += 'r.rating DESC, r.created_at DESC';
          break;
        case 'lowest_rated':
          orderBy += 'r.rating ASC, r.created_at DESC';
          break;
        case 'most_helpful':
          orderBy += 'r.helpful_count DESC, r.created_at DESC';
          break;
      }

      const reviewsQuery = `
        SELECT r.*, u.username, u.name as user_name, u.avatar_url
        FROM server_ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.server_id = $1
        ${orderBy}
        LIMIT $2 OFFSET $3
      `;

      const reviewsResult = await this.pool.query(reviewsQuery, [serverId, limit, offset]);
      
      // Get total count
      const countQuery = 'SELECT COUNT(*) as count FROM server_ratings WHERE server_id = $1';
      const countResult = await this.pool.query(countQuery, [serverId]);
      const totalCount = parseInt(countResult.rows[0]?.count) || 0;

      // Get rating summary
      const summaryQuery = `
        SELECT 
          rating,
          COUNT(*) as count
        FROM server_ratings 
        WHERE server_id = $1
        GROUP BY rating
        ORDER BY rating DESC
      `;
      
      const summaryResult = await this.pool.query(summaryQuery, [serverId]);
      const ratingSummary = Object.fromEntries(
        summaryResult.rows.map(row => [row.rating, parseInt(row.count)])
      );

      const reviews = reviewsResult.rows.map(row => ({
        ...this.mapReviewFromDB(row),
        username: row.username,
        user_name: row.user_name,
        user_avatar: row.avatar_url
      }));

      return {
        reviews,
        total_count: totalCount,
        rating_summary: ratingSummary
      };
    } catch (error) {
      this.logger.error('Failed to get server reviews:', error);
      throw error;
    }
  }

  /**
   * Create community collection
   */
  async createCollection(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false,
    servers: string[] = [],
    workflows: string[] = [],
    tags: string[] = []
  ): Promise<CommunityCollection> {
    this.logger.debug('Creating community collection', {
      userId, name, isPublic, serversCount: servers.length
    });

    try {
      const query = `
        INSERT INTO community_collections (
          user_id, name, description, is_public, servers, workflows, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        userId, name, description, isPublic, servers, workflows, tags
      ]);

      const collection = this.mapCollectionFromDB(result.rows[0]);

      // Emit collection created event
      await this.eventBus.emit({
        type: 'mcp.collection.created',
        timestamp: new Date(),
        data: {
          collectionId: collection.id,
          userId,
          name,
          isPublic
        }
      });

      return collection;
    } catch (error) {
      this.logger.error('Failed to create collection:', error);
      throw error;
    }
  }

  /**
   * Get trending servers and workflows
   */
  async getTrendingItems(
    type: 'server' | 'workflow' | 'all' = 'all',
    period: '24h' | '7d' | '30d' = '7d',
    limit: number = 10
  ): Promise<TrendingItem[]> {
    this.logger.debug('Getting trending items', { type, period, limit });

    try {
      const timeInterval = {
        '24h': '1 day',
        '7d': '7 days', 
        '30d': '30 days'
      }[period];

      let trending: TrendingItem[] = [];

      if (type === 'server' || type === 'all') {
        const serverTrendingQuery = `
          SELECT 
            s.id, s.name, s.description, u.name as author_name,
            COUNT(ui.id) as total_interactions,
            COUNT(CASE WHEN ui.interaction_type = 'view' THEN 1 END) as views,
            COUNT(CASE WHEN ui.interaction_type = 'install' THEN 1 END) as installs,
            s.star_count as stars,
            -- Calculate trend score based on recent activity vs historical average
            COUNT(ui.id)::float / GREATEST(1, s.download_count::float / 30) as trend_score
          FROM mcp_servers s
          LEFT JOIN users u ON s.author_id = u.id
          LEFT JOIN user_interactions ui ON s.id = ui.resource_id 
            AND ui.resource_type = 'server'
            AND ui.timestamp >= NOW() - INTERVAL '${timeInterval}'
          WHERE s.status = 'active'
          GROUP BY s.id, u.name
          HAVING COUNT(ui.id) > 0
          ORDER BY trend_score DESC, total_interactions DESC
          LIMIT $1
        `;

        const serverResult = await this.pool.query(serverTrendingQuery, [limit]);
        
        trending.push(...serverResult.rows.map(row => ({
          id: row.id,
          type: 'server' as const,
          name: row.name,
          description: row.description,
          author_name: row.author_name,
          trend_score: parseFloat(row.trend_score),
          growth_rate: parseFloat(row.trend_score) - 1, // Simplified growth calculation
          period,
          metrics: {
            views: parseInt(row.views),
            installs: parseInt(row.installs),
            stars: parseInt(row.stars)
          }
        })));
      }

      if (type === 'workflow' || type === 'all') {
        const workflowTrendingQuery = `
          SELECT 
            w.id, w.name, w.description, u.name as author_name,
            COUNT(ui.id) as total_interactions,
            COUNT(CASE WHEN ui.interaction_type = 'view' THEN 1 END) as views,
            COUNT(CASE WHEN ui.interaction_type = 'execute' THEN 1 END) as executions,
            w.star_count as stars,
            COUNT(ui.id)::float / GREATEST(1, w.execution_count::float / 30) as trend_score
          FROM mcp_workflows w
          LEFT JOIN users u ON w.user_id = u.id
          LEFT JOIN user_interactions ui ON w.id = ui.resource_id 
            AND ui.resource_type = 'workflow'
            AND ui.timestamp >= NOW() - INTERVAL '${timeInterval}'
          WHERE w.status = 'published' AND w.is_public = true
          GROUP BY w.id, u.name
          HAVING COUNT(ui.id) > 0
          ORDER BY trend_score DESC, total_interactions DESC
          LIMIT $1
        `;

        const workflowResult = await this.pool.query(workflowTrendingQuery, [limit]);
        
        trending.push(...workflowResult.rows.map(row => ({
          id: row.id,
          type: 'workflow' as const,
          name: row.name,
          description: row.description,
          author_name: row.author_name,
          trend_score: parseFloat(row.trend_score),
          growth_rate: parseFloat(row.trend_score) - 1,
          period,
          metrics: {
            views: parseInt(row.views),
            installs: 0,
            stars: parseInt(row.stars),
            executions: parseInt(row.executions)
          }
        })));
      }

      // Sort by trend score and return top results
      return trending
        .sort((a, b) => b.trend_score - a.trend_score)
        .slice(0, limit);

    } catch (error) {
      this.logger.error('Failed to get trending items:', error);
      throw error;
    }
  }

  /**
   * Fork workflow for user
   */
  async forkWorkflow(userId: string, workflowId: string, newName?: string): Promise<MCPWorkflow> {
    this.logger.debug('Forking workflow', { userId, workflowId, newName });

    try {
      // Get original workflow
      const originalQuery = `
        SELECT * FROM mcp_workflows 
        WHERE id = $1 AND (is_public = true OR user_id = $2)
      `;
      
      const originalResult = await this.pool.query(originalQuery, [workflowId, userId]);
      
      if (originalResult.rows.length === 0) {
        throw new Error('Workflow not found or not accessible');
      }

      const original = originalResult.rows[0];

      // Create forked workflow
      const forkQuery = `
        INSERT INTO mcp_workflows (
          user_id, name, description, definition, is_template, is_public,
          timeout_seconds, retry_policy, metadata, tags
        ) VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, $9)
        RETURNING *
      `;

      const forkName = newName || `${original.name} (Fork)`;
      const forkMetadata = {
        ...original.metadata,
        forked_from: workflowId,
        forked_at: new Date()
      };

      const forkResult = await this.pool.query(forkQuery, [
        userId,
        forkName,
        original.description,
        original.definition,
        original.is_template,
        original.timeout_seconds,
        original.retry_policy,
        JSON.stringify(forkMetadata),
        original.tags
      ]);

      // Update original workflow fork count
      await this.pool.query(
        'UPDATE mcp_workflows SET fork_count = fork_count + 1 WHERE id = $1',
        [workflowId]
      );

      // Emit fork event
      await this.eventBus.emit({
        type: 'mcp.workflow.forked',
        timestamp: new Date(),
        data: {
          originalWorkflowId: workflowId,
          forkedWorkflowId: forkResult.rows[0].id,
          userId,
          newName: forkName
        }
      });

      return this.mapWorkflowFromDB(forkResult.rows[0]);
    } catch (error) {
      this.logger.error('Failed to fork workflow:', error);
      throw error;
    }
  }

  /**
   * Get community leaderboard
   */
  async getLeaderboard(
    type: 'contributors' | 'popular_servers' | 'active_users' = 'contributors',
    period: string = 'all_time',
    limit: number = 20
  ): Promise<Array<{
    rank: number;
    user_id?: string;
    server_id?: string;
    name: string;
    score: number;
    change_from_last_period?: number;
  }>> {
    try {
      let query = '';
      
      switch (type) {
        case 'contributors':
          query = `
            SELECT 
              u.id as user_id,
              u.name,
              (
                COUNT(DISTINCT s.id) * 10 +
                COUNT(DISTINCT w.id) * 5 +
                COUNT(DISTINCT r.id) * 2 +
                COALESCE(SUM(s.star_count), 0)
              ) as score
            FROM users u
            LEFT JOIN mcp_servers s ON u.id = s.author_id AND s.status = 'active'
            LEFT JOIN mcp_workflows w ON u.id = w.user_id AND w.is_public = true
            LEFT JOIN server_ratings r ON u.id = r.user_id
            GROUP BY u.id, u.name
            HAVING score > 0
            ORDER BY score DESC
            LIMIT $1
          `;
          break;

        case 'popular_servers':
          query = `
            SELECT 
              s.id as server_id,
              s.display_name as name,
              (s.download_count + s.star_count * 5 + s.rating_average * s.rating_count) as score
            FROM mcp_servers s
            WHERE s.status = 'active'
            ORDER BY score DESC
            LIMIT $1
          `;
          break;

        case 'active_users':
          query = `
            SELECT 
              u.id as user_id,
              u.name,
              COUNT(ui.id) as score
            FROM users u
            JOIN user_interactions ui ON u.id = ui.user_id
            WHERE ui.timestamp >= NOW() - INTERVAL '30 days'
            GROUP BY u.id, u.name
            ORDER BY score DESC
            LIMIT $1
          `;
          break;
      }

      const result = await this.pool.query(query, [limit]);
      
      return result.rows.map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        server_id: row.server_id,
        name: row.name,
        score: parseInt(row.score),
        change_from_last_period: 0 // TODO: Implement period comparison
      }));
    } catch (error) {
      this.logger.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Check and award achievements
   */
  private async checkReviewAchievements(userId: string): Promise<void> {
    try {
      // Check for review-related achievements
      const reviewCountQuery = 'SELECT COUNT(*) as count FROM server_ratings WHERE user_id = $1';
      const reviewCountResult = await this.pool.query(reviewCountQuery, [userId]);
      const reviewCount = parseInt(reviewCountResult.rows[0]?.count) || 0;

      if (reviewCount === 1) {
        await this.awardAchievement(userId, 'FIRST_REVIEW');
      } else if (reviewCount === 10) {
        await this.awardAchievement(userId, 'HELPFUL_REVIEWER');
      } else if (reviewCount === 50) {
        await this.awardAchievement(userId, 'COMMUNITY_REVIEWER');
      }
    } catch (error) {
      this.logger.error('Failed to check review achievements:', error);
    }
  }

  /**
   * Award achievement to user
   */
  private async awardAchievement(userId: string, achievementKey: string): Promise<void> {
    try {
      // Check if user already has this achievement
      const existingQuery = `
        SELECT id FROM user_achievements 
        WHERE user_id = $1 AND achievement_key = $2
      `;
      
      const existing = await this.pool.query(existingQuery, [userId, achievementKey]);
      
      if (existing.rows.length === 0) {
        await this.pool.query(`
          INSERT INTO user_achievements (user_id, achievement_key, earned_at)
          VALUES ($1, $2, NOW())
        `, [userId, achievementKey]);

        // Emit achievement event
        await this.eventBus.emit({
          type: 'mcp.achievement.earned',
          timestamp: new Date(),
          data: {
            userId,
            achievementKey,
            earnedAt: new Date()
          }
        });

        this.logger.info('Achievement awarded', { userId, achievementKey });
      }
    } catch (error) {
      this.logger.error('Failed to award achievement:', error);
    }
  }

  /**
   * Setup event listeners for community features
   */
  private setupEventListeners(): void {
    // Listen for server creation to award achievements
    this.eventBus.on('mcp.server.created', async (event: any) => {
      const { authorId } = event.data;
      if (authorId) {
        await this.checkServerAchievements(authorId);
      }
    });

    // Listen for workflow creation
    this.eventBus.on('mcp.workflow.created', async (event: any) => {
      const { userId } = event.data;
      if (userId) {
        await this.checkWorkflowAchievements(userId);
      }
    });
  }

  /**
   * Helper methods
   */
  private async getUserAchievements(userId: string): Promise<CommunityAchievement[]> {
    try {
      const query = `
        SELECT achievement_key, earned_at
        FROM user_achievements 
        WHERE user_id = $1
        ORDER BY earned_at DESC
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      return result.rows.map(row => {
        const achievement = this.ACHIEVEMENTS[row.achievement_key as keyof typeof this.ACHIEVEMENTS];
        return {
          id: row.achievement_key,
          name: achievement?.name || 'Unknown Achievement',
          description: achievement?.description || '',
          icon: achievement?.icon || '🏆',
          rarity: achievement?.rarity || 'common',
          earned_at: row.earned_at
        };
      });
    } catch (error) {
      this.logger.error('Failed to get user achievements:', error);
      return [];
    }
  }

  private calculateReputationScore(metrics: any): number {
    const weights = {
      servers_published: 20,
      total_downloads: 0.1,
      total_stars_received: 2,
      workflows_shared: 5,
      contributions_this_month: 3
    };

    return Math.floor(
      metrics.servers_published * weights.servers_published +
      metrics.total_downloads * weights.total_downloads +
      metrics.total_stars_received * weights.total_stars_received +
      metrics.workflows_shared * weights.workflows_shared +
      metrics.contributions_this_month * weights.contributions_this_month
    );
  }

  private async updateServerRatingAverage(serverId: string): Promise<void> {
    await this.pool.query(`
      UPDATE mcp_servers 
      SET 
        rating_average = (
          SELECT AVG(rating)::NUMERIC(3,2) 
          FROM server_ratings 
          WHERE server_id = $1
        ),
        rating_count = (
          SELECT COUNT(*) 
          FROM server_ratings 
          WHERE server_id = $1
        )
      WHERE id = $1
    `, [serverId]);
  }

  private async checkServerAchievements(userId: string): Promise<void> {
    try {
      const serverCountQuery = 'SELECT COUNT(*) as count FROM mcp_servers WHERE author_id = $1';
      const result = await this.pool.query(serverCountQuery, [userId]);
      const serverCount = parseInt(result.rows[0]?.count) || 0;

      if (serverCount === 1) {
        await this.awardAchievement(userId, 'FIRST_SERVER');
      }
    } catch (error) {
      this.logger.error('Failed to check server achievements:', error);
    }
  }

  private async checkWorkflowAchievements(userId: string): Promise<void> {
    try {
      const workflowCountQuery = 'SELECT COUNT(*) as count FROM mcp_workflows WHERE user_id = $1';
      const result = await this.pool.query(workflowCountQuery, [userId]);
      const workflowCount = parseInt(result.rows[0]?.count) || 0;

      if (workflowCount === 50) {
        await this.awardAchievement(userId, 'WORKFLOW_MASTER');
      }
    } catch (error) {
      this.logger.error('Failed to check workflow achievements:', error);
    }
  }

  private mapReviewFromDB(row: any): ServerReview {
    return {
      id: row.id,
      user_id: row.user_id,
      server_id: row.server_id,
      rating: parseInt(row.rating),
      review_title: row.review_title,
      review_text: row.review_text,
      is_verified_user: row.is_verified_purchase || false,
      helpful_count: parseInt(row.helpful_count) || 0,
      replies: [], // TODO: Implement review replies
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapCollectionFromDB(row: any): CommunityCollection {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      is_public: row.is_public,
      servers: row.servers || [],
      workflows: row.workflows || [],
      tags: row.tags || [],
      star_count: parseInt(row.star_count) || 0,
      fork_count: parseInt(row.fork_count) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapWorkflowFromDB(row: any): MCPWorkflow {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      definition: row.definition,
      version: parseInt(row.version) || 1,
      is_template: row.is_template,
      is_public: row.is_public,
      template_id: row.template_id,
      timeout_seconds: parseInt(row.timeout_seconds) || 300,
      retry_policy: row.retry_policy,
      execution_count: parseInt(row.execution_count) || 0,
      success_count: parseInt(row.success_count) || 0,
      avg_execution_time_ms: parseInt(row.avg_execution_time_ms) || 0,
      last_executed: row.last_executed,
      star_count: parseInt(row.star_count) || 0,
      fork_count: parseInt(row.fork_count) || 0,
      download_count: parseInt(row.download_count) || 0,
      status: row.status,
      metadata: row.metadata,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

/**
 * Factory function to create community features manager
 */
export function createMCPCommunityFeatures(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): MCPCommunityFeatures {
  return new MCPCommunityFeatures(pool, logger, errorManager, eventBus);
}