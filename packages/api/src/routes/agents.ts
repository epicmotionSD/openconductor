// Agent API Routes - Board of Directors Command Center
// Endpoints for agent management, tasks, and decisions

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { AgentService, Agent, AgentTask, AgentDecision } from '../services/agent-service';
import { createAgent, BOARD_MEMBERS, AgentType, BaseAgent } from '../agents';

const router = Router();

// Store active agent instances
const activeAgents: Map<string, BaseAgent> = new Map();

// Middleware to inject AgentService
function withAgentService(pool: Pool) {
  return (req: Request, res: Response, next: Function) => {
    (req as any).agentService = new AgentService(pool);
    next();
  };
}

// Initialize routes with database pool
export function createAgentRoutes(pool: Pool): Router {
  router.use(withAgentService(pool));

  // ============================================
  // BOARD OF DIRECTORS ENDPOINTS
  // ============================================

  /**
   * GET /agents/board
   * Get all board members (CEO, CTO, CMO, CFO)
   */
  router.get('/board', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const board = await agentService.getBoardMembers();

      res.json({
        success: true,
        data: { board }
      });
    } catch (error: any) {
      console.error('Error fetching board:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /agents/command-center
   * Get full command center dashboard data
   */
  router.get('/command-center', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;

      const [board, summary, recentDecisions, pendingDecisions] = await Promise.all([
        agentService.getBoardMembers(),
        agentService.getCommandCenterSummary(),
        agentService.getRecentDecisions(10),
        agentService.getPendingDecisions()
      ]);

      res.json({
        success: true,
        data: {
          board,
          summary,
          recentDecisions,
          pendingDecisions
        }
      });
    } catch (error: any) {
      console.error('Error fetching command center:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // AGENT MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * GET /agents
   * List all agents
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const agents = await agentService.getAllAgents();

      res.json({
        success: true,
        data: { agents }
      });
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /agents/:id
   * Get agent by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const agent = await agentService.getAgentById(req.params.id);

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agent not found' }
        });
      }

      res.json({
        success: true,
        data: { agent }
      });
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /agents/:id/start
   * Start an agent
   */
  router.post('/:id/start', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const agent = await agentService.getAgentById(req.params.id);

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agent not found' }
        });
      }

      // Check if agent is already running
      if (activeAgents.has(agent.id)) {
        return res.json({
          success: true,
          data: { message: 'Agent already running', status: 'active' }
        });
      }

      // Create and start the agent instance
      const agentInstance = createAgent(agent.role as AgentType, agentService);
      await agentInstance.start();
      activeAgents.set(agent.id, agentInstance);

      res.json({
        success: true,
        data: {
          message: `Agent ${agent.name} started`,
          status: 'active'
        }
      });
    } catch (error: any) {
      console.error('Error starting agent:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /agents/:id/stop
   * Stop an agent
   */
  router.post('/:id/stop', async (req: Request, res: Response) => {
    try {
      const agentInstance = activeAgents.get(req.params.id);

      if (!agentInstance) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agent not running' }
        });
      }

      await agentInstance.stop();
      activeAgents.delete(req.params.id);

      res.json({
        success: true,
        data: { message: 'Agent stopped', status: 'idle' }
      });
    } catch (error: any) {
      console.error('Error stopping agent:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /agents/:id/pause
   * Pause an agent
   */
  router.post('/:id/pause', async (req: Request, res: Response) => {
    try {
      const agentInstance = activeAgents.get(req.params.id);

      if (!agentInstance) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agent not running' }
        });
      }

      await agentInstance.pause();

      res.json({
        success: true,
        data: { message: 'Agent paused', status: 'paused' }
      });
    } catch (error: any) {
      console.error('Error pausing agent:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /agents/:id/resume
   * Resume a paused agent
   */
  router.post('/:id/resume', async (req: Request, res: Response) => {
    try {
      const agentInstance = activeAgents.get(req.params.id);

      if (!agentInstance) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agent not running' }
        });
      }

      await agentInstance.resume();

      res.json({
        success: true,
        data: { message: 'Agent resumed', status: 'active' }
      });
    } catch (error: any) {
      console.error('Error resuming agent:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // TASK ENDPOINTS
  // ============================================

  /**
   * GET /agents/tasks/pending
   * Get all pending tasks
   */
  router.get('/tasks/pending', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const tasks = await agentService.getPendingTasks();

      res.json({
        success: true,
        data: { tasks }
      });
    } catch (error: any) {
      console.error('Error fetching pending tasks:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /agents/:id/tasks
   * Get tasks for a specific agent
   */
  router.get('/:id/tasks', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const status = req.query.status as any;
      const tasks = await agentService.getTasksForAgent(req.params.id, status);

      res.json({
        success: true,
        data: { tasks }
      });
    } catch (error: any) {
      console.error('Error fetching agent tasks:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /agents/tasks
   * Create a new task
   */
  router.post('/tasks', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const task = await agentService.createTask(req.body);

      res.status(201).json({
        success: true,
        data: { task }
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // DECISION ENDPOINTS
  // ============================================

  /**
   * GET /agents/decisions
   * Get recent decisions
   */
  router.get('/decisions', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const limit = parseInt(req.query.limit as string) || 20;
      const decisions = await agentService.getRecentDecisions(limit);

      res.json({
        success: true,
        data: { decisions }
      });
    } catch (error: any) {
      console.error('Error fetching decisions:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /agents/decisions/pending
   * Get pending decisions (awaiting approval)
   */
  router.get('/decisions/pending', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const decisions = await agentService.getPendingDecisions();

      res.json({
        success: true,
        data: { decisions }
      });
    } catch (error: any) {
      console.error('Error fetching pending decisions:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /agents/decisions/:id/approve
   * Approve a decision
   */
  router.post('/decisions/:id/approve', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const approvedBy = req.body.approvedBy || 'human';

      await agentService.approveDecision(req.params.id, approvedBy);

      res.json({
        success: true,
        data: { message: 'Decision approved' }
      });
    } catch (error: any) {
      console.error('Error approving decision:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * POST /agents/board/start-all
   * Start all board members
   */
  router.post('/board/start-all', async (req: Request, res: Response) => {
    try {
      const agentService = (req as any).agentService as AgentService;
      const results: { role: string; status: string }[] = [];

      for (const role of BOARD_MEMBERS) {
        try {
          const agent = await agentService.getAgentByRole(role);
          if (agent && !activeAgents.has(agent.id)) {
            const agentInstance = createAgent(role, agentService);
            await agentInstance.start();
            activeAgents.set(agent.id, agentInstance);
            results.push({ role, status: 'started' });
          } else if (agent) {
            results.push({ role, status: 'already_running' });
          }
        } catch (err: any) {
          results.push({ role, status: `error: ${err.message}` });
        }
      }

      res.json({
        success: true,
        data: { results }
      });
    } catch (error: any) {
      console.error('Error starting all agents:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /agents/board/stop-all
   * Stop all board members
   */
  router.post('/board/stop-all', async (req: Request, res: Response) => {
    try {
      const results: { id: string; status: string }[] = [];

      for (const [id, agent] of activeAgents) {
        try {
          await agent.stop();
          activeAgents.delete(id);
          results.push({ id, status: 'stopped' });
        } catch (err: any) {
          results.push({ id, status: `error: ${err.message}` });
        }
      }

      res.json({
        success: true,
        data: { results }
      });
    } catch (error: any) {
      console.error('Error stopping all agents:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  return router;
}

export default createAgentRoutes;
