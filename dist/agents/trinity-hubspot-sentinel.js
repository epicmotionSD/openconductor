"use strict";
/**
 * Trinity HubSpot Sentinel Agent - Enhanced Monitoring and Anomaly Detection
 * OpenConductor agent optimized for HubSpot performance monitoring and alerting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrinityHubSpotSentinelAgent = void 0;
const base_agent_1 = require("./base-agent");
class TrinityHubSpotSentinelAgent extends base_agent_1.BaseAgent {
    monitoringData = null;
    alerts = [];
    thresholds;
    monitoringInterval = null;
    alertHistory = [];
    maxAlertHistory = 1000;
    constructor(eventBus) {
        const capabilities = [
            {
                name: 'hubspot_system_monitoring',
                description: 'Monitor HubSpot API performance and system health',
                parameters: {
                    type: 'object',
                    properties: {
                        monitoringDuration: { type: 'string', enum: ['1h', '4h', '24h', '7d'] },
                        includeAPIMetrics: { type: 'boolean', default: true },
                        includeDataQuality: { type: 'boolean', default: true },
                        alertThresholds: {
                            type: 'object',
                            properties: {
                                responseTime: { type: 'number', default: 2000 },
                                errorRate: { type: 'number', default: 0.05 },
                                dataQualityScore: { type: 'number', default: 0.8 }
                            }
                        }
                    }
                }
            },
            {
                name: 'hubspot_pipeline_monitoring',
                description: 'Monitor sales pipeline health and detect anomalies',
                parameters: {
                    type: 'object',
                    properties: {
                        detectStagnation: { type: 'boolean', default: true },
                        monitorVelocity: { type: 'boolean', default: true },
                        trackConversionRates: { type: 'boolean', default: true },
                        alertOnAnomalies: { type: 'boolean', default: true }
                    }
                }
            },
            {
                name: 'hubspot_data_quality_audit',
                description: 'Audit HubSpot data quality and identify issues',
                parameters: {
                    type: 'object',
                    properties: {
                        checkDuplicates: { type: 'boolean', default: true },
                        validateCompleteness: { type: 'boolean', default: true },
                        identifyStaleData: { type: 'boolean', default: true },
                        generateReport: { type: 'boolean', default: true }
                    }
                }
            },
            {
                name: 'hubspot_campaign_monitoring',
                description: 'Monitor marketing campaign performance and detect issues',
                parameters: {
                    type: 'object',
                    properties: {
                        trackEngagement: { type: 'boolean', default: true },
                        monitorConversions: { type: 'boolean', default: true },
                        detectUnderperforming: { type: 'boolean', default: true },
                        compareToBaseline: { type: 'boolean', default: true }
                    }
                }
            },
            {
                name: 'alert_management',
                description: 'Manage alerts, acknowledgments, and escalations',
                parameters: {
                    type: 'object',
                    properties: {
                        action: { type: 'string', enum: ['list', 'acknowledge', 'escalate', 'resolve'] },
                        alertIds: { type: 'array', items: { type: 'string' } },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
                    },
                    required: ['action']
                }
            }
        ];
        super('trinity-hubspot-sentinel', 'Enhanced Sentinel Agent for HubSpot Monitoring', capabilities, eventBus);
        // Default monitoring thresholds
        this.thresholds = {
            apiResponseTime: 2000, // 2 seconds
            errorRate: 0.05, // 5%
            dataQualityScore: 0.8, // 80%
            pipelineVelocity: 0.1, // 10% change threshold
            campaignPerformance: 0.15 // 15% below baseline
        };
        this.on('monitoring_data_updated', (data) => {
            this.monitoringData = data;
            this.analyzeAndGenerateAlerts(data);
        });
        // Start continuous monitoring
        this.startContinuousMonitoring();
    }
    /**
     * Execute capability with HubSpot-optimized monitoring logic
     */
    async executeCapability(capabilityName, parameters) {
        switch (capabilityName) {
            case 'hubspot_system_monitoring':
                return await this.monitorSystemHealth(parameters);
            case 'hubspot_pipeline_monitoring':
                return await this.monitorPipelineHealth(parameters);
            case 'hubspot_data_quality_audit':
                return await this.auditDataQuality(parameters);
            case 'hubspot_campaign_monitoring':
                return await this.monitorCampaignPerformance(parameters);
            case 'alert_management':
                return await this.manageAlerts(parameters);
            default:
                throw new Error(`Unknown capability: ${capabilityName}`);
        }
    }
    /**
     * Monitor HubSpot system health and API performance
     */
    async monitorSystemHealth(parameters) {
        const { monitoringDuration = '24h', includeAPIMetrics = true, includeDataQuality = true, alertThresholds = {} } = parameters;
        // Update thresholds if provided
        this.updateThresholds(alertThresholds);
        const results = {
            timestamp: new Date().toISOString(),
            duration: monitoringDuration,
            systemHealth: 'healthy',
            components: {}
        };
        if (includeAPIMetrics && this.monitoringData?.apiMetrics) {
            const apiHealth = this.assessAPIHealth(this.monitoringData.apiMetrics);
            results.components.api = apiHealth;
            if (apiHealth.status !== 'healthy') {
                results.systemHealth = apiHealth.status;
            }
        }
        if (includeDataQuality && this.monitoringData?.dataQuality) {
            const dataQualityHealth = this.assessDataQualityHealth(this.monitoringData.dataQuality);
            results.components.dataQuality = dataQualityHealth;
            if (dataQualityHealth.status === 'unhealthy') {
                results.systemHealth = 'unhealthy';
            }
            else if (dataQualityHealth.status === 'degraded' && results.systemHealth === 'healthy') {
                results.systemHealth = 'degraded';
            }
        }
        // Include active alerts
        results.components.alerts = {
            active: this.getActiveAlerts(),
            critical: this.getAlertsBySeverity('critical').length,
            high: this.getAlertsBySeverity('high').length,
            medium: this.getAlertsBySeverity('medium').length,
            low: this.getAlertsBySeverity('low').length
        };
        return results;
    }
    /**
     * Monitor sales pipeline health and detect anomalies
     */
    async monitorPipelineHealth(parameters) {
        const { detectStagnation = true, monitorVelocity = true, trackConversionRates = true, alertOnAnomalies = true } = parameters;
        if (!this.monitoringData?.pipelineHealth) {
            return { error: 'Pipeline monitoring data not available' };
        }
        const pipelineHealth = this.monitoringData.pipelineHealth;
        const results = {
            timestamp: new Date().toISOString(),
            overallHealth: 'healthy',
            issues: [],
            metrics: {}
        };
        // Stage distribution analysis
        if (pipelineHealth.stageDistribution) {
            const stageAnalysis = this.analyzeStageDistribution(pipelineHealth.stageDistribution);
            results.metrics.stageDistribution = stageAnalysis;
            if (stageAnalysis.bottlenecks.length > 0) {
                results.issues.push(...stageAnalysis.bottlenecks);
                results.overallHealth = 'degraded';
            }
        }
        // Velocity monitoring
        if (monitorVelocity && pipelineHealth.velocityTrends) {
            const velocityAnalysis = this.analyzeVelocityTrends(pipelineHealth.velocityTrends);
            results.metrics.velocity = velocityAnalysis;
            if (velocityAnalysis.trendDirection === 'declining') {
                results.issues.push('Pipeline velocity declining');
                results.overallHealth = 'degraded';
            }
        }
        // Conversion rate tracking
        if (trackConversionRates && pipelineHealth.conversionRates) {
            const conversionAnalysis = this.analyzeConversionRates(pipelineHealth.conversionRates);
            results.metrics.conversions = conversionAnalysis;
            if (conversionAnalysis.belowThreshold.length > 0) {
                results.issues.push(...conversionAnalysis.belowThreshold.map(stage => `${stage} conversion rate below threshold`));
                results.overallHealth = 'unhealthy';
            }
        }
        // Generate alerts if enabled and anomalies detected
        if (alertOnAnomalies && results.issues.length > 0) {
            await this.generatePipelineAlerts(results.issues);
        }
        return results;
    }
    /**
     * Audit HubSpot data quality and identify issues
     */
    async auditDataQuality(parameters) {
        const { checkDuplicates = true, validateCompleteness = true, identifyStaleData = true, generateReport = true } = parameters;
        if (!this.monitoringData?.dataQuality) {
            return { error: 'Data quality monitoring data not available' };
        }
        const dataQuality = this.monitoringData.dataQuality;
        const auditResults = {
            timestamp: new Date().toISOString(),
            overallScore: 0,
            issues: [],
            recommendations: []
        };
        let totalScore = 0;
        let scoreComponents = 0;
        if (checkDuplicates) {
            const duplicateScore = this.calculateDuplicateScore(dataQuality.duplicateContacts);
            totalScore += duplicateScore;
            scoreComponents++;
            if (duplicateScore < 0.8) {
                auditResults.issues.push({
                    type: 'duplicates',
                    severity: duplicateScore < 0.5 ? 'high' : 'medium',
                    count: dataQuality.duplicateContacts,
                    impact: 'Data accuracy and reporting reliability affected'
                });
                auditResults.recommendations.push('Implement duplicate detection and merging process');
            }
        }
        if (validateCompleteness) {
            const completenessScore = this.calculateCompletenessScore(dataQuality.incompleteRecords);
            totalScore += completenessScore;
            scoreComponents++;
            if (completenessScore < 0.8) {
                auditResults.issues.push({
                    type: 'incomplete_records',
                    severity: completenessScore < 0.5 ? 'high' : 'medium',
                    count: dataQuality.incompleteRecords,
                    impact: 'Marketing automation and lead scoring affected'
                });
                auditResults.recommendations.push('Enhance data collection forms and validation rules');
            }
        }
        if (identifyStaleData) {
            const staleness = this.calculateStalenessScore(dataQuality.staleData);
            totalScore += staleness;
            scoreComponents++;
            if (staleness < 0.8) {
                auditResults.issues.push({
                    type: 'stale_data',
                    severity: staleness < 0.5 ? 'high' : 'medium',
                    count: dataQuality.staleData,
                    impact: 'Outdated contact information affecting campaign effectiveness'
                });
                auditResults.recommendations.push('Implement regular data refresh and validation workflows');
            }
        }
        auditResults.overallScore = totalScore / scoreComponents;
        // Generate comprehensive report if requested
        if (generateReport) {
            return {
                ...auditResults,
                report: this.generateDataQualityReport(auditResults)
            };
        }
        return auditResults;
    }
    /**
     * Monitor marketing campaign performance
     */
    async monitorCampaignPerformance(parameters) {
        const { trackEngagement = true, monitorConversions = true, detectUnderperforming = true, compareToBaseline = true } = parameters;
        if (!this.monitoringData?.marketingMetrics) {
            return { error: 'Marketing metrics data not available' };
        }
        const marketingMetrics = this.monitoringData.marketingMetrics;
        const results = {
            timestamp: new Date().toISOString(),
            overallPerformance: 'good',
            campaigns: [],
            alerts: []
        };
        for (const campaign of marketingMetrics.campaignPerformance) {
            const campaignAnalysis = {
                id: campaign.id,
                name: campaign.name,
                performance: {}
            };
            if (trackEngagement) {
                campaignAnalysis.performance.engagement = this.analyzeCampaignEngagement(campaign);
            }
            if (monitorConversions) {
                campaignAnalysis.performance.conversions = this.analyzeCampaignConversions(campaign);
            }
            if (detectUnderperforming) {
                const underperforming = this.detectUnderperformingCampaign(campaign);
                if (underperforming) {
                    results.alerts.push({
                        type: 'underperforming_campaign',
                        campaignId: campaign.id,
                        campaignName: campaign.name,
                        issues: underperforming.issues,
                        recommendations: underperforming.recommendations
                    });
                    results.overallPerformance = 'poor';
                }
            }
            results.campaigns.push(campaignAnalysis);
        }
        return results;
    }
    /**
     * Manage alerts (list, acknowledge, escalate, resolve)
     */
    async manageAlerts(parameters) {
        const { action, alertIds = [], severity } = parameters;
        switch (action) {
            case 'list':
                return {
                    alerts: severity ? this.getAlertsBySeverity(severity) : this.getActiveAlerts(),
                    summary: this.getAlertSummary()
                };
            case 'acknowledge':
                return this.acknowledgeAlerts(alertIds);
            case 'escalate':
                return this.escalateAlerts(alertIds);
            case 'resolve':
                return this.resolveAlerts(alertIds);
            default:
                throw new Error(`Unknown alert action: ${action}`);
        }
    }
    /**
     * Start continuous monitoring in the background
     */
    startContinuousMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        // Monitor every 5 minutes
        this.monitoringInterval = setInterval(() => {
            this.performContinuousCheck();
        }, 5 * 60 * 1000);
    }
    /**
     * Perform continuous monitoring checks
     */
    async performContinuousCheck() {
        if (this.monitoringData) {
            await this.analyzeAndGenerateAlerts(this.monitoringData);
        }
    }
    /**
     * Analyze monitoring data and generate alerts
     */
    async analyzeAndGenerateAlerts(data) {
        const newAlerts = [];
        // API performance alerts
        if (data.apiMetrics) {
            const apiAlerts = this.checkAPIThresholds(data.apiMetrics);
            newAlerts.push(...apiAlerts);
        }
        // Data quality alerts
        if (data.dataQuality) {
            const qualityAlerts = this.checkDataQualityThresholds(data.dataQuality);
            newAlerts.push(...qualityAlerts);
        }
        // Pipeline health alerts
        if (data.pipelineHealth) {
            const pipelineAlerts = this.checkPipelineThresholds(data.pipelineHealth);
            newAlerts.push(...pipelineAlerts);
        }
        // Add new alerts
        for (const alert of newAlerts) {
            this.addAlert(alert);
            this.emit('alert_generated', alert);
        }
    }
    /**
     * Helper methods for monitoring and analysis
     */
    addAlert(alert) {
        this.alerts.push(alert);
        this.alertHistory.push({ ...alert });
        // Maintain alert history limit
        if (this.alertHistory.length > this.maxAlertHistory) {
            this.alertHistory = this.alertHistory.slice(-this.maxAlertHistory);
        }
    }
    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.acknowledged);
    }
    getAlertsBySeverity(severity) {
        return this.alerts.filter(alert => alert.severity === severity);
    }
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }
    // Stub methods for detailed analysis (would be implemented with actual logic)
    assessAPIHealth(metrics) { return { status: 'healthy', details: metrics }; }
    assessDataQualityHealth(quality) { return { status: 'healthy', score: 0.9 }; }
    analyzeStageDistribution(distribution) { return { bottlenecks: [] }; }
    analyzeVelocityTrends(trends) { return { trendDirection: 'stable' }; }
    analyzeConversionRates(rates) { return { belowThreshold: [] }; }
    generatePipelineAlerts(issues) { return Promise.resolve(); }
    calculateDuplicateScore(duplicates) { return Math.max(0, 1 - (duplicates / 1000)); }
    calculateCompletenessScore(incomplete) { return Math.max(0, 1 - (incomplete / 1000)); }
    calculateStalenessScore(stale) { return Math.max(0, 1 - (stale / 1000)); }
    generateDataQualityReport(results) { return 'Data quality report generated'; }
    analyzeCampaignEngagement(campaign) { return { rate: 0.15 }; }
    analyzeCampaignConversions(campaign) { return { rate: 0.05 }; }
    detectUnderperformingCampaign(campaign) { return null; }
    getAlertSummary() { return { total: this.alerts.length, active: this.getActiveAlerts().length }; }
    acknowledgeAlerts(alertIds) { return { acknowledged: alertIds.length }; }
    escalateAlerts(alertIds) { return { escalated: alertIds.length }; }
    resolveAlerts(alertIds) { return { resolved: alertIds.length }; }
    checkAPIThresholds(metrics) { return []; }
    checkDataQualityThresholds(quality) { return []; }
    checkPipelineThresholds(pipeline) { return []; }
    /**
     * Cleanup monitoring resources
     */
    async cleanup() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        await super.cleanup();
    }
}
exports.TrinityHubSpotSentinelAgent = TrinityHubSpotSentinelAgent;
//# sourceMappingURL=trinity-hubspot-sentinel.js.map