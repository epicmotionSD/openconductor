/**
 * SportIntel GraphQL Federation Gateway
 * 
 * Apollo Federation gateway that orchestrates multiple subgraphs and provides
 * a unified GraphQL API for B2B clients and enterprise integrations.
 */

import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { readFileSync } from 'fs';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { Logger } from '../../utils/logger';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
import { SportIntelSubscriptionManager } from '../../subscription/sportintel/subscription-manager';
import { EventBus } from '../../events/event-bus';
import { createSubscriptionMiddleware } from '../../subscription/sportintel/subscription-middleware';
import resolvers from './resolvers';

// Data source implementations
import { SportsDataSource } from './datasources/sports-datasource';
import { PredictionDataSource } from './datasources/prediction-datasource';
import { PortfolioDataSource } from './datasources/portfolio-datasource';
import { AlertDataSource } from './datasources/alert-datasource';
import { AnalyticsDataSource } from './datasources/analytics-datasource';

interface GraphQLContext {
  user?: {
    id: string;
    email: string;
    subscription?: any;
  };
  subscriptionManager: SportIntelSubscriptionManager;
  eventBus: EventBus;
  dataSources: {
    sportsDataAPI: SportsDataSource;
    predictionAPI: PredictionDataSource;
    portfolioAPI: PortfolioDataSource;
    alertAPI: AlertDataSource;
    analyticsAPI: AnalyticsDataSource;
  };
  pubsub: any;
  headers: Record<string, string>;
}

/**
 * Custom data source for authenticating requests to subgraphs
 */
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: any) {
    // Forward authentication headers to subgraphs
    if (context.headers.authorization) {
      request.http.headers.set('authorization', context.headers.authorization);
    }
    
    // Add custom headers for internal service communication
    request.http.headers.set('x-service', 'sportintel-gateway');
    request.http.headers.set('x-user-id', context.user?.id || '');
    request.http.headers.set('x-subscription-tier', context.user?.subscription?.plan?.tier || '');
  }
}

/**
 * GraphQL Federation Gateway Configuration
 */
export class SportIntelGraphQLGateway {
  private gateway: ApolloGateway;
  private server: ApolloServer;
  private logger: Logger;
  private config: SportIntelConfigManager;
  private subscriptionManager: SportIntelSubscriptionManager;
  private eventBus: EventBus;
  private middleware: any;

  constructor(
    subscriptionManager: SportIntelSubscriptionManager,
    eventBus: EventBus
  ) {
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.subscriptionManager = subscriptionManager;
    this.eventBus = eventBus;
    this.middleware = createSubscriptionMiddleware(subscriptionManager, eventBus);

    this.initializeGateway();
    this.initializeServer();
  }

