import { v } from 'convex/values';
import { internalMutation, type MutationCtx } from '../_generated/server';

const theMarketProject = {
  slug: 'the-market',
  title: 'The Market',
  description:
    'A compatibility-focused dating app for web and mobile, built end-to-end across onboarding, discovery, AI-assisted matching, identity verification, real-time chat, and production infrastructure.',
  role: 'Founder & Developer',
  company: 'The Market',
  timeline: 'November 2025 - Present',
  technologies: [
    'TanStack Start',
    'React 19',
    'Expo',
    'React Native',
    'Convex',
    'Clerk',
    'Tailwind CSS',
    'NativeWind',
    'Three.js',
    'Google Gemini',
    'AWS Rekognition',
    'Cloudflare Workers',
    'Terraform',
    'TypeScript',
    'Bun',
    'Turbo',
    'Vitest',
    'Maestro',
  ],
  achievements: [
    {
      description:
        'Built the full product as a solo founder/developer across TanStack Start web, Expo/React Native mobile, and a shared Convex backend',
      impact:
        'Delivered a cohesive cross-platform dating product from product concept through production architecture',
      technologies: [
        'TanStack Start',
        'Expo',
        'React Native',
        'Convex',
        'TypeScript',
      ],
      domains: ['social', 'mobile', 'backend'],
      type: 'architecture',
      priority: 0,
    },
    {
      description:
        'Architected compatibility-driven discovery with AI-assisted category feeds, matching logic, and profile variant testing',
      impact:
        'Moved the product beyond swipe-first discovery toward richer compatibility signals',
      technologies: ['Google Gemini', 'Convex', 'TypeScript'],
      domains: ['social', 'ai', 'backend'],
      type: 'architecture',
      priority: 1,
    },
    {
      description:
        'Implemented identity and safety systems with Clerk auth, profile onboarding, AWS Rekognition face verification, and selfie/liveness flows',
      impact:
        'Created a safer onboarding path for a trust-sensitive dating product',
      technologies: ['Clerk', 'AWS Rekognition', 'Cloudflare Workers'],
      domains: ['auth', 'security', 'infrastructure'],
      type: 'integration',
      priority: 2,
    },
    {
      description:
        'Designed and shipped a 40+ screen onboarding and profile setup flow for progressive dating preferences, prompts, photos, and match criteria',
      impact:
        'Captured richer user context while keeping profile creation structured and approachable',
      technologies: ['React 19', 'Expo', 'React Native'],
      domains: ['frontend', 'mobile', 'social'],
      type: 'development',
      priority: 3,
    },
    {
      description:
        'Built real-time chat with reactions, typing indicators, presence, match flows, and in-chat interactive experiences',
      impact:
        'Supported post-match engagement with instant, stateful communication primitives',
      technologies: ['Convex', 'React 19', 'React Native'],
      domains: ['realtime', 'social', 'frontend'],
      type: 'development',
      priority: 4,
    },
  ],
  order: 0,
  published: true,
  includeInResume: true,
  resumeProfileSlugs: ['default', 'product', 'frontend', 'fde'],
  media: [],
};

const freelanceProject = {
  slug: 'freelance',
  title: 'Freelance Web Development',
  description:
    'Recent freelance web work for consumer retail and film clients, translating brand direction into responsive, production-ready websites.',
  role: 'Freelance Web Developer',
  company: 'Independent',
  timeline: 'November 2025 - Present',
  technologies: [
    'Responsive Web Design',
    'E-commerce UX',
    'Media-rich Portfolio UX',
    'TypeScript',
    'React',
    'Next.js',
    'Tailwind CSS',
    'SEO',
    'Performance Optimization',
  ],
  achievements: [
    {
      description:
        'Built Mershy.com for online retailer MERSHY, supporting product discovery, editorial brand content, ecommerce navigation, and mobile shopping flows',
      impact: 'Delivered a polished retail web presence for a consumer brand',
      technologies: ['E-commerce UX', 'Responsive Web Design', 'SEO'],
      domains: ['e-commerce', 'frontend', 'retail'],
      type: 'development',
      priority: 0,
    },
    {
      description:
        'Built MadelineLearyFilm.com for director Madeline Leary, presenting film/music-video work, imagery, about/contact pages, and inquiry capture',
      impact: 'Created a media-forward portfolio site for a film director',
      technologies: ['Media-rich Portfolio UX', 'Responsive Web Design'],
      domains: ['creative', 'frontend', 'portfolio'],
      type: 'development',
      priority: 1,
    },
    {
      description:
        'Delivered polished responsive interfaces tuned for brand expression, navigation clarity, and fast handoff',
      impact:
        'Kept small-client builds focused, maintainable, and easy to iterate',
      technologies: ['TypeScript', 'React', 'Tailwind CSS'],
      domains: ['frontend', 'delivery'],
      type: 'development',
      priority: 2,
    },
  ],
  order: 2,
  published: true,
  includeInResume: true,
  resumeProfileSlugs: ['default', 'frontend', 'fde'],
  media: [
    { type: 'iframe' as const, url: 'https://mershy.com', order: 0 },
    {
      type: 'iframe' as const,
      url: 'https://madelinelearyfilm.com',
      order: 1,
    },
  ],
};

