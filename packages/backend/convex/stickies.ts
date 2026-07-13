import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const stickyColor = v.union(
  v.literal('yellow'),
  v.literal('blue'),
  v.literal('green'),
  v.literal('pink'),
  v.literal('purple'),
  v.literal('gray')
);

const stickyFields = {
  content: v.string(),
  color: stickyColor,
  x: v.number(),
  y: v.number(),
  width: v.number(),
  height: v.number(),
  isCollapsed: v.optional(v.boolean()),
  isTranslucent: v.optional(v.boolean()),
  isZoomed: v.optional(v.boolean()),
} as const;

export const listStickies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('stickies')
      .withIndex('by_createdAt')
      .order('asc')
      .collect();
  },
});

export const ensureDefaultStickies = mutation({
  args: {
    stickies: v.array(v.object(stickyFields)),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('stickies')
      .withIndex('by_createdAt')
      .take(1);

    if (existing.length > 0) {
      return await ctx.db
        .query('stickies')
        .withIndex('by_createdAt')
        .order('asc')
        .collect();
    }

    const now = Date.now();
    const stickyIds = await Promise.all(
      args.stickies.map((sticky, index) =>
        ctx.db.insert('stickies', {
          ...sticky,
          createdAt: now + index,
          updatedAt: now + index,
        })
      )
    );

    return (
      await Promise.all(stickyIds.map((stickyId) => ctx.db.get(stickyId)))
    ).filter((sticky) => sticky !== null);
  },
});

export const createSticky = mutation({
  args: stickyFields,
  handler: async (ctx, args) => {
    const now = Date.now();
    const stickyId = await ctx.db.insert('stickies', {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(stickyId);
  },
});

export const updateSticky = mutation({
  args: {
    stickyId: v.id('stickies'),
    content: v.optional(v.string()),
    color: v.optional(stickyColor),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    isCollapsed: v.optional(v.boolean()),
    isTranslucent: v.optional(v.boolean()),
    isZoomed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, boolean | number | string> = {
      updatedAt: Date.now(),
    };

    if (args.content !== undefined) patch.content = args.content;
    if (args.color !== undefined) patch.color = args.color;
    if (args.x !== undefined) patch.x = args.x;
    if (args.y !== undefined) patch.y = args.y;
    if (args.width !== undefined) patch.width = args.width;
    if (args.height !== undefined) patch.height = args.height;
    if (args.isCollapsed !== undefined) patch.isCollapsed = args.isCollapsed;
    if (args.isTranslucent !== undefined) {
      patch.isTranslucent = args.isTranslucent;
    }
    if (args.isZoomed !== undefined) patch.isZoomed = args.isZoomed;

    await ctx.db.patch(args.stickyId, patch);
    return await ctx.db.get(args.stickyId);
  },
});

export const deleteSticky = mutation({
  args: {
    stickyId: v.id('stickies'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.stickyId);
  },
});
