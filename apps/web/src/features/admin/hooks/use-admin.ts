// This file contains admin functionality and may need type fixes
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@template/convex';
import { useAuth } from '../../auth';
import type { UserManagementFilters } from '../types';

/**
 * Hook for checking admin permissions
 */
export function useAdminAuth() {
  const { isSignedIn } = useAuth();

  const adminUser = useQuery({
    ...convexQuery(api.admin.getCurrentAdmin, {}),
    enabled: isSignedIn,
  });

  return {
    isAdmin: adminUser.data ? adminUser.data.role === 'admin' : false,
    isModerator: adminUser.data
      ? adminUser.data.role === 'moderator' || adminUser.data.role === 'admin'
      : false,
    adminUser: adminUser.data,
    isLoading: adminUser.isLoading,
    hasPermission: (permission: string) =>
      adminUser.data?.permissions?.includes(permission) || false,
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
