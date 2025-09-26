"use strict";
/**
 * OpenConductor Agent Management API Routes
 *
 * REST endpoints for managing AI agents - create, read, update, delete, execute
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentRoutes = createAgentRoutes;
const express_1 = require("express");
const error_handler_1 = require("../middleware/error-handler");
/**
 * Create agent management routes
 */
function createAgentRoutes(conductor, logger, errorManager) {
    const router = (0, express_1.Router)();
    /**
     * GET /agents - List all agents
     */
    router.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, filter } = req.query;
        logger.debug('Listing agents', {
            page, limit, sort, order, search, filter,
            userId: req.user?.id
        });
        try {
            // Get all agents
            let agents = conductor.listAgents();
            // Apply search filter
            if (search) {
                const searchTerm = search.toLowerCase();
                agents = agents.filter(agent => agent.name.toLowerCase().includes(searchTerm) ||
                    agent.description?.toLowerCase().includes(searchTerm) ||
                    agent.type.toLowerCase().includes(searchTerm));
            }
            // Apply additional filters
            if (filter) {
                try {
                    const filterObj = JSON.parse(filter);
                    agents = agents.filter(agent => {
                        return Object.entries(filterObj).every(([key, value]) => {
                            if (key === 'status')
                                return agent.status === value;
                            if (key === 'type')
                                return agent.type === value;
                            if (key === 'capabilities') {
                                const caps = value;
                                return caps.every(cap => agent.capabilities.includes(cap));
                            }
                            return true;
                        });
                    });
                }
                catch (error) {
                    logger.warn('Invalid filter JSON:', filter);
                }
            }
            // Apply sorting
            agents.sort((a, b) => {
                let aValue = a[sort];
                let bValue = b[sort];
                if (sort === 'createdAt' || sort === 'updatedAt') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                }
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
            const paginatedAgents = agents.slice(offset, offset + limitNum);
            const total = agents.length;
            const totalPages = Math.ceil(total / limitNum);
            const response = {
                success: true,
                data: paginatedAgents,
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
            logger.info('Agents listed successfully', {
                count: paginatedAgents.length,
                total,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to list agents:', error);
            throw error;
        }
    }));
    /**
     * GET /agents/:id - Get specific agent
     */
    router.get('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting agent', { agentId: id, userId: req.user?.id });
        try {
            const agent = conductor.getAgent(id);
            if (!agent) {
                throw new error_handler_1.NotFoundError('Agent', id);
            }
            const response = {
                success: true,
                data: agent,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Agent retrieved successfully', {
                agentId: id,
                agentName: agent.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get agent:', error);
            throw error;
        }
    }));
    /**
     * POST /agents - Create new agent
     */
    router.post('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const agentData = req.body;
        logger.debug('Creating agent', {
            agentName: agentData.name,
            agentType: agentData.type,
            userId: req.user?.id
        });
        try {
            // Check if agent with same name already exists
            const existingAgents = conductor.listAgents();
            const existingAgent = existingAgents.find(a => a.name === agentData.name);
            if (existingAgent) {
                throw new error_handler_1.ConflictError(`Agent with name '${agentData.name}' already exists`);
            }
            // Create agent instance
            const agent = {
                id: generateAgentId(),
                name: agentData.name,
                type: agentData.type,
                version: agentData.version,
                description: agentData.description,
                capabilities: agentData.config.capabilities,
                tools: agentData.config.tools || [],
                status: 'idle',
                createdAt: new Date(),
                updatedAt: new Date(),
                config: agentData.config,
                metadata: {
                    createdBy: req.user?.id,
                    lastExecuted: null,
                    executionCount: 0,
                    successRate: 0
                }
            };
            // Register agent with conductor
            await conductor.registerAgent(agent);
            const response = {
                success: true,
                data: agent,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Agent created successfully', {
                agentId: agent.id,
                agentName: agent.name,
                agentType: agent.type,
                userId: req.user?.id
            });
            res.status(201).json(response);
        }
        catch (error) {
            logger.error('Failed to create agent:', error);
            throw error;
        }
    }));
    /**
     * PUT /agents/:id - Update agent
     */
    router.put('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        logger.debug('Updating agent', { agentId: id, updates, userId: req.user?.id });
        try {
            const agent = conductor.getAgent(id);
            if (!agent) {
                throw new error_handler_1.NotFoundError('Agent', id);
            }
            // Update agent properties
            if (updates.name)
                agent.name = updates.name;
            if (updates.description !== undefined)
                agent.description = updates.description;
            if (updates.config) {
                agent.config = { ...agent.config, ...updates.config };
                if (updates.config.capabilities)
                    agent.capabilities = updates.config.capabilities;
                if (updates.config.tools)
                    agent.tools = updates.config.tools;
            }
            agent.updatedAt = new Date();
            // Re-register agent to apply changes
            await conductor.unregisterAgent(id);
            await conductor.registerAgent(agent);
            const response = {
                success: true,
                data: agent,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Agent updated successfully', {
                agentId: id,
                agentName: agent.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to update agent:', error);
            throw error;
        }
    }));
    /**
     * DELETE /agents/:id - Delete agent
     */
    router.delete('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Deleting agent', { agentId: id, userId: req.user?.id });
        try {
            const agent = conductor.getAgent(id);
            if (!agent) {
                throw new error_handler_1.NotFoundError('Agent', id);
            }
            // Unregister agent
            await conductor.unregisterAgent(id);
            const response = {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Agent deleted successfully', {
                agentId: id,
                agentName: agent.name,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to delete agent:', error);
            throw error;
        }
    }));
    /**
     * POST /agents/:id/execute - Execute agent
     */
    router.post('/:id/execute', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { input, options = {} } = req.body;
        logger.debug('Executing agent', {
            agentId: id,
            hasInput: !!input,
            options,
            userId: req.user?.id
        });
        try {
            const agent = conductor.getAgent(id);
            if (!agent) {
                throw new error_handler_1.NotFoundError('Agent', id);
            }
            if (agent.status !== 'idle' && agent.status !== 'running') {
                throw new error_handler_1.AgentExecutionError(`Agent is ${agent.status} and cannot be executed`);
            }
            // Execute agent
            const startTime = Date.now();
            const result = await conductor.executeAgent(id, input);
            const duration = Date.now() - startTime;
            // Update agent metadata
            if (agent.metadata) {
                agent.metadata.lastExecuted = new Date();
                agent.metadata.executionCount = (agent.metadata.executionCount || 0) + 1;
            }
            const response = {
                success: true,
                data: {
                    result,
                    execution: {
                        id: generateExecutionId(),
                        agentId: id,
                        startTime: new Date(startTime),
                        endTime: new Date(),
                        duration: `${duration}ms`,
                        status: 'completed',
                        input,
                        output: result
                    }
                },
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId,
                    executionTime: duration
                }
            };
            logger.info('Agent executed successfully', {
                agentId: id,
                agentName: agent.name,
                duration: `${duration}ms`,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to execute agent:', error);
            // Update agent metadata for failed execution
            const agent = conductor.getAgent(id);
            if (agent?.metadata) {
                agent.metadata.lastExecuted = new Date();
                agent.metadata.executionCount = (agent.metadata.executionCount || 0) + 1;
            }
            throw new error_handler_1.AgentExecutionError(error.message, { originalError: error.message });
        }
    }));
    /**
     * GET /agents/:id/health - Get agent health status
     */
    router.get('/:id/health', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting agent health', { agentId: id, userId: req.user?.id });
        try {
            const agent = conductor.getAgent(id);
            if (!agent) {
                throw new error_handler_1.NotFoundError('Agent', id);
            }
            // Calculate health metrics
            const health = {
                status: agent.status === 'running' ? 'healthy' :
                    agent.status === 'error' ? 'unhealthy' : 'idle',
                timestamp: new Date(),
                uptime: agent.createdAt ? Date.now() - agent.createdAt.getTime() : 0,
                lastExecution: agent.metadata?.lastExecuted,
                executionCount: agent.metadata?.executionCount || 0,
                successRate: agent.metadata?.successRate || 0,
                memoryUsage: getAgentMemoryUsage(agent),
                resourceUsage: getAgentResourceUsage(agent)
            };
            const response = {
                success: true,
                data: health,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get agent health:', error);
            throw error;
        }
    }));
    /**
     * GET /agents/:id/metrics - Get agent metrics
     */
    router.get('/:id/metrics', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting agent metrics', { agentId: id, userId: req.user?.id });
        try {
            const agent = conductor.getAgent(id);
            if (!agent) {
                throw new error_handler_1.NotFoundError('Agent', id);
            }
            const metrics = {
                executionCount: agent.metadata?.executionCount || 0,
                successRate: agent.metadata?.successRate || 0,
                averageLatency: calculateAverageLatency(agent),
                errorRate: calculateErrorRate(agent),
                uptime: agent.createdAt ? Date.now() - agent.createdAt.getTime() : 0,
                lastExecution: agent.metadata?.lastExecuted,
                resourceUtilization: {
                    cpu: getAgentCPUUsage(agent),
                    memory: getAgentMemoryUsage(agent),
                    storage: getAgentStorageUsage(agent)
                },
                capabilities: agent.capabilities,
                tools: agent.tools.length,
                status: agent.status
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
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get agent metrics:', error);
            throw error;
        }
    }));
    return router;
}
/**
 * Generate unique agent ID
 */
