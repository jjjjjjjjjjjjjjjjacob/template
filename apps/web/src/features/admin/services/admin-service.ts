// This file contains admin service functionality and may need type fixes
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@template/convex';
import type { AdminPermission } from '../types';

/**
 * Admin service for user management actions
 */
export function useAdminService() {
  const updateUserRole = useMutation({
    mutationFn: useConvexMutation(api.admin.updateUserRole),
  });

  const suspendUser = useMutation({
    mutationFn: useConvexMutation(api.admin.suspendUser),
  });

  const unsuspendUser = useMutation({
    mutationFn: useConvexMutation(api.admin.unsuspendUser),
  });

  const deleteUser = useMutation({
    mutationFn: useConvexMutation(api.admin.deleteUser),
  });

  const updateUserPermissions = useMutation({
    mutationFn: useConvexMutation(api.admin.updateUserPermissions),
  });

  return {
    updateUserRole,
    suspendUser,
    unsuspendUser,
    deleteUser,
    updateUserPermissions,
  };
}

/**
 * Admin utility functions
 */
export const adminUtils = {
  /**
   * Check if user has required permission
   */
  hasPermission: (
    userPermissions: AdminPermission[],
    required: AdminPermission
  ) => {
    return userPermissions.includes(required);
  },

  /**
   * Get user role display name
   */
  getRoleDisplayName: (role: string) => {
    const roleNames = {
      admin: 'administrator',
      moderator: 'moderator',
      user: 'user',
    };
    return roleNames[role as keyof typeof roleNames] || 'unknown';
  },

  /**
   * Format admin action for display
   */
  formatAction: (action: string) => {
    return action
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim();
  },

  /**
   * Get permission group
   */
  getPermissionGroup: (permission: AdminPermission) => {
    const [group] = permission.split('.');
    return group;
  },
};
