import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getByIpKey = query({
  args: {
    ipKey: v.string(),
  },
  handler: async (ctx, args) => {
    const wallpaper = await ctx.db
      .query('wallpaper_preferences')
      .withIndex('by_ipKey', (q) => q.eq('ipKey', args.ipKey))
      .unique();

    if (!wallpaper) {
      return null;
    }

    let url: string | null = null;
    try {
      url = await ctx.storage.getUrl(wallpaper.storageId);
    } catch {
      url = null;
    }

    if (!url) {
      return null;
    }

    return {
      ...wallpaper,
      url,
    };
  },
});

export const saveForIpKey = mutation({
  args: {
    ipKey: v.string(),
    storageId: v.id('_storage'),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('wallpaper_preferences')
      .withIndex('by_ipKey', (q) => q.eq('ipKey', args.ipKey))
      .unique();

    const updatedAt = Date.now();

    if (existing) {
      if (existing.storageId !== args.storageId) {
        try {
          await ctx.storage.delete(existing.storageId);
        } catch {
          // Ignore stale storage cleanup failures and keep the preference update.
        }
      }

      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        fileName: args.fileName,
        mimeType: args.mimeType,
        updatedAt,
      });

      return existing._id;
    }

    return await ctx.db.insert('wallpaper_preferences', {
      ipKey: args.ipKey,
      storageId: args.storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      updatedAt,
    });
  },
});

export const clearForIpKey = mutation({
  args: {
    ipKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('wallpaper_preferences')
      .withIndex('by_ipKey', (q) => q.eq('ipKey', args.ipKey))
      .unique();

    if (!existing) {
      return null;
    }

    try {
      await ctx.storage.delete(existing.storageId);
    } catch {
      // Ignore missing storage and still remove the preference record.
    }

    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
