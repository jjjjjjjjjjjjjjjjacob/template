import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useResumeFilter } from '@/hooks/use-resume-filter';

vi.mock('@tanstack/react-router', () => ({
  useSearch: vi.fn(),
}));

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@template/convex', () => ({
  api: {
    resume: {
      getProfile: 'resume:getProfile',
    },
  },
}));

import { useSearch } from '@tanstack/react-router';
import { useQuery } from 'convex/react';

const mockedUseSearch = useSearch as unknown as vi.Mock;
const mockedUseQuery = useQuery as unknown as vi.Mock;

const samplePayload = {
  profile: {
    slug: 'default',
    name: 'Jacob Stein',
    title: 'Fullstack',
    location: 'Remote',
    summary: 'Summary',
    contact: {},
    defaults: {
      focusAreas: ['fullstack'],
      topTechnologies: ['React'],
      priorityDomains: ['frontend'],
    },
  },
  projects: [],
  skills: [],
};

describe('useResumeFilter', () => {
  beforeEach(() => {
    mockedUseSearch.mockReset();
    mockedUseQuery.mockReset();
  });

  it('defaults to fullstack profile', () => {
    mockedUseSearch.mockReturnValue({});
    mockedUseQuery.mockReturnValue(samplePayload);

    const { result } = renderHook(() => useResumeFilter());

    expect(result.current.variant).toBe('default');
    expect(result.current.profile?.slug).toBe('default');
  });

  it('uses requested variant when supported', () => {
    mockedUseSearch.mockReturnValue({ resume: 'frontend' });
    mockedUseQuery.mockReturnValue({
      ...samplePayload,
      profile: {
        ...samplePayload.profile,
        slug: 'frontend',
      },
    });

    const { result } = renderHook(() => useResumeFilter());

    expect(result.current.variant).toBe('frontend');
    expect(result.current.profile?.slug).toBe('frontend');
  });

  it('falls back to default on unsupported variant', () => {
    mockedUseSearch.mockReturnValue({ resume: 'unknown' });
    mockedUseQuery.mockReturnValue(samplePayload);

    const { result } = renderHook(() => useResumeFilter());

    expect(result.current.variant).toBe('default');
  });
});
