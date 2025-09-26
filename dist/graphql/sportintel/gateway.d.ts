/**
 * SportIntel GraphQL Federation Gateway
 *
 * Apollo Federation gateway that orchestrates multiple subgraphs and provides
 * a unified GraphQL API for B2B clients and enterprise integrations.
 */
import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import { SportIntelSubscriptionManager } from '../../subscription/sportintel/subscription-manager';
import { EventBus } from '../../events/event-bus';
/**
 * GraphQL Federation Gateway Configuration
 */
export declare class SportIntelGraphQLGateway {
    private gateway;
    private server;
    private logger;
    private config;
    private subscriptionManager;
    private eventBus;
    private middleware;
    constructor(subscriptionManager: SportIntelSubscriptionManager, eventBus: EventBus);
    /**
     * Initialize Apollo Gateway with subgraph configuration
     */
    private initializeGateway;
    /**
     * Initialize Apollo Server with gateway
     */
    private initializeServer;
    /**
     * Get subgraph configuration for federation
     */
    private getSubgraphConfig;
    /**
     * Create GraphQL context for requests
     */
    private createContext;
    /**
     * Handle WebSocket subscription connections
     */
    private handleSubscriptionConnect;
    /**
     * Handle WebSocket disconnection
     */
    private handleSubscriptionDisconnect;
    /**
     * Extract JWT token from request
     */
    private extractToken;
    /**
     * Start the GraphQL gateway server
     */
    start(port?: number): Promise<void>;
    /**
     * Stop the GraphQL gateway server
     */
    stop(): Promise<void>;
    /**
     * Setup health check endpoint
     */
    private setupHealthCheck;
    /**
     * Setup schema introspection endpoint
     */
    private setupSchemaEndpoint;
    /**
     * Get server instance for middleware integration
     */
    getServer(): ApolloServer;
    /**
     * Get gateway instance
     */
    getGateway(): ApolloGateway;
}
/**
 * Create and configure SportIntel GraphQL Gateway
 */
export declare const createSportIntelGateway: (subscriptionManager: SportIntelSubscriptionManager, eventBus: EventBus) => SportIntelGraphQLGateway;
/**
 * Create subgraph schema for individual services
 */
export declare const createSubgraphSchema: (typeDefs: string, resolvers: any) => any;
export default SportIntelGraphQLGateway;
//# sourceMappingURL=gateway.d.ts.map