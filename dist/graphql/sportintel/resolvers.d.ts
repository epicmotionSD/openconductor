/**
 * SportIntel GraphQL Resolvers
 *
 * Federation-compliant resolvers that integrate with OpenConductor services
 * to provide comprehensive B2B API access for enterprise clients.
 */
import { SportIntelSubscriptionManager } from '../../subscription/sportintel/subscription-manager';
import { EventBus } from '../../events/event-bus';
interface Context {
    user?: {
        id: string;
        email: string;
        subscription?: any;
    };
    subscriptionManager: SportIntelSubscriptionManager;
    eventBus: EventBus;
    dataSources: {
        sportsDataAPI: any;
        predictionAPI: any;
        portfolioAPI: any;
        alertAPI: any;
        analyticsAPI: any;
    };
    pubsub: any;
}
/**
 * Main GraphQL Resolvers
 */
export declare const resolvers: {
    DateTime: any;
    JSON: any;
    User: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<{
            id: string;
            email: string;
            subscription: import("../../subscription/sportintel/subscription-manager").UserSubscription | undefined;
            createdAt: Date;
            updatedAt: Date;
        }>;
    };
    Subscription: {
        predictionUpdates: {
            subscribe: any;
        };
        ownershipUpdates: {
            subscribe: any;
        };
        salaryUpdates: {
            subscribe: any;
        };
        gameUpdates: {
            subscribe: any;
        };
        newAlerts: {
            subscribe: any;
        };
        portfolioUpdates: {
            subscribe: any;
        };
        lineupUpdates: {
            subscribe: any;
        };
    };
    League: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        teams: (parent: any, args: any, context: Context) => Promise<any>;
        games: (parent: any, args: any, context: Context) => Promise<any>;
    };
    Team: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        league: (parent: any, context: Context) => Promise<any>;
        players: (parent: any, args: any, context: Context) => Promise<any>;
        homeGames: (parent: any, args: any, context: Context) => Promise<any>;
        awayGames: (parent: any, args: any, context: Context) => Promise<any>;
        stats: (parent: any, { season }: any, context: Context) => Promise<any>;
    };
    Player: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        team: (parent: any, context: Context) => Promise<any>;
        predictions: (parent: any, args: any, context: Context) => Promise<any>;
        stats: (parent: any, { season, gameId }: any, context: Context) => Promise<any>;
        marketData: (parent: any, { gameId }: any, context: Context) => Promise<any>;
    };
    Game: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        homeTeam: (parent: any, context: Context) => Promise<any>;
        awayTeam: (parent: any, context: Context) => Promise<any>;
        predictions: (parent: any, args: any, context: Context) => Promise<any>;
        marketData: (parent: any, args: any, context: Context) => Promise<any>;
    };
    Prediction: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        player: (parent: any, context: Context) => Promise<any>;
        game: (parent: any, context: Context) => Promise<any>;
        explanation: (parent: any, args: any, context: Context) => Promise<any>;
    };
    Portfolio: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        lineups: (parent: any, args: any, context: Context) => Promise<any>;
        performance: (parent: any, args: any, context: Context) => Promise<any>;
        alerts: (parent: any, args: any, context: Context) => Promise<any>;
    };
    Lineup: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        players: (parent: any, args: any, context: Context) => Promise<any[]>;
        exposure: (parent: any, args: any, context: Context) => Promise<any>;
    };
    Alert: {
        __resolveReference: (reference: {
            id: string;
        }, context: Context) => Promise<any>;
        player: (parent: any, context: Context) => Promise<any>;
        game: (parent: any, context: Context) => Promise<any>;
    };
    Query: {
        me: (_: any, args: any, context: Context) => Promise<{
            id: string;
            email: string;
            subscription?: any;
        }>;
        subscription: (_: any, args: any, context: Context) => Promise<import("../../subscription/sportintel/subscription-manager").UserSubscription | undefined>;
        leagues: (_: any, args: any, context: Context) => Promise<any>;
        league: (_: any, { id }: any, context: Context) => Promise<any>;
        teams: (_: any, { leagueId }: any, context: Context) => Promise<any>;
        team: (_: any, { id }: any, context: Context) => Promise<any>;
        players: (_: any, { filter, limit, offset }: any, context: Context) => Promise<any>;
        player: (_: any, { id }: any, context: Context) => Promise<any>;
        games: (_: any, { filter, limit, offset }: any, context: Context) => Promise<any>;
        game: (_: any, { id }: any, context: Context) => Promise<any>;
        predictions: (_: any, { filter, limit, offset }: any, context: Context) => Promise<any>;
        prediction: (_: any, { id }: any, context: Context) => Promise<any>;
        portfolios: (_: any, args: any, context: Context) => Promise<any>;
        portfolio: (_: any, { id }: any, context: Context) => Promise<any>;
        lineups: (_: any, { portfolioId }: any, context: Context) => Promise<any>;
        lineup: (_: any, { id }: any, context: Context) => Promise<any>;
        alerts: (_: any, { read, limit, offset }: any, context: Context) => Promise<any>;
        alert: (_: any, { id }: any, context: Context) => Promise<any>;
        analytics: (_: any, args: any, context: Context) => Promise<{}>;
        marketData: (_: any, { gameId, playerId }: any, context: Context) => Promise<any>;
        ownership: (_: any, { gameId }: any, context: Context) => Promise<any>;
        salaryChanges: (_: any, { days }: any, context: Context) => Promise<any>;
    };
    Mutation: {
        createPortfolio: (_: any, { name, bankroll }: any, context: Context) => Promise<any>;
        updatePortfolio: (_: any, { id, name, bankroll }: any, context: Context) => Promise<any>;
        deletePortfolio: (_: any, { id }: any, context: Context) => Promise<boolean>;
        createLineup: (_: any, { portfolioId, contest }: any, context: Context) => Promise<any>;
        updateLineup: (_: any, { id, players }: any, context: Context) => Promise<any>;
        optimizeLineup: (_: any, { input }: any, context: Context) => Promise<any>;
        deleteLineup: (_: any, { id }: any, context: Context) => Promise<boolean>;
        markAlertRead: (_: any, { id }: any, context: Context) => Promise<any>;
        markAllAlertsRead: (_: any, args: any, context: Context) => Promise<boolean>;
        deleteAlert: (_: any, { id }: any, context: Context) => Promise<boolean>;
        createWebhook: (_: any, { url, events }: any, context: Context) => Promise<any>;
        updateWebhook: (_: any, { id, url, events }: any, context: Context) => Promise<any>;
        deleteWebhook: (_: any, { id }: any, context: Context) => Promise<boolean>;
    };
    Analytics: {
        player: (_: any, { id }: any, context: Context) => Promise<any>;
        team: (_: any, { id }: any, context: Context) => Promise<any>;
        game: (_: any, { id }: any, context: Context) => Promise<any>;
        market: (_: any, args: any, context: Context) => Promise<any>;
        model: (_: any, args: any, context: Context) => Promise<any>;
        trends: (_: any, args: any, context: Context) => Promise<any>;
    };
    GameConnection: {
        edges: (parent: any) => any;
        pageInfo: (parent: any) => {
            hasNextPage: any;
            hasPreviousPage: boolean;
            startCursor: string | null;
            endCursor: string | null;
        };
        totalCount: (parent: any) => any;
    };
    PredictionConnection: {
        edges: (parent: any) => any;
        pageInfo: (parent: any) => {
            hasNextPage: any;
            hasPreviousPage: boolean;
            startCursor: string | null;
            endCursor: string | null;
        };
        totalCount: (parent: any) => any;
    };
};
export default resolvers;
//# sourceMappingURL=resolvers.d.ts.map