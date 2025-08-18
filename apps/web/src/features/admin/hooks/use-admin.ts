// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@template/convex';
import { useAuth } from '../../auth';
import type { AdminStats, AdminUser, UserManagementFilters } from '../types';

/**
 * Hook for checking admin permissions
 */
export function useAdminAuth() {
  const { user, isSignedIn } = useAuth();

  const adminUser = useQuery({
    ...convexQuery(api.admin.getCurrentAdmin, {}),
    enabled: isSignedIn,
  });

  return {
    isAdmin: adminUser.data?.role === 'admin',
    isModerator:
      adminUser.data?.role === 'moderator' || adminUser.data?.role === 'admin',
    adminUser: adminUser.data,
    isLoading: adminUser.isLoading,
    hasPermission: (permission: string) =>
      adminUser.data?.permissions.includes(permission as any) || false,
  };
}

/**
 * Hook for admin dashboard stats
 */
export function useAdminStats() {
  const { isAdmin } = useAdminAuth();

  return useQuery({
    ...convexQuery(api.admin.getStats, {}),
    enabled: isAdmin,
  });
}

/**
 * Hook for user management
 */
export function useUserManagement(filters?: UserManagementFilters) {
  const { isAdmin, isModerator } = useAdminAuth();

  return useQuery({
    ...convexQuery(api.admin.getUsers, { filters: filters || {} }),
    enabled: isAdmin || isModerator,
  });
}
