import type { ResumeProfilePayload } from '@/hooks/use-resume-filter';
import type { ResumeData } from '@/hooks/use-story-canvas';

export const RESUME_EXPORT_FILENAME_BASE = 'jacob-stein-resume';
export const DEFAULT_RESUME_SLUG = 'default';

const DEFAULT_PROFILE = {
  name: 'Jacob Stein',
  title: 'Founding Engineer & UI/UX',
  location: 'San Francisco, CA',
  contact: {
    email: 'jacob@jacobstein.me',
    github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
    website: 'https://jacobstein.dev',
  },
};

type ResumeProjectSource = ResumeProfilePayload['projects'][number];
type ResumeSkillSource = ResumeProfilePayload['skills'][number];

export interface ResumeExportDataSource {
  profile?: ResumeProfilePayload['profile'];
  summary?: string;
  projects?: ResumeProjectSource[];
  skills?: ResumeSkillSource[];
}

export function parseResumeSlug(searchParams: URLSearchParams): string {
  const slug = searchParams.get('resume')?.trim();
  return slug && slug.length > 0 ? slug : DEFAULT_RESUME_SLUG;
}

export function buildResumeDataFromSource(
  source: ResumeExportDataSource
): ResumeData {
  const profile = source.profile;
  const contact = {
    ...DEFAULT_PROFILE.contact,
    ...profile?.contact,
  };

  return {
    name: profile?.name ?? DEFAULT_PROFILE.name,
    title: profile?.title ?? DEFAULT_PROFILE.title,
    summary: profile?.summary ?? source.summary ?? '',
    location: profile?.location ?? DEFAULT_PROFILE.location,
    experiences: (source.projects ?? []).map((project) => ({
      company: project.company,
      role: project.role,
      timeline: project.timeline,
      location: 'Remote',
      description: project.description,
      achievements: project.achievements
        .slice(0, 8)
        .map((achievement) => achievement.description),
      technologies: [
        ...project.technologies.frontend.slice(0, 4),
        ...project.technologies.backend.slice(0, 4),
        ...project.technologies.infrastructure.slice(0, 2),
      ],
    })),
    skills: (source.skills ?? []).map((skillCategory) => ({
      category: skillCategory.category,
      skills: skillCategory.skills,
    })),
    education: [
      {
        institution: 'University of California, Los Angeles',
        degree: 'Bachelor of Arts in Ethnomusicology',
        timeline: '2010 - 2015',
        location: 'Los Angeles, CA',
      },
    ],
    contact,
  };
}

export function buildResumeDataFromProfile(
  payload: ResumeProfilePayload
): ResumeData {
  return buildResumeDataFromSource({
    profile: payload.profile,
    projects: payload.projects,
    skills: payload.skills,
  });
}
