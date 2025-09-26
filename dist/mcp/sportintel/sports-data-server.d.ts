/**
 * Sports Data MCP Server
 *
 * Model Context Protocol server providing unified access to sports data
 * across multiple providers with intelligent caching and cost optimization.
 *
 * Integrates with OpenConductor's ToolRegistry for seamless tool execution
 * and leverages the EventBus for real-time data updates.
 */
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
export declare class SportsDataMCPServer {
    private server;
    private dataPlugin;
    private dataManager;
    private eventBus;
    private logger;
    private config;
    private activeRequests;
    private subscriptions;
    private readonly tools;
    constructor(config: SportsDataServerConfig, dataPlugin: SportsDataPlugin, dataManager: SportsDataManager, eventBus: EventBus, logger: Logger);
    private setupHandlers;
    private setupRealTimeUpdates;
    private handleGetPlayerStats;
    private handleSubscribeRealTime;
    private handleUnsubscribeRealTime;
    private handleGetGameData;
    private handleGetInjuryReports;
    private handleGetOwnershipData;
    private handleSearchPlayers;
    private handleGetHistoricalTrends;
    private createPlayerStatsSubscription;
    private createGameUpdatesSubscription;
    private createInjuryAlertSubscription;
    private generateSubscriptionId;
    private matchesSubscriptionFilter;
    private unsubscribeById;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createSportsDataMCPServer(config: SportsDataServerConfig, dataPlugin: SportsDataPlugin, dataManager: SportsDataManager, eventBus: EventBus, logger: Logger): SportsDataMCPServer;
//# sourceMappingURL=sports-data-server.d.ts.map