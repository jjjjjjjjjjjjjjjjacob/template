import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { resumeProjects } from '../resumeData';

interface PortfolioProject {
  slug: string;
  title: string;
  url?: string;
  description: string;
  role: string;
  company?: string;
  timeline: string;
  responsibilities: string[];
  technologies: string[];
  order: number;
  published: boolean;
  media: Array<{
    type: 'image' | 'video' | 'iframe';
    url?: string;
    caption?: string;
    order: number;
  }>;
  thumbnailIndex?: number;
  includeInResume: boolean;
  resumeProfileSlugs: string[];
  createdAt: number;
  updatedAt: number;
}

const BASE_PROJECT_IDS = [
  'vibechecc',
  'heat-tech',
  'freelance',
  'cookt',
  'snoball',
  'the-market',
];

function normalizeProjectId(projectId: string): string {
  if (projectId.startsWith('vibechecc')) return 'vibechecc';
  if (projectId.startsWith('heat')) return 'heat-tech';
  return projectId;
}

export const seedPortfolioProjects = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existingProjects = await ctx.db.query('portfolio_projects').collect();
    for (const project of existingProjects) {
      await ctx.db.delete(project._id);
    }

    const projectMap = new Map<string, PortfolioProject>();
    const profileSlugsMap = new Map<string, Set<string>>();

    for (const [profileSlug, projects] of Object.entries(resumeProjects)) {
      for (const project of projects) {
        const normalizedId = normalizeProjectId(project.projectId);

        if (!profileSlugsMap.has(normalizedId)) {
          profileSlugsMap.set(normalizedId, new Set());
        }
        profileSlugsMap.get(normalizedId)!.add(profileSlug);

        if (
          !projectMap.has(normalizedId) ||
          (BASE_PROJECT_IDS.includes(project.projectId) &&
            profileSlug === 'default')
        ) {
          const allTechnologies = [
            ...project.technologies.frontend,
            ...project.technologies.backend,
            ...project.technologies.infrastructure,
            ...project.technologies.databases,
            ...project.technologies.tools,
          ].filter(
            (tech) =>
              !tech.includes('Strategy') &&
              !tech.includes('Research') &&
              !tech.includes('Analytics') &&
              !tech.includes('Operations') &&
              !tech.includes('Partnerships') &&
              !tech.includes('Management') &&
              !tech.includes('Planning') &&
              !tech.includes('Docs') &&
              !tech.includes('Mapping')
          );

          const responsibilities = project.achievements
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5)
            .map((a) => a.description);

          const media: PortfolioProject['media'] = project.previews
            .filter((url) => url.startsWith('http'))
            .slice(0, 3)
            .map((url, index) => ({
              type: 'iframe' as const,
              url,
              caption: undefined,
              order: index,
            }));

          projectMap.set(normalizedId, {
            slug: normalizedId,
            title: project.title,
            url: project.url,
            description: project.description,
            role: project.role,
            company: project.company,
            timeline: project.timeline,
            responsibilities,
            technologies: [...new Set(allTechnologies)],
            order: BASE_PROJECT_IDS.indexOf(normalizedId),
            published: true,
            media,
            thumbnailIndex: media.length > 0 ? 0 : undefined,
            includeInResume: true,
            resumeProfileSlugs: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }

    for (const [projectId, profileSlugs] of profileSlugsMap.entries()) {
      const project = projectMap.get(projectId);
      if (project) {
        project.resumeProfileSlugs = Array.from(profileSlugs);
      }
    }

    const sortedProjects = Array.from(projectMap.values()).sort(
      (a, b) => a.order - b.order
    );

    for (let i = 0; i < sortedProjects.length; i++) {
      const project = sortedProjects[i];
      project.order = i;
      await ctx.db.insert('portfolio_projects', project);
    }

    console.log(`Seeded ${sortedProjects.length} unique portfolio projects`);

    return null;
  },
});
