import { fireEvent, render, screen, within } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResumeProject } from '@/hooks/use-resume-filter';
import { SiteLanding } from './landing';

const mocks = vi.hoisted(() => ({
  hasPublishedPosts: true,
  setStage: vi.fn(),
}));

vi.mock('convex/react', () => ({
  useQuery: () => mocks.hasPublishedPosts,
}));

vi.mock('@template/backend', () => ({
  api: {
    blog: {
      hasPublishedPosts: 'api.blog.hasPublishedPosts',
    },
  },
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/use-portfolio-data', () => ({
  usePortfolioData: () => ({
    profile: {
      slug: 'default',
      name: 'Jacob Test',
      title: 'product engineer',
      location: 'Brooklyn',
      summary: 'I build focused digital products.',
      contact: {
        email: 'jacob@example.com',
        github: 'https://github.com/jacob',
        website: 'https://example.com',
      },
      defaults: {
        focusAreas: [],
        topTechnologies: [],
        priorityDomains: [],
      },
    },
    projects: [makeProject('alpha', 'Alpha'), makeProject('beta', 'Beta')],
    skills: [],
    summary: 'I build focused digital products.',
    isLoading: false,
  }),
}));

vi.mock('./visual-provider', () => ({
  projectStage: () => ({ variant: 'orbs' }),
  useSiteVisuals: () => ({ theme: 'light', setStage: mocks.setStage }),
}));

vi.mock('./public-shell', () => ({
  SiteResumeAction: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      resume
    </button>
  ),
}));

vi.mock('./theme-toggle', () => ({
  SiteThemeToggle: () => <button type="button">theme</button>,
}));

function makeProject(id: string, title: string): ResumeProject {
  return {
    id,
    projectId: id,
    priority: 1,
    title,
    company: 'Example Co.',
    timeline: '2025 - Present',
    role: 'lead engineer',
    description: `${title} project description`,
    focusAreas: [],
    domains: [],
    achievements: [],
    technologies: {
      frontend: ['React'],
      backend: [],
      infrastructure: [],
      databases: [],
      tools: [],
    },
    previews: [],
  };
}

describe('SiteLanding cascade', () => {
  beforeEach(() => {
    mocks.hasPublishedPosts = true;
  });

  it('stagger-animates sidebar items and project rows from fixed delays', () => {
    render(<SiteLanding />);

    expect(screen.getByText('index — selected work').parentElement).toHaveClass(
      'site-cascade-item'
    );
    expect(screen.getByRole('heading', { name: 'Jacob Test' })).toHaveStyle({
      '--site-cascade-delay': '60ms',
    });
    expect(screen.getByRole('link', { name: 'jacob@example.com' })).toHaveStyle(
      { '--site-cascade-delay': '240ms' }
    );
    expect(screen.getByRole('link', { name: 'github ↗' })).toHaveClass(
      'site-cascade-item'
    );

    const alphaRow = screen.getByRole('button', { name: /Alpha/ });
    const betaRow = screen.getByRole('button', { name: /Beta/ });
    expect(alphaRow).toHaveStyle({ '--site-cascade-delay': '520ms' });
    expect(betaRow).toHaveStyle({ '--site-cascade-delay': '575ms' });
  });

  it('remounts the cascading detail sequence when selection changes', () => {
    render(<SiteLanding />);

    const alphaHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Alpha',
    });
    expect(alphaHeading).toHaveClass('site-cascade-item');
    expect(alphaHeading).toHaveStyle({ '--site-cascade-delay': '65ms' });

    fireEvent.click(screen.getByRole('button', { name: /Beta/ }));

    const betaHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Beta',
    });
    expect(betaHeading).not.toBe(alphaHeading);
    expect(betaHeading).toHaveStyle({ '--site-cascade-delay': '65ms' });
  });

  it('reuses the public page header and places blog after resume', () => {
    render(<SiteLanding />);

    const mobileHeader = document.querySelector('.site-mobile-topbar');
    const sidebar = document.querySelector('.site-aside');

    expect(mobileHeader).not.toBeNull();
    expect(sidebar).not.toBeNull();

    const header = within(mobileHeader as HTMLElement);
    expect(header.getByRole('link', { name: 'projects' })).toHaveAttribute(
      'href',
      '/projects'
    );
    expect(header.getByRole('link', { name: 'blog' })).toHaveAttribute(
      'href',
      '/blog'
    );
    expect(header.getByRole('link', { name: 'book' })).toHaveAttribute(
      'href',
      '/book'
    );
    expect(
      header.queryByRole('link', { name: 'email' })
    ).not.toBeInTheDocument();

    const sidebarView = within(sidebar as HTMLElement);
    const resume = sidebarView.getByRole('button', { name: 'resume' });
    const blog = sidebarView.getByRole('link', { name: 'blog' });
    expect(resume.parentElement?.nextElementSibling).toBe(blog);
  });

  it('hides blog navigation when there are no published posts', () => {
    mocks.hasPublishedPosts = false;

    render(<SiteLanding />);

    expect(
      screen.queryByRole('link', { name: 'blog' })
    ).not.toBeInTheDocument();
  });
});
