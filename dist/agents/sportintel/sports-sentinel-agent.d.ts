/**
 * SportsSentinelAgent - SportIntel Data Quality & Monitoring Engine
 *
 * Extends OpenConductor's SentinelAgent to provide sports-specific monitoring,
 * data quality validation, and real-time alerting for SportIntel platform.
 *
 * Key Features:
 * - Real-time sports data quality monitoring
 * - Injury report validation and alerting
 * - API health monitoring across multiple providers
 * - Performance anomaly detection
 * - Data freshness validation
 * - Player status change alerts
 * - Weather impact monitoring
 * - System SLA monitoring
 */
import { EventBus } from '../../types/events';
import { Logger } from '../../utils/logger';
import { SentinelAgent, Alert, MonitoringResult } from '../sentinel-agent';
export interface SportsDataMetrics {
    dataFreshness: {
        playerStats: number;
        gameSchedules: number;
        injuryReports: number;
        weatherData: number;
        odds: number;
    };
    dataQuality: {
        completeness: number;
        accuracy: number;
        consistency: number;
        validity: number;
    };
    apiPerformance: {
        responseTime: Record<string, number>;
        errorRate: Record<string, number>;
        rateLimitUsage: Record<string, number>;
        uptime: Record<string, number>;
    };
    predictionAccuracy: {
        playerProjections: number;
        gameOutcomes: number;
        ownershipProjections: number;
        lineupOptimization: number;
    };
}
export interface SportsAlert extends Alert {
    alertType: 'injury_status_change' | 'data_quality_degraded' | 'api_provider_down' | 'prediction_accuracy_drop' | 'high_variance_detected' | 'weather_impact_alert' | 'rate_limit_warning' | 'cost_threshold_exceeded' | 'system_performance_degraded';
    playerId?: string;
    gameId?: string;
    providerId?: string;
    impactAssessment: {
        severity: 'low' | 'medium' | 'high' | 'critical';
        affectedUsers: number;
        affectedPredictions: number;
        estimatedRevenue: number;
        timeToResolution: number;
    };
    recommendedActions: string[];
    escalationRules: {
        autoEscalate: boolean;
        escalationDelay: number;
        escalateTo: string[];
    };
}
export interface DataProviderHealth {
    providerId: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'down';
    responseTime: number;
    errorRate: number;
    rateLimitRemaining: number;
    rateLimitResetTime: Date;
    lastSuccessfulCall: Date;
    dataFreshness: number;
    costMetrics: {
        callsToday: number;
        estimatedDailyCost: number;
        monthlyBudgetUsed: number;
    };
    slaMetrics: {
        uptimeToday: number;
        uptimeWeek: number;
        uptimeMonth: number;
        averageResponseTime: number;
    };
}
export interface PredictionQualityMetrics {
    modelId: string;
    accuracy: {
        overall: number;
        byPosition?: Record<string, number>;
        byTeam?: Record<string, number>;
        byWeather?: Record<string, number>;
    };
    calibration: number;
    coverage: number;
    bias: {
        overall: number;
        systematic: Record<string, number>;
    };
    variance: number;
    lastUpdated: Date;
    sampleSize: number;
}
export declare class SportsSentinelAgent extends SentinelAgent {
    private readonly dataProviders;
    private readonly predictionMetrics;
    private readonly sportsDataMetrics;
    private readonly costTracker;
    private readonly alertHistory;
    constructor(eventBus: EventBus, logger?: Logger);
    /**
     * Initialize sports-specific monitoring capabilities
     */
    private initializeSportsMonitoring;
    /**
     * Set up sports-specific monitoring thresholds
     */
    private setupSportsThresholds;
    /**
     * Monitor sports data quality across all providers
     */
    monitorSportsDataQuality(): Promise<MonitoringResult>;
    /**
     * Handle injury status changes with immediate alerting
     */
    handleInjuryStatusChange(event: {
        playerId: string;
        previousStatus: string;
        newStatus: string;
        timestamp: Date;
        source: string;
    }): Promise<void>;
    /**
     * Validate game data integrity and completeness
     */
    validateGameData(gameData: any): Promise<{
        isValid: boolean;
        completeness: number;
        issues: Array<{
            field: string;
            issue: string;
            severity: 'low' | 'medium' | 'high';
        }>;
    }>;
    /**
     * Track prediction accuracy over time
     */
    trackPredictionAccuracy(result: {
        modelId: string;
        predictionId: string;
        predicted: number;
        actual: number;
        confidence: number;
        metadata?: any;
    }): Promise<void>;
    /**
     * Track API usage and costs
     */
    trackApiUsage(usage: {
        providerId: string;
        endpoint: string;
        responseTime: number;
        success: boolean;
        cost?: number;
        rateLimitRemaining?: number;
    }): Promise<void>;
    private initializeDataProviders;
    private initializeProviderHealth;
    private checkDataFreshness;
    private validateDataQuality;
    private checkApiHealth;
    private checkPredictionAccuracy;
    private checkCostMetrics;
    private generateQualityAlerts;
    private createDataFreshnessAlert;
    private createDataQualityAlert;
    private calculateOverallDataHealth;
    private updateSportsMetrics;
    private convertToStandardMetrics;
    private runSportsHealthChecks;
    private generateOptimizationRecommendations;
    private assessInjuryImpact;
    private getInjurySeverityLevel;
    private getInjuryRecommendedActions;
    private sendImmediateAlert;
    private createPredictionAccuracyAlert;
    private checkProviderAlerts;
    private createProviderAlert;
    private isValidDateTime;
    private startDataFreshnessMonitoring;
    private startPredictionAccuracyMonitoring;
    private startApiHealthMonitoring;
    private startCostTracking;
}
//# sourceMappingURL=sports-sentinel-agent.d.ts.map