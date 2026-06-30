import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import type {
  ResumeProfilePayload,
  ResumeProject,
  ResumeSkill,
} from './use-resume-filter';

export interface PortfolioData {
  profile?: ResumeProfilePayload['profile'];
  projects: ResumeProject[];
  skills: ResumeSkill[];
  summary: string;
  isLoading: boolean;
}

export function usePortfolioData(slug = 'default'): PortfolioData {
  const payload = useQuery(api.resume.getProfile, { slug }) as
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
      profile,
      projects,
      skills,
      summary: profile?.summary ?? '',
      isLoading: payload === undefined,
    };
  }, [payload]);
}
