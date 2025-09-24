import * as React from 'react';
import { useAuth, useUser, useOrganization } from '@clerk/tanstack-react-start';

export interface UseAdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  needsOrgContext: boolean;
  error?: string;
}

/**
 * Hook to check if the current user has admin privileges
 * Checks for org:admin role using Clerk's authentication
 */
export function useIsAdmin(): boolean {
  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  return React.useMemo(() => {
    // If auth or user data is still loading
    if (!authLoaded || !userLoaded) {
      return false;
    }

    // If no user is authenticated
    if (!user) {
      return false;
    }

    // Check if user has org:admin role
    const hasAdminRole =
      user.organizationMemberships?.some(
        (membership) =>
          membership.role === 'org:admin' ||
          membership.publicMetadata?.role === 'admin'
      ) || false;

    // Also check user's public metadata for admin role
    const hasAdminMetadata = user.publicMetadata?.role === 'admin' || false;

    return hasAdminRole || hasAdminMetadata;
  }, [authLoaded, userLoaded, user]);
}

/**
 * Hook that returns admin status with loading state
 */
export function useAdminAuth(): UseAdminAuthResult {
  const { isLoaded: authLoaded, orgRole } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  return React.useMemo(() => {
    // If auth or user data is still loading
    if (!authLoaded || !userLoaded || !orgLoaded) {
      return {
        isAdmin: false,
        isLoading: true,
        needsOrgContext: false,
      };
    }

    // If no user is authenticated
    if (!user) {
      return {
        isAdmin: false,
        isLoading: false,
        needsOrgContext: false,
        error: 'User not authenticated',
      };
    }

    // Check if user has admin membership in any organization
    const hasAdminMembership =
      user.organizationMemberships?.some(
        (membership) =>
          membership.role === 'Admin' ||
          membership.role === 'org:admin' ||
          membership.publicMetadata?.role === 'admin'
      ) || false;

    // Check if user's public metadata has admin role
    const hasAdminMetadata = user.publicMetadata?.role === 'admin' || false;

    // Check if user is currently in org context with admin role
    const hasOrgContext = !!organization;
    const hasActiveAdminRole = orgRole === 'Admin' || orgRole === 'org:admin';

    // Determine if user needs to select organization
    const needsOrgContext =
      (hasAdminMembership || hasAdminMetadata) && !hasOrgContext;

    return {
      isAdmin: hasActiveAdminRole || hasAdminMembership || hasAdminMetadata,
      isLoading: false,
      needsOrgContext,
    };
  }, [authLoaded, userLoaded, orgLoaded, user, organization, orgRole]);
}
