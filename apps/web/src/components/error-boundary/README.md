# Enhanced Error Boundary System

A comprehensive error handling system for React applications with feature-specific boundaries, user-friendly error messages, automatic recovery mechanisms, and detailed logging.

## Overview

This error boundary system provides:

- **Feature-specific error boundaries** for different parts of your application
- **Intelligent error categorization** and severity assessment
- **User-friendly error messages** with actionable recovery options
- **Automatic retry mechanisms** for recoverable errors
- **Comprehensive error logging** with PostHog integration
- **Multiple fallback UI components** for different contexts

## Quick Start

### Basic Usage

```tsx
import { BaseErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <BaseErrorBoundary>
      <YourComponent />
    </BaseErrorBoundary>
  );
}
```

### Feature-Specific Boundaries

```tsx
import {
  AuthErrorBoundary,
  DataErrorBoundary,
} from '@/components/error-boundary';

function UserProfile() {
  return (
    <AuthErrorBoundary>
      <DataErrorBoundary>
        <UserProfileContent />
      </DataErrorBoundary>
    </AuthErrorBoundary>
  );
}
```

## Components

### Error Boundaries

#### `BaseErrorBoundary`

The foundation error boundary with customizable fallback components.

```tsx
<BaseErrorBoundary
  feature="user-profile"
  fallback={CustomErrorFallback}
  onError={(error, errorInfo) => console.log('Error caught:', error)}
  resetOnPropsChange={true}
  resetKeys={[userId]}
>
  <UserContent />
</BaseErrorBoundary>
```

#### `AuthErrorBoundary`

Specialized boundary for authentication-related errors with sign-in prompts.

```tsx
<AuthErrorBoundary>
  <ProtectedContent />
</AuthErrorBoundary>
```

#### `NetworkErrorBoundary`

Network-aware boundary with connection monitoring and retry logic.

```tsx
<NetworkErrorBoundary>
  <ApiDependentComponent />
</NetworkErrorBoundary>
```

#### `DataErrorBoundary`

Data-focused boundary for API and database errors with smart recovery.

```tsx
<DataErrorBoundary>
  <DataVisualization />
</DataErrorBoundary>
```

### Fallback Components

#### Pre-built Fallbacks

```tsx
import {
  InlineErrorFallback,
  CompactErrorFallback,
  FullPageErrorFallback,
  ModalErrorFallback,
  FormErrorFallback,
  WidgetErrorFallback,
} from '@/components/error-boundary';

// Use different fallbacks for different contexts
<BaseErrorBoundary fallback={InlineErrorFallback}>
  <SmallComponent />
</BaseErrorBoundary>

<BaseErrorBoundary fallback={FullPageErrorFallback}>
  <EntirePageContent />
</BaseErrorBoundary>
```

#### Custom Fallback

```tsx
function CustomErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div>
      <h2>Something went wrong in {error.context.feature}</h2>
      <p>{error.userMessage}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  );
}
```

### Error Display Components

#### `ErrorDisplay`

Comprehensive error display with recovery options and details.

```tsx
<ErrorDisplay
  error={enhancedError}
  showRecovery={true}
  showDetails={false}
  variant="card"
  onRetry={() => refetchData()}
  onDismiss={() => closeModal()}
/>
```

#### `ErrorMessage`

Simple error message for quick inline display.

```tsx
<ErrorMessage
  message="Failed to save changes"
  onRetry={() => saveAgain()}
  onDismiss={() => clearError()}
/>
```

#### `ErrorSummary`

Summary view for multiple errors.

```tsx
<ErrorSummary errors={errorList} />
```

### Error Recovery

#### `ErrorRecovery`

Automatic error recovery with retry logic.

```tsx
<ErrorRecovery
  error={enhancedError}
  autoRetry={true}
  maxRetries={3}
  retryDelay={2000}
  onRecovery={() => console.log('Recovered!')}
  onFailure={(error) => console.log('Recovery failed')}
/>
```

#### `useErrorRecovery` Hook

```tsx
function MyComponent() {
  const { recover, isRecovering, canRecover } = useErrorRecovery(error);

  return (
    <div>
      {canRecover && (
        <button onClick={recover} disabled={isRecovering}>
          {isRecovering ? 'Recovering...' : 'Recover'}
        </button>
      )}
    </div>
  );
}
```

## Error Handling Utilities

### Error Logger

```tsx
import { errorLogger, useErrorLogging } from '@/components/error-boundary';

// Direct usage
errorLogger.logError(new Error('Something went wrong'), 'network', 'high', {
  feature: 'user-profile',
  userId: '123',
});

// In React components
function MyComponent() {
  const { logError, logNetworkError } = useErrorLogging();

  const handleApiError = (error: Error) => {
    logNetworkError(error, '/api/users', 'GET', {
      feature: 'user-list',
      action: 'fetch_users',
    });
  };
}
```

### Error Categories

The system automatically categorizes errors:

- `network` - Connection and API errors
- `auth` - Authentication and authorization errors
- `validation` - Input validation errors
- `permission` - Access permission errors
- `not_found` - Resource not found errors
- `server` - Server-side errors
- `client` - Client-side errors
- `unknown` - Uncategorized errors

### Error Severity Levels

- `low` - Minor issues that don't affect core functionality
- `medium` - Issues that affect some functionality
- `high` - Issues that affect core functionality
- `critical` - Issues that break the application

## Integration with Existing Code

### With TanStack Router

```tsx
// In route configuration
export const Route = createFileRoute('/users/$userId')({
  component: () => (
    <DataErrorBoundary>
      <UserProfile />
    </DataErrorBoundary>
  ),
  errorComponent: ({ error }) => (
    <FullPageErrorFallback
      error={errorUtils.enhanceError(error)}
      resetError={() => window.location.reload()}
    />
  ),
});
```

### With Forms

```tsx
function UserForm() {
  return (
    <BaseErrorBoundary fallback={FormErrorFallback}>
      <form>
        <AuthErrorBoundary>
          <ProtectedFormFields />
        </AuthErrorBoundary>
        <DataErrorBoundary>
          <FormSubmissionLogic />
        </DataErrorBoundary>
      </form>
    </BaseErrorBoundary>
  );
}
```

### With Data Fetching

```tsx
function UserList() {
  const { data, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (error) {
    return (
      <ErrorDisplay
        error={errorLogger.logNetworkError(error, '/api/users')}
        showRecovery={true}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <DataErrorBoundary>
      <UserListContent data={data} />
    </DataErrorBoundary>
  );
}
```

## Best Practices

### 1. Layer Error Boundaries

Use multiple boundaries for different levels of your application:

```tsx
function App() {
  return (
    <BaseErrorBoundary fallback={FullPageErrorFallback}>
      <Layout>
        <AuthErrorBoundary>
          <NetworkErrorBoundary>
            <DataErrorBoundary>
              <PageContent />
            </DataErrorBoundary>
          </NetworkErrorBoundary>
        </AuthErrorBoundary>
      </Layout>
    </BaseErrorBoundary>
  );
}
```

### 2. Use Appropriate Fallbacks

Choose fallbacks based on context:

- `FullPageErrorFallback` for route-level errors
- `CompactErrorFallback` for widgets and sidebars
- `InlineErrorFallback` for form fields and small components
- `ModalErrorFallback` for dialog content

### 3. Provide Context

Always provide meaningful context for better error tracking:

```tsx
<BaseErrorBoundary
  feature="shopping-cart"
  context={{
    userId: user.id,
    cartId: cart.id,
    metadata: { itemCount: cart.items.length },
  }}
>
  <CartContents />
</BaseErrorBoundary>
```

### 4. Handle Async Errors

For async operations, manually log errors:

```tsx
async function saveData() {
  try {
    await api.saveUser(userData);
  } catch (error) {
    errorLogger.logError(error, 'validation', 'medium', {
      feature: 'user-profile',
      action: 'save',
    });
    throw error; // Re-throw to trigger error boundary
  }
}
```

### 5. Test Error Scenarios

Test error boundaries in development:

```tsx
// Add a button to trigger errors in development
{
  process.env.NODE_ENV === 'development' && (
    <button
      onClick={() => {
        throw new Error('Test error');
      }}
    >
      Trigger Error
    </button>
  );
}
```

## Configuration

### Environment Variables

```env
# PostHog configuration for error tracking
VITE_POSTHOG_API_KEY=your_api_key
VITE_POSTHOG_API_HOST=https://app.posthog.com
```

### Error Logger Configuration

```tsx
// Configure error logger on app startup
errorLogger.configure({
  maxStoredErrors: 100,
  enableAnalytics: true,
  logLevel: 'medium',
});
```

## Development Tools

### Error Statistics

```tsx
// Get error statistics for debugging
const stats = errorLogger.getErrorStats();
console.log('Error breakdown:', stats);

// Get recent errors
const recentErrors = errorLogger.getRecentErrors(10);
console.log('Recent errors:', recentErrors);
```

### Error Testing

```tsx
// Test error boundary in development
import { ErrorBoundaryTester } from '@/components/error-boundary/dev-tools';

function App() {
  return (
    <div>
      {process.env.NODE_ENV === 'development' && <ErrorBoundaryTester />}
      <YourApp />
    </div>
  );
}
```

## Migration Guide

### From Existing Error Boundaries

1. Replace existing error boundaries with feature-specific ones:

```tsx
// Before
<ErrorBoundary>
  <Component />
</ErrorBoundary>

// After
<AuthErrorBoundary>
  <Component />
</AuthErrorBoundary>
```

2. Update error logging:

```tsx
// Before
console.error('Error:', error);

// After
errorLogger.logError(error, 'network', 'high', {
  feature: 'my-feature',
  context: additionalContext,
});
```

3. Add recovery mechanisms:

```tsx
// Before
<div>Error occurred</div>

// After
<ErrorDisplay
  error={error}
  showRecovery={true}
  onRetry={retryFunction}
/>
```

## TypeScript Support

The error boundary system is fully typed:

```tsx
interface CustomErrorContext extends ErrorContext {
  customField: string;
}

const customError: EnhancedError = {
  // ... error properties with full type support
};
```

## Performance Considerations

- Error boundaries only catch errors during rendering, not in async operations
- Use `resetKeys` to automatically reset boundaries when dependencies change
- Consider using `React.memo` for expensive fallback components
- Error logging is optimized with batching and throttling

## Troubleshooting

### Common Issues

1. **Error boundary not catching errors**: Ensure the error occurs during rendering
2. **Infinite error loops**: Check that fallback components don't throw errors
3. **Missing error context**: Add feature and context props to boundaries
4. **PostHog not receiving errors**: Verify PostHog configuration and initialization

### Debug Mode

Enable debug mode in development:

```tsx
// Show all error details in development
<ErrorDisplay
  error={error}
  showDetails={process.env.NODE_ENV === 'development'}
/>
```
