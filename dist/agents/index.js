"use strict";
/**
 * OpenConductor Agents Module Exports
 *
 * Trinity-inspired agent implementations and base classes
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SageAgent = exports.SentinelAgent = exports.OracleAgent = exports.AdvisoryAgent = exports.MonitoringAgent = exports.PredictionAgent = exports.BaseAgent = void 0;
// Base agent class
var base_agent_1 = require("./base-agent");
Object.defineProperty(exports, "BaseAgent", { enumerable: true, get: function () { return base_agent_1.BaseAgent; } });
// Trinity AI pattern agents
var prediction_agent_1 = require("./prediction-agent");
Object.defineProperty(exports, "PredictionAgent", { enumerable: true, get: function () { return prediction_agent_1.PredictionAgent; } });
var monitoring_agent_1 = require("./monitoring-agent");
Object.defineProperty(exports, "MonitoringAgent", { enumerable: true, get: function () { return monitoring_agent_1.MonitoringAgent; } });
var advisory_agent_1 = require("./advisory-agent");
Object.defineProperty(exports, "AdvisoryAgent", { enumerable: true, get: function () { return advisory_agent_1.AdvisoryAgent; } });
// Trinity AI Reference Implementation Agents
var oracle_agent_1 = require("./oracle-agent");
Object.defineProperty(exports, "OracleAgent", { enumerable: true, get: function () { return oracle_agent_1.OracleAgent; } });
var sentinel_agent_1 = require("./sentinel-agent");
Object.defineProperty(exports, "SentinelAgent", { enumerable: true, get: function () { return sentinel_agent_1.SentinelAgent; } });
var sage_agent_1 = require("./sage-agent");
Object.defineProperty(exports, "SageAgent", { enumerable: true, get: function () { return sage_agent_1.SageAgent; } });
// Re-export agent types
__exportStar(require("../types/agent"), exports);
//# sourceMappingURL=index.js.map