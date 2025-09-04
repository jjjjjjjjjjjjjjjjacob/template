import { trackEvents } from './track-events';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'server'
  | 'client'
  | 'unknown';

export interface ErrorContext {
  userId?: string;
  route?: string;
  feature?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface EnhancedError {
  id: string;
  message: string;
  originalError: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: number;
  stack?: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

/**
 * Enhanced error logging utility with categorization and context
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: EnhancedError[] = [];
  private maxStoredErrors = 50;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with enhanced metadata
   */
  logError(
    error: Error,
    category: ErrorCategory = 'unknown',
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {},
    userMessage?: string
  ): EnhancedError {
    const enhancedError: EnhancedError = {
      id: this.generateErrorId(),
      message: error.message,
      originalError: error,
      category,
      severity,
      context: {
        ...context,
        route: context.route || window?.location?.pathname,
      },
      timestamp: Date.now(),
      stack: error.stack,
      userMessage: userMessage || this.getDefaultUserMessage(category),
      recoverable: this.isRecoverable(category),
      retryable: this.isRetryable(category),
    };

    // Store error locally
    this.storeError(enhancedError);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      // // console.group(`🚨 Error [${severity.toUpperCase()}]`);
      // // console.error('Message:', enhancedError.message);
      // // console.error('Category:', category);
      // // console.error('Context:', context);
      // // console.error('Original Error:', error);
      // // console.groupEnd();
    }

    // Send to analytics
    this.sendToAnalytics(enhancedError);

    return enhancedError;
  }

  /**
   * Log network errors with specific handling
   */
  logNetworkError(
    error: Error,
    url: string,
    method: string = 'GET',
    context: ErrorContext = {}
  ): EnhancedError {
    return this.logError(
      error,
      'network',
      'medium',
      {
        ...context,
        metadata: {
          ...context.metadata,
          url,
          method,
        },
      },
      'we encountered a network issue. please check your connection and try again.'
    );
  }

  /**
   * Log authentication errors
   */
  logAuthError(error: Error, context: ErrorContext = {}): EnhancedError {
    return this.logError(
      error,
      'auth',
      'high',
      {
        ...context,
        feature: 'auth',
      },
      'authentication failed. please sign in again.'
    );
  }

  /**
   * Log validation errors
   */
  logValidationError(
    error: Error,
    field?: string,
    context: ErrorContext = {}
  ): EnhancedError {
    return this.logError(
      error,
      'validation',
      'low',
      {
        ...context,
        metadata: {
          ...context.metadata,
          field,
        },
      },
      'please check your input and try again.'
    );
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count: number = 10): EnhancedError[] {
    return this.errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): EnhancedError[] {
    return this.errors.filter((error) => error.category === category);
  }

  /**
   * Clear stored errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<ErrorCategory, number> {
    const stats: Record<ErrorCategory, number> = {
      network: 0,
      validation: 0,
      auth: 0,
      permission: 0,
      not_found: 0,
      server: 0,
      client: 0,
      unknown: 0,
    };

    this.errors.forEach((error) => {
      stats[error.category]++;
    });

    return stats;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeError(error: EnhancedError): void {
    this.errors.push(error);

    // Keep only the most recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }
  }

  private sendToAnalytics(error: EnhancedError): void {
    try {
      trackEvents.errorOccurred(error.message, {
        error_id: error.id,
        error_category: error.category,
        error_severity: error.severity,
        error_context: JSON.stringify(error.context),
        error_recoverable: error.recoverable,
        error_retryable: error.retryable,
        route: error.context.route || null,
        feature: error.context.feature || null,
        user_id: error.context.userId || null,
      });
    } catch {
      // Silently fail if analytics isn't available
      // // console.warn('Failed to send error to analytics:', analyticsError);
    }
  }

  private getDefaultUserMessage(category: ErrorCategory): string {
    const messages: Record<ErrorCategory, string> = {
      network:
        'network connection issue. please check your internet and try again.',
      validation: 'please check your input and try again.',
      auth: 'authentication required. please sign in.',
      permission: "you don't have permission to perform this action.",
      not_found: 'the requested resource was not found.',
      server: 'server error. please try again later.',
      client: 'something went wrong. please refresh the page.',
      unknown: 'an unexpected error occurred. please try again.',
    };

    return messages[category];
  }

  private isRecoverable(category: ErrorCategory): boolean {
    const recoverableCategories: ErrorCategory[] = [
      'network',
      'validation',
      'auth',
    ];
    return recoverableCategories.includes(category);
  }

  private isRetryable(category: ErrorCategory): boolean {
    const retryableCategories: ErrorCategory[] = ['network', 'server'];
    return retryableCategories.includes(category);
  }
}

/**
 * Utility functions for error handling
 */
export const errorUtils = {
  /**
   * Categorize an error based on its properties
   */
  categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }

    if (
      message.includes('unauthorized') ||
      message.includes('authentication')
    ) {
      return 'auth';
    }

    if (message.includes('permission') || message.includes('forbidden')) {
      return 'permission';
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'not_found';
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    if (
      message.includes('server') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503')
    ) {
      return 'server';
    }

    return 'unknown';
  },

  /**
   * Determine error severity based on category and context
   */
  determineSeverity(
    category: ErrorCategory,
    context: ErrorContext = {}
  ): ErrorSeverity {
    if (category === 'server' || category === 'auth') {
      return 'high';
    }

    if (category === 'permission' || category === 'not_found') {
      return 'medium';
    }

    if (category === 'validation') {
      return 'low';
    }

    if (category === 'network' && context.feature === 'auth') {
      return 'high';
    }

    return 'medium';
  },

  /**
   * Create user-friendly error message
   */
  createUserMessage(error: Error, category?: ErrorCategory): string {
    const detectedCategory = category || errorUtils.categorizeError(error);
    const messages: Record<ErrorCategory, string> = {
      network:
        'network connection issue. please check your internet and try again.',
      validation: 'please check your input and try again.',
      auth: 'authentication required. please sign in.',
      permission: "you don't have permission to perform this action.",
      not_found: 'the requested resource was not found.',
      server: 'server error. please try again later.',
      client: 'something went wrong. please refresh the page.',
      unknown: 'an unexpected error occurred. please try again.',
    };

    return messages[detectedCategory];
  },

  /**
   * Check if an error is retryable
   */
  isRetryable(error: Error | EnhancedError): boolean {
    if ('retryable' in error) {
      return error.retryable;
    }

    const category = errorUtils.categorizeError(error as Error);
    return ['network', 'server'].includes(category);
  },

  /**
   * Check if an error is recoverable
   */
  isRecoverable(error: Error | EnhancedError): boolean {
    if ('recoverable' in error) {
      return error.recoverable;
    }

    const category = errorUtils.categorizeError(error as Error);
    return ['network', 'validation', 'auth'].includes(category);
  },

  /**
   * Get suggested recovery actions for an error
   */
  getRecoveryActions(error: EnhancedError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    if (error.retryable) {
      actions.push({
        label: 'try again',
        action: () => window.location.reload(),
        primary: true,
      });
    }

    if (error.category === 'auth') {
      actions.push({
        label: 'sign in',
        action: () => {
          window.location.href = '/sign-in';
        },
      });
    }

    if (error.category === 'not_found') {
      actions.push({
        label: 'go home',
        action: () => {
          window.location.href = '/';
        },
      });
    }

    if (error.category === 'network') {
      actions.push({
        label: 'check connection',
        action: () => {
          if ('navigator' in window && 'onLine' in navigator) {
            if (!navigator.onLine) {
              alert(
                'you appear to be offline. please check your internet connection.'
              );
            } else {
              alert('connection appears normal. the issue may be temporary.');
            }
          }
        },
      });
    }

    // Always provide a refresh option
    if (!actions.some((action) => action.label === 'try again')) {
      actions.push({
        label: 'refresh page',
        action: () => window.location.reload(),
      });
    }

    return actions;
  },
};

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Utility hook for error logging (can be used in React components)
export function useErrorLogging() {
  return {
    logError: errorLogger.logError.bind(errorLogger),
    logNetworkError: errorLogger.logNetworkError.bind(errorLogger),
    logAuthError: errorLogger.logAuthError.bind(errorLogger),
    logValidationError: errorLogger.logValidationError.bind(errorLogger),
    getRecentErrors: errorLogger.getRecentErrors.bind(errorLogger),
    clearErrors: errorLogger.clearErrors.bind(errorLogger),
  };
}
