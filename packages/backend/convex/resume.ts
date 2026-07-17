import { v } from 'convex/values';
import {
  internalMutation,
  type MutationCtx,
  mutation,
  query,
} from './_generated/server';
import { AuthUtils } from './lib/auth';

export const listProfiles = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      title: v.string(),
      order: v.number(),
    })
  ),
  handler: async (ctx) => {
    const profiles = await ctx.db.query('resume_profiles').collect();

    return profiles
      .map(({ slug, name, title, order }) => ({ slug, name, title, order }))
      .sort((a, b) => a.order - b.order);
  },
});

const mediaValidator = v.object({
  type: v.union(v.literal('image'), v.literal('video'), v.literal('iframe')),
  storageId: v.optional(v.string()),
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

export const getProfile = query({
  args: {
    slug: v.string(),
  },
  returns: v.object({
    profile: v.object({
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
    }),
    projects: v.array(
      v.object({
        projectId: v.string(),
        slug: v.string(),
        priority: v.number(),
        displayOrder: v.number(),
        achievementFilter: v.optional(v.array(v.number())),
        title: v.string(),
        url: v.optional(v.string()),
        company: v.string(),
        timeline: v.string(),
        role: v.string(),
        description: v.string(),
        focusAreas: v.array(v.string()),
        domains: v.array(v.string()),
        achievements: v.array(achievementValidator),
        technologies: v.object({
          frontend: v.array(v.string()),
          backend: v.array(v.string()),
          infrastructure: v.array(v.string()),
          databases: v.array(v.string()),
          tools: v.array(v.string()),
        }),
        previews: v.array(v.string()),
        previewCaptions: v.array(v.string()),
      })
    ),
    skills: v.array(
      v.object({
        category: v.string(),
        skills: v.array(v.string()),
        proficiency: v.string(),
        domains: v.array(v.string()),
        priority: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('resume_profiles')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (!profile) {
      throw new Error(`Resume profile not found for slug: ${args.slug}`);
    }

    const junctionRecords = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile_order', (q) => q.eq('profileSlug', args.slug))
      .collect();

    const projectSlugs = junctionRecords.map((j) => j.projectSlug);

    const portfolioProjects = await Promise.all(
      projectSlugs.map((slug) =>
        ctx.db
          .query('portfolio_projects')
          .withIndex('by_slug', (q) => q.eq('slug', slug))
          .unique()
      )
    );

    const projectPromises = junctionRecords.map(async (junction) => {
      const portfolio = portfolioProjects.find(
        (p) => p?.slug === junction.projectSlug
      );
      if (!portfolio) return null;

      const allAchievements = portfolio.achievements || [];
      const filteredAchievements =
        junction.achievementFilter && junction.achievementFilter.length > 0
          ? junction.achievementFilter
              .map((idx) => allAchievements[idx])
              .filter(Boolean)
          : allAchievements;

      const sortedAchievements = filteredAchievements.sort(
        (a, b) => a.priority - b.priority
      );

      const allDomains = new Set<string>();
      const allTechFromAchievements = new Set<string>();
      for (const ach of sortedAchievements) {
        for (const d of ach.domains) allDomains.add(d);
        for (const t of ach.technologies) allTechFromAchievements.add(t);
      }

      const previewItems: string[] = [];
      // Captions stay index-aligned with previewItems: every preview push has a
      // matching caption push (empty string when a media item has none).
      const previewCaptionItems: string[] = [];

      const sortedMedia = [...portfolio.media].sort(
        (a, b) => a.order - b.order
      );

      for (const m of sortedMedia) {
        const caption = m.caption ?? '';
        if (m.type === 'iframe' && m.url) {
          previewItems.push(m.url);
          previewCaptionItems.push(caption);
        } else if (m.type === 'video') {
          if (m.url) {
            previewItems.push(m.url);
            previewCaptionItems.push(caption);
          } else if (m.storageId) {
            const url = await ctx.storage.getUrl(m.storageId as never);
            if (url) {
              previewItems.push(`${url}#video`);
              previewCaptionItems.push(caption);
            }
          }
        } else if (m.type === 'image') {
          if (m.url) {
            previewItems.push(`${m.url}#image`);
            previewCaptionItems.push(caption);
          } else if (m.storageId) {
            const url = await ctx.storage.getUrl(m.storageId as never);
            if (url) {
              previewItems.push(`${url}#image`);
              previewCaptionItems.push(caption);
            }
          }
        }
      }

      const previews = previewItems;
      const previewCaptions = previewCaptionItems;

      return {
        projectId: portfolio.slug,
        slug: portfolio.slug,
        priority: junction.displayOrder,
        displayOrder: junction.displayOrder,
        achievementFilter: junction.achievementFilter,
        title: portfolio.title,
        url: portfolio.url,
        company: portfolio.company ?? '',
        timeline: portfolio.timeline,
        role: portfolio.role,
        description: portfolio.description,
        focusAreas: Array.from(allDomains).slice(0, 5),
        domains: Array.from(allDomains),
        achievements: sortedAchievements,
        technologies: {
          frontend: portfolio.technologies.filter((t) =>
            [
              'react',
              'vue',
              'angular',
              'svelte',
              'nextjs',
              'typescript',
              'javascript',
              'tailwind',
              'css',
              'html',
              'three.js',
              'tanstack',
            ].some((k) => t.toLowerCase().includes(k))
          ),
          backend: portfolio.technologies.filter((t) =>
            [
              'node',
              'python',
              'go',
              'rust',
              'java',
              'ruby',
              'express',
              'fastapi',
              'django',
              'graphql',
              'rest',
              'api',
              'convex',
            ].some((k) => t.toLowerCase().includes(k))
          ),
          infrastructure: portfolio.technologies.filter((t) =>
            [
              'aws',
              'gcp',
              'azure',
              'docker',
              'kubernetes',
              'terraform',
              'cloudflare',
              'vercel',
              'netlify',
              'ci',
              'cd',
            ].some((k) => t.toLowerCase().includes(k))
          ),
          databases: portfolio.technologies.filter((t) =>
            [
              'postgres',
              'mysql',
              'mongodb',
              'redis',
              'sqlite',
              'dynamodb',
              'firebase',
              'supabase',
              'sql',
            ].some((k) => t.toLowerCase().includes(k))
          ),
          tools: portfolio.technologies.filter((t) =>
            [
              'git',
              'github',
              'gitlab',
              'jira',
              'figma',
              'slack',
              'notion',
              'linear',
            ].some((k) => t.toLowerCase().includes(k))
          ),
        },
        previews,
        previewCaptions,
      };
    });

    const resolvedProjects = (await Promise.all(projectPromises)).filter(
      Boolean
    ) as Array<{
      projectId: string;
      slug: string;
      priority: number;
      displayOrder: number;
      achievementFilter?: number[];
      title: string;
      url?: string;
      company: string;
      timeline: string;
      role: string;
      description: string;
      focusAreas: string[];
      domains: string[];
      achievements: Array<{
        description: string;
        impact?: string;
        technologies: string[];
        domains: string[];
        type: string;
        priority: number;
      }>;
      technologies: {
        frontend: string[];
        backend: string[];
        infrastructure: string[];
        databases: string[];
        tools: string[];
      };
      previews: string[];
      previewCaptions: string[];
    }>;

    const projects = resolvedProjects.sort((a, b) => a.priority - b.priority);

    const skills = await ctx.db
      .query('resume_skills')
      .withIndex('by_profile_priority', (q) => q.eq('profileSlug', args.slug))
      .collect();

    return {
      profile: {
        slug: profile.slug,
        name: profile.name,
        title: profile.title,
        location: profile.location,
        summary: profile.summary,
        contact: profile.contact,
        defaults: profile.defaults,
      },
      projects,
      skills: skills.map((skill) => ({
        category: skill.category,
        skills: skill.skills,
        proficiency: skill.proficiency,
        domains: skill.domains,
        priority: skill.priority,
      })),
    };
  },
});

const resumeProfileInput = v.object({
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
});

const resumeSkillInput = v.object({
  priority: v.number(),
  category: v.string(),
  skills: v.array(v.string()),
  proficiency: v.string(),
  domains: v.array(v.string()),
});

export type ResumeProfileRecord = {
  slug: string;
  name: string;
  title: string;
  location: string;
  summary: string;
  contact: {
    email?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  defaults: {
    focusAreas: string[];
    topTechnologies: string[];
    priorityDomains: string[];
  };
  order: number;
};

export type ResumeSkillRecord = {
  priority: number;
  category: string;
  skills: string[];
  proficiency: string;
  domains: string[];
};

export type UpsertProfileArgs = {
  profile: ResumeProfileRecord;
  projects: Array<{
    projectSlug: string;
    displayOrder: number;
    achievementFilter?: number[];
  }>;
  skills: ResumeSkillRecord[];
};

async function requireAdmin(ctx: MutationCtx) {
  await AuthUtils.requireAdmin(ctx);
}

async function removeProfile(ctx: MutationCtx, slug: string) {
  const existing = await ctx.db
    .query('resume_profiles')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique();

  if (!existing) {
    return;
  }

  await ctx.db.delete(existing._id);

  const existingJunctions = ctx.db
    .query('resume_profile_projects')
    .withIndex('by_profile', (q) => q.eq('profileSlug', slug));

  for await (const doc of existingJunctions) {
    await ctx.db.delete(doc._id);
  }

  const existingSkills = ctx.db
    .query('resume_skills')
    .withIndex('by_profile_priority', (q) => q.eq('profileSlug', slug));

  for await (const doc of existingSkills) {
    await ctx.db.delete(doc._id);
  }
}

async function upsertProfileData(ctx: MutationCtx, args: UpsertProfileArgs) {
  const existing = await ctx.db
    .query('resume_profiles')
    .withIndex('by_slug', (q) => q.eq('slug', args.profile.slug))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      name: args.profile.name,
      title: args.profile.title,
      location: args.profile.location,
      summary: args.profile.summary,
      contact: args.profile.contact,
      defaults: args.profile.defaults,
      order: args.profile.order,
    });
  } else {
    await ctx.db.insert('resume_profiles', args.profile);
  }

  const existingJunctions = await ctx.db
    .query('resume_profile_projects')
    .withIndex('by_profile', (q) => q.eq('profileSlug', args.profile.slug))
    .collect();

  for (const junction of existingJunctions) {
    await ctx.db.delete(junction._id);
  }

  for (const project of args.projects) {
    await ctx.db.insert('resume_profile_projects', {
      profileSlug: args.profile.slug,
      projectSlug: project.projectSlug,
      displayOrder: project.displayOrder,
      achievementFilter: project.achievementFilter,
    });
  }

  const existingSkills = await ctx.db
    .query('resume_skills')
    .withIndex('by_profile_priority', (q) =>
      q.eq('profileSlug', args.profile.slug)
    )
    .collect();

  for (const skill of existingSkills) {
    await ctx.db.delete(skill._id);
  }

  for (const skill of args.skills) {
    await ctx.db.insert('resume_skills', {
      profileSlug: args.profile.slug,
      ...skill,
    });
  }
}

const profileProjectInput = v.object({
  projectSlug: v.string(),
  displayOrder: v.number(),
  achievementFilter: v.optional(v.array(v.number())),
});

export const upsertProfileInternal = internalMutation({
  args: {
    profile: resumeProfileInput,
    projects: v.array(profileProjectInput),
    skills: v.array(resumeSkillInput),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await upsertProfileData(ctx, args);
    return null;
  },
});

export const upsertProfile = mutation({
  args: {
    profile: resumeProfileInput,
    projects: v.array(profileProjectInput),
    skills: v.array(resumeSkillInput),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await upsertProfileData(ctx, args);
    return null;
  },
});

export const deleteProfileInternal = internalMutation({
  args: {
    slug: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await removeProfile(ctx, args.slug);
    return null;
  },
});

export const deleteProfile = mutation({
  args: {
    slug: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await removeProfile(ctx, args.slug);
    return null;
  },
});

export const listAvailableProjects = query({
  args: {
    profileSlug: v.string(),
  },
  returns: v.object({
    linked: v.array(
      v.object({
        _id: v.id('portfolio_projects'),
        slug: v.string(),
        title: v.string(),
        role: v.string(),
        description: v.string(),
        company: v.optional(v.string()),
        timeline: v.string(),
        technologies: v.array(v.string()),
        achievements: v.optional(v.array(achievementValidator)),
        displayOrder: v.number(),
        achievementFilter: v.optional(v.array(v.number())),
      })
    ),
    available: v.array(
      v.object({
        _id: v.id('portfolio_projects'),
        slug: v.string(),
        title: v.string(),
        role: v.string(),
        description: v.string(),
        company: v.optional(v.string()),
        timeline: v.string(),
        technologies: v.array(v.string()),
        achievements: v.optional(v.array(achievementValidator)),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const portfolioProjects = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_published_order', (q) => q.eq('published', true))
      .collect();

    const junctions = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile', (q) => q.eq('profileSlug', args.profileSlug))
      .collect();

    const linkedSlugs = new Set(junctions.map((j) => j.projectSlug));
    const junctionMap = new Map(junctions.map((j) => [j.projectSlug, j]));

    const linked = portfolioProjects
      .filter((p) => linkedSlugs.has(p.slug))
      .map((p) => {
        const junction = junctionMap.get(p.slug)!;
        return {
          _id: p._id,
          slug: p.slug,
          title: p.title,
          role: p.role,
          description: p.description,
          company: p.company,
          timeline: p.timeline,
          technologies: p.technologies,
          achievements: p.achievements,
          displayOrder: junction.displayOrder,
          achievementFilter: junction.achievementFilter,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const available = portfolioProjects
      .filter((p) => !linkedSlugs.has(p.slug))
      .map((p) => ({
        _id: p._id,
        slug: p.slug,
        title: p.title,
        role: p.role,
        description: p.description,
        company: p.company,
        timeline: p.timeline,
        technologies: p.technologies,
        achievements: p.achievements,
      }));

    return { linked, available };
  },
});

export const linkProjectToProfile = mutation({
  args: {
    profileSlug: v.string(),
    portfolioProjectSlug: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const portfolioProject = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_slug', (q) => q.eq('slug', args.portfolioProjectSlug))
      .unique();

    if (!portfolioProject) {
      throw new Error('portfolio project not found');
    }

    const existingJunction = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile', (q) => q.eq('profileSlug', args.profileSlug))
      .collect();

    const alreadyLinked = existingJunction.find(
      (j) => j.projectSlug === args.portfolioProjectSlug
    );
    if (alreadyLinked) {
      throw new Error('project already linked to this profile');
    }

    const maxOrder = existingJunction.reduce(
      (max, j) => Math.max(max, j.displayOrder),
      0
    );

    await ctx.db.insert('resume_profile_projects', {
      profileSlug: args.profileSlug,
      projectSlug: args.portfolioProjectSlug,
      displayOrder: maxOrder + 1,
      achievementFilter: undefined,
    });

    return null;
  },
});

export const unlinkProjectFromProfile = mutation({
  args: {
    profileSlug: v.string(),
    projectSlug: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const junctions = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile', (q) => q.eq('profileSlug', args.profileSlug))
      .collect();

    const junction = junctions.find((j) => j.projectSlug === args.projectSlug);

    if (junction) {
      await ctx.db.delete(junction._id);
    }

    return null;
  },
});

export const reorderProfileProjects = mutation({
  args: {
    profileSlug: v.string(),
    projectOrder: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const junctions = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile', (q) => q.eq('profileSlug', args.profileSlug))
      .collect();

    for (const junction of junctions) {
      const index = args.projectOrder.indexOf(junction.projectSlug);
      if (index !== -1) {
        await ctx.db.patch(junction._id, { displayOrder: index + 1 });
      }
    }

    return null;
  },
});

export const updateProfileProjectSettings = mutation({
  args: {
    profileSlug: v.string(),
    projectSlug: v.string(),
    updates: v.object({
      displayOrder: v.optional(v.number()),
      achievementFilter: v.optional(v.array(v.number())),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const junctions = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile', (q) => q.eq('profileSlug', args.profileSlug))
      .collect();

    const junction = junctions.find((j) => j.projectSlug === args.projectSlug);

    if (!junction) {
      throw new Error('project not linked to this profile');
    }

    const updates: Partial<{
      displayOrder: number;
      achievementFilter: number[] | undefined;
    }> = {};

    if (args.updates.displayOrder !== undefined) {
      updates.displayOrder = args.updates.displayOrder;
    }
    if (args.updates.achievementFilter !== undefined) {
      updates.achievementFilter = args.updates.achievementFilter;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(junction._id, updates);
    }

    return null;
  },
});

export const getProfileProject = query({
  args: {
    profileSlug: v.string(),
    projectSlug: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      slug: v.string(),
      title: v.string(),
      url: v.optional(v.string()),
      company: v.optional(v.string()),
      timeline: v.string(),
      role: v.string(),
      description: v.string(),
      technologies: v.array(v.string()),
      achievements: v.optional(v.array(achievementValidator)),
      media: v.array(mediaValidator),
      displayOrder: v.number(),
      achievementFilter: v.optional(v.array(v.number())),
    })
  ),
  handler: async (ctx, args) => {
    const junction = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile', (q) => q.eq('profileSlug', args.profileSlug))
      .collect()
      .then((junctions) =>
        junctions.find((j) => j.projectSlug === args.projectSlug)
      );

    if (!junction) {
      return null;
    }

    const portfolio = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_slug', (q) => q.eq('slug', args.projectSlug))
      .unique();

    if (!portfolio) {
      return null;
    }

    return {
      slug: portfolio.slug,
      title: portfolio.title,
      url: portfolio.url,
      company: portfolio.company,
      timeline: portfolio.timeline,
      role: portfolio.role,
      description: portfolio.description,
      technologies: portfolio.technologies,
      achievements: portfolio.achievements,
      media: portfolio.media,
      displayOrder: junction.displayOrder,
      achievementFilter: junction.achievementFilter,
    };
  },
});

// DEPRECATED: Legacy functions for backwards compatibility during migration
// These will be removed after migration is complete

const legacyResumeProjectInput = v.object({
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
      included: v.optional(v.boolean()),
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
});

export type LegacyResumeProjectRecord = {
  projectId: string;
  priority: number;
  title: string;
  url?: string;
  company: string;
  timeline: string;
  role: string;
  description: string;
  focusAreas: string[];
  domains: string[];
  achievements: Array<{
    description: string;
    impact?: string;
    technologies: string[];
    domains: string[];
    type: string;
    priority: number;
    included?: boolean;
  }>;
  technologies: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    databases: string[];
    tools: string[];
  };
  previews: string[];
};

export type LegacyUpsertProfileArgs = {
  profile: ResumeProfileRecord;
  projects: LegacyResumeProjectRecord[];
  skills: ResumeSkillRecord[];
};

async function legacyUpsertProfileData(
  ctx: MutationCtx,
  args: LegacyUpsertProfileArgs
) {
  const existing = await ctx.db
    .query('resume_profiles')
    .withIndex('by_slug', (q) => q.eq('slug', args.profile.slug))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      name: args.profile.name,
      title: args.profile.title,
      location: args.profile.location,
      summary: args.profile.summary,
      contact: args.profile.contact,
      defaults: args.profile.defaults,
      order: args.profile.order,
    });
  } else {
    await ctx.db.insert('resume_profiles', args.profile);
  }

  const existingProjects = await ctx.db
    .query('resume_projects')
    .withIndex('by_profile_priority', (q) =>
      q.eq('profileSlug', args.profile.slug)
    )
    .collect();

  for (const project of existingProjects) {
    await ctx.db.delete(project._id);
  }

  for (const project of args.projects) {
    await ctx.db.insert('resume_projects', {
      profileSlug: args.profile.slug,
      ...project,
    });
  }

  const existingSkills = await ctx.db
    .query('resume_skills')
    .withIndex('by_profile_priority', (q) =>
      q.eq('profileSlug', args.profile.slug)
    )
    .collect();

  for (const skill of existingSkills) {
    await ctx.db.delete(skill._id);
  }

  for (const skill of args.skills) {
    await ctx.db.insert('resume_skills', {
      profileSlug: args.profile.slug,
      ...skill,
    });
  }
}

export const legacyUpsertProfile = mutation({
  args: {
    profile: resumeProfileInput,
    projects: v.array(legacyResumeProjectInput),
    skills: v.array(resumeSkillInput),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await legacyUpsertProfileData(ctx, args);
    return null;
  },
});

export const updateResumeProject = mutation({
  args: {
    profileSlug: v.string(),
    projectId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      focusAreas: v.optional(v.array(v.string())),
      domains: v.optional(v.array(v.string())),
      achievements: v.optional(
        v.array(
          v.object({
            description: v.string(),
            impact: v.optional(v.string()),
            technologies: v.array(v.string()),
            domains: v.array(v.string()),
            type: v.string(),
            priority: v.number(),
            included: v.optional(v.boolean()),
          })
        )
      ),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const projects = await ctx.db
      .query('resume_projects')
      .withIndex('by_profile_priority', (q) =>
        q.eq('profileSlug', args.profileSlug)
      )
      .collect();

    const project = projects.find((p) => p.projectId === args.projectId);

    if (!project) {
      throw new Error('resume project not found');
    }

    const updates: Partial<typeof project> = {};
    if (args.updates.title !== undefined) updates.title = args.updates.title;
    if (args.updates.description !== undefined)
      updates.description = args.updates.description;
    if (args.updates.focusAreas !== undefined)
      updates.focusAreas = args.updates.focusAreas;
    if (args.updates.domains !== undefined)
      updates.domains = args.updates.domains;
    if (args.updates.achievements !== undefined)
      updates.achievements = args.updates.achievements;

    await ctx.db.patch(project._id, updates);

    return null;
  },
});

export const getResumeProject = query({
  args: {
    profileSlug: v.string(),
    projectId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
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
          included: v.optional(v.boolean()),
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
    })
  ),
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query('resume_projects')
      .withIndex('by_profile_priority', (q) =>
        q.eq('profileSlug', args.profileSlug)
      )
      .collect();

    const project = projects.find((p) => p.projectId === args.projectId);

    if (!project) {
      return null;
    }

    return {
      projectId: project.projectId,
      priority: project.priority,
      title: project.title,
      url: project.url,
      company: project.company,
      timeline: project.timeline,
      role: project.role,
      description: project.description,
      focusAreas: project.focusAreas,
      domains: project.domains,
      achievements: project.achievements,
      technologies: project.technologies,
      previews: project.previews,
    };
  },
});
