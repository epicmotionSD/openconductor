/**
 * Prisma Client Configuration for Trinity Agent Platform
 * Handles database connections and includes Trinity Agent-specific extensions
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Trinity Agent-specific database extensions
export const trinityDb = {
  /**
   * Get Trinity Agent usage analytics for an organization
   */
  async getAgentAnalytics(organizationId: string, startDate?: Date, endDate?: Date) {
    const defaultEndDate = endDate || new Date();
    const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const analytics = await prisma.ai_interactions.groupBy({
      by: ['agent_type'],
      where: {
        organization_id: organizationId,
        created_at: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        confidence_score: true,
        processing_time_ms: true,
        roi_impact: true,
      },
      _sum: {
        roi_impact: true,
      },
    });

    return analytics.map(item => ({
      agentType: item.agent_type,
      totalInteractions: item._count.id,
      averageConfidence: item._avg.confidence_score,
      averageProcessingTime: item._avg.processing_time_ms,
      averageRoiImpact: item._avg.roi_impact,
      totalRoiImpact: item._sum.roi_impact,
    }));
  },

  /**
   * Get ROI metrics for a specific period
   */
  async getRoiMetrics(organizationId: string, agentType?: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      organization_id: organizationId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (agentType) {
      whereClause.agent_type = agentType;
    }

    const metrics = await prisma.ai_interactions.aggregate({
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        roi_impact: true,
      },
      _avg: {
        confidence_score: true,
        processing_time_ms: true,
      },
    });

    // Calculate additional metrics
    const successfulInteractions = await prisma.ai_interactions.count({
      where: {
        ...whereClause,
        success: true,
      },
    });

    const projectedMonthlySavings = (metrics._sum.roi_impact || 0) * (30 / days);
    const timeReductionHours = (metrics._count.id || 0) * 0.25; // 15 minutes per interaction
    const efficiencyImprovement = metrics._count.id > 0 
      ? (successfulInteractions / metrics._count.id) * 100 
      : 0;

    return {
      totalInteractions: metrics._count.id,
      successfulInteractions,
      averageConfidence: metrics._avg.confidence_score,
      averageProcessingTime: metrics._avg.processing_time_ms,
      totalRoiImpact: metrics._sum.roi_impact,
      projectedMonthlySavings,
      timeReductionHours,
      efficiencyImprovementPercent: efficiencyImprovement,
      successRate: efficiencyImprovement,
    };
  },

  /**
   * Record a Trinity Agent interaction
   */
  async recordInteraction(data: {
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
  }) {
    // Get agent ID
    const agent = await prisma.ai_agents.findFirst({
      where: { type: data.agentType },
    });

    if (!agent) {
      throw new Error(`Agent of type ${data.agentType} not found`);
    }

    const interaction = await prisma.ai_interactions.create({
      data: {
        user_id: data.userId,
        organization_id: data.organizationId,
        agent_id: agent.id,
        agent_type: data.agentType,
        interaction_type: data.interactionType,
        input_data: data.inputData,
        output_data: data.outputData,
        confidence_score: data.confidenceScore,
        processing_time_ms: data.processingTimeMs,
        success: data.success,
        error_message: data.errorMessage,
        metadata: data.metadata || {},
      },
    });

    return interaction;
  },

  /**
   * Check trial status for a user
   */
  async getTrialStatus(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });

    if (!user || !user.organization) {
      return null;
    }

    const isTrialActive = user.organization.plan_type === 'trial' && 
                         user.organization.trial_ends_at && 
                         new Date() <= user.organization.trial_ends_at;

    const trialInteractions = user.trial_interactions_remaining as any || {};
    
    return {
      isTrialActive,
      trialEndsAt: user.organization.trial_ends_at,
      trialAgents: user.trial_agents,
      remainingInteractions: {
        oracle: trialInteractions.oracle || 0,
        sentinel: trialInteractions.sentinel || 0,
        sage: trialInteractions.sage || 0,
      },
      daysRemaining: isTrialActive && user.organization.trial_ends_at
        ? Math.ceil((user.organization.trial_ends_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
    };
  },

  /**
   * Get agent workflow automations for an organization
   */
  async getAgentWorkflows(organizationId: string, agentType?: string) {
    const whereClause: any = {
      organization_id: organizationId,
      is_active: true,
    };

    if (agentType) {
      whereClause.agent_type = agentType;
    }

    const workflows = await prisma.agent_workflows.findMany({
      where: whereClause,
      include: {
        created_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workflow_executions: {
          where: {
            status: 'completed',
          },
          orderBy: {
            completed_at: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return workflows.map(workflow => ({
      ...workflow,
      recentExecutions: workflow.workflow_executions.length,
      lastExecutedAt: workflow.workflow_executions[0]?.completed_at || null,
    }));
  },

  /**
   * Get active alerts for an organization
   */
  async getActiveAlerts(organizationId: string) {
    return await prisma.alert_incidents.findMany({
      where: {
        organization_id: organizationId,
        status: {
          in: ['open', 'investigating'],
        },
      },
      include: {
        alert_configuration: true,
        resolved_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          severity: 'desc',
        },
        {
          created_at: 'desc',
        },
      ],
    });
  },

  /**
   * Update usage metrics for billing
   */
  async updateUsageMetrics(organizationId: string, agentType: string, period: Date) {
    const startOfMonth = new Date(period.getFullYear(), period.getMonth(), 1);
    const endOfMonth = new Date(period.getFullYear(), period.getMonth() + 1, 0);

    const interactionCount = await prisma.ai_interactions.count({
      where: {
        organization_id: organizationId,
        agent_type: agentType,
        created_at: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Get subscription item for this agent type
    const subscriptionItem = await prisma.subscription_items.findFirst({
      where: {
        organization_id: organizationId,
        agent_type: agentType,
        is_active: true,
      },
    });

    if (!subscriptionItem) {
      return null;
    }

    const overageCount = Math.max(0, interactionCount - (subscriptionItem.interaction_limit || 0));
    const totalCharges = overageCount * 0.10; // $0.10 per overage interaction

    // Update or create usage record
    const usageRecord = await prisma.usage_records.upsert({
      where: {
        subscription_item_id_period_start_period_end: {
          subscription_item_id: subscriptionItem.id,
          period_start: startOfMonth,
          period_end: endOfMonth,
        },
      },
      update: {
        interaction_count: interactionCount,
        overage_count: overageCount,
        total_charges: totalCharges,
      },
      create: {
        organization_id: organizationId,
        subscription_item_id: subscriptionItem.id,
        agent_type: agentType,
        period_start: startOfMonth,
        period_end: endOfMonth,
        interaction_count: interactionCount,
        overage_count: overageCount,
        total_charges: totalCharges,
      },
    });

    return usageRecord;
  },
};

export { prisma };
export default prisma;