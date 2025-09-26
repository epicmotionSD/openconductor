/**
 * OpenConductor - The Universal Conductor for Your AI Agents
 *
 * "Orchestrating the Future of Enterprise AI"
 *
 * Main entry point for the OpenConductor platform.
 * Provides the primary API for creating and managing AI agent orchestration.
 */
export * from './types';
export * from './core';
export * from './agents';
export * from './utils';
export { OrchestrationEngineImpl, WorkflowDefinition, WorkflowExecution, WorkflowStep, StepExecution, WorkflowEvent, EngineHealthStatus, EngineMetrics } from './orchestration';
export { OpenConductorClient, WebSocketClient, APIResponse } from './api';
export { OpenConductor } from './core/conductor';
export { AgentRuntime } from './core/agent-runtime';
export { EventBusImpl } from './core/event-bus';
export { BaseAgent } from './agents/base-agent';
export { PredictionAgent } from './agents/prediction-agent';
export { MonitoringAgent } from './agents/monitoring-agent';
export { AdvisoryAgent } from './agents/advisory-agent';
export { ToolRegistry } from './core/tool-registry';
export { ToolManager } from './core/tool-manager';
export { PluginManager } from './core/plugin-manager';
export { OpenConductorAPIClient } from './api/client';
export { OpenConductorWebSocketClient } from './api/websocket-client';
export { ConfigManager } from './utils/config-manager';
export { Logger } from './utils/logger';
export { ErrorManager } from './utils/error-manager';
export { DEFAULT_CONFIG } from './types/config';
/**
 * Quick start function for development
 *
 * Creates a new OpenConductor instance with default configuration
 */
export declare function createOpenConductor(config?: Partial<import('./types').OpenConductorConfig>): Promise<import("./core").OpenConductor>;
/**
 * Version information
 */
export declare const VERSION = "1.0.0";
export declare const BUILD_DATE: Date;
export declare const DESCRIPTION = "The Universal Conductor for Your AI Agents";
/**
 * Feature flags
 */
export declare const FEATURES: {
    readonly ENTERPRISE: false;
    readonly PLUGINS: true;
    readonly WEBSOCKETS: true;
    readonly GRAPHQL: true;
    readonly MONITORING: true;
    readonly EVENTS: true;
};
/**
 * Brand information
 */
export declare const BRAND: {
    readonly NAME: "OpenConductor.ai";
    readonly TAGLINE: "Orchestrating the Future of Enterprise AI";
    readonly MOTTO: "Open Orchestration. Sovereign Control.";
    readonly DESCRIPTION: "The Universal Conductor for Your AI Agents";
};
//# sourceMappingURL=index.d.ts.map