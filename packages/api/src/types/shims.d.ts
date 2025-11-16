/* Module shims and project-specific ambient types to help the TypeScript build
   progress in environments where some packages may not ship type declarations
   or where we augment existing types (Express.Request). */

declare module 'better-sqlite3';
declare module 'express-validator';

// Some OpenTelemetry packages may not have ambient types resolved in older setups
declare module '@opentelemetry/auto-instrumentations-node';
declare module '@opentelemetry/exporter-trace-otlp-http';

// Extend Express Request with project-specific runtime-added properties
declare namespace Express {
  export interface Request {
    apiKey?: any;
    user?: any;
    rawBody?: any;
    requestId?: string;
    adminKey?: any;
  }
}

export {};
