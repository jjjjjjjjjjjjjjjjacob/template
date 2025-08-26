import { useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  resumeProfile,
  type FocusArea,
  type Domain,
  type Technology,
  type ExperienceLevel,
  type ProjectContribution,
  type SkillCategory,
  type Achievement,
} from '@/data/resume-profile';

// Re-export types for components
export type { FocusArea, Domain, Technology };

export interface ResumeFilters {
  focus?: FocusArea[];
  technologies?: Technology[];
  domains?: Domain[];
  role?: ExperienceLevel[];
  experience?: ('individual' | 'team' | 'leadership' | 'founding')[];
  years?: string; // format: "2022-2025" or "2025"
  format?: 'web' | 'pdf' | 'minimal' | 'detailed';
  priority?: number; // minimum priority level
}

export interface FilteredResumeData {
  projects: ProjectContribution[];
  skills: SkillCategory[];
  topAchievements: Achievement[];
  summary: string;
  filters: ResumeFilters;
}

// Parse URL search params into filters
function parseSearchParams(
  searchParams: Record<string, unknown>
): ResumeFilters {
  const filters: ResumeFilters = {};

  // Parse focus areas
  if (searchParams.focus && typeof searchParams.focus === 'string') {
    filters.focus = searchParams.focus
      .split(',')
      .filter((f) =>
        [
          'frontend',
          'backend',
          'fullstack',
          'leadership',
          'product',
          '3d-graphics',
          'realtime',
        ].includes(f)
      ) as FocusArea[];
  }

  // Parse technologies
  if (
    searchParams.technologies &&
    typeof searchParams.technologies === 'string'
  ) {
    filters.technologies = searchParams.technologies
      .split(',')
      .map((t) => t.trim());
  }

  // Parse domains
  if (searchParams.domains && typeof searchParams.domains === 'string') {
    filters.domains = searchParams.domains
      .split(',')
      .filter((d) =>
        [
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
        ].includes(d)
      ) as Domain[];
  }

  // Parse role levels
  if (searchParams.role && typeof searchParams.role === 'string') {
    filters.role = searchParams.role
      .split(',')
      .filter((r) =>
        ['junior', 'senior', 'lead', 'founder', 'consultant'].includes(r)
      ) as ExperienceLevel[];
  }

  // Parse experience types
  if (searchParams.experience && typeof searchParams.experience === 'string') {
    filters.experience = searchParams.experience
      .split(',')
      .filter((e) =>
        ['individual', 'team', 'leadership', 'founding'].includes(e)
      ) as ('individual' | 'team' | 'leadership' | 'founding')[];
  }

  // Parse year range
  if (searchParams.years && typeof searchParams.years === 'string') {
    filters.years = searchParams.years;
  }

  // Parse format
  if (searchParams.format && typeof searchParams.format === 'string') {
    if (['web', 'pdf', 'minimal', 'detailed'].includes(searchParams.format)) {
      filters.format = searchParams.format as
        | 'web'
        | 'pdf'
        | 'minimal'
        | 'detailed';
    }
  }

  // Parse priority threshold
  if (searchParams.priority && typeof searchParams.priority === 'string') {
    const priority = parseInt(searchParams.priority, 10);
    if (!isNaN(priority) && priority >= 1 && priority <= 10) {
      filters.priority = priority;
    }
  }

  return filters;
}

