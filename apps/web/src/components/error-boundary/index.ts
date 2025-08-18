// Base error boundary and types
export {
  BaseErrorBoundary,
  withErrorBoundary,
  useErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
  type ErrorFallbackProps,
} from './base-error-boundary';

// Feature-specific error boundaries
export { AuthErrorBoundary } from './auth-error-boundary';
export { NetworkErrorBoundary } from './network-error-boundary';
export { DataErrorBoundary } from './data-error-boundary';

// Fallback UI components
export {
  InlineErrorFallback,
  CompactErrorFallback,
  FullPageErrorFallback,
  SkeletonErrorFallback,
  ModalErrorFallback,
  FormErrorFallback,
  NavigationErrorFallback,
  ListItemErrorFallback,
  WidgetErrorFallback,
} from './error-fallbacks';

// Error recovery components
export {
  ErrorRecovery,
  useErrorRecovery,
  type ErrorRecoveryProps,
} from './error-recovery';

// Error display components
export {
  ErrorDisplay,
  ErrorMessage,
  ErrorSummary,
  type ErrorDisplayProps,
} from './error-display';

// Re-export error handling utilities for convenience
export {
  errorLogger,
  errorUtils,
  useErrorLogging,
  type EnhancedError,
  type ErrorCategory,
  type ErrorSeverity,
  type ErrorContext,
  type ErrorRecoveryAction,
} from '@/lib/error-handling';
