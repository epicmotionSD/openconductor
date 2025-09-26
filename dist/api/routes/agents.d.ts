/**
 * OpenConductor Agent Management API Routes
 *
 * REST endpoints for managing AI agents - create, read, update, delete, execute
 */
import { Router } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
/**
 * Create agent management routes
 */
export declare function createAgentRoutes(conductor: OpenConductor, logger: Logger, errorManager: ErrorManager): Router;
//# sourceMappingURL=agents.d.ts.map