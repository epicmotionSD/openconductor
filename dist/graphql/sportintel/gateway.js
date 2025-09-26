"use strict";
/**
 * SportIntel GraphQL Federation Gateway
 *
 * Apollo Federation gateway that orchestrates multiple subgraphs and provides
 * a unified GraphQL API for B2B clients and enterprise integrations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubgraphSchema = exports.createSportIntelGateway = exports.SportIntelGraphQLGateway = void 0;
const gateway_1 = require("@apollo/gateway");
const apollo_server_express_1 = require("apollo-server-express");
const subgraph_1 = require("@apollo/subgraph");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../../utils/logger");
const development_config_1 = require("../../config/sportintel/development-config");
const subscription_middleware_1 = require("../../subscription/sportintel/subscription-middleware");
// Data source implementations
const sports_datasource_1 = require("./datasources/sports-datasource");
const prediction_datasource_1 = require("./datasources/prediction-datasource");
const portfolio_datasource_1 = require("./datasources/portfolio-datasource");
const alert_datasource_1 = require("./datasources/alert-datasource");
const analytics_datasource_1 = require("./datasources/analytics-datasource");
/**
 * Custom data source for authenticating requests to subgraphs
 */
class AuthenticatedDataSource extends gateway_1.RemoteGraphQLDataSource {
    willSendRequest({ request, context }) {
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
class SportIntelGraphQLGateway {
    gateway;
    server;
    logger;
    config;
    subscriptionManager;
    eventBus;
    middleware;
    constructor(subscriptionManager, eventBus) {
        this.logger = logger_1.Logger.getInstance();
        this.config = development_config_1.SportIntelConfigManager.getInstance();
        this.subscriptionManager = subscriptionManager;
        this.eventBus = eventBus;
        this.middleware = (0, subscription_middleware_1.createSubscriptionMiddleware)(subscriptionManager, eventBus);
        this.initializeGateway();
        this.initializeServer();
    }
    /**
     * Initialize Apollo Gateway with subgraph configuration
     */
    initializeGateway() {
        const isProduction = this.config.isProduction();
        if (isProduction) {
            // Production: Use managed federation with Apollo Studio
            this.gateway = new gateway_1.ApolloGateway({
                serviceHealthCheck: true,
                buildService({ url }) {
                    return new AuthenticatedDataSource({ url });
                },
            });
        }
        else {
            // Development: Use schema composition with local subgraphs
            this.gateway = new gateway_1.ApolloGateway({
                supergraphSdl: new gateway_1.IntrospectAndCompose({
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
    initializeServer() {
        this.server = new apollo_server_express_1.ApolloServer({
            gateway: this.gateway,
            context: ({ req, connection }) => this.createContext(req, connection),
            subscriptions: {
                path: '/graphql/subscriptions',
                onConnect: (connectionParams) => this.handleSubscriptionConnect(connectionParams),
                onDisconnect: () => this.handleSubscriptionDisconnect(),
            },
            plugins: [
                // Custom plugins for monitoring, caching, etc.
                {
                    requestDidStart() {
                        return {
                            didResolveOperation(context) {
                                // Log GraphQL operations
                                logger_1.Logger.getInstance().info('GraphQL Operation', {
                                    operationName: context.request.operationName,
                                    variables: context.request.variables,
                                    userId: context.context.user?.id,
                                });
                            },
                            willSendResponse(context) {
                                // Log response metrics
                                logger_1.Logger.getInstance().info('GraphQL Response', {
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
    getSubgraphConfig() {
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
    async createContext(req, connection) {
        let user = null;
        let headers = {};
        if (connection) {
            // WebSocket connection context
            user = connection.context.user;
            headers = connection.context.headers || {};
        }
        else if (req) {
            // HTTP request context
            headers = req.headers;
            try {
                const token = this.extractToken(req);
                if (token) {
                    const decoded = jsonwebtoken_1.default.verify(token, this.config.getSection('security').jwtSecret);
                    const subscription = await this.subscriptionManager.getUserSubscription(decoded.userId);
                    user = {
                        id: decoded.userId,
                        email: decoded.email,
                        subscription,
                    };
                }
            }
            catch (error) {
                // Invalid token - continue with unauthenticated context
                this.logger.warn('Invalid authentication token', { error: error.message });
            }
        }
        return {
            user,
            subscriptionManager: this.subscriptionManager,
            eventBus: this.eventBus,
            dataSources: {
                sportsDataAPI: new sports_datasource_1.SportsDataSource(),
                predictionAPI: new prediction_datasource_1.PredictionDataSource(),
                portfolioAPI: new portfolio_datasource_1.PortfolioDataSource(),
                alertAPI: new alert_datasource_1.AlertDataSource(),
                analyticsAPI: new analytics_datasource_1.AnalyticsDataSource(),
            },
            pubsub: this.eventBus, // Use EventBus as pubsub mechanism
            headers,
        };
    }
    /**
     * Handle WebSocket subscription connections
     */
    async handleSubscriptionConnect(connectionParams) {
        try {
            const token = connectionParams.authorization || connectionParams.token;
            if (!token) {
                throw new Error('Authentication token required for subscriptions');
            }
            const decoded = jsonwebtoken_1.default.verify(token.replace('Bearer ', ''), this.config.getSection('security').jwtSecret);
            const subscription = await this.subscriptionManager.getUserSubscription(decoded.userId);
            // Check if user has real-time features access
            const hasRealTimeAccess = await this.subscriptionManager.hasFeatureAccess(decoded.userId, 'realTimePredictions');
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
        }
        catch (error) {
            this.logger.error('WebSocket authentication failed', { error: error.message });
            throw new Error('Authentication failed');
        }
    }
    /**
     * Handle WebSocket disconnection
     */
    handleSubscriptionDisconnect() {
        this.logger.info('WebSocket client disconnected');
    }
    /**
     * Extract JWT token from request
     */
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return req.query.token || null;
    }
    /**
     * Start the GraphQL gateway server
     */
    async start(port = 4000) {
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
        }
        catch (error) {
            this.logger.error('Failed to start GraphQL gateway', { error });
            throw error;
        }
    }
    /**
     * Stop the GraphQL gateway server
     */
    async stop() {
        try {
            await this.server.stop();
            this.logger.info('SportIntel GraphQL Gateway stopped');
        }
        catch (error) {
            this.logger.error('Failed to stop GraphQL gateway', { error });
            throw error;
        }
    }
    /**
     * Setup health check endpoint
     */
    setupHealthCheck() {
        // This would be implemented with Express middleware
        // Health check would verify gateway health and subgraph connectivity
    }
    /**
     * Setup schema introspection endpoint
     */
    setupSchemaEndpoint() {
        // This would provide schema SDL for development tools
    }
    /**
     * Get server instance for middleware integration
     */
    getServer() {
        return this.server;
    }
    /**
     * Get gateway instance
     */
    getGateway() {
        return this.gateway;
    }
}
exports.SportIntelGraphQLGateway = SportIntelGraphQLGateway;
/**
 * Create and configure SportIntel GraphQL Gateway
 */
const createSportIntelGateway = (subscriptionManager, eventBus) => {
    return new SportIntelGraphQLGateway(subscriptionManager, eventBus);
};
exports.createSportIntelGateway = createSportIntelGateway;
/**
 * Create subgraph schema for individual services
 */
const createSubgraphSchema = (typeDefs, resolvers) => {
    return (0, subgraph_1.buildSubgraphSchema)({
        typeDefs,
        resolvers,
    });
};
exports.createSubgraphSchema = createSubgraphSchema;
exports.default = SportIntelGraphQLGateway;
//# sourceMappingURL=gateway.js.map