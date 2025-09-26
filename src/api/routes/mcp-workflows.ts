/**
 * OpenConductor MCP Workflow API Routes
 * 
 * REST endpoints for MCP workflow management - create, execute, monitor workflows
 * Following the established OpenConductor API patterns
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
import { EventBus } from '../../types/events';
import { 
  asyncHandler, 
  NotFoundError, 
  ConflictError,
  ValidationError,
  UnauthorizedError
} from '../middleware/error-handler';
import { APIResponse } from '../../types/api';

export interface MCPWorkflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  definition: any; // DAG structure
  version: number;
  is_template: boolean;
  is_public: boolean;
  template_id?: string;
  timeout_seconds: number;
  retry_policy: any;
  execution_count: number;
  success_count: number;
  avg_execution_time_ms: number;
  last_executed?: Date;
  star_count: number;
  fork_count: number;
  download_count: number;
  status: 'draft' | 'published' | 'archived';
  metadata: any;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface MCPWorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  trigger_type: 'manual' | 'scheduled' | 'webhook' | 'api';
  input_data?: any;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  current_step: number;
  total_steps: number;
  output_data?: any;
  error_message?: string;
  execution_log: any[];
  started_at: Date;
  completed_at?: Date;
  execution_time_ms?: number;
  tokens_consumed: number;
  api_calls_made: number;
  servers_used: string[];
  cost_usd: number;
  metadata: any;
}

/**
 * Create MCP workflow management routes
 */
export function createMCPWorkflowRoutes(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): Router {
  const router = Router();

  /**
   * GET /mcp/workflows - List user workflows
   */
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'updated_at', 
      order = 'desc',
      search,
      status,
      is_public,
      is_template,
      tags
    } = req.query;

    const userId = req.user?.id;

    logger.debug('Listing MCP workflows', {
      page, limit, search, status, userId
    });

    try {
      let baseQuery = `
        FROM mcp_workflows w
        LEFT JOIN users u ON w.user_id = u.id
        WHERE 1=1
      `;
      
      const conditions = [];
      const values = [];
      let paramCount = 1;

      // User-specific or public workflows
      if (userId) {
        conditions.push(`(w.user_id = $${paramCount} OR w.is_public = true)`);
        values.push(userId);
        paramCount++;
      } else {
        conditions.push('w.is_public = true');
      }

      // Search filter
      if (search) {
        conditions.push(`(
          w.name ILIKE $${paramCount} OR 
          w.description ILIKE $${paramCount}
        )`);
        values.push(`%${search}%`);
        paramCount++;
      }

      // Status filter
      if (status) {
        conditions.push(`w.status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      // Public filter
      if (is_public !== undefined) {
        conditions.push(`w.is_public = $${paramCount}`);
        values.push(is_public === 'true');
        paramCount++;
      }

      // Template filter
      if (is_template !== undefined) {
        conditions.push(`w.is_template = $${paramCount}`);
        values.push(is_template === 'true');
        paramCount++;
      }

      // Tags filter
      if (tags) {
        const tagList = (tags as string).split(',');
        conditions.push(`w.tags && $${paramCount}`);
        values.push(tagList);
        paramCount++;
      }

      if (conditions.length > 0) {
        baseQuery += ` AND ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
      const countResult = await pool.query(countQuery, values);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build main query with sorting
      let orderBy = 'ORDER BY ';
      switch (sort) {
        case 'name':
          orderBy += `w.name ${order}`;
          break;
        case 'created_at':
          orderBy += `w.created_at ${order}`;
          break;
        case 'execution_count':
          orderBy += `w.execution_count ${order}`;
          break;
        case 'star_count':
          orderBy += `w.star_count ${order}`;
          break;
        default:
          orderBy += `w.updated_at ${order}`;
      }

      const mainQuery = `
        SELECT w.*, u.name as author_name
        ${baseQuery}
        ${orderBy}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

      const result = await pool.query(mainQuery, values);
      const workflows = result.rows.map(row => mapWorkflowFromDB(row));

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const totalPages = Math.ceil(totalCount / limitNum);

      const response: APIResponse<MCPWorkflow[]> = {
        success: true,
        data: workflows,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrevious: pageNum > 1
        }
      };

      logger.info('MCP workflows listed successfully', {
        count: workflows.length,
        total: totalCount,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to list MCP workflows:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/workflows/:id - Get specific workflow
   */
  router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    logger.debug('Getting MCP workflow', { workflowId: id, userId });

    try {
      const query = `
        SELECT w.*, u.name as author_name
        FROM mcp_workflows w
        LEFT JOIN users u ON w.user_id = u.id
        WHERE w.id = $1 AND (w.user_id = $2 OR w.is_public = true)
      `;

      const result = await pool.query(query, [id, userId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('MCP Workflow', id);
      }

      const workflow = mapWorkflowFromDB(result.rows[0]);

      const response: APIResponse<MCPWorkflow> = {
        success: true,
        data: workflow,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP workflow retrieved successfully', {
        workflowId: id,
        workflowName: workflow.name,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get MCP workflow:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/workflows - Create new workflow
   */
  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const workflowData = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new UnauthorizedError('Authentication required to create workflows');
    }

    logger.debug('Creating MCP workflow', { 
      workflowName: workflowData.name,
      userId 
    });

    try {
      // Validate required fields
      if (!workflowData.name || !workflowData.definition) {
        throw new ValidationError('Missing required fields: name, definition');
      }

      // Validate workflow definition structure
      if (!workflowData.definition.nodes || !Array.isArray(workflowData.definition.nodes)) {
        throw new ValidationError('Workflow definition must include nodes array');
      }

      const query = `
        INSERT INTO mcp_workflows (
          user_id, name, description, definition, is_template, is_public,
          timeout_seconds, retry_policy, status, metadata, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        userId,
        workflowData.name,
        workflowData.description,
        JSON.stringify(workflowData.definition),
        workflowData.is_template || false,
        workflowData.is_public || false,
        workflowData.timeout_seconds || 300,
        JSON.stringify(workflowData.retry_policy || { max_retries: 3, backoff: 'exponential' }),
        workflowData.status || 'draft',
        JSON.stringify(workflowData.metadata || {}),
        workflowData.tags || []
      ];

      const result = await pool.query(query, values);
      const workflow = mapWorkflowFromDB(result.rows[0]);

      // Emit workflow creation event
      await eventBus.emit({
        type: 'mcp.workflow.created',
        timestamp: new Date(),
        data: {
          workflowId: workflow.id,
          name: workflow.name,
          userId
        }
      });

      const response: APIResponse<MCPWorkflow> = {
        success: true,
        data: workflow,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP workflow created successfully', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        userId
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create MCP workflow:', error);
      throw error;
    }
  }));

  /**
   * PUT /mcp/workflows/:id - Update workflow
   */
  router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.id;
    
    logger.debug('Updating MCP workflow', { workflowId: id, updates, userId });

    try {
      // Check ownership
      const existingQuery = 'SELECT user_id FROM mcp_workflows WHERE id = $1';
      const existingResult = await pool.query(existingQuery, [id]);
      
      if (existingResult.rows.length === 0) {
        throw new NotFoundError('MCP Workflow', id);
      }

      if (existingResult.rows[0].user_id !== userId) {
        throw new UnauthorizedError('Not authorized to update this workflow');
      }

      // Build dynamic update query
      const fields = [];
      const values = [];
      let paramCount = 1;

      const updateableFields = [
        'name', 'description', 'definition', 'is_template', 'is_public',
        'timeout_seconds', 'retry_policy', 'status', 'metadata', 'tags'
      ];

      for (const field of updateableFields) {
        if (updates.hasOwnProperty(field)) {
          fields.push(`${field} = $${paramCount}`);
          
          if (field === 'definition' || field === 'retry_policy' || field === 'metadata') {
            values.push(JSON.stringify(updates[field]));
          } else {
            values.push(updates[field]);
          }
          paramCount++;
        }
      }

      if (fields.length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      fields.push('updated_at = NOW()');
      fields.push('version = version + 1');
      values.push(id);

      const query = `
        UPDATE mcp_workflows 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      const workflow = mapWorkflowFromDB(result.rows[0]);

      // Emit update event
      await eventBus.emit({
        type: 'mcp.workflow.updated',
        timestamp: new Date(),
        data: {
          workflowId: id,
          name: workflow.name,
          updates: Object.keys(updates),
          userId
        }
      });

      const response: APIResponse<MCPWorkflow> = {
        success: true,
        data: workflow,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP workflow updated successfully', {
        workflowId: id,
        workflowName: workflow.name,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to update MCP workflow:', error);
      throw error;
    }
  }));

  /**
   * DELETE /mcp/workflows/:id - Delete workflow
   */
  router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    logger.debug('Deleting MCP workflow', { workflowId: id, userId });

    try {
      // Check ownership
      const existingQuery = 'SELECT user_id, name FROM mcp_workflows WHERE id = $1';
      const existingResult = await pool.query(existingQuery, [id]);
      
      if (existingResult.rows.length === 0) {
        throw new NotFoundError('MCP Workflow', id);
      }

      if (existingResult.rows[0].user_id !== userId) {
        throw new UnauthorizedError('Not authorized to delete this workflow');
      }

      const workflowName = existingResult.rows[0].name;

      await pool.query('DELETE FROM mcp_workflows WHERE id = $1', [id]);

      // Emit deletion event
      await eventBus.emit({
        type: 'mcp.workflow.deleted',
        timestamp: new Date(),
        data: {
          workflowId: id,
          name: workflowName,
          userId
        }
      });

      const response: APIResponse<void> = {
        success: true,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP workflow deleted successfully', {
        workflowId: id,
        workflowName,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to delete MCP workflow:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/workflows/:id/execute - Execute workflow
   */
  router.post('/:id/execute', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { input_data, trigger_type = 'manual' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required to execute workflows');
    }

    logger.debug('Executing MCP workflow', { 
      workflowId: id, 
      triggerType: trigger_type,
      hasInput: !!input_data,
      userId 
    });

    try {
      // Get workflow
      const workflowQuery = `
        SELECT * FROM mcp_workflows 
        WHERE id = $1 AND (user_id = $2 OR is_public = true)
      `;
      const workflowResult = await pool.query(workflowQuery, [id, userId]);
      
      if (workflowResult.rows.length === 0) {
        throw new NotFoundError('MCP Workflow', id);
      }

      const workflow = mapWorkflowFromDB(workflowResult.rows[0]);

      // Create execution record
      const executionQuery = `
        INSERT INTO mcp_workflow_executions (
          workflow_id, user_id, trigger_type, input_data, 
          status, total_steps, metadata
        ) VALUES ($1, $2, $3, $4, 'queued', $5, $6)
        RETURNING *
      `;

      const totalSteps = workflow.definition.nodes ? workflow.definition.nodes.length : 0;

      const executionResult = await pool.query(executionQuery, [
        id,
        userId,
        trigger_type,
        input_data ? JSON.stringify(input_data) : null,
        totalSteps,
        JSON.stringify({
          workflow_name: workflow.name,
          workflow_version: workflow.version
        })
      ]);

      const execution = mapExecutionFromDB(executionResult.rows[0]);

      // Update workflow execution count
      await pool.query(
        'UPDATE mcp_workflows SET execution_count = execution_count + 1, last_executed = NOW() WHERE id = $1',
        [id]
      );

      // Emit execution started event
      await eventBus.emit({
        type: 'mcp.workflow.execution.started',
        timestamp: new Date(),
        data: {
          workflowId: id,
          executionId: execution.id,
          userId
        }
      });

      const response: APIResponse<MCPWorkflowExecution> = {
        success: true,
        data: execution,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('MCP workflow execution started', {
        workflowId: id,
        executionId: execution.id,
        workflowName: workflow.name,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to execute MCP workflow:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/workflows/executions - List workflow executions
   */
  router.get('/executions', asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 20,
      workflow_id,
      status,
      sort = 'started_at',
      order = 'desc'
    } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    logger.debug('Listing workflow executions', {
      workflowId: workflow_id, status, userId
    });

    try {
      let baseQuery = `
        FROM mcp_workflow_executions e
        JOIN mcp_workflows w ON e.workflow_id = w.id
        WHERE e.user_id = $1
      `;
      
      const conditions = [];
      const values = [userId];
      let paramCount = 2;

      if (workflow_id) {
        conditions.push(`e.workflow_id = $${paramCount}`);
        values.push(workflow_id);
        paramCount++;
      }

      if (status) {
        conditions.push(`e.status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (conditions.length > 0) {
        baseQuery += ` AND ${conditions.join(' AND ')}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
      const countResult = await pool.query(countQuery, values);
      const totalCount = parseInt(countResult.rows[0].count);

      // Main query with sorting
      const mainQuery = `
        SELECT e.*, w.name as workflow_name
        ${baseQuery}
        ORDER BY e.${sort} ${order}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

      const result = await pool.query(mainQuery, values);
      const executions = result.rows.map(row => ({
        ...mapExecutionFromDB(row),
        workflow_name: row.workflow_name
      }));

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const totalPages = Math.ceil(totalCount / limitNum);

      const response: APIResponse<any> = {
        success: true,
        data: executions,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrevious: pageNum > 1
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to list workflow executions:', error);
      throw error;
    }
  }));

  /**
   * GET /mcp/workflows/executions/:executionId - Get execution details
   */
  router.get('/executions/:executionId', asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    logger.debug('Getting workflow execution', { executionId, userId });

    try {
      const query = `
        SELECT e.*, w.name as workflow_name
        FROM mcp_workflow_executions e
        JOIN mcp_workflows w ON e.workflow_id = w.id
        WHERE e.id = $1 AND e.user_id = $2
      `;

      const result = await pool.query(query, [executionId, userId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Workflow Execution', executionId);
      }

      const execution = {
        ...mapExecutionFromDB(result.rows[0]),
        workflow_name: result.rows[0].workflow_name
      };

      const response: APIResponse<any> = {
        success: true,
        data: execution,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get workflow execution:', error);
      throw error;
    }
  }));

  /**
   * POST /mcp/workflows/:id/star - Star/unstar workflow
   */
  router.post('/:id/star', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { starred = true } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    logger.debug('Starring/unstarring workflow', { 
      workflowId: id, 
      starred,
      userId 
    });

    try {
      if (starred) {
        await pool.query(`
          INSERT INTO workflow_stars (user_id, workflow_id) 
          VALUES ($1, $2) 
          ON CONFLICT (user_id, workflow_id) DO NOTHING
        `, [userId, id]);
      } else {
        await pool.query(
          'DELETE FROM workflow_stars WHERE user_id = $1 AND workflow_id = $2',
          [userId, id]
        );
      }

      // Get updated star count
      const result = await pool.query(
        'SELECT star_count FROM mcp_workflows WHERE id = $1',
        [id]
      );

      const starCount = result.rows[0]?.star_count || 0;

      const response: APIResponse<any> = {
        success: true,
        data: {
          workflow_id: id,
          starred,
          star_count: starCount
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Workflow star updated successfully', {
        workflowId: id,
        starred,
        starCount,
        userId
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to update workflow star:', error);
      throw error;
    }
  }));

  return router;
}

/**
 * Map database row to MCPWorkflow object
 */
function mapWorkflowFromDB(row: any): MCPWorkflow {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    definition: row.definition,
    version: parseInt(row.version) || 1,
    is_template: row.is_template,
    is_public: row.is_public,
    template_id: row.template_id,
    timeout_seconds: parseInt(row.timeout_seconds) || 300,
    retry_policy: row.retry_policy,
    execution_count: parseInt(row.execution_count) || 0,
    success_count: parseInt(row.success_count) || 0,
    avg_execution_time_ms: parseInt(row.avg_execution_time_ms) || 0,
    last_executed: row.last_executed,
    star_count: parseInt(row.star_count) || 0,
    fork_count: parseInt(row.fork_count) || 0,
    download_count: parseInt(row.download_count) || 0,
    status: row.status,
    metadata: row.metadata,
    tags: row.tags || [],
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Map database row to MCPWorkflowExecution object
 */
function mapExecutionFromDB(row: any): MCPWorkflowExecution {
  return {
    id: row.id,
    workflow_id: row.workflow_id,
    user_id: row.user_id,
    trigger_type: row.trigger_type,
    input_data: row.input_data,
    status: row.status,
    current_step: parseInt(row.current_step) || 0,
    total_steps: parseInt(row.total_steps) || 0,
    output_data: row.output_data,
    error_message: row.error_message,
    execution_log: row.execution_log || [],
    started_at: row.started_at,
    completed_at: row.completed_at,
    execution_time_ms: parseInt(row.execution_time_ms) || 0,
    tokens_consumed: parseInt(row.tokens_consumed) || 0,
    api_calls_made: parseInt(row.api_calls_made) || 0,
    servers_used: row.servers_used || [],
    cost_usd: parseFloat(row.cost_usd) || 0,
    metadata: row.metadata || {}
  };
}