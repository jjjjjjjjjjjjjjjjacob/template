import { describe, expect, it } from 'vitest';

import {
  buildResumeMarkdown,
  buildResumePlainText,
} from '@/lib/resume-export-text';
import type { ResumeData } from '@/hooks/use-story-canvas';

const sampleData: ResumeData = {
  name: 'Jacob Stein',
  title: 'Founding Engineer & UI/UX',
  summary: 'Technical leader and architect with 4+ years of experience.',
  location: 'San Francisco, CA',
  experiences: [
    {
      company: 'The Market',
      role: 'Founder & Developer',
      timeline: 'November 2025 - Present',
      location: 'Remote',
      description: 'Built a compatibility-focused dating app.',
      achievements: [
        'Built the full product across TanStack Start, Expo, and Convex',
        'Implemented compatibility-driven discovery and real-time chat',
      ],
      technologies: ['TanStack Start', 'Convex', 'TypeScript'],
    },
  ],
  skills: [
    {
      category: 'Languages',
      skills: ['TypeScript', 'Python', 'C++'],
    },
    {
      category: 'Empty',
      skills: [],
    },
  ],
  education: [
    {
      institution: 'University of California, Los Angeles',
      degree: 'Bachelor of Arts in Ethnomusicology',
      timeline: '2010 - 2015',
      location: 'Los Angeles, CA',
    },
  ],
  contact: {
    email: 'jacob@jacobstein.me',
    github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
    website: 'https://jacobstein.dev',
  },
};

describe('buildResumeMarkdown', () => {
  it('renders all sections with markdown headings', () => {
    const md = buildResumeMarkdown(sampleData);

    expect(md).toContain('# Jacob Stein');
    expect(md).toContain('Founding Engineer & UI/UX');
    expect(md).toContain('## Summary');
    expect(md).toContain('## Experience');
    expect(md).toContain('### Founder & Developer');
    expect(md).toContain('The Market | November 2025 - Present | Remote');
    expect(md).toContain('**Key Achievements:**');
    expect(md).toContain(
      '- Built the full product across TanStack Start, Expo, and Convex'
    );
    expect(md).toContain(
      '**Technologies:** TanStack Start, Convex, TypeScript'
    );
    expect(md).toContain('## Skills');
    expect(md).toContain('- **Languages:** TypeScript, Python, C++');
    expect(md).toContain('## Education');
    expect(md).toContain('### Bachelor of Arts in Ethnomusicology');
  });

  it('renders a contact line with stripped url protocols', () => {
    const md = buildResumeMarkdown(sampleData);
    expect(md).toContain(
      'jacob@jacobstein.me | San Francisco, CA | jacobstein.dev | github.com/jjjjjjjjjjjjjjjjacob'
    );
    expect(md).not.toContain('https://');
  });

  it('skips empty skill categories', () => {
    const md = buildResumeMarkdown(sampleData);
    expect(md).not.toContain('Empty:');
  });

  it('produces no html tags or canvas emoji', () => {
    const md = buildResumeMarkdown(sampleData);
    expect(md).not.toMatch(/<[a-z][^>]*>/i);
    expect(md).not.toContain('📅');
    expect(md).not.toContain('📍');
  });

  it('ends with a single trailing newline', () => {
    const md = buildResumeMarkdown(sampleData);
    expect(md.endsWith('\n')).toBe(true);
    expect(md.endsWith('\n\n')).toBe(false);
  });
});

describe('buildResumePlainText', () => {
  it('renders uppercase section headers without markdown markup', () => {
    const txt = buildResumePlainText(sampleData);

    expect(txt).toContain('Jacob Stein');
    expect(txt).toContain('SUMMARY');
    expect(txt).toContain('EXPERIENCE');
    expect(txt).toContain('SKILLS');
    expect(txt).toContain('EDUCATION');
    expect(txt).toContain('Languages: TypeScript, Python, C++');
    expect(txt).toContain('Technologies: TanStack Start, Convex, TypeScript');
    expect(txt).not.toContain('#');
    expect(txt).not.toContain('**');
  });

  it('uses hyphen bullets for achievements', () => {
    const txt = buildResumePlainText(sampleData);
    expect(txt).toContain(
      '- Implemented compatibility-driven discovery and real-time chat'
    );
  });
});

describe('optional section handling', () => {
  it('omits education and skills sections when absent', () => {
    const minimal: ResumeData = {
      name: 'Jacob Stein',
      title: '',
      summary: '',
      experiences: [],
      skills: [],
      contact: {},
    };

    const md = buildResumeMarkdown(minimal);
    const txt = buildResumePlainText(minimal);

    expect(md).not.toContain('## Education');
    expect(md).not.toContain('## Skills');
    expect(md).not.toContain('## Experience');
    expect(txt).not.toContain('EDUCATION');
    expect(txt).not.toContain('SKILLS');
    expect(md.trim()).toBe('# Jacob Stein');
    expect(txt.trim()).toBe('Jacob Stein');
  });
});
