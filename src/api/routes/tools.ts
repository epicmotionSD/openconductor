/**
 * OpenConductor Tool Management API Routes
 * 
 * REST endpoints for managing tools - register, execute, health checks
 */

import { Router, Request, Response } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
import { 
  asyncHandler, 
  NotFoundError, 
  ConflictError, 
  ToolExecutionError 
} from '../middleware/error-handler';
import { Tool, ToolExecutionResult } from '../../types/tools';
import { APIResponse } from '../../types/api';

/**
 * Create tool management routes
 */
export function createToolRoutes(
  conductor: OpenConductor,
  logger: Logger,
  errorManager: ErrorManager
): Router {
  const router = Router();

  /**
   * GET /tools - List all tools
   */
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, sort = 'name', order = 'asc', search, filter } = req.query;
    
    logger.debug('Listing tools', {
      page, limit, sort, order, search, filter,
      userId: req.user?.id
    });

    try {
      // Get all tools from tool registry
      const allTools = await conductor.tools.getAllTools();
      
      // Apply search filter
      let tools = allTools;
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        tools = allTools.filter(tool => 
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.description.toLowerCase().includes(searchTerm) ||
          tool.type.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply additional filters
      if (filter) {
        try {
          const filterObj = JSON.parse(filter as string);
          tools = tools.filter(tool => {
            return Object.entries(filterObj).every(([key, value]) => {
              if (key === 'type') return tool.type === value;
              if (key === 'status') return (tool as any).status === value;
              return true;
            });
          });
        } catch (error) {
          logger.warn('Invalid filter JSON:', filter);
        }
      }

      // Apply sorting
      tools.sort((a, b) => {
        let aValue = (a as any)[sort as string];
        let bValue = (b as any)[sort as string];
        
        if (order === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      const paginatedTools = tools.slice(offset, offset + limitNum);
      
      const total = tools.length;
      const totalPages = Math.ceil(total / limitNum);

      const response: APIResponse<Tool[]> = {
        success: true,
        data: paginatedTools,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrevious: pageNum > 1
        }
      };

      logger.info('Tools listed successfully', {
        count: paginatedTools.length,
        total,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to list tools:', error);
      throw error;
    }
  }));

  /**
   * GET /tools/:id - Get specific tool
   */
  router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Getting tool', { toolId: id, userId: req.user?.id });

    try {
      const tool = await conductor.tools.getTool(id);
      
      if (!tool) {
        throw new NotFoundError('Tool', id);
      }

      const response: APIResponse<Tool> = {
        success: true,
        data: tool,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Tool retrieved successfully', {
        toolId: id,
        toolName: tool.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get tool:', error);
      throw error;
    }
  }));

  /**
   * POST /tools - Register new tool
   */
  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const toolData = req.body as Tool;
    
    logger.debug('Registering tool', { 
      toolName: toolData.name,
      toolType: toolData.type,
      userId: req.user?.id 
    });

    try {
      // Check if tool with same name already exists
      const existingTool = await conductor.tools.getTool(toolData.id || toolData.name);
      if (existingTool) {
        throw new ConflictError(`Tool with name '${toolData.name}' already exists`);
      }

      // Add metadata
      const tool: Tool = {
        ...toolData,
        id: toolData.id || generateToolId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          createdBy: req.user?.id,
          executionCount: 0,
          successRate: 0,
          lastUsed: null
        }
      };

      // Register tool with conductor
      await conductor.registerTool(tool);

      const response: APIResponse<Tool> = {
        success: true,
        data: tool,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Tool registered successfully', {
        toolId: tool.id,
        toolName: tool.name,
        toolType: tool.type,
        userId: req.user?.id
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to register tool:', error);
      throw error;
    }
  }));

  /**
   * PUT /tools/:id - Update tool
   */
  router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    
    logger.debug('Updating tool', { toolId: id, updates, userId: req.user?.id });

    try {
      const tool = await conductor.tools.getTool(id);
      
      if (!tool) {
        throw new NotFoundError('Tool', id);
      }

      // Apply updates
      const updatedTool = {
        ...tool,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      // Update tool in conductor
      await conductor.tools.updateTool(id, updatedTool);

      const response: APIResponse<Tool> = {
        success: true,
        data: updatedTool,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Tool updated successfully', {
        toolId: id,
        toolName: updatedTool.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to update tool:', error);
      throw error;
    }
  }));

  /**
   * DELETE /tools/:id - Unregister tool
   */
  router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Unregistering tool', { toolId: id, userId: req.user?.id });

    try {
      const tool = await conductor.tools.getTool(id);
      
      if (!tool) {
        throw new NotFoundError('Tool', id);
      }

      // Unregister tool
      await conductor.tools.unregisterTool(id);

      const response: APIResponse<void> = {
        success: true,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Tool unregistered successfully', {
        toolId: id,
        toolName: tool.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to unregister tool:', error);
      throw error;
    }
  }));

  /**
   * POST /tools/:id/execute - Execute tool operation
   */
  router.post('/:id/execute', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { operation, parameters = {}, options = {} } = req.body;
    
    logger.debug('Executing tool', { 
      toolId: id, 
      operation,
      hasParameters: Object.keys(parameters).length > 0,
      options,
      userId: req.user?.id 
    });

    try {
      const tool = await conductor.tools.getTool(id);
      
      if (!tool) {
        throw new NotFoundError('Tool', id);
      }

      // Validate operation exists
      const operationConfig = tool.config.operations.find(op => op.name === operation);
      if (!operationConfig) {
        throw new ToolExecutionError(`Operation '${operation}' not found in tool '${tool.name}'`);
      }

      // Execute tool operation
      const startTime = Date.now();
      const result = await conductor.tools.executeTool(id, operation, parameters);
      const duration = Date.now() - startTime;

      // Update tool metadata
      if (tool.metadata) {
        tool.metadata.lastUsed = new Date();
        tool.metadata.executionCount = (tool.metadata.executionCount || 0) + 1;
      }

      const executionResult: ToolExecutionResult = {
        success: true,
        output: result,
        executionTime: duration,
        timestamp: new Date(),
        toolId: id,
        operation,
        parameters
      };

      const response: APIResponse<ToolExecutionResult> = {
        success: true,
        data: executionResult,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId,
          executionTime: duration
        }
      };

      logger.info('Tool executed successfully', {
        toolId: id,
        toolName: tool.name,
        operation,
        duration: `${duration}ms`,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to execute tool:', error);
      
      // Update tool metadata for failed execution
      try {
        const tool = await conductor.tools.getTool(id);
        if (tool?.metadata) {
          tool.metadata.lastUsed = new Date();
          tool.metadata.executionCount = (tool.metadata.executionCount || 0) + 1;
        }
      } catch (metadataError) {
        logger.warn('Failed to update tool metadata after error:', metadataError);
      }
      
      throw new ToolExecutionError(error.message, { originalError: error.message });
    }
  }));

  /**
   * GET /tools/:id/health - Get tool health status
   */
  router.get('/:id/health', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Getting tool health', { toolId: id, userId: req.user?.id });

    try {
      const tool = await conductor.tools.getTool(id);
      
      if (!tool) {
        throw new NotFoundError('Tool', id);
      }

      // Perform health check
      const healthStatus = await conductor.tools.getHealthStatus(id);

      const response: APIResponse<any> = {
        success: true,
        data: healthStatus,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Tool health checked successfully', {
        toolId: id,
        toolName: tool.name,
        status: healthStatus.status,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get tool health:', error);
      throw error;
    }
  }));

  /**
   * POST /tools/:id/test - Test tool connection
   */
  router.post('/:id/test', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Testing tool connection', { toolId: id, userId: req.user?.id });

    try {
      const tool = await conductor.tools.getTool(id);
      
      if (!tool) {
        throw new NotFoundError('Tool', id);
      }

      // Perform connection test
      const startTime = Date.now();
      const testResult = await conductor.tools.testTool(id);
      const duration = Date.now() - startTime;

      const response: APIResponse<any> = {
        success: true,
        data: {
          ...testResult,
          duration: `${duration}ms`,
          timestamp: new Date()
        },
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId,
          executionTime: duration
        }
      };

      logger.info('Tool connection tested successfully', {
        toolId: id,
        toolName: tool.name,
        success: testResult.success,
        duration: `${duration}ms`,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to test tool connection:', error);
      throw error;
    }
  }));

  /**
   * GET /tools/:id/metrics - Get tool metrics
   */
  router.get('/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Getting tool metrics', { toolId: id, userId: req.user?.id });

    try {
      const tool = await conductor.tools.getTool(id);
      
      if (!tool) {
        throw new NotFoundError('Tool', id);
      }

      const metrics = {
        executionCount: tool.metadata?.executionCount || 0,
        successRate: tool.metadata?.successRate || 0,
        lastUsed: tool.metadata?.lastUsed,
        averageLatency: calculateAverageLatency(tool),
        errorRate: calculateErrorRate(tool),
        operations: tool.config.operations.map(op => ({
          name: op.name,
          description: op.description,
          executionCount: 0, // TODO: Track per-operation metrics
          successRate: 0
        })),
        healthStatus: await conductor.tools.getHealthStatus(id)
      };

      const response: APIResponse<any> = {
        success: true,
        data: metrics,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Tool metrics retrieved successfully', {
        toolId: id,
        toolName: tool.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get tool metrics:', error);
      throw error;
    }
  }));

  return router;
}

/**
 * Generate unique tool ID
 */
function generateToolId(): string {
  return `tool_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

/**
 * Calculate average latency (stub implementation)
 */
function calculateAverageLatency(tool: Tool): number {
  // TODO: Implement actual latency calculation
  return Math.random() * 500 + 50; // Mock ms
}

/**
 * Calculate error rate (stub implementation)
 */
function calculateErrorRate(tool: Tool): number {
  // TODO: Implement actual error rate calculation
  return Math.random() * 5; // Mock percentage
}