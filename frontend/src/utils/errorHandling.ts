/**
 * OpenConductor Error Handling & Loading States
 * 
 * Centralized error handling and loading state management for enterprise deployment
 */

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastAttempt: Date | null;
}

export interface ErrorContext {
  component: string;
  action: string;
  data?: any;
  timestamp: Date;
  userId?: string;
}

export class OpenConductorErrorHandler {
  private static instance: OpenConductorErrorHandler;
  private errorLog: ErrorContext[] = [];
  private maxRetries = 3;
  private retryDelay = 1000;

  static getInstance(): OpenConductorErrorHandler {
    if (!OpenConductorErrorHandler.instance) {
      OpenConductorErrorHandler.instance = new OpenConductorErrorHandler();
    }
    return OpenConductorErrorHandler.instance;
  }

  /**
   * Handle and log errors with context
   */
  handleError(error: Error, context: Omit<ErrorContext, 'timestamp'>): void {
    const errorContext: ErrorContext = {
      ...context,
      timestamp: new Date()
    };

    this.errorLog.push(errorContext);
    
    // Log to console in development
    if ((import.meta as any).env?.DEV) {
      console.error(`[OpenConductor Error] ${context.component}:${context.action}`, error, context);
    }

    // Send to monitoring service in production
    if ((import.meta as any).env?.PROD) {
      this.sendErrorToMonitoring(error, errorContext);
    }
  }

  /**
   * Retry failed operations with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'timestamp'>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          this.handleError(lastError, context);
          throw lastError;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Create loading state manager
   */
  createLoadingState(): {
    state: LoadingState;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    retry: () => void;
  } {
    const state: LoadingState = {
      isLoading: false,
      error: null,
      retryCount: 0,
      lastAttempt: null
    };

    return {
      state,
      setLoading: (loading: boolean) => {
        state.isLoading = loading;
        if (loading) {
          state.lastAttempt = new Date();
        }
      },
      setError: (error: string | null) => {
        state.error = error;
        state.isLoading = false;
      },
      retry: () => {
        state.retryCount += 1;
        state.error = null;
        state.isLoading = true;
        state.lastAttempt = new Date();
      }
    };
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    recentErrors: number;
    topErrors: Array<{ component: string; action: string; count: number }>;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errorLog.filter(e => e.timestamp > oneHourAgo);

    const errorCounts = new Map<string, number>();
    this.errorLog.forEach(error => {
      const key = `${error.component}:${error.action}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([key, count]) => {
        const [component, action] = key.split(':');
        return { component, action, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.errorLog.length,
      recentErrors: recentErrors.length,
      topErrors
    };
  }

  private async sendErrorToMonitoring(error: Error, context: ErrorContext): Promise<void> {
    try {
      // In production, send to monitoring service (Sentry, DataDog, etc.)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring service:', monitoringError);
    }
  }
}

/**
 * React Hook for Loading States with Error Handling
 */
export const useLoadingState = () => {
  const errorHandler = OpenConductorErrorHandler.getInstance();
  return errorHandler.createLoadingState();
};

/**
 * Global Error Boundary Component Data
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export const handleReactError = (error: Error, errorInfo: React.ErrorInfo): void => {
  const errorHandler = OpenConductorErrorHandler.getInstance();
  errorHandler.handleError(error, {
    component: 'ErrorBoundary',
    action: 'componentDidCatch',
    data: { errorInfo }
  });
};