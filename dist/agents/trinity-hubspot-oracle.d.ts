/**
 * Trinity HubSpot Oracle Agent - Enhanced Revenue Forecasting and Predictive Analytics
 * OpenConductor agent optimized for HubSpot CRM/Marketing data integration
 */
import { BaseAgent } from './base-agent';
import { EventBus } from '../core/event-bus';
export declare class TrinityHubSpotOracleAgent extends BaseAgent {
    private hubspotData;
    private forecastCache;
    private cacheTimeout;
    constructor(eventBus: EventBus);
    /**
     * Execute capability with HubSpot-optimized logic
     */
    protected executeCapability(capabilityName: string, parameters: Record<string, any>): Promise<any>;
    /**
     * Generate enhanced revenue forecast using HubSpot data
     */
    private generateRevenueForecast;
    /**
     * Analyze HubSpot pipeline health with advanced metrics
     */
    private analyzePipelineHealth;
    /**
     * Score leads using advanced HubSpot contact analysis
     */
    private scoreLeads;
    /**
     * Analyze marketing attribution and campaign performance
     */
    private analyzeMarketingAttribution;
    private calculatePipelineMetrics;
    private calculateBaseForecast;
    private calculateSeasonalAdjustment;
    private generateRecommendations;
    private parseTimeframeToDays;
    private clearForecastCache;
    private isCacheValid;
    private analyzeHistoricalPatterns;
    private assessMarketConditions;
    private applyConfidenceWeighting;
    private identifyRiskFactors;
    private identifyOpportunities;
    private calculateForecastConfidence;
    private calculateDealBreakdown;
    private analyzeStagePerformance;
    private calculateVelocityMetrics;
    private identifyPipelineBottlenecks;
    private benchmarkAgainstHistoricalData;
    private calculateOverallPipelineHealth;
    private generatePipelineRecommendations;
    private calculateBaseLeadScore;
    private calculateEngagementScore;
    private calculateFirmographicScore;
    private scoreToProbability;
    private getScoreFactors;
    private getLeadRecommendations;
    private filterCampaignsByTimeframe;
    private calculateAttribution;
    private calculateCampaignROI;
    private calculateAverageROI;
    private generateAttributionInsights;
}
//# sourceMappingURL=trinity-hubspot-oracle.d.ts.map