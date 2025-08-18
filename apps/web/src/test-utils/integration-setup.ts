import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupTestEnvironment, createTestUser } from './setup';
import { mockApiFactory } from './mock-api-factory';

// Create the MSW server
const server = mockApiFactory.createServer();

/**
 * Integration test setup
 * This file is loaded by the integration test config
 */

// Setup environment and start server before all tests
beforeAll(() => {
  setupTestEnvironment();

  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests in tests
  });

  // Override console methods to reduce noise in tests
  console.warn = () => {}; // Silence warnings in tests
  console.error = () => {}; // Silence errors in tests (test errors will still show)
});

// Reset handlers and clear mocks after each test
afterEach(() => {
  server.resetHandlers();

  // Reset any global state that might persist between tests
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Export server for test-specific handler modifications
export { server };

/**
 * Test data factories for integration tests
 */
export const testData = {
  users: {
    regular: () =>
      createTestUser({
        id: 'user-regular',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
      }),

    admin: () =>
      createTestUser({
        id: 'user-admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      }),

    moderator: () =>
      createTestUser({
        id: 'user-moderator',
        firstName: 'Moderator',
        lastName: 'User',
        role: 'moderator',
      }),

    unboarded: () =>
      createTestUser({
        id: 'user-unboarded',
        firstName: 'New',
        lastName: 'User',
        isOnboarded: false,
      }),
  },

  scenarios: {
    // Pre-configured test scenarios
    emptySearchResults: {
      convex: {
        emojis: {
          search: () => ({
            emojis: [],
            hasMore: false,
            page: 0,
            pageSize: 50,
            totalCount: 0,
          }),
        },
      },
    },

    loadingState: {
      // This would be configured in individual tests
      // by modifying query loading states
    },

    errorState: {
      external: [
        {
          method: 'GET' as const,
          url: 'https://api.example.com/data',
          response: { error: 'Service unavailable' },
          status: 503,
        },
      ],
    },
  },
};

/**
 * Helper to set up authentication state for integration tests
 */
export function setupAuthForIntegrationTest(
  authState: 'signed-in' | 'signed-out' | 'loading' | 'admin'
) {
  const authStates = {
    'signed-in': {
      isSignedIn: true,
      isLoaded: true,
      user: testData.users.regular(),
    },
    'signed-out': {
      isSignedIn: false,
      isLoaded: true,
      user: null,
    },
    loading: {
      isSignedIn: false,
      isLoaded: false,
      user: null,
    },
    admin: {
      isSignedIn: true,
      isLoaded: true,
      user: testData.users.admin(),
    },
  };

  return authStates[authState];
}
