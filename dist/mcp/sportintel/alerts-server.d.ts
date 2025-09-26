/**
 * Alerts MCP Server
 *
 * Model Context Protocol server for real-time alerts, notifications,
 * and monitoring of sports events, injuries, line movements, and anomalies.
 *
 * Integrates with SportsSentinelAgent and OpenConductor's EventBus
 * for sub-200ms alert processing and delivery.
 */
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';
import { SportsSentinelAgent } from '../../agents/sportintel/sports-sentinel-agent';
export interface AlertsServerConfig {
    name: string;
    version: string;
    realTime: {
        enabled: boolean;
        processingTimeoutMs: number;
        maxConcurrentAlerts: number;
    };
    notifications: {
        channels: string[];
        rateLimits: Record<string, number>;
        priorities: string[];
    };
    monitoring: {
        enabled: boolean;
        healthCheckIntervalMs: number;
        alertThresholds: Record<string, number>;
    };
    delivery: {
        retryAttempts: number;
        retryDelayMs: number;
        batchingEnabled: boolean;
        batchSize: number;
    };
}
export declare class AlertsMCPServer {
    private server;
    private eventBus;
    private sportsSentinel;
    private logger;
    private config;
    private activeAlerts;
    private alertRules;
    private subscriptions;
    private processingQueue;
    private readonly tools;
    constructor(config: AlertsServerConfig, eventBus: EventBus, sportsSentinel: SportsSentinelAgent, logger: Logger);
    private setupHandlers;
    private initializeAlerting;
    private handleCreateAlertRule;
    private handleMonitorInjuryReports;
    private handleGetActiveAlerts;
    private processRealTimeEvent;
    private processInjuryAlert;
    private evaluateRuleConditions;
    private isRateLimited;
    private generateAlert;
    private generateAlertMessage;
    private deliverAlert;
    private setupRuleMonitoring;
    private getEventTypesForRule;
    private processRuleEvent;
    private startHealthMonitoring;
    private generateAlertId;
    private generateRuleId;
    private handleMonitorLineupChanges;
    private handleMonitorWeatherConditions;
    private handleMonitorLineMovements;
    private handleMonitorOwnershipChanges;
    private handleCreatePerformanceAlert;
    private handleAcknowledgeAlert;
    private handleTestAlertRule;
    private handleConfigureAlertChannels;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createAlertsMCPServer(config: AlertsServerConfig, eventBus: EventBus, sportsSentinel: SportsSentinelAgent, logger: Logger): AlertsMCPServer;
//# sourceMappingURL=alerts-server.d.ts.map