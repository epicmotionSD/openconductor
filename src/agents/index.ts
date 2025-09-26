/**
 * OpenConductor Agents Module Exports
 * 
 * Trinity-inspired agent implementations and base classes
 */

// Base agent class
export { BaseAgent } from './base-agent';

// Trinity AI pattern agents
export { PredictionAgent } from './prediction-agent';
export { MonitoringAgent } from './monitoring-agent';
export { AdvisoryAgent } from './advisory-agent';

// Trinity AI Reference Implementation Agents
export { OracleAgent } from './oracle-agent';
export { SentinelAgent } from './sentinel-agent';
export { SageAgent } from './sage-agent';

// Re-export agent types
export * from '../types/agent';