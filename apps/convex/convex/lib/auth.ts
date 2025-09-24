import type { QueryCtx, MutationCtx } from '../_generated/server';

/**
 * Authentication helper utilities
 */
export class AuthUtils {
  /**
   * Checks if user is authenticated and returns user ID
   */
  static requireAuth(userId: string | undefined): string {
    if (!userId) {
      throw new Error('Authentication required');
    }
    return userId;
  }

  /**
   * Checks if the authenticated user has admin privileges
   * Uses Clerk's organization roles to determine admin status
   */
  static async requireAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Authentication required');
    }

    // First check JWT roles from Clerk
    const hasJWTAdminRole =
      identity.role === 'org:admin' ||
      identity.role === 'admin' ||
      (Array.isArray(identity.roles) &&
        (identity.roles.includes('admin') ||
          identity.roles.includes('org:admin')));

    if (hasJWTAdminRole) {
      return; // User has admin role in JWT, allow access
    }

    // Fall back to database check if JWT doesn't have admin role
    const user = await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('external_id', identity.subject))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has admin role in the database
    // You can set this field manually in the database for admin users
    if (!user.isAdmin) {
      throw new Error('Admin privileges required to access this resource');
    }
  }

  /**
   * Checks if the authenticated user has admin privileges (non-throwing version)
   * Returns true if user is admin, false otherwise
   */
  static async isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
    try {
      await this.requireAdmin(ctx);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current authenticated user from the database
   */
  static async getCurrentUser(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('external_id', identity.subject))
      .first();
  }

  /**
   * Gets the current authenticated user or throws an error
   */
  static async getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
    const user = await this.getCurrentUser(ctx);
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Validates that a user can only access their own resources
   */
  static validateOwnership(
    currentUserId: string | undefined,
    resourceOwnerId: string,
    resourceType: string = 'resource'
  ): void {
    if (!currentUserId) {
      throw new Error('Authentication required');
    }
    if (currentUserId !== resourceOwnerId) {
      throw new Error(`You can only access your own ${resourceType}`);
    }
  }
}
