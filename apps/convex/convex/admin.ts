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

    const users = await ctx.db.query('users').collect();
    const items = await ctx.db.query('items').collect();
    const blogPosts = await ctx.db.query('blogPosts').collect();
    const resumeProfiles = await ctx.db.query('resume_profiles').collect();
    const portfolioProjects = await ctx.db.query('portfolio_projects').collect();

    const publishedPosts = blogPosts.filter((p) => p.published);
    const draftPosts = blogPosts.filter((p) => !p.published);
    const publishedProjects = portfolioProjects.filter((p) => p.published);
    const draftProjects = portfolioProjects.filter((p) => !p.published);

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const recentUsers = users.filter((u) => now - u.created_at < oneWeek);
    const recentPosts = blogPosts.filter((p) => now - p.createdAt < oneWeek);

    const postsThisMonth = blogPosts.filter((p) => now - p.createdAt < oneMonth);
    const projectsThisMonth = portfolioProjects.filter(
      (p) => now - p.createdAt < oneMonth
    );

    const postsLast6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = now - i * oneMonth;
      const monthEnd = now - (i - 1) * oneMonth;
      const count = blogPosts.filter(
        (p) => p.createdAt >= monthStart && p.createdAt < monthEnd
      ).length;
      const date = new Date(monthStart);
      postsLast6Months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        count,
      });
    }

    const contentByType = [
      { name: 'blog posts', value: blogPosts.length },
      { name: 'projects', value: portfolioProjects.length },
      { name: 'items', value: items.length },
    ];

    return {
      totalUsers: users.length,
      activeUsers: users.length,
      newUsersThisWeek: recentUsers.length,
      totalContent: items.length + blogPosts.length + portfolioProjects.length,
      pendingModeration: 0,
      blog: {
        total: blogPosts.length,
        published: publishedPosts.length,
        drafts: draftPosts.length,
        thisMonth: postsThisMonth.length,
        recentPosts: recentPosts.slice(0, 5).map((p) => ({
          id: p._id,
          title: p.title,
          slug: p.slug,
          published: p.published,
          createdAt: p.createdAt,
        })),
      },
      projects: {
        total: portfolioProjects.length,
        published: publishedProjects.length,
        drafts: draftProjects.length,
        thisMonth: projectsThisMonth.length,
        recentProjects: portfolioProjects.slice(0, 5).map((p) => ({
          id: p._id,
          title: p.title,
          slug: p.slug,
          published: p.published,
          createdAt: p.createdAt,
        })),
      },
      resume: {
        profiles: resumeProfiles.length,
      },
      charts: {
        postsOverTime: postsLast6Months,
        contentByType,
      },
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
