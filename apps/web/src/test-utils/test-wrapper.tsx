// @ts-nocheck
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  type Router,
} from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import type { TestWrapperOptions } from './types';

/**
 * Creates a comprehensive test wrapper with all necessary providers
 *
 * @param options Configuration options for the test wrapper
 * @returns React component that wraps children with all providers
 */
export function createTestWrapper(options: TestWrapperOptions = {}) {
  const {
    queryClient,
    queryOptions = { retry: false, staleTime: 0, gcTime: 0 },
    router,
    initialPath = '/',
    initialSearch = {},
    auth = { isSignedIn: true, isLoaded: true, user: { id: 'test-user-123' } },
    theme = 'light',
    features = {},
    additionalProviders = [],
  } = options;

  // Create default query client if not provided
  const testQueryClient =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: queryOptions,
        mutations: { retry: false },
      },
    });

  // Create default router if not provided
  const testRouter = router || createTestRouter(initialPath, initialSearch);

  // Mock Clerk auth provider
  const MockClerkProvider = ({ children }: { children: React.ReactNode }) => {
    // Mock the useUser hook context
    React.useEffect(() => {
      // In a real implementation, we would mock the Clerk context
      // For now, the auth mocking is handled in vitest.setup.ts
    }, []);

    return <>{children}</>;
  };

  // Mock feature flags provider
  const MockFeatureFlagsProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const FeatureFlagsContext = React.createContext(features);
    return (
      <FeatureFlagsContext.Provider value={features}>
        {children}
      </FeatureFlagsContext.Provider>
    );
  };

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    // Wrap children with all providers, starting from the innermost
    let wrappedChildren = children;

    // Apply additional providers in reverse order
    [...additionalProviders].reverse().forEach((Provider) => {
      wrappedChildren = <Provider>{wrappedChildren}</Provider>;
    });

    return (
      <QueryClientProvider client={testQueryClient}>
        <MockClerkProvider>
          <MockFeatureFlagsProvider>
            <ThemeProvider>
              <RouterProvider router={testRouter}>
                {wrappedChildren}
              </RouterProvider>
            </ThemeProvider>
          </MockFeatureFlagsProvider>
        </MockClerkProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * Creates a test router with basic configuration
 */
function createTestRouter(
  initialPath: string,
  initialSearch: Record<string, any>
): Router<any, any> {
  const rootRoute = createRootRoute({
    component: () => (
      <div data-testid="test-root">
        <div id="test-content" />
      </div>
    ),
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <div data-testid="test-index">Test Index Page</div>,
  });

  const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$',
    component: () => <div data-testid="test-catch-all">Test Catch All</div>,
  });

  const routeTree = rootRoute.addChildren([indexRoute, catchAllRoute]);

  const router = createRouter({
    routeTree,
    defaultPendingComponent: () => (
      <div data-testid="test-loading">Loading...</div>
    ),
    defaultErrorComponent: ({ error }) => (
      <div data-testid="test-error">Error: {error.message}</div>
    ),
    context: {
      queryClient: new QueryClient(),
    },
  });

  // Navigate to initial path
  router.navigate({
    to: initialPath as any,
    search: initialSearch,
  });

  return router;
}

/**
 * Creates a simple wrapper for testing individual components
 * without router context
 */
export function createSimpleTestWrapper(
  options: Omit<
    TestWrapperOptions,
    'router' | 'initialPath' | 'initialSearch'
  > = {}
) {
  const {
    queryClient,
    queryOptions = { retry: false, staleTime: 0, gcTime: 0 },
    auth = { isSignedIn: true, isLoaded: true, user: { id: 'test-user-123' } },
    theme = 'light',
    features = {},
    additionalProviders = [],
  } = options;

  const testQueryClient =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: queryOptions,
        mutations: { retry: false },
      },
    });

  const MockClerkProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  const MockFeatureFlagsProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const FeatureFlagsContext = React.createContext(features);
    return (
      <FeatureFlagsContext.Provider value={features}>
        {children}
      </FeatureFlagsContext.Provider>
    );
  };

  return function SimpleTestWrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    let wrappedChildren = children;

    [...additionalProviders].reverse().forEach((Provider) => {
      wrappedChildren = <Provider>{wrappedChildren}</Provider>;
    });

    return (
      <QueryClientProvider client={testQueryClient}>
        <MockClerkProvider>
          <MockFeatureFlagsProvider>
            <ThemeProvider>{wrappedChildren}</ThemeProvider>
          </MockFeatureFlagsProvider>
        </MockClerkProvider>
      </QueryClientProvider>
    );
  };
}
