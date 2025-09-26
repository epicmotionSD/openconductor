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
export declare const ValidationSchemas: {
    agent: {
        create: Joi.ObjectSchema<any>;
        update: Joi.ObjectSchema<any>;
        execute: Joi.ObjectSchema<any>;
    };
    workflow: {
        create: Joi.ObjectSchema<any>;
        execute: Joi.ObjectSchema<any>;
    };
    tool: {
        register: Joi.ObjectSchema<any>;
        execute: Joi.ObjectSchema<any>;
    };
    event: {
        publish: Joi.ObjectSchema<any>;
        subscription: Joi.ObjectSchema<any>;
    };
    query: {
        list: Joi.ObjectSchema<any>;
        events: Joi.ObjectSchema<any>;
    };
    params: {
        id: Joi.ObjectSchema<any>;
        agentId: Joi.ObjectSchema<any>;
        workflowId: Joi.ObjectSchema<any>;
        executionId: Joi.ObjectSchema<any>;
    };
};
/**
 * Create validation middleware
 */
export declare function createValidationMiddleware(logger: Logger, errorManager: ErrorManager): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Custom validation helpers
 */
export declare const ValidationHelpers: {
    /**
     * Validate UUID format
     */
    uuid: Joi.StringSchema<string>;
    /**
     * Validate resource limits format
     */
    resourceLimit: Joi.StringSchema<string>;
    /**
     * Validate cron expression
     */
    cronExpression: Joi.StringSchema<string>;
    /**
     * Validate JSON schema
     */
    jsonSchema: Joi.ObjectSchema<any>;
    /**
     * Validate webhook URL
     */
    webhookUrl: Joi.StringSchema<string>;
};
//# sourceMappingURL=validation.d.ts.map