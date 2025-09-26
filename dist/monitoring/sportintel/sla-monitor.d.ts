/**
 * SportIntel SLA Monitor
 *
 * Monitors Service Level Agreements and Bloomberg Terminal-level performance
 * requirements with automated alerting and escalation procedures.
 */
import { EventBus } from '../../events/event-bus';
interface SLABreach {
    slaName: string;
    currentValue: number;
    targetValue: number;
    severity: 'warning' | 'critical';
    timestamp: Date;
    duration?: number;
    description: string;
}
/**
 * SLA Monitor for Bloomberg Terminal-level performance
 */
export declare class SportIntelSLAMonitor {
    private logger;
    private config;
    private eventBus;
    private slaTargets;
    private activeBreeches;
    private alertChannels;
    private monitoringInterval;
    private readonly BLOOMBERG_SLAS;
    constructor(eventBus: EventBus);
    /**
     * Initialize SLA targets
     */
    private initializeSLAs;
    /**
     * Setup alert channels
     */
    private setupAlertChannels;
    /**
     * Start SLA monitoring
     */
    private startMonitoring;
    /**
     * Stop SLA monitoring
     */
    stopMonitoring(): void;
    /**
     * Check all SLAs
     */
    private checkAllSLAs;
    /**
     * Check individual SLA
     */
    private checkSLA;
    /**
     * Evaluate SLA against current value
     */
    private evaluateSLA;
    /**
     * Handle SLA breach
     */
    private handleSLABreach;
    /**
     * Resolve SLA breach
     */
    private resolveSLABreach;
    /**
     * Send alerts for SLA breach
     */
    private sendAlerts;
    /**
     * Send email alert
     */
    private sendEmailAlert;
    /**
     * Send Slack alert
     */
    private sendSlackAlert;
    /**
     * Send PagerDuty alert
     */
    private sendPagerDutyAlert;
    /**
     * Send webhook alert
     */
    private sendWebhookAlert;
    /**
     * Send breach resolution notification
     */
    private sendResolutionNotification;
    /**
     * Simulate metric value for testing
     */
    private simulateMetricValue;
    /**
     * Check if metric is performance-based (higher = worse)
     */
    private isPerformanceMetric;
    /**
     * Get current SLA status
     */
    getSLAStatus(): any;
    /**
     * Get SLA breach history
     */
    getBreachHistory(hours?: number): SLABreach[];
    /**
     * Force SLA check
     */
    forceSLACheck(): Promise<void>;
}
export default SportIntelSLAMonitor;
//# sourceMappingURL=sla-monitor.d.ts.map