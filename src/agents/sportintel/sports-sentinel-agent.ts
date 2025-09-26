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
import { AgentConfig } from '../../types/agent';
import { 
  SentinelAgent, 
  Metric, 
  Threshold, 
  Alert, 
  HealthCheck, 
  MonitoringTarget, 
  MonitoringResult 
} from '../sentinel-agent';

// Sports-specific monitoring interfaces
export interface SportsDataMetrics {
  dataFreshness: {
    playerStats: number; // Minutes since last update
    gameSchedules: number;
    injuryReports: number;
    weatherData: number;
    odds: number;
  };
  dataQuality: {
    completeness: number; // 0-1 score
    accuracy: number;
    consistency: number;
    validity: number;
  };
  apiPerformance: {
    responseTime: Record<string, number>; // Provider -> ms
    errorRate: Record<string, number>; // Provider -> %
    rateLimitUsage: Record<string, number>; // Provider -> % of limit used
    uptime: Record<string, number>; // Provider -> % uptime
  };
  predictionAccuracy: {
    playerProjections: number; // Rolling accuracy over last 7 days
    gameOutcomes: number;
    ownershipProjections: number;
    lineupOptimization: number;
  };
}

export interface SportsAlert extends Alert {
  alertType: 
    | 'injury_status_change'
    | 'data_quality_degraded' 
    | 'api_provider_down'
    | 'prediction_accuracy_drop'
    | 'high_variance_detected'
    | 'weather_impact_alert'
    | 'rate_limit_warning'
    | 'cost_threshold_exceeded'
    | 'system_performance_degraded';
  playerId?: string;
  gameId?: string;
  providerId?: string;
  impactAssessment: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers: number;
    affectedPredictions: number;
    estimatedRevenue: number;
    timeToResolution: number; // estimated minutes
  };
  recommendedActions: string[];
  escalationRules: {
    autoEscalate: boolean;
    escalationDelay: number; // minutes
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
  dataFreshness: number; // minutes
  costMetrics: {
    callsToday: number;
    estimatedDailyCost: number;
    monthlyBudgetUsed: number; // percentage
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
  calibration: number; // How well confidence scores match actual accuracy
  coverage: number; // Percentage of predictions within confidence intervals
  bias: {
    overall: number;
    systematic: Record<string, number>; // Consistent over/under predictions
  };
  variance: number;
  lastUpdated: Date;
  sampleSize: number;
}

export class SportsSentinelAgent extends SentinelAgent {
  private readonly dataProviders: Map<string, DataProviderHealth> = new Map();
  private readonly predictionMetrics: Map<string, PredictionQualityMetrics> = new Map();
  private readonly sportsDataMetrics: SportsDataMetrics;
  private readonly costTracker: Map<string, { calls: number; cost: number; timestamp: Date }> = new Map();
  private readonly alertHistory: Map<string, SportsAlert[]> = new Map();
  
  constructor(eventBus: EventBus, logger?: Logger) {
    super({
      id: 'sports-sentinel-agent',
      name: 'SportIntel Sentinel Agent',
      version: '1.0.0',
      type: 'monitoring',
      description: 'Advanced monitoring and data quality engine for SportIntel platform',
      author: 'SportIntel.ai',
      capabilities: [
        {
          type: 'monitoring',
          name: 'data-quality-monitoring',
          description: 'Comprehensive sports data quality validation',
          version: '1.0.0'
        },
        {
          type: 'monitoring',
          name: 'api-health-monitoring',
          description: 'Multi-provider API health and performance monitoring',
          version: '1.0.0'
        },
        {
          type: 'real-time-processing',
          name: 'injury-alert-system',
          description: 'Real-time injury status change detection and alerting',
          version: '1.0.0'
        },
        {
          type: 'monitoring',
          name: 'prediction-accuracy-tracking',
          description: 'ML model accuracy and performance monitoring',
          version: '1.0.0'
        },
        {
          type: 'monitoring',
          name: 'cost-optimization-monitoring',
          description: 'API cost tracking and budget optimization',
          version: '1.0.0'
        }
      ],
      tools: [
        {
          id: 'data-validator',
          name: 'Sports Data Validator',
          type: 'data-quality',
          version: '1.0.0',
          description: 'Validates sports data completeness and accuracy',
          config: {
            validationRules: ['completeness', 'consistency', 'timeliness', 'accuracy'],
            thresholds: { completeness: 0.95, consistency: 0.98, timeliness: 300 }
          }
        },
        {
          id: 'api-monitor',
          name: 'Multi-Provider API Monitor',
          type: 'api-monitoring',
          version: '1.0.0',
          description: 'Monitors health across multiple sports data providers',
          config: {
            providers: ['MySportsFeeds', 'API-Sports', 'WeatherAPI'],
            healthCheckInterval: 60000, // 1 minute
            timeoutThreshold: 5000
          }
        },
        {
          id: 'cost-tracker',
          name: 'API Cost Tracker',
          type: 'cost-monitoring',
          version: '1.0.0',
          description: 'Tracks and optimizes API usage costs',
          config: {
            monthlyBudget: 150, // $150 target
            alertThresholds: [0.7, 0.85, 0.95], // 70%, 85%, 95%
            costPerCall: { 'MySportsFeeds': 0.01, 'API-Sports': 0.005 }
          }
        },
        {
          id: 'prediction-tracker',
          name: 'Prediction Accuracy Tracker',
          type: 'ml-monitoring',
          version: '1.0.0',
          description: 'Monitors ML model performance and accuracy',
          config: {
            accuracyThresholds: { playerProjections: 0.65, gameOutcomes: 0.58 },
            calibrationWindow: 168, // hours
            minSampleSize: 50
          }
        }
      ],
      memory: {
        type: 'persistent',
        store: 'redis',
        ttl: 604800, // 7 days
        encryption: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }, logger);

    // Initialize sports-specific metrics
    this.sportsDataMetrics = {
      dataFreshness: {
        playerStats: 0,
        gameSchedules: 0,
        injuryReports: 0,
        weatherData: 0,
        odds: 0
      },
      dataQuality: {
        completeness: 1.0,
        accuracy: 1.0,
        consistency: 1.0,
        validity: 1.0
      },
      apiPerformance: {
        responseTime: {},
        errorRate: {},
        rateLimitUsage: {},
        uptime: {}
      },
      predictionAccuracy: {
        playerProjections: 0.65,
        gameOutcomes: 0.58,
        ownershipProjections: 0.72,
        lineupOptimization: 0.68
      }
    };

    this.initializeSportsMonitoring();
    this.setupSportsThresholds();
    this.startCostTracking();
  }

  /**
   * Initialize sports-specific monitoring capabilities
   */
  private initializeSportsMonitoring(): void {
    this.log('info', 'Initializing SportIntel monitoring systems');

    // Initialize data provider monitoring
    this.initializeDataProviders();
    
    // Set up event listeners for sports-specific events
    this.on('player_injury_updated', this.handleInjuryStatusChange.bind(this));
    this.on('game_data_updated', this.validateGameData.bind(this));
    this.on('prediction_result', this.trackPredictionAccuracy.bind(this));
    this.on('api_call_made', this.trackApiUsage.bind(this));
    this.on('weather_data_updated', this.validateWeatherData.bind(this));
    
    // Start continuous monitoring loops
    this.startDataFreshnessMonitoring();
    this.startPredictionAccuracyMonitoring();
    this.startApiHealthMonitoring();
  }

  /**
   * Set up sports-specific monitoring thresholds
   */
  private setupSportsThresholds(): void {
    // Data freshness thresholds (in minutes)
    this.setThreshold('data_freshness_player_stats', { condition: 'greater_than', value: 15, severity: 'warning' });
    this.setThreshold('data_freshness_injury_reports', { condition: 'greater_than', value: 5, severity: 'critical' });
    this.setThreshold('data_freshness_game_schedules', { condition: 'greater_than', value: 60, severity: 'warning' });
    
    // Data quality thresholds
    this.setThreshold('data_completeness', { condition: 'less_than', value: 0.95, severity: 'warning' });
    this.setThreshold('data_accuracy', { condition: 'less_than', value: 0.98, severity: 'critical' });
    
    // API performance thresholds
    this.setThreshold('api_response_time', { condition: 'greater_than', value: 2000, severity: 'warning' });
    this.setThreshold('api_error_rate', { condition: 'greater_than', value: 0.05, severity: 'critical' });
    this.setThreshold('api_rate_limit_usage', { condition: 'greater_than', value: 0.8, severity: 'warning' });
    
    // Prediction accuracy thresholds
    this.setThreshold('player_projection_accuracy', { condition: 'less_than', value: 0.60, severity: 'warning' });
    this.setThreshold('game_outcome_accuracy', { condition: 'less_than', value: 0.55, severity: 'warning' });
    
    // Cost monitoring thresholds
    this.setThreshold('monthly_cost_usage', { condition: 'greater_than', value: 0.85, severity: 'warning' });
    this.setThreshold('daily_cost_spike', { condition: 'greater_than', value: 10, severity: 'critical' });
  }

  /**
   * Monitor sports data quality across all providers
   */
  async monitorSportsDataQuality(): Promise<MonitoringResult> {
    this.log('info', 'Running comprehensive sports data quality check');

    try {
      const results: any = {
        dataFreshness: await this.checkDataFreshness(),
        dataQuality: await this.validateDataQuality(),
        apiHealth: await this.checkApiHealth(),
        predictionAccuracy: await this.checkPredictionAccuracy(),
        costMetrics: await this.checkCostMetrics()
      };

      const alerts = await this.generateQualityAlerts(results);
      const overallStatus = this.calculateOverallDataHealth(results);

      // Update metrics
      this.updateSportsMetrics(results);

      // Emit data quality event
      this.emit('sports_data_quality_check', {
        timestamp: new Date(),
        status: overallStatus,
        metrics: results,
        alerts: alerts.length
      });

      return {
        status: overallStatus,
        timestamp: new Date(),
        alerts,
        metrics: this.convertToStandardMetrics(results),
        healthChecks: await this.runSportsHealthChecks(),
        recommendations: this.generateOptimizationRecommendations(results)
      };

    } catch (error) {
      this.log('error', 'Sports data quality monitoring failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Handle injury status changes with immediate alerting
   */
  async handleInjuryStatusChange(event: {
    playerId: string;
    previousStatus: string;
    newStatus: string;
    timestamp: Date;
    source: string;
  }): Promise<void> {
    const { playerId, previousStatus, newStatus, timestamp, source } = event;
    
    this.log('info', `Injury status change detected`, {
      playerId,
      previousStatus,
      newStatus,
      source
    });

    // Calculate impact of status change
    const impactAssessment = await this.assessInjuryImpact(playerId, newStatus);

    // Create sports-specific alert
    const alert: SportsAlert = {
      id: `injury-${playerId}-${timestamp.getTime()}`,
      level: this.getInjurySeverityLevel(previousStatus, newStatus),
      message: `Player ${playerId} injury status changed from ${previousStatus} to ${newStatus}`,
      timestamp,
      resolved: false,
      alertType: 'injury_status_change',
      playerId,
      data: {
        previousStatus,
        newStatus,
        source,
        confidence: impactAssessment.confidence
      },
      impactAssessment,
      recommendedActions: this.getInjuryRecommendedActions(playerId, newStatus),
      escalationRules: {
        autoEscalate: newStatus === 'out',
        escalationDelay: 5,
        escalateTo: ['ops-team', 'content-team']
      }
    };

    // Store alert
    this.addAlert(alert);

    // Trigger immediate notifications for high-impact injuries
    if (impactAssessment.severity === 'critical' || impactAssessment.severity === 'high') {
      await this.sendImmediateAlert(alert);
    }

    // Update prediction models if needed
    if (impactAssessment.affectedPredictions > 0) {
      this.emit('prediction_invalidation_needed', {
        playerId,
        reason: 'injury_status_change',
        urgency: impactAssessment.severity
      });
    }
  }

  /**
   * Validate game data integrity and completeness
   */
  async validateGameData(gameData: any): Promise<{
    isValid: boolean;
    completeness: number;
    issues: Array<{ field: string; issue: string; severity: 'low' | 'medium' | 'high' }>;
  }> {
    const issues: Array<{ field: string; issue: string; severity: 'low' | 'medium' | 'high' }> = [];
    let validFieldCount = 0;
    const totalFields = 20; // Expected number of critical fields

    // Check required fields
    const requiredFields = ['gameId', 'homeTeam', 'awayTeam', 'gameTime', 'venue'];
    for (const field of requiredFields) {
      if (!gameData[field]) {
        issues.push({
          field,
          issue: 'Missing required field',
          severity: 'high'
        });
      } else {
        validFieldCount++;
      }
    }

    // Validate data types and formats
    if (gameData.gameTime && !this.isValidDateTime(gameData.gameTime)) {
      issues.push({
        field: 'gameTime',
        issue: 'Invalid date format',
        severity: 'medium'
      });
    } else if (gameData.gameTime) {
      validFieldCount++;
    }

    // Check for data consistency
    if (gameData.homeTeam === gameData.awayTeam) {
      issues.push({
        field: 'teams',
        issue: 'Home and away teams are the same',
        severity: 'high'
      });
    }

    // Validate numeric fields
    if (gameData.temperature && (gameData.temperature < -20 || gameData.temperature > 120)) {
      issues.push({
        field: 'temperature',
        issue: 'Temperature outside reasonable range',
        severity: 'low'
      });
    } else if (gameData.temperature) {
      validFieldCount++;
    }

    const completeness = validFieldCount / totalFields;
    const isValid = issues.filter(i => i.severity === 'high').length === 0;

    // Log validation results
    this.log('debug', `Game data validation completed`, {
      gameId: gameData.gameId,
      isValid,
      completeness,
      issueCount: issues.length
    });

    return { isValid, completeness, issues };
  }

  /**
   * Track prediction accuracy over time
   */
  async trackPredictionAccuracy(result: {
    modelId: string;
    predictionId: string;
    predicted: number;
    actual: number;
    confidence: number;
    metadata?: any;
  }): Promise<void> {
    const { modelId, predicted, actual, confidence, metadata } = result;
    
    // Calculate accuracy metrics
    const absoluteError = Math.abs(predicted - actual);
    const relativeError = Math.abs((predicted - actual) / actual);
    const withinConfidence = absoluteError <= (confidence * predicted);

    // Update model metrics
    let modelMetrics = this.predictionMetrics.get(modelId);
    if (!modelMetrics) {
      modelMetrics = {
        modelId,
        accuracy: { overall: 0 },
        calibration: 0,
        coverage: 0,
        bias: { overall: 0, systematic: {} },
        variance: 0,
        lastUpdated: new Date(),
        sampleSize: 0
      };
      this.predictionMetrics.set(modelId, modelMetrics);
    }

    // Update rolling accuracy (simplified implementation)
    const currentAccuracy = modelMetrics.accuracy.overall;
    const newSampleSize = modelMetrics.sampleSize + 1;
    const newAccuracy = ((currentAccuracy * modelMetrics.sampleSize) + (1 - relativeError)) / newSampleSize;
    
    modelMetrics.accuracy.overall = Math.max(0, Math.min(1, newAccuracy));
    modelMetrics.sampleSize = newSampleSize;
    modelMetrics.lastUpdated = new Date();

    // Update coverage (confidence interval accuracy)
    const currentCoverage = modelMetrics.coverage;
    const newCoverage = ((currentCoverage * (newSampleSize - 1)) + (withinConfidence ? 1 : 0)) / newSampleSize;
    modelMetrics.coverage = newCoverage;

    // Check for accuracy degradation
    if (newAccuracy < 0.6 && modelId.includes('player')) {
      await this.createPredictionAccuracyAlert(modelId, newAccuracy, 'player_projection_accuracy_drop');
    }

    this.log('debug', `Prediction accuracy tracked`, {
      modelId,
      accuracy: newAccuracy,
      coverage: newCoverage,
      sampleSize: newSampleSize
    });
  }

  /**
   * Track API usage and costs
   */
  async trackApiUsage(usage: {
    providerId: string;
    endpoint: string;
    responseTime: number;
    success: boolean;
    cost?: number;
    rateLimitRemaining?: number;
  }): Promise<void> {
    const { providerId, endpoint, responseTime, success, cost, rateLimitRemaining } = usage;
    
    // Update provider health metrics
    let providerHealth = this.dataProviders.get(providerId);
    if (!providerHealth) {
      providerHealth = this.initializeProviderHealth(providerId);
      this.dataProviders.set(providerId, providerHealth);
    }

    // Update response time and error rate
    providerHealth.responseTime = ((providerHealth.responseTime * 9) + responseTime) / 10; // Rolling average
    if (!success) {
      providerHealth.errorRate = Math.min(1, providerHealth.errorRate + 0.01);
    } else {
      providerHealth.errorRate = Math.max(0, providerHealth.errorRate - 0.005);
      providerHealth.lastSuccessfulCall = new Date();
    }

    // Update rate limit tracking
    if (rateLimitRemaining !== undefined) {
      providerHealth.rateLimitRemaining = rateLimitRemaining;
    }

    // Track costs
    if (cost) {
      const today = new Date().toISOString().split('T')[0];
      let costData = this.costTracker.get(`${providerId}-${today}`);
      if (!costData) {
        costData = { calls: 0, cost: 0, timestamp: new Date() };
        this.costTracker.set(`${providerId}-${today}`, costData);
      }
      costData.calls += 1;
      costData.cost += cost;
      
      providerHealth.costMetrics.callsToday = costData.calls;
      providerHealth.costMetrics.estimatedDailyCost = costData.cost;
    }

    // Check for alerts
    await this.checkProviderAlerts(providerId, providerHealth);

    this.log('debug', `API usage tracked`, {
      providerId,
      endpoint,
      responseTime,
      success,
      cost
    });
  }

  // Private helper methods

  private initializeDataProviders(): void {
    const providers = [
      { id: 'mysportsfeeds', name: 'MySportsFeeds' },
      { id: 'api-sports', name: 'API-Sports' },
      { id: 'weather-api', name: 'OpenWeatherMap' },
      { id: 'nflfastr', name: 'nflfastR' }
    ];

    for (const provider of providers) {
      this.dataProviders.set(provider.id, this.initializeProviderHealth(provider.id, provider.name));
    }
  }

  private initializeProviderHealth(providerId: string, name?: string): DataProviderHealth {
    return {
      providerId,
      name: name || providerId,
      status: 'healthy',
      responseTime: 0,
      errorRate: 0,
      rateLimitRemaining: 1000,
      rateLimitResetTime: new Date(Date.now() + 3600000), // 1 hour from now
      lastSuccessfulCall: new Date(),
      dataFreshness: 0,
      costMetrics: {
        callsToday: 0,
        estimatedDailyCost: 0,
        monthlyBudgetUsed: 0
      },
      slaMetrics: {
        uptimeToday: 1.0,
        uptimeWeek: 1.0,
        uptimeMonth: 1.0,
        averageResponseTime: 0
      }
    };
  }

  private async checkDataFreshness(): Promise<any> {
    const now = Date.now();
    const freshness = { ...this.sportsDataMetrics.dataFreshness };
    
    // Check each data type's freshness (implementation would check actual timestamps)
    freshness.playerStats = Math.floor(Math.random() * 20); // Mock implementation
    freshness.injuryReports = Math.floor(Math.random() * 10);
    freshness.gameSchedules = Math.floor(Math.random() * 60);
    freshness.weatherData = Math.floor(Math.random() * 30);
    freshness.odds = Math.floor(Math.random() * 5);
    
    return freshness;
  }

  private async validateDataQuality(): Promise<any> {
    // Mock implementation - would perform actual data quality checks
    return {
      completeness: 0.98,
      accuracy: 0.96,
      consistency: 0.99,
      validity: 0.97
    };
  }

  private async checkApiHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};
    
    for (const [providerId, providerHealth] of this.dataProviders.entries()) {
      health[providerId] = {
        status: providerHealth.status,
        responseTime: providerHealth.responseTime,
        errorRate: providerHealth.errorRate,
        uptime: providerHealth.slaMetrics.uptimeToday
      };
    }
    
    return health;
  }

  private async checkPredictionAccuracy(): Promise<Record<string, number>> {
    const accuracy: Record<string, number> = {};
    
    for (const [modelId, metrics] of this.predictionMetrics.entries()) {
      accuracy[modelId] = metrics.accuracy.overall;
    }
    
    return accuracy;
  }

  private async checkCostMetrics(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    let totalCostToday = 0;
    let totalCallsToday = 0;
    
    for (const [key, costData] of this.costTracker.entries()) {
      if (key.includes(today)) {
        totalCostToday += costData.cost;
        totalCallsToday += costData.calls;
      }
    }
    
    return {
      dailyCost: totalCostToday,
      dailyCalls: totalCallsToday,
      monthlyBudgetUsed: (totalCostToday * 30) / 150, // Rough estimate
      projectedMonthlyCost: totalCostToday * 30
    };
  }

  private async generateQualityAlerts(results: any): Promise<SportsAlert[]> {
    const alerts: SportsAlert[] = [];
    
    // Check data freshness alerts
    if (results.dataFreshness.injuryReports > 10) {
      alerts.push(this.createDataFreshnessAlert('injuryReports', results.dataFreshness.injuryReports));
    }
    
    // Check data quality alerts  
    if (results.dataQuality.completeness < 0.95) {
      alerts.push(this.createDataQualityAlert('completeness', results.dataQuality.completeness));
    }
    
    return alerts;
  }

  private createDataFreshnessAlert(dataType: string, minutes: number): SportsAlert {
    return {
      id: `freshness-${dataType}-${Date.now()}`,
      level: minutes > 30 ? 'critical' : 'warning',
      message: `${dataType} data is ${minutes} minutes stale`,
      timestamp: new Date(),
      resolved: false,
      alertType: 'data_quality_degraded',
      data: { dataType, staleness: minutes },
      impactAssessment: {
        severity: minutes > 30 ? 'high' : 'medium',
        affectedUsers: Math.floor(minutes * 10),
        affectedPredictions: Math.floor(minutes * 5),
        estimatedRevenue: minutes * 0.5,
        timeToResolution: 15
      },
      recommendedActions: [
        `Check ${dataType} data pipeline`,
        'Verify API provider status',
        'Trigger manual data refresh if needed'
      ],
      escalationRules: {
        autoEscalate: minutes > 60,
        escalationDelay: 30,
        escalateTo: ['data-team', 'ops-team']
      }
    };
  }

  private createDataQualityAlert(qualityType: string, score: number): SportsAlert {
    return {
      id: `quality-${qualityType}-${Date.now()}`,
      level: score < 0.9 ? 'critical' : 'warning',
      message: `Data ${qualityType} below threshold: ${(score * 100).toFixed(1)}%`,
      timestamp: new Date(),
      resolved: false,
      alertType: 'data_quality_degraded',
      data: { qualityType, score },
      impactAssessment: {
        severity: score < 0.9 ? 'high' : 'medium',
        affectedUsers: Math.floor((1 - score) * 1000),
        affectedPredictions: Math.floor((1 - score) * 500),
        estimatedRevenue: (1 - score) * 100,
        timeToResolution: 30
      },
      recommendedActions: [
        `Investigate ${qualityType} issues`,
        'Run data validation diagnostics',
        'Consider switching to backup data source'
      ],
      escalationRules: {
        autoEscalate: score < 0.85,
        escalationDelay: 15,
        escalateTo: ['data-team']
      }
    };
  }

  private calculateOverallDataHealth(results: any): 'normal' | 'warning' | 'critical' {
    const issues = [];
    
    // Check critical thresholds
    if (results.dataFreshness.injuryReports > 15) issues.push('critical');
    if (results.dataQuality.completeness < 0.9) issues.push('critical');
    if (results.dataQuality.accuracy < 0.95) issues.push('critical');
    
    // Check warning thresholds
    if (results.dataFreshness.playerStats > 30) issues.push('warning');
    if (results.dataQuality.completeness < 0.95) issues.push('warning');
    
    if (issues.includes('critical')) return 'critical';
    if (issues.includes('warning')) return 'warning';
    return 'normal';
  }

  private updateSportsMetrics(results: any): void {
    this.sportsDataMetrics.dataFreshness = results.dataFreshness;
    this.sportsDataMetrics.dataQuality = results.dataQuality;
    
    // Record metrics for historical tracking
    this.recordMetric('data_freshness_overall', 
      Object.values(results.dataFreshness).reduce((a: any, b: any) => a + b, 0) / Object.keys(results.dataFreshness).length,
      new Date()
    );
  }

  private convertToStandardMetrics(results: any): Record<string, number> {
    return {
      'data_completeness': results.dataQuality.completeness,
      'data_accuracy': results.dataQuality.accuracy,
      'avg_response_time': Object.values(results.apiHealth).reduce((sum: any, provider: any) => sum + provider.responseTime, 0) / Object.keys(results.apiHealth).length,
      'prediction_accuracy': Object.values(results.predictionAccuracy).reduce((sum: any, acc: any) => sum + acc, 0) / Object.keys(results.predictionAccuracy).length
    };
  }

  private async runSportsHealthChecks(): Promise<HealthCheck[]> {
    const healthChecks: HealthCheck[] = [];
    
    // Check each data provider
    for (const [providerId, providerHealth] of this.dataProviders.entries()) {
      healthChecks.push({
        target: providerId,
        status: providerHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        responseTime: providerHealth.responseTime,
        timestamp: new Date(),
        details: {
          errorRate: providerHealth.errorRate,
          rateLimitRemaining: providerHealth.rateLimitRemaining
        }
      });
    }
    
    return healthChecks;
  }

  private generateOptimizationRecommendations(results: any): string[] {
    const recommendations: string[] = [];
    
    if (results.costMetrics.projectedMonthlyCost > 150) {
      recommendations.push('Consider optimizing API call patterns to reduce costs');
    }
    
    if (results.dataFreshness.playerStats > 15) {
      recommendations.push('Increase player stats refresh frequency during active hours');
    }
    
    if (Object.values(results.predictionAccuracy).some((acc: any) => acc < 0.65)) {
      recommendations.push('Review and retrain underperforming prediction models');
    }
    
    return recommendations;
  }

  private async assessInjuryImpact(playerId: string, newStatus: string): Promise<any> {
    // Mock impact assessment - would be more sophisticated in production
    const severityMap = { 'out': 'critical', 'doubtful': 'high', 'questionable': 'medium', 'healthy': 'low' };
    
    return {
      severity: severityMap[newStatus as keyof typeof severityMap] || 'low',
      affectedUsers: newStatus === 'out' ? 500 : 100,
      affectedPredictions: newStatus === 'out' ? 50 : 10,
      estimatedRevenue: newStatus === 'out' ? 25 : 5,
      timeToResolution: 5,
      confidence: 0.9
    };
  }

  private getInjurySeverityLevel(previousStatus: string, newStatus: string): 'info' | 'warning' | 'error' | 'critical' {
    if (newStatus === 'out') return 'critical';
    if (newStatus === 'doubtful' || (previousStatus === 'healthy' && newStatus === 'questionable')) return 'error';
    if (newStatus === 'questionable') return 'warning';
    return 'info';
  }

  private getInjuryRecommendedActions(playerId: string, newStatus: string): string[] {
    const actions = [
      `Update ${playerId} injury status in all systems`,
      'Recalculate affected player projections',
      'Notify content team for injury report updates'
    ];
    
    if (newStatus === 'out') {
      actions.push('Remove from all recommended lineups');
      actions.push('Increase projections for backup players');
    }
    
    return actions;
  }

  private async sendImmediateAlert(alert: SportsAlert): Promise<void> {
    this.log('info', `Sending immediate alert: ${alert.message}`, {
      alertId: alert.id,
      severity: alert.impactAssessment.severity
    });
    
    // Would integrate with notification systems (Slack, email, PagerDuty, etc.)
    this.emit('immediate_alert', alert);
  }

  private async createPredictionAccuracyAlert(modelId: string, accuracy: number, alertType: string): Promise<void> {
    const alert: SportsAlert = {
      id: `prediction-accuracy-${modelId}-${Date.now()}`,
      level: accuracy < 0.5 ? 'critical' : 'warning',
      message: `Model ${modelId} accuracy dropped to ${(accuracy * 100).toFixed(1)}%`,
      timestamp: new Date(),
      resolved: false,
      alertType: alertType as any,
      data: { modelId, accuracy },
      impactAssessment: {
        severity: accuracy < 0.5 ? 'critical' : 'medium',
        affectedUsers: Math.floor((0.7 - accuracy) * 1000),
        affectedPredictions: Math.floor((0.7 - accuracy) * 200),
        estimatedRevenue: (0.7 - accuracy) * 50,
        timeToResolution: 60
      },
      recommendedActions: [
        `Review ${modelId} training data`,
        'Check for feature drift or data quality issues',
        'Consider model retraining or rollback'
      ],
      escalationRules: {
        autoEscalate: accuracy < 0.5,
        escalationDelay: 30,
        escalateTo: ['ml-team', 'ops-team']
      }
    };
    
    this.addAlert(alert);
  }

  private async checkProviderAlerts(providerId: string, health: DataProviderHealth): Promise<void> {
    // Response time alert
    if (health.responseTime > 5000) {
      await this.createProviderAlert(providerId, 'high_response_time', health.responseTime);
    }
    
    // Error rate alert
    if (health.errorRate > 0.1) {
      await this.createProviderAlert(providerId, 'high_error_rate', health.errorRate);
    }
    
    // Rate limit alert
    if (health.rateLimitRemaining < 100) {
      await this.createProviderAlert(providerId, 'rate_limit_warning', health.rateLimitRemaining);
    }
  }

  private async createProviderAlert(providerId: string, alertType: string, value: number): Promise<void> {
    // Implementation would create provider-specific alerts
    this.log('warning', `Provider alert: ${alertType}`, { providerId, value });
  }

  private isValidDateTime(dateTime: any): boolean {
    return !isNaN(Date.parse(dateTime));
  }

  private startDataFreshnessMonitoring(): void {
    setInterval(async () => {
      try {
        const freshness = await this.checkDataFreshness();
        this.updateSportsMetrics({ dataFreshness: freshness, dataQuality: this.sportsDataMetrics.dataQuality });
      } catch (error) {
        this.log('error', 'Data freshness monitoring error', { error: (error as Error).message });
      }
    }, 300000); // Every 5 minutes
  }

  private startPredictionAccuracyMonitoring(): void {
    setInterval(async () => {
      try {
        await this.checkPredictionAccuracy();
      } catch (error) {
        this.log('error', 'Prediction accuracy monitoring error', { error: (error as Error).message });
      }
    }, 3600000); // Every hour
  }

  private startApiHealthMonitoring(): void {
    setInterval(async () => {
      try {
        await this.checkApiHealth();
      } catch (error) {
        this.log('error', 'API health monitoring error', { error: (error as Error).message });
      }
    }, 60000); // Every minute
  }

  private startCostTracking(): void {
    // Daily cost reset and monthly budget tracking
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        // Reset daily counters (keep for historical tracking)
        this.log('info', 'Daily cost tracking reset');
      }
    }, 60000); // Check every minute for midnight
  }
}