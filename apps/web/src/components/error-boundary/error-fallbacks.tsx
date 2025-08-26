import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { type ErrorFallbackProps } from './base-error-boundary';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Wifi,
  Shield,
  Database,
} from 'lucide-react';

/**
 * Minimal inline error fallback for small components
 */
export function InlineErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="border-destructive/20 bg-destructive/5 flex items-center gap-2 rounded-md border p-3 text-sm">
      <AlertTriangle className="text-destructive h-4 w-4" />
      <span className="text-destructive flex-1">{error.userMessage}</span>
      <Button size="sm" variant="outline" onClick={resetError}>
        retry
      </Button>
    </div>
  );
}

/**
 * Compact error fallback for widgets and sidebars
 */
export function CompactErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps) {
  const getIcon = () => {
    switch (error.category) {
      case 'network':
        return <Wifi className="h-5 w-5" />;
      case 'auth':
        return <Shield className="h-5 w-5" />;
      case 'server':
        return <Database className="h-5 w-5" />;
      default:
        return <Bug className="h-5 w-5" />;
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-destructive/10 text-destructive flex h-8 w-8 items-center justify-center rounded-full">
            {getIcon()}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">something went wrong</p>
            <p className="text-muted-foreground text-xs">{error.userMessage}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={resetError}>
                <RefreshCw className="mr-1 h-3 w-3" />
                retry
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Full-page error fallback for route-level errors
 */
export function FullPageErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Bug className="text-destructive h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold">oops! something went wrong</h1>
          <p className="text-muted-foreground mt-2">
            we encountered an unexpected error while loading this page
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error.userMessage}</AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
                  technical details (development only)
                </summary>
                <div className="mt-2 space-y-2 text-xs">
                  <div>
                    <strong>error:</strong> {error.message}
                  </div>
                  <div>
                    <strong>category:</strong> {error.category}
                  </div>
                  <div>
                    <strong>severity:</strong> {error.severity}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>stack trace:</strong>
                      <pre className="bg-muted mt-1 max-h-32 overflow-auto rounded p-2 text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleRefresh} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            refresh page
          </Button>
          <Button variant="outline" onClick={handleGoHome} className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            go home
          </Button>
          <Button variant="ghost" onClick={resetError}>
            dismiss
          </Button>
        </div>

        <div className="text-muted-foreground text-center text-sm">
          if this problem persists, please{' '}
          <a
            href="mailto:support@example.com"
            className="hover:text-foreground underline"
          >
            contact support
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton error fallback for data components
 */
export function SkeletonErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps) {
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowError(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!showError) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-4 w-4" />
            <span className="text-sm font-medium">failed to load</span>
          </div>
          <p className="text-muted-foreground text-xs">{error.userMessage}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={resetError}
            className="w-full"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Modal error fallback for overlay components
 */
export function ModalErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-64 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="bg-destructive/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive h-6 w-6" />
        </div>

        <div>
          <h3 className="font-medium">error in modal</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {error.userMessage}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={resetError}
            className="flex-1"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            retry
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              resetError();
              // Try to close modal if possible
              document.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Escape' })
              );
            }}
            className="flex-1"
          >
            close
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Form error fallback for form components
 */
export function FormErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Alert className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.userMessage}</span>
        <Button size="sm" variant="outline" onClick={resetError}>
          retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Navigation error fallback for menu/navigation components
 */
export function NavigationErrorFallback({
  resetError,
}: Omit<ErrorFallbackProps, 'error'>) {
  return (
    <div className="bg-destructive/5 flex items-center justify-between rounded-md p-2 text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-destructive h-4 w-4" />
        <span>navigation error</span>
      </div>
      <Button size="sm" variant="ghost" onClick={resetError}>
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );
}

/**
 * List item error fallback for list/grid components
 */
export function ListItemErrorFallback({
  resetError,
}: Omit<ErrorFallbackProps, 'error'>) {
  return (
    <div className="border-destructive/20 flex items-center justify-between rounded-md border border-dashed p-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span>failed to load item</span>
      </div>
      <Button size="sm" variant="ghost" onClick={resetError}>
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );
}

/**
 * Widget error fallback for dashboard widgets
 */
export function WidgetErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="bg-destructive/10 mx-auto flex h-10 w-10 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">widget error</p>
            <p className="text-muted-foreground text-xs">{error.userMessage}</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetError}>
            <RefreshCw className="mr-1 h-3 w-3" />
            retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
