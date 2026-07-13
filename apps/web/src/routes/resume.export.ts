import { createServerFileRoute } from '@tanstack/react-start/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@template/backend';

import type { ResumeProfilePayload } from '@/hooks/use-resume-filter';
import {
  ResumeExportConfigError,
  ResumeProfileNotFoundError,
  createResumeExportResponse,
} from '@/lib/resume-export-route';

async function fetchResumeProfile(slug: string): Promise<ResumeProfilePayload> {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new ResumeExportConfigError('CONVEX_URL not configured.');
  }

  const httpClient = new ConvexHttpClient(convexUrl);

  try {
    return (await httpClient.query(api.resume.getProfile, {
      slug,
    })) as ResumeProfilePayload;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Resume profile not found')
    ) {
      throw new ResumeProfileNotFoundError(slug);
    }

    throw error;
  }
}

export const ServerRoute = createServerFileRoute('/resume/export').methods({
  GET: async ({ request }) => {
    return createResumeExportResponse(request, fetchResumeProfile);
  },
});
