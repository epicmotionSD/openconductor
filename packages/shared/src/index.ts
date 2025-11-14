export const VERSION = '1.0.0';
export const MCP_PROTOCOL = 'stdio';
export type MCPTransport = 'stdio' | 'websocket' | 'http';

// Re-export all types and constants from types.ts
export * from './types';
