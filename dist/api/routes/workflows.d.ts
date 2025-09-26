/**
 * OpenConductor Workflow Management API Routes
 *
 * REST endpoints for managing workflows - create, read, update, delete, execute
 */
import { Router } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
/**
 * Create workflow management routes
 */
export declare function createWorkflowRoutes(conductor: OpenConductor, logger: Logger, errorManager: ErrorManager): Router;
//# sourceMappingURL=workflows.d.ts.map