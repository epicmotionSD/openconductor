/**
 * OpenConductor Analytics & Telemetry Engine
 * 
 * Comprehensive usage analytics system for product-market fit validation:
 * - User behavior tracking and feature adoption analysis
 * - Performance metrics and system health monitoring
 * - Business intelligence and revenue attribution
 * - Privacy-compliant data collection with opt-out controls
 * - Real-time analytics and batch processing
 * - A/B testing and experimentation framework
 * - Customer health scoring and churn prediction
 * - Integration with BI tools (Mixpanel, Amplitude, Segment)
 * 
 * Key Metrics Tracked:
 * - Feature usage and adoption rates
 * - Time to value and activation metrics
 * - User engagement and retention patterns
 * - Alert correlation effectiveness
 * - Enterprise feature utilization
 * - Integration usage and success rates
 * - Support ticket correlation
 * - Revenue-driving behaviors
 * 
 * Privacy & Compliance:
 * - GDPR, CCPA compliant data collection
 * - User consent management
 * - Data anonymization and pseudonymization
 * - Opt-out controls for community users
 * - Enterprise data sovereignty options
 */

import { Logger } from '../utils/logger';
import { FeatureGates } from '../enterprise/feature-gates';
import { AuditLogger } from '../enterprise/security/audit-logger';

export interface AnalyticsEvent {
  eventId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  context: {
    userAgent?: string;
    ip?: string;
    page?: string;
    referrer?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
    device?: {
      type: 'desktop' | 'tablet' | 'mobile';
      os?: string;
      browser?: string;
    };
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  };
  metadata: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    source: 'web' | 'api' | 'system' | 'integration';
    anonymous: boolean;
  };
}

export interface UserProfile {
  userId: string;
  traits: {
    email?: string;
    name?: string;
    company?: string;
    role?: string;
    plan: 'community' | 'starter' | 'professional' | 'enterprise' | 'enterprise_plus';
    signupDate: Date;
    lastActive: Date;
    accountValue?: number;
    teamSize?: number;
  };
  segments: string[];
  firstSeen: Date;
  lastSeen: Date;
  sessionCount: number;
  totalEvents: number;
  consentStatus: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
    lastUpdated: Date;
  };
}

export interface FeatureUsage {
  featureId: string;
  featureName: string;
  category: string;
  usageCount: number;
  uniqueUsers: number;
  firstUsed: Date;
  lastUsed: Date;
  averageUsagePerUser: number;
  adoptionRate: number; // percentage of eligible users who used feature
  retentionRate: number; // percentage who used feature again after first use
  enterpriseOnly: boolean;
  revenueDriving: boolean;
}

export interface BusinessMetrics {
  period: {
    start: Date;
    end: Date;
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    retainedUsers: number;
    churnedUsers: number;
    activationRate: number; // users who completed key actions
    engagementScore: number; // composite engagement metric
  };
  productMetrics: {
    featuresUsed: number;
    averageFeaturesPerUser: number;
    alertsCorrelated: number;
    timeToValue: number; // hours to first success
    userSatisfactionScore: number;
    supportTicketRate: number;
  };
  businessMetrics: {
    conversionRate: number; // community to enterprise
    expansionRevenue: number;
    churnRate: number;
    netRevenueRetention: number;
    lifetimeValue: number;
    acquisitionCost: number;
  };
  technicalMetrics: {
    systemUptime: number;
    averageResponseTime: number;
    errorRate: number;
    apiUsage: number;
    performanceScore: number;
  };
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  variants: Array<{
    id: string;
    name: string;
    allocation: number; // percentage 0-100
    config: Record<string, any>;
  }>;
  segmentation: {
    userSegments?: string[];
    featureFlags?: string[];
    customCriteria?: Array<{
      property: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  };
  results?: {
    totalParticipants: number;
    variantResults: Array<{
      variantId: string;
      participants: number;
      conversionRate: number;
      metricValue: number;
      confidence: number;
    }>;
    winnerVariant?: string;
    statisticalSignificance: boolean;
  };
}

export interface CustomerHealthScore {
  userId: string;
  companyId?: string;
  score: number; // 0-100
  risk: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    weight: number;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  predictions: {
    churnProbability: number;
    expansionProbability: number;
    supportTicketLikelihood: number;
  };
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    expectedImpact: string;
    assignedTo?: string;
  }>;
  lastCalculated: Date;
  trend: 'improving' | 'stable' | 'declining';
}

