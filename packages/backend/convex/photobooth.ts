import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePhoto = mutation({
  args: {
    storageId: v.id('_storage'),
    effect: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('photobooth_photos', {
      storageId: args.storageId,
      createdAt: Date.now(),
      effect: args.effect,
    });
  },
});

export const listPhotos = query({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db
      .query('photobooth_photos')
      .withIndex('by_createdAt')
      .order('desc')
      .take(50);

    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        let url: string | null = null;
        try {
          url = await ctx.storage.getUrl(photo.storageId);
        } catch {
          // storage item may have been deleted
        }
        return { ...photo, url };
      })
    );

    return photosWithUrls.filter((p) => p.url !== null);
  },
});
