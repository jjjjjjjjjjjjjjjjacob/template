import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUserOrThrow, getCurrentUser } from './users';
import { extractExcerpt, calculateReadingTime } from './blog_utils';
import { AuthUtils } from './lib/auth';

export const hasPublishedPosts = query({
  args: {},
  handler: async (ctx) => {
    const post = await ctx.db
      .query('blogPosts')
      .filter((q) => q.eq(q.field('published'), true))
      .first();
    return post !== null;
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
    collection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let posts;
    if (args.collection) {
      posts = await ctx.db
        .query('blogPosts')
        .withIndex('by_published_collection', (q) =>
          q.eq('published', true).eq('collection', args.collection)
        )
        .order('desc')
        .collect();
    } else {
      posts = await ctx.db
        .query('blogPosts')
        .withIndex('by_createdAt')
        .order('desc')
        .collect();
      posts = posts.filter((p) => p.published);
    }

    const result = posts.slice(0, limit).map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      readingTime: p.readingTime,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      authorId: p.authorId,
      authorEmail: p.authorEmail,
      thumbnailId: p.thumbnailId,
      collection: p.collection,
      projectName: p.projectName,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      projectTags: p.projectTags,
    }));

    return result;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const posts = await ctx.db
      .query('blogPosts')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .collect();

    if (!posts.length) return null;

    // Filter for published posts first
    const publishedPosts = posts.filter((p) => p.published);

    if (!publishedPosts.length) return null;

    // If multiple published posts exist, return the most recently updated one
    publishedPosts.sort((a, b) => b.updatedAt - a.updatedAt);

    return publishedPosts[0];
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id('blogPosts')),
    title: v.string(),
    slug: v.string(),
    markdown: v.string(),
    published: v.boolean(),
    excerpt: v.optional(v.string()),
    images: v.optional(v.array(v.id('_storage'))),
    thumbnailId: v.optional(v.id('_storage')),
    collection: v.optional(v.string()),
    projectName: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    projectTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Only admin users can create/update posts
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const now = Date.now();

    // Calculate reading time and extract excerpt
    const readingTime = calculateReadingTime(args.markdown);
    const excerpt = extractExcerpt(args.markdown, args.excerpt);

    // If an ID is provided, update that specific post
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) {
        throw new Error('Post not found');
      }

      await ctx.db.patch(args.id, {
        title: args.title,
        slug: args.slug,
        markdown: args.markdown,
        published: args.published,
        excerpt: excerpt,
        readingTime: readingTime,
        images: args.images,
        thumbnailId: args.thumbnailId,
        collection: args.collection,
        projectName: args.projectName,
        githubUrl: args.githubUrl,
        liveUrl: args.liveUrl,
        projectTags: args.projectTags,
        updatedAt: now,
      });
      return args.id;
    }

    // Check for existing post by slug
    const existingBySlug = await ctx.db
      .query('blogPosts')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    if (existingBySlug) {
      // Update the existing post found by slug
      await ctx.db.patch(existingBySlug._id, {
        title: args.title,
        markdown: args.markdown,
        published: args.published,
        excerpt: excerpt,
        readingTime: readingTime,
        images: args.images,
        thumbnailId: args.thumbnailId,
        collection: args.collection,
        projectName: args.projectName,
        githubUrl: args.githubUrl,
        liveUrl: args.liveUrl,
        projectTags: args.projectTags,
        updatedAt: now,
      });
      return existingBySlug._id;
    }

    // Create new post if no existing post found
    const id = await ctx.db.insert('blogPosts', {
      title: args.title,
      slug: args.slug,
      markdown: args.markdown,
      excerpt: excerpt,
      readingTime: readingTime,
      authorId: user.external_id,
      authorEmail: user.email,
      published: args.published,
      images: args.images,
      thumbnailId: args.thumbnailId,
      collection: args.collection,
      projectName: args.projectName,
      githubUrl: args.githubUrl,
      liveUrl: args.liveUrl,
      projectTags: args.projectTags,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }
    const existing = await ctx.db
      .query('blogPosts')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Return empty array if user is not authenticated
    if (!user) {
      return [];
    }

    // Check if user is admin
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      return [];
    }

    const limit = args.limit ?? 50;
    const posts = await ctx.db
      .query('blogPosts')
      .withIndex('by_createdAt')
      .order('desc')
      .take(limit);

    return posts.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      readingTime: p.readingTime,
      published: p.published,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      authorId: p.authorId,
      authorEmail: p.authorEmail,
      images: p.images,
      thumbnailId: p.thumbnailId,
    }));
  },
});

export const getById = query({
  args: { id: v.id('blogPosts') },
  handler: async (ctx, { id }) => {
    const user = await getCurrentUser(ctx);

    // Return null if user is not authenticated
    if (!user) {
      return null;
    }

    // Check if user is admin
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      return null;
    }

    const post = await ctx.db.get(id);
    if (!post) return null;

    return post;
  },
});

