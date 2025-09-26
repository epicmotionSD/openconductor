/**
 * OpenConductor MCP Analytics Engine
 * 
 * Comprehensive analytics and usage tracking for MCP server interactions.
 * Provides insights for users, platform optimization, and business intelligence.
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export interface AnalyticsEvent {
  user_id?: string;
  event_type: 'view' | 'install' | 'uninstall' | 'rate' | 'star' | 'fork' | 'execute' | 'search';
  resource_type: 'server' | 'workflow' | 'tool' | 'template';
  resource_id: string;
  session_id?: string;
  duration_ms?: number;
  outcome: 'success' | 'failure' | 'abandoned';
  metadata?: any;
  timestamp: Date;
}

export interface UserAnalytics {
  user_id: string;
  period: string;
  metrics: {
    servers_discovered: number;
    servers_installed: number;
    workflows_created: number;
    workflows_executed: number;
    total_execution_time: number;
    success_rate: number;
    favorite_categories: string[];
    activity_score: number;
  };
  behavior_patterns: {
    most_active_time: string;
    preferred_complexity: 'simple' | 'moderate' | 'complex';
    collaboration_level: 'individual' | 'team' | 'community';
    learning_stage: 'exploring' | 'building' | 'optimizing' | 'expert';
  };
  recommendations: {
    suggested_servers: string[];
    suggested_workflows: string[];
    learning_resources: string[];
    optimization_tips: string[];
  };
}

export interface PlatformAnalytics {
  period: string;
  user_metrics: {
    total_users: number;
    active_users: number;
    new_users: number;
    returning_users: number;
    user_retention_rate: number;
  };
  server_metrics: {
    total_servers: number;
    active_servers: number;
    new_servers: number;
    popular_servers: Array<{ id: string; name: string; installations: number }>;
    trending_categories: Array<{ category: string; growth_rate: number }>;
  };
  workflow_metrics: {
    total_workflows: number;
    public_workflows: number;
    template_workflows: number;
    total_executions: number;
    success_rate: number;
    avg_execution_time: number;
  };
  engagement_metrics: {
    search_queries: number;
    server_installations: number;
    workflow_creations: number;
    community_interactions: number;
    support_requests: number;
  };
}

export interface SearchAnalytics {
  period: string;
  total_searches: number;
  unique_searchers: number;
  semantic_searches: number;
  avg_response_time: number;
  top_queries: Array<{ query: string; count: number; success_rate: number }>;
  popular_filters: Array<{ filter: string; usage_count: number }>;
  conversion_rates: {
    search_to_view: number;
    view_to_install: number;
    install_to_usage: number;
  };
  optimization_insights: {
    low_performing_queries: string[];
    suggested_improvements: string[];
    trending_topics: string[];
  };
}

/**
 * MCP Analytics Engine
 */
export class MCPAnalyticsEngine {
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;

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
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    this.logger.debug('Tracking analytics event', {
      eventType: event.event_type,
      resourceType: event.resource_type,
      userId: event.user_id
    });

