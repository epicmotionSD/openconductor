/**
 * OpenConductor Registry API Routes
 *
 * REST endpoints for agent registry, discovery, and marketplace features
 */
import { Router } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
/**
 * Create registry management routes
 */
export declare function createRegistryRoutes(conductor: OpenConductor, logger: Logger, errorManager: ErrorManager): Router;
//# sourceMappingURL=registry.d.ts.map