const profileUpdates = [
  {
    slug: 'default',
    title: 'Founding Engineer & UI/UX',
    summary:
      'Founder/developer building The Market, a compatibility-focused dating app for web and mobile, since November 2025. Technical leader with 4+ years of experience shipping cross-platform products, real-time systems, AI-assisted workflows, and production infrastructure across TypeScript, React, React Native, Convex, and AWS.',
    defaults: {
      focusAreas: ['fullstack', 'leadership'],
      topTechnologies: [
        'React',
        'React Native',
        'TypeScript',
        'Convex',
        'Google Gemini',
        'AWS',
        'Terraform',
      ],
      priorityDomains: [
        'frontend',
        'backend',
        'realtime',
        'ai',
        'infrastructure',
      ],
    },
  },
  {
    slug: 'product',
    title: 'Product & Growth Lead',
    summary:
      'Product strategist and technical founder focused on zero-to-one social products, currently building The Market as a compatibility-first dating app. Experienced turning product theses into shipped onboarding, discovery, trust, and engagement loops.',
    defaults: {
      focusAreas: ['product', 'fullstack'],
      topTechnologies: [
        'Product Vision',
        'Dating Product Strategy',
        'Compatibility Design',
        'Roadmapping',
        'Activation Experiments',
        'Trust & Safety',
      ],
      priorityDomains: ['social', 'marketplace', 'payments'],
    },
  },
  {
    slug: 'frontend',
    title: 'Principal Frontend Engineer & Product Designer',
    summary:
      'Frontend engineer and product designer focused on building polished web and mobile product experiences, real-time interfaces, and design systems. Currently building The Market across TanStack Start, React 19, Expo, and React Native.',
    defaults: {
      focusAreas: ['frontend', 'fullstack'],
      topTechnologies: [
        'React',
        'React Native',
        'TypeScript',
        'TanStack Start',
        'Expo',
        'Tailwind CSS',
      ],
      priorityDomains: ['frontend', 'social', '3d'],
    },
  },
  {
    slug: 'fde',
    title: 'Forward Deployed Engineer',
    summary:
      'Technical leader with 4+ years building production AI applications, cross-platform systems, and customer-facing integrations. Currently building The Market across AI-assisted matching, identity verification, real-time communication, and mobile/web product delivery.',
    defaults: {
      focusAreas: ['ai', 'fullstack', 'customer-facing'],
      topTechnologies: [
        'Google Gemini',
        'AWS Rekognition',
        'TypeScript',
        'React',
        'React Native',
        'Convex',
        'AWS',
      ],
      priorityDomains: ['ai', 'llm', 'integration', 'customer-success'],
    },
  },
];

const skillsByProfile: Record<string, Record<string, string[]>> = {
  default: {
    'Frontend Development': [
      'React',
      'React Native',
      'Expo',
      'Next.js',
      'Three.js',
      'React Three Fiber',
      'TanStack Start',
      'Tailwind CSS',
      'NativeWind',
      'shadcn/ui',
      'Radix UI',
    ],
    'Backend Development': [
      'NestJS',
      'Node.js',
      'Convex',
      'Google Gemini',
      'AWS Rekognition',
      'PostgreSQL',
      'TypeORM',
      'REST APIs',
      'WebSocket',
      'Auth0',
      'Clerk',
    ],
  },
  frontend: {
    'Frontend Engineering': [
      'React',
      'React Native',
      'TypeScript',
      'TanStack Start',
      'Expo',
      'Three.js',
      'Tailwind CSS',
      'NativeWind',
      'Radix UI',
    ],
  },
  fde: {
    'AI & LLM': [
      'Claude API',
      'OpenAI API',
      'Gemini API',
      'Google Gemini',
      'AWS Rekognition',
      'Prompt Engineering',
      'Multi-LLM Orchestration',
      'Agent Development',
      'Evaluation Frameworks',
      'Structured Outputs',
    ],
    'Full-Stack Development': [
      'React',
      'React Native',
      'Next.js',
      'TanStack Start',
      'Expo',
      'NestJS',
      'Node.js',
      'Convex',
      'AWS Rekognition',
      'REST APIs',
      'WebSocket',
    ],
  },
};

