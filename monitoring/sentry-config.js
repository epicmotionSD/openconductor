/**
 * OpenConductor Sentry Monitoring Configuration
 * Centralized error tracking and performance monitoring setup
 */

const { version } = require('../package.json');

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base Sentry configuration
const baseSentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: `openconductor@${version}`,
  
  // Performance monitoring
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  profilesSampleRate: isProduction ? 0.1 : 1.0,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (isDevelopment && event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('ResizeObserver')) {
        return null; // Ignore ResizeObserver errors in development
      }
    }
    
    // Filter out known non-critical errors
    const ignoredErrors = [
      'Network request failed',
      'Loading CSS chunk',
      'Loading chunk',
      'ChunkLoadError',
      'Non-Error promise rejection captured'
    ];
    
    if (event.exception) {
      const error = event.exception.values[0];
      if (error && ignoredErrors.some(ignored => 
        error.value?.includes(ignored) || error.type?.includes(ignored)
      )) {
        return null;
      }
    }
    
    return event;
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'openconductor',
      version
    },
    level: 'info'
  },
  
  // Integration configuration
  integrations: [],
  
  // Debug mode
  debug: isDevelopment,
  
  // Capture unhandled rejections
  captureUnhandledRejections: true,
  
  // Capture console errors
  captureConsoleErrors: true,
};

// Backend-specific configuration
const backendSentryConfig = {
  ...baseSentryConfig,
  
  // Server-specific settings
  serverName: process.env.SERVER_NAME || 'openconductor-api',
  
  // Additional context
  beforeSend(event, hint) {
    const baseResult = baseSentryConfig.beforeSend(event, hint);
    if (!baseResult) return null;
    
    // Add server-specific context
    event.tags = {
      ...event.tags,
      service: 'api',
      deployment: process.env.RAILWAY_ENVIRONMENT || 'unknown'
    };
    
    // Add request context if available
    if (hint.request) {
      event.request = {
        url: hint.request.url,
        method: hint.request.method,
        headers: hint.request.headers,
        query_string: hint.request.query
      };
    }
    
    return event;
  },
  
  // Express.js integration
  requestHandler: {
    keys: ['cookies', 'data', 'headers', 'method', 'query_string', 'url'],
    user: ['id', 'email']
  },
  
  // Database query tracking
  tracingOrigins: ['localhost', /^\/api/, 'railway.app', 'supabase.co'],
  
  // Custom integrations
  integrations: [
    // Add backend-specific integrations
  ]
};

// Frontend-specific configuration  
const frontendSentryConfig = {
  ...baseSentryConfig,
  
  // Browser-specific settings
  beforeSend(event, hint) {
    const baseResult = baseSentryConfig.beforeSend(event, hint);
    if (!baseResult) return null;
    
    // Add frontend-specific context
    event.tags = {
      ...event.tags,
      service: 'frontend',
      deployment: 'vercel'
    };
    
    // Add user interaction context
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
        // Filter out noisy breadcrumbs
        return !breadcrumb.message?.includes('ResizeObserver') &&
               !breadcrumb.category?.includes('ui.click') ||
               breadcrumb.level === 'error';
      });
    }
    
    return event;
  },
  
  // Replay sessions for debugging
  replaysSessionSampleRate: isProduction ? 0.01 : 0.1,
  replaysOnErrorSampleRate: isProduction ? 0.1 : 1.0,
  
  // Custom integrations
  integrations: [
    // Add frontend-specific integrations
  ],
  
  // Transport options
  transport: {
    // Custom transport for better error handling
    beforeSendTransaction: (event) => {
      // Filter out low-value transactions
      if (event.transaction && (
        event.transaction.includes('/_next/') ||
        event.transaction.includes('/api/health') ||
        event.transaction.includes('/static/')
      )) {
        return null;
      }
      return event;
    }
  }
};

module.exports = {
  baseSentryConfig,
  backendSentryConfig,
  frontendSentryConfig,
  isDevelopment,
  isProduction
};