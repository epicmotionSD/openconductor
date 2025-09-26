/**
 * OpenConductor Event Management API Routes
 *
 * REST endpoints for managing events, subscriptions, and real-time coordination
 */
import { Router } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
/**
 * Create event management routes
 */
export declare function createEventRoutes(conductor: OpenConductor, logger: Logger, errorManager: ErrorManager): Router;
//# sourceMappingURL=events.d.ts.map