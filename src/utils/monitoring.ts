/**
 * OpenConductor Backend Monitoring Service
 * Sentry error tracking and performance monitoring for Node.js backend
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';
import { backendSentryConfig } from '../../monitoring/sentry-config.js';

/**
 * Initialize Sentry for backend monitoring
 */
export const initializeBackendMonitoring = () => {
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn('⚠️ Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    ...backendSentryConfig,
    integrations: [
      // Enable HTTP instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express instrumentation
      new Sentry.Integrations.Express({ app: undefined }),
      // Enable Prisma instrumentation if using Prisma
      // new Sentry.Integrations.Prisma({ client: prisma }),
      // Enable profiling
      new ProfilingIntegration(),
    ],
    
    // Custom error handler
    beforeSend: (event, hint) => {
      const baseResult = backendSentryConfig.beforeSend?.(event, hint);
      if (!baseResult) return null;
      
      // Add additional backend context
      if (event.request) {
        // Sanitize sensitive data
        if (event.request.headers?.authorization) {
          event.request.headers.authorization = '[Filtered]';
        }
        if (event.request.headers?.cookie) {
          event.request.headers.cookie = '[Filtered]';
        }
      }
      
      return event;
    }
  });

  console.log('✅ Backend monitoring initialized');
};

/**
 * Setup Express.js middleware for Sentry
 */
export const setupExpressMonitoring = (app: Express) => {
  // Request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler({
    keys: ['cookies', 'data', 'headers', 'method', 'query_string', 'url'],
    user: ['id', 'email', 'subscription']
  }));

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // Error handler must be registered after all other middleware and routes
  // This should be added after all routes but before other error handlers
  return {
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all 4xx and 5xx errors
        return error.status >= 400;
      }
    })
  };
};

/**
 * Track custom backend events
 */
export const trackBackendEvent = (eventName: string, data?: any, level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    message: eventName,
    data,
    level,
    category: 'backend-event'
  });
};

/**
 * Track database operations
 */
export const trackDatabaseOperation = (operation: string, table: string, duration?: number, success = true) => {
  Sentry.addBreadcrumb({
    message: `DB ${operation}: ${table}`,
    data: { duration, success },
    level: success ? 'info' : 'error',
    category: 'database'
  });
  
  if (duration) {
    Sentry.setMeasurement(`db_${operation}_${table}`, duration, 'millisecond');
  }
};

/**
 * Track MCP server operations
 */
export const trackMCPOperation = (serverId: string, operation: string, success: boolean, metadata?: any) => {
  const level = success ? 'info' : 'error';
  
  Sentry.addBreadcrumb({
    message: `MCP ${serverId}: ${operation}`,
    data: { success, ...metadata },
    level,
    category: 'mcp-server'
  });
  
  if (!success) {
    Sentry.captureMessage(`MCP operation failed: ${operation}`, {
      tags: {
        server_id: serverId,
        operation,
        success: success.toString()
      },
      extra: metadata
    });
  }
};

/**
 * Track workflow execution on backend
 */
export const trackWorkflowBackend = (workflowId: string, status: string, userId?: string, metadata?: any) => {
  const level = status === 'failed' ? 'error' : 'info';
  
  Sentry.addBreadcrumb({
    message: `Workflow ${workflowId}: ${status}`,
    data: { userId, ...metadata },
    level,
    category: 'workflow-backend'
  });
  
  if (status === 'failed') {
    Sentry.captureException(new Error(`Workflow execution failed: ${workflowId}`), {
      tags: {
        workflow_id: workflowId,
        user_id: userId,
        status
      },
      extra: metadata
    });
  }
};

/**
 * Track Trinity AI agent operations
 */
export const trackTrinityBackend = (agentType: 'oracle' | 'sentinel' | 'sage', operation: string, success: boolean, data?: any) => {
  const level = success ? 'info' : 'error';
  
  Sentry.addBreadcrumb({
    message: `Trinity ${agentType}: ${operation}`,
    data: { success, ...data },
    level,
    category: 'trinity-backend'
  });
  
  // Set custom metrics for Trinity AI performance
  if (data?.responseTime) {
    Sentry.setMeasurement(`trinity_${agentType}_response_time`, data.responseTime, 'millisecond');
  }
  
  if (data?.confidence) {
    Sentry.setMeasurement(`trinity_${agentType}_confidence`, data.confidence, 'percent');
  }
};

/**
 * Track API performance
 */
export const trackAPIPerformance = (endpoint: string, method: string, duration: number, statusCode: number) => {
  Sentry.addBreadcrumb({
    message: `API ${method} ${endpoint}`,
    data: { duration, statusCode },
    level: statusCode >= 400 ? 'error' : 'info',
    category: 'api-performance'
  });
  
  // Set performance measurements
  Sentry.setMeasurement(`api_${method.toLowerCase()}_duration`, duration, 'millisecond');
  
  // Track API health
  const isHealthy = statusCode < 400;
  Sentry.setTag('api_health', isHealthy ? 'healthy' : 'unhealthy');
};

/**
 * Track Stripe webhook events
 */
export const trackStripeWebhook = (eventType: string, success: boolean, metadata?: any) => {
  const level = success ? 'info' : 'error';
  
  Sentry.addBreadcrumb({
    message: `Stripe webhook: ${eventType}`,
    data: { success, ...metadata },
    level,
    category: 'stripe'
  });
  
  if (!success) {
    Sentry.captureMessage(`Stripe webhook failed: ${eventType}`, {
      tags: {
        stripe_event: eventType,
        success: success.toString()
      },
      extra: metadata
    });
  }
};

/**
 * Track authentication events
 */
export const trackAuthEvent = (event: string, userId?: string, success = true, metadata?: any) => {
  const level = success ? 'info' : 'warning';
  
  Sentry.addBreadcrumb({
    message: `Auth: ${event}`,
    data: { userId, success, ...metadata },
    level,
    category: 'authentication'
  });
  
  if (!success && event === 'login_failed') {
    Sentry.captureMessage(`Authentication failed: ${event}`, {
      tags: {
        auth_event: event,
        user_id: userId
      },
      extra: metadata
    });
  }
};

/**
 * Set user context for backend
 */
export const setBackendUserContext = (user: { id: string; email?: string; subscription?: any; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    subscription: user.subscription?.plan,
    role: user.role
  });
};

/**
 * Clear user context
 */
export const clearBackendUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Capture backend errors with context
 */
export const captureBackendError = (error: Error, context?: {
  userId?: string;
  endpoint?: string;
  operation?: string;
  metadata?: any;
}) => {
  Sentry.captureException(error, {
    tags: {
      handled: true,
      service: 'backend',
      endpoint: context?.endpoint,
      operation: context?.operation
    },
    user: context?.userId ? { id: context.userId } : undefined,
    extra: context?.metadata
  });
};

/**
 * Start backend transaction
 */
export const startBackendTransaction = (name: string, description?: string, metadata?: any) => {
  return Sentry.startTransaction({
    name,
    description,
    tags: {
      component: 'backend',
      service: 'api',
      ...metadata
    }
  });
};

/**
 * Monitor critical system metrics
 */
export const trackSystemMetrics = (metrics: {
  memoryUsage?: number;
  cpuUsage?: number;
  activeConnections?: number;
  databaseConnections?: number;
}) => {
  // Set system measurements
  if (metrics.memoryUsage) {
    Sentry.setMeasurement('system_memory_usage', metrics.memoryUsage, 'byte');
  }
  
  if (metrics.cpuUsage) {
    Sentry.setMeasurement('system_cpu_usage', metrics.cpuUsage, 'percent');
  }
  
  if (metrics.activeConnections) {
    Sentry.setMeasurement('system_active_connections', metrics.activeConnections, 'none');
  }
  
  if (metrics.databaseConnections) {
    Sentry.setMeasurement('system_db_connections', metrics.databaseConnections, 'none');
  }
};

// Export all monitoring functions
export default {
  initializeBackendMonitoring,
  setupExpressMonitoring,
  trackBackendEvent,
  trackDatabaseOperation,
  trackMCPOperation,
  trackWorkflowBackend,
  trackTrinityBackend,
  trackAPIPerformance,
  trackStripeWebhook,
  trackAuthEvent,
  setBackendUserContext,
  clearBackendUserContext,
  captureBackendError,
  startBackendTransaction,
  trackSystemMetrics
};