/**
 * OpenConductor Frontend Monitoring Service
 * Sentry error tracking and performance monitoring integration
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Initialize Sentry for production monitoring
const initializeMonitoring = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  if (!sentryDsn) {
    console.warn('⚠️ Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: `openconductor-frontend@${appVersion}`,
    
    // Performance monitoring
    integrations: [
      new BrowserTracing({
        // Set sampling rates for performance monitoring
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.openconductor\.ai/,
          /^https:\/\/.*\.railway\.app/,
          /^https:\/\/.*\.supabase\.co/
        ],
      }),
      new Sentry.Replay({
        // Capture 10% of all sessions in production, 100% in development
        sessionSampleRate: environment === 'production' ? 0.1 : 1.0,
        // If the entire session is not captured, capture 100% of sessions with an error
        errorSampleRate: 1.0,
      }),
    ],
    
    // Performance monitoring sample rates
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out development-specific errors
      if (environment === 'development') {
        const error = hint.originalException;
        if (error && error.message) {
          // Ignore common development errors
          const ignoredPatterns = [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Network request failed',
            'Loading chunk'
          ];
          
          if (ignoredPatterns.some(pattern => error.message.includes(pattern))) {
            return null;
          }
        }
      }
      
      // Add custom tags and context
      event.tags = {
        ...event.tags,
        service: 'frontend',
        platform: 'web',
        deployment: 'vercel'
      };
      
      // Add user context if available
      const user = getCurrentUser();
      if (user) {
        event.user = {
          id: user.id,
          email: user.email,
          subscription: user.subscription?.plan
        };
      }
      
      return event;
    },
    
    // Initial scope configuration
    initialScope: {
      tags: {
        component: 'openconductor-frontend',
        version: appVersion
      }
    },
    
    // Debug mode for development
    debug: environment === 'development',
  });

  console.log('✅ Frontend monitoring initialized');
};

/**
 * Get current user for error context
 */
const getCurrentUser = () => {
  // TODO: Implement user context retrieval
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

/**
 * Track custom events
 */
export const trackEvent = (eventName: string, data?: any) => {
  Sentry.addBreadcrumb({
    message: eventName,
    data,
    level: 'info',
    category: 'user-action'
  });
};

/**
 * Track API calls
 */
export const trackApiCall = (endpoint: string, method: string, status?: number, duration?: number) => {
  Sentry.addBreadcrumb({
    message: `API ${method} ${endpoint}`,
    data: { status, duration },
    level: status && status >= 400 ? 'error' : 'info',
    category: 'http'
  });
};

/**
 * Track user interactions
 */
export const trackUserInteraction = (action: string, target?: string, metadata?: any) => {
  Sentry.addBreadcrumb({
    message: `User ${action}`,
    data: { target, ...metadata },
    level: 'info',
    category: 'ui'
  });
};

/**
 * Track Trinity AI agent activities
 */
export const trackTrinityAgent = (agentType: 'oracle' | 'sentinel' | 'sage', action: string, data?: any) => {
  Sentry.addBreadcrumb({
    message: `Trinity ${agentType}: ${action}`,
    data,
    level: 'info',
    category: 'trinity-ai'
  });
  
  // Also send as custom event
  Sentry.captureMessage(`Trinity ${agentType} ${action}`, {
    tags: {
      agent: agentType,
      action
    },
    extra: data
  });
};

/**
 * Track workflow executions
 */
export const trackWorkflowExecution = (workflowId: string, status: string, metadata?: any) => {
  const level = status === 'failed' ? 'error' : 'info';
  
  Sentry.addBreadcrumb({
    message: `Workflow ${workflowId}: ${status}`,
    data: metadata,
    level,
    category: 'workflow'
  });
  
  if (status === 'failed') {
    Sentry.captureMessage(`Workflow execution failed: ${workflowId}`, {
      tags: {
        workflow_id: workflowId,
        status
      },
      extra: metadata
    });
  }
};

/**
 * Track MCP server interactions
 */
export const trackMCPInteraction = (serverId: string, action: string, success: boolean, metadata?: any) => {
  const level = success ? 'info' : 'warning';
  
  Sentry.addBreadcrumb({
    message: `MCP ${serverId}: ${action}`,
    data: { success, ...metadata },
    level,
    category: 'mcp'
  });
};

/**
 * Track performance metrics
 */
export const trackPerformance = (metricName: string, value: number, unit?: string) => {
  Sentry.addBreadcrumb({
    message: `Performance: ${metricName}`,
    data: { value, unit },
    level: 'info',
    category: 'performance'
  });
  
  // Create custom measurement
  Sentry.setMeasurement(metricName, value, unit || 'millisecond');
};

/**
 * Set user context
 */
export const setUserContext = (user: { id: string; email?: string; subscription?: any }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    subscription: user.subscription?.plan
  });
};

/**
 * Clear user context (logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Capture handled errors
 */
export const captureError = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      handled: true
    }
  });
};

/**
 * Add context for debugging
 */
export const addContext = (key: string, value: any) => {
  Sentry.setContext(key, value);
};

/**
 * Create performance transaction
 */
export const startTransaction = (name: string, description?: string) => {
  return Sentry.startTransaction({
    name,
    description,
    tags: {
      component: 'frontend'
    }
  });
};

// Initialize monitoring on module load
initializeMonitoring();

// Export monitoring utilities
export {
  Sentry,
  initializeMonitoring
};

export default {
  trackEvent,
  trackApiCall,
  trackUserInteraction,
  trackTrinityAgent,
  trackWorkflowExecution,
  trackMCPInteraction,
  trackPerformance,
  setUserContext,
  clearUserContext,
  captureError,
  addContext,
  startTransaction
};