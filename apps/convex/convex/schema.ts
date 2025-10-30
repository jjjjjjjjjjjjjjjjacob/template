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
    isAdmin: v.optional(v.boolean()),
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

  resume_profiles: defineTable({
    slug: v.string(),
    name: v.string(),
    title: v.string(),
    location: v.string(),
    summary: v.string(),
    contact: v.object({
      email: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      github: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
    defaults: v.object({
      focusAreas: v.array(v.string()),
      topTechnologies: v.array(v.string()),
      priorityDomains: v.array(v.string()),
    }),
    order: v.number(),
  }).index('by_slug', ['slug']),

  resume_projects: defineTable({
    profileSlug: v.string(),
    projectId: v.string(),
    priority: v.number(),
    title: v.string(),
    url: v.optional(v.string()),
    company: v.string(),
    timeline: v.string(),
    role: v.string(),
    description: v.string(),
    focusAreas: v.array(v.string()),
    domains: v.array(v.string()),
    achievements: v.array(
      v.object({
        description: v.string(),
        impact: v.optional(v.string()),
        technologies: v.array(v.string()),
        domains: v.array(v.string()),
        type: v.string(),
        priority: v.number(),
      })
    ),
    technologies: v.object({
      frontend: v.array(v.string()),
      backend: v.array(v.string()),
      infrastructure: v.array(v.string()),
      databases: v.array(v.string()),
      tools: v.array(v.string()),
    }),
    previews: v.array(v.string()),
  }).index('by_profile_priority', ['profileSlug', 'priority']),

  resume_skills: defineTable({
    profileSlug: v.string(),
    priority: v.number(),
    category: v.string(),
    skills: v.array(v.string()),
    proficiency: v.string(),
    domains: v.array(v.string()),
  }).index('by_profile_priority', ['profileSlug', 'priority']),
});
