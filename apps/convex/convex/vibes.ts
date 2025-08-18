import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser as getUserFromUsers } from './users';

// Get current user (same logic as users.getCurrentUser)
export const getCurrentUser = query({
  handler: async (ctx) => {
    return await getUserFromUsers(ctx);
  },
});

// Create a new vibe
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to create a vibe');
    }

    const vibeData = {
      id: crypto.randomUUID(),
      title: args.title,
      description: args.description,
      image: args.image,
      tags: args.tags,
      createdById: identity.subject,
      createdAt: new Date().toISOString(),
    };

    return await ctx.db.insert('vibes', vibeData);
  },
});

// Get vibes by user
export const getByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('vibes')
      .withIndex('createdBy', (q) => q.eq('createdById', args.userId))
      .collect();
  },
});
