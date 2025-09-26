"use strict";
/**
 * OpenConductor System Management API Routes
 *
 * REST endpoints for system health, metrics, status, and maintenance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSystemRoutes = createSystemRoutes;
const express_1 = require("express");
const error_handler_1 = require("../middleware/error-handler");
/**
 * Create system management routes
 */
function createSystemRoutes(conductor, logger, errorManager) {
    const router = (0, express_1.Router)();
    /**
     * GET /system/health - Get system health status
     */
    router.get('/health', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Getting system health', { userId: req.user?.id });
        try {
            const health = await conductor.getHealth();
            const response = {
                success: true,
                data: health,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            // Set appropriate status code based on health
            const statusCode = health.status === 'healthy' ? 200 :
                health.status === 'degraded' ? 200 : 503;
            logger.info('System health retrieved successfully', {
                status: health.status,
                userId: req.user?.id
            });
            res.status(statusCode).json(response);
        }
        catch (error) {
            logger.error('Failed to get system health:', error);
            throw error;
        }
    }));
    /**
     * GET /system/metrics - Get system metrics
     */
    router.get('/metrics', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Getting system metrics', { userId: req.user?.id });
        try {
            const metrics = await conductor.getMetrics();
            const response = {
                success: true,
                data: metrics,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('System metrics retrieved successfully', {
                totalAgents: metrics.agents.total,
                totalWorkflows: metrics.workflows.total,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get system metrics:', error);
            throw error;
        }
    }));
    /**
     * GET /system/info - Get system information
     */
    router.get('/info', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Getting system information', { userId: req.user?.id });
        try {
            const info = {
                name: 'OpenConductor',
                version: conductor.version,
                instanceId: conductor.instanceId,
                uptime: conductor.uptime,
                startTime: new Date(Date.now() - conductor.uptime),
                environment: conductor.getConfig('environment.name'),
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch,
                features: {
                    websockets: conductor.getConfig('api.websocket.enabled'),
                    plugins: conductor.getConfig('plugins.autoLoad'),
                    monitoring: conductor.getConfig('monitoring.metrics.enabled'),
                    authentication: conductor.getConfig('auth.strategy') !== 'none'
                },
                limits: {
                    maxAgents: conductor.getConfig('core.runtime.maxConcurrentAgents'),
                    maxWorkflows: conductor.getConfig('core.runtime.maxConcurrentWorkflows'),
                    defaultTimeout: conductor.getConfig('core.runtime.defaultTimeout')
                }
            };
            const response = {
                success: true,
                data: info,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('System information retrieved successfully', {
                version: info.version,
                uptime: `${Math.floor(info.uptime / 1000)}s`,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get system information:', error);
            throw error;
        }
    }));
    /**
     * GET /system/status - Get system status
     */
    router.get('/status', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Getting system status', { userId: req.user?.id });
        try {
            const health = await conductor.getHealth();
            const metrics = await conductor.getMetrics();
            const status = {
                status: conductor.isHealthy ? 'running' : 'error',
                health: health.status,
                uptime: conductor.uptime,
                lastRestart: new Date(Date.now() - conductor.uptime),
                activeConnections: getActiveConnections(),
                resourceUsage: {
                    memory: {
                        used: process.memoryUsage().heapUsed,
                        total: process.memoryUsage().heapTotal,
                        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
                    },
                    cpu: {
                        usage: process.cpuUsage(),
                        percentage: getCPUPercentage()
                    }
                },
                components: {
                    agents: {
                        total: metrics.agents.total,
                        active: metrics.agents.active,
                        executing: metrics.agents.executing
                    },
                    workflows: {
                        total: metrics.workflows.total,
                        running: metrics.workflows.running,
                        completed: metrics.workflows.completed
                    },
                    events: {
                        processed: getEventCount(),
                        subscribers: getSubscriberCount()
                    }
                }
            };
            const response = {
                success: true,
                data: status,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('System status retrieved successfully', {
                status: status.status,
                health: status.health,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get system status:', error);
            throw error;
        }
    }));
    /**
     * GET /system/config - Get system configuration (sanitized)
     */
    router.get('/config', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Getting system configuration', { userId: req.user?.id });
        try {
            // Get sanitized configuration (remove sensitive data)
            const rawConfig = conductor.getConfig();
            const sanitizedConfig = sanitizeConfig(rawConfig);
            const response = {
                success: true,
                data: sanitizedConfig,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('System configuration retrieved successfully', {
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get system configuration:', error);
            throw error;
        }
    }));
    /**
     * POST /system/maintenance - Enable maintenance mode
     */
    router.post('/maintenance', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { message } = req.body;
        logger.debug('Enabling maintenance mode', { message, userId: req.user?.id });
        try {
            // TODO: Implement maintenance mode
            const maintenanceInfo = {
                enabled: true,
                message: message || 'System is under maintenance',
                enabledAt: new Date(),
                enabledBy: req.user?.id
            };
            const response = {
                success: true,
                data: maintenanceInfo,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.warn('Maintenance mode enabled', {
                message: maintenanceInfo.message,
                enabledBy: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to enable maintenance mode:', error);
            throw error;
        }
    }));
    /**
     * DELETE /system/maintenance - Disable maintenance mode
     */
    router.delete('/maintenance', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Disabling maintenance mode', { userId: req.user?.id });
        try {
            // TODO: Implement maintenance mode
            const maintenanceInfo = {
                enabled: false,
                disabledAt: new Date(),
                disabledBy: req.user?.id
            };
            const response = {
                success: true,
                data: maintenanceInfo,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Maintenance mode disabled', {
                disabledBy: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to disable maintenance mode:', error);
            throw error;
        }
    }));
    /**
     * GET /system/logs - Get system logs (recent)
     */
    router.get('/logs', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { level = 'info', limit = 100, since } = req.query;
        logger.debug('Getting system logs', { level, limit, since, userId: req.user?.id });
        try {
            // TODO: Implement log retrieval from logging system
            const logs = getRecentLogs(level, parseInt(limit), since);
            const response = {
                success: true,
                data: logs,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('System logs retrieved successfully', {
                count: logs.length,
                level,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get system logs:', error);
            throw error;
        }
    }));
    /**
     * GET /system/performance - Get performance metrics
     */
    router.get('/performance', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Getting performance metrics', { userId: req.user?.id });
        try {
            const performance = {
                timestamp: new Date(),
                uptime: conductor.uptime,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                eventLoop: getEventLoopLag(),
                gc: getGCStats(),
                requests: getRequestStats(),
                agents: {
                    totalExecutions: getTotalAgentExecutions(),
                    averageLatency: getAverageAgentLatency(),
                    successRate: getAgentSuccessRate()
                },
                workflows: {
                    totalExecutions: getTotalWorkflowExecutions(),
                    averageLatency: getAverageWorkflowLatency(),
                    successRate: getWorkflowSuccessRate()
                }
            };
            const response = {
                success: true,
                data: performance,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Performance metrics retrieved successfully', {
                memoryUsage: `${Math.round(performance.memory.heapUsed / 1024 / 1024)}MB`,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get performance metrics:', error);
            throw error;
        }
    }));
    /**
     * POST /system/gc - Force garbage collection (development only)
     */
    router.post('/gc', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Forcing garbage collection', { userId: req.user?.id });
        try {
            // Only allow in development environment
            if (conductor.getConfig('environment.name') !== 'development') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Garbage collection can only be forced in development environment'
                    }
                });
            }
            const beforeMemory = process.memoryUsage();
            // Force garbage collection if exposed
            if (global.gc) {
                global.gc();
            }
            const afterMemory = process.memoryUsage();
            const gcResult = {
                forced: !!global.gc,
                before: beforeMemory,
                after: afterMemory,
                freedMemory: beforeMemory.heapUsed - afterMemory.heapUsed,
                timestamp: new Date()
            };
            const response = {
                success: true,
                data: gcResult,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Garbage collection completed', {
                freed: `${Math.round(gcResult.freedMemory / 1024 / 1024)}MB`,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to force garbage collection:', error);
            throw error;
        }
    }));
    return router;
}
/**
 * Get active connections count (stub implementation)
 */
