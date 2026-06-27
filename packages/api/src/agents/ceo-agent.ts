// CEO Agent (Atlas) - Chief Executive Officer
// Supervisor agent: Strategic decisions, task decomposition, agent coordination

import { BaseAgent } from './base-agent';
import { AgentService, AgentTask, TaskPriority } from '../services/agent-service';

export class CEOAgent extends BaseAgent {
  constructor(agentService: AgentService) {
    super(agentService, {
      role: 'ceo',
      pollInterval: 3000, // Check every 3 seconds (fastest response)
      maxConcurrentTasks: 5
    });
  }

  get name(): string {
    return 'Atlas';
  }

  get description(): string {
    return 'Chief Executive Officer - Strategic supervisor and coordinator';
  }

  get capabilities(): string[] {
    return [
      'strategic_planning',
      'task_delegation',
      'decision_approval',
      'escalation',
      'agent_coordination'
    ];
  }

  protected registerTaskHandlers(): void {
    // Handle strategic planning requests
    this.registerTaskHandler('strategic_plan', this.handleStrategicPlan.bind(this));

    // Handle approval requests from other agents
    this.registerTaskHandler('approval_request', this.handleApprovalRequest.bind(this));

    // Handle escalations
    this.registerTaskHandler('escalation', this.handleEscalation.bind(this));

    // Handle revenue opportunity analysis
    this.registerTaskHandler('analyze_opportunity', this.handleAnalyzeOpportunity.bind(this));

    // Handle coordination tasks
    this.registerTaskHandler('coordinate_campaign', this.handleCoordinateCampaign.bind(this));
  }

  // ============================================
  // TASK HANDLERS
  // ============================================

  private async handleStrategicPlan(task: AgentTask): Promise<any> {
    const { goal, context, constraints } = task.payload;

    // Analyze the goal and create a strategic plan
    const plan = await this.createStrategicPlan(goal, context, constraints);

    // Delegate sub-tasks to appropriate agents
    await this.delegatePlanTasks(plan);

    // Log the decision
    await this.makeDecision(
      'recommend_action',
      `Strategic Plan: ${goal}`,
      `Created strategic plan with ${plan.tasks.length} delegated tasks`,
      {
        reasoning: `Analyzed goal "${goal}" and decomposed into actionable tasks`,
        data: { plan, tasksCreated: plan.tasks.length },
        confidence: plan.confidence,
        impact: plan.impact,
        autoApprove: plan.confidence > 0.8 && plan.impact !== 'critical'
      }
    );

    return { success: true, plan };
  }

  private async handleApprovalRequest(task: AgentTask): Promise<any> {
    const { decisionId, decisionType, data, requestingAgent } = task.payload;

    // Evaluate the request
    const evaluation = this.evaluateApprovalRequest(decisionType, data);

    if (evaluation.shouldApprove) {
      await this.agentService.approveDecision(decisionId, this.agent!.id);

      return {
        approved: true,
        reason: evaluation.reason
      };
    } else if (evaluation.needsHumanReview) {
      // Escalate to human
      await this.escalateToHuman(
        `Review Required: ${decisionType}`,
        evaluation.reason,
        { originalDecisionId: decisionId, ...data }
      );

      return {
        approved: false,
        escalated: true,
        reason: evaluation.reason
      };
    } else {
      return {
        approved: false,
        reason: evaluation.reason
      };
    }
  }

  private async handleEscalation(task: AgentTask): Promise<any> {
    const { issue, source, severity, data } = task.payload;

    // Log the escalation
    await this.makeDecision(
      'escalate_to_human',
      `Escalation: ${issue}`,
      `Received escalation from ${source} with severity: ${severity}`,
      {
        reasoning: 'Escalation received requiring executive attention',
        data: { issue, source, severity, ...data },
        confidence: 0.5,
        impact: severity === 'critical' ? 'critical' : 'high',
        autoApprove: false
      }
    );

    return { acknowledged: true, escalatedToHuman: true };
  }

  private async handleAnalyzeOpportunity(task: AgentTask): Promise<any> {
    const { keyword, trendData, competitorData } = task.payload;

    // Analyze the opportunity
    const analysis = this.analyzeOpportunity(keyword, trendData, competitorData);

    if (analysis.score > 70) {
      // High opportunity - delegate to appropriate teams
      if (analysis.recommendedAction === 'deploy_landing_page') {
        await this.delegateTask(
          'cto',
          'select_template',
          `Select template for: ${keyword}`,
          { keyword, intent: analysis.intent, context: analysis },
          { priority: analysis.score > 85 ? 'high' : 'medium' }
        );
      }

      if (analysis.recommendedAction === 'create_campaign') {
        await this.delegateTask(
          'cmo',
          'create_campaign',
          `Create campaign for: ${keyword}`,
          { keyword, ...analysis },
          { priority: 'high' }
        );
      }
    }

    return { analysis, actioned: analysis.score > 70 };
  }

