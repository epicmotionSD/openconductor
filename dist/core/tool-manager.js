"use strict";
/**
 * Tool Manager (Legacy Compatibility)
 *
 * Compatibility wrapper for ToolRegistry
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const tool_registry_1 = require("./tool-registry");
class ToolManager extends tool_registry_1.ToolRegistry {
    constructor(logger, errorManager, eventBus) {
        super(logger, errorManager, eventBus);
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=tool-manager.js.map