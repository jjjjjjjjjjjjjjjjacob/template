import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BaseErrorBoundary,
  AuthErrorBoundary,
  NetworkErrorBoundary,
  DataErrorBoundary,
  InlineErrorFallback,
  CompactErrorFallback,
  ErrorDisplay,
  ErrorMessage,
  errorLogger,
} from './index';

/**
 * Example component that demonstrates error boundary usage
 * Only rendered in development mode
 */
export function ErrorBoundaryExamples() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">error boundary examples</h2>
        <p className="text-muted-foreground">
          interactive examples of the error boundary system (development only)
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Error Boundary */}
        <Card>
          <CardHeader>
            <CardTitle>basic error boundary</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseErrorBoundary>
              <ErrorTrigger errorType="generic" label="trigger generic error" />
            </BaseErrorBoundary>
          </CardContent>
        </Card>

        {/* Auth Error Boundary */}
        <Card>
          <CardHeader>
            <CardTitle>auth error boundary</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthErrorBoundary>
              <ErrorTrigger errorType="auth" label="trigger auth error" />
            </AuthErrorBoundary>
          </CardContent>
        </Card>

        {/* Network Error Boundary */}
        <Card>
          <CardHeader>
            <CardTitle>network error boundary</CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkErrorBoundary>
              <ErrorTrigger errorType="network" label="trigger network error" />
            </NetworkErrorBoundary>
          </CardContent>
        </Card>

        {/* Data Error Boundary */}
        <Card>
          <CardHeader>
            <CardTitle>data error boundary</CardTitle>
          </CardHeader>
          <CardContent>
            <DataErrorBoundary>
              <ErrorTrigger errorType="server" label="trigger server error" />
            </DataErrorBoundary>
          </CardContent>
        </Card>

        {/* Inline Fallback */}
        <Card>
          <CardHeader>
            <CardTitle>inline fallback</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseErrorBoundary fallback={InlineErrorFallback}>
              <ErrorTrigger
                errorType="validation"
                label="trigger validation error"
              />
            </BaseErrorBoundary>
          </CardContent>
        </Card>

        {/* Compact Fallback */}
        <Card>
          <CardHeader>
            <CardTitle>compact fallback</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseErrorBoundary fallback={CompactErrorFallback}>
              <ErrorTrigger
                errorType="permission"
                label="trigger permission error"
              />
            </BaseErrorBoundary>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Error Display Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">error display components</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>error message</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorMessage
                message="this is a simple error message"
                onRetry={() => {
                  /* console.log('retry clicked') */
                }}
                onDismiss={() => {
                  /* console.log('dismiss clicked') */
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>error display</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorDisplay
                error={createSampleError()}
                variant="inline"
                showRecovery={false}
                onRetry={() => {
                  /* console.log('retry clicked') */
                }}
                onDismiss={() => {
                  /* console.log('dismiss clicked') */
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Error Logging Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">error logging</h3>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              errorLogger.logError(
                new Error('Test error'),
                'client',
                'medium',
                { feature: 'examples', action: 'test_logging' }
              );
              // // console.log('Error logged - check console for details');
            }}
          >
            log test error
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              errorLogger.getErrorStats();
              // // console.log('Error statistics:', stats);
            }}
          >
            show error stats
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              errorLogger.getRecentErrors(5);
              // // console.log('Recent errors:', recent);
            }}
          >
            show recent errors
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              errorLogger.clearErrors();
              // // console.log('Error log cleared');
            }}
          >
            clear error log
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component that throws different types of errors for testing
 */
function ErrorTrigger({
  errorType,
  label,
}: {
  errorType: string;
  label: string;
}) {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    const error = createErrorByType(errorType);
    throw error;
  }

  return (
    <Button
      variant="destructive"
      onClick={() => setShouldThrow(true)}
      className="w-full"
    >
      {label}
    </Button>
  );
}

/**
 * Create different types of errors for testing
 */
function createErrorByType(type: string): Error {
  switch (type) {
    case 'auth':
      return new Error('Unauthorized: Authentication required');
    case 'network':
      return new Error('Network error: Failed to fetch data');
    case 'server':
      return new Error('Server error: Internal server error (500)');
    case 'validation':
      return new Error('Validation error: Invalid input provided');
    case 'permission':
      return new Error('Permission denied: Insufficient privileges');
    case 'not_found':
      return new Error('Not found: Resource does not exist');
    default:
      return new Error('Generic error: Something went wrong');
  }
}

/**
 * Create a sample enhanced error for display examples
 */
function createSampleError() {
  return errorLogger.logError(
    new Error('Sample error for display'),
    'network',
    'medium',
    {
      feature: 'examples',
      route: '/examples',
      userId: 'demo-user',
      metadata: {
        url: '/api/data',
        method: 'GET',
      },
    }
  );
}
