import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type EnhancedError, errorUtils } from '@/lib/error-handling';
import { ErrorRecovery } from './error-recovery';
import {
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Clock,
  MapPin,
  User,
  Code,
} from 'lucide-react';

export interface ErrorDisplayProps {
  error: EnhancedError;
  onDismiss?: () => void;
  onRetry?: () => void;
  showRecovery?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  variant?: 'default' | 'card' | 'inline' | 'toast';
}

/**
 * Comprehensive error display component with user-friendly messaging
 */
export function ErrorDisplay({
  error,
  onDismiss,
  onRetry,
  showRecovery = true,
  showDetails = false,
  compact = false,
  variant = 'default',
}: ErrorDisplayProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(showDetails);
  const [isCopied, setIsCopied] = useState(false);

  const getSeverityColor = (severity: typeof error.severity) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: typeof error.category) => {
    switch (category) {
      case 'network':
        return '🌐';
      case 'auth':
        return '🔐';
      case 'permission':
        return '🚫';
      case 'validation':
        return '📝';
      case 'server':
        return '🖥️';
      case 'not_found':
        return '❓';
      default:
        return '⚠️';
    }
  };

  const copyErrorDetails = async () => {
    const details = {
      id: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity,
      timestamp: new Date(error.timestamp).toISOString(),
      context: error.context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (clipboardError) {
      console.warn('Failed to copy to clipboard:', clipboardError);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (variant === 'toast') {
    return (
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="flex-1">{error.userMessage}</span>
          <div className="flex gap-1">
            {onRetry && error.retryable && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                retry
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                ×
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="border-destructive/20 bg-destructive/5 rounded-md border p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="text-destructive mt-0.5 h-4 w-4" />
          <div className="flex-1">
            <p className="text-destructive text-sm">{error.userMessage}</p>
            {!compact && (
              <div className="mt-2 flex gap-2">
                {onRetry && error.retryable && (
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    retry
                  </Button>
                )}
                {onDismiss && (
                  <Button size="sm" variant="ghost" onClick={onDismiss}>
                    dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-4">
      {/* Error header */}
      <div className="flex items-start gap-3">
        <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full">
          <span className="text-lg">{getCategoryIcon(error.category)}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">
              {error.category === 'network'
                ? 'connection problem'
                : error.category === 'auth'
                  ? 'authentication issue'
                  : error.category === 'permission'
                    ? 'access denied'
                    : error.category === 'validation'
                      ? 'invalid input'
                      : error.category === 'server'
                        ? 'server error'
                        : error.category === 'not_found'
                          ? 'not found'
                          : 'something went wrong'}
            </h3>
            <Badge
              variant="outline"
              className={getSeverityColor(error.severity)}
            >
              {error.severity}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {error.userMessage}
          </p>
        </div>
      </div>

      {/* Context information */}
      {!compact && (error.context.feature || error.context.route) && (
        <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
          {error.context.feature && (
            <div className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              <span>feature: {error.context.feature}</span>
            </div>
          )}
          {error.context.route && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>page: {error.context.route}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTimestamp(error.timestamp)}</span>
          </div>
        </div>
      )}

      {/* Recovery component */}
      {showRecovery && error.recoverable && (
        <ErrorRecovery
          error={error}
          onRecovery={onRetry}
          autoRetry={error.category === 'network'}
          maxRetries={error.category === 'network' ? 3 : 1}
          showProgress={true}
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {error.retryable && onRetry && (
          <Button onClick={onRetry} size="sm">
            try again
          </Button>
        )}

        {error.category === 'auth' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = '/sign-in')}
          >
            sign in
          </Button>
        )}

        {error.category === 'not_found' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = '/')}
          >
            go home
          </Button>
        )}

        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            dismiss
          </Button>
        )}
      </div>

      {/* Expandable error details */}
      {!compact && (
        <Accordion
          type="single"
          collapsible
          value={isDetailsOpen ? 'details' : ''}
          onValueChange={(value) => setIsDetailsOpen(value === 'details')}
        >
          <AccordionItem value="details" className="border-none">
            <AccordionTrigger className="py-2 text-sm">
              error details
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <div className="grid gap-2">
                  <div>
                    <strong>error id:</strong> {error.id}
                  </div>
                  <div>
                    <strong>message:</strong> {error.message}
                  </div>
                  <div>
                    <strong>category:</strong> {error.category}
                  </div>
                  {error.context.userId && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <strong>user:</strong> {error.context.userId}
                    </div>
                  )}
                  {error.context.metadata &&
                    Object.keys(error.context.metadata).length > 0 && (
                      <div>
                        <strong>context:</strong>
                        <pre className="mt-1 text-xs">
                          {JSON.stringify(error.context.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyErrorDetails}
                        className="flex-1"
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        {isCopied ? 'copied!' : 'copy details'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      copy error details for support
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const subject = encodeURIComponent(
                            `Error Report: ${error.category} - ${error.id}`
                          );
                          const body = encodeURIComponent(
                            `Error Details:\n\n${JSON.stringify(
                              {
                                id: error.id,
                                message: error.message,
                                category: error.category,
                                severity: error.severity,
                                timestamp: formatTimestamp(error.timestamp),
                                context: error.context,
                              },
                              null,
                              2
                            )}`
                          );
                          window.open(
                            `mailto:support@example.com?subject=${subject}&body=${body}`
                          );
                        }}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        report
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      send error report to support
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {process.env.NODE_ENV === 'development' && error.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">
                    stack trace (development)
                  </summary>
                  <pre className="bg-muted mt-2 max-h-32 overflow-auto rounded p-2">
                    {error.stack}
                  </pre>
                </details>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            error occurred
          </CardTitle>
          <CardDescription>
            an error was encountered and has been logged
          </CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div className="w-full max-w-2xl space-y-4">{content}</div>;
}

/**
 * Simple error message component for quick display
 */
export function ErrorMessage({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <div className="flex gap-1">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              retry
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Error summary component for showing multiple errors
 */
export function ErrorSummary({ errors }: { errors: EnhancedError[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const errorsBySeverity = errors.reduce(
    (acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const latestError = errors[errors.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <span>
              {errors.length} error{errors.length > 1 ? 's' : ''} detected
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>latest: {latestError.userMessage}</CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {Object.entries(errorsBySeverity).map(([severity, count]) => (
                <Badge key={severity} variant="outline">
                  {severity}: {count}
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              {errors.slice(-5).map((error) => (
                <div key={error.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatTimestamp(error.timestamp)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {error.category}
                  </Badge>
                  <span className="flex-1">{error.message}</span>
                </div>
              ))}
              {errors.length > 5 && (
                <p className="text-muted-foreground text-xs">
                  and {errors.length - 5} more...
                </p>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
