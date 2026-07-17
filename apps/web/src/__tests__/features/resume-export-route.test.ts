import { describe, expect, it, vi } from 'vitest';

import type { ResumeProfilePayload } from '@/hooks/use-resume-filter';
import {
  createResumeExportResponse,
  ResumeProfileNotFoundError,
} from '@/lib/resume-export-route';

const samplePayload: ResumeProfilePayload = {
  profile: {
    slug: 'default',
    name: 'Jacob Stein',
    title: 'Founding Engineer & UI/UX',
    location: 'San Francisco, CA',
    summary: 'Founder/developer building The Market since November 2025.',
    contact: {
      email: 'jacob@jacobstein.me',
      github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
      website: 'https://jacobstein.dev',
    },
    defaults: {
      focusAreas: ['fullstack'],
      topTechnologies: ['React'],
      priorityDomains: ['frontend'],
    },
  },
  projects: [
    {
      projectId: 'the-market',
      priority: 0,
      title: 'The Market',
      company: 'The Market',
      timeline: 'November 2025 - Present',
      role: 'Founder & Developer',
      description: 'A compatibility-focused dating app for web and mobile.',
      focusAreas: ['fullstack'],
      domains: ['social'],
      achievements: [
        {
          description: 'Built the full product as a solo founder/developer',
          technologies: ['Convex'],
          domains: ['backend'],
          type: 'development',
          priority: 0,
        },
      ],
      technologies: {
        frontend: ['TanStack Start', 'React 19'],
        backend: ['Convex'],
        infrastructure: ['Cloudflare Workers'],
        databases: [],
        tools: [],
      },
      previews: [],
    },
  ],
  skills: [],
};

describe('createResumeExportResponse', () => {
  it('returns plaintext by default', async () => {
    const fetchProfile = vi.fn().mockResolvedValue(samplePayload);

    const response = await createResumeExportResponse(
      new Request('https://example.com/resume/export?resume=default'),
      fetchProfile
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.headers.get('content-disposition')).toBe(
      'inline; filename="jacob-stein-resume.txt"'
    );
    expect(fetchProfile).toHaveBeenCalledWith('default');

    const body = await response.text();
    expect(body).toContain('The Market');
    expect(body).toContain('Founder & Developer');
  });

  it('returns a DOCX attachment', async () => {
    const response = await createResumeExportResponse(
      new Request('https://example.com/resume/export?format=docx'),
      vi.fn().mockResolvedValue(samplePayload)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="jacob-stein-resume.docx"'
    );

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(1000);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
  });

  it('returns 400 for unsupported formats', async () => {
    const fetchProfile = vi.fn();

    const response = await createResumeExportResponse(
      new Request('https://example.com/resume/export?format=pdf'),
      fetchProfile
    );

    expect(response.status).toBe(400);
    expect(fetchProfile).not.toHaveBeenCalled();
  });

  it('returns 404 when the requested profile is missing', async () => {
    const response = await createResumeExportResponse(
      new Request('https://example.com/resume/export?resume=missing'),
      vi.fn().mockRejectedValue(new ResumeProfileNotFoundError('missing'))
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toContain('missing');
  });
});
