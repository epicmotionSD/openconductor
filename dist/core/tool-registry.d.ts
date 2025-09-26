/**
 * ToolRegistry Implementation
 *
 * Registry for managing tools and integrations
 */
import { Tool, ToolConfig, ToolCategory, ToolStatus, ToolExecutionResult } from '../types/tools';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
export declare class ToolRegistry {
    private tools;
    private categories;
    private logger;
    private errorManager;
    private eventBus;
    constructor(logger: Logger, errorManager: ErrorManager, eventBus: EventBus);
    /**
     * Register a new tool
     */
    registerTool(tool: Tool, config?: ToolConfig): Promise<void>;
    /**
     * Unregister a tool
     */
    unregisterTool(toolId: string): Promise<void>;
    /**
     * Execute a tool
     */
    executeTool(toolId: string, input: any, context?: Record<string, any>): Promise<ToolExecutionResult>;
    /**
     * Get a registered tool
     */
    getTool(toolId: string): Tool | null;
    /**
     * Get all tools in a category
     */
    getToolsByCategory(category: ToolCategory): Tool[];
    /**
     * Get all registered tools
     */
    getAllTools(): Tool[];
    /**
     * Get tool status and metrics
     */
    getToolStatus(toolId: string): ToolStatus | null;
    /**
     * Search tools by name, description, or tags
     */
    searchTools(query: string): Tool[];
    /**
     * Get registry statistics
     */
    getRegistryStats(): {
        totalTools: number;
        toolsByCategory: Record<ToolCategory, number>;
        toolsByStatus: Record<string, number>;
        totalExecutions: number;
        totalErrors: number;
    };
    /**
     * Get health status of the ToolRegistry
     */
    getHealthStatus(): any;
    private startTime;
    private validateTool;
    private getDefaultConfig;
    private initializeCategories;
    private addToCategory;
    private removeFromCategory;
    private generateExecutionId;
}
//# sourceMappingURL=tool-registry.d.ts.map