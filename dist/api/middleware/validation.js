"use strict";
/**
 * OpenConductor Request Validation Middleware
 *
 * Comprehensive request validation using Joi schemas
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationHelpers = exports.ValidationSchemas = void 0;
exports.createValidationMiddleware = createValidationMiddleware;
const joi_1 = __importDefault(require("joi"));
/**
 * Validation schemas for different endpoints
 */
exports.ValidationSchemas = {
    // Agent schemas
    agent: {
        create: joi_1.default.object({
            name: joi_1.default.string().required().min(1).max(100),
            type: joi_1.default.string().required().valid('oracle', 'sage', 'sentinel', 'advisory', 'prediction', 'monitoring', 'custom'),
            version: joi_1.default.string().required().pattern(/^\d+\.\d+\.\d+$/),
            description: joi_1.default.string().max(500),
            config: joi_1.default.object({
                capabilities: joi_1.default.array().items(joi_1.default.string()).required(),
                tools: joi_1.default.array().items(joi_1.default.string()).default([]),
                memory: joi_1.default.object({
                    type: joi_1.default.string().valid('persistent', 'ephemeral').default('persistent'),
                    store: joi_1.default.string().valid('redis', 'postgresql', 'memory').default('redis'),
                    ttl: joi_1.default.number().integer().min(0),
                    maxSize: joi_1.default.number().integer().min(1)
                }).required(),
                resources: joi_1.default.object({
                    cpu: joi_1.default.string().pattern(/^\d+m?$/),
                    memory: joi_1.default.string().pattern(/^\d+(Mi|Gi|Ki)$/),
                    storage: joi_1.default.string().pattern(/^\d+(Mi|Gi|Ki)$/)
                })
            }).required()
        }),
        update: joi_1.default.object({
            name: joi_1.default.string().min(1).max(100),
            description: joi_1.default.string().max(500),
            config: joi_1.default.object({
                capabilities: joi_1.default.array().items(joi_1.default.string()),
                tools: joi_1.default.array().items(joi_1.default.string()),
                memory: joi_1.default.object({
                    type: joi_1.default.string().valid('persistent', 'ephemeral'),
                    store: joi_1.default.string().valid('redis', 'postgresql', 'memory'),
                    ttl: joi_1.default.number().integer().min(0),
                    maxSize: joi_1.default.number().integer().min(1)
                }),
                resources: joi_1.default.object({
                    cpu: joi_1.default.string().pattern(/^\d+m?$/),
                    memory: joi_1.default.string().pattern(/^\d+(Mi|Gi|Ki)$/),
                    storage: joi_1.default.string().pattern(/^\d+(Mi|Gi|Ki)$/)
                })
            })
        }).min(1),
        execute: joi_1.default.object({
            input: joi_1.default.alternatives().try(joi_1.default.object(), joi_1.default.array(), joi_1.default.string(), joi_1.default.number(), joi_1.default.boolean()).required(),
            options: joi_1.default.object({
                timeout: joi_1.default.number().integer().min(1000).max(300000),
                priority: joi_1.default.string().valid('low', 'normal', 'high'),
                callback: joi_1.default.string().uri()
            })
        })
    },
    // Workflow schemas
    workflow: {
        create: joi_1.default.object({
            name: joi_1.default.string().required().min(1).max(100),
            description: joi_1.default.string().max(500),
            version: joi_1.default.string().required().pattern(/^\d+\.\d+\.\d+$/),
            strategy: joi_1.default.string().required().valid('sequential', 'parallel', 'conditional', 'event-driven'),
            steps: joi_1.default.array().items(joi_1.default.object({
                id: joi_1.default.string().required(),
                name: joi_1.default.string().required(),
                type: joi_1.default.string().required().valid('agent', 'tool', 'condition', 'parallel', 'sequential'),
                config: joi_1.default.object().required(),
                dependencies: joi_1.default.array().items(joi_1.default.string()).default([]),
                retryPolicy: joi_1.default.object({
                    maxRetries: joi_1.default.number().integer().min(0).max(10),
                    backoffStrategy: joi_1.default.string().valid('linear', 'exponential'),
                    initialDelay: joi_1.default.number().integer().min(100)
                })
            })).min(1).required(),
            triggers: joi_1.default.array().items(joi_1.default.object({
                type: joi_1.default.string().required().valid('manual', 'schedule', 'event', 'webhook'),
                config: joi_1.default.object().required()
            })).default([])
        }),
        execute: joi_1.default.object({
            input: joi_1.default.alternatives().try(joi_1.default.object(), joi_1.default.array(), joi_1.default.string(), joi_1.default.number(), joi_1.default.boolean()),
            options: joi_1.default.object({
                timeout: joi_1.default.number().integer().min(1000).max(1800000), // 30 minutes max
                priority: joi_1.default.string().valid('low', 'normal', 'high'),
                callback: joi_1.default.string().uri()
            })
        })
    },
    // Tool schemas
    tool: {
        register: joi_1.default.object({
            name: joi_1.default.string().required().min(1).max(100),
            type: joi_1.default.string().required().valid('function', 'api', 'database', 'file', 'custom'),
            version: joi_1.default.string().required().pattern(/^\d+\.\d+\.\d+$/),
            description: joi_1.default.string().required().max(500),
            config: joi_1.default.object({
                operations: joi_1.default.array().items(joi_1.default.object({
                    name: joi_1.default.string().required(),
                    description: joi_1.default.string().required(),
                    parameters: joi_1.default.object(),
                    returns: joi_1.default.object()
                })).min(1).required(),
                authentication: joi_1.default.object({
                    type: joi_1.default.string().valid('none', 'api-key', 'bearer', 'basic'),
                    config: joi_1.default.object()
                }),
                rateLimit: joi_1.default.object({
                    requests: joi_1.default.number().integer().min(1),
                    window: joi_1.default.number().integer().min(1000)
                })
            }).required()
        }),
        execute: joi_1.default.object({
            operation: joi_1.default.string().required(),
            parameters: joi_1.default.object().default({}),
            options: joi_1.default.object({
                timeout: joi_1.default.number().integer().min(1000).max(30000),
                retries: joi_1.default.number().integer().min(0).max(3)
            })
        })
    },
    // Event schemas
    event: {
        publish: joi_1.default.object({
            type: joi_1.default.string().required().min(1).max(100),
            source: joi_1.default.string().required().min(1).max(100),
            data: joi_1.default.alternatives().try(joi_1.default.object(), joi_1.default.array(), joi_1.default.string(), joi_1.default.number(), joi_1.default.boolean()).required(),
            priority: joi_1.default.string().valid('low', 'normal', 'high').default('normal'),
            target: joi_1.default.string(),
            metadata: joi_1.default.object()
        }),
        subscription: joi_1.default.object({
            filter: joi_1.default.object({
                types: joi_1.default.array().items(joi_1.default.string()),
                sources: joi_1.default.array().items(joi_1.default.string()),
                agentId: joi_1.default.string(),
                workflowId: joi_1.default.string(),
                since: joi_1.default.date().iso(),
                until: joi_1.default.date().iso(),
                data: joi_1.default.object()
            }),
            endpoint: joi_1.default.string().uri().required(),
            active: joi_1.default.boolean().default(true)
        })
    },
    // Query parameter schemas
    query: {
        list: joi_1.default.object({
            page: joi_1.default.number().integer().min(1).default(1),
            limit: joi_1.default.number().integer().min(1).max(100).default(20),
            sort: joi_1.default.string().max(50),
            order: joi_1.default.string().valid('asc', 'desc').default('desc'),
            search: joi_1.default.string().max(100),
            filter: joi_1.default.string().max(500)
        }),
        events: joi_1.default.object({
            types: joi_1.default.string(), // Comma-separated list
            sources: joi_1.default.string(), // Comma-separated list
            agentId: joi_1.default.string(),
            workflowId: joi_1.default.string(),
            since: joi_1.default.date().iso(),
            until: joi_1.default.date().iso(),
            page: joi_1.default.number().integer().min(1).default(1),
            limit: joi_1.default.number().integer().min(1).max(1000).default(100)
        })
    },
    // Parameter schemas
    params: {
        id: joi_1.default.object({
            id: joi_1.default.string().required().min(1).max(100)
        }),
        agentId: joi_1.default.object({
            agentId: joi_1.default.string().required().min(1).max(100)
        }),
        workflowId: joi_1.default.object({
            workflowId: joi_1.default.string().required().min(1).max(100)
        }),
        executionId: joi_1.default.object({
            executionId: joi_1.default.string().required().min(1).max(100)
        })
    }
};
/**
 * Create validation middleware
 */
function createValidationMiddleware(logger, errorManager) {
    return (req, res, next) => {
        // Skip validation for non-API routes
        if (!req.path.startsWith('/api')) {
            return next();
        }
        try {
            // Validate common query parameters for GET requests
            if (req.method === 'GET') {
                const querySchema = getQuerySchema(req.path);
                if (querySchema) {
                    const { error, value } = querySchema.validate(req.query, {
                        allowUnknown: false,
                        stripUnknown: true
                    });
                    if (error) {
                        return sendValidationError(res, error, 'query');
                    }
                    req.query = value;
                }
            }
            // Validate path parameters
            const paramSchema = getParamSchema(req.path);
            if (paramSchema) {
                const { error, value } = paramSchema.validate(req.params, {
                    allowUnknown: false,
                    stripUnknown: true
                });
                if (error) {
                    return sendValidationError(res, error, 'params');
                }
                req.params = value;
            }
            // Validate request body for POST/PUT/PATCH requests
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
                const bodySchema = getBodySchema(req.method, req.path);
                if (bodySchema) {
                    const { error, value } = bodySchema.validate(req.body, {
                        allowUnknown: false,
                        stripUnknown: true,
                        abortEarly: false
                    });
                    if (error) {
                        return sendValidationError(res, error, 'body');
                    }
                    req.body = value;
                }
            }
            logger.debug('Request validation passed', {
                method: req.method,
                path: req.path,
                hasBody: !!req.body,
                queryParams: Object.keys(req.query).length,
                pathParams: Object.keys(req.params).length
            });
            next();
        }
        catch (error) {
            logger.error('Validation middleware error:', error);
            const validationError = errorManager.createError('VALIDATION_ERROR', 'Request validation failed', 'validation', 'medium', { method: req.method, path: req.path }, error);
            errorManager.handleError(validationError);
            res.status(500).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Internal validation error'
                }
            });
        }
    };
}
/**
 * Get query parameter validation schema for a route
 */
function getQuerySchema(path) {
    if (path.includes('/events')) {
        return exports.ValidationSchemas.query.events;
    }
    // Default list query schema for collection endpoints
    if (path.match(/\/api\/v\d+\/\w+$/) && !path.includes('/execute')) {
        return exports.ValidationSchemas.query.list;
    }
    return null;
}
/**
 * Get path parameter validation schema for a route
 */
function getParamSchema(path) {
    if (path.includes('/:id') && !path.includes('agents') && !path.includes('workflows')) {
        return exports.ValidationSchemas.params.id;
    }
    if (path.includes('/:agentId') || path.match(/\/agents\/[^/]+/)) {
        return exports.ValidationSchemas.params.agentId.keys({
            agentId: exports.ValidationSchemas.params.agentId.extract('agentId').optional(),
            id: joi_1.default.string().min(1).max(100).when('agentId', {
                is: joi_1.default.exist(),
                then: joi_1.default.forbidden(),
                otherwise: joi_1.default.required()
            })
        });
    }
    if (path.includes('/:workflowId') || path.match(/\/workflows\/[^/]+/)) {
        return exports.ValidationSchemas.params.workflowId.keys({
            workflowId: exports.ValidationSchemas.params.workflowId.extract('workflowId').optional(),
            id: joi_1.default.string().min(1).max(100).when('workflowId', {
                is: joi_1.default.exist(),
                then: joi_1.default.forbidden(),
                otherwise: joi_1.default.required()
            })
        });
    }
    if (path.includes('/:executionId')) {
        return exports.ValidationSchemas.params.executionId;
    }
    return null;
}
/**
 * Get request body validation schema for a route
 */
function getBodySchema(method, path) {
    // Agent endpoints
    if (path.match(/\/agents$/) && method === 'POST') {
        return exports.ValidationSchemas.agent.create;
    }
    if (path.match(/\/agents\/[^/]+$/) && ['PUT', 'PATCH'].includes(method)) {
        return exports.ValidationSchemas.agent.update;
    }
    if (path.match(/\/agents\/[^/]+\/execute$/) && method === 'POST') {
        return exports.ValidationSchemas.agent.execute;
    }
    // Workflow endpoints
    if (path.match(/\/workflows$/) && method === 'POST') {
        return exports.ValidationSchemas.workflow.create;
    }
    if (path.match(/\/workflows\/[^/]+\/execute$/) && method === 'POST') {
        return exports.ValidationSchemas.workflow.execute;
    }
    // Tool endpoints
    if (path.match(/\/tools$/) && method === 'POST') {
        return exports.ValidationSchemas.tool.register;
    }
    if (path.match(/\/tools\/[^/]+\/execute$/) && method === 'POST') {
        return exports.ValidationSchemas.tool.execute;
    }
    // Event endpoints
    if (path.match(/\/events$/) && method === 'POST') {
        return exports.ValidationSchemas.event.publish;
    }
    if (path.match(/\/events\/subscriptions$/) && method === 'POST') {
        return exports.ValidationSchemas.event.subscription;
    }
    return null;
}
/**
 * Send validation error response
 */
function sendValidationError(res, error, source) {
    const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
    }));
    res.status(400).json({
        success: false,
        error: {
            code: 'VALIDATION_ERROR',
            message: `Validation failed for ${source}`,
            details
        }
    });
}
/**
 * Custom validation helpers
 */
exports.ValidationHelpers = {
    /**
     * Validate UUID format
     */
    uuid: joi_1.default.string().pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
    /**
     * Validate resource limits format
     */
    resourceLimit: joi_1.default.string().pattern(/^\d+(m|Mi|Gi|Ki)?$/),
    /**
     * Validate cron expression
     */
    cronExpression: joi_1.default.string().pattern(/^(\*|([0-5]?\d))\s+(\*|([01]?\d|2[0-3]))\s+(\*|([01]?\d|3[01]))\s+(\*|([01]?\d))\s+(\*|([0-6]))$/),
    /**
     * Validate JSON schema
     */
    jsonSchema: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
    /**
     * Validate webhook URL
     */
    webhookUrl: joi_1.default.string().uri({ scheme: ['http', 'https'] }).max(2000)
};
//# sourceMappingURL=validation.js.map