function generateAgentId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
/**
 * Generate unique execution ID
 */
function generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
/**
 * Get agent memory usage (stub implementation)
 */
function getAgentMemoryUsage(agent) {
    // TODO: Implement actual memory usage tracking
    return Math.random() * 100; // Mock percentage
}
/**
 * Get agent resource usage (stub implementation)
 */
function getAgentResourceUsage(agent) {
    // TODO: Implement actual resource usage tracking
    return {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 100
    };
}
/**
 * Calculate average latency (stub implementation)
 */
function calculateAverageLatency(agent) {
    // TODO: Implement actual latency calculation
    return Math.random() * 1000 + 100; // Mock ms
}
/**
 * Calculate error rate (stub implementation)
 */
function calculateErrorRate(agent) {
    // TODO: Implement actual error rate calculation
    return Math.random() * 10; // Mock percentage
}
/**
 * Get agent CPU usage (stub implementation)
 */
function getAgentCPUUsage(agent) {
    // TODO: Implement actual CPU usage tracking
    return Math.random() * 100; // Mock percentage
}
/**
 * Get agent storage usage (stub implementation)
 */
function getAgentStorageUsage(agent) {
    // TODO: Implement actual storage usage tracking
    return Math.random() * 100; // Mock percentage
}
//# sourceMappingURL=agents.js.map