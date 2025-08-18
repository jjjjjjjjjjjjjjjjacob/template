// @ts-nocheck
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@template/convex';
import type { AuthState, AuthUser } from '../types';

// Re-export auth service functions for convenience
export { useAuthService, authUtils } from '../services/auth-service';

/**
 * Main auth hook that combines Clerk user state with Convex user data
 */
export function useAuth(): AuthState {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  const convexUser = useQuery({
    ...convexQuery(api.users.current, {}),
    enabled: isSignedIn && isLoaded,
  });

  const onboardingStatus = useQuery({
    ...convexQuery(api.users.getOnboardingStatus, {}),
    enabled: isSignedIn && isLoaded,
  });

  // Transform Clerk user to our AuthUser type
  const user: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        username: clerkUser.username,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        createdAt: clerkUser.createdAt?.toISOString() || null,
      }
    : null;

  return {
    user,
    isLoaded,
    isSignedIn: !!isSignedIn,
    isOnboarded: onboardingStatus.data?.isOnboarded,
  };
}

/**
 * Hook for checking if user is authenticated with loading states
 */
export function useAuthGuard() {
  const auth = useAuth();

  return {
    ...auth,
    isAuthenticated: auth.isLoaded && auth.isSignedIn,
    isReady: auth.isLoaded,
    needsOnboarding: auth.isSignedIn && auth.isOnboarded === false,
  };
}

/**
 * Hook for getting current user with error handling
 */
export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useAuth();

  return {
    user,
    isLoading: !isLoaded,
    isSignedIn,
    isGuest: isLoaded && !isSignedIn,
  };
}
