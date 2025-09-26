/**
 * Analytics MCP Server
 *
 * Model Context Protocol server for sports analytics, data visualization,
 * reporting, and business intelligence capabilities.
 *
 * Integrates with OpenConductor's EventBus for real-time analytics
 * and TimescaleDB for time-series analysis.
 */
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';
import { SportsDataManager } from '../../storage/sportintel/sports-data-manager';
export interface AnalyticsServerConfig {
    name: string;
    version: string;
    visualization: {
        enabled: boolean;
        maxCharts: number;
        exportFormats: string[];
    };
    reporting: {
        enabled: boolean;
        maxReports: number;
        scheduleEnabled: boolean;
    };
    realTimeAnalytics: {
        enabled: boolean;
        updateIntervalMs: number;
        maxDashboards: number;
    };
    performance: {
        cacheResults: boolean;
        cacheTTL: number;
        maxQueryTime: number;
    };
}
export declare class AnalyticsMCPServer {
    private server;
    private eventBus;
    private dataManager;
    private logger;
    private config;
    private activeAnalyses;
    private dashboards;
    private reportCache;
    private readonly tools;
    constructor(config: AnalyticsServerConfig, eventBus: EventBus, dataManager: SportsDataManager, logger: Logger);
    private setupHandlers;
    private initializeAnalytics;
    private handleAnalyzePlayerTrends;
    private handleTeamPerformanceAnalysis;
    private handleMatchupAnalysis;
    private handleQueryTimeseriesData;
    private handleCreateDashboard;
    private calculateTrends;
    private generateTrendProjections;
    private createVisualization;
    private performTeamAnalysis;
    private calculateAdvancedTeamMetrics;
    private analyzeMatchup;
    private updateRealTimeAnalytics;
    private setupDashboardRealTimeUpdates;
    private generateAnalysisId;
    private generateDashboardId;
    private handleMarketEfficiencyAnalysis;
    private handleGenerateReport;
    private handleCorrelationAnalysis;
    private handleAnomalyDetection;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createAnalyticsMCPServer(config: AnalyticsServerConfig, eventBus: EventBus, dataManager: SportsDataManager, logger: Logger): AnalyticsMCPServer;
//# sourceMappingURL=analytics-server.d.ts.map