  private async handleCoordinateCampaign(task: AgentTask): Promise<any> {
    const { campaignName, keyword, budget } = task.payload;

    // Coordinate between CMO and CFO
    // 1. Ask CFO to validate budget
    await this.delegateTask(
      'cfo',
      'validate_budget',
      `Validate budget for ${campaignName}`,
      { campaignName, budget, keyword },
      { priority: 'high' }
    );

    // 2. Ask CMO to prepare campaign strategy
    await this.delegateTask(
      'cmo',
      'prepare_campaign_strategy',
      `Prepare strategy for ${campaignName}`,
      { campaignName, keyword },
      { priority: 'high' }
    );

    // 3. Ask CTO to prepare landing page
    await this.delegateTask(
      'cto',
      'prepare_landing_page',
      `Prepare LP for ${campaignName}`,
      { campaignName, keyword },
      { priority: 'medium' }
    );

    return {
      coordinated: true,
      tasksCreated: 3,
      agents: ['cfo', 'cmo', 'cto']
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async createStrategicPlan(
    goal: string,
    context: any,
    constraints: any
  ): Promise<{
    tasks: Array<{ agent: string; taskType: string; priority: TaskPriority }>;
    confidence: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
  }> {
    // Strategic planning logic
    const tasks: Array<{ agent: string; taskType: string; priority: TaskPriority }> = [];

    // Analyze goal type and create appropriate tasks
    if (goal.includes('revenue') || goal.includes('campaign')) {
      tasks.push({ agent: 'cfo', taskType: 'revenue_analysis', priority: 'high' });
      tasks.push({ agent: 'cmo', taskType: 'market_analysis', priority: 'high' });
    }

    if (goal.includes('deploy') || goal.includes('landing')) {
      tasks.push({ agent: 'cto', taskType: 'select_template', priority: 'high' });
    }

    if (goal.includes('trend') || goal.includes('keyword')) {
      tasks.push({ agent: 'cmo', taskType: 'trend_analysis', priority: 'medium' });
    }

    return {
      tasks,
      confidence: 0.85,
      impact: tasks.length > 2 ? 'high' : 'medium'
    };
  }

  private async delegatePlanTasks(plan: any): Promise<void> {
    for (const task of plan.tasks) {
      await this.delegateTask(
        task.agent,
        task.taskType,
        `Delegated: ${task.taskType}`,
        { fromPlan: true },
        { priority: task.priority }
      );
    }
  }

  private evaluateApprovalRequest(
    decisionType: string,
    data: any
  ): {
    shouldApprove: boolean;
    needsHumanReview: boolean;
    reason: string;
  } {
    // Budget decisions over threshold need human review
    if (decisionType === 'adjust_budget' && data.amount > 500) {
      return {
        shouldApprove: false,
        needsHumanReview: true,
        reason: 'Budget adjustment exceeds automated approval threshold'
      };
    }

    // High-impact deployments need human review
    if (decisionType === 'deploy_template' && data.impact === 'critical') {
      return {
        shouldApprove: false,
        needsHumanReview: true,
        reason: 'Critical deployment requires human approval'
      };
    }

    // Auto-approve low-risk decisions
    if (data.confidence > 0.9 && data.impact !== 'critical') {
      return {
        shouldApprove: true,
        needsHumanReview: false,
        reason: 'High confidence, acceptable risk'
      };
    }

    return {
      shouldApprove: false,
      needsHumanReview: true,
      reason: 'Confidence below threshold for auto-approval'
    };
  }

  private analyzeOpportunity(
    keyword: string,
    trendData: any,
    competitorData: any
  ): {
    score: number;
    intent: string;
    recommendedAction: string;
  } {
    let score = 50; // Base score

    // Trend analysis
    if (trendData?.growthRate > 200) score += 30;
    else if (trendData?.growthRate > 100) score += 20;
    else if (trendData?.growthRate > 50) score += 10;

    // Competition analysis
    if (competitorData?.competitionLevel === 'low') score += 15;
    else if (competitorData?.competitionLevel === 'medium') score += 5;
    else score -= 10;

    // Determine intent
    const intent = this.determineKeywordIntent(keyword);

    // Determine action
    let recommendedAction = 'monitor';
    if (score > 85) recommendedAction = 'deploy_landing_page';
    else if (score > 70) recommendedAction = 'create_campaign';

    return { score, intent, recommendedAction };
  }

  private determineKeywordIntent(keyword: string): string {
    const transactionalIndicators = ['buy', 'book', 'price', 'cost', 'near me', 'appointment'];
    const informationalIndicators = ['how to', 'what is', 'guide', 'tutorial', 'tips'];
    const commercialIndicators = ['best', 'vs', 'review', 'compare'];

    const lowerKeyword = keyword.toLowerCase();

    if (transactionalIndicators.some(i => lowerKeyword.includes(i))) {
      return 'transactional';
    }
    if (informationalIndicators.some(i => lowerKeyword.includes(i))) {
      return 'informational';
    }
    if (commercialIndicators.some(i => lowerKeyword.includes(i))) {
      return 'commercial';
    }

    return 'navigational';
  }
}

export default CEOAgent;
