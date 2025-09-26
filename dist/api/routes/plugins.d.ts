/**
 * OpenConductor Plugin Management API Routes
 *
 * REST endpoints for managing plugins - install, activate, configure
 */
import { Router } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
/**
 * Create plugin management routes
 */
export declare function createPluginRoutes(conductor: OpenConductor, logger: Logger, errorManager: ErrorManager): Router;
//# sourceMappingURL=plugins.d.ts.map