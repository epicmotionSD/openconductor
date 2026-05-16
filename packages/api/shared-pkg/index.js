"use strict";
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
exports.MCP_PROTOCOL = exports.VERSION = void 0;
exports.VERSION = '1.0.0';
exports.MCP_PROTOCOL = 'stdio';
// Re-export all types and constants from types.ts
__exportStar(require("./types"), exports);
// Re-export ecosystem analytics types
__exportStar(require("./ecosystem-analytics"), exports);
// Re-export project configuration
__exportStar(require("./config"), exports);
// Re-export Board of Directors agent types
__exportStar(require("./agents"), exports);
