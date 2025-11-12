export const VERSION = '1.0.0';
export const MCP_PROTOCOL = 'stdio';
export type MCPTransport = 'stdio' | 'websocket' | 'http';

// Error codes for API responses
export const ErrorCodes = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SERVER_DETAIL: 300, // 5 minutes
  SERVER_LIST: 60, // 1 minute
  SEARCH_RESULTS: 120, // 2 minutes
  TRENDING: 300, // 5 minutes
  STATS: 180, // 3 minutes
} as const;
