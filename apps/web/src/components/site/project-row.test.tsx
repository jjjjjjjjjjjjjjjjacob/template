import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeProject } from '@/hooks/use-resume-filter';
import { ProjectDetail } from './project-row';

const project: ResumeProject = {
  id: 'project-1',
  projectId: 'project-1',
  priority: 1,
  title: 'Cascade Project',
  url: 'https://example.com',
  company: 'Example Co.',
  timeline: '2024 - Present',
  role: 'design engineer',
  description: 'A representative project description.',
  focusAreas: [],
  domains: [],
  achievements: [
    {
      description: 'Shipped the redesigned product.',
      technologies: [],
      domains: [],
      type: 'delivery',
      priority: 1,
    },
  ],
  technologies: {
    frontend: ['React'],
    backend: ['TypeScript'],
    infrastructure: [],
    databases: [],
    tools: [],
  },
  previews: ['https://example.com/preview.png'],
  previewCaptions: ['Product preview'],
};

describe('ProjectDetail cascade', () => {
  it('assigns increasing delays to each semantic content section', () => {
    const { container } = render(<ProjectDetail project={project} index={0} />);

    const delays = Array.from(
      container.querySelectorAll<HTMLElement>('.site-cascade-item')
    ).map((element) => element.style.getPropertyValue('--site-cascade-delay'));

    expect(delays).toEqual([
      '0ms',
      '65ms',
      '130ms',
      '195ms',
      '260ms',
      '325ms',
      '390ms',
      '455ms',
      '520ms',
    ]);
  });
});
