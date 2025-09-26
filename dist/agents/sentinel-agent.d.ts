/**
 * Sentinel Agent - Advanced Monitoring and Alerting
 *
 * Trinity AI Pattern: "The vigilance to know what's happening"
 *
 * Provides comprehensive monitoring capabilities including:
 * - Real-time system monitoring
 * - Performance metrics tracking
 * - Anomaly detection and alerting
 * - Health checks and diagnostics
 * - SLA monitoring and reporting
 */
import { BaseAgent } from './base-agent';
import { AgentConfig, MonitoringAgent as IMonitoringAgent } from '../types/agent';
import { Logger } from '../utils/logger';
export type MetricType = 'gauge' | 'counter' | 'histogram' | 'summary';
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'suppressed';
export interface Metric {
    name: string;
    type: MetricType;
    value: number;
    timestamp: Date;
    labels?: Record<string, string>;
    unit?: string;
    description?: string;
}
export interface Threshold {
    id: string;
    metric: string;
    condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    value: number;
    duration?: number;
    severity: AlertLevel;
    enabled: boolean;
    description?: string;
}
export interface Alert {
    id: string;
    level: AlertLevel;
    message: string;
    timestamp: Date;
    status: AlertStatus;
    metric?: string;
    value?: number;
    threshold?: Threshold;
    data?: any;
    resolvedAt?: Date;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    escalationLevel: number;
    suppressedUntil?: Date;
}
export interface HealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime?: number;
    message?: string;
    details?: Record<string, any>;
}
export interface MonitoringTarget {
    id: string;
    name: string;
    type: 'service' | 'database' | 'api' | 'queue' | 'cache' | 'file-system' | 'network';
    endpoint?: string;
    checkInterval: number;
    timeout: number;
    enabled: boolean;
    healthChecks: string[];
    thresholds: string[];
    metadata?: Record<string, any>;
}
export interface MonitoringResult {
    status: 'normal' | 'warning' | 'critical';
    alerts: Alert[];
    metrics: Record<string, number>;
    healthChecks: HealthCheck[];
    summary: {
        totalChecks: number;
        healthyChecks: number;
        warningChecks: number;
        criticalChecks: number;
        averageResponseTime: number;
    };
    timestamp: Date;
}
export declare class SentinelAgent extends BaseAgent implements IMonitoringAgent {
    private metrics;
    private thresholds;
    private alerts;
    private targets;
    private healthChecks;
    private monitoringIntervals;
    private alertHistory;
    private metricRetention;
    constructor(config: AgentConfig, logger: Logger);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    execute(input: any, context?: Record<string, any>): Promise<MonitoringResult>;
    monitor<TData = any>(data: TData, thresholds?: Record<string, any>): Promise<{
        status: 'normal' | 'warning' | 'critical';
        alerts?: Array<{
            level: 'info' | 'warning' | 'error' | 'critical';
            message: string;
            timestamp: Date;
            data?: any;
        }>;
        metrics?: Record<string, number>;
    }>;
    setThreshold(metric: string, threshold: any): void;
    getThresholds(): Record<string, any>;
    private processMetrics;
    private recordMetric;
    private runHealthChecks;
    private performHealthCheck;
    private checkServiceHealth;
    private checkDatabaseHealth;
    private checkApiHealth;
    private checkThresholds;
    private evaluateThreshold;
    private calculateOverallStatus;
    private isMetricKey;
    private getMetricUnit;
    private startMonitoring;
    private stopMonitoring;
    private initializeDefaultTargets;
    private initializeDefaultThresholds;
    addTarget(target: MonitoringTarget): Promise<void>;
    removeTarget(targetId: string): Promise<boolean>;
    getActiveAlerts(): Alert[];
    getAlertHistory(limit?: number): Alert[];
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean>;
    getMetrics(metricName?: string, timeRange?: {
        start: Date;
        end: Date;
    }): Metric[];
}
//# sourceMappingURL=sentinel-agent.d.ts.map