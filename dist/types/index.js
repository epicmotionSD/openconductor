"use strict";
/**
 * OpenConductor Core Types
 *
 * Foundational type definitions for the OpenConductor platform,
 * inspired by Trinity AI patterns (Oracle, Sentinel, Sage) but generalized
 * for broader agent orchestration use cases.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = exports.SystemError = exports.RateLimitError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.PluginError = exports.OrchestrationError = exports.AgentError = exports.OpenConductorError = void 0;
// Error types
var errors_1 = require("./errors");
Object.defineProperty(exports, "OpenConductorError", { enumerable: true, get: function () { return errors_1.OpenConductorError; } });
Object.defineProperty(exports, "AgentError", { enumerable: true, get: function () { return errors_1.AgentError; } });
Object.defineProperty(exports, "OrchestrationError", { enumerable: true, get: function () { return errors_1.OrchestrationError; } });
Object.defineProperty(exports, "PluginError", { enumerable: true, get: function () { return errors_1.PluginError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return errors_1.AuthenticationError; } });
Object.defineProperty(exports, "AuthorizationError", { enumerable: true, get: function () { return errors_1.AuthorizationError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_1.RateLimitError; } });
Object.defineProperty(exports, "SystemError", { enumerable: true, get: function () { return errors_1.SystemError; } });
Object.defineProperty(exports, "ConfigurationError", { enumerable: true, get: function () { return errors_1.ConfigurationError; } });
//# sourceMappingURL=index.js.map