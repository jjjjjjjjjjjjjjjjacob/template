/// <reference lib="dom" />
import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock data
const mockPopularEmojis = [
  { emoji: '🔥', name: 'fire', color: '#FF6B6B', keywords: ['hot', 'flame'] },
  {
    emoji: '😍',
    name: 'heart eyes',
    color: '#FF6B9D',
    keywords: ['love', 'crush'],
  },
  {
    emoji: '💯',
    name: '100',
    color: '#4ECDC4',
    keywords: ['perfect', 'score'],
  },
];

const mockCategoryEmojis = [
  {
    emoji: '😀',
    name: 'grinning face',
    color: '#FFD93D',
    keywords: ['smile', 'happy'],
    category: 'smileys',
  },
  {
    emoji: '😃',
    name: 'grinning face with big eyes',
    color: '#FFD93D',
    keywords: ['smile', 'happy'],
    category: 'smileys',
  },
  {
    emoji: '😄',
    name: 'grinning face with smiling eyes',
    color: '#FFD93D',
    keywords: ['smile', 'happy'],
    category: 'smileys',
  },
  {
    emoji: '👋',
    name: 'waving hand',
    color: '#FFCB6B',
    keywords: ['hello', 'goodbye'],
    category: 'people',
  },
  {
    emoji: '👍',
    name: 'thumbs up',
    color: '#FFCB6B',
    keywords: ['like', 'approve'],
    category: 'people',
  },
];

const mockSearchResults = [
  { emoji: '🔥', name: 'fire', color: '#FF6B6B', keywords: ['hot', 'flame'] },
  {
    emoji: '🔴',
    name: 'red circle',
    color: '#FF0000',
    keywords: ['red', 'circle'],
  },
];

// Mock @convex-dev/react-query to return mock data immediately
const mockConvexQuery = vi.fn(
  (query: unknown, args: Record<string, unknown>) => {
    // Default structure for all queries
    const baseQuery = {
      queryKey: ['convexQuery', query, args],
      queryFn: async (): Promise<unknown> => {
        // Default return for unknown queries
        return [];
      },
      enabled: args?.enabled !== false,
      staleTime: 0,
    };

    // Log for debugging
    // console.log('convexQuery called with:', { query, args });

    // Try to identify the query function name from various possible structures
    let functionName = '';

    try {
      // Safely extract function name from query object
      if (query) {
        // Try JSON stringify to see the structure, handling circular references
        let queryStr = '';
        try {
          queryStr = JSON.stringify(query);
        } catch {
          // Handle circular reference or other stringify errors
          if (query.toString) {
            queryStr = query.toString();
          }
        }

        // Look for function names in the stringified version
        if (queryStr && typeof queryStr === 'string') {
          if (queryStr.includes('getPopular')) {
            functionName = 'getPopular';
          } else if (queryStr.includes('getCategories')) {
            functionName = 'getCategories';
          } else if (queryStr.includes('search')) {
            functionName = 'search';
          }
        }

        // Check if query is a string (from our mock)
        if (typeof query === 'string') {
          if (query.includes('getPopular')) {
            functionName = 'getPopular';
          } else if (query.includes('getCategories')) {
            functionName = 'getCategories';
          } else if (query.includes('search')) {
            functionName = 'search';
          }
        }

        // Also try direct property access
        if (!functionName && typeof query === 'object' && query !== null) {
          // First check direct properties
          const queryObj = query as Record<string, unknown>;
          functionName = String(
            (queryObj as { _name?: unknown })._name ||
              (queryObj as { name?: unknown }).name ||
              (queryObj as { functionName?: unknown }).functionName ||
              ''
          );

          // Check nested properties if still no function name
          if (!functionName) {
            try {
              const queryKeys = Object.keys(query);
              for (const key of queryKeys) {
                const value = (query as Record<string, unknown>)[key];
                if (value && typeof value === 'object') {
                  if (
                    (value as { _name?: unknown })._name ||
                    (value as { name?: unknown }).name
                  ) {
                    functionName = String(
                      (value as { _name?: unknown })._name ||
                        (value as { name?: unknown }).name
                    );
                    break;
                  }
                  // Check if the key itself might be the function name
                  if (
                    key === 'getPopular' ||
                    key === 'getCategories' ||
                    key === 'search'
                  ) {
                    functionName = key;
                    break;
                  }
                }
              }
            } catch {
              // Ignore errors when accessing properties
            }
          }
        }
      }
    } catch {
      // If any error occurs during extraction, just use empty string
      functionName = '';
    }

    // Ensure functionName is always a string
    if (typeof functionName !== 'string') {
      functionName = '';
    }

    // Match against our expected function names
    const fnStr = String(functionName || '');
    if (fnStr === 'getPopular' || fnStr.includes('getPopular')) {
      // Return the array directly for getPopular
      baseQuery.queryFn = async (): Promise<unknown[]> => mockPopularEmojis;
    } else if (fnStr === 'getCategories' || fnStr.includes('getCategories')) {
      baseQuery.queryFn = async (): Promise<string[]> => [
        'smileys',
        'people',
        'animals',
        'food',
      ];
    } else if (fnStr === 'search' || fnStr.includes('search')) {
      baseQuery.queryFn = async (): Promise<unknown> => {
        if (args?.searchTerm) {
          if (args.searchTerm === 'xyzabc123notfound') {
            return {
              emojis: [],
              hasMore: false,
              page: 0,
              pageSize: 50,
              totalCount: 0,
            };
          }

          return {
            emojis: mockSearchResults,
            hasMore: false,
            page: args.page || 0,
            pageSize: args.pageSize || 50,
            totalCount: mockSearchResults.length,
          };
        }

        // Category browsing
        return {
          emojis: args?.page === 0 ? mockCategoryEmojis : [],
          hasMore: args?.page === 0,
          page: args.page || 0,
          pageSize: args.pageSize || 200,
          totalCount: mockCategoryEmojis.length,
        };
      };
    }

    return baseQuery;
  }
);

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: mockConvexQuery,
}));

// Also mock the api import to provide consistent function references
vi.mock('@template/convex', () => ({
  api: {
    emojis: {
      getPopular: 'api.emojis.getPopular',
      getCategories: 'api.emojis.getCategories',
      search: 'api.emojis.search',
      getByEmojis: 'api.emojis.getByEmojis',
    },
    emojiRatings: {
      getEmojiMetadata: 'api.emojiRatings.getEmojiMetadata',
      getAllEmojiMetadata: 'api.emojiRatings.getAllEmojiMetadata',
      getEmojiByCategory: 'api.emojiRatings.getEmojiByCategory',
    },
  },
}));

// Mock @clerk/tanstack-react-start
vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({
    user: { id: 'user123', firstName: 'Test', lastName: 'User' },
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLElement.prototype methods that might be missing
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}