// Filter projects based on criteria
function filterProjects(
  projects: ProjectContribution[],
  filters: ResumeFilters
): ProjectContribution[] {
  return projects
    .filter((project) => {
      // Filter by focus areas
      if (filters.focus && filters.focus.length > 0) {
        if (
          !filters.focus.some((focus) => project.focusAreas.includes(focus))
        ) {
          return false;
        }
      }

      // Filter by domains
      if (filters.domains && filters.domains.length > 0) {
        if (
          !filters.domains.some((domain) => project.domains.includes(domain))
        ) {
          return false;
        }
      }

      // Filter by technologies
      if (filters.technologies && filters.technologies.length > 0) {
        const allProjectTech = [
          ...project.technologies.frontend,
          ...project.technologies.backend,
          ...project.technologies.infrastructure,
          ...project.technologies.databases,
          ...project.technologies.tools,
        ];
        if (
          !filters.technologies.some((tech) =>
            allProjectTech.some((projectTech) =>
              projectTech.toLowerCase().includes(tech.toLowerCase())
            )
          )
        ) {
          return false;
        }
      }

      // Filter by year range
      if (filters.years) {
        const [startYear, endYear] = filters.years.includes('-')
          ? filters.years.split('-').map((y) => parseInt(y.trim(), 10))
          : [parseInt(filters.years, 10), parseInt(filters.years, 10)];

        const projectYears =
          project.timeline.match(/\d{4}/g)?.map((y) => parseInt(y, 10)) || [];
        if (projectYears.length > 0) {
          const projectStart = Math.min(...projectYears);
          const projectEnd = Math.max(...projectYears);

          // Check if project overlaps with filter range
          if (endYear < projectStart || startYear > projectEnd) {
            return false;
          }
        }
      }

      // Filter by priority
      if (filters.priority && project.priority < filters.priority) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.priority - a.priority); // Sort by priority descending
}

// Filter achievements within projects
function filterAchievements(
  projects: ProjectContribution[],
  filters: ResumeFilters
): Achievement[] {
  const allAchievements = projects.flatMap((project) =>
    project.achievements.map((achievement) => ({
      ...achievement,
      projectTitle: project.title,
    }))
  );

  return allAchievements
    .filter((achievement) => {
      // Filter by domains
      if (filters.domains && filters.domains.length > 0) {
        if (
          !filters.domains.some((domain) =>
            achievement.domains.includes(domain)
          )
        ) {
          return false;
        }
      }

      // Filter by technologies
      if (filters.technologies && filters.technologies.length > 0) {
        if (
          !filters.technologies.some((tech) =>
            achievement.technologies.some((achievementTech) =>
              achievementTech.toLowerCase().includes(tech.toLowerCase())
            )
          )
        ) {
          return false;
        }
      }

      // Filter by priority
      if (filters.priority && achievement.priority < filters.priority) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10); // Top 10 achievements
}

// Filter skills based on criteria
function filterSkills(
  skills: SkillCategory[],
  filters: ResumeFilters
): SkillCategory[] {
  return skills
    .filter((skillCategory) => {
      // Filter by domains
      if (filters.domains && filters.domains.length > 0) {
        if (
          !filters.domains.some((domain) =>
            skillCategory.domains.includes(domain)
          )
        ) {
          return false;
        }
      }

      // Filter by technologies
      if (filters.technologies && filters.technologies.length > 0) {
        if (
          !filters.technologies.some((tech) =>
            skillCategory.skills.some((skill) =>
              skill.toLowerCase().includes(tech.toLowerCase())
            )
          )
        ) {
          return false;
        }
      }

      // Filter by priority
      if (filters.priority && skillCategory.priority < filters.priority) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.priority - a.priority);
}

// Generate dynamic summary based on filters
function generateSummary(filters: ResumeFilters): string {
  const { summary } = resumeProfile.personal;

  // If no specific filters, return default
  if (!filters.focus && !filters.technologies && !filters.domains) {
    return summary;
  }

  let customSummary = '';

  // Focus-specific summaries
  if (filters.focus && filters.focus.length > 0) {
    if (filters.focus.includes('3d-graphics')) {
      customSummary =
        'Full-stack developer specializing in 3D graphics and real-time animation systems. Expert in Three.js, WebGL, and motion capture technology with experience building production-scale 3D applications.';
    } else if (filters.focus.includes('realtime')) {
      customSummary =
        'Full-stack developer specializing in real-time systems and modern web architecture. Expert in WebSocket technologies, optimistic UI updates, and event-driven systems.';
    } else if (filters.focus.includes('leadership')) {
      customSummary =
        'Technical leader and architect with experience founding and scaling software platforms. Proven track record of building high-performance teams and delivering complex technical products.';
    } else if (filters.focus.includes('backend')) {
      customSummary =
        'Backend-focused developer with expertise in scalable API design, database architecture, and cloud infrastructure. Experienced in building robust systems that handle complex business logic.';
    } else if (filters.focus.includes('frontend')) {
      customSummary =
        'Frontend developer with strong UI/UX design skills and expertise in modern React ecosystems. Specialized in building intuitive, performance-optimized user experiences.';
    }
  }

  return customSummary || summary;
}

export function useResumeFilter() {
  const searchParams = useSearch({ from: '/' });

  const filteredData = useMemo(() => {
    const filters = parseSearchParams(searchParams);

    // Apply defaults if no filters specified
    const effectiveFilters = {
      ...filters,
      focus: filters.focus?.length
        ? filters.focus
        : resumeProfile.defaults.focusAreas,
      priority: filters.priority ?? 6, // Default minimum priority
    };

    const filteredProjects = filterProjects(
      resumeProfile.projects,
      effectiveFilters
    );
    const filteredSkills = filterSkills(resumeProfile.skills, effectiveFilters);
    const topAchievements = filterAchievements(
      filteredProjects,
      effectiveFilters
    );
    const summary = generateSummary(effectiveFilters);

    return {
      projects: filteredProjects,
      skills: filteredSkills,
      topAchievements,
      summary,
      filters: effectiveFilters,
    };
  }, [searchParams]);

  return filteredData;
}

// Helper hook for generating filter URLs
export function useResumeFilterNavigation() {
  return {
    createFilterUrl: (filters: Partial<ResumeFilters>) => {
      const params = new URLSearchParams();

      if (filters.focus && filters.focus.length > 0) {
        params.set('focus', filters.focus.join(','));
      }
      if (filters.technologies && filters.technologies.length > 0) {
        params.set('technologies', filters.technologies.join(','));
      }
      if (filters.domains && filters.domains.length > 0) {
        params.set('domains', filters.domains.join(','));
      }
      if (filters.role && filters.role.length > 0) {
        params.set('role', filters.role.join(','));
      }
      if (filters.experience && filters.experience.length > 0) {
        params.set('experience', filters.experience.join(','));
      }
      if (filters.years) {
        params.set('years', filters.years);
      }
      if (filters.format) {
        params.set('format', filters.format);
      }
      if (filters.priority) {
        params.set('priority', filters.priority.toString());
      }

      return `/?${params.toString()}`;
    },
  };
}
