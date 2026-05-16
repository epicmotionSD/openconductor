// Command Center API Routes
// Dashboard and control interface for the Board of Directors

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { AgentOrchestrator, createOrchestrator, getOrchestrator } from '../agents/orchestrator';
import { AgentService, AgentRole } from '../services/agent-service';

export function createCommandCenterRoutes(pool: Pool): Router {
  const router = Router();
  const agentService = new AgentService(pool);

  // ============================================
  // ORCHESTRATOR MANAGEMENT
  // ============================================

  // Initialize and start orchestrator
  router.post('/orchestrator/start', async (req: Request, res: Response) => {
    try {
      let orchestrator = getOrchestrator();

      if (!orchestrator) {
        orchestrator = createOrchestrator(pool, {
          autoStart: false,
          pollInterval: 5000,
          enableLogging: true
        });
        await orchestrator.initialize();
      }

      await orchestrator.startAll();

      res.json({
        success: true,
        message: 'Orchestrator started',
        status: await orchestrator.getStatus()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Stop orchestrator
  router.post('/orchestrator/stop', async (req: Request, res: Response) => {
    try {
      const orchestrator = getOrchestrator();

      if (!orchestrator) {
        return res.status(400).json({
          success: false,
          error: 'Orchestrator not initialized'
        });
      }

      await orchestrator.stopAll();

      res.json({
        success: true,
        message: 'Orchestrator stopped'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get orchestrator status
  router.get('/orchestrator/status', async (req: Request, res: Response) => {
    try {
      const orchestrator = getOrchestrator();

      if (!orchestrator) {
        return res.json({
          success: true,
          data: {
            isRunning: false,
            initialized: false,
            agents: []
          }
        });
      }

      const status = await orchestrator.getStatus();

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // INDIVIDUAL AGENT CONTROL
  // ============================================

  // Start specific agent
  router.post('/agents/:role/start', async (req: Request, res: Response) => {
    try {
      const { role } = req.params as { role: AgentRole };
      const orchestrator = getOrchestrator();

      if (!orchestrator) {
        return res.status(400).json({
          success: false,
          error: 'Orchestrator not initialized. Start orchestrator first.'
        });
      }

      await orchestrator.startAgent(role);

      res.json({
        success: true,
        message: `Agent ${role} started`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Stop specific agent
  router.post('/agents/:role/stop', async (req: Request, res: Response) => {
    try {
      const { role } = req.params as { role: AgentRole };
      const orchestrator = getOrchestrator();

      if (!orchestrator) {
        return res.status(400).json({
          success: false,
          error: 'Orchestrator not initialized'
        });
      }

      await orchestrator.stopAgent(role);

      res.json({
        success: true,
        message: `Agent ${role} stopped`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Pause specific agent
  router.post('/agents/:role/pause', async (req: Request, res: Response) => {
    try {
      const { role } = req.params as { role: AgentRole };
      const orchestrator = getOrchestrator();

      if (!orchestrator) {
        return res.status(400).json({
          success: false,
          error: 'Orchestrator not initialized'
        });
      }

      await orchestrator.pauseAgent(role);

      res.json({
        success: true,
        message: `Agent ${role} paused`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Resume specific agent
  router.post('/agents/:role/resume', async (req: Request, res: Response) => {
    try {
      const { role } = req.params as { role: AgentRole };
      const orchestrator = getOrchestrator();

      if (!orchestrator) {
        return res.status(400).json({
          success: false,
          error: 'Orchestrator not initialized'
        });
      }

      await orchestrator.resumeAgent(role);

      res.json({
        success: true,
        message: `Agent ${role} resumed`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // COMMAND CENTER DASHBOARD DATA
  // ============================================

  // Get full command center summary
  router.get('/summary', async (req: Request, res: Response) => {
    try {
      const orchestrator = getOrchestrator();

      if (orchestrator) {
        const summary = await orchestrator.getCommandCenterSummary();
        return res.json({
          success: true,
          data: summary
        });
      }

      // Fallback to database-only summary
      const dbSummary = await agentService.getCommandCenterSummary();
      const agents = await agentService.getAllAgents();
      const recentDecisions = await agentService.getRecentDecisions(10);

      res.json({
        success: true,
        data: {
          orchestrator: {
            isRunning: false,
            startedAt: null,
            agents: agents.map(a => ({
              role: a.role,
              name: a.name,
              status: a.status,
              metrics: a.metrics,
              lastActiveAt: a.lastActiveAt
            })),
            summary: {
              totalAgents: agents.length,
              activeAgents: dbSummary.activeAgents,
              idleAgents: agents.filter(a => a.status === 'idle').length,
              errorAgents: agents.filter(a => a.status === 'error').length,
              totalTasksCompleted: agents.reduce((sum, a) => sum + a.metrics.tasksCompleted, 0),
              totalTasksPending: dbSummary.pendingTasks
            }
          },
          recentDecisions,
          activeAlerts: [],
          pendingApprovals: []
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get board members (agents as board of directors)
  router.get('/board', async (req: Request, res: Response) => {
    try {
      const boardMembers = await agentService.getBoardMembers();

      res.json({
        success: true,
        data: boardMembers
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  // Create a new task
  router.post('/tasks', async (req: Request, res: Response) => {
    try {
      const { toRole, taskType, title, description, payload, priority } = req.body;
      const orchestrator = getOrchestrator();

      if (orchestrator) {
        await orchestrator.sendTaskToAgent(
          null,
          toRole,
          taskType,
          title,
          payload || {},
          { description, priority }
        );
      } else {
        // Create task directly via service
        const toAgent = await agentService.getAgentByRole(toRole);
        if (!toAgent) {
          return res.status(404).json({
            success: false,
            error: `Agent ${toRole} not found`
          });
        }

        await agentService.createTask({
          fromAgentId: null,
          toAgentId: toAgent.id,
          taskType,
          title,
          description,
          payload: payload || {},
          priority: priority || 'medium',
          status: 'pending'
        });
      }

      res.json({
        success: true,
        message: 'Task created'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get pending tasks
  router.get('/tasks/pending', async (req: Request, res: Response) => {
    try {
      const tasks = await agentService.getPendingTasks();

      res.json({
        success: true,
        data: tasks
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // DECISION MANAGEMENT
  // ============================================

  // Get pending decisions awaiting approval
  router.get('/decisions/pending', async (req: Request, res: Response) => {
    try {
      const decisions = await agentService.getPendingDecisions();

      res.json({
        success: true,
        data: decisions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get recent decisions
  router.get('/decisions/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const decisions = await agentService.getRecentDecisions(limit);

      res.json({
        success: true,
        data: decisions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Approve a decision
  router.post('/decisions/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const orchestrator = getOrchestrator();

      if (orchestrator) {
        await orchestrator.approveDecision(id, approvedBy || 'admin');
      } else {
        await agentService.approveDecision(id, approvedBy || 'admin');
      }

      res.json({
        success: true,
        message: 'Decision approved'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Reject a decision
  router.post('/decisions/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectedBy, reason } = req.body;
      const orchestrator = getOrchestrator();

      if (orchestrator) {
        await orchestrator.rejectDecision(id, rejectedBy || 'admin', reason || 'No reason provided');
      } else {
        await agentService.rejectDecision(id, rejectedBy || 'admin', reason || 'No reason provided');
      }

      res.json({
        success: true,
        message: 'Decision rejected'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // ALERTS
  // ============================================

  // Get active alerts
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const alerts = await agentService.getActiveAlerts();

      res.json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

export default createCommandCenterRoutes;
