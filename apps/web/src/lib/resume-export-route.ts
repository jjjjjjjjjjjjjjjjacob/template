import type { ResumeProfilePayload } from '@/hooks/use-resume-filter';

import {
  buildResumeDataFromProfile,
  parseResumeSlug,
  RESUME_EXPORT_FILENAME_BASE,
} from '@/lib/resume-export-data';
import { buildResumeDocx } from '@/lib/resume-export-docx';
import { buildResumePlainText } from '@/lib/resume-export-text';

export type ResumeExportFormat = 'txt' | 'docx';

export class ResumeProfileNotFoundError extends Error {
  constructor(slug: string) {
    super(`Resume profile not found for slug: ${slug}`);
    this.name = 'ResumeProfileNotFoundError';
  }
}

export class ResumeExportConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeExportConfigError';
  }
}

type FetchResumeProfile = (slug: string) => Promise<ResumeProfilePayload>;

function parseExportFormat(value: string | null): ResumeExportFormat | null {
  if (!value || value.trim().length === 0) {
    return 'txt';
  }

  const normalized = value.trim().toLowerCase();
  return normalized === 'txt' || normalized === 'docx' ? normalized : null;
}

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function contentDisposition(disposition: 'inline' | 'attachment', ext: string) {
  return `${disposition}; filename="${RESUME_EXPORT_FILENAME_BASE}.${ext}"`;
}

export async function createResumeExportResponse(
  request: Request,
  fetchProfile: FetchResumeProfile
) {
  const url = new URL(request.url);
  const format = parseExportFormat(url.searchParams.get('format'));

  if (!format) {
    return textResponse('Unsupported resume export format.', 400);
  }

  const slug = parseResumeSlug(url.searchParams);
  let payload: ResumeProfilePayload;

  try {
    payload = await fetchProfile(slug);
  } catch (error) {
    if (error instanceof ResumeProfileNotFoundError) {
      return textResponse(error.message, 404);
    }

    if (error instanceof ResumeExportConfigError) {
      return textResponse(error.message, 500);
    }

    return textResponse('Unable to generate resume export.', 500);
  }

  const data = buildResumeDataFromProfile(payload);

  try {
    if (format === 'txt') {
      return new Response(buildResumePlainText(data), {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'content-disposition': contentDisposition('inline', 'txt'),
          'cache-control': 'no-store',
        },
      });
    }

    const docx = await buildResumeDocx(data);
    return new Response(docx, {
      status: 200,
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'content-disposition': contentDisposition('attachment', 'docx'),
        'cache-control': 'no-store',
      },
    });
  } catch {
    return textResponse('Unable to generate resume export.', 500);
  }
}
