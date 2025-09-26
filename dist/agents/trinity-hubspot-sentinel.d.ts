/**
 * Trinity HubSpot Sentinel Agent - Enhanced Monitoring and Anomaly Detection
 * OpenConductor agent optimized for HubSpot performance monitoring and alerting
 */
import { BaseAgent } from './base-agent';
import { EventBus } from '../core/event-bus';
export declare class TrinityHubSpotSentinelAgent extends BaseAgent {
    private monitoringData;
    private alerts;
    private thresholds;
    private monitoringInterval;
    private alertHistory;
    private maxAlertHistory;
    constructor(eventBus: EventBus);
    /**
     * Execute capability with HubSpot-optimized monitoring logic
     */
    protected executeCapability(capabilityName: string, parameters: Record<string, any>): Promise<any>;
    /**
     * Monitor HubSpot system health and API performance
     */
    private monitorSystemHealth;
    /**
     * Monitor sales pipeline health and detect anomalies
     */
    private monitorPipelineHealth;
    /**
     * Audit HubSpot data quality and identify issues
     */
    private auditDataQuality;
    /**
     * Monitor marketing campaign performance
     */
    private monitorCampaignPerformance;
    /**
     * Manage alerts (list, acknowledge, escalate, resolve)
     */
    private manageAlerts;
    /**
     * Start continuous monitoring in the background
     */
    private startContinuousMonitoring;
    /**
     * Perform continuous monitoring checks
     */
    private performContinuousCheck;
    /**
     * Analyze monitoring data and generate alerts
     */
    private analyzeAndGenerateAlerts;
    /**
     * Helper methods for monitoring and analysis
     */
    private addAlert;
    private getActiveAlerts;
    private getAlertsBySeverity;
    private updateThresholds;
    private assessAPIHealth;
    private assessDataQualityHealth;
    private analyzeStageDistribution;
    private analyzeVelocityTrends;
    private analyzeConversionRates;
    private generatePipelineAlerts;
    private calculateDuplicateScore;
    private calculateCompletenessScore;
    private calculateStalenessScore;
    private generateDataQualityReport;
    private analyzeCampaignEngagement;
    private analyzeCampaignConversions;
    private detectUnderperformingCampaign;
    private getAlertSummary;
    private acknowledgeAlerts;
    private escalateAlerts;
    private resolveAlerts;
    private checkAPIThresholds;
    private checkDataQualityThresholds;
    private checkPipelineThresholds;
    /**
     * Cleanup monitoring resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=trinity-hubspot-sentinel.d.ts.map