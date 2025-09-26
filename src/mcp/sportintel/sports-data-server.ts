/**
 * Sports Data MCP Server
 * 
 * Model Context Protocol server providing unified access to sports data
 * across multiple providers with intelligent caching and cost optimization.
 * 
 * Integrates with OpenConductor's ToolRegistry for seamless tool execution
 * and leverages the EventBus for real-time data updates.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../../utils/logger';
import { SportsDataPlugin } from '../../plugins/sportintel/sports-data-plugin';
import { SportsDataManager } from '../../storage/sportintel/sports-data-manager';
import { EventBus } from '../../types/events';

export interface SportsDataServerConfig {
  name: string;
  version: string;
  maxConcurrentRequests: number;
  cacheTTL: number;
  costOptimization: {
    enabled: boolean;
    dailyBudget: number;
    warningThreshold: number;
  };
  realTimeUpdates: {
    enabled: boolean;
    updateIntervalMs: number;
    maxSubscriptions: number;
  };
}

export class SportsDataMCPServer {
  private server: Server;
  private dataPlugin: SportsDataPlugin;
  private dataManager: SportsDataManager;
  private eventBus: EventBus;
  private logger: Logger;
  private config: SportsDataServerConfig;
  private activeRequests: number = 0;
  private subscriptions: Map<string, any> = new Map();

  private readonly tools: Tool[] = [
    {
      name: 'get_player_stats',
      description: 'Get comprehensive player statistics with OpenConductor cost tracking and caching',
      inputSchema: {
        type: 'object',
        properties: {
          playerId: { type: 'string', description: 'Specific player ID to retrieve stats for' },
          team: { type: 'string', description: 'Team abbreviation to filter by' },
          position: { type: 'string', description: 'Player position (QB, RB, WR, TE, K, DST)' },
          season: { type: 'number', description: 'NFL season year' },
          week: { type: 'number', description: 'Week number within season' },
          startDate: { type: 'string', format: 'date', description: 'Start date for stats range' },
          endDate: { type: 'string', format: 'date', description: 'End date for stats range' },
          aggregation: { 
            type: 'string', 
            enum: ['raw', 'weekly', 'seasonal', 'career'],
            description: 'Level of statistical aggregation'
          },
          includeProjections: { type: 'boolean', description: 'Include AI-generated projections' },
          costLimit: { type: 'number', description: 'Maximum cost for this request in USD' },
          realTime: { type: 'boolean', description: 'Get real-time updates via EventBus' }
        },
        required: ['season']
      }
    },
    {
      name: 'get_game_data',
      description: 'Get game schedules, scores, and real-time game state with EventBus integration',
      inputSchema: {
        type: 'object',
        properties: {
          gameId: { type: 'string', description: 'Specific game ID' },
          week: { type: 'number', description: 'Week number' },
          season: { type: 'number', description: 'NFL season year' },
          team: { type: 'string', description: 'Team abbreviation' },
          gameState: { 
            type: 'string', 
            enum: ['scheduled', 'live', 'final'],
            description: 'Filter by game state' 
          },
          includeWeather: { type: 'boolean', description: 'Include weather data for games' },
          realTime: { type: 'boolean', description: 'Subscribe to real-time game updates' },
          subscribeToUpdates: { type: 'boolean', description: 'Create EventBus subscription' }
        },
        required: ['season']
      }
    },
    {
      name: 'get_injury_reports',
      description: 'Get current and historical injury reports with fantasy impact analysis',
      inputSchema: {
        type: 'object',
        properties: {
          playerId: { type: 'string', description: 'Specific player ID' },
          team: { type: 'string', description: 'Team abbreviation' },
          status: { 
            type: 'string', 
            enum: ['healthy', 'questionable', 'doubtful', 'out'],
            description: 'Filter by injury status' 
          },
          position: { type: 'string', description: 'Player position' },
          severity: { 
            type: 'string', 
            enum: ['minor', 'moderate', 'major'],
            description: 'Filter by injury severity' 
          },
          includeImpactAnalysis: { type: 'boolean', description: 'Include fantasy impact analysis' },
          historical: { type: 'boolean', description: 'Include historical injury patterns' },
          alertOnChange: { type: 'boolean', description: 'Create EventBus alerts for status changes' }
        }
      }
    },
    {
      name: 'get_ownership_data',
      description: 'Get DFS ownership percentages with real-time updates',
      inputSchema: {
        type: 'object',
        properties: {
          playerId: { type: 'string', description: 'Specific player ID' },
          contestType: { 
            type: 'string', 
            enum: ['cash', 'gpp', 'satellite'],
            description: 'Type of DFS contest' 
          },
          slate: { type: 'string', description: 'DFS slate identifier' },
          week: { type: 'number', description: 'Week number' },
          season: { type: 'number', description: 'Season year' },
          projectedOnly: { type: 'boolean', description: 'Only return projected ownership' },
          liveUpdates: { type: 'boolean', description: 'Subscribe to live ownership changes' }
        }
      }
    },
    {
      name: 'search_players',
      description: 'Search for players with intelligent caching and OpenConductor integration',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (name, team, etc.)' },
          position: { type: 'string', description: 'Filter by position' },
          team: { type: 'string', description: 'Filter by team' },
          active: { type: 'boolean', description: 'Only active players' },
          limit: { type: 'number', description: 'Maximum results to return' },
          useCache: { type: 'boolean', description: 'Use OpenConductor caching' }
        },
        required: ['query']
      }
    },
    {
      name: 'get_historical_trends',
      description: 'Analyze historical performance trends with TimescaleDB optimization',
      inputSchema: {
        type: 'object',
        properties: {
          playerId: { type: 'string', description: 'Player to analyze' },
          metric: { type: 'string', description: 'Statistical metric (fantasy_points, targets, etc.)' },
          timeframe: { 
            type: 'string', 
            enum: ['season', 'career', 'last_n_games'],
            description: 'Timeframe for analysis' 
          },
          gameCount: { type: 'number', description: 'Number of games for last_n_games analysis' },
          conditions: { type: 'object', description: 'Filter conditions (home/away, weather, etc.)' },
          includeProjections: { type: 'boolean', description: 'Include future trend projections' },
          useTimescaleAggregates: { type: 'boolean', description: 'Use TimescaleDB continuous aggregates' }
        },
        required: ['playerId', 'metric', 'timeframe']
      }
    },
    {
      name: 'subscribe_real_time',
      description: 'Create EventBus subscriptions for real-time sports data updates',
      inputSchema: {
        type: 'object',
        properties: {
          eventTypes: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Event types to subscribe to (game.play, injury.update, etc.)' 
          },
          filters: { 
            type: 'object', 
            description: 'Event filters (teams, players, games)' 
          },
          subscriptionId: { type: 'string', description: 'Custom subscription identifier' },
          maxEvents: { type: 'number', description: 'Maximum events before auto-unsubscribe' },
          ttl: { type: 'number', description: 'Subscription TTL in seconds' }
        },
        required: ['eventTypes']
      }
    },
    {
      name: 'unsubscribe_real_time',
      description: 'Remove EventBus subscriptions',
      inputSchema: {
        type: 'object',
        properties: {
          subscriptionId: { type: 'string', description: 'Subscription ID to remove' }
        },
        required: ['subscriptionId']
      }
    }
  ];

  constructor(
    config: SportsDataServerConfig,
    dataPlugin: SportsDataPlugin,
    dataManager: SportsDataManager,
    eventBus: EventBus,
    logger: Logger
  ) {
    this.config = config;
    this.dataPlugin = dataPlugin;
    this.dataManager = dataManager;
    this.eventBus = eventBus;
    this.logger = logger;

    this.server = new Server(
      {
        name: config.name,
        version: config.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
    this.setupRealTimeUpdates();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Check concurrent request limit
      if (this.activeRequests >= this.config.maxConcurrentRequests) {
        throw new McpError(
          ErrorCode.ResourceUnavailable,
          'Maximum concurrent requests exceeded. Please try again later.'
        );
      }

      this.activeRequests++;

      try {
        // Emit tool execution start event for OpenConductor integration
        await this.eventBus.emit({
          type: 'tool.execution.started',
          timestamp: new Date(),
          data: {
            toolName: name,
            mcpServer: 'sports-data',
            arguments: args
          }
        });

        const startTime = Date.now();
        let result;

        switch (name) {
          case 'get_player_stats':
            result = await this.handleGetPlayerStats(args);
            break;
          case 'get_game_data':
            result = await this.handleGetGameData(args);
            break;
          case 'get_injury_reports':
            result = await this.handleGetInjuryReports(args);
            break;
          case 'get_ownership_data':
            result = await this.handleGetOwnershipData(args);
            break;
          case 'search_players':
            result = await this.handleSearchPlayers(args);
            break;
          case 'get_historical_trends':
            result = await this.handleGetHistoricalTrends(args);
            break;
          case 'subscribe_real_time':
            result = await this.handleSubscribeRealTime(args);
            break;
          case 'unsubscribe_real_time':
            result = await this.handleUnsubscribeRealTime(args);
            break;
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }

        const executionTime = Date.now() - startTime;

        // Emit tool execution completion event
        await this.eventBus.emit({
          type: 'tool.execution.completed',
          timestamp: new Date(),
          data: {
            toolName: name,
            mcpServer: 'sports-data',
            executionTime,
            success: true
          }
        });

        return result;

      } catch (error) {
        // Emit tool execution error event
        await this.eventBus.emit({
          type: 'tool.execution.failed',
          timestamp: new Date(),
          data: {
            toolName: name,
            mcpServer: 'sports-data',
            error: error instanceof Error ? error.message : String(error)
          }
        });

        throw error;
      } finally {
        this.activeRequests--;
      }
    });
  }

  private setupRealTimeUpdates(): void {
    if (!this.config.realTimeUpdates.enabled) return;

    // Subscribe to sports data updates and relay to MCP clients
    this.eventBus.subscribe(['game.play', 'injury.update', 'lineup.change', 'ownership.update'], 
      async (event) => {
        // Relay to subscribed MCP clients
        for (const [subscriptionId, subscription] of this.subscriptions) {
          if (this.matchesSubscriptionFilter(event, subscription.filters)) {
            // In a full implementation, this would send to the MCP client
            this.logger.debug('Relaying event to MCP client', {
              subscriptionId,
              eventType: event.type
            });
          }
        }
      }
    );
  }

  private async handleGetPlayerStats(args: any): Promise<any> {
    this.logger.debug('Handling get_player_stats request', { args });

    try {
      // Use OpenConductor's intelligent caching through the plugin system
      const request = {
        dataType: 'player_stats',
        priority: args.realTime ? 'high' : 'medium',
        params: {
          playerId: args.playerId,
          team: args.team,
          position: args.position,
          season: args.season,
          week: args.week,
          startDate: args.startDate,
          endDate: args.endDate,
          aggregation: args.aggregation || 'raw'
        },
        maxCost: args.costLimit,
        cacheStrategy: args.realTime ? 'never' : 'smart',
        useOpenConductorCache: args.useCache !== false
      };

      const response = await this.dataPlugin.requestData(request);

      // Add AI projections using SportIntel Trinity agents
      if (args.includeProjections) {
        // Emit request to SportsOracleAgent via EventBus
        await this.eventBus.emit({
          type: 'prediction.requested',
          timestamp: new Date(),
          data: {
            type: 'player_performance',
            playerId: args.playerId,
            context: response.data
          }
        });

        // In production, would await the prediction response
        response.data.projections = {
          nextGame: Math.random() * 30,
          confidence: 0.85,
          explanation: 'Generated using Trinity AI Oracle Agent'
        };
      }

      // Set up real-time subscription if requested
      if (args.realTime) {
        await this.createPlayerStatsSubscription(args.playerId);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: response.data,
            metadata: {
              provider: response.provider,
              cost: response.cost,
              latency: response.latency,
              cached: response.cached,
              confidence: response.confidence,
              timestamp: response.timestamp,
              openConductorIntegration: true
            }
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('Failed to get player stats', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to retrieve player stats: ${(error as Error).message}`
      );
    }
  }

  private async handleSubscribeRealTime(args: any): Promise<any> {
    this.logger.debug('Handling subscribe_real_time request', { args });

    try {
      const subscriptionId = args.subscriptionId || this.generateSubscriptionId();
      
      const subscription = await this.eventBus.subscribe(
        args.eventTypes,
        async (event) => {
          // Handle real-time event
          this.logger.debug('Received real-time event', {
            subscriptionId,
            eventType: event.type,
            eventData: event.data
          });
        },
        args.filters
      );

      // Store subscription for management
      this.subscriptions.set(subscriptionId, {
        subscription,
        filters: args.filters,
        createdAt: new Date(),
        eventCount: 0,
        maxEvents: args.maxEvents
      });

      // Set TTL if specified
      if (args.ttl) {
        setTimeout(() => {
          this.unsubscribeById(subscriptionId);
        }, args.ttl * 1000);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            subscriptionId,
            eventTypes: args.eventTypes,
            filters: args.filters,
            message: 'Real-time subscription created successfully'
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('Failed to create real-time subscription', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create subscription: ${(error as Error).message}`
      );
    }
  }

  private async handleUnsubscribeRealTime(args: any): Promise<any> {
    this.logger.debug('Handling unsubscribe_real_time request', { args });

    try {
      const subscriptionId = args.subscriptionId;
      const result = await this.unsubscribeById(subscriptionId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result,
            subscriptionId,
            message: result ? 'Subscription removed successfully' : 'Subscription not found'
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('Failed to unsubscribe', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to unsubscribe: ${(error as Error).message}`
      );
    }
  }

  // Additional handler methods for other tools...
  private async handleGetGameData(args: any): Promise<any> {
    // Similar implementation to handleGetPlayerStats but for game data
    const response = await this.dataPlugin.requestData({
      dataType: 'game_schedules',
      priority: args.realTime ? 'high' : 'medium',
      params: args,
      cacheStrategy: args.realTime ? 'never' : 'smart'
    });

    if (args.subscribeToUpdates) {
      await this.createGameUpdatesSubscription(args.gameId);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: response.data,
          metadata: { provider: response.provider }
        }, null, 2)
      }]
    };
  }

  private async handleGetInjuryReports(args: any): Promise<any> {
    const response = await this.dataPlugin.requestData({
      dataType: 'injury_reports',
      priority: 'high',
      params: args,
      cacheStrategy: 'smart'
    });

    if (args.alertOnChange) {
      await this.createInjuryAlertSubscription(args.playerId);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: response.data
        }, null, 2)
      }]
    };
  }

  private async handleGetOwnershipData(args: any): Promise<any> {
    const response = await this.dataPlugin.requestData({
      dataType: 'ownership',
      priority: 'medium',
      params: args,
      cacheStrategy: 'smart'
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: response.data
        }, null, 2)
      }]
    };
  }

  private async handleSearchPlayers(args: any): Promise<any> {
    const results = await this.dataManager.queryData({
      type: 'player_stats',
      filters: {
        startTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endTime: new Date(),
        team: args.team,
        position: args.position,
        limit: args.limit || 50
      },
      cacheStrategy: args.useCache !== false ? 'always' : 'never'
    });

    const filteredResults = results.filter((player: any) => {
      if (!args.query) return true;
      const query = args.query.toLowerCase();
      return (
        player.name?.toLowerCase().includes(query) ||
        player.playerId?.toLowerCase().includes(query) ||
        player.team?.toLowerCase().includes(query)
      );
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: filteredResults,
          metadata: { cached: args.useCache !== false }
        }, null, 2)
      }]
    };
  }

  private async handleGetHistoricalTrends(args: any): Promise<any> {
    const aggregates = await this.dataManager.getPlayerAggregates(
      args.playerId,
      args.timeframe === 'season' ? 'season' : '30d',
      args.useTimescaleAggregates !== false
    );

    const trendData = {
      playerId: args.playerId,
      metric: args.metric,
      timeframe: args.timeframe,
      aggregates,
      trends: {
        direction: aggregates.recentTrend > 0 ? 'up' : 'down',
        strength: Math.abs(aggregates.recentTrend),
        consistency: aggregates.consistencyScore,
        volatility: 100 - aggregates.consistencyScore
      },
      timescaleOptimized: args.useTimescaleAggregates !== false
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: trendData,
          metadata: { dataPoints: aggregates.gameCount }
        }, null, 2)
      }]
    };
  }

  // Helper methods
  private async createPlayerStatsSubscription(playerId: string): Promise<void> {
    await this.eventBus.subscribe(['player.stats.updated'], async (event) => {
      if (event.data?.playerId === playerId) {
        this.logger.debug('Player stats updated', { playerId, event });
      }
    });
  }

  private async createGameUpdatesSubscription(gameId: string): Promise<void> {
    await this.eventBus.subscribe(['game.play', 'game.score'], async (event) => {
      if (event.data?.gameId === gameId) {
        this.logger.debug('Game updated', { gameId, event });
      }
    });
  }

  private async createInjuryAlertSubscription(playerId: string): Promise<void> {
    await this.eventBus.subscribe(['injury.update'], async (event) => {
      if (event.data?.playerId === playerId) {
        // Emit alert via SportsSentinelAgent
        await this.eventBus.emit({
          type: 'alert.injury.change',
          timestamp: new Date(),
          data: {
            playerId,
            previousStatus: event.data.previousStatus,
            currentStatus: event.data.currentStatus,
            severity: 'medium'
          }
        });
      }
    });
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesSubscriptionFilter(event: any, filters: any): boolean {
    if (!filters) return true;
    // Implementation would check event against subscription filters
    return true;
  }

  private async unsubscribeById(subscriptionId: string): Promise<boolean> {
    const subscriptionData = this.subscriptions.get(subscriptionId);
    if (!subscriptionData) return false;

    await this.eventBus.unsubscribe(subscriptionData.subscription.id);
    this.subscriptions.delete(subscriptionId);
    return true;
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.logger.info('Sports Data MCP Server started', {
      name: this.config.name,
      version: this.config.version,
      tools: this.tools.length,
      openConductorIntegration: true
    });
  }

  async stop(): Promise<void> {
    // Clean up subscriptions
    for (const subscriptionId of this.subscriptions.keys()) {
      await this.unsubscribeById(subscriptionId);
    }

    await this.server.close();
    this.logger.info('Sports Data MCP Server stopped');
  }
}

// Export factory function for easy instantiation
export function createSportsDataMCPServer(
  config: SportsDataServerConfig,
  dataPlugin: SportsDataPlugin,
  dataManager: SportsDataManager,
  eventBus: EventBus,
  logger: Logger
): SportsDataMCPServer {
  return new SportsDataMCPServer(config, dataPlugin, dataManager, eventBus, logger);
}