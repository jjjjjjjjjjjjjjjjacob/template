import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

const projectProfiles = [
  {
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
        technologies: [
          'TanStack Start',
          'Expo',
          'React Native',
          'Convex',
          'TypeScript',
        ],
        domains: ['web', 'mobile', 'backend'],
        type: 'architecture',
        priority: 0,
      },
      {
        description:
          'Architected compatibility-driven discovery with AI-assisted category feeds, matching logic, and profile variant testing',
        technologies: ['Google Gemini', 'Convex', 'TypeScript'],
        domains: ['ai', 'matching', 'discovery'],
        type: 'development',
        priority: 1,
      },
      {
        description:
          'Implemented identity and safety systems with Clerk auth, profile onboarding, AWS Rekognition face verification, and selfie/liveness flows',
        technologies: ['Clerk', 'AWS Rekognition', 'Cloudflare Workers'],
        domains: ['auth', 'security', 'verification'],
        type: 'integration',
        priority: 2,
      },
      {
        description:
          'Designed and shipped a 40+ screen onboarding and profile setup flow for progressive dating preferences, prompts, photos, and match criteria',
        technologies: ['React 19', 'Expo', 'React Native'],
        domains: ['ux', 'onboarding', 'mobile'],
        type: 'development',
        priority: 3,
      },
      {
        description:
          'Built real-time chat with reactions, typing indicators, presence, match flows, and in-chat interactive experiences',
        technologies: ['Convex', 'React 19', 'React Native'],
        domains: ['messaging', 'real-time'],
        type: 'development',
        priority: 4,
      },
      {
        description:
          'Set up Cloudflare Workers, Terraform-managed AWS resources, mobile release workflows, and regression tests across web, mobile, and backend code',
        technologies: [
          'Cloudflare Workers',
          'Terraform',
          'AWS',
          'Vitest',
          'Maestro',
        ],
        domains: ['infrastructure', 'testing', 'release'],
        type: 'architecture',
        priority: 5,
      },
    ],
    published: true,
    media: [],
  },
  {
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
        technologies: ['E-commerce UX', 'Responsive Web Design', 'SEO'],
        domains: ['e-commerce', 'frontend', 'retail'],
        type: 'development',
        priority: 0,
      },
      {
        description:
          'Built MadelineLearyFilm.com for director Madeline Leary, presenting film/music-video work, imagery, about/contact pages, and inquiry capture',
        technologies: ['Media-rich Portfolio UX', 'Responsive Web Design'],
        domains: ['creative', 'frontend', 'portfolio'],
        type: 'development',
        priority: 1,
      },
      {
        description:
          'Delivered polished responsive interfaces tuned for brand expression, navigation clarity, and fast handoff',
        technologies: ['TypeScript', 'React', 'Tailwind CSS'],
        domains: ['frontend', 'delivery'],
        type: 'development',
        priority: 2,
      },
    ],
    published: true,
    media: [],
  },
  {
    slug: 'no-mess',
    title: 'no-mess',
    description:
      'A multi-tenant headless CMS with schema-as-code, Shopify integration, iframe-based live preview/editing, and a Cloudflare Workers edge API gateway with rate limiting and caching.',
    role: 'Founder & Lead Developer',
    timeline: '2025 - Present',
    technologies: [
      'Next.js 16',
      'React 19',
      'Convex',
      'Clerk',
      'Cloudflare Workers',
      'Cloudflare KV',
      'Tailwind CSS',
      'TypeScript',
      'Biome',
      'Changesets',
      'Bun',
    ],
    achievements: [
      {
        description:
          'Designed flexible schema system (templates + recursive fragments) with draft/publish workflow',
        technologies: ['Convex', 'TypeScript'],
        domains: ['cms', 'architecture'],
        type: 'architecture',
        priority: 0,
      },
      {
        description:
          'Built iframe-based live preview with HMAC-SHA256 session security and 10-min TTL',
        technologies: ['React 19', 'Next.js 16'],
        domains: ['preview', 'security'],
        type: 'development',
        priority: 1,
      },
      {
        description:
          'Created Cloudflare Workers edge API gateway with sliding-window rate limiting and response caching',
        technologies: ['Cloudflare Workers', 'Cloudflare KV'],
        domains: ['api', 'edge'],
        type: 'development',
        priority: 2,
      },
      {
        description:
          'Developed TypeScript SDK (@no-mess/client) and CLI tool for schema-as-code workflows',
        technologies: ['TypeScript', 'Bun'],
        domains: ['sdk', 'tooling'],
        type: 'development',
        priority: 3,
      },
      {
        description:
          'Built MCP server enabling AI agents to manage CMS content',
        technologies: ['TypeScript', 'Convex'],
        domains: ['ai', 'integration'],
        type: 'integration',
        priority: 4,
      },
      {
        description:
          'Implemented Shopify product/collection sync with handle-based references',
        technologies: ['Convex', 'Cloudflare Workers'],
        domains: ['e-commerce', 'integration'],
        type: 'integration',
        priority: 5,
      },
    ],
    published: false,
    media: [],
  },
  {
    slug: 'stoopd',
    title: 'Stoopd',
    description:
      'A real-time building community platform connecting residents for communication, governance, and collaborative problem-solving — with web and mobile apps sharing a unified backend.',
    role: 'Founder & Lead Developer',
    timeline: '2025 - Present',
    technologies: [
      'TanStack Start',
      'React 19',
      'Expo',
      'React Native',
      'Convex',
      'Clerk',
      'Tailwind CSS',
      'NativeWind',
      'Framer Motion',
      'Google Maps',
      'Zustand',
      'TypeScript',
      'Bun',
      'Turbo',
    ],
    achievements: [
      {
        description:
          'Architected dual-platform (web + mobile) community app with shared backend and UI primitives',
        technologies: ['TanStack Start', 'Expo', 'React Native', 'Convex'],
        domains: ['web', 'mobile'],
        type: 'architecture',
        priority: 0,
      },
      {
        description:
          'Built multi-channel communication system (chat, threads, alerts) with real-time messaging',
        technologies: ['Convex', 'React 19'],
        domains: ['messaging', 'real-time'],
        type: 'development',
        priority: 1,
      },
      {
        description:
          'Designed tiered building claim system (resident → management → ownership) with verification',
        technologies: ['Convex', 'Clerk'],
        domains: ['governance', 'verification'],
        type: 'architecture',
        priority: 2,
      },
      {
        description:
          'Implemented role-based access control with fine-grained moderation tools',
        technologies: ['Convex', 'Clerk'],
        domains: ['security', 'moderation'],
        type: 'development',
        priority: 3,
      },
      {
        description:
          'Created multi-step onboarding with user type detection (tenant, owner, PM, landlord)',
        technologies: ['React 19', 'Expo'],
        domains: ['ux', 'onboarding'],
        type: 'development',
        priority: 4,
      },
      {
        description:
          'Built achievement badge system with global, building, and role-scoped earning rules',
        technologies: ['Convex', 'TypeScript'],
        domains: ['gamification', 'engagement'],
        type: 'development',
        priority: 5,
      },
    ],
    published: false,
    media: [],
  },
];

export const seedPortfolioProjects = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query('portfolio_projects').collect();
    const existingSlugs = new Set(existing.map((p) => p.slug));
    const nextOrder = existing.length;

    const now = Date.now();
    let inserted = 0;

    for (let i = 0; i < projectProfiles.length; i++) {
      const project = projectProfiles[i];
      if (existingSlugs.has(project.slug)) {
        console.log(`Skipping "${project.title}" — slug already exists`);
        continue;
      }

      await ctx.db.insert('portfolio_projects', {
        ...project,
        order: nextOrder + inserted,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
      console.log(
        `Inserted "${project.title}" at order ${nextOrder + inserted - 1}`
      );
    }

    console.log(
      `Seeded ${inserted} new portfolio projects (${projectProfiles.length - inserted} skipped)`
    );
    return null;
  },
});
