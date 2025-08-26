import { vi } from 'vitest';

/**
 * Sets up global test environment configuration
 * Should be called once in test setup files
 */
export function setupTestEnvironment() {
  // Mock global browser APIs
  mockBrowserAPIs();

  // Setup global test utilities
  setupGlobalMocks();

  // Configure test timeouts
  vi.setConfig({
    testTimeout: 5000,
    hookTimeout: 5000,
  });
}

function mockBrowserAPIs() {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
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

  // Mock HTMLElement methods that might be missing in JSDOM
  if (typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  }

  // Mock window.location methods
  delete (window as { location?: unknown }).location;
  (window as { location: typeof window.location }).location = {
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    ancestorOrigins: {} as DOMStringList,
    hash: '',
    host: 'localhost:3000',
    hostname: 'localhost',
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    pathname: '/',
    port: '3000',
    protocol: 'http:',
    search: '',
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock URL for file uploads
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();
}

function setupGlobalMocks() {
  // Mock console methods to avoid test output pollution
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Reset mocks before each test
  vi.clearAllMocks();
}

/**
 * Creates a test user object with sensible defaults
 */
export function createTestUser(
  overrides: Partial<{
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    isOnboarded?: boolean;
    role?: string;
  }> = {}
) {
  return {
    id: 'test-user-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    isOnboarded: true,
    role: 'user',
    ...overrides,
  };
}

/**
 * Creates mock emoji data for testing
 */
export function createTestEmoji(
  overrides: Partial<{
    emoji?: string;
    name?: string;
    color?: string;
    keywords?: string[];
    category?: string;
    popularity?: number;
  }> = {}
) {
  return {
    emoji: '🔥',
    name: 'fire',
    color: '#FF6B6B',
    keywords: ['hot', 'flame'],
    category: 'symbols',
    popularity: 100,
    ...overrides,
  };
}

/**
 * Creates mock search results for testing
 */
export function createTestSearchResults(
  overrides: Partial<{
    emojis?: unknown[];
    hasMore?: boolean;
    page?: number;
    totalCount?: number;
  }> = {}
) {
  return {
    emojis: [
      createTestEmoji(),
      createTestEmoji({ emoji: '😍', name: 'heart eyes', color: '#FF6B9D' }),
    ],
    hasMore: false,
    page: 0,
    pageSize: 50,
    totalCount: 2,
    ...overrides,
  };
}

/**
 * Wait for next tick in tests
 */
export function waitForNextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Wait for component to update (useful for async operations)
 */
export function waitForComponentUpdate(timeout = 100) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
