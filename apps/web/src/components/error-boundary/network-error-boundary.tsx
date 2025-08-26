import React, { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { WifiOff, RefreshCw, Globe, Home } from 'lucide-react';

/**
 * Network-specific error boundary with connection monitoring
 */
export function NetworkErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, 'feature'>) {
  return (
    <BaseErrorBoundary
      {...props}
      feature="network"
      fallback={NetworkErrorFallback}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Specialized error fallback for network errors with retry logic
 */
function NetworkErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryProgress, setRetryProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionSpeed, setConnectionSpeed] = useState<
    'slow' | 'normal' | 'fast'
  >('normal');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed if available
    if ('connection' in navigator) {
      const connection = (
        navigator as Navigator & {
          connection?: { effectiveType?: string };
        }
      ).connection;
      if (connection?.effectiveType) {
        setConnectionSpeed(
          connection.effectiveType === '4g'
            ? 'fast'
            : connection.effectiveType === '3g'
              ? 'normal'
              : 'slow'
        );
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryProgress(0);

    // Simulate retry progress
    const progressInterval = setInterval(() => {
      setRetryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // Wait for progress to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Test connectivity by trying to fetch a small resource
      await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });

      setIsRetrying(false);
      resetError();
      window.location.reload();
    } catch {
      setIsRetrying(false);
      setRetryProgress(0);
      // Retry failed
    }
  };

  const handleGoOffline = () => {
    // Store current page for when connection is restored
    localStorage.setItem('offline_page', window.location.pathname);
    window.location.href = '/offline';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const getConnectionMessage = () => {
    if (!isOnline) {
      return 'you appear to be offline. please check your internet connection.';
    }

    if (connectionSpeed === 'slow') {
      return 'your connection appears slow. this may affect loading times.';
    }

    return 'connection issue detected. this may be a temporary server problem.';
  };

  return (
    <div className="flex min-h-96 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            {isOnline ? (
              <Globe className="h-6 w-6 text-orange-600" />
            ) : (
              <WifiOff className="h-6 w-6 text-orange-600" />
            )}
          </div>
          <CardTitle className="text-lg">
            {isOnline ? 'connection issue' : "you're offline"}
          </CardTitle>
          <CardDescription>{getConnectionMessage()}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>{error.userMessage}</AlertDescription>
          </Alert>

          {/* Connection status */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span>connection status:</span>
              <span
                className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}
              >
                {isOnline ? 'online' : 'offline'}
              </span>
            </div>
            {isOnline && (
              <div className="text-muted-foreground mt-1 flex items-center justify-between text-sm">
                <span>speed:</span>
                <span>{connectionSpeed}</span>
              </div>
            )}
          </div>

          {/* Retry progress */}
          {isRetrying && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>retrying connection...</span>
                <span>{retryProgress}%</span>
              </div>
              <Progress value={retryProgress} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {isOnline ? (
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
            ) : (
              <Button
                variant="outline"
                onClick={handleGoOffline}
                className="w-full"
              >
                <WifiOff className="mr-2 h-4 w-4" />
                offline mode
              </Button>
            )}

            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              go to home
            </Button>

            <Button variant="ghost" onClick={resetError} className="w-full">
              dismiss
            </Button>
          </div>

          {/* Network tips */}
          <details className="text-sm">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-medium">
              troubleshooting tips
            </summary>
            <div className="text-muted-foreground mt-2 space-y-1 text-xs">
              <p>• check your wifi or mobile data connection</p>
              <p>• try refreshing the page</p>
              <p>• check if other websites are working</p>
              <p>• restart your router if using wifi</p>
              {connectionSpeed === 'slow' && (
                <p>• your connection is slow - try closing other apps</p>
              )}
            </div>
          </details>

          {/* Development info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-sm">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-medium">
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
                  <strong>url:</strong> {error.context.metadata?.url as string}
                </p>
                <p>
                  <strong>method:</strong>{' '}
                  {error.context.metadata?.method as string}
                </p>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
