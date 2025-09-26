/**
 * OpenConductor System Management API Routes
 *
 * REST endpoints for system health, metrics, status, and maintenance
 */
import { Router } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
/**
 * Create system management routes
 */
export declare function createSystemRoutes(conductor: OpenConductor, logger: Logger, errorManager: ErrorManager): Router;
//# sourceMappingURL=system.d.ts.map