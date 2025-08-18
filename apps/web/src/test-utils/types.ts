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
  initialSearch?: Record<string, any>;

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
      getPopular?: () => any[];
      getCategories?: () => string[];
      search?: (args: any) => any;
      getByEmojis?: (args: any) => any[];
    };
    users?: {
      getCurrentUser?: () => any;
      updateProfile?: (args: any) => any;
    };
    admin?: {
      getUsers?: () => any[];
      getUserStats?: () => any;
    };
  };

  // External API handlers
  external?: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string | RegExp;
    response: any;
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
