import React from 'react';
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
import { ShieldAlert, RefreshCw, LogIn } from 'lucide-react';

/**
 * Auth-specific error boundary with specialized error handling
 */
export function AuthErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, 'feature'>) {
  return (
    <BaseErrorBoundary {...props} feature="auth" fallback={AuthErrorFallback}>
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Specialized error fallback for authentication errors
 */
function AuthErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isAuthError = error.category === 'auth';
  const isNetworkError = error.category === 'network';
  const isPermissionError = error.category === 'permission';

  const handleSignIn = () => {
    window.location.href = '/sign-in';
  };

  const handleRetry = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (isAuthError) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
              <ShieldAlert className="text-destructive h-6 w-6" />
            </div>
            <CardTitle className="text-lg">authentication required</CardTitle>
            <CardDescription>
              you need to sign in to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                your session may have expired or you may not have permission to
                access this resource.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button onClick={handleSignIn} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                sign in
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                go to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPermissionError) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <ShieldAlert className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg">access denied</CardTitle>
            <CardDescription>
              you don't have permission to access this resource
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                this area requires additional permissions. please contact an
                administrator if you believe this is an error.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                go to home
              </Button>
              <Button variant="outline" onClick={resetError} className="w-full">
                dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isNetworkError) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <RefreshCw className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">connection issue</CardTitle>
            <CardDescription>
              unable to connect to authentication service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                please check your internet connection and try again. if the
                problem persists, our servers may be temporarily unavailable.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                try again
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                go to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for other error types
  return (
    <div className="flex min-h-96 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <ShieldAlert className="text-destructive h-6 w-6" />
          </div>
          <CardTitle className="text-lg">authentication error</CardTitle>
          <CardDescription>{error.userMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <Alert>
              <AlertDescription className="text-xs">
                <strong>dev info:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              try again
            </Button>
            <Button variant="outline" onClick={handleSignIn} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              sign in
            </Button>
            <Button variant="outline" onClick={resetError} className="w-full">
              dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