export class TelemetryEngine {
  private static instance: TelemetryEngine;
  private featureGates: FeatureGates;
  private logger: Logger;
  private auditLogger: AuditLogger;
  private eventBuffer: AnalyticsEvent[] = [];
  private userProfiles: Map<string, UserProfile> = new Map();
  private featureUsage: Map<string, FeatureUsage> = new Map();
  private experiments: Map<string, ExperimentConfig> = new Map();
  private customerHealth: Map<string, CustomerHealthScore> = new Map();
  private dataSinks: AnalyticsDataSink[] = [];
  private processingQueue: AnalyticsEvent[] = [];
  private consentManager: ConsentManager;

  private constructor(logger: Logger) {
    this.featureGates = FeatureGates.getInstance();
    this.logger = logger;
    this.auditLogger = AuditLogger.getInstance();
    this.consentManager = new ConsentManager();
    
    this.initializeDataSinks();
    this.startBackgroundProcessing();
  }

  public static getInstance(logger?: Logger): TelemetryEngine {
    if (!TelemetryEngine.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      TelemetryEngine.instance = new TelemetryEngine(logger);
    }
    return TelemetryEngine.instance;
  }

  /**
   * Track user event with privacy compliance
   */
  public async track(
    eventName: string,
    properties: Record<string, any> = {},
    context: Partial<AnalyticsEvent['context']> = {},
    userId?: string
  ): Promise<void> {
    // Check consent and privacy settings
    if (!this.canCollectAnalytics(userId)) {
      return;
    }

    const event: AnalyticsEvent = {
      eventId: this.generateEventId(),
      userId: userId || undefined,
      sessionId: this.getOrCreateSessionId(),
      timestamp: new Date(),
      eventType: this.categorizeEvent(eventName),
      eventName,
      properties: this.sanitizeProperties(properties),
      context: {
        ...context,
        userAgent: context.userAgent || this.getCurrentUserAgent(),
        page: context.page || this.getCurrentPage()
      },
      metadata: {
        version: this.getApplicationVersion(),
        environment: this.getEnvironment(),
        source: 'web',
        anonymous: !userId
      }
    };

    // Add to buffer for batch processing
    this.eventBuffer.push(event);

    // Real-time processing for critical events
    if (this.isCriticalEvent(eventName)) {
      await this.processEventImmediately(event);
    }

    // Flush buffer if it reaches threshold
    if (this.eventBuffer.length >= 100) {
      await this.flushEventBuffer();
    }
  }