export const autosave = mutation({
  args: {
    id: v.optional(v.id('blogPosts')),
    title: v.string(),
    slug: v.string(),
    markdown: v.string(),
    excerpt: v.optional(v.string()),
    images: v.optional(v.array(v.id('_storage'))),
    thumbnailId: v.optional(v.id('_storage')),
    collection: v.optional(v.string()),
    projectName: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    projectTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const now = Date.now();

    // Calculate reading time and extract excerpt
    const readingTime = calculateReadingTime(args.markdown);
    const excerpt = extractExcerpt(args.markdown, args.excerpt);

    if (args.id) {
      await ctx.db.patch(args.id, {
        title: args.title,
        slug: args.slug,
        markdown: args.markdown,
        excerpt: excerpt,
        readingTime: readingTime,
        images: args.images,
        thumbnailId: args.thumbnailId,
        collection: args.collection,
        projectName: args.projectName,
        githubUrl: args.githubUrl,
        liveUrl: args.liveUrl,
        projectTags: args.projectTags,
        updatedAt: now,
      });
      return args.id;
    }

    const id = await ctx.db.insert('blogPosts', {
      title: args.title,
      slug: args.slug,
      markdown: args.markdown,
      excerpt: excerpt,
      readingTime: readingTime,
      authorId: user.external_id,
      authorEmail: user.email,
      published: false,
      images: args.images,
      thumbnailId: args.thumbnailId,
      collection: args.collection,
      projectName: args.projectName,
      githubUrl: args.githubUrl,
      liveUrl: args.liveUrl,
      projectTags: args.projectTags,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

// Generate upload URL for secure file uploads
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

// Add image to a blog post
export const addImageToPost = mutation({
  args: {
    postId: v.id('blogPosts'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const currentImages = post.images || [];
    const updatedImages = [...currentImages, args.storageId];

    await ctx.db.patch(args.postId, {
      images: updatedImages,
      updatedAt: Date.now(),
    });

    return updatedImages;
  },
});

// Remove image from a blog post
export const removeImageFromPost = mutation({
  args: {
    postId: v.id('blogPosts'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const currentImages = post.images || [];
    const updatedImages = currentImages.filter((id) => id !== args.storageId);

    // If removing the thumbnail image, clear the thumbnail
    const patchData = {
      images: updatedImages,
      updatedAt: Date.now(),
      thumbnailId: undefined,
    };

    if (post.thumbnailId === args.storageId) {
      patchData.thumbnailId = undefined;
    }

    await ctx.db.patch(args.postId, patchData);

    // Delete the image from storage
    await ctx.storage.delete(args.storageId);

    return updatedImages;
  },
});

// Set thumbnail for a blog post
export const setPostThumbnail = mutation({
  args: {
    postId: v.id('blogPosts'),
    thumbnailId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const isAdmin = await AuthUtils.isAdmin(ctx);
    if (!isAdmin) {
      throw new Error('Unauthorized: admin access required');
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // If setting a thumbnail, ensure it's in the post's images array
    if (args.thumbnailId) {
      const currentImages = post.images || [];
      if (!currentImages.includes(args.thumbnailId)) {
        throw new Error('Thumbnail must be one of the post images');
      }
    }

    await ctx.db.patch(args.postId, {
      thumbnailId: args.thumbnailId,
      updatedAt: Date.now(),
    });

    return args.thumbnailId;
  },
});

// Get image URL for a storage ID
export const getImageUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Get multiple image URLs for storage IDs
export const getMultipleImageUrls = query({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};

    for (const storageId of args.storageIds) {
      try {
        const url = await ctx.storage.getUrl(storageId);
        urls[storageId] = url;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to get URL for storage ID ${storageId}:`, error);
        urls[storageId] = null;
      }
    }

    return urls;
  },
});

// Get all collections with post counts
export const getCollections = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query('blogPosts')
      .filter((q) => q.eq(q.field('published'), true))
      .collect();

    const collections = new Map<string, number>();

    for (const post of posts) {
      const collection = post.collection || 'general';
      collections.set(collection, (collections.get(collection) || 0) + 1);
    }

    return Array.from(collections.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  },
});

// List posts by collection
export const listByCollection = query({
  args: {
    collection: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const posts = await ctx.db
      .query('blogPosts')
      .withIndex('by_published_collection', (q) =>
        q.eq('published', true).eq('collection', args.collection)
      )
      .order('desc')
      .take(limit);

    return posts.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      readingTime: p.readingTime,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      authorId: p.authorId,
      authorEmail: p.authorEmail,
      thumbnailId: p.thumbnailId,
      collection: p.collection,
      projectName: p.projectName,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      projectTags: p.projectTags,
    }));
  },
});
