import React, { useState } from 'react';
import {
  BaseErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorFallbackProps,
} from './base-error-boundary';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, RefreshCw, AlertTriangle, Home } from 'lucide-react';

/**
 * Data-specific error boundary for database and API errors
 */
export function DataErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, 'feature'>) {
  return (
    <BaseErrorBoundary {...props} feature="data" fallback={DataErrorFallback}>
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Specialized error fallback for data loading errors
 */
function DataErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const isServerError = error.category === 'server';
  const isNotFound = error.category === 'not_found';
  const isValidationError = error.category === 'validation';

  const handleRetry = async () => {
    setIsRetrying(true);

    // Add a small delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsRetrying(false);
    resetError();

    // Try to refresh just the data instead of the whole page
    if (window.location.search.includes('refresh=')) {
      window.location.reload();
    } else {
      const separator = window.location.search ? '&' : '?';
      window.location.href = `${window.location.pathname}${window.location.search}${separator}refresh=${Date.now()}`;
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  if (isNotFound) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">data not found</CardTitle>
            <CardDescription>
              the requested data could not be found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                this {String(context?.metadata?.resourceType || 'resource')} may
                have been moved, deleted, or you may not have permission to view
                it.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="w-full"
              >
                go back
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                go to home
              </Button>
              <Button variant="ghost" onClick={resetError} className="w-full">
                dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidationError) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-lg">invalid data</CardTitle>
            <CardDescription>
              the data format is invalid or corrupted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{error.userMessage}</AlertDescription>
            </Alert>

            {Boolean(context?.metadata?.field) && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <strong>field with error:</strong>{' '}
                {String(context?.metadata?.field)}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
                />
                {isRetrying ? 'retrying...' : 'try again'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="w-full"
              >
                go back
              </Button>
              <Button variant="ghost" onClick={resetError} className="w-full">
                dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isServerError) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <Database className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-lg">server error</CardTitle>
            <CardDescription>
              unable to load data from the server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                our servers are experiencing issues. please try again in a few
                moments.
              </AlertDescription>
            </Alert>

            {/* Server status indicator */}
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span>server status:</span>
                <span className="flex items-center gap-1 font-light text-red-600">
                  <div className="h-2 w-2 rounded-full bg-red-600"></div>
                  unavailable
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
                />
                {isRetrying ? 'retrying...' : 'try again'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                go to home
              </Button>
              <Button variant="ghost" onClick={resetError} className="w-full">
                dismiss
              </Button>
            </div>

            <details className="text-sm">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-light">
                what can i do?
              </summary>
              <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                <p>• wait a few minutes and try again</p>
                <p>• check our status page for updates</p>
                <p>• try refreshing the page</p>
                <p>• contact support if the issue persists</p>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generic data error fallback
  return (
    <div className="flex min-h-96 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <Database className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-lg">data loading error</CardTitle>
          <CardDescription>{error.userMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show loading skeleton while retrying */}
          {isRetrying && (
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                loading fresh data...
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {!isRetrying && (
            <Alert>
              <AlertDescription>
                something went wrong while loading the data. this might be a
                temporary issue.
              </AlertDescription>
            </Alert>
          )}

          {process.env.NODE_ENV === 'development' && !isRetrying && (
            <details className="text-sm">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-light">
                error details (development)
              </summary>
              <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                <p>
                  <strong>message:</strong> {error.message}
                </p>
                <p>
                  <strong>category:</strong> {error.category}
                </p>
                <p>
                  <strong>feature:</strong> {error.context.feature}
                </p>
                {Boolean(error.context.metadata?.resourceType) && (
                  <p>
                    <strong>resource:</strong>{' '}
                    {String(error.context.metadata?.resourceType)}
                  </p>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
              />
              {isRetrying ? 'loading...' : 'try again'}
            </Button>
            <Button variant="outline" onClick={handleGoBack} className="w-full">
              go back
            </Button>
            <Button variant="ghost" onClick={resetError} className="w-full">
              dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
