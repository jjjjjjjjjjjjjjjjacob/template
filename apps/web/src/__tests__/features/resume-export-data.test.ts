import { describe, expect, it } from 'vitest';
import type { ResumeProfilePayload } from '@/hooks/use-resume-filter';
import {
  buildResumeDataFromProfile,
  buildResumeDataFromSource,
  DEFAULT_RESUME_SLUG,
  parseResumeSlug,
} from '@/lib/resume-export-data';

const samplePayload: ResumeProfilePayload = {
  profile: {
    slug: 'default',
    name: 'Jacob Stein',
    title: 'Founding Engineer & UI/UX',
    location: 'San Francisco, CA',
    summary: 'Building The Market since November 2025.',
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
      url: 'https://themarket.example',
      company: 'The Market',
      timeline: 'November 2025 - Present',
      role: 'Founder & Developer',
      description: 'A compatibility-focused dating app for web and mobile.',
      focusAreas: ['fullstack', 'product'],
      domains: ['social', 'mobile'],
      achievements: [
        {
          description: 'Built the full product as a solo founder/developer',
          technologies: ['TanStack Start'],
          domains: ['frontend'],
          type: 'development',
          priority: 0,
        },
      ],
      technologies: {
        frontend: ['TanStack Start', 'React 19', 'Expo', 'React Native'],
        backend: ['Convex', 'Clerk'],
        infrastructure: ['AWS Rekognition', 'Cloudflare Workers'],
        databases: [],
        tools: [],
      },
      previews: [],
    },
  ],
  skills: [
    {
      category: 'Frontend Development',
      skills: ['React', 'TypeScript'],
      proficiency: 'expert',
      domains: ['frontend'],
      priority: 0,
    },
  ],
};

describe('resume export data', () => {
  it('parses default and explicit resume slugs', () => {
    expect(parseResumeSlug(new URLSearchParams())).toBe(DEFAULT_RESUME_SLUG);
    expect(parseResumeSlug(new URLSearchParams('resume=frontend'))).toBe(
      'frontend'
    );
  });

  it('builds resume data from a Convex profile payload', () => {
    const data = buildResumeDataFromProfile(samplePayload);

    expect(data.name).toBe('Jacob Stein');
    expect(data.title).toBe('Founding Engineer & UI/UX');
    expect(data.summary).toContain('The Market');
    expect(data.experiences[0]).toMatchObject({
      company: 'The Market',
      role: 'Founder & Developer',
      timeline: 'November 2025 - Present',
      location: 'Remote',
    });
    expect(data.experiences[0].achievements).toEqual([
      'Built the full product as a solo founder/developer',
    ]);
    expect(data.experiences[0].technologies).toEqual([
      'TanStack Start',
      'React 19',
      'Expo',
      'React Native',
      'Convex',
      'Clerk',
      'AWS Rekognition',
      'Cloudflare Workers',
    ]);
    expect(data.skills).toEqual([
      {
        category: 'Frontend Development',
        skills: ['React', 'TypeScript'],
      },
    ]);
    expect(data.education?.[0].institution).toBe(
      'University of California, Los Angeles'
    );
  });

  it('uses hardcoded defaults while profile data is loading', () => {
    const data = buildResumeDataFromSource({});

    expect(data.name).toBe('Jacob Stein');
    expect(data.title).toBe('Founding Engineer & UI/UX');
    expect(data.location).toBe('San Francisco, CA');
    expect(data.contact.website).toBe('https://jacobstein.dev');
  });
});
