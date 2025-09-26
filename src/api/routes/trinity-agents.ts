/**
 * Trinity Agent API Routes
 * 
 * Agent-centric API endpoints focusing on Oracle, Sentinel, and Sage interactions
 * Replaces generic MCP server routes with Trinity Agent-specific operations
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth, requireAgentAccess } from '../middleware/auth';
import { ROITrackingService } from '../../services/roi-tracking';
import { OracleAgent } from '../../agents/oracle-agent';
import { SentinelAgent } from '../../agents/sentinel-agent';
import { SageAgent } from '../../agents/sage-agent';
import { TrinityMCPIntegration } from '../../mcp/trinity-mcp-integration';
import { Logger } from '../../utils/logger';

const router = Router();
const logger = new Logger('TrinityAgentAPI');
const mcpIntegration = new TrinityMCPIntegration(logger);

// Initialize Trinity Agents
const agents = {
  oracle: new OracleAgent({ id: 'oracle-prod', name: 'Oracle Analytics' }, logger),
  sentinel: new SentinelAgent({ id: 'sentinel-prod', name: 'Sentinel Monitoring' }, logger),
  sage: new SageAgent({ id: 'sage-prod', name: 'Sage Optimization' }, logger)
};

/**
 * GET /api/trinity-agents
 * Get all Trinity Agents and their current status
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId, organizationId } = req.user;
    
    // Get access status for each agent
    const accessChecks = await Promise.all([
      ROITrackingService.checkAgentAccess(userId, 'oracle'),
      ROITrackingService.checkAgentAccess(userId, 'sentinel'),
      ROITrackingService.checkAgentAccess(userId, 'sage')
    ]);

    const agentStatus = [
      {
        type: 'oracle',
        name: 'Oracle Analytics',
        tagline: 'The wisdom to see what\'s coming',
        description: 'Advanced business intelligence with predictive analytics',
        hasAccess: accessChecks[0].hasAccess,
        remainingInteractions: accessChecks[0].remainingInteractions,
        status: agents.oracle.getStatus(),
        metrics: agents.oracle.getMetrics()
      },
      {
        type: 'sentinel',
        name: 'Sentinel Monitoring',
        tagline: 'The vigilance to know what\'s happening',
        description: '24/7 autonomous system monitoring',
        hasAccess: accessChecks[1].hasAccess,
        remainingInteractions: accessChecks[1].remainingInteractions,
        status: agents.sentinel.getStatus(),
        metrics: agents.sentinel.getMetrics()
      },
      {
        type: 'sage',
        name: 'Sage Optimization',
        tagline: 'The intelligence to know what to do',
        description: 'Intelligent content generation and process optimization',
        hasAccess: accessChecks[2].hasAccess,
        remainingInteractions: accessChecks[2].remainingInteractions,
        status: agents.sage.getStatus(),
        metrics: agents.sage.getMetrics()
      }
    ];

    res.json({
      success: true,
      agents: agentStatus,
      summary: {
        totalAgents: 3,
        accessibleAgents: accessChecks.filter(check => check.hasAccess).length,
        organizationId
      }
    });
  } catch (error) {
    logger.error('Failed to get agent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent status'
    });
  }
});

/**
 * POST /api/trinity-agents/:agentType/interact
 * Execute an interaction with a specific Trinity Agent
 */
