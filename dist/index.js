"use strict";
/**
 * OpenConductor - The Universal Conductor for Your AI Agents
 *
 * "Orchestrating the Future of Enterprise AI"
 *
 * Main entry point for the OpenConductor platform.
 * Provides the primary API for creating and managing AI agent orchestration.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAND = exports.FEATURES = exports.DESCRIPTION = exports.BUILD_DATE = exports.VERSION = exports.DEFAULT_CONFIG = exports.ErrorManager = exports.Logger = exports.ConfigManager = exports.OpenConductorWebSocketClient = exports.OpenConductorAPIClient = exports.PluginManager = exports.ToolManager = exports.ToolRegistry = exports.AdvisoryAgent = exports.MonitoringAgent = exports.PredictionAgent = exports.BaseAgent = exports.EventBusImpl = exports.AgentRuntime = exports.OpenConductor = exports.OrchestrationEngineImpl = void 0;
exports.createOpenConductor = createOpenConductor;
// Selective exports to avoid conflicts
__exportStar(require("./types"), exports);
__exportStar(require("./core"), exports);
__exportStar(require("./agents"), exports);
__exportStar(require("./utils"), exports);
// Selective orchestration exports to avoid conflicts
var orchestration_1 = require("./orchestration");
Object.defineProperty(exports, "OrchestrationEngineImpl", { enumerable: true, get: function () { return orchestration_1.OrchestrationEngineImpl; } });
// Core exports
var conductor_1 = require("./core/conductor");
Object.defineProperty(exports, "OpenConductor", { enumerable: true, get: function () { return conductor_1.OpenConductor; } });
var agent_runtime_1 = require("./core/agent-runtime");
Object.defineProperty(exports, "AgentRuntime", { enumerable: true, get: function () { return agent_runtime_1.AgentRuntime; } });
var event_bus_1 = require("./core/event-bus");
Object.defineProperty(exports, "EventBusImpl", { enumerable: true, get: function () { return event_bus_1.EventBusImpl; } });
// Agent base classes (Trinity AI patterns)
var base_agent_1 = require("./agents/base-agent");
Object.defineProperty(exports, "BaseAgent", { enumerable: true, get: function () { return base_agent_1.BaseAgent; } });
var prediction_agent_1 = require("./agents/prediction-agent");
Object.defineProperty(exports, "PredictionAgent", { enumerable: true, get: function () { return prediction_agent_1.PredictionAgent; } });
var monitoring_agent_1 = require("./agents/monitoring-agent");
Object.defineProperty(exports, "MonitoringAgent", { enumerable: true, get: function () { return monitoring_agent_1.MonitoringAgent; } });
var advisory_agent_1 = require("./agents/advisory-agent");
Object.defineProperty(exports, "AdvisoryAgent", { enumerable: true, get: function () { return advisory_agent_1.AdvisoryAgent; } });
// Tool system
var tool_registry_1 = require("./core/tool-registry");
Object.defineProperty(exports, "ToolRegistry", { enumerable: true, get: function () { return tool_registry_1.ToolRegistry; } });
var tool_manager_1 = require("./core/tool-manager");
Object.defineProperty(exports, "ToolManager", { enumerable: true, get: function () { return tool_manager_1.ToolManager; } });
// Plugin system
var plugin_manager_1 = require("./core/plugin-manager");
Object.defineProperty(exports, "PluginManager", { enumerable: true, get: function () { return plugin_manager_1.PluginManager; } });
// API clients
var client_1 = require("./api/client");
Object.defineProperty(exports, "OpenConductorAPIClient", { enumerable: true, get: function () { return client_1.OpenConductorAPIClient; } });
var websocket_client_1 = require("./api/websocket-client");
Object.defineProperty(exports, "OpenConductorWebSocketClient", { enumerable: true, get: function () { return websocket_client_1.OpenConductorWebSocketClient; } });
// Utilities
var config_manager_1 = require("./utils/config-manager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_manager_1.ConfigManager; } });
var logger_1 = require("./utils/logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
var error_manager_1 = require("./utils/error-manager");
Object.defineProperty(exports, "ErrorManager", { enumerable: true, get: function () { return error_manager_1.ErrorManager; } });
// Default configuration
var config_1 = require("./types/config");
Object.defineProperty(exports, "DEFAULT_CONFIG", { enumerable: true, get: function () { return config_1.DEFAULT_CONFIG; } });
/**
 * Quick start function for development
 *
 * Creates a new OpenConductor instance with default configuration
 */
async function createOpenConductor(config) {
    const { OpenConductor } = await Promise.resolve().then(() => __importStar(require('./core/conductor')));
    return new OpenConductor(config);
}
/**
 * Version information
 */
exports.VERSION = '1.0.0';
exports.BUILD_DATE = new Date('2024-01-01');
exports.DESCRIPTION = 'The Universal Conductor for Your AI Agents';
/**
 * Feature flags
 */
exports.FEATURES = {
    ENTERPRISE: false,
    PLUGINS: true,
    WEBSOCKETS: true,
    GRAPHQL: true,
    MONITORING: true,
    EVENTS: true,
};
/**
 * Brand information
 */
exports.BRAND = {
    NAME: 'OpenConductor.ai',
    TAGLINE: 'Orchestrating the Future of Enterprise AI',
    MOTTO: 'Open Orchestration. Sovereign Control.',
    DESCRIPTION: 'The Universal Conductor for Your AI Agents',
};
//# sourceMappingURL=index.js.map