import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { Router } from '@tanstack/react-router';

export interface TestWrapperOptions {
  // Query client configuration
  queryClient?: QueryClient;
  queryOptions?: {
    retry?: boolean;
    staleTime?: number;
    gcTime?: number;
  };

  // Router configuration
  router?: Router<any, any>;
  initialPath?: string;
  initialSearch?: Record<string, string | string[]>;

  // Auth configuration
  auth?: {
    isSignedIn?: boolean;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    isLoaded?: boolean;
  };

  // Theme configuration
  theme?: 'light' | 'dark' | 'system';

  // Feature flags
  features?: Record<string, boolean>;

  // Custom providers
  additionalProviders?: Array<React.ComponentType<{ children: ReactNode }>>;
}

export interface MockApiHandlers {
  // Convex API mock handlers
  convex?: {
    emojis?: {
      getPopular?: () => unknown[];
      getCategories?: () => string[];
      search?: (args: { query: string }) => unknown;
      getByEmojis?: (args: { emojis: string[] }) => unknown[];
    };
    users?: {
      getCurrentUser?: () => unknown;
      updateProfile?: (args: Record<string, unknown>) => unknown;
    };
    admin?: {
      getUsers?: () => unknown[];
      getUserStats?: () => unknown;
    };
  };

  // External API handlers
  external?: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string | RegExp;
    response: unknown;
    status?: number;
  }>;
}

export interface TestUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isOnboarded?: boolean;
  role?: 'user' | 'admin' | 'moderator';
}

export interface TestAuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: TestUser | null;
}
