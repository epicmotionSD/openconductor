/**
 * ROI Tracking Service
 * 
 * Handles real-time ROI calculations, trial management, and analytics
 * for Trinity Agent interactions based on x3o.ai proven system.
 */

import { prisma, trinityDb } from '../db/prisma';
import { checkAgentAccess, decrementTrialInteraction } from '../auth/nextauth-config';

export interface ROIMetrics {
  totalInteractions: number;
  successfulInteractions: number;
  totalRoiImpact: number;
  projectedMonthlySavings: number;
  timeReductionHours: number;
  efficiencyImprovementPercent: number;
  averageConfidence: number;
  successRate: number;
}

export interface TrialStatus {
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  remainingInteractions: {
    oracle: number;
    sentinel: number;
    sage: number;
  };
  totalUsed: {
    oracle: number;
    sentinel: number;
    sage: number;
  };
  conversionRecommendation?: string;
}

export interface AgentInteractionData {
  userId: string;
  organizationId: string;
  agentType: 'oracle' | 'sentinel' | 'sage';
  interactionType: string;
  inputData?: any;
  outputData?: any;
  confidenceScore?: number;
  processingTimeMs?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

export class ROITrackingService {
  /**
   * Record a Trinity Agent interaction with automatic ROI calculation
   */
  static async recordInteraction(data: AgentInteractionData): Promise<{
    success: boolean;
    interaction?: any;
    trialStatus?: TrialStatus;
    roiImpact?: number;
    error?: string;
  }> {
    try {
      // Check if user has access to this agent
      const access = await checkAgentAccess(data.userId, data.agentType);
      if (!access.hasAccess) {
        return {
          success: false,
          error: access.reason || 'Access denied',
        };
      }

      // Record the interaction
      const interaction = await trinityDb.recordInteraction(data);

      // Decrement trial interactions if in trial mode
      const user = await prisma.users.findUnique({
        where: { id: data.userId },
        include: { organization: true },
      });

      let trialStatus: TrialStatus | undefined;

      if (user?.organization?.plan_type === 'trial' && user.trial_token) {
        await decrementTrialInteraction(data.userId, data.agentType);
        trialStatus = await this.getTrialStatus(data.userId);
      }

      return {
        success: true,
        interaction,
        trialStatus,
        roiImpact: interaction.roi_impact,
      };
    } catch (error) {
      console.error('Failed to record interaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get comprehensive ROI metrics for an organization
   */
  static async getRoiMetrics(
    organizationId: string, 
    agentType?: 'oracle' | 'sentinel' | 'sage',
    timeRangeDays: number = 30
  ): Promise<ROIMetrics> {
    return await trinityDb.getRoiMetrics(organizationId, agentType, timeRangeDs);
  }

  /**
   * Get detailed trial status for a user
   */
  static async getTrialStatus(userId: string): Promise<TrialStatus> {
    const trialData = await trinityDb.getTrialStatus(userId);
    
    if (!trialData) {
      throw new Error('Trial data not found');
    }

    // Calculate total interactions used
    const defaultLimits = { oracle: 100, sentinel: 50, sage: 200 };
    const totalUsed = {
      oracle: defaultLimits.oracle - trialData.remainingInteractions.oracle,
      sentinel: defaultLimits.sentinel - trialData.remainingInteractions.sentinel,
      sage: defaultLimits.sage - trialData.remainingInteractions.sage,
    };

    // Generate conversion recommendation
    let conversionRecommendation: string | undefined;
    const totalUsagePercent = (
      (totalUsed.oracle / defaultLimits.oracle +
       totalUsed.sentinel / defaultLimits.sentinel +
       totalUsed.sage / defaultLimits.sage) / 3
    ) * 100;

    if (trialData.daysRemaining <= 3) {
      conversionRecommendation = 'Trial ending soon! Upgrade now to maintain access to your Trinity Agents.';
    } else if (totalUsagePercent > 80) {
      conversionRecommendation = 'You\'re getting great value! Consider upgrading for unlimited access.';
    } else if (totalUsagePercent > 50) {
      conversionRecommendation = 'High engagement detected. Professional plan recommended for continued growth.';
    }

    return {
      ...trialData,
      totalUsed,
      conversionRecommendation,
    };
  }

  /**
   * Calculate projected ROI based on current usage patterns
   */
  static async calculateProjectedROI(
    organizationId: string,
    planType: 'professional' | 'team' | 'enterprise'
  ): Promise<{
    monthlySubscriptionCost: number;
    projectedMonthlySavings: number;
    roiMultiplier: number;
    paybackPeriodDays: number;
    annualNetBenefit: number;
  }> {
    // Get current trial metrics
    const metrics = await this.getRoiMetrics(organizationId);

    // Plan pricing (from x3o.ai system)
    const planPricing = {
      professional: 299, // per month
      team: 899, // per month  
      enterprise: 2999, // per month
    };

    const monthlySubscriptionCost = planPricing[planType];
    const projectedMonthlySavings = metrics.projectedMonthlySavings;
    const roiMultiplier = projectedMonthlySavings / monthlySubscriptionCost;
    const paybackPeriodDays = Math.ceil((monthlySubscriptionCost / projectedMonthlySavings) * 30);
    const annualNetBenefit = (projectedMonthlySavings * 12) - (monthlySubscriptionCost * 12);

    return {
      monthlySubscriptionCost,
      projectedMonthlySavings,
      roiMultiplier,
      paybackPeriodDays,
      annualNetBenefit,
    };
  }

  /**
   * Get Trinity Agent analytics for dashboard
   */
  static async getAgentAnalytics(organizationId: string, days: number = 30) {
    const analytics = await trinityDb.getAgentAnalytics(organizationId);
    
    // Calculate additional insights
    const totalInteractions = analytics.reduce((sum, agent) => sum + agent.totalInteractions, 0);
    const averageConfidence = analytics.reduce((sum, agent, _, arr) => 
      sum + agent.averageConfidence / arr.length, 0
    );
    const totalRoiImpact = analytics.reduce((sum, agent) => sum + agent.totalRoiImpact, 0);

    return {
      agentBreakdown: analytics,
      summary: {
        totalInteractions,
        averageConfidence,
        totalRoiImpact,
        efficiencyGain: this.calculateEfficiencyGain(analytics),
        topPerformingAgent: analytics.reduce((top, current) => 
          current.averageConfidence > top.averageConfidence ? current : top
        ),
      },
    };
  }

  /**
   * Generate trial conversion insights
   */
  static async generateTrialConversionInsights(userId: string): Promise<{
    conversionScore: number; // 0-100
    keyDrivers: string[];
    recommendedPlan: 'professional' | 'team' | 'enterprise';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    customMessage: string;
  }> {
    const trialStatus = await this.getTrialStatus(userId);
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user?.organization) {
      throw new Error('User organization not found');
    }

    const analytics = await this.getAgentAnalytics(user.organization.id);
    
    // Calculate conversion score based on multiple factors
    let conversionScore = 0;
    const keyDrivers: string[] = [];

    // Usage intensity (40% of score)
    const usageIntensity = (
      trialStatus.totalUsed.oracle + 
      trialStatus.totalUsed.sentinel + 
      trialStatus.totalUsed.sage
    ) / (100 + 50 + 200); // out of total limits

    conversionScore += usageIntensity * 40;
    if (usageIntensity > 0.5) keyDrivers.push('High engagement with Trinity Agents');

    // ROI demonstration (30% of score)
    const roiScore = Math.min(analytics.summary.totalRoiImpact / 10000, 1); // cap at $10k
    conversionScore += roiScore * 30;
    if (roiScore > 0.3) keyDrivers.push('Significant ROI demonstrated');

    // Confidence in results (20% of score)
    const confidenceScore = analytics.summary.averageConfidence / 100;
    conversionScore += confidenceScore * 20;
    if (confidenceScore > 0.8) keyDrivers.push('High confidence in agent recommendations');

    // Time remaining urgency (10% of score)
    const urgencyScore = Math.max(0, 1 - (trialStatus.daysRemaining / 14));
    conversionScore += urgencyScore * 10;
    if (trialStatus.daysRemaining <= 3) keyDrivers.push('Trial ending soon');

    // Determine recommended plan based on usage patterns
    let recommendedPlan: 'professional' | 'team' | 'enterprise';
    if (analytics.summary.totalInteractions > 1000) {
      recommendedPlan = 'enterprise';
    } else if (analytics.summary.totalInteractions > 300) {
      recommendedPlan = 'team';
    } else {
      recommendedPlan = 'professional';
    }

    // Determine urgency level
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    if (trialStatus.daysRemaining <= 1) urgencyLevel = 'critical';
    else if (trialStatus.daysRemaining <= 3) urgencyLevel = 'high';
    else if (conversionScore > 70) urgencyLevel = 'medium';
    else urgencyLevel = 'low';

    // Generate custom message
    const customMessage = this.generateCustomConversionMessage(
      conversionScore,
      keyDrivers,
      recommendedPlan,
      trialStatus
    );

    return {
      conversionScore: Math.round(conversionScore),
      keyDrivers,
      recommendedPlan,
      urgencyLevel,
      customMessage,
    };
  }

  /**
   * Update ROI metrics for billing calculations
   */
  static async updateBillingMetrics(organizationId: string): Promise<void> {
    const currentMonth = new Date();
    
    // Update usage metrics for each agent type
    await Promise.all([
      trinityDb.updateUsageMetrics(organizationId, 'oracle', currentMonth),
      trinityDb.updateUsageMetrics(organizationId, 'sentinel', currentMonth),
      trinityDb.updateUsageMetrics(organizationId, 'sage', currentMonth),
    ]);

    // Generate monthly ROI report
    await this.generateMonthlyROIReport(organizationId);
  }

  /**
   * Generate monthly ROI report
   */
  private static async generateMonthlyROIReport(organizationId: string): Promise<void> {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    const roiMetrics = await this.getRoiMetrics(organizationId, undefined, 30);
    
    // Store ROI metrics for each agent type
    await Promise.all(['oracle', 'sentinel', 'sage'].map(async (agentType) => {
      const agentMetrics = await this.getRoiMetrics(organizationId, agentType as any, 30);
      
      await prisma.roi_metrics.upsert({
        where: {
          organization_id_agent_type_period_start_period_end: {
            organization_id: organizationId,
            agent_type: agentType,
            period_start: startDate,
            period_end: endDate,
          },
        },
        update: {
          total_interactions: agentMetrics.totalInteractions,
          successful_interactions: agentMetrics.successfulInteractions,
          total_processing_time_ms: BigInt(agentMetrics.totalInteractions * 150), // estimated
          average_confidence: agentMetrics.averageConfidence,
          projected_monthly_savings: agentMetrics.projectedMonthlySavings,
          time_reduction_hours: agentMetrics.timeReductionHours,
          efficiency_improvement_percent: agentMetrics.efficiencyImprovementPercent,
          decision_accuracy_percent: agentMetrics.successRate,
          calculated_at: new Date(),
        },
        create: {
          organization_id: organizationId,
          agent_type: agentType,
          period_start: startDate,
          period_end: endDate,
          total_interactions: agentMetrics.totalInteractions,
          successful_interactions: agentMetrics.successfulInteractions,
          total_processing_time_ms: BigInt(agentMetrics.totalInteractions * 150),
          average_confidence: agentMetrics.averageConfidence,
          projected_monthly_savings: agentMetrics.projectedMonthlySavings,
          time_reduction_hours: agentMetrics.timeReductionHours,
          efficiency_improvement_percent: agentMetrics.efficiencyImprovementPercent,
          decision_accuracy_percent: agentMetrics.successRate,
        },
      });
    }));
  }

  private static calculateEfficiencyGain(analytics: any[]): number {
    return analytics.reduce((avg, agent) => avg + agent.averageConfidence, 0) / analytics.length;
  }

  private static generateCustomConversionMessage(
    score: number,
    drivers: string[],
    plan: string,
    trialStatus: TrialStatus
  ): string {
    if (score > 80) {
      return `Excellent! You're getting tremendous value from Trinity Agents. The ${plan} plan will ensure continued access to these powerful insights.`;
    } else if (score > 60) {
      return `Great progress! Your Trinity Agents are delivering solid results. Consider the ${plan} plan to unlock unlimited potential.`;
    } else if (trialStatus.daysRemaining <= 3) {
      return `Your trial ends in ${trialStatus.daysRemaining} days. Upgrade now to maintain access to your Trinity Agent intelligence.`;
    } else {
      return `Continue exploring Trinity Agents' capabilities. The ${plan} plan offers the best value for your growing needs.`;
    }
  }
}

/**
 * Middleware for automatic ROI tracking on agent interactions
 */
export const roiTrackingMiddleware = async (
  userId: string,
  organizationId: string,
  agentType: 'oracle' | 'sentinel' | 'sage',
  interactionData: any,
  result: any
) => {
  const trackingData: AgentInteractionData = {
    userId,
    organizationId,
    agentType,
    interactionType: interactionData.type || 'general',
    inputData: interactionData.input,
    outputData: result,
    confidenceScore: result.confidence,
    processingTimeMs: result.processingTime,
    success: result.success !== false,
    errorMessage: result.error,
    metadata: {
      ...interactionData.metadata,
      timestamp: new Date().toISOString(),
    },
  };

  return await ROITrackingService.recordInteraction(trackingData);
};