router.post('/:agentType/interact',
  requireAuth,
  requireAgentAccess,
  [
    param('agentType').isIn(['oracle', 'sentinel', 'sage']),
    body('input').exists(),
    body('context').optional().isObject()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { agentType } = req.params;
    const { input, context } = req.body;
    const { userId, organizationId } = req.user;

    try {
      const agent = agents[agentType as keyof typeof agents];
      const startTime = Date.now();

      // Execute agent interaction
      const result = await agent.execute(input, context);
      const processingTime = Date.now() - startTime;

      // Record interaction for ROI tracking
      const trackingResult = await ROITrackingService.recordInteraction({
        userId,
        organizationId,
        agentType: agentType as any,
        interactionType: context?.type || 'general',
        inputData: input,
        outputData: result,
        confidenceScore: result.confidence,
        processingTimeMs: processingTime,
        success: !!result && !result.error,
        errorMessage: result.error,
        metadata: {
          ...context,
          processingTime,
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        result,
        interaction: {
          agentType,
          processingTime,
          roiImpact: trackingResult.roiImpact
        },
        trialStatus: trackingResult.trialStatus
      });
    } catch (error) {
      logger.error(`Agent ${agentType} interaction failed:`, error);
      
      // Still record failed interaction for analytics
      await ROITrackingService.recordInteraction({
        userId,
        organizationId,
        agentType: agentType as any,
        interactionType: context?.type || 'general',
        inputData: input,
        outputData: null,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: context
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Agent interaction failed'
      });
    }
  }
);

/**
 * GET /api/trinity-agents/:agentType/workflows
 * Get available automation workflows for a specific agent
 */
router.get('/:agentType/workflows',
  requireAuth,
  requireAgentAccess,
  [param('agentType').isIn(['oracle', 'sentinel', 'sage'])],
  async (req, res) => {
    const { agentType } = req.params;
    
    try {
      const workflows = mcpIntegration.getWorkflowsForAgent(agentType as any);
      
      res.json({
        success: true,
        workflows: workflows.map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          triggerType: workflow.triggerType,
          isActive: workflow.isActive,
          steps: workflow.steps.length,
          description: `Automated ${workflow.triggerType} workflow for ${agentType} agent`
        }))
      });
    } catch (error) {
      logger.error(`Failed to get workflows for ${agentType}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workflows'
      });
    }
  }
);

/**
 * POST /api/trinity-agents/:agentType/workflows/:workflowId/execute
 * Execute a specific automation workflow
 */
router.post('/:agentType/workflows/:workflowId/execute',
  requireAuth,
  requireAgentAccess,
  [
    param('agentType').isIn(['oracle', 'sentinel', 'sage']),
    param('workflowId').isString(),
    body('triggerData').optional().isObject()
  ],
  async (req, res) => {
    const { agentType, workflowId } = req.params;
    const { triggerData = {} } = req.body;
    const { userId, organizationId } = req.user;

    try {
      const result = await mcpIntegration.executeWorkflow(
        workflowId,
        { ...triggerData, userId, organizationId },
        agentType as any
      );

      // Record workflow execution as an interaction
      await ROITrackingService.recordInteraction({
        userId,
        organizationId,
        agentType: agentType as any,
        interactionType: 'workflow_execution',
        inputData: { workflowId, triggerData },
        outputData: result,
        success: result.success,
        errorMessage: result.error,
        processingTimeMs: result.executionTime,
        metadata: {
          workflowId,
          executionType: 'manual'
        }
      });

      res.json({
        success: true,
        execution: result,
        workflow: {
          id: workflowId,
          agentType,
          executedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error(`Workflow execution failed:`, error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Workflow execution failed'
      });
    }
  }
);

/**
 * GET /api/trinity-agents/analytics
 * Get comprehensive analytics for all Trinity Agents
 */
router.get('/analytics',
  requireAuth,
  [
    query('days').optional().isInt({ min: 1, max: 365 }),
    query('agentType').optional().isIn(['oracle', 'sentinel', 'sage'])
  ],
  async (req, res) => {
    const { organizationId } = req.user;
    const days = parseInt(req.query.days as string) || 30;
    const agentType = req.query.agentType as string;

    try {
      const analytics = await ROITrackingService.getAgentAnalytics(organizationId, days);
      const roiMetrics = await ROITrackingService.getRoiMetrics(organizationId, agentType as any, days);

      res.json({
        success: true,
        analytics: {
          ...analytics,
          roiMetrics,
          period: {
            days,
            startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics'
      });
    }
  }
);

/**
 * GET /api/trinity-agents/trial-status
 * Get current trial status and conversion insights
 */
router.get('/trial-status', requireAuth, async (req, res) => {
  const { userId } = req.user;

  try {
    const trialStatus = await ROITrackingService.getTrialStatus(userId);
    const conversionInsights = await ROITrackingService.generateTrialConversionInsights(userId);

    res.json({
      success: true,
      trial: trialStatus,
      conversion: conversionInsights
    });
  } catch (error) {
    logger.error('Failed to get trial status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trial status'
    });
  }
});

/**
 * POST /api/trinity-agents/health-check
 * Perform health check on all Trinity Agents and MCP infrastructure
 */
router.post('/health-check', requireAuth, async (req, res) => {
  try {
    // Check agent health
    const agentHealth = {
      oracle: await agents.oracle.healthCheck(),
      sentinel: await agents.sentinel.healthCheck(),
      sage: await agents.sage.healthCheck()
    };

    // Check MCP infrastructure health
    const mcpHealth = await mcpIntegration.performHealthCheck();

    const overallHealth = Object.values(agentHealth).every(health => health) &&
                         Object.values(mcpHealth).every(health => health);

    res.json({
      success: true,
      health: {
        overall: overallHealth ? 'healthy' : 'degraded',
        agents: agentHealth,
        infrastructure: mcpHealth,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      health: {
        overall: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/trinity-agents/:agentType/history
 * Get interaction history for a specific agent
 */
router.get('/:agentType/history',
  requireAuth,
  [
    param('agentType').isIn(['oracle', 'sentinel', 'sage']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    const { agentType } = req.params;
    const { organizationId } = req.user;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      const history = await prisma.ai_interactions.findMany({
        where: {
          organization_id: organizationId,
          agent_type: agentType
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: offset,
        take: limit,
        select: {
          id: true,
          interaction_type: true,
          confidence_score: true,
          processing_time_ms: true,
          success: true,
          roi_impact: true,
          created_at: true,
          metadata: true
        }
      });

      res.json({
        success: true,
        history,
        pagination: {
          limit,
          offset,
          total: history.length
        }
      });
    } catch (error) {
      logger.error('Failed to get interaction history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve interaction history'
      });
    }
  }
);

export default router;