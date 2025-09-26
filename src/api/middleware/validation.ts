/**
 * OpenConductor Request Validation Middleware
 * 
 * Comprehensive request validation using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';

/**
 * Validation schemas for different endpoints
 */
export const ValidationSchemas = {
  // Agent schemas
  agent: {
    create: Joi.object({
      name: Joi.string().required().min(1).max(100),
      type: Joi.string().required().valid('oracle', 'sage', 'sentinel', 'advisory', 'prediction', 'monitoring', 'custom'),
      version: Joi.string().required().pattern(/^\d+\.\d+\.\d+$/),
      description: Joi.string().max(500),
      config: Joi.object({
        capabilities: Joi.array().items(Joi.string()).required(),
        tools: Joi.array().items(Joi.string()).default([]),
        memory: Joi.object({
          type: Joi.string().valid('persistent', 'ephemeral').default('persistent'),
          store: Joi.string().valid('redis', 'postgresql', 'memory').default('redis'),
          ttl: Joi.number().integer().min(0),
          maxSize: Joi.number().integer().min(1)
        }).required(),
        resources: Joi.object({
          cpu: Joi.string().pattern(/^\d+m?$/),
          memory: Joi.string().pattern(/^\d+(Mi|Gi|Ki)$/),
          storage: Joi.string().pattern(/^\d+(Mi|Gi|Ki)$/)
        })
      }).required()
    }),

    update: Joi.object({
      name: Joi.string().min(1).max(100),
      description: Joi.string().max(500),
      config: Joi.object({
        capabilities: Joi.array().items(Joi.string()),
        tools: Joi.array().items(Joi.string()),
        memory: Joi.object({
          type: Joi.string().valid('persistent', 'ephemeral'),
          store: Joi.string().valid('redis', 'postgresql', 'memory'),
          ttl: Joi.number().integer().min(0),
          maxSize: Joi.number().integer().min(1)
        }),
        resources: Joi.object({
          cpu: Joi.string().pattern(/^\d+m?$/),
          memory: Joi.string().pattern(/^\d+(Mi|Gi|Ki)$/),
          storage: Joi.string().pattern(/^\d+(Mi|Gi|Ki)$/)
        })
      })
    }).min(1),

    execute: Joi.object({
      input: Joi.alternatives().try(
        Joi.object(),
        Joi.array(),
        Joi.string(),
        Joi.number(),
        Joi.boolean()
      ).required(),
      options: Joi.object({
        timeout: Joi.number().integer().min(1000).max(300000),
        priority: Joi.string().valid('low', 'normal', 'high'),
        callback: Joi.string().uri()
      })
    })
  },

  // Workflow schemas
  workflow: {
    create: Joi.object({
      name: Joi.string().required().min(1).max(100),
      description: Joi.string().max(500),
      version: Joi.string().required().pattern(/^\d+\.\d+\.\d+$/),
      strategy: Joi.string().required().valid('sequential', 'parallel', 'conditional', 'event-driven'),
      steps: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          type: Joi.string().required().valid('agent', 'tool', 'condition', 'parallel', 'sequential'),
          config: Joi.object().required(),
          dependencies: Joi.array().items(Joi.string()).default([]),
          retryPolicy: Joi.object({
            maxRetries: Joi.number().integer().min(0).max(10),
            backoffStrategy: Joi.string().valid('linear', 'exponential'),
            initialDelay: Joi.number().integer().min(100)
          })
        })
      ).min(1).required(),
      triggers: Joi.array().items(
        Joi.object({
          type: Joi.string().required().valid('manual', 'schedule', 'event', 'webhook'),
          config: Joi.object().required()
        })
      ).default([])
    }),

    execute: Joi.object({
      input: Joi.alternatives().try(
        Joi.object(),
        Joi.array(),
        Joi.string(),
        Joi.number(),
        Joi.boolean()
      ),
      options: Joi.object({
        timeout: Joi.number().integer().min(1000).max(1800000), // 30 minutes max
        priority: Joi.string().valid('low', 'normal', 'high'),
        callback: Joi.string().uri()
      })
    })
  },

  // Tool schemas
  tool: {
    register: Joi.object({
      name: Joi.string().required().min(1).max(100),
      type: Joi.string().required().valid('function', 'api', 'database', 'file', 'custom'),
      version: Joi.string().required().pattern(/^\d+\.\d+\.\d+$/),
      description: Joi.string().required().max(500),
      config: Joi.object({
        operations: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            description: Joi.string().required(),
            parameters: Joi.object(),
            returns: Joi.object()
          })
        ).min(1).required(),
        authentication: Joi.object({
          type: Joi.string().valid('none', 'api-key', 'bearer', 'basic'),
          config: Joi.object()
        }),
        rateLimit: Joi.object({
          requests: Joi.number().integer().min(1),
          window: Joi.number().integer().min(1000)
        })
      }).required()
    }),

    execute: Joi.object({
      operation: Joi.string().required(),
      parameters: Joi.object().default({}),
      options: Joi.object({
        timeout: Joi.number().integer().min(1000).max(30000),
        retries: Joi.number().integer().min(0).max(3)
      })
    })
  },

  // Event schemas
  event: {
    publish: Joi.object({
      type: Joi.string().required().min(1).max(100),
      source: Joi.string().required().min(1).max(100),
      data: Joi.alternatives().try(
        Joi.object(),
        Joi.array(),
        Joi.string(),
        Joi.number(),
        Joi.boolean()
      ).required(),
      priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
      target: Joi.string(),
      metadata: Joi.object()
    }),

    subscription: Joi.object({
      filter: Joi.object({
        types: Joi.array().items(Joi.string()),
        sources: Joi.array().items(Joi.string()),
        agentId: Joi.string(),
        workflowId: Joi.string(),
        since: Joi.date().iso(),
        until: Joi.date().iso(),
        data: Joi.object()
      }),
      endpoint: Joi.string().uri().required(),
      active: Joi.boolean().default(true)
    })
  },

  // Query parameter schemas
  query: {
    list: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sort: Joi.string().max(50),
      order: Joi.string().valid('asc', 'desc').default('desc'),
      search: Joi.string().max(100),
      filter: Joi.string().max(500)
    }),

    events: Joi.object({
      types: Joi.string(), // Comma-separated list
      sources: Joi.string(), // Comma-separated list
      agentId: Joi.string(),
      workflowId: Joi.string(),
      since: Joi.date().iso(),
      until: Joi.date().iso(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(1000).default(100)
    })
  },

  // Parameter schemas
  params: {
    id: Joi.object({
      id: Joi.string().required().min(1).max(100)
    }),

    agentId: Joi.object({
      agentId: Joi.string().required().min(1).max(100)
    }),

    workflowId: Joi.object({
      workflowId: Joi.string().required().min(1).max(100)
    }),

    executionId: Joi.object({
      executionId: Joi.string().required().min(1).max(100)
    })
  }
};

/**
 * Create validation middleware
 */
export function createValidationMiddleware(
  logger: Logger,
  errorManager: ErrorManager
) {
  return (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      logger.error('Validation middleware error:', error);
      
      const validationError = errorManager.createError(
        'VALIDATION_ERROR',
        'Request validation failed',
        'validation',
        'medium',
        { method: req.method, path: req.path },
        error as Error
      );
      
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
function getQuerySchema(path: string): Joi.ObjectSchema | null {
  if (path.includes('/events')) {
    return ValidationSchemas.query.events;
  }
  
  // Default list query schema for collection endpoints
  if (path.match(/\/api\/v\d+\/\w+$/) && !path.includes('/execute')) {
    return ValidationSchemas.query.list;
  }

  return null;
}

/**
 * Get path parameter validation schema for a route
 */
function getParamSchema(path: string): Joi.ObjectSchema | null {
  if (path.includes('/:id') && !path.includes('agents') && !path.includes('workflows')) {
    return ValidationSchemas.params.id;
  }
  
  if (path.includes('/:agentId') || path.match(/\/agents\/[^/]+/)) {
    return ValidationSchemas.params.agentId.keys({
      agentId: ValidationSchemas.params.agentId.extract('agentId').optional(),
      id: Joi.string().min(1).max(100).when('agentId', {
        is: Joi.exist(),
        then: Joi.forbidden(),
        otherwise: Joi.required()
      })
    });
  }
  
  if (path.includes('/:workflowId') || path.match(/\/workflows\/[^/]+/)) {
    return ValidationSchemas.params.workflowId.keys({
      workflowId: ValidationSchemas.params.workflowId.extract('workflowId').optional(),
      id: Joi.string().min(1).max(100).when('workflowId', {
        is: Joi.exist(),
        then: Joi.forbidden(),
        otherwise: Joi.required()
      })
    });
  }
  
  if (path.includes('/:executionId')) {
    return ValidationSchemas.params.executionId;
  }

  return null;
}

/**
 * Get request body validation schema for a route
 */
function getBodySchema(method: string, path: string): Joi.ObjectSchema | null {
  // Agent endpoints
  if (path.match(/\/agents$/) && method === 'POST') {
    return ValidationSchemas.agent.create;
  }
  
  if (path.match(/\/agents\/[^/]+$/) && ['PUT', 'PATCH'].includes(method)) {
    return ValidationSchemas.agent.update;
  }
  
  if (path.match(/\/agents\/[^/]+\/execute$/) && method === 'POST') {
    return ValidationSchemas.agent.execute;
  }

  // Workflow endpoints
  if (path.match(/\/workflows$/) && method === 'POST') {
    return ValidationSchemas.workflow.create;
  }
  
  if (path.match(/\/workflows\/[^/]+\/execute$/) && method === 'POST') {
    return ValidationSchemas.workflow.execute;
  }

  // Tool endpoints
  if (path.match(/\/tools$/) && method === 'POST') {
    return ValidationSchemas.tool.register;
  }
  
  if (path.match(/\/tools\/[^/]+\/execute$/) && method === 'POST') {
    return ValidationSchemas.tool.execute;
  }

  // Event endpoints
  if (path.match(/\/events$/) && method === 'POST') {
    return ValidationSchemas.event.publish;
  }
  
  if (path.match(/\/events\/subscriptions$/) && method === 'POST') {
    return ValidationSchemas.event.subscription;
  }

  return null;
}

/**
 * Send validation error response
 */
function sendValidationError(
  res: Response,
  error: Joi.ValidationError,
  source: 'query' | 'params' | 'body'
): void {
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
export const ValidationHelpers = {
  /**
   * Validate UUID format
   */
  uuid: Joi.string().pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i),

  /**
   * Validate resource limits format
   */
  resourceLimit: Joi.string().pattern(/^\d+(m|Mi|Gi|Ki)?$/),

  /**
   * Validate cron expression
   */
  cronExpression: Joi.string().pattern(/^(\*|([0-5]?\d))\s+(\*|([01]?\d|2[0-3]))\s+(\*|([01]?\d|3[01]))\s+(\*|([01]?\d))\s+(\*|([0-6]))$/),

  /**
   * Validate JSON schema
   */
  jsonSchema: Joi.object().pattern(Joi.string(), Joi.any()),

  /**
   * Validate webhook URL
   */
  webhookUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(2000)
};