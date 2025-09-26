/**
 * Tool Manager (Legacy Compatibility)
 * 
 * Compatibility wrapper for ToolRegistry
 */

import { ToolRegistry } from './tool-registry';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export class ToolManager extends ToolRegistry {
  constructor(logger: Logger, errorManager: ErrorManager, eventBus: EventBus) {
    super(logger, errorManager, eventBus);
  }
}