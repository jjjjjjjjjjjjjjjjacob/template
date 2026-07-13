import type { ResumeProject } from '@/hooks/use-resume-filter';

/**
 * Flatten the categorized technology buckets into a single de-duplicated,
 * source-ordered list for compact portfolio presentation.
 */
export function flattenTechnologies(
  project: ResumeProject,
  limit?: number
): string[] {
  const { frontend, backend, infrastructure, databases, tools } =
    project.technologies;
  const unique = Array.from(
    new Set([
      ...frontend,
      ...backend,
      ...infrastructure,
      ...databases,
      ...tools,
    ])
  );
  return typeof limit === 'number' ? unique.slice(0, limit) : unique;
}

/**
 * Pull the leading calendar year out of a timeline string like
 * "2025 - Present" -> "2025". Falls back to the raw string.
 */
export function startYear(timeline: string): string {
  const match = timeline.match(/\d{4}/);
  return match ? match[0] : timeline;
}

/** Top N achievement descriptions, ordered as stored. */
export function topAchievements(
  project: ResumeProject,
  count: number
): string[] {
  return (project.achievements ?? [])
    .slice(0, count)
    .map((achievement) => achievement.description);
}