    try {
      await this.pool.query(`
        INSERT INTO user_interactions (
          user_id, interaction_type, resource_type, resource_id,
          session_id, duration_ms, outcome, metadata, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        event.user_id,
        event.event_type,
        event.resource_type,
        event.resource_id,
        event.session_id,
        event.duration_ms,
        event.outcome,
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.timestamp
      ]);

      // Emit analytics event for real-time processing
      await this.eventBus.emit({
        type: 'mcp.analytics.event',
        timestamp: new Date(),
        data: event
      });

    } catch (error) {
      this.logger.error('Failed to track analytics event:', error);
      // Don't throw - analytics failures shouldn't break main functionality
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string, period: string = 'last_30_days'): Promise<UserAnalytics> {
    this.logger.debug('Getting user analytics', { userId, period });

    try {
      const dateFilter = this.getPeriodDateFilter(period);
      
      // Get basic metrics
      const metricsQuery = `
        SELECT 
          COUNT(CASE WHEN interaction_type = 'view' AND resource_type = 'server' THEN 1 END) as servers_discovered,
          COUNT(CASE WHEN interaction_type = 'install' AND resource_type = 'server' THEN 1 END) as servers_installed,
          COUNT(CASE WHEN interaction_type = 'view' AND resource_type = 'workflow' THEN 1 END) as workflows_created,
          COUNT(CASE WHEN interaction_type = 'execute' AND resource_type = 'workflow' THEN 1 END) as workflows_executed,
          AVG(duration_ms) as avg_duration,
          COUNT(CASE WHEN outcome = 'success' THEN 1 END)::float / COUNT(*) as success_rate
        FROM user_interactions 
        WHERE user_id = $1 ${dateFilter}
      `;

      const metricsResult = await this.pool.query(metricsQuery, [userId]);
      const metrics = metricsResult.rows[0];

      // Get favorite categories
      const categoriesQuery = `
        SELECT unnest(s.categories) as category, COUNT(*) as count
        FROM user_interactions ui
        JOIN mcp_servers s ON ui.resource_id = s.id
        WHERE ui.user_id = $1 
          AND ui.resource_type = 'server' 
          AND ui.interaction_type IN ('view', 'install')
          ${dateFilter}
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
      `;

      const categoriesResult = await this.pool.query(categoriesQuery, [userId]);
      const favoriteCategories = categoriesResult.rows.map(row => row.category);

      // Analyze behavior patterns
      const behaviorPatterns = await this.analyzeBehaviorPatterns(userId, dateFilter);

      // Generate recommendations
      const recommendations = await this.generateUserRecommendations(userId, favoriteCategories);

      return {
        user_id: userId,
        period,
        metrics: {
          servers_discovered: parseInt(metrics.servers_discovered) || 0,
          servers_installed: parseInt(metrics.servers_installed) || 0,
          workflows_created: parseInt(metrics.workflows_created) || 0,
          workflows_executed: parseInt(metrics.workflows_executed) || 0,
          total_execution_time: parseInt(metrics.avg_duration) || 0,
          success_rate: parseFloat(metrics.success_rate) || 0,
          favorite_categories: favoriteCategories,
          activity_score: this.calculateActivityScore(metrics)
        },
        behavior_patterns: behaviorPatterns,
        recommendations
      };
    } catch (error) {
      this.logger.error('Failed to get user analytics:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'user-analytics',
        userId,
        period
      });
    }
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(period: string = 'last_30_days'): Promise<PlatformAnalytics> {
    this.logger.debug('Getting platform analytics', { period });

    try {
      const dateFilter = this.getPeriodDateFilter(period);

      // User metrics
      const userMetrics = await this.getUserMetrics(dateFilter);
      
      // Server metrics
      const serverMetrics = await this.getServerMetrics(dateFilter);
      
      // Workflow metrics
      const workflowMetrics = await this.getWorkflowMetrics(dateFilter);
      
      // Engagement metrics
      const engagementMetrics = await this.getEngagementMetrics(dateFilter);

      return {
        period,
        user_metrics: userMetrics,
        server_metrics: serverMetrics,
        workflow_metrics: workflowMetrics,
        engagement_metrics: engagementMetrics
      };
    } catch (error) {
      this.logger.error('Failed to get platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(period: string = 'last_30_days'): Promise<SearchAnalytics> {
    this.logger.debug('Getting search analytics', { period });

    try {
      const dateFilter = this.getPeriodDateFilter(period);

      // Basic search metrics
      const searchMetricsQuery = `
        SELECT 
          COUNT(*) as total_searches,
          COUNT(DISTINCT user_id) as unique_searchers,
          COUNT(CASE WHEN metadata->>'semantic_search' = 'true' THEN 1 END) as semantic_searches,
          AVG(duration_ms) as avg_response_time
        FROM user_interactions 
        WHERE interaction_type = 'search' ${dateFilter}
      `;

      const searchMetricsResult = await this.pool.query(searchMetricsQuery);
      const searchMetrics = searchMetricsResult.rows[0];

      // Top queries
      const topQueriesQuery = `
        SELECT 
          metadata->>'query' as query,
          COUNT(*) as count,
          COUNT(CASE WHEN outcome = 'success' THEN 1 END)::float / COUNT(*) as success_rate
        FROM user_interactions 
        WHERE interaction_type = 'search' 
          AND metadata->>'query' IS NOT NULL
          ${dateFilter}
        GROUP BY metadata->>'query'
        ORDER BY count DESC
        LIMIT 10
      `;

      const topQueriesResult = await this.pool.query(topQueriesQuery);
      const topQueries = topQueriesResult.rows.map(row => ({
        query: row.query,
        count: parseInt(row.count),
        success_rate: parseFloat(row.success_rate) || 0
      }));

      // Conversion rates
      const conversionRates = await this.calculateSearchConversionRates(dateFilter);

      return {
        period,
        total_searches: parseInt(searchMetrics.total_searches) || 0,
        unique_searchers: parseInt(searchMetrics.unique_searchers) || 0,
        semantic_searches: parseInt(searchMetrics.semantic_searches) || 0,
        avg_response_time: parseFloat(searchMetrics.avg_response_time) || 0,
        top_queries: topQueries,
        popular_filters: [], // TODO: Implement filter tracking
        conversion_rates: conversionRates,
        optimization_insights: {
          low_performing_queries: topQueries.filter(q => q.success_rate < 0.5).map(q => q.query),
          suggested_improvements: [],
          trending_topics: topQueries.slice(0, 5).map(q => q.query)
        }
      };
    } catch (error) {
      this.logger.error('Failed to get search analytics:', error);
      throw error;
    }
  }

  /**
   * Get server performance analytics
   */
  async getServerPerformanceAnalytics(serverId?: string): Promise<{
    server_id?: string;
    performance_metrics: {
      total_installations: number;
      total_views: number;
      total_executions: number;
      avg_response_time: number;
      success_rate: number;
      user_satisfaction: number;
    };
    usage_trends: Array<{
      date: string;
      installations: number;
      executions: number;
      unique_users: number;
    }>;
    user_feedback: {
      avg_rating: number;
      total_ratings: number;
      recent_reviews: Array<{
        rating: number;
        review: string;
        created_at: Date;
      }>;
    };
  }> {
    try {
      let serverFilter = '';
      const params = [];
      
      if (serverId) {
        serverFilter = 'AND resource_id = $2';
        params.push(serverId);
      }

      // Performance metrics
      const metricsQuery = `
        SELECT 
          COUNT(CASE WHEN interaction_type = 'install' THEN 1 END) as total_installations,
          COUNT(CASE WHEN interaction_type = 'view' THEN 1 END) as total_views,
          COUNT(CASE WHEN interaction_type = 'execute' THEN 1 END) as total_executions,
          AVG(duration_ms) as avg_response_time,
          COUNT(CASE WHEN outcome = 'success' THEN 1 END)::float / COUNT(*) as success_rate
        FROM user_interactions 
        WHERE resource_type = 'server' 
          AND timestamp >= NOW() - INTERVAL '30 days'
          ${serverFilter}
      `;

      const metricsResult = await this.pool.query(metricsQuery, params);
      const performanceMetrics = metricsResult.rows[0];

      // Usage trends (daily data for last 30 days)
      const trendsQuery = `
        SELECT 
          DATE(timestamp) as date,
          COUNT(CASE WHEN interaction_type = 'install' THEN 1 END) as installations,
          COUNT(CASE WHEN interaction_type = 'execute' THEN 1 END) as executions,
          COUNT(DISTINCT user_id) as unique_users
        FROM user_interactions 
        WHERE resource_type = 'server' 
          AND timestamp >= NOW() - INTERVAL '30 days'
          ${serverFilter}
        GROUP BY DATE(timestamp)
        ORDER BY date
      `;

      const trendsResult = await this.pool.query(trendsQuery, params);
      const usageTrends = trendsResult.rows.map(row => ({
        date: row.date,
        installations: parseInt(row.installations),
        executions: parseInt(row.executions),
        unique_users: parseInt(row.unique_users)
      }));

      // User feedback
      let userFeedback = {
        avg_rating: 0,
        total_ratings: 0,
        recent_reviews: []
      };

      if (serverId) {
        const feedbackQuery = `
          SELECT 
            AVG(rating) as avg_rating,
            COUNT(*) as total_ratings
          FROM server_ratings 
          WHERE server_id = $1
        `;

        const reviewsQuery = `
          SELECT rating, review_text, created_at
          FROM server_ratings 
          WHERE server_id = $1 
            AND review_text IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 5
        `;

        const [feedbackResult, reviewsResult] = await Promise.all([
          this.pool.query(feedbackQuery, [serverId]),
          this.pool.query(reviewsQuery, [serverId])
        ]);

        userFeedback = {
          avg_rating: parseFloat(feedbackResult.rows[0]?.avg_rating) || 0,
          total_ratings: parseInt(feedbackResult.rows[0]?.total_ratings) || 0,
          recent_reviews: reviewsResult.rows.map(row => ({
            rating: parseInt(row.rating),
            review: row.review_text,
            created_at: row.created_at
          }))
        };
      }

      return {
        server_id: serverId,
        performance_metrics: {
          total_installations: parseInt(performanceMetrics.total_installations) || 0,
          total_views: parseInt(performanceMetrics.total_views) || 0,
          total_executions: parseInt(performanceMetrics.total_executions) || 0,
          avg_response_time: parseFloat(performanceMetrics.avg_response_time) || 0,
          success_rate: parseFloat(performanceMetrics.success_rate) || 0,
          user_satisfaction: userFeedback.avg_rating / 5 * 100 // Convert to percentage
        },
        usage_trends: usageTrends,
        user_feedback: userFeedback
      };
    } catch (error) {
      this.logger.error('Failed to get server performance analytics:', error);
      throw error;
    }
  }

  /**
   * Generate real-time analytics dashboard data
   */
  async getRealTimeAnalytics(): Promise<{
    active_users: number;
    current_executions: number;
    servers_being_installed: number;
    search_queries_per_minute: number;
    system_health: {
      api_response_time: number;
      database_performance: number;
      error_rate: number;
    };
    live_feed: Array<{
      type: string;
      message: string;
      timestamp: Date;
    }>;
  }> {
    try {
      // Active users (last 5 minutes)
      const activeUsersQuery = `
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM user_interactions 
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
      `;
      
      const activeUsersResult = await this.pool.query(activeUsersQuery);
      const activeUsers = parseInt(activeUsersResult.rows[0]?.active_users) || 0;

      // Current executions
      const executionsQuery = `
        SELECT COUNT(*) as current_executions
        FROM mcp_workflow_executions 
        WHERE status = 'running'
      `;
      
      const executionsResult = await this.pool.query(executionsQuery);
      const currentExecutions = parseInt(executionsResult.rows[0]?.current_executions) || 0;

      // Search queries per minute
      const searchRateQuery = `
        SELECT COUNT(*) as search_count
        FROM user_interactions 
        WHERE interaction_type = 'search' 
          AND timestamp >= NOW() - INTERVAL '1 minute'
      `;
      
      const searchRateResult = await this.pool.query(searchRateQuery);
      const searchQueriesPerMinute = parseInt(searchRateResult.rows[0]?.search_count) || 0;

      // System health metrics (simplified)
      const systemHealth = {
        api_response_time: Math.random() * 100 + 50, // Mock data
        database_performance: Math.random() * 20 + 80, // Mock data
        error_rate: Math.random() * 5 // Mock data
      };

      // Live activity feed
      const liveFeedQuery = `
        SELECT 
          interaction_type,
          resource_type,
          timestamp,
          metadata
        FROM user_interactions 
        WHERE timestamp >= NOW() - INTERVAL '10 minutes'
        ORDER BY timestamp DESC
        LIMIT 10
      `;
      
      const liveFeedResult = await this.pool.query(liveFeedQuery);
      const liveFeed = liveFeedResult.rows.map(row => ({
        type: `${row.interaction_type}_${row.resource_type}`,
        message: this.formatLiveFeedMessage(row),
        timestamp: row.timestamp
      }));

      return {
        active_users: activeUsers,
        current_executions: currentExecutions,
        servers_being_installed: 0, // TODO: Track installation status
        search_queries_per_minute: searchQueriesPerMinute,
        system_health: systemHealth,
        live_feed: liveFeed
      };
    } catch (error) {
      this.logger.error('Failed to get real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Track user journey and conversion funnel
   */
  async trackUserJourney(userId: string): Promise<{
    journey_stage: 'discovery' | 'evaluation' | 'adoption' | 'advocacy';
    conversion_funnel: {
      discovered_servers: number;
      evaluated_servers: number;
      installed_servers: number;
      actively_used_servers: number;
    };
    engagement_score: number;
    next_recommended_action: string;
  }> {
    try {
      // Get user's interaction history
      const journeyQuery = `
        SELECT 
          interaction_type,
          resource_type,
          COUNT(*) as count,
          MAX(timestamp) as last_interaction
        FROM user_interactions 
        WHERE user_id = $1
        GROUP BY interaction_type, resource_type
      `;

      const journeyResult = await this.pool.query(journeyQuery, [userId]);
      const interactions = Object.fromEntries(
        journeyResult.rows.map(row => [
          `${row.interaction_type}_${row.resource_type}`,
          {
            count: parseInt(row.count),
            last_interaction: row.last_interaction
          }
        ])
      );

      // Calculate conversion funnel
      const conversionFunnel = {
        discovered_servers: interactions.view_server?.count || 0,
        evaluated_servers: Math.min(interactions.view_server?.count || 0, 10), // Assume 10+ views = evaluation
        installed_servers: interactions.install_server?.count || 0,
        actively_used_servers: interactions.execute_workflow?.count || 0
      };

      // Determine journey stage
      let journeyStage: 'discovery' | 'evaluation' | 'adoption' | 'advocacy' = 'discovery';
      if (conversionFunnel.actively_used_servers > 0) {
        journeyStage = 'advocacy';
      } else if (conversionFunnel.installed_servers > 0) {
        journeyStage = 'adoption';
      } else if (conversionFunnel.evaluated_servers > 3) {
        journeyStage = 'evaluation';
      }

      // Calculate engagement score (0-100)
      const engagementScore = Math.min(100, 
        (conversionFunnel.discovered_servers * 1) +
        (conversionFunnel.evaluated_servers * 2) +
        (conversionFunnel.installed_servers * 5) +
        (conversionFunnel.actively_used_servers * 10)
      );

      // Recommend next action
      const nextRecommendedAction = this.getNextRecommendedAction(journeyStage, conversionFunnel);

      return {
        journey_stage: journeyStage,
        conversion_funnel: conversionFunnel,
        engagement_score: engagementScore,
        next_recommended_action: nextRecommendedAction
      };
    } catch (error) {
      this.logger.error('Failed to track user journey:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private getPeriodDateFilter(period: string): string {
    switch (period) {
      case 'last_7_days':
        return "AND timestamp >= NOW() - INTERVAL '7 days'";
      case 'last_30_days':
        return "AND timestamp >= NOW() - INTERVAL '30 days'";
      case 'last_90_days':
        return "AND timestamp >= NOW() - INTERVAL '90 days'";
      case 'last_year':
        return "AND timestamp >= NOW() - INTERVAL '1 year'";
      default:
        return "AND timestamp >= NOW() - INTERVAL '30 days'";
    }
  }

  private calculateActivityScore(metrics: any): number {
    const weights = {
      servers_discovered: 1,
      servers_installed: 5,
      workflows_created: 3,
      workflows_executed: 2,
      success_rate: 10
    };

    return Math.min(100,
      (parseInt(metrics.servers_discovered) || 0) * weights.servers_discovered +
      (parseInt(metrics.servers_installed) || 0) * weights.servers_installed +
      (parseInt(metrics.workflows_created) || 0) * weights.workflows_created +
      (parseInt(metrics.workflows_executed) || 0) * weights.workflows_executed +
      (parseFloat(metrics.success_rate) || 0) * weights.success_rate
    );
  }

  private async analyzeBehaviorPatterns(userId: string, dateFilter: string): Promise<any> {
    // Simplified behavior analysis
    return {
      most_active_time: 'afternoon', // TODO: Implement time analysis
      preferred_complexity: 'moderate', // TODO: Analyze workflow complexity
      collaboration_level: 'individual', // TODO: Analyze sharing patterns
      learning_stage: 'building' // TODO: Analyze progression
    };
  }

  private async generateUserRecommendations(userId: string, favoriteCategories: string[]): Promise<any> {
    // Simplified recommendations
    return {
      suggested_servers: [], // TODO: Implement ML recommendations
      suggested_workflows: [], // TODO: Implement workflow suggestions
      learning_resources: [], // TODO: Curate learning content
      optimization_tips: [] // TODO: Generate optimization advice
    };
  }

  private async getUserMetrics(dateFilter: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN timestamp >= NOW() - INTERVAL '7 days' THEN user_id END) as active_users,
        COUNT(DISTINCT CASE WHEN timestamp >= NOW() - INTERVAL '1 day' THEN user_id END) as new_users
      FROM user_interactions 
      WHERE 1=1 ${dateFilter}
    `;

    const result = await this.pool.query(query);
    const metrics = result.rows[0];

    return {
      total_users: parseInt(metrics.total_users) || 0,
      active_users: parseInt(metrics.active_users) || 0,
      new_users: parseInt(metrics.new_users) || 0,
      returning_users: Math.max(0, (parseInt(metrics.active_users) || 0) - (parseInt(metrics.new_users) || 0)),
      user_retention_rate: 0.85 // TODO: Calculate actual retention
    };
  }

  private async getServerMetrics(dateFilter: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT s.id) as total_servers,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_servers,
        COUNT(DISTINCT CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN s.id END) as new_servers
      FROM mcp_servers s
      LEFT JOIN user_interactions ui ON s.id = ui.resource_id AND ui.resource_type = 'server'
      WHERE 1=1 ${dateFilter.replace('timestamp', 'ui.timestamp')}
    `;

    const result = await this.pool.query(query);
    const metrics = result.rows[0];

    return {
      total_servers: parseInt(metrics.total_servers) || 0,
      active_servers: parseInt(metrics.active_servers) || 0,
      new_servers: parseInt(metrics.new_servers) || 0,
      popular_servers: [], // TODO: Implement popularity ranking
      trending_categories: [] // TODO: Implement category trending
    };
  }

  private async getWorkflowMetrics(dateFilter: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_workflows,
        COUNT(CASE WHEN is_public = true THEN 1 END) as public_workflows,
        COUNT(CASE WHEN is_template = true THEN 1 END) as template_workflows,
        SUM(execution_count) as total_executions,
        AVG(CASE WHEN execution_count > 0 THEN success_count::float / execution_count END) as success_rate,
        AVG(avg_execution_time_ms) as avg_execution_time
      FROM mcp_workflows 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

    const result = await this.pool.query(query);
    const metrics = result.rows[0];

    return {
      total_workflows: parseInt(metrics.total_workflows) || 0,
      public_workflows: parseInt(metrics.public_workflows) || 0,
      template_workflows: parseInt(metrics.template_workflows) || 0,
      total_executions: parseInt(metrics.total_executions) || 0,
      success_rate: parseFloat(metrics.success_rate) || 0,
      avg_execution_time: parseInt(metrics.avg_execution_time) || 0
    };
  }

  private async getEngagementMetrics(dateFilter: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(CASE WHEN interaction_type = 'search' THEN 1 END) as search_queries,
        COUNT(CASE WHEN interaction_type = 'install' THEN 1 END) as server_installations,
        COUNT(CASE WHEN interaction_type = 'view' AND resource_type = 'workflow' THEN 1 END) as workflow_creations,
        COUNT(CASE WHEN interaction_type IN ('star', 'rate', 'fork') THEN 1 END) as community_interactions
      FROM user_interactions 
      WHERE 1=1 ${dateFilter}
    `;

    const result = await this.pool.query(query);
    const metrics = result.rows[0];

    return {
      search_queries: parseInt(metrics.search_queries) || 0,
      server_installations: parseInt(metrics.server_installations) || 0,
      workflow_creations: parseInt(metrics.workflow_creations) || 0,
      community_interactions: parseInt(metrics.community_interactions) || 0,
      support_requests: 0 // TODO: Implement support tracking
    };
  }