  /**
   * Initialize Apollo Gateway with subgraph configuration
   */
  private initializeGateway(): void {
    const isProduction = this.config.isProduction();
    
    if (isProduction) {
      // Production: Use managed federation with Apollo Studio
      this.gateway = new ApolloGateway({
        serviceHealthCheck: true,
        buildService({ url }) {
          return new AuthenticatedDataSource({ url });
        },
      });
    } else {
      // Development: Use schema composition with local subgraphs
      this.gateway = new ApolloGateway({
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: this.getSubgraphConfig(),
        }),
        buildService({ url }) {
          return new AuthenticatedDataSource({ url });
        },
      });
    }

    this.logger.info('GraphQL Federation Gateway initialized', {
      environment: this.config.getConfig().environment,
      subgraphs: this.getSubgraphConfig().length,
    });
  }

  /**
   * Initialize Apollo Server with gateway
   */
  private initializeServer(): void {
    this.server = new ApolloServer({
      gateway: this.gateway,
      context: ({ req, connection }) => this.createContext(req, connection),
      subscriptions: {
        path: '/graphql/subscriptions',
        onConnect: (connectionParams: any) => this.handleSubscriptionConnect(connectionParams),
        onDisconnect: () => this.handleSubscriptionDisconnect(),
      },
      plugins: [
        // Custom plugins for monitoring, caching, etc.
        {
          requestDidStart() {
            return {
              didResolveOperation(context: any) {
                // Log GraphQL operations
                Logger.getInstance().info('GraphQL Operation', {
                  operationName: context.request.operationName,
                  variables: context.request.variables,
                  userId: context.context.user?.id,
                });
              },
              willSendResponse(context: any) {
                // Log response metrics
                Logger.getInstance().info('GraphQL Response', {
                  operationName: context.request.operationName,
                  errors: context.response.errors?.length || 0,
                  userId: context.context.user?.id,
                });
              },
            };
          },
        },
      ],
      formatError: (error) => {
        this.logger.error('GraphQL Error', { error: error.message, stack: error.stack });
        
        // Don't expose internal errors in production
        if (this.config.isProduction()) {
          return new Error('Internal server error');
        }
        
        return error;
      },
      introspection: !this.config.isProduction(),
      playground: !this.config.isProduction(),
    });

    this.logger.info('Apollo Server initialized with gateway');
  }

  /**
   * Get subgraph configuration for federation
   */
  private getSubgraphConfig() {
    const baseUrl = this.config.isDevelopment() 
      ? 'http://localhost' 
      : 'https://api.sportintel.ai';

    return [
      {
        name: 'sportintel-core',
        url: `${baseUrl}:3001/graphql`,
      },
      {
        name: 'sportintel-predictions',
        url: `${baseUrl}:3002/graphql`,
      },
      {
        name: 'sportintel-analytics',
        url: `${baseUrl}:3003/graphql`,
      },
      {
        name: 'sportintel-portfolio',
        url: `${baseUrl}:3004/graphql`,
      },
    ];
  }

  /**
   * Create GraphQL context for requests
   */
  private async createContext(req: any, connection?: any): Promise<GraphQLContext> {
    let user: any = null;
    let headers: Record<string, string> = {};

    if (connection) {
      // WebSocket connection context
      user = connection.context.user;
      headers = connection.context.headers || {};
    } else if (req) {
      // HTTP request context
      headers = req.headers;
      
      try {
        const token = this.extractToken(req);
        if (token) {
          const decoded = jwt.verify(token, this.config.getSection('security').jwtSecret) as any;
          const subscription = await this.subscriptionManager.getUserSubscription(decoded.userId);
          
          user = {
            id: decoded.userId,
            email: decoded.email,
            subscription,
          };
        }
      } catch (error) {
        // Invalid token - continue with unauthenticated context
        this.logger.warn('Invalid authentication token', { error: error.message });
      }
    }

    return {
      user,
      subscriptionManager: this.subscriptionManager,
      eventBus: this.eventBus,
      dataSources: {
        sportsDataAPI: new SportsDataSource(),
        predictionAPI: new PredictionDataSource(),
        portfolioAPI: new PortfolioDataSource(),
        alertAPI: new AlertDataSource(),
        analyticsAPI: new AnalyticsDataSource(),
      },
      pubsub: this.eventBus, // Use EventBus as pubsub mechanism
      headers,
    };
  }

  /**
   * Handle WebSocket subscription connections
   */
  private async handleSubscriptionConnect(connectionParams: any) {
    try {
      const token = connectionParams.authorization || connectionParams.token;
      
      if (!token) {
        throw new Error('Authentication token required for subscriptions');
      }

      const decoded = jwt.verify(
        token.replace('Bearer ', ''), 
        this.config.getSection('security').jwtSecret
      ) as any;

      const subscription = await this.subscriptionManager.getUserSubscription(decoded.userId);
      
      // Check if user has real-time features access
      const hasRealTimeAccess = await this.subscriptionManager.hasFeatureAccess(
        decoded.userId,
        'realTimePredictions'
      );

      if (!hasRealTimeAccess) {
        throw new Error('Real-time subscriptions require Pro subscription or higher');
      }

      return {
        user: {
          id: decoded.userId,
          email: decoded.email,
          subscription,
        },
        headers: connectionParams,
      };
    } catch (error) {
      this.logger.error('WebSocket authentication failed', { error: error.message });
      throw new Error('Authentication failed');
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleSubscriptionDisconnect() {
    this.logger.info('WebSocket client disconnected');
  }

  /**
   * Extract JWT token from request
   */
  private extractToken(req: any): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return req.query.token || null;
  }

  /**
   * Start the GraphQL gateway server
   */
  async start(port: number = 4000): Promise<void> {
    try {
      const { url, subscriptionsUrl } = await this.server.listen({ port });
      
      this.logger.info('SportIntel GraphQL Gateway started', {
        url,
        subscriptionsUrl,
        environment: this.config.getConfig().environment,
      });

      // Setup health check endpoint
      this.setupHealthCheck();

      // Setup schema introspection endpoint (development only)
      if (!this.config.isProduction()) {
        this.setupSchemaEndpoint();
      }

    } catch (error) {
      this.logger.error('Failed to start GraphQL gateway', { error });
      throw error;
    }
  }

  /**
   * Stop the GraphQL gateway server
   */
  async stop(): Promise<void> {
    try {
      await this.server.stop();
      this.logger.info('SportIntel GraphQL Gateway stopped');
    } catch (error) {
      this.logger.error('Failed to stop GraphQL gateway', { error });
      throw error;
    }
  }

  /**
   * Setup health check endpoint
   */
  private setupHealthCheck(): void {
    // This would be implemented with Express middleware
    // Health check would verify gateway health and subgraph connectivity
  }

  /**
   * Setup schema introspection endpoint
   */
  private setupSchemaEndpoint(): void {
    // This would provide schema SDL for development tools
  }

  /**
   * Get server instance for middleware integration
   */
  getServer(): ApolloServer {
    return this.server;
  }

  /**
   * Get gateway instance
   */
  getGateway(): ApolloGateway {
    return this.gateway;
  }
}

/**
 * Create and configure SportIntel GraphQL Gateway
 */
export const createSportIntelGateway = (
  subscriptionManager: SportIntelSubscriptionManager,
  eventBus: EventBus
): SportIntelGraphQLGateway => {
  return new SportIntelGraphQLGateway(subscriptionManager, eventBus);
};

/**
 * Create subgraph schema for individual services
 */
export const createSubgraphSchema = (typeDefs: string, resolvers: any) => {
  return buildSubgraphSchema({
    typeDefs,
    resolvers,
  });
};

export default SportIntelGraphQLGateway;