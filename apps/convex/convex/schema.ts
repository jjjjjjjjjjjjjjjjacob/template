import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    external_id: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    username: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    bio: v.optional(v.string()),
    image_url: v.optional(v.string()),
    profile_image_url: v.optional(v.string()),
    onboarding_completed: v.optional(v.boolean()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index('by_external_id', ['external_id'])
    .index('by_email', ['email']),

  items: defineTable({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    content: v.optional(v.string()),
    image: v.optional(v.string()),
    url: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    createdById: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('createdBy', ['createdById'])
    .index('status', ['status'])
    .index('category', ['category'])
    .index('createdAt', ['createdAt']),

  searchHistory: defineTable({
    userId: v.string(),
    query: v.string(),
    timestamp: v.number(),
    resultCount: v.number(),
    clickedResults: v.optional(v.array(v.string())),
  }).index('byUser', ['userId']),

  trendingSearches: defineTable({
    term: v.string(),
    count: v.number(),
    lastUpdated: v.number(),
    category: v.optional(v.string()),
  })
    .index('byTerm', ['term'])
    .index('byCount', ['count']),

  searchMetrics: defineTable({
    timestamp: v.number(),
    type: v.union(v.literal('search'), v.literal('click'), v.literal('error')),
    query: v.string(),
    userId: v.optional(v.string()),
    resultCount: v.optional(v.number()),
    clickedResultId: v.optional(v.string()),
    clickedResultType: v.optional(
      v.union(v.literal('item'), v.literal('user'), v.literal('tag'))
    ),
    clickPosition: v.optional(v.number()),
    responseTime: v.optional(v.number()),
    error: v.optional(v.string()),
    filters: v.optional(v.any()),
  }).index('by_timestamp', ['timestamp']),

  tags: defineTable({
    name: v.string(),
    count: v.number(),
    description: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    lastUsed: v.optional(v.number()),
  })
    .index('byName', ['name'])
    .index('byCount', ['count'])
    .searchIndex('search', {
      searchField: 'name',
    }),

  // TODO: Re-enable these tables after fixing type issues
  // socialConnections: defineTable({...}),
  // appleIdConnections: defineTable({...}),
  // sessionEvents: defineTable({...}),
  // adminUsers: defineTable({...}),

  // Blog posts
  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    markdown: v.string(),
    excerpt: v.optional(v.string()), // Optional custom excerpt for preview
    readingTime: v.optional(v.number()), // Estimated reading time in minutes
    authorId: v.string(), // users.external_id (Clerk user id)
    authorEmail: v.optional(v.string()),
    published: v.boolean(),
    images: v.optional(v.array(v.id('_storage'))), // Array of storage IDs for uploaded images
    thumbnailId: v.optional(v.id('_storage')), // Storage ID for the selected thumbnail
    // Collection and project fields
    collection: v.optional(v.string()), // 'general', 'project', or custom collection name
    projectName: v.optional(v.string()), // Name of the project (for project posts)
    githubUrl: v.optional(v.string()), // GitHub repository URL
    liveUrl: v.optional(v.string()), // Live deployment URL
    projectTags: v.optional(v.array(v.string())), // Project-specific tags
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_createdAt', ['createdAt'])
    .index('by_author', ['authorId'])
    .index('by_collection', ['collection'])
    .index('by_published_collection', ['published', 'collection']),
});
