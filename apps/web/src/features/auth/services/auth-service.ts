// This file contains auth service functionality and may need type fixes
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { useAction } from 'convex/react';
import { api } from '@template/convex';

/**
 * Service for user-related mutations
 */
export function useAuthService() {
  const ensureUserExists = useMutation({
    mutationFn: useConvexMutation(api.users.ensureUserExists),
  });

  const updateUserProfile = useAction(api.users.updateProfile);
  const completeOnboarding = useAction(api.users.completeOnboarding);

  return {
    ensureUserExists,
    updateUserProfile,
    completeOnboarding,
  };
}

/**
 * Auth utility functions
 */
export const authUtils = {
  /**
   * Get auth redirect URL for the current page
   */
  getRedirectUrl: (currentPath?: string) => {
    if (typeof window === 'undefined') return '/';
    const url = currentPath || window.location.pathname;
    return url === '/sign-in' || url === '/sign-up' ? '/' : url;
  },

  /**
   * Check if the current route requires authentication
   */
  requiresAuth: (path: string) => {
    const protectedRoutes = ['/profile', '/onboarding', '/settings'];
    return protectedRoutes.some((route) => path.startsWith(route));
  },

  /**
   * Check if the current route is an auth route
   */
  isAuthRoute: (path: string) => {
    const authRoutes = ['/sign-in', '/sign-up'];
    return authRoutes.includes(path);
  },
};
