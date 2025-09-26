/**
 * OpenConductor Tool Management API Routes
 *
 * REST endpoints for managing tools - register, execute, health checks
 */
import { Router } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
/**
 * Create tool management routes
 */
export declare function createToolRoutes(conductor: OpenConductor, logger: Logger, errorManager: ErrorManager): Router;
//# sourceMappingURL=tools.d.ts.map