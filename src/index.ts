/**
 * OpenConductor - The Universal Conductor for Your AI Agents
 * 
 * "Orchestrating the Future of Enterprise AI"
 * 
 * Main entry point for the OpenConductor platform.
 * Provides the primary API for creating and managing AI agent orchestration.
 */

// Selective exports to avoid conflicts
export * from './types';
export * from './core';
export * from './agents';
export * from './utils';

// Selective orchestration exports to avoid conflicts
export {
  OrchestrationEngineImpl,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  StepExecution,
  WorkflowEvent,
  EngineHealthStatus,
  EngineMetrics
} from './orchestration';

// Selective API exports to avoid conflicts
export {
  OpenConductorClient,
  WebSocketClient,
  APIResponse
} from './api';

// Core exports
export { OpenConductor } from './core/conductor';
export { AgentRuntime } from './core/agent-runtime';
export { EventBusImpl } from './core/event-bus';

// Agent base classes (Trinity AI patterns)
export { BaseAgent } from './agents/base-agent';
export { PredictionAgent } from './agents/prediction-agent';
export { MonitoringAgent } from './agents/monitoring-agent';
export { AdvisoryAgent } from './agents/advisory-agent';

// Tool system
export { ToolRegistry } from './core/tool-registry';
export { ToolManager } from './core/tool-manager';

// Plugin system
export { PluginManager } from './core/plugin-manager';

// API clients
export { OpenConductorAPIClient } from './api/client';
export { OpenConductorWebSocketClient } from './api/websocket-client';

// Utilities
export { ConfigManager } from './utils/config-manager';
export { Logger } from './utils/logger';
export { ErrorManager } from './utils/error-manager';

// Default configuration
export { DEFAULT_CONFIG } from './types/config';

/**
 * Quick start function for development
 * 
 * Creates a new OpenConductor instance with default configuration
 */
export async function createOpenConductor(config?: Partial<import('./types').OpenConductorConfig>) {
  const { OpenConductor } = await import('./core/conductor');
  return new OpenConductor(config);
}

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date('2024-01-01');
export const DESCRIPTION = 'The Universal Conductor for Your AI Agents';

/**
 * Feature flags
 */
export const FEATURES = {
  ENTERPRISE: false,
  PLUGINS: true,
  WEBSOCKETS: true,
  GRAPHQL: true,
  MONITORING: true,
  EVENTS: true,
} as const;

/**
 * Brand information
 */
export const BRAND = {
  NAME: 'OpenConductor.ai',
  TAGLINE: 'Orchestrating the Future of Enterprise AI',
  MOTTO: 'Open Orchestration. Sovereign Control.',
  DESCRIPTION: 'The Universal Conductor for Your AI Agents',
} as const;