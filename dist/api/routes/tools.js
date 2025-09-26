"use strict";
/**
 * OpenConductor Tool Management API Routes
 *
 * REST endpoints for managing tools - register, execute, health checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolRoutes = createToolRoutes;
const express_1 = require("express");
const error_handler_1 = require("../middleware/error-handler");
/**
 * Create tool management routes
 */
function createToolRoutes(conductor, logger, errorManager) {
    const router = (0, express_1.Router)();
    /**
     * GET /tools - List all tools
     */
    router.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
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
                const searchTerm = search.toLowerCase();
                tools = allTools.filter(tool => tool.name.toLowerCase().includes(searchTerm) ||
                    tool.description.toLowerCase().includes(searchTerm) ||
                    tool.type.toLowerCase().includes(searchTerm));
            }
            // Apply additional filters
            if (filter) {
                try {
                    const filterObj = JSON.parse(filter);
                    tools = tools.filter(tool => {
                        return Object.entries(filterObj).every(([key, value]) => {
                            if (key === 'type')
                                return tool.type === value;
                            if (key === 'status')
                                return tool.status === value;
                            return true;
                        });
                    });
                }
                catch (error) {
                    logger.warn('Invalid filter JSON:', filter);
                }
            }
            // Apply sorting
            tools.sort((a, b) => {
                let aValue = a[sort];
                let bValue = b[sort];
                if (order === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
                else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            });
            // Apply pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const paginatedTools = tools.slice(offset, offset + limitNum);
            const total = tools.length;
            const totalPages = Math.ceil(total / limitNum);
            const response = {
                success: true,
                data: paginatedTools,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
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
        }
        catch (error) {
            logger.error('Failed to list tools:', error);
            throw error;
        }
    }));
    /**
     * GET /tools/:id - Get specific tool
     */
    router.get('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting tool', { toolId: id, userId: req.user?.id });
        try {
            const tool = await conductor.tools.getTool(id);
            if (!tool) {
                throw new error_handler_1.NotFoundError('Tool', id);
            }
            const response = {
                success: true,
                data: tool,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Tool retrieved successfully', {
                toolId: id,
                toolName: tool.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get tool:', error);
            throw error;
        }
    }));
    /**
     * POST /tools - Register new tool
     */
    router.post('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const toolData = req.body;
        logger.debug('Registering tool', {
            toolName: toolData.name,
            toolType: toolData.type,
            userId: req.user?.id
        });
        try {
            // Check if tool with same name already exists
            const existingTool = await conductor.tools.getTool(toolData.id || toolData.name);
            if (existingTool) {
                throw new error_handler_1.ConflictError(`Tool with name '${toolData.name}' already exists`);
            }
            // Add metadata
            const tool = {
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
            const response = {
                success: true,
                data: tool,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Tool registered successfully', {
                toolId: tool.id,
                toolName: tool.name,
                toolType: tool.type,
                userId: req.user?.id
            });
            res.status(201).json(response);
        }
        catch (error) {
            logger.error('Failed to register tool:', error);
            throw error;
        }
    }));
    /**
     * PUT /tools/:id - Update tool
     */
    router.put('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        logger.debug('Updating tool', { toolId: id, updates, userId: req.user?.id });
        try {
            const tool = await conductor.tools.getTool(id);
            if (!tool) {
                throw new error_handler_1.NotFoundError('Tool', id);
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
            const response = {
                success: true,
                data: updatedTool,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Tool updated successfully', {
                toolId: id,
                toolName: updatedTool.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to update tool:', error);
            throw error;
        }
    }));
    /**
     * DELETE /tools/:id - Unregister tool
     */
    router.delete('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Unregistering tool', { toolId: id, userId: req.user?.id });
        try {
            const tool = await conductor.tools.getTool(id);
            if (!tool) {
                throw new error_handler_1.NotFoundError('Tool', id);
            }
            // Unregister tool
            await conductor.tools.unregisterTool(id);
            const response = {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Tool unregistered successfully', {
                toolId: id,
                toolName: tool.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to unregister tool:', error);
            throw error;
        }
    }));
    /**
     * POST /tools/:id/execute - Execute tool operation
     */
    router.post('/:id/execute', (0, error_handler_1.asyncHandler)(async (req, res) => {
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
                throw new error_handler_1.NotFoundError('Tool', id);
            }
            // Validate operation exists
            const operationConfig = tool.config.operations.find(op => op.name === operation);
            if (!operationConfig) {
                throw new error_handler_1.ToolExecutionError(`Operation '${operation}' not found in tool '${tool.name}'`);
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
            const executionResult = {
                success: true,
                output: result,
                executionTime: duration,
                timestamp: new Date(),
                toolId: id,
                operation,
                parameters
            };
            const response = {
                success: true,
                data: executionResult,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId,
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
        }
        catch (error) {
            logger.error('Failed to execute tool:', error);
            // Update tool metadata for failed execution
            try {
                const tool = await conductor.tools.getTool(id);
                if (tool?.metadata) {
                    tool.metadata.lastUsed = new Date();
                    tool.metadata.executionCount = (tool.metadata.executionCount || 0) + 1;
                }
            }
            catch (metadataError) {
                logger.warn('Failed to update tool metadata after error:', metadataError);
            }
            throw new error_handler_1.ToolExecutionError(error.message, { originalError: error.message });
        }
    }));
    /**
     * GET /tools/:id/health - Get tool health status
     */
    router.get('/:id/health', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting tool health', { toolId: id, userId: req.user?.id });
        try {
            const tool = await conductor.tools.getTool(id);
            if (!tool) {
                throw new error_handler_1.NotFoundError('Tool', id);
            }
            // Perform health check
            const healthStatus = await conductor.tools.getHealthStatus(id);
            const response = {
                success: true,
                data: healthStatus,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Tool health checked successfully', {
                toolId: id,
                toolName: tool.name,
                status: healthStatus.status,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get tool health:', error);
            throw error;
        }
    }));
    /**
     * POST /tools/:id/test - Test tool connection
     */
    router.post('/:id/test', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Testing tool connection', { toolId: id, userId: req.user?.id });
        try {
            const tool = await conductor.tools.getTool(id);
            if (!tool) {
                throw new error_handler_1.NotFoundError('Tool', id);
            }
            // Perform connection test
            const startTime = Date.now();
            const testResult = await conductor.tools.testTool(id);
            const duration = Date.now() - startTime;
            const response = {
                success: true,
                data: {
                    ...testResult,
                    duration: `${duration}ms`,
                    timestamp: new Date()
                },
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId,
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
        }
        catch (error) {
            logger.error('Failed to test tool connection:', error);
            throw error;
        }
    }));
    /**
     * GET /tools/:id/metrics - Get tool metrics
     */
    router.get('/:id/metrics', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting tool metrics', { toolId: id, userId: req.user?.id });
        try {
            const tool = await conductor.tools.getTool(id);
            if (!tool) {
                throw new error_handler_1.NotFoundError('Tool', id);
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
            const response = {
                success: true,
                data: metrics,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Tool metrics retrieved successfully', {
                toolId: id,
                toolName: tool.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get tool metrics:', error);
            throw error;
        }
    }));
    return router;
}
/**
 * Generate unique tool ID
 */
function generateToolId() {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
/**
 * Calculate average latency (stub implementation)
 */
function calculateAverageLatency(tool) {
    // TODO: Implement actual latency calculation
    return Math.random() * 500 + 50; // Mock ms
}
/**
 * Calculate error rate (stub implementation)
 */
function calculateErrorRate(tool) {
    // TODO: Implement actual error rate calculation
    return Math.random() * 5; // Mock percentage
}
//# sourceMappingURL=tools.js.map