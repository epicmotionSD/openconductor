// CFO Agent (Apex) - Chief Financial Officer
// Revenue agent: ROAS analysis, ad bleed detection, budget allocation

import { BaseAgent } from './base-agent';
import { AgentService, AgentTask } from '../services/agent-service';

export class CFOAgent extends BaseAgent {
  constructor(agentService: AgentService) {
    super(agentService, {
      role: 'cfo',
      pollInterval: 15000, // 15 seconds (financial analysis is less frequent)
      maxConcurrentTasks: 2
    });
  }

  get name(): string {
    return 'Apex';
  }

  get description(): string {
    return 'Chief Financial Officer - Revenue analysis and ad spend optimization';
  }

  get capabilities(): string[] {
    return [
      'revenue_analysis',
      'ad_bleed_detection',
      'budget_optimization',
      'roas_forecasting',
      'cost_analysis'
    ];
  }

  protected registerTaskHandlers(): void {
    this.registerTaskHandler('revenue_analysis', this.handleRevenueAnalysis.bind(this));
    this.registerTaskHandler('validate_budget', this.handleValidateBudget.bind(this));
    this.registerTaskHandler('ad_bleed_scan', this.handleAdBleedScan.bind(this));
    this.registerTaskHandler('budget_allocation', this.handleBudgetAllocation.bind(this));
    this.registerTaskHandler('roas_forecast', this.handleRoasForecast.bind(this));
  }

  // ============================================
  // TASK HANDLERS
  // ============================================

  private async handleRevenueAnalysis(task: AgentTask): Promise<any> {
    const { period, campaigns } = task.payload;

    const analysis = {
      period,
      totalRevenue: await this.calculateTotalRevenue(period),
      totalSpend: await this.calculateTotalSpend(period),
      roas: 0,
      profitMargin: 0,
      topPerformers: await this.identifyTopPerformers(campaigns),
      underperformers: await this.identifyUnderperformers(campaigns),
      recommendations: []
    };

    // Calculate metrics
    analysis.roas = analysis.totalRevenue / analysis.totalSpend;
    analysis.profitMargin = ((analysis.totalRevenue - analysis.totalSpend) / analysis.totalRevenue) * 100;

    // Generate recommendations
    analysis.recommendations = this.generateRevenueRecommendations(analysis);

    // Log the analysis
    await this.makeDecision(
      'recommend_action',
      `Revenue Analysis: ${period}`,
      `ROAS: ${analysis.roas.toFixed(2)}, Margin: ${analysis.profitMargin.toFixed(1)}%`,
      {
        reasoning: 'Routine revenue analysis completed',
        data: analysis,
        confidence: 0.9,
        impact: 'medium',
        autoApprove: true
      }
    );

    return analysis;
  }

  private async handleValidateBudget(task: AgentTask): Promise<any> {
    const { campaignName, budget, expectedRoas, keyword } = task.payload;

    const validation = this.validateBudgetRequest(budget, expectedRoas);

    if (validation.approved) {
      await this.makeDecision(
        'adjust_budget',
        `Budget Approved: ${campaignName}`,
        `Approved $${budget.daily}/day budget (expected ROAS: ${expectedRoas})`,
        {
          reasoning: validation.reasoning,
          data: { campaignName, budget, expectedRoas },
          confidence: validation.confidence,
          impact: budget.daily > 100 ? 'high' : 'medium',
          autoApprove: budget.daily <= 50 // Auto-approve small budgets
        }
      );

      return {
        approved: true,
        budget,
        constraints: validation.constraints
      };
    } else {
      // Escalate to CEO for high-risk budgets
      if (validation.needsEscalation) {
        await this.delegateTask(
          'ceo',
          'approval_request',
          `Budget review: ${campaignName}`,
          {
            decisionType: 'adjust_budget',
            data: { campaignName, budget, expectedRoas, ...validation },
            requestingAgent: this.name
          },
          { priority: 'high' }
        );
      }

      return {
        approved: false,
        reason: validation.reason,
        suggestedBudget: validation.suggestedBudget
      };
    }
  }

  private async handleAdBleedScan(task: AgentTask): Promise<any> {
    const { campaigns, period } = task.payload;

    const alerts: any[] = [];

    // Scan for different types of ad bleed
    for (const campaign of campaigns) {
      // Check for cannibalization
      const cannibalization = await this.detectCannibalization(campaign);
      if (cannibalization.detected) {
        alerts.push({
          type: 'cannibalization',
          ...cannibalization
        });
      }

      // Check for intent mismatch
      const intentMismatch = await this.detectIntentMismatch(campaign);
      if (intentMismatch.detected) {
        alerts.push({
          type: 'intent_mismatch',
          ...intentMismatch
        });
      }

      // Check for dead trends
      const deadTrends = await this.detectDeadTrends(campaign);
      if (deadTrends.detected) {
        alerts.push({
          type: 'dead_trend',
          ...deadTrends
        });
      }
    }

    // Log alerts
    for (const alert of alerts) {
      await this.makeDecision(
        'flag_ad_bleed',
        `Ad Bleed Detected: ${alert.type}`,
        `${alert.keyword}: $${alert.wastedSpend} wasted`,
        {
          reasoning: alert.reason,
          data: alert,
          confidence: alert.confidence,
          impact: alert.wastedSpend > 100 ? 'high' : 'medium',
          autoApprove: alert.autoFixAvailable
        }
      );
    }

    return {
      totalAlerts: alerts.length,
      totalWasted: alerts.reduce((sum, a) => sum + a.wastedSpend, 0),
      alerts
    };
  }

  private async handleBudgetAllocation(task: AgentTask): Promise<any> {
    const { totalBudget, campaigns, objectives } = task.payload;

    // Calculate optimal allocation
    const allocation = this.calculateOptimalAllocation(totalBudget, campaigns, objectives);

    // Check if reallocation differs significantly from current
    const significantChanges = allocation.changes.filter((c: any) => Math.abs(c.changePercent) > 20);

    if (significantChanges.length > 0) {
      // Request CEO approval for significant changes
      await this.delegateTask(
        'ceo',
        'approval_request',
        'Budget reallocation request',
        {
          decisionType: 'adjust_budget',
          data: { allocation, significantChanges },
          requestingAgent: this.name
        },
        { priority: 'high' }
      );
    }

    await this.makeDecision(
      'adjust_budget',
      'Budget Allocation Updated',
      `Reallocated $${totalBudget} across ${campaigns.length} campaigns`,
      {
        reasoning: 'Optimization based on performance metrics',
        data: allocation,
        confidence: 0.85,
        impact: significantChanges.length > 0 ? 'high' : 'low',
        autoApprove: significantChanges.length === 0
      }
    );

    return allocation;
  }

  private async handleRoasForecast(task: AgentTask): Promise<any> {
    const { campaign, scenario, timeframe } = task.payload;

    const forecast = {
      baseCase: this.calculateForecast(campaign, 'base', timeframe),
      optimistic: this.calculateForecast(campaign, 'optimistic', timeframe),
      pessimistic: this.calculateForecast(campaign, 'pessimistic', timeframe),
      assumptions: this.listAssumptions(campaign),
      risks: this.identifyRisks(campaign)
    };

    return forecast;
  }

  // ============================================
  // AD BLEED DETECTION
  // ============================================

  private async detectCannibalization(campaign: any): Promise<any> {
    // Simulated detection (would use real Google Ads/Search data)
    const organicRank = Math.floor(Math.random() * 10) + 1;
    const isAdvertising = true;

    if (organicRank <= 3 && isAdvertising) {
      return {
        detected: true,
        keyword: campaign.keyword || 'branded term',
        organicRank,
        wastedSpend: Math.floor(Math.random() * 200),
        confidence: 0.95,
        reason: `Already ranking #${organicRank} organically`,
        recommendation: 'Pause ad for this keyword',
        autoFixAvailable: true
      };
    }

    return { detected: false };
  }

  private async detectIntentMismatch(campaign: any): Promise<any> {
    // Check if informational keywords have transactional ads
    const keyword = campaign.keyword || '';
    const isInformational = ['how to', 'what is', 'guide', 'tips'].some(
      i => keyword.toLowerCase().includes(i)
    );
    const hasTransactionalAd = true; // Simulated

    if (isInformational && hasTransactionalAd) {
      return {
        detected: true,
        keyword,
        wastedSpend: Math.floor(Math.random() * 100),
        confidence: 0.88,
        reason: 'Informational keyword with transactional ad',
        recommendation: 'Add to negative keywords or create informational content',
        autoFixAvailable: true
      };
    }

    return { detected: false };
  }

  private async detectDeadTrends(campaign: any): Promise<any> {
    // Check if keyword trend is declining
    const trendDirection = Math.random() > 0.7 ? 'declining' : 'stable';
    const spend = Math.floor(Math.random() * 300);

    if (trendDirection === 'declining' && spend > 100) {
      return {
        detected: true,
        keyword: campaign.keyword || 'declining keyword',
        wastedSpend: spend * 0.3, // 30% of spend considered wasted
        confidence: 0.82,
        reason: 'Keyword trend is declining but spend remains high',
        recommendation: 'Reduce budget or pause campaign',
        autoFixAvailable: false
      };
    }

    return { detected: false };
  }

  // ============================================
  // BUDGET VALIDATION
  // ============================================

  private validateBudgetRequest(
    budget: { daily: number; monthly: number },
    expectedRoas: number
  ): {
    approved: boolean;
    confidence: number;
    reasoning: string;
    reason?: string;
    constraints?: any;
    suggestedBudget?: any;
    needsEscalation: boolean;
  } {
    // Check ROAS threshold
    if (expectedRoas < 2.0) {
      return {
        approved: false,
        confidence: 0.9,
        reasoning: 'Expected ROAS below minimum threshold',
        reason: 'ROAS must be at least 2.0x',
        suggestedBudget: { daily: budget.daily * 0.5, monthly: budget.monthly * 0.5 },
        needsEscalation: false
      };
    }

    // Check budget limits
    if (budget.daily > 200) {
      return {
        approved: false,
        confidence: 0.85,
        reasoning: 'Daily budget exceeds automated approval limit',
        reason: 'Requires executive approval for budgets > $200/day',
        needsEscalation: true
      };
    }

    // Approve with constraints
    return {
      approved: true,
      confidence: 0.92,
      reasoning: `ROAS ${expectedRoas}x meets threshold, budget within limits`,
      constraints: {
        maxDailyIncrease: budget.daily * 0.2, // 20% max increase
        reviewAfter: '7 days'
      },
      needsEscalation: false
    };
  }

  // ============================================
  // BUDGET ALLOCATION
  // ============================================

  private calculateOptimalAllocation(
    totalBudget: number,
    campaigns: any[],
    objectives: any
  ): {
    allocations: any[];
    changes: any[];
    totalAllocated: number;
  } {
    const allocations: any[] = [];
    const changes: any[] = [];

    // Sort campaigns by ROAS
    const sortedCampaigns = [...campaigns].sort((a, b) => b.roas - a.roas);

    // Allocate budget proportionally to ROAS
    let remaining = totalBudget;
    for (const campaign of sortedCampaigns) {
      const allocation = Math.min(
        remaining * (campaign.roas / 10), // Higher ROAS = more budget
        remaining * 0.4 // Max 40% to any single campaign
      );

      allocations.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        currentBudget: campaign.budget,
        newBudget: allocation,
        roas: campaign.roas
      });

      const change = ((allocation - campaign.budget) / campaign.budget) * 100;
      changes.push({
        campaignId: campaign.id,
        changePercent: change,
        reason: change > 0 ? 'High ROAS' : 'Low ROAS'
      });

      remaining -= allocation;
    }

    return {
      allocations,
      changes,
      totalAllocated: totalBudget - remaining
    };
  }

  // ============================================
  // REVENUE CALCULATIONS
  // ============================================

  private async calculateTotalRevenue(period: string): Promise<number> {
    // Placeholder - would query actual revenue data
    return 15000 + Math.floor(Math.random() * 5000);
  }

  private async calculateTotalSpend(period: string): Promise<number> {
    // Placeholder - would query actual spend data
    return 3000 + Math.floor(Math.random() * 1000);
  }

  private async identifyTopPerformers(campaigns: any[]): Promise<any[]> {
    return campaigns.filter(c => c.roas > 4).slice(0, 3);
  }

  private async identifyUnderperformers(campaigns: any[]): Promise<any[]> {
    return campaigns.filter(c => c.roas < 2).slice(0, 3);
  }

  private generateRevenueRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.roas < 3) {
      recommendations.push('Consider reducing spend on underperforming campaigns');
    }

    if (analysis.profitMargin < 30) {
      recommendations.push('Review cost structure and pricing strategy');
    }

    if (analysis.topPerformers.length > 0) {
      recommendations.push('Increase budget for top-performing campaigns');
    }

    return recommendations;
  }

  // ============================================
  // FORECASTING
  // ============================================

  private calculateForecast(campaign: any, scenario: string, timeframe: string): any {
    const multiplier = scenario === 'optimistic' ? 1.3 : scenario === 'pessimistic' ? 0.7 : 1.0;

    return {
      revenue: (campaign.revenue || 1000) * multiplier,
      roas: (campaign.roas || 3) * multiplier,
      conversions: (campaign.conversions || 50) * multiplier
    };
  }

  private listAssumptions(campaign: any): string[] {
    return [
      'Market conditions remain stable',
      'Competitor activity unchanged',
      'Seasonal patterns follow historical trends'
    ];
  }

  private identifyRisks(campaign: any): string[] {
    return [
      'Increased competitor bidding',
      'Market saturation',
      'Platform policy changes'
    ];
  }
}

export default CFOAgent;
