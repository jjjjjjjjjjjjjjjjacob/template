import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { MockApiHandlers } from './types';
import {
  createTestEmoji,
  createTestSearchResults,
  createTestUser,
} from './setup';

/**
 * Factory for creating API mock handlers using MSW
 * This provides a clean way to mock both Convex and external APIs
 */
export class MockApiFactory {
  private handlers: Array<
    | ReturnType<typeof http.get>
    | ReturnType<typeof http.post>
    | ReturnType<typeof http.put>
    | ReturnType<typeof http.delete>
  > = [];

  constructor() {
    this.setupDefaultHandlers();
  }

  /**
   * Setup default mock handlers for common API endpoints
   */
  private setupDefaultHandlers() {
    // Mock external API endpoints that might be called
    this.handlers.push(
      // PostHog analytics (if called from components)
      http.post('https://app.posthog.com/capture/', () => {
        return HttpResponse.json({ status: 'ok' });
      }),

      // Clerk authentication endpoints
      http.get('https://api.clerk.dev/*', () => {
        return HttpResponse.json({ user: createTestUser() });
      }),

      // Generic catch-all for unhandled external requests
      http.get('*', ({ request }) => {
        const url = request.url.toString();

        // Only log warnings for external requests, not our app routes
        if (url.startsWith('http') && !url.includes('localhost')) {
          // // console.warn(`Unhandled external request: ${request.method} ${url}`);
        }

        return HttpResponse.json({});
      })
    );
  }

  /**
   * Add custom handlers for specific test scenarios
   */
  addHandlers(handlers: MockApiHandlers) {
    if (handlers.external) {
      handlers.external.forEach(({ method, url, response, status = 200 }) => {
        const httpMethod = method.toLowerCase() as keyof typeof http;
        const handler = http[httpMethod](url, () => {
          return HttpResponse.json(response as Record<string, unknown>, {
            status,
          });
        });
        this.handlers.push(handler);
      });
    }

    return this;
  }

  /**
   * Create MSW server with all handlers
   */
  createServer() {
    return setupServer(...this.handlers);
  }

  /**
   * Get all handlers (useful for runtime handler modification)
   */
  getHandlers() {
    return [...this.handlers];
  }

  /**
   * Clear all custom handlers (keeps defaults)
   */
  reset() {
    this.handlers = [];
    this.setupDefaultHandlers();
    return this;
  }
}

/**
 * Pre-configured mock factory with common test data
 */
export const mockApiFactory = new MockApiFactory();

/**
 * Mock Convex API responses
 * Since Convex is mocked at the React Query level in vitest.setup.ts,
 * these utilities help create consistent mock data
 */
export const convexMocks = {
  emojis: {
    popular: () => [
      createTestEmoji({ emoji: '🔥', name: 'fire', popularity: 100 }),
      createTestEmoji({ emoji: '😍', name: 'heart eyes', popularity: 95 }),
      createTestEmoji({ emoji: '💯', name: 'hundred', popularity: 90 }),
    ],

    categories: () => [
      'smileys',
      'people',
      'animals',
      'food',
      'objects',
      'symbols',
    ],

    search: (searchTerm?: string) => {
      if (searchTerm === 'notfound') {
        return createTestSearchResults({ emojis: [], totalCount: 0 });
      }

      return createTestSearchResults({
        emojis: [
          createTestEmoji({ emoji: '🔥', name: 'fire' }),
          createTestEmoji({ emoji: '🔴', name: 'red circle' }),
        ],
        totalCount: 2,
      });
    },

    byEmojis: (emojis: string[]) =>
      emojis.map((emoji) => createTestEmoji({ emoji })),
  },

  users: {
    current: (overrides = {}) => createTestUser(overrides),

    list: (count = 3) =>
      Array.from({ length: count }, (_, i) =>
        createTestUser({
          id: `user-${i + 1}`,
          firstName: `User${i + 1}`,
        })
      ),
  },

  admin: {
    stats: () => ({
      totalUsers: 150,
      activeUsers: 120,
      totalEmojis: 3000,
      popularEmojis: 50,
    }),
  },
};

/**
 * Create a server with specific mock scenarios
 */
export function createMockServer(handlers: MockApiHandlers = {}) {
  return mockApiFactory.addHandlers(handlers).createServer();
}

/**
 * Helper to create error responses for testing error states
 */
export function createErrorHandler(
  url: string,
  status = 500,
  message = 'Internal Server Error'
) {
  return http.get(url, () => {
    return HttpResponse.json({ error: message }, { status });
  });
}

/**
 * Helper to create delayed responses for testing loading states
 */
export function createDelayedHandler(
  url: string,
  response: unknown,
  delay = 1000
) {
  return http.get(url, async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return HttpResponse.json(response as Record<string, unknown>);
  });
}
