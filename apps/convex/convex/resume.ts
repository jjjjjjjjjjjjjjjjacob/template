import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from './_generated/server';
import { v } from 'convex/values';
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

    const projects = await ctx.db
      .query('resume_projects')
      .withIndex('by_profile_priority', (q) => q.eq('profileSlug', args.slug))
      .collect();

    const skills = await ctx.db
      .query('resume_skills')
      .withIndex('by_profile_priority', (q) => q.eq('profileSlug', args.slug))
      .collect();

    const sortedProjects = projects
      .map((project) => ({
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
        achievements: [...project.achievements].sort(
          (a, b) => b.priority - a.priority
        ),
        technologies: project.technologies,
        previews: project.previews,
      }))
      .sort((a, b) => {
        const aHasPreviews = a.previews.length > 0 ? 1 : 0;
        const bHasPreviews = b.previews.length > 0 ? 1 : 0;
        if (aHasPreviews !== bHasPreviews) {
          return bHasPreviews - aHasPreviews;
        }
        return b.priority - a.priority;
      });

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
      projects: sortedProjects,
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

const resumeProjectInput = v.object({
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

export type ResumeProjectRecord = {
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

export type ResumeSkillRecord = {
  priority: number;
  category: string;
  skills: string[];
  proficiency: string;
  domains: string[];
};

export type UpsertProfileArgs = {
  profile: ResumeProfileRecord;
  projects: ResumeProjectRecord[];
  skills: ResumeSkillRecord[];
};

export type BulkReplaceProfilesArgs = {
  profiles: ResumeProfileRecord[];
  projects: Record<string, ResumeProjectRecord[]>;
  skills: Record<string, ResumeSkillRecord[]>;
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

  const existingProjects = ctx.db
    .query('resume_projects')
    .withIndex('by_profile_priority', (q) => q.eq('profileSlug', slug));

  for await (const doc of existingProjects) {
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
  await removeProfile(ctx, args.profile.slug);

  await ctx.db.insert('resume_profiles', args.profile);

  for (const project of args.projects) {
    await ctx.db.insert('resume_projects', {
      profileSlug: args.profile.slug,
      ...project,
    });
  }

  for (const skill of args.skills) {
    await ctx.db.insert('resume_skills', {
      profileSlug: args.profile.slug,
      ...skill,
    });
  }
}

export async function replaceProfilesData(
  ctx: MutationCtx,
  args: BulkReplaceProfilesArgs
) {
  const slugs = args.profiles.map((profile) => profile.slug);

  for (const slug of slugs) {
    await removeProfile(ctx, slug);
  }

  for (const profile of args.profiles) {
    await ctx.db.insert('resume_profiles', profile);

    const profileProjects = args.projects[profile.slug] ?? [];
    for (const project of profileProjects) {
      await ctx.db.insert('resume_projects', {
        profileSlug: profile.slug,
        ...project,
      });
    }

    const profileSkills = args.skills[profile.slug] ?? [];
    for (const skill of profileSkills) {
      await ctx.db.insert('resume_skills', {
        profileSlug: profile.slug,
        ...skill,
      });
    }
  }
}

export const upsertProfileInternal = internalMutation({
  args: {
    profile: resumeProfileInput,
    projects: v.array(resumeProjectInput),
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
    projects: v.array(resumeProjectInput),
    skills: v.array(resumeSkillInput),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await upsertProfileData(ctx, args);
    return null;
  },
});

export const bulkReplaceProfilesInternal = internalMutation({
  args: {
    profiles: v.array(resumeProfileInput),
    projects: v.record(v.string(), v.array(resumeProjectInput)),
    skills: v.record(v.string(), v.array(resumeSkillInput)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await replaceProfilesData(ctx, args);
    return null;
  },
});

export const bulkReplaceProfiles = mutation({
  args: {
    profiles: v.array(resumeProfileInput),
    projects: v.record(v.string(), v.array(resumeProjectInput)),
    skills: v.record(v.string(), v.array(resumeSkillInput)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await replaceProfilesData(ctx, args);
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
        responsibilities: v.array(v.string()),
        technologies: v.array(v.string()),
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
        responsibilities: v.array(v.string()),
        technologies: v.array(v.string()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const portfolioProjects = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_published_order', (q) => q.eq('published', true))
      .collect();

    const existingResumeProjects = await ctx.db
      .query('resume_projects')
      .withIndex('by_profile_priority', (q) =>
        q.eq('profileSlug', args.profileSlug)
      )
      .collect();

    const linkedProjectIds = new Set(
      existingResumeProjects.map((p) => p.projectId)
    );

    const mapProject = (p: (typeof portfolioProjects)[0]) => ({
      _id: p._id,
      slug: p.slug,
      title: p.title,
      role: p.role,
      description: p.description,
      company: p.company,
      timeline: p.timeline,
      responsibilities: p.responsibilities,
      technologies: p.technologies,
    });

    return {
      linked: portfolioProjects
        .filter((p) => linkedProjectIds.has(p.slug))
        .map(mapProject),
      available: portfolioProjects
        .filter((p) => !linkedProjectIds.has(p.slug))
        .map(mapProject),
    };
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

    const existingProjects = await ctx.db
      .query('resume_projects')
      .withIndex('by_profile_priority', (q) =>
        q.eq('profileSlug', args.profileSlug)
      )
      .collect();

    const existingLink = existingProjects.find(
      (p) => p.projectId === args.portfolioProjectSlug
    );
    if (existingLink) {
      throw new Error('project already linked to this profile');
    }

    const maxPriority = existingProjects.reduce(
      (max, p) => Math.max(max, p.priority),
      0
    );

    await ctx.db.insert('resume_projects', {
      profileSlug: args.profileSlug,
      projectId: portfolioProject.slug,
      priority: maxPriority + 1,
      title: portfolioProject.title,
      url: portfolioProject.url,
      company: portfolioProject.company || '',
      timeline: portfolioProject.timeline,
      role: portfolioProject.role,
      description: portfolioProject.description,
      focusAreas: [],
      domains: [],
      achievements: portfolioProject.responsibilities.map((r, i) => ({
        description: r,
        technologies: [],
        domains: [],
        type: 'development',
        priority: portfolioProject.responsibilities.length - i,
        included: true,
      })),
      technologies: {
        frontend: [],
        backend: [],
        infrastructure: [],
        databases: [],
        tools: portfolioProject.technologies,
      },
      previews: [],
    });

    const newSlugs = [
      ...(portfolioProject.resumeProfileSlugs || []),
      args.profileSlug,
    ];
    await ctx.db.patch(portfolioProject._id, {
      resumeProfileSlugs: newSlugs,
      includeInResume: true,
    });

    return null;
  },
});

export const unlinkProjectFromProfile = mutation({
  args: {
    profileSlug: v.string(),
    projectId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const resumeProjects = await ctx.db
      .query('resume_projects')
      .withIndex('by_profile_priority', (q) =>
        q.eq('profileSlug', args.profileSlug)
      )
      .collect();

    const resumeProject = resumeProjects.find(
      (p) => p.projectId === args.projectId
    );

    if (resumeProject) {
      await ctx.db.delete(resumeProject._id);
    }

    const portfolioProject = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_slug', (q) => q.eq('slug', args.projectId))
      .unique();

    if (portfolioProject && portfolioProject.resumeProfileSlugs) {
      const newSlugs = portfolioProject.resumeProfileSlugs.filter(
        (s) => s !== args.profileSlug
      );
      await ctx.db.patch(portfolioProject._id, {
        resumeProfileSlugs: newSlugs.length > 0 ? newSlugs : undefined,
        includeInResume: newSlugs.length > 0,
      });
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

    const projects = await ctx.db
      .query('resume_projects')
      .withIndex('by_profile_priority', (q) =>
        q.eq('profileSlug', args.profileSlug)
      )
      .collect();

    for (const project of projects) {
      const index = args.projectOrder.indexOf(project.projectId);
      if (index !== -1) {
        const newPriority = args.projectOrder.length - index;
        await ctx.db.patch(project._id, { priority: newPriority });
      }
    }

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
