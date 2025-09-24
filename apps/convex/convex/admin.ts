import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from './lib/auth';

// Admin queries for user management and system stats
export const getCurrentAdmin = query({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    role: 'admin' | 'moderator' | 'user';
    permissions: string[];
    id: string;
  } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await AuthUtils.getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Check if user has admin privileges
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      return null;
    }

    return {
      id: user._id,
      role: 'admin',
      permissions: [
        'read',
        'write',
        'delete',
        'manage_users',
        'manage_content',
      ],
    };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    // Basic stats - can be expanded later
    const users = await ctx.db.query('users').collect();
    const items = await ctx.db.query('items').collect();
    const blogPosts = await ctx.db.query('blogPosts').collect();

    return {
      totalUsers: users.length,
      activeUsers: users.length, // For now, assume all users are active
      totalContent: items.length + blogPosts.length,
      pendingModeration: 0,
    };
  },
});

export const getUsers = query({
  args: {
    filters: v.optional(
      v.object({
        role: v.optional(
          v.union(v.literal('admin'), v.literal('moderator'), v.literal('user'))
        ),
        status: v.optional(
          v.union(
            v.literal('active'),
            v.literal('suspended'),
            v.literal('banned')
          )
        ),
      })
    ),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    const { filters, page = 1, limit = 50 } = args;
    let users = await ctx.db.query('users').collect();

    // Apply filters if provided
    if (filters?.role) {
      users = users.filter((user) => {
        if (filters.role === 'admin') return user.isAdmin;
        if (filters.role === 'user') return !user.isAdmin;
        // For now, we don't have moderator role
        return false;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers.map((user) => ({
        id: user._id,
        external_id: user.external_id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.isAdmin ? 'admin' : 'user',
        status: 'active', // For now, all users are active
        created_at: user.created_at,
        updated_at: user.updated_at,
      })),
      total: users.length,
      page,
      limit,
    };
  },
});

// Mutation to set user admin status (only for development/setup)
// In production, use Clerk organizations or set this manually in the database
export const setUserAdminStatus = mutation({
  args: {
    userEmail: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    // For now, allow any authenticated user to call this for setup
    // In production, you'd want to restrict this further
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Authentication required');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.userEmail))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      isAdmin: args.isAdmin,
    });

    return { success: true, userId: user._id, isAdmin: args.isAdmin };
  },
});

export const getUserDetails = query({
  args: {
    userId: v.string(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    // Return null for now - can be implemented later
    return null;
  },
});

export const getActions = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    // Return empty list for now - can be implemented later
    return [];
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.string(),
    role: v.string(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    // Return null for now - can be implemented later
    return null;
  },
});

export const suspendUser = mutation({
  args: {
    userId: v.string(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    // Return null for now - can be implemented later
    return null;
  },
});

export const unsuspendUser = mutation({
  args: {
    userId: v.string(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    // Return null for now - can be implemented later
    return null;
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.string(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    // Return null for now - can be implemented later
    return null;
  },
});

export const updateUserPermissions = mutation({
  args: {
    userId: v.string(),
    permissions: v.array(v.string()),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    // Return null for now - can be implemented later
    return null;
  },
});