  private async calculateSearchConversionRates(dateFilter: string): Promise<any> {
    // TODO: Implement conversion rate calculation
    return {
      search_to_view: 0.65,
      view_to_install: 0.25,
      install_to_usage: 0.80
    };
  }

  private formatLiveFeedMessage(row: any): string {
    const action = row.interaction_type;
    const resource = row.resource_type;
    
    switch (`${action}_${resource}`) {
      case 'install_server':
        return 'Server installed';
      case 'view_server':
        return 'Server viewed';
      case 'execute_workflow':
        return 'Workflow executed';
      case 'star_server':
        return 'Server starred';
      default:
        return `${action} ${resource}`;
    }
  }

  private getNextRecommendedAction(stage: string, funnel: any): string {
    switch (stage) {
      case 'discovery':
        return 'Try installing your first MCP server';
      case 'evaluation':
        return 'Install a server that matches your use case';
      case 'adoption':
        return 'Create your first workflow using installed servers';
      case 'advocacy':
        return 'Share your workflows with the community';
      default:
        return 'Explore the MCP ecosystem';
    }
  }
}

/**
 * Factory function to create analytics engine
 */
export function createMCPAnalyticsEngine(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): MCPAnalyticsEngine {
  return new MCPAnalyticsEngine(pool, logger, errorManager, eventBus);
}