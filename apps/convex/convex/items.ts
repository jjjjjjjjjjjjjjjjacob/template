import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser as getUserFromUsers } from './users';

// Get current user (same logic as users.getCurrentUser)
export const getCurrentUser = query({
  handler: async (ctx) => {
    return await getUserFromUsers(ctx);
  },
});

// Create a new item
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to create an item');
    }

    const itemData = {
      id: crypto.randomUUID(),
      title: args.title,
      description: args.description,
      image: args.image,
      tags: args.tags,
      category: args.category,
      status: args.status || 'active',
      createdById: identity.subject,
      createdAt: Date.now(),
    };

    return await ctx.db.insert('items', itemData);
  },
});

// Get items by user
export const getByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('items')
      .withIndex('createdBy', (q) => q.eq('createdById', args.userId))
      .collect();
  },
});

// Get all items
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('items').collect();
  },
});

// Get item by ID
export const getById = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('items')
      .filter((q) => q.eq(q.field('id'), args.id))
      .first();
  },
});

// Update item
export const update = mutation({
  args: {
    id: v.id('items'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to update an item');
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(updates).filter(([_key, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(id, {
        ...filteredUpdates,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.get(id);
  },
});

// Delete item
export const remove = mutation({
  args: {
    id: v.id('items'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('You must be logged in to delete an item');
    }

    // Verify ownership
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.createdById !== identity.subject) {
      throw new Error('You can only delete your own items');
    }

    return await ctx.db.delete(args.id);
  },
});
