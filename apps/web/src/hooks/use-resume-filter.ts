import { useMemo } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';

export interface ResumeProfilePayload {
  profile: {
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
  };
  projects: Array<{
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
    }>;
    technologies: {
      frontend: string[];
      backend: string[];
      infrastructure: string[];
      databases: string[];
      tools: string[];
    };
    previews: string[];
  }>;
  skills: Array<{
    category: string;
    skills: string[];
    proficiency: string;
    domains: string[];
    priority: number;
  }>;
}

const DEFAULT_SLUG = 'default';
const ALLOWED_VARIANTS = new Set(['default', 'product', 'frontend']);

function parseVariant(searchParams: Record<string, unknown>): string {
  if (typeof searchParams.resume === 'string') {
    const normalized = searchParams.resume.toLowerCase();
    if (ALLOWED_VARIANTS.has(normalized)) {
      return normalized;
    }
  }
  return DEFAULT_SLUG;
}

export function useResumeFilter() {
  const searchParams = useSearch({ from: '/' });
  const variant = parseVariant(searchParams);

  const payload = useQuery(api.resume.getProfile, { slug: variant }) as
    | ResumeProfilePayload
    | undefined;

  return useMemo(() => {
    const profile = payload?.profile;
    const projects = payload?.projects ?? [];
    const skills = payload?.skills ?? [];

    return {
      variant,
      profile,
      projects,
      skills,
    };
  }, [payload, variant]);
}
