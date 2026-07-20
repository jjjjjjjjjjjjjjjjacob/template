// Base error boundary and types

// Re-export error handling utilities for convenience
export {
  type EnhancedError,
  type ErrorCategory,
  type ErrorContext,
  type ErrorRecoveryAction,
  type ErrorSeverity,
  errorLogger,
  errorUtils,
  useErrorLogging,
} from '@/lib/error-handling';

// Feature-specific error boundaries
export { AuthErrorBoundary } from './auth-error-boundary';
export {
  BaseErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
  type ErrorFallbackProps,
  useErrorBoundary,
  withErrorBoundary,
} from './base-error-boundary';
export { DataErrorBoundary } from './data-error-boundary';
// Error display components
export {
  ErrorDisplay,
  type ErrorDisplayProps,
  ErrorMessage,
  ErrorSummary,
} from './error-display';
// Fallback UI components
export {
  CompactErrorFallback,
  FormErrorFallback,
  FullPageErrorFallback,
  InlineErrorFallback,
  ListItemErrorFallback,
  ModalErrorFallback,
  NavigationErrorFallback,
  SkeletonErrorFallback,
  WidgetErrorFallback,
} from './error-fallbacks';
// Error recovery components
export {
  ErrorRecovery,
  type ErrorRecoveryProps,
  useErrorRecovery,
} from './error-recovery';
export { NetworkErrorBoundary } from './network-error-boundary';