const profileProjectSlugs: Record<string, string[]> = {
  default: ['the-market', 'heat-tech', 'freelance'],
  product: ['the-market', 'heat-tech'],
  frontend: ['the-market', 'heat-tech', 'freelance'],
  fde: ['the-market', 'heat-tech', 'freelance', 'cookt', 'snoball'],
};

async function getPortfolioProject(ctx: MutationCtx, slug: string) {
  return await ctx.db
    .query('portfolio_projects')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique();
}

async function upsertPortfolioProject(
  ctx: MutationCtx,
  project: typeof theMarketProject | typeof freelanceProject,
  now: number
) {
  const existing = await getPortfolioProject(ctx, project.slug);
  const responsibilities = project.achievements.map(
    (achievement) => achievement.description
  );
  const media =
    project.media.length > 0 ? project.media : (existing?.media ?? []);

  const patch = {
    ...project,
    media,
    responsibilities,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return 'updated';
  }

  await ctx.db.insert('portfolio_projects', {
    ...patch,
    createdAt: now,
  });
  return 'inserted';
}

async function hideVibechecc(ctx: MutationCtx, now: number) {
  const vibechecc = await getPortfolioProject(ctx, 'vibechecc');
  if (!vibechecc) return false;

  await ctx.db.patch(vibechecc._id, {
    published: false,
    includeInResume: false,
    resumeProfileSlugs: [],
    order: 99,
    updatedAt: now,
  });
  return true;
}

async function syncProfileProjects(ctx: MutationCtx) {
  let deleted = 0;
  let inserted = 0;
  const managedSlugs = new Set([
    'vibechecc',
    'the-market',
    'freelance',
    'heat-tech',
    'cookt',
    'snoball',
  ]);

  for (const [profileSlug, projectSlugs] of Object.entries(
    profileProjectSlugs
  )) {
    const existing = await ctx.db
      .query('resume_profile_projects')
      .withIndex('by_profile', (q) => q.eq('profileSlug', profileSlug))
      .collect();

    for (const junction of existing) {
      if (managedSlugs.has(junction.projectSlug)) {
        await ctx.db.delete(junction._id);
        deleted++;
      }
    }

    for (let index = 0; index < projectSlugs.length; index++) {
      await ctx.db.insert('resume_profile_projects', {
        profileSlug,
        projectSlug: projectSlugs[index],
        displayOrder: index + 1,
      });
      inserted++;
    }
  }

  return { deleted, inserted };
}

async function syncProfiles(ctx: MutationCtx) {
  let updated = 0;

  for (const profile of profileUpdates) {
    const existing = await ctx.db
      .query('resume_profiles')
      .withIndex('by_slug', (q) => q.eq('slug', profile.slug))
      .unique();

    if (!existing) continue;

    await ctx.db.patch(existing._id, {
      title: profile.title,
      summary: profile.summary,
      defaults: profile.defaults,
    });
    updated++;
  }

  return updated;
}

async function syncSkills(ctx: MutationCtx) {
  let updated = 0;

  for (const [profileSlug, categories] of Object.entries(skillsByProfile)) {
    const skills = await ctx.db
      .query('resume_skills')
      .withIndex('by_profile_priority', (q) => q.eq('profileSlug', profileSlug))
      .collect();

    for (const skill of skills) {
      const nextSkills = categories[skill.category];
      if (!nextSkills) continue;

      await ctx.db.patch(skill._id, {
        skills: nextSkills,
      });
      updated++;
    }
  }

  return updated;
}

export const syncCurrentResume = internalMutation({
  args: {},
  returns: v.object({
    theMarket: v.string(),
    freelance: v.string(),
    hiddenVibechecc: v.boolean(),
    profilesUpdated: v.number(),
    skillsUpdated: v.number(),
    junctionsDeleted: v.number(),
    junctionsInserted: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const theMarket = await upsertPortfolioProject(ctx, theMarketProject, now);
    const freelance = await upsertPortfolioProject(ctx, freelanceProject, now);
    const hiddenVibechecc = await hideVibechecc(ctx, now);
    const profilesUpdated = await syncProfiles(ctx);
    const skillsUpdated = await syncSkills(ctx);
    const junctions = await syncProfileProjects(ctx);

    return {
      theMarket,
      freelance,
      hiddenVibechecc,
      profilesUpdated,
      skillsUpdated,
      junctionsDeleted: junctions.deleted,
      junctionsInserted: junctions.inserted,
    };
  },
});