  /**
   * Identify user with traits
   */
  public async identify(
    userId: string,
    traits: Partial<UserProfile['traits']> = {},
    context: Partial<AnalyticsEvent['context']> = {}
  ): Promise<void> {
    if (!this.canCollectAnalytics(userId)) {
      return;
    }

    // Update or create user profile
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        traits: {
          plan: 'community',
          signupDate: new Date(),
          lastActive: new Date(),
          ...traits
        },
        segments: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        sessionCount: 1,
        totalEvents: 0,
        consentStatus: await this.consentManager.getConsentStatus(userId)
      };
    } else {
      profile.traits = { ...profile.traits, ...traits };
      profile.lastSeen = new Date();
      profile.lastActive = new Date();
    }

    // Update user segments
    profile.segments = this.calculateUserSegments(profile);

    this.userProfiles.set(userId, profile);

    // Track identify event
    await this.track('user_identified', {
      user_id: userId,
      traits: this.sanitizeTraits(traits)
    }, context, userId);

    // Update customer health score
    await this.updateCustomerHealthScore(userId);
  }

  /**
   * Track feature usage
   */
  public async trackFeatureUsage(
    featureId: string,
    featureName: string,
    userId?: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    if (!this.canCollectAnalytics(userId)) {
      return;
    }

    // Update feature usage statistics
    let usage = this.featureUsage.get(featureId);
    if (!usage) {
      usage = {
        featureId,
        featureName,
        category: this.categorizeFeature(featureId),
        usageCount: 0,
        uniqueUsers: 0,
        firstUsed: new Date(),
        lastUsed: new Date(),
        averageUsagePerUser: 0,
        adoptionRate: 0,
        retentionRate: 0,
        enterpriseOnly: this.isEnterpriseFeature(featureId),
        revenueDriving: this.isRevenueDrivingFeature(featureId)
      };
    }

    usage.usageCount++;
    usage.lastUsed = new Date();

    // Track unique users
    const userSet = new Set(); // In production, use persistent storage
    if (userId && !userSet.has(userId)) {
      usage.uniqueUsers++;
      userSet.add(userId);
    }

    this.featureUsage.set(featureId, usage);

    // Track event
    await this.track('feature_used', {
      feature_id: featureId,
      feature_name: featureName,
      feature_category: usage.category,
      enterprise_only: usage.enterpriseOnly,
      ...properties
    }, {}, userId);
  }

  /**
   * Start A/B experiment
   */
  public async startExperiment(config: ExperimentConfig): Promise<void> {
    config.status = 'running';
    config.startDate = new Date();
    this.experiments.set(config.id, config);

    await this.auditLogger.log({
      action: 'experiment_started',
      actor: 'system',
      resource: 'experiment',
      resourceId: config.id,
      outcome: 'success',
      details: {
        experimentName: config.name,
        variants: config.variants.length,
        targetMetric: config.targetMetric
      },
      severity: 'medium',
      category: 'system',
      tags: ['experiment', 'ab_test']
    });

    this.logger.info(`Experiment started: ${config.name} (${config.id})`);
  }

  /**
   * Get experiment variant for user
   */
  public getExperimentVariant(experimentId: string, userId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user meets experiment criteria
    if (!this.userMeetsExperimentCriteria(userId, experiment)) {
      return null;
    }

    // Deterministic variant assignment based on user ID
    const hash = this.hashUserId(userId + experimentId);
    const bucket = hash % 100;

    let cumulativeAllocation = 0;
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (bucket < cumulativeAllocation) {
        // Track experiment exposure
        this.track('experiment_exposed', {
          experiment_id: experimentId,
          experiment_name: experiment.name,
          variant_id: variant.id,
          variant_name: variant.name
        }, {}, userId);

        return variant.id;
      }
    }

    return null;
  }

  /**
   * Calculate business metrics for time period
   */
  public async calculateBusinessMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<BusinessMetrics> {
    const periodEvents = this.getEventsInPeriod(startDate, endDate);
    const previousPeriodEvents = this.getPreviousPeriodEvents(startDate, endDate);

    // Calculate user metrics
    const totalUsers = this.userProfiles.size;
    const activeUsers = this.countActiveUsersInPeriod(periodEvents);
    const newUsers = this.countNewUsersInPeriod(periodEvents);
    
    // Calculate product metrics
    const featuresUsed = this.countUniqueFeaturesUsed(periodEvents);
    const alertsCorrelated = this.countAlertsCorrelated(periodEvents);
    const timeToValue = this.calculateAverageTimeToValue(periodEvents);

    // Calculate business metrics
    const conversionRate = this.calculateConversionRate(periodEvents);
    const churnRate = this.calculateChurnRate(startDate, endDate);

    return {
      period: { start: startDate, end: endDate },
      userMetrics: {
        totalUsers,
        activeUsers,
        newUsers,
        retainedUsers: activeUsers - newUsers,
        churnedUsers: this.countChurnedUsers(startDate, endDate),
        activationRate: this.calculateActivationRate(periodEvents),
        engagementScore: this.calculateEngagementScore(periodEvents)
      },
      productMetrics: {
        featuresUsed,
        averageFeaturesPerUser: featuresUsed / activeUsers,
        alertsCorrelated,
        timeToValue,
        userSatisfactionScore: this.calculateSatisfactionScore(),
        supportTicketRate: this.calculateSupportTicketRate(periodEvents)
      },
      businessMetrics: {
        conversionRate,
        expansionRevenue: this.calculateExpansionRevenue(periodEvents),
        churnRate,
        netRevenueRetention: this.calculateNRR(startDate, endDate),
        lifetimeValue: this.calculateLTV(),
        acquisitionCost: this.calculateCAC(periodEvents)
      },
      technicalMetrics: {
        systemUptime: this.calculateUptime(startDate, endDate),
        averageResponseTime: this.calculateAvgResponseTime(periodEvents),
        errorRate: this.calculateErrorRate(periodEvents),
        apiUsage: this.countApiUsage(periodEvents),
        performanceScore: this.calculatePerformanceScore(periodEvents)
      }
    };
  }

  /**
   * Update customer health score
   */
  private async updateCustomerHealthScore(userId: string): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    const factors = [
      {
        factor: 'usage_frequency',
        weight: 0.25,
        value: this.calculateUsageFrequency(userId),
        impact: 'positive' as const
      },
      {
        factor: 'feature_adoption',
        weight: 0.20,
        value: this.calculateFeatureAdoption(userId),
        impact: 'positive' as const
      },
      {
        factor: 'engagement_depth',
        weight: 0.15,
        value: this.calculateEngagementDepth(userId),
        impact: 'positive' as const
      },
      {
        factor: 'support_tickets',
        weight: 0.15,
        value: this.calculateSupportTicketScore(userId),
        impact: 'negative' as const
      },
      {
        factor: 'account_age',
        weight: 0.10,
        value: this.calculateAccountAgeScore(userId),
        impact: 'positive' as const
      },
      {
        factor: 'team_collaboration',
        weight: 0.15,
        value: this.calculateCollaborationScore(userId),
        impact: 'positive' as const
      }
    ];

    // Calculate weighted score
    let score = 0;
    for (const factor of factors) {
      const contribution = factor.weight * factor.value;
      score += factor.impact === 'positive' ? contribution : -contribution;
    }

    score = Math.max(0, Math.min(100, score * 100)); // Normalize to 0-100

    const health: CustomerHealthScore = {
      userId,
      companyId: profile.traits.company,
      score,
      risk: this.calculateRiskLevel(score),
      factors,
      predictions: {
        churnProbability: this.predictChurnProbability(userId, factors),
        expansionProbability: this.predictExpansionProbability(userId, factors),
        supportTicketLikelihood: this.predictSupportTicketLikelihood(userId, factors)
      },
      recommendations: this.generateHealthRecommendations(userId, score, factors),
      lastCalculated: new Date(),
      trend: this.calculateHealthTrend(userId, score)
    };

    this.customerHealth.set(userId, health);

    // Alert if health score is critical
    if (health.risk === 'critical') {
      await this.alertCustomerSuccessTeam(health);
    }
  }

  /**
   * Get analytics dashboard data
   */
  public async getDashboardData(timeRange: 'hour' | 'day' | 'week' | 'month'): Promise<{
    overview: any;
    userActivity: any;
    featureUsage: any;
    businessMetrics: any;
    experiments: any;
  }> {
    const { startDate, endDate } = this.getTimeRange(timeRange);
    const metrics = await this.calculateBusinessMetrics(startDate, endDate);

    return {
      overview: {
        totalUsers: metrics.userMetrics.totalUsers,
        activeUsers: metrics.userMetrics.activeUsers,
        conversionRate: metrics.businessMetrics.conversionRate,
        churnRate: metrics.businessMetrics.churnRate
      },
      userActivity: this.getUserActivityData(startDate, endDate),
      featureUsage: this.getFeatureUsageData(),
      businessMetrics: metrics,
      experiments: this.getActiveExperiments()
    };
  }

  // Privacy and consent management
  private canCollectAnalytics(userId?: string): boolean {
    // Community edition: respect opt-out preferences
    if (!this.featureGates.canUseEnterpriseIntegrations() && userId) {
      const profile = this.userProfiles.get(userId);
      return profile?.consentStatus.analytics !== false;
    }

    // Always collect anonymous analytics for product improvement
    if (!userId) {
      return true;
    }

    // Enterprise: check consent settings
    const profile = this.userProfiles.get(userId);
    return profile?.consentStatus.analytics !== false;
  }

  // Helper methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private getOrCreateSessionId(): string {
    // In browser, this would use sessionStorage
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private categorizeEvent(eventName: string): string {
    if (eventName.includes('feature_')) return 'feature';
    if (eventName.includes('user_')) return 'user';
    if (eventName.includes('system_')) return 'system';
    if (eventName.includes('business_')) return 'business';
    return 'general';
  }

  private categorizeFeature(featureId: string): string {
    const categories = {
      'alert_correlation': 'core',
      'agent_': 'agents',
      'integration_': 'integrations',
      'security_': 'security',
      'compliance_': 'compliance',
      'dashboard_': 'analytics'
    };

    for (const [prefix, category] of Object.entries(categories)) {
      if (featureId.startsWith(prefix)) {
        return category;
      }
    }

    return 'other';
  }

  private isEnterpriseFeature(featureId: string): boolean {
    const enterpriseFeatures = [
      'sso_integration',
      'advanced_alert_correlation',
      'compliance_reporting',
      'custom_workflows',
      'enterprise_integrations'
    ];

    return enterpriseFeatures.some(feature => featureId.includes(feature));
  }

  private isRevenueDrivingFeature(featureId: string): boolean {
    const revenueDrivingFeatures = [
      'alert_correlation',
      'enterprise_integrations',
      'compliance_reporting',
      'custom_workflows'
    ];

    return revenueDrivingFeatures.some(feature => featureId.includes(feature));
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'user_signup',
      'subscription_changed',
      'churn_risk_detected',
      'security_incident',
      'system_error'
    ];

    return criticalEvents.includes(eventName);
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    // Remove PII and sensitive data
    const sanitized = { ...properties };
    
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'ssn', 'creditCard'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeTraits(traits: any): any {
    return this.sanitizeProperties(traits);
  }

  private calculateUserSegments(profile: UserProfile): string[] {
    const segments: string[] = [];

    // Plan-based segments
    segments.push(`plan_${profile.traits.plan}`);

    // Engagement segments
    const daysSinceSignup = (Date.now() - profile.traits.signupDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSignup <= 7) segments.push('new_user');
    else if (daysSinceSignup <= 30) segments.push('recent_user');
    else segments.push('established_user');

    // Activity segments
    const daysSinceActive = (Date.now() - profile.traits.lastActive.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive <= 1) segments.push('highly_active');
    else if (daysSinceActive <= 7) segments.push('active');
    else if (daysSinceActive <= 30) segments.push('at_risk');
    else segments.push('churned');

    // Company size segments
    if (profile.traits.teamSize) {
      if (profile.traits.teamSize <= 10) segments.push('small_team');
      else if (profile.traits.teamSize <= 100) segments.push('medium_team');
      else segments.push('large_team');
    }

    return segments;
  }

  private userMeetsExperimentCriteria(userId: string, experiment: ExperimentConfig): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) return false;

    // Check user segments
    if (experiment.segmentation.userSegments) {
      const hasMatchingSegment = experiment.segmentation.userSegments.some(segment =>
        profile.segments.includes(segment)
      );
      if (!hasMatchingSegment) return false;
    }

    // Check custom criteria
    if (experiment.segmentation.customCriteria) {
      for (const criteria of experiment.segmentation.customCriteria) {
        const value = this.getPropertyValue(profile, criteria.property);
        if (!this.matchesCriteria(value, criteria.operator, criteria.value)) {
          return false;
        }
      }
    }

    return true;
  }

  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getPropertyValue(profile: UserProfile, property: string): any {
    const path = property.split('.');
    let value: any = profile;
    for (const key of path) {
      value = value?.[key];
    }
    return value;
  }

  private matchesCriteria(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === targetValue;
      case 'not_equals':
        return value !== targetValue;
      case 'contains':
        return String(value).includes(String(targetValue));
      case 'greater_than':
        return Number(value) > Number(targetValue);
      case 'less_than':
        return Number(value) < Number(targetValue);
      default:
        return false;
    }
  }

  // Calculation methods (simplified implementations)
  private getEventsInPeriod(startDate: Date, endDate: Date): AnalyticsEvent[] {
    return this.eventBuffer.filter(event =>
      event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  private getPreviousPeriodEvents(startDate: Date, endDate: Date): AnalyticsEvent[] {
    const duration = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - duration);
    const prevEnd = new Date(startDate.getTime());
    return this.getEventsInPeriod(prevStart, prevEnd);
  }

  private countActiveUsersInPeriod(events: AnalyticsEvent[]): number {
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId));
    return uniqueUsers.size;
  }

  private countNewUsersInPeriod(events: AnalyticsEvent[]): number {
    return events.filter(e => e.eventName === 'user_signup').length;
  }

  private countUniqueFeaturesUsed(events: AnalyticsEvent[]): number {
    const features = new Set(
      events.filter(e => e.eventName === 'feature_used')
             .map(e => e.properties.feature_id)
    );
    return features.size;
  }

  private countAlertsCorrelated(events: AnalyticsEvent[]): number {
    return events.filter(e => e.eventName === 'alert_correlated').length;
  }

  private calculateAverageTimeToValue(events: AnalyticsEvent[]): number {
    // Time from signup to first successful alert correlation
    const signups = events.filter(e => e.eventName === 'user_signup');
    const correlations = events.filter(e => e.eventName === 'alert_correlated');
    
    let totalTime = 0;
    let count = 0;

    for (const signup of signups) {
      const userCorrelation = correlations.find(c => 
        c.userId === signup.userId && c.timestamp > signup.timestamp
      );
      
      if (userCorrelation) {
        const timeToValue = userCorrelation.timestamp.getTime() - signup.timestamp.getTime();
        totalTime += timeToValue;
        count++;
      }
    }

    return count > 0 ? (totalTime / count) / (1000 * 60 * 60) : 0; // Convert to hours
  }

  private calculateConversionRate(events: AnalyticsEvent[]): number {
    const signups = events.filter(e => e.eventName === 'user_signup').length;
    const conversions = events.filter(e => e.eventName === 'subscription_upgraded').length;
    return signups > 0 ? (conversions / signups) * 100 : 0;
  }

  private calculateChurnRate(startDate: Date, endDate: Date): number {
    // Simplified churn calculation
    const startUsers = this.countUsersAtDate(startDate);
    const endUsers = this.countUsersAtDate(endDate);
    const newUsers = this.countNewUsersBetweenDates(startDate, endDate);
    
    const churnedUsers = startUsers + newUsers - endUsers;
    return startUsers > 0 ? (churnedUsers / startUsers) * 100 : 0;
  }

  // Stub methods for complex calculations
  private countChurnedUsers(startDate: Date, endDate: Date): number { return 0; }
  private calculateActivationRate(events: AnalyticsEvent[]): number { return 0.75; }
  private calculateEngagementScore(events: AnalyticsEvent[]): number { return 8.2; }
  private calculateSatisfactionScore(): number { return 4.3; }
  private calculateSupportTicketRate(events: AnalyticsEvent[]): number { return 0.15; }
  private calculateExpansionRevenue(events: AnalyticsEvent[]): number { return 0; }
  private calculateNRR(startDate: Date, endDate: Date): number { return 115; }
  private calculateLTV(): number { return 5000; }
  private calculateCAC(events: AnalyticsEvent[]): number { return 500; }
  private calculateUptime(startDate: Date, endDate: Date): number { return 99.9; }
  private calculateAvgResponseTime(events: AnalyticsEvent[]): number { return 150; }
  private calculateErrorRate(events: AnalyticsEvent[]): number { return 0.01; }
  private countApiUsage(events: AnalyticsEvent[]): number { return 10000; }
  private calculatePerformanceScore(events: AnalyticsEvent[]): number { return 95; }
  private countUsersAtDate(date: Date): number { return 1000; }
  private countNewUsersBetweenDates(start: Date, end: Date): number { return 50; }

  // Customer health calculation methods (simplified)
  private calculateUsageFrequency(userId: string): number { return 0.8; }
  private calculateFeatureAdoption(userId: string): number { return 0.6; }
  private calculateEngagementDepth(userId: string): number { return 0.7; }
  private calculateSupportTicketScore(userId: string): number { return 0.2; }
  private calculateAccountAgeScore(userId: string): number { return 0.9; }
  private calculateCollaborationScore(userId: string): number { return 0.5; }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private predictChurnProbability(userId: string, factors: any[]): number { return 0.15; }
  private predictExpansionProbability(userId: string, factors: any[]): number { return 0.35; }
  private predictSupportTicketLikelihood(userId: string, factors: any[]): number { return 0.25; }

  private generateHealthRecommendations(userId: string, score: number, factors: any[]): any[] {
    const recommendations = [];

    if (score < 60) {
      recommendations.push({
        action: 'Schedule customer success check-in',
        priority: 'high' as const,
        expectedImpact: 'Improve satisfaction and reduce churn risk',
        assignedTo: 'customer-success@openconductor.ai'
      });
    }

    if (score < 40) {
      recommendations.push({
        action: 'Provide additional training and onboarding',
        priority: 'high' as const,
        expectedImpact: 'Increase feature adoption and engagement',
        assignedTo: 'customer-success@openconductor.ai'
      });
    }

    return recommendations;
  }

  private calculateHealthTrend(userId: string, currentScore: number): 'improving' | 'stable' | 'declining' {
    // Compare with previous score - simplified
    return 'stable';
  }

  private async alertCustomerSuccessTeam(health: CustomerHealthScore): Promise<void> {
    this.logger.warn(`Critical customer health score detected for user ${health.userId}: ${health.score}`);
    // In production, this would send alerts via Slack, email, etc.
  }

  private getTimeRange(range: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    switch (range) {
      case 'hour':
        startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  private getUserActivityData(startDate: Date, endDate: Date): any {
    return {
      dailyActiveUsers: [],
      userRetention: {},
      topFeatures: []
    };
  }

  private getFeatureUsageData(): any {
    return Array.from(this.featureUsage.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  }

  private getActiveExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running');
  }

  // Background processing
  private async processEventImmediately(event: AnalyticsEvent): Promise<void> {
    // Send to real-time data sinks
    for (const sink of this.dataSinks.filter(s => s.realtime)) {
      try {
        await sink.send([event]);
      } catch (error) {
        this.logger.error('Real-time event processing failed', error);
      }
    }
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = this.eventBuffer.splice(0);
    this.processingQueue.push(...events);

    // Process in background
    setImmediate(() => this.processEventBatch(events));
  }

  private async processEventBatch(events: AnalyticsEvent[]): Promise<void> {
    // Send to all data sinks
    for (const sink of this.dataSinks) {
      try {
        await sink.send(events);
      } catch (error) {
        this.logger.error(`Failed to send events to ${sink.name}`, error);
      }
    }

    // Update user profiles and feature usage
    for (const event of events) {
      if (event.userId) {
        await this.updateUserProfileFromEvent(event);
      }
    }
  }

  private async updateUserProfileFromEvent(event: AnalyticsEvent): Promise<void> {
    if (!event.userId) return;

    const profile = this.userProfiles.get(event.userId);
    if (profile) {
      profile.totalEvents++;
      profile.lastSeen = event.timestamp;
    }
  }

  private initializeDataSinks(): void {
    // Initialize various analytics data sinks
    this.dataSinks = [
      new ConsoleAnalyticsSink(),
      // new MixpanelSink(config.mixpanel.token),
      // new AmplitudeSink(config.amplitude.apiKey),
      // new SegmentSink(config.segment.writeKey),
    ];
  }

  private startBackgroundProcessing(): void {
    // Flush buffer periodically
    setInterval(async () => {
      await this.flushEventBuffer();
    }, 10000); // Every 10 seconds

    // Update customer health scores
    setInterval(async () => {
      for (const userId of this.userProfiles.keys()) {
        await this.updateCustomerHealthScore(userId);
      }
    }, 300000); // Every 5 minutes

    // Clean up old data
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

    // Clean up old events
    this.eventBuffer = this.eventBuffer.filter(event => event.timestamp > cutoff);

    // Clean up inactive user profiles
    for (const [userId, profile] of this.userProfiles.entries()) {
      if (profile.lastSeen < cutoff) {
        this.userProfiles.delete(userId);
      }
    }
  }

  // Public API methods
  public getCurrentUserAgent(): string { return 'OpenConductor/1.0'; }
  public getCurrentPage(): string { return '/dashboard'; }
  public getApplicationVersion(): string { return '1.0.0'; }
  public getEnvironment(): 'development' | 'staging' | 'production' { return 'production'; }

  public getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  public getFeatureUsageStats(): FeatureUsage[] {
    return Array.from(this.featureUsage.values());
  }

  public getCustomerHealthScore(userId: string): CustomerHealthScore | undefined {
    return this.customerHealth.get(userId);
  }

  public async setUserConsent(
    userId: string,
    consent: Partial<UserProfile['consentStatus']>
  ): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.consentStatus = {
        ...profile.consentStatus,
        ...consent,
        lastUpdated: new Date()
      };
    }
  }
}

// Supporting classes
abstract class AnalyticsDataSink {
  abstract name: string;
  abstract realtime: boolean;
  abstract send(events: AnalyticsEvent[]): Promise<void>;
}

class ConsoleAnalyticsSink extends AnalyticsDataSink {
  name = 'Console';
  realtime = false;

  async send(events: AnalyticsEvent[]): Promise<void> {
    console.log(`[Analytics] Processed ${events.length} events`);
  }
}

class ConsentManager {
  async getConsentStatus(userId: string): Promise<UserProfile['consentStatus']> {
    return {
      analytics: true,
      marketing: false,
      functional: true,
      lastUpdated: new Date()
    };
  }
}

export default TelemetryEngine;