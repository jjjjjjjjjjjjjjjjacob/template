import { useCallback, useMemo } from 'react';
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

const RESUME_VARIANTS = ['default', 'product', 'frontend', 'fde'] as const;
export type ResumeVariant = (typeof RESUME_VARIANTS)[number];
const DEFAULT_SLUG: ResumeVariant = 'default';
const ALLOWED_VARIANTS = new Set<ResumeVariant>(RESUME_VARIANTS);

const FOCUS_AREA_VALUES = [
  'frontend',
  'backend',
  'fullstack',
  'leadership',
  'product',
  '3d-graphics',
  'realtime',
  'ai',
  'customer-facing',
  'agent',
  'multimodal',
  'integration',
] as const;
export type FocusArea = (typeof FOCUS_AREA_VALUES)[number];
const FOCUS_AREA_SET = new Set<FocusArea>(FOCUS_AREA_VALUES);

const DOMAIN_VALUES = [
  'frontend',
  'backend',
  'infrastructure',
  '3d',
  'payments',
  'realtime',
  'auth',
  'marketplace',
  'social',
  'testing',
  'devops',
  'ai',
  'llm',
  'agent',
  'video',
  'search',
  'consumer',
  'customer-success',
  'integration',
  'cross-platform',
  'ml',
  'business',
] as const;
export type Domain = (typeof DOMAIN_VALUES)[number];
const DOMAIN_SET = new Set<Domain>(DOMAIN_VALUES);

export type Technology = string;

export interface ResumeFilters {
  focus?: FocusArea[];
  domains?: Domain[];
  technologies?: Technology[];
  priority?: number;
  format?: string;
}

export type ResumeProject = ResumeProfilePayload['projects'][number] & {
  id: string;
};

export type ResumeSkill = ResumeProfilePayload['skills'][number];

export interface ResumeFilterResult {
  variant: ResumeVariant;
  filters: ResumeFilters;
  profile?: ResumeProfilePayload['profile'];
  summary: string;
  projects: ResumeProject[];
  skills: ResumeSkill[];
}

function parseVariant(searchParams: Record<string, unknown>): ResumeVariant {
  if (typeof searchParams.resume === 'string') {
    const normalized = searchParams.resume.toLowerCase();
    if (ALLOWED_VARIANTS.has(normalized as ResumeVariant)) {
      return normalized as ResumeVariant;
    }
  }

  return DEFAULT_SLUG;
}

function parseListParam<T extends string>(
  value: unknown,
  allowed?: Set<T>
): T[] | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is T => {
      if (item.length === 0) {
        return false;
      }
      if (!allowed) {
        return true;
      }
      return allowed.has(item as T);
    });

  if (items.length === 0) {
    return undefined;
  }

  return Array.from(new Set(items));
}

function parseFormat(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePriority(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const parsed =
    typeof value === 'number' ? value : Number.parseInt(value.trim(), 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFilters(searchParams: Record<string, unknown>): ResumeFilters {
  return {
    focus: parseListParam(searchParams.focus, FOCUS_AREA_SET),
    domains: parseListParam(searchParams.domains, DOMAIN_SET),
    technologies: parseListParam(searchParams.technologies),
    priority: parsePriority(searchParams.priority),
    format: parseFormat(searchParams.format),
  };
}

function normalizeFilterInput(filters: Partial<ResumeFilters>): ResumeFilters {
  const normalizeArray = <T extends string>(
    values: readonly T[] | undefined,
    allowed?: Set<T>
  ): T[] | undefined => {
    if (!values || values.length === 0) {
      return undefined;
    }

    const unique = Array.from(new Set(values));
    const filtered = unique.filter((value): value is T => {
      if (!allowed) {
        return true;
      }
      return allowed.has(value);
    });

    return filtered.length > 0 ? filtered : undefined;
  };

  return {
    focus: normalizeArray(filters.focus, FOCUS_AREA_SET),
    domains: normalizeArray(filters.domains, DOMAIN_SET),
    technologies: normalizeArray(filters.technologies),
    priority:
      typeof filters.priority === 'number' && Number.isFinite(filters.priority)
        ? filters.priority
        : undefined,
    format: parseFormat(filters.format),
  };
}

export function useResumeFilter(): ResumeFilterResult {
  const searchParams = useSearch({ from: '/' });
  const variant = parseVariant(searchParams);
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const payload = useQuery(api.resume.getProfile, { slug: variant }) as
    | ResumeProfilePayload
    | undefined;

  return useMemo(() => {
    const profile = payload?.profile;
    const projects =
      payload?.projects?.map((project) => ({
        ...project,
        id: project.projectId,
      })) ?? [];

    const skills = payload?.skills ?? [];

    return {
      variant,
      filters,
      profile,
      summary: profile?.summary ?? '',
      projects,
      skills,
    };
  }, [filters, payload, variant]);
}

export function useResumeFilterNavigation() {
  const searchParams = useSearch({ from: '/' });
  const variant = parseVariant(searchParams);

  const createFilterUrl = useCallback(
    (updates: Partial<ResumeFilters>) => {
      const normalized = normalizeFilterInput(updates);
      const params = new URLSearchParams();

      if (variant !== DEFAULT_SLUG) {
        params.set('resume', variant);
      }

      if (normalized.focus && normalized.focus.length > 0) {
        params.set('focus', normalized.focus.join(','));
      }

      if (normalized.domains && normalized.domains.length > 0) {
        params.set('domains', normalized.domains.join(','));
      }

      if (normalized.technologies && normalized.technologies.length > 0) {
        params.set('technologies', normalized.technologies.join(','));
      }

      if (typeof normalized.priority === 'number') {
        params.set('priority', String(normalized.priority));
      }

      if (typeof normalized.format === 'string') {
        params.set('format', normalized.format);
      }

      const queryString = params.toString();
      return queryString.length > 0 ? `/?${queryString}` : '/';
    },
    [variant]
  );

  return { createFilterUrl };
}
