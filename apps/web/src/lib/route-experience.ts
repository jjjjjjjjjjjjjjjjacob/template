export type RouteExperience = 'public' | 'admin' | 'macos' | 'legacy';

function isRouteSegment(pathname: string, segment: string) {
  return pathname === segment || pathname.startsWith(`${segment}/`);
}

export function getRouteExperience(pathname: string): RouteExperience {
  if (isRouteSegment(pathname, '/legacy')) return 'legacy';
  if (isRouteSegment(pathname, '/admin')) return 'admin';
  if (isRouteSegment(pathname, '/macos')) return 'macos';

  // Every new or unknown route starts in the first-class public experience.
  return 'public';
}
