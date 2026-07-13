import { describe, expect, it } from 'vitest';
import { getRouteExperience } from '@/lib/route-experience';

describe('route experience', () => {
  it.each([
    '/',
    '/projects',
    '/resume',
    '/blog',
    '/blog/post',
    '/book',
    '/sign-in',
    '/sign-in/sso-callback',
    '/sign-up',
    '/sign-up/sso-callback',
    '/future-public-route',
  ])('uses the public site system for %s', (pathname) => {
    expect(getRouteExperience(pathname)).toBe('public');
  });

  it('keeps the old portfolio styling isolated to legacy', () => {
    expect(getRouteExperience('/legacy')).toBe('legacy');
    expect(getRouteExperience('/legacy/preview')).toBe('legacy');
    expect(getRouteExperience('/legacy-but-not-the-route')).toBe('public');
  });

  it('identifies admin while preserving the standalone macOS experience', () => {
    expect(getRouteExperience('/admin')).toBe('admin');
    expect(getRouteExperience('/admin/blog')).toBe('admin');
    expect(getRouteExperience('/administrator')).toBe('public');
    expect(getRouteExperience('/macos')).toBe('macos');
    expect(getRouteExperience('/macos/finder')).toBe('macos');
  });
});
