"use strict";
/**
 * SportIntel GraphQL Resolvers
 *
 * Federation-compliant resolvers that integrate with OpenConductor services
 * to provide comprehensive B2B API access for enterprise clients.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
// Custom scalar types
const dateTimeScalar = new graphql_1.GraphQLScalarType({
    name: 'DateTime',
    description: 'Date and time as ISO 8601 string',
    serialize: (value) => {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    },
    parseValue: (value) => {
        return new Date(value);
    },
    parseLiteral: (ast) => {
        if (ast.kind === graphql_1.Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});
const jsonScalar = new graphql_1.GraphQLScalarType({
    name: 'JSON',
    description: 'JSON scalar type',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (ast) => {
        if (ast.kind === graphql_1.Kind.STRING) {
            try {
                return JSON.parse(ast.value);
            }
            catch {
                return null;
            }
        }
        return null;
    },
});
/**
 * Main GraphQL Resolvers
 */
exports.resolvers = {
    // Custom scalars
    DateTime: dateTimeScalar,
    JSON: jsonScalar,
    // Federation entity resolvers
    User: {
        __resolveReference: async (reference, context) => {
            // Resolve user entity - in real implementation, would fetch from user service
            return {
                id: reference.id,
                email: `user${reference.id}@example.com`, // Mock data
                subscription: await context.subscriptionManager.getUserSubscription(reference.id),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        },
    },
    Subscription: {
        __resolveReference: async (reference, context) => {
            // This would resolve subscription from the subscription manager
            return context.subscriptionManager.getUserSubscription(reference.id);
        },
    },
    League: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.sportsDataAPI.getLeague(reference.id);
        },
        teams: async (parent, args, context) => {
            return context.dataSources.sportsDataAPI.getTeamsByLeague(parent.id);
        },
        games: async (parent, args, context) => {
            const { week, season, status, limit = 10, offset = 0 } = args;
            return context.dataSources.sportsDataAPI.getGames({
                leagueId: parent.id,
                week,
                season,
                status,
                limit,
                offset,
            });
        },
    },
    Team: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.sportsDataAPI.getTeam(reference.id);
        },
        league: async (parent, context) => {
            return context.dataSources.sportsDataAPI.getLeague(parent.leagueId);
        },
        players: async (parent, args, context) => {
            return context.dataSources.sportsDataAPI.getPlayersByTeam(parent.id);
        },
        homeGames: async (parent, args, context) => {
            return context.dataSources.sportsDataAPI.getGamesByTeam(parent.id, 'home');
        },
        awayGames: async (parent, args, context) => {
            return context.dataSources.sportsDataAPI.getGamesByTeam(parent.id, 'away');
        },
        stats: async (parent, { season }, context) => {
            return context.dataSources.sportsDataAPI.getTeamStats(parent.id, season);
        },
    },
    Player: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.sportsDataAPI.getPlayer(reference.id);
        },
        team: async (parent, context) => {
            return context.dataSources.sportsDataAPI.getTeam(parent.teamId);
        },
        predictions: async (parent, args, context) => {
            const { gameId, limit = 5, offset = 0 } = args;
            return context.dataSources.predictionAPI.getPlayerPredictions({
                playerId: parent.id,
                gameId,
                limit,
                offset,
            });
        },
        stats: async (parent, { season, gameId }, context) => {
            return context.dataSources.sportsDataAPI.getPlayerStats(parent.id, { season, gameId });
        },
        marketData: async (parent, { gameId }, context) => {
            return context.dataSources.sportsDataAPI.getMarketData(parent.id, gameId);
        },
    },
    Game: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.sportsDataAPI.getGame(reference.id);
        },
        homeTeam: async (parent, context) => {
            return context.dataSources.sportsDataAPI.getTeam(parent.homeTeamId);
        },
        awayTeam: async (parent, context) => {
            return context.dataSources.sportsDataAPI.getTeam(parent.awayTeamId);
        },
        predictions: async (parent, args, context) => {
            return context.dataSources.predictionAPI.getPredictionsByGame(parent.id);
        },
        marketData: async (parent, args, context) => {
            return context.dataSources.sportsDataAPI.getGameMarketData(parent.id);
        },
    },
    Prediction: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.predictionAPI.getPrediction(reference.id);
        },
        player: async (parent, context) => {
            return context.dataSources.sportsDataAPI.getPlayer(parent.playerId);
        },
        game: async (parent, context) => {
            return context.dataSources.sportsDataAPI.getGame(parent.gameId);
        },
        explanation: async (parent, args, context) => {
            // Check if user has explainable AI feature access
            const hasAccess = await context.subscriptionManager.hasFeatureAccess(context.user?.id || '', 'explainableAI');
            if (!hasAccess) {
                return null; // Hide explanation for users without access
            }
            return context.dataSources.predictionAPI.getPredictionExplanation(parent.id);
        },
    },
    Portfolio: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.portfolioAPI.getPortfolio(reference.id);
        },
        lineups: async (parent, args, context) => {
            return context.dataSources.portfolioAPI.getLineupsByPortfolio(parent.id);
        },
        performance: async (parent, args, context) => {
            return context.dataSources.portfolioAPI.getPortfolioPerformance(parent.id);
        },
        alerts: async (parent, args, context) => {
            return context.dataSources.alertAPI.getAlertsByPortfolio(parent.id);
        },
    },
    Lineup: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.portfolioAPI.getLineup(reference.id);
        },
        players: async (parent, args, context) => {
            return Promise.all(parent.playerIds.map((playerId) => context.dataSources.sportsDataAPI.getPlayer(playerId)));
        },
        exposure: async (parent, args, context) => {
            return context.dataSources.portfolioAPI.getLineupExposure(parent.id);
        },
    },
    Alert: {
        __resolveReference: async (reference, context) => {
            return context.dataSources.alertAPI.getAlert(reference.id);
        },
        player: async (parent, context) => {
            if (!parent.playerId)
                return null;
            return context.dataSources.sportsDataAPI.getPlayer(parent.playerId);
        },
        game: async (parent, context) => {
            if (!parent.gameId)
                return null;
            return context.dataSources.sportsDataAPI.getGame(parent.gameId);
        },
    },
    // Query resolvers
    Query: {
        // User and subscription queries
        me: async (_, args, context) => {
            if (!context.user) {
                throw new Error('Authentication required');
            }
            return context.user;
        },
        subscription: async (_, args, context) => {
            if (!context.user) {
                throw new Error('Authentication required');
            }
            return context.subscriptionManager.getUserSubscription(context.user.id);
        },
        // Sports data queries
        leagues: async (_, args, context) => {
            return context.dataSources.sportsDataAPI.getLeagues();
        },
        league: async (_, { id }, context) => {
            return context.dataSources.sportsDataAPI.getLeague(id);
        },
        teams: async (_, { leagueId }, context) => {
            return context.dataSources.sportsDataAPI.getTeams(leagueId);
        },
        team: async (_, { id }, context) => {
            return context.dataSources.sportsDataAPI.getTeam(id);
        },
        players: async (_, { filter, limit = 20, offset = 0 }, context) => {
            return context.dataSources.sportsDataAPI.getPlayers({ filter, limit, offset });
        },
        player: async (_, { id }, context) => {
            return context.dataSources.sportsDataAPI.getPlayer(id);
        },
        games: async (_, { filter, limit = 20, offset = 0 }, context) => {
            return context.dataSources.sportsDataAPI.getGames({ filter, limit, offset });
        },
        game: async (_, { id }, context) => {
            return context.dataSources.sportsDataAPI.getGame(id);
        },
        // Prediction queries
        predictions: async (_, { filter, limit = 20, offset = 0 }, context) => {
            // Check subscription access
            const hasAccess = await context.subscriptionManager.hasFeatureAccess(context.user?.id || '', 'realTimePredictions');
            if (!hasAccess) {
                throw new Error('Real-time predictions require Pro subscription or higher');
            }
            return context.dataSources.predictionAPI.getPredictions({ filter, limit, offset });
        },
        prediction: async (_, { id }, context) => {
            return context.dataSources.predictionAPI.getPrediction(id);
        },
        // Portfolio queries
        portfolios: async (_, args, context) => {
            if (!context.user) {
                throw new Error('Authentication required');
            }
            return context.dataSources.portfolioAPI.getUserPortfolios(context.user.id);
        },
        portfolio: async (_, { id }, context) => {
            return context.dataSources.portfolioAPI.getPortfolio(id);
        },
        lineups: async (_, { portfolioId }, context) => {
            return context.dataSources.portfolioAPI.getLineups(portfolioId);
        },
        lineup: async (_, { id }, context) => {
            return context.dataSources.portfolioAPI.getLineup(id);
        },
        // Alert queries
        alerts: async (_, { read, limit = 20, offset = 0 }, context) => {
            if (!context.user) {
                throw new Error('Authentication required');
            }
            return context.dataSources.alertAPI.getUserAlerts(context.user.id, { read, limit, offset });
        },
        alert: async (_, { id }, context) => {
            return context.dataSources.alertAPI.getAlert(id);
        },
        // Analytics queries
        analytics: async (_, args, context) => {
            // Check analytics access
            const hasAccess = await context.subscriptionManager.hasFeatureAccess(context.user?.id || '', 'advancedMetrics');
            if (!hasAccess) {
                throw new Error('Advanced analytics require Pro subscription or higher');
            }
            return {}; // Analytics root resolver
        },
        // Market data queries
        marketData: async (_, { gameId, playerId }, context) => {
            return context.dataSources.sportsDataAPI.getMarketData(playerId, gameId);
        },
        ownership: async (_, { gameId }, context) => {
            return context.dataSources.sportsDataAPI.getGameOwnership(gameId);
        },
        salaryChanges: async (_, { days = 7 }, context) => {
            return context.dataSources.sportsDataAPI.getSalaryChanges(days);
        },
    },
    // Mutation resolvers
    Mutation: {
        // Portfolio mutations
        createPortfolio: async (_, { name, bankroll }, context) => {
            if (!context.user) {
                throw new Error('Authentication required');
            }
            // Check portfolio limits
            const currentPortfolios = await context.dataSources.portfolioAPI.getUserPortfolios(context.user.id);
            const subscription = await context.subscriptionManager.getUserSubscription(context.user.id);
            if (subscription && subscription.plan.limits.portfolios !== -1) {
                if (currentPortfolios.length >= subscription.plan.limits.portfolios) {
                    throw new Error('Portfolio limit reached for your subscription tier');
                }
            }
            return context.dataSources.portfolioAPI.createPortfolio({
                userId: context.user.id,
                name,
                bankroll,
            });
        },
        updatePortfolio: async (_, { id, name, bankroll }, context) => {
            return context.dataSources.portfolioAPI.updatePortfolio(id, { name, bankroll });
        },
        deletePortfolio: async (_, { id }, context) => {
            await context.dataSources.portfolioAPI.deletePortfolio(id);
            return true;
        },
        // Lineup mutations
        createLineup: async (_, { portfolioId, contest }, context) => {
            return context.dataSources.portfolioAPI.createLineup({
                portfolioId,
                contest,
                userId: context.user?.id,
            });
        },
        updateLineup: async (_, { id, players }, context) => {
            return context.dataSources.portfolioAPI.updateLineup(id, { players });
        },
        optimizeLineup: async (_, { input }, context) => {
            // Check optimization access
            const hasAccess = await context.subscriptionManager.hasFeatureAccess(context.user?.id || '', 'portfolioOptimization');
            if (!hasAccess) {
                throw new Error('Lineup optimization requires Pro subscription or higher');
            }
            return context.dataSources.portfolioAPI.optimizeLineup(input);
        },
        deleteLineup: async (_, { id }, context) => {
            await context.dataSources.portfolioAPI.deleteLineup(id);
            return true;
        },
        // Alert mutations
        markAlertRead: async (_, { id }, context) => {
            return context.dataSources.alertAPI.markAlertRead(id);
        },
        markAllAlertsRead: async (_, args, context) => {
            if (!context.user) {
                throw new Error('Authentication required');
            }
            await context.dataSources.alertAPI.markAllAlertsRead(context.user.id);
            return true;
        },
        deleteAlert: async (_, { id }, context) => {
            await context.dataSources.alertAPI.deleteAlert(id);
            return true;
        },
        // B2B mutations
        createWebhook: async (_, { url, events }, context) => {
            // Check webhook access
            const hasAccess = await context.subscriptionManager.hasFeatureAccess(context.user?.id || '', 'webhooks');
            if (!hasAccess) {
                throw new Error('Webhooks require Elite subscription or higher');
            }
            return context.dataSources.portfolioAPI.createWebhook({
                userId: context.user?.id,
                url,
                events,
            });
        },
        updateWebhook: async (_, { id, url, events }, context) => {
            return context.dataSources.portfolioAPI.updateWebhook(id, { url, events });
        },
        deleteWebhook: async (_, { id }, context) => {
            await context.dataSources.portfolioAPI.deleteWebhook(id);
            return true;
        },
    },
    // Subscription resolvers (real-time)
    Subscription: {
        // Real-time predictions
        predictionUpdates: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, args, context) => context.pubsub.asyncIterator('PREDICTION_UPDATED'), (payload, variables) => {
                if (variables.playerId && payload.predictionUpdates.playerId !== variables.playerId) {
                    return false;
                }
                if (variables.gameId && payload.predictionUpdates.gameId !== variables.gameId) {
                    return false;
                }
                return true;
            }),
        },
        // Market data streams
        ownershipUpdates: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, args, context) => context.pubsub.asyncIterator('OWNERSHIP_UPDATED'), (payload, variables) => payload.ownershipUpdates.gameId === variables.gameId),
        },
        salaryUpdates: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, args, context) => context.pubsub.asyncIterator('SALARY_UPDATED'), (payload, variables) => {
                return !variables.playerId || payload.salaryUpdates.playerId === variables.playerId;
            }),
        },
        // Live game updates
        gameUpdates: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, args, context) => context.pubsub.asyncIterator('GAME_UPDATED'), (payload, variables) => payload.gameUpdates.id === variables.gameId),
        },
        // Alert notifications
        newAlerts: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, args, context) => context.pubsub.asyncIterator('ALERT_CREATED'), (payload, variables, context) => {
                return payload.newAlerts.userId === context.user?.id;
            }),
        },
        // Portfolio updates
        portfolioUpdates: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, args, context) => context.pubsub.asyncIterator('PORTFOLIO_UPDATED'), (payload, variables) => payload.portfolioUpdates.id === variables.portfolioId),
        },
        lineupUpdates: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, args, context) => context.pubsub.asyncIterator('LINEUP_UPDATED'), (payload, variables) => payload.lineupUpdates.id === variables.lineupId),
        },
    },
    // Analytics resolvers
    Analytics: {
        player: async (_, { id }, context) => {
            return context.dataSources.analyticsAPI.getPlayerAnalytics(id);
        },
        team: async (_, { id }, context) => {
            return context.dataSources.analyticsAPI.getTeamAnalytics(id);
        },
        game: async (_, { id }, context) => {
            return context.dataSources.analyticsAPI.getGameAnalytics(id);
        },
        market: async (_, args, context) => {
            return context.dataSources.analyticsAPI.getMarketAnalytics();
        },
        model: async (_, args, context) => {
            return context.dataSources.analyticsAPI.getModelAnalytics();
        },
        trends: async (_, args, context) => {
            return context.dataSources.analyticsAPI.getTrendAnalytics();
        },
    },
    // Connection resolvers for pagination
    GameConnection: {
        edges: (parent) => parent.games.map((game, index) => ({
            node: game,
            cursor: Buffer.from(`${parent.offset + index}`).toString('base64'),
        })),
        pageInfo: (parent) => ({
            hasNextPage: parent.hasNextPage,
            hasPreviousPage: parent.offset > 0,
            startCursor: parent.games.length > 0
                ? Buffer.from(`${parent.offset}`).toString('base64')
                : null,
            endCursor: parent.games.length > 0
                ? Buffer.from(`${parent.offset + parent.games.length - 1}`).toString('base64')
                : null,
        }),
        totalCount: (parent) => parent.totalCount,
    },
    PredictionConnection: {
        edges: (parent) => parent.predictions.map((prediction, index) => ({
            node: prediction,
            cursor: Buffer.from(`${parent.offset + index}`).toString('base64'),
        })),
        pageInfo: (parent) => ({
            hasNextPage: parent.hasNextPage,
            hasPreviousPage: parent.offset > 0,
            startCursor: parent.predictions.length > 0
                ? Buffer.from(`${parent.offset}`).toString('base64')
                : null,
            endCursor: parent.predictions.length > 0
                ? Buffer.from(`${parent.offset + parent.predictions.length - 1}`).toString('base64')
                : null,
        }),
        totalCount: (parent) => parent.totalCount,
    },
};
exports.default = exports.resolvers;
//# sourceMappingURL=resolvers.js.map