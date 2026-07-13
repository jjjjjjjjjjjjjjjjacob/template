import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { AuthUtils } from './lib/auth';

const mediaValidator = v.object({
  type: v.union(v.literal('image'), v.literal('video'), v.literal('iframe')),
  storageId: v.optional(v.id('_storage')),
  url: v.optional(v.string()),
  caption: v.optional(v.string()),
  order: v.number(),
});

const achievementValidator = v.object({
  description: v.string(),
  impact: v.optional(v.string()),
  technologies: v.array(v.string()),
  domains: v.array(v.string()),
  type: v.string(),
  priority: v.number(),
});

const projectInput = v.object({
  slug: v.string(),
  title: v.string(),
  url: v.optional(v.string()),
  description: v.string(),
  role: v.string(),
  company: v.optional(v.string()),
  timeline: v.string(),
  // DEPRECATED: Use achievements instead. Kept for backwards compatibility.
  responsibilities: v.optional(v.array(v.string())),
  technologies: v.array(v.string()),
  achievements: v.optional(v.array(achievementValidator)),
  order: v.number(),
  published: v.boolean(),
  media: v.array(mediaValidator),
  thumbnailIndex: v.optional(v.number()),
  // DEPRECATED: Will be derived from junction table. Kept for backwards compatibility.
  includeInResume: v.optional(v.boolean()),
  resumeProfileSlugs: v.optional(v.array(v.string())),
});

export const list = query({
  args: {
    includeUnpublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let projects;

    if (args.includeUnpublished) {
      const isAdmin = await AuthUtils.isAdmin(ctx);
      if (!isAdmin) {
        projects = await ctx.db
          .query('portfolio_projects')
          .withIndex('by_published_order', (q) => q.eq('published', true))
          .collect();
      } else {
        projects = await ctx.db
          .query('portfolio_projects')
          .withIndex('by_order')
          .collect();
      }
    } else {
      projects = await ctx.db
        .query('portfolio_projects')
        .withIndex('by_published_order', (q) => q.eq('published', true))
        .collect();
    }

    const projectsWithUrls = await Promise.all(
      projects.map(async (project) => {
        const mediaWithUrls = await Promise.all(
          project.media.map(async (m) => {
            if (m.storageId) {
              const url = await ctx.storage.getUrl(m.storageId);
              return { ...m, url: url ?? m.url };
            }
            return m;
          })
        );
        return { ...project, media: mediaWithUrls };
      })
    );

    return projectsWithUrls.sort((a, b) => a.order - b.order);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (!project) return null;

    if (!project.published) {
      const isAdmin = await AuthUtils.isAdmin(ctx);
      if (!isAdmin) return null;
    }

    return project;
  },
});

export const getById = query({
  args: { id: v.id('portfolio_projects') },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) return null;

    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: projectInput,
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const existing = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (existing) {
      throw new Error('A project with this slug already exists');
    }

    const now = Date.now();
    const id = await ctx.db.insert('portfolio_projects', {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('portfolio_projects'),
    data: projectInput,
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Project not found');
    }

    if (args.data.slug !== existing.slug) {
      const slugConflict = await ctx.db
        .query('portfolio_projects')
        .withIndex('by_slug', (q) => q.eq('slug', args.data.slug))
        .unique();
      if (slugConflict) {
        throw new Error('A project with this slug already exists');
      }
    }

    await ctx.db.patch(args.id, {
      ...args.data,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id('portfolio_projects') },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error('Project not found');
    }

    for (const media of project.media) {
      if (media.storageId) {
        try {
          await ctx.storage.delete(media.storageId);
        } catch {
          // Continue if storage deletion fails
        }
      }
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

export const reorder = mutation({
  args: {
    projectIds: v.array(v.id('portfolio_projects')),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    for (let i = 0; i < args.projectIds.length; i++) {
      await ctx.db.patch(args.projectIds[i], {
        order: i,
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const addMedia = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    media: mediaValidator,
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const newMedia = {
      ...args.media,
      order: project.media.length,
    };

    await ctx.db.patch(args.projectId, {
      media: [...project.media, newMedia],
      updatedAt: Date.now(),
    });

    return project.media.length;
  },
});

export const removeMedia = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    mediaIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const mediaToRemove = project.media[args.mediaIndex];
    if (!mediaToRemove) {
      throw new Error('Media not found');
    }

    if (mediaToRemove.storageId) {
      try {
        await ctx.storage.delete(mediaToRemove.storageId);
      } catch {
        // Continue if storage deletion fails
      }
    }

    const updatedMedia = project.media
      .filter((_, i) => i !== args.mediaIndex)
      .map((m, i) => ({ ...m, order: i }));

    let thumbnailIndex = project.thumbnailIndex;
    if (thumbnailIndex !== undefined) {
      if (thumbnailIndex === args.mediaIndex) {
        thumbnailIndex = undefined;
      } else if (thumbnailIndex > args.mediaIndex) {
        thumbnailIndex = thumbnailIndex - 1;
      }
    }

    await ctx.db.patch(args.projectId, {
      media: updatedMedia,
      thumbnailIndex,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const reorderMedia = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    mediaOrder: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const reorderedMedia = args.mediaOrder.map((oldIndex, newIndex) => ({
      ...project.media[oldIndex],
      order: newIndex,
    }));

    let thumbnailIndex = project.thumbnailIndex;
    if (thumbnailIndex !== undefined) {
      const newThumbnailIndex = args.mediaOrder.indexOf(thumbnailIndex);
      thumbnailIndex = newThumbnailIndex >= 0 ? newThumbnailIndex : undefined;
    }

    await ctx.db.patch(args.projectId, {
      media: reorderedMedia,
      thumbnailIndex,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const setThumbnail = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    mediaIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (
      args.mediaIndex !== undefined &&
      (args.mediaIndex < 0 || args.mediaIndex >= project.media.length)
    ) {
      throw new Error('Invalid media index');
    }

    await ctx.db.patch(args.projectId, {
      thumbnailIndex: args.mediaIndex,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const getMediaUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getMultipleMediaUrls = query({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};

    for (const storageId of args.storageIds) {
      try {
        const url = await ctx.storage.getUrl(storageId);
        urls[storageId] = url;
      } catch {
        urls[storageId] = null;
      }
    }

    return urls;
  },
});

export const listForResume = query({
  args: { profileSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.profileSlug) {
      const projects = await ctx.db
        .query('portfolio_projects')
        .withIndex('by_published_order', (q) => q.eq('published', true))
        .collect();

      return projects.sort((a, b) => a.order - b.order);
    }

    const junctions = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile_order', (q) =>
        q.eq('profileSlug', args.profileSlug!)
      )
      .collect();

    const projectSlugs = junctions.map((j) => j.projectSlug);

    const projects = await Promise.all(
      projectSlugs.map((slug) =>
        ctx.db
          .query('portfolio_projects')
          .withIndex('by_slug', (q) => q.eq('slug', slug))
          .unique()
      )
    );

    return projects.filter(Boolean).sort((a, b) => {
      const junctionA = junctions.find((j) => j.projectSlug === a!.slug);
      const junctionB = junctions.find((j) => j.projectSlug === b!.slug);
      return (junctionA?.displayOrder ?? 0) - (junctionB?.displayOrder ?? 0);
    });
  },
});

export const addAchievement = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    achievement: achievementValidator,
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const achievements = project.achievements || [];
    const newAchievement = {
      ...args.achievement,
      priority: args.achievement.priority ?? achievements.length,
    };

    await ctx.db.patch(args.projectId, {
      achievements: [...achievements, newAchievement],
      updatedAt: Date.now(),
    });

    return achievements.length;
  },
});

export const updateAchievement = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    achievementIndex: v.number(),
    achievement: achievementValidator,
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const achievements = project.achievements || [];
    if (
      args.achievementIndex < 0 ||
      args.achievementIndex >= achievements.length
    ) {
      throw new Error('Achievement not found');
    }

    const updatedAchievements = [...achievements];
    updatedAchievements[args.achievementIndex] = args.achievement;

    await ctx.db.patch(args.projectId, {
      achievements: updatedAchievements,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const removeAchievement = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    achievementIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const achievements = project.achievements || [];
    if (
      args.achievementIndex < 0 ||
      args.achievementIndex >= achievements.length
    ) {
      throw new Error('Achievement not found');
    }

    const updatedAchievements = achievements
      .filter((_, i) => i !== args.achievementIndex)
      .map((a, i) => ({ ...a, priority: i }));

    await ctx.db.patch(args.projectId, {
      achievements: updatedAchievements,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const reorderAchievements = mutation({
  args: {
    projectId: v.id('portfolio_projects'),
    achievementOrder: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const achievements = project.achievements || [];
    const reorderedAchievements = args.achievementOrder.map(
      (oldIndex, newIndex) => ({
        ...achievements[oldIndex],
        priority: newIndex,
      })
    );

    await ctx.db.patch(args.projectId, {
      achievements: reorderedAchievements,
      updatedAt: Date.now(),
    });

    return true;
  },
});