function getActiveConnections() {
    // TODO: Implement actual connection tracking
    return Math.floor(Math.random() * 50) + 10;
}
/**
 * Get CPU percentage (stub implementation)
 */
function getCPUPercentage() {
    // TODO: Implement actual CPU percentage calculation
    return Math.floor(Math.random() * 30) + 5;
}
/**
 * Get event count (stub implementation)
 */
function getEventCount() {
    // TODO: Get from event bus
    return Math.floor(Math.random() * 10000) + 1000;
}
/**
 * Get subscriber count (stub implementation)
 */
function getSubscriberCount() {
    // TODO: Get from event bus
    return Math.floor(Math.random() * 20) + 5;
}
/**
 * Sanitize configuration by removing sensitive data
 */
function sanitizeConfig(config) {
    const sanitized = JSON.parse(JSON.stringify(config));
    // Remove sensitive fields
    const sensitiveFields = [
        'auth.jwt.secret',
        'auth.session.secret',
        'database.primary.password',
        'cache.redis.password',
        'logging.http.auth.password'
    ];
    sensitiveFields.forEach(field => {
        const keys = field.split('.');
        let obj = sanitized;
        for (let i = 0; i < keys.length - 1; i++) {
            if (obj[keys[i]]) {
                obj = obj[keys[i]];
            }
            else {
                break;
            }
        }
        if (obj && obj[keys[keys.length - 1]]) {
            obj[keys[keys.length - 1]] = '[REDACTED]';
        }
    });
    return sanitized;
}
/**
 * Get recent logs (stub implementation)
 */
function getRecentLogs(level, limit, since) {
    // TODO: Implement actual log retrieval
    const mockLogs = [];
    const levels = ['debug', 'info', 'warn', 'error'];
    for (let i = 0; i < Math.min(limit, 20); i++) {
        mockLogs.push({
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            level: levels[Math.floor(Math.random() * levels.length)],
            message: `Mock log message ${i + 1}`,
            service: 'openconductor',
            requestId: `req_${Date.now()}_${i}`
        });
    }
    return mockLogs.filter(log => levels.indexOf(log.level) >= levels.indexOf(level) &&
        (!since || new Date(log.timestamp) >= new Date(since)));
}
/**
 * Get event loop lag (stub implementation)
 */
function getEventLoopLag() {
    // TODO: Implement actual event loop lag measurement
    return Math.random() * 10 + 1;
}
/**
 * Get GC statistics (stub implementation)
 */
function getGCStats() {
    // TODO: Implement actual GC statistics
    return {
        collections: Math.floor(Math.random() * 100) + 50,
        totalTime: Math.floor(Math.random() * 1000) + 100,
        averageTime: Math.random() * 10 + 1
    };
}
/**
 * Get request statistics (stub implementation)
 */
function getRequestStats() {
    // TODO: Implement actual request statistics tracking
    return {
        total: Math.floor(Math.random() * 10000) + 1000,
        successful: Math.floor(Math.random() * 9500) + 950,
        failed: Math.floor(Math.random() * 500) + 50,
        averageResponseTime: Math.random() * 200 + 50
    };
}
/**
 * Get total agent executions (stub implementation)
 */
function getTotalAgentExecutions() {
    // TODO: Get from metrics system
    return Math.floor(Math.random() * 5000) + 500;
}
/**
 * Get average agent latency (stub implementation)
 */
function getAverageAgentLatency() {
    // TODO: Calculate from execution history
    return Math.random() * 500 + 100;
}
/**
 * Get agent success rate (stub implementation)
 */
function getAgentSuccessRate() {
    // TODO: Calculate from execution history
    return Math.random() * 10 + 90; // 90-100%
}
/**
 * Get total workflow executions (stub implementation)
 */
function getTotalWorkflowExecutions() {
    // TODO: Get from metrics system
    return Math.floor(Math.random() * 1000) + 100;
}
/**
 * Get average workflow latency (stub implementation)
 */
function getAverageWorkflowLatency() {
    // TODO: Calculate from execution history
    return Math.random() * 2000 + 500;
}
/**
 * Get workflow success rate (stub implementation)
 */
function getWorkflowSuccessRate() {
    // TODO: Calculate from execution history
    return Math.random() * 15 + 85; // 85-100%
}
//# sourceMappingURL=system.js.map