import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  errorLogger,
  type EnhancedError,
  type ErrorRecoveryAction,
} from '@/lib/error-handling';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export interface ErrorRecoveryProps {
  error: EnhancedError;
  onRecovery?: () => void;
  onFailure?: (error: Error) => void;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showProgress?: boolean;
}

/**
 * Error recovery component with automatic retry logic
 */
export function ErrorRecovery({
  error,
  onRecovery,
  onFailure,
  autoRetry = false,
  maxRetries = 3,
  retryDelay = 2000,
  showProgress = true,
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<
    'idle' | 'retrying' | 'success' | 'failed'
  >('idle');

  const attemptRecovery = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setRecoveryStatus('failed');
      return;
    }

    setIsRetrying(true);
    setRecoveryStatus('retrying');
    setProgress(0);
    setLastRetryTime(new Date());

    try {
      // Simulate progress during retry
      if (showProgress) {
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, retryDelay / 10);
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay));

      // Attempt recovery based on error type
      const recoveryActions = getRecoveryStrategies(error);
      let recoverySuccessful = false;

      for (const strategy of recoveryActions) {
        try {
          await strategy.action();
          recoverySuccessful = true;
          break;
        } catch (strategyError) {
          console.warn(
            `Recovery strategy "${strategy.label}" failed:`,
            strategyError
          );
        }
      }

      if (recoverySuccessful) {
        setProgress(100);
        setRecoveryStatus('success');
        onRecovery?.();
      } else {
        throw new Error('All recovery strategies failed');
      }
    } catch (recoveryError) {
      setRetryCount((prev) => prev + 1);
      setRecoveryStatus('failed');

      // Log the recovery failure
      errorLogger.logError(
        recoveryError instanceof Error
          ? recoveryError
          : new Error('Recovery failed'),
        'client',
        'medium',
        {
          ...error.context,
          metadata: {
            ...error.context.metadata,
            originalErrorId: error.id,
            retryAttempt: retryCount + 1,
            recoveryAction: 'auto_retry',
          },
        }
      );

      onFailure?.(
        recoveryError instanceof Error
          ? recoveryError
          : new Error('Recovery failed')
      );
    } finally {
      setIsRetrying(false);
    }
  }, [
    error,
    retryCount,
    maxRetries,
    retryDelay,
    showProgress,
    onRecovery,
    onFailure,
  ]);

  // Auto-retry logic
  useEffect(() => {
    if (autoRetry && recoveryStatus === 'idle' && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        attemptRecovery();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [
    autoRetry,
    recoveryStatus,
    retryCount,
    maxRetries,
    retryDelay,
    attemptRecovery,
  ]);

  const handleManualRetry = () => {
    if (!isRetrying && retryCount < maxRetries) {
      attemptRecovery();
    }
  };

  const getRemainingRetries = () => maxRetries - retryCount;

  const getStatusIcon = () => {
    switch (recoveryStatus) {
      case 'retrying':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusMessage = () => {
    switch (recoveryStatus) {
      case 'retrying':
        return `attempting recovery... (${retryCount + 1}/${maxRetries})`;
      case 'success':
        return 'recovery successful!';
      case 'failed':
        return retryCount >= maxRetries
          ? 'recovery failed after maximum retries'
          : 'recovery attempt failed';
      default:
        return `ready to retry (${getRemainingRetries()} attempts remaining)`;
    }
  };

  if (recoveryStatus === 'success') {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          error has been resolved successfully!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-card space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">error recovery</span>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">{getStatusMessage()}</p>

        {showProgress && isRetrying && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>recovering...</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {lastRetryTime && (
          <p className="text-muted-foreground text-xs">
            last attempt: {lastRetryTime.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleManualRetry}
          disabled={isRetrying || retryCount >= maxRetries}
          className="flex-1"
        >
          <RefreshCw
            className={`mr-1 h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`}
          />
          {isRetrying ? 'retrying...' : 'retry now'}
        </Button>

        {retryCount >= maxRetries && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRetryCount(0);
              setRecoveryStatus('idle');
            }}
          >
            reset
          </Button>
        )}
      </div>

      {retryCount > 0 && (
        <div className="text-muted-foreground text-xs">
          attempts made: {retryCount}/{maxRetries}
        </div>
      )}
    </div>
  );
}

/**
 * Get recovery strategies based on error type
 */
function getRecoveryStrategies(error: EnhancedError): ErrorRecoveryAction[] {
  const strategies: ErrorRecoveryAction[] = [];

  switch (error.category) {
    case 'network':
      strategies.push(
        {
          label: 'test connectivity',
          action: async () => {
            const response = await fetch('/favicon.ico', {
              method: 'HEAD',
              cache: 'no-cache',
              signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) {
              throw new Error('Connectivity test failed');
            }
          },
        },
        {
          label: 'retry original request',
          action: async () => {
            if (error.context.metadata?.url) {
              const response = await fetch(
                error.context.metadata.url as string,
                {
                  method: (error.context.metadata.method as string) || 'GET',
                  cache: 'no-cache',
                }
              );
              if (!response.ok) {
                throw new Error('Request retry failed');
              }
            }
          },
        }
      );
      break;

    case 'auth':
      strategies.push({
        label: 'refresh authentication',
        action: async () => {
          // Try to refresh auth token if available
          if (window.location.pathname !== '/sign-in') {
            const event = new CustomEvent('auth:refresh');
            window.dispatchEvent(event);
          }
        },
      });
      break;

    case 'server':
      strategies.push({
        label: 'check server status',
        action: async () => {
          const response = await fetch('/api/health', {
            method: 'GET',
            cache: 'no-cache',
            signal: AbortSignal.timeout(10000),
          });
          if (!response.ok) {
            throw new Error('Server health check failed');
          }
        },
      });
      break;

    case 'validation':
      strategies.push({
        label: 'reset form state',
        action: async () => {
          const event = new CustomEvent('form:reset');
          window.dispatchEvent(event);
        },
      });
      break;

    default:
      strategies.push({
        label: 'generic recovery',
        action: async () => {
          // Basic recovery - just wait and hope for the best
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
  }

  return strategies;
}

/**
 * Hook for using error recovery in components
 */
export function useErrorRecovery(error?: EnhancedError) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  const recover = useCallback(async () => {
    if (!error || isRecovering) return;

    setIsRecovering(true);
    setRecoveryAttempts((prev) => prev + 1);

    try {
      const strategies = getRecoveryStrategies(error);

      for (const strategy of strategies) {
        try {
          await strategy.action();
          // If we get here, recovery was successful
          return true;
        } catch (strategyError) {
          console.warn(`Recovery strategy failed:`, strategyError);
        }
      }

      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [error, isRecovering]);

  const reset = useCallback(() => {
    setRecoveryAttempts(0);
  }, []);

  return {
    recover,
    reset,
    isRecovering,
    recoveryAttempts,
    canRecover: error?.recoverable || false,
  };
}
