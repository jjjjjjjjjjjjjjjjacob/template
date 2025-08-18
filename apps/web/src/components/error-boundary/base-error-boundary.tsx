import React, { Component, ReactNode } from 'react';
import {
  errorLogger,
  type EnhancedError,
  type ErrorContext,
  errorUtils,
} from '@/lib/error-handling';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: EnhancedError;
  errorInfo?: React.ErrorInfo;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  feature?: string;
  onError?: (error: EnhancedError, errorInfo: React.ErrorInfo) => void;
  context?: ErrorContext;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export interface ErrorFallbackProps {
  error: EnhancedError;
  resetError: () => void;
  context?: ErrorContext;
}

/**
 * Base error boundary component with enhanced error handling and logging
 */
export class BaseErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const context: ErrorContext = {
      ...this.props.context,
      feature: this.props.feature,
      route: window?.location?.pathname,
      metadata: {
        ...this.props.context?.metadata,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
    };

    // Categorize and log the error
    const category = errorUtils.categorizeError(error);
    const severity = errorUtils.determineSeverity(category, context);

    const enhancedError = errorLogger.logError(
      error,
      category,
      severity,
      context
    );

    this.setState({
      hasError: true,
      error: enhancedError,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(enhancedError, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.children !== this.props.children) {
      if (resetOnPropsChange) {
        this.resetError();
      }
    }

    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
            context={this.props.context}
          />
        );
      }

      // Default fallback if no custom fallback provided
      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component with recovery actions
 */
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const recoveryActions = errorUtils.getRecoveryActions(error);

  return (
    <div className="flex min-h-96 flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <h2 className="text-destructive text-xl font-semibold">
            something went wrong
          </h2>
          <p className="text-muted-foreground text-sm">{error.userMessage}</p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
              error details (development only)
            </summary>
            <div className="mt-2 space-y-2 text-xs">
              <div>
                <strong>message:</strong> {error.message}
              </div>
              <div>
                <strong>category:</strong> {error.category}
              </div>
              <div>
                <strong>severity:</strong> {error.severity}
              </div>
              {error.context.feature && (
                <div>
                  <strong>feature:</strong> {error.context.feature}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>stack:</strong>
                  <pre className="bg-muted mt-1 max-h-32 overflow-auto rounded p-2 text-xs">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {recoveryActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                try {
                  action.action();
                  resetError();
                } catch (actionError) {
                  console.error('Recovery action failed:', actionError);
                }
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                action.primary
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              } `}
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={resetError}
            className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium"
          >
            dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Higher-order component for easier error boundary usage
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <BaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BaseErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manual error reporting within components
 */
export function useErrorBoundary() {
  return (error: Error, context?: ErrorContext) => {
    throw error;
  };
}
