/**
 * ToolRegistry Implementation
 * 
 * Registry for managing tools and integrations
 */

import { 
  Tool, 
  ToolConfig, 
  ToolCategory, 
  ToolStatus,
  ToolExecution,
  ToolExecutionResult,
  ToolMetadata
} from '../types/tools';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private categories: Map<ToolCategory, string[]> = new Map();
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;

  constructor(
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    this.initializeCategories();
  }

  /**
   * Register a new tool
   */
  async registerTool(tool: Tool, config?: ToolConfig): Promise<void> {
    this.logger.info(`Registering tool: ${tool.id}`, { category: tool.category });

    // Validate tool
    this.validateTool(tool);

    // Check for duplicates
    if (this.tools.has(tool.id)) {
      throw this.errorManager.createError(
        'TOOL_ALREADY_EXISTS',
        `Tool ${tool.id} is already registered`,
        'system',
        'medium'
      );
    }

    // Create registered tool instance
    const registeredTool: RegisteredTool = {
      tool,
      config: config || this.getDefaultConfig(tool),
      status: 'registered',
      registeredAt: new Date(),
      lastUsed: null,
      executionCount: 0,
      errorCount: 0,
      averageExecutionTime: 0
    };

    // Initialize tool if needed
    if (tool.initialize) {
      try {
        await tool.initialize(registeredTool.config);
        registeredTool.status = 'ready';
      } catch (error) {
        registeredTool.status = 'error';
        const toolError = this.errorManager.createError(
          'TOOL_INITIALIZATION_FAILED',
          `Failed to initialize tool ${tool.id}: ${error instanceof Error ? error.message : String(error)}`,
          'system',
          'high',
          { toolId: tool.id },
          error instanceof Error ? error : undefined
        );
        this.errorManager.handleError(toolError);
        throw toolError;
      }
    } else {
      registeredTool.status = 'ready';
    }

    // Store tool
    this.tools.set(tool.id, registeredTool);
    
    // Add to category index
    this.addToCategory(tool.category, tool.id);

    this.logger.info(`Tool registered successfully: ${tool.id}`);
  }

  /**
   * Unregister a tool
   */
  async unregisterTool(toolId: string): Promise<void> {
    this.logger.info(`Unregistering tool: ${toolId}`);

    const registeredTool = this.tools.get(toolId);
    if (!registeredTool) {
      throw this.errorManager.createError(
        'TOOL_NOT_FOUND',
        `Tool ${toolId} not found`,
        'system',
        'low'
      );
    }

    // Cleanup tool if needed
    if (registeredTool.tool.cleanup) {
      try {
        await registeredTool.tool.cleanup();
      } catch (error) {
        this.logger.warn(`Tool cleanup failed: ${toolId}`, error);
      }
    }

    // Remove from registry
    this.tools.delete(toolId);
    
    // Remove from category index
    this.removeFromCategory(registeredTool.tool.category, toolId);

    this.logger.info(`Tool unregistered successfully: ${toolId}`);
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolId: string, 
    input: any, 
    context?: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const registeredTool = this.tools.get(toolId);
    if (!registeredTool) {
      throw this.errorManager.createError(
        'TOOL_NOT_FOUND',
        `Tool ${toolId} not found`,
        'system',
        'medium'
      );
    }

    if (registeredTool.status !== 'ready') {
      throw this.errorManager.createError(
        'TOOL_NOT_READY',
        `Tool ${toolId} is not ready (status: ${registeredTool.status})`,
        'system',
        'medium'
      );
    }

    const execution: ToolExecution = {
      id: this.generateExecutionId(),
      toolId,
      input,
      context: context || {},
      startTime: new Date(),
      status: 'running'
    };

    this.logger.debug(`Executing tool: ${toolId}`, { 
      executionId: execution.id,
      input 
    });

    try {
      const startTime = Date.now();
      
      // Execute tool
      const output = await registeredTool.tool.execute(input, execution.context);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Update execution
      execution.endTime = new Date();
      execution.status = 'completed';
      execution.output = output;
      execution.executionTime = executionTime;

      // Update tool metrics
      registeredTool.executionCount++;
      registeredTool.lastUsed = new Date();
      registeredTool.averageExecutionTime = 
        (registeredTool.averageExecutionTime + executionTime) / 2;

      const result: ToolExecutionResult = {
        success: true,
        data: output,
        executionTime,
        timestamp: execution.endTime!,
        metadata: {
          toolId,
          executionId: execution.id,
          timestamp: execution.endTime!
        }
      };

      this.logger.debug(`Tool executed successfully: ${toolId}`, {
        executionId: execution.id,
        executionTime,
        output
      });

      return result;

    } catch (error) {
      const endTime = Date.now();
      const executionTime = Date.now() - execution.startTime.getTime();

      // Update execution
      execution.endTime = new Date();
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.executionTime = executionTime;

      // Update tool metrics
      registeredTool.errorCount++;

      const toolError = this.errorManager.createError(
        'TOOL_EXECUTION_FAILED',
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        'system',
        'medium',
        { toolId, executionId: execution.id },
        error instanceof Error ? error : undefined
      );

      this.errorManager.handleError(toolError);

      const result: ToolExecutionResult = {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_FAILED',
          message: toolError.message,
          details: { toolId, executionId: execution.id }
        },
        executionTime,
        timestamp: execution.endTime!,
        metadata: {
          toolId,
          executionId: execution.id,
          timestamp: execution.endTime!
        }
      };

      this.logger.error(`Tool execution failed: ${toolId}`, {
        executionId: execution.id,
        executionTime,
        error: error instanceof Error ? error.message : String(error)
      });

      return result;
    }
  }

  /**
   * Get a registered tool
   */
  getTool(toolId: string): Tool | null {
    const registeredTool = this.tools.get(toolId);
    return registeredTool ? registeredTool.tool : null;
  }

  /**
   * Get all tools in a category
   */
  getToolsByCategory(category: ToolCategory): Tool[] {
    const toolIds = this.categories.get(category) || [];
    return toolIds
      .map(id => this.tools.get(id))
      .filter(tool => tool !== undefined)
      .map(registeredTool => registeredTool!.tool);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values()).map(rt => rt.tool);
  }

  /**
   * Get tool status and metrics
   */
  getToolStatus(toolId: string): ToolStatus | null {
    const registeredTool = this.tools.get(toolId);
    if (!registeredTool) return null;

    return {
      id: toolId,
      status: registeredTool.status,
      registeredAt: registeredTool.registeredAt,
      lastUsed: registeredTool.lastUsed,
      executionCount: registeredTool.executionCount,
      errorCount: registeredTool.errorCount,
      averageExecutionTime: registeredTool.averageExecutionTime,
      errorRate: registeredTool.executionCount > 0
        ? registeredTool.errorCount / registeredTool.executionCount
        : 0
    } as any as ToolStatus;
  }

  /**
   * Search tools by name, description, or tags
   */
  searchTools(query: string): Tool[] {
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.tools.values())
      .map(rt => rt.tool)
      .filter(tool => {
        const matchesName = tool.name.toLowerCase().includes(normalizedQuery);
        const matchesDescription = tool.description.toLowerCase().includes(normalizedQuery);
        const matchesTags = tool.metadata?.tags?.some(tag => 
          tag.toLowerCase().includes(normalizedQuery)
        );
        
        return matchesName || matchesDescription || matchesTags;
      });
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalTools: number;
    toolsByCategory: Record<ToolCategory, number>;
    toolsByStatus: Record<string, number>;
    totalExecutions: number;
    totalErrors: number;
  } {
    const stats = {
      totalTools: this.tools.size,
      toolsByCategory: {} as Record<ToolCategory, number>,
      toolsByStatus: {} as Record<string, number>,
      totalExecutions: 0,
      totalErrors: 0
    };

    // Initialize categories
    for (const category of this.categories.keys()) {
      stats.toolsByCategory[category] = 0;
    }

    // Collect statistics
    for (const registeredTool of this.tools.values()) {
      const { tool, status, executionCount, errorCount } = registeredTool;
      
      stats.toolsByCategory[tool.category]++;
      stats.toolsByStatus[status] = (stats.toolsByStatus[status] || 0) + 1;
      stats.totalExecutions += executionCount;
      stats.totalErrors += errorCount;
    }

    return stats;
  }

  /**
   * Get health status of the ToolRegistry
   */
  getHealthStatus(): any {
    const stats = this.getRegistryStats();
    return {
      status: 'running',
      totalTools: stats.totalTools,
      readyTools: stats.toolsByStatus.ready || 0,
      errorTools: stats.toolsByStatus.error || 0,
      totalExecutions: stats.totalExecutions,
      totalErrors: stats.totalErrors,
      errorRate: stats.totalExecutions > 0 ? stats.totalErrors / stats.totalExecutions : 0,
      toolsByCategory: stats.toolsByCategory,
      uptime: Date.now() - this.startTime
    };
  }

  private startTime = Date.now();

  private validateTool(tool: Tool): void {
    if (!tool.id) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Tool ID is required',
        'validation',
        'high'
      );
    }

    if (!tool.name) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Tool name is required',
        'validation',
        'high'
      );
    }

    if (!tool.execute) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Tool must have an execute method',
        'validation',
        'high'
      );
    }

    if (!tool.category) {
      throw this.errorManager.createError(
        'VALIDATION_FAILED',
        'Tool category is required',
        'validation',
        'high'
      );
    }
  }

  private getDefaultConfig(_tool: Tool): ToolConfig {
    return {
      timeout: 30000, // 30 seconds
      rateLimit: {
        requestsPerSecond: 10,
        burstCapacity: 100,
        maxRequests: 100,
        windowMs: 60000 // 1 minute
      }
    };
  }

  private initializeCategories(): void {
    const categories: ToolCategory[] = [
      'communication', 'data', 'ai', 'workflow', 'monitoring', 'security', 'utility'
    ];
    
    for (const category of categories) {
      this.categories.set(category, []);
    }
  }

  private addToCategory(category: ToolCategory, toolId: string): void {
    const tools = this.categories.get(category) || [];
    tools.push(toolId);
    this.categories.set(category, tools);
  }

  private removeFromCategory(category: ToolCategory, toolId: string): void {
    const tools = this.categories.get(category) || [];
    const index = tools.indexOf(toolId);
    if (index !== -1) {
      tools.splice(index, 1);
      this.categories.set(category, tools);
    }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface RegisteredTool {
  tool: Tool;
  config: ToolConfig;
  status: 'registered' | 'ready' | 'error';
  registeredAt: Date;
  lastUsed: Date | null;
  executionCount: number;
  errorCount: number;
  averageExecutionTime: number;
}