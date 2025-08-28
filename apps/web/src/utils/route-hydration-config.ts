import type { HydrationPriority } from '@/hooks/use-hydration-priority';

export interface RouteHydrationConfig {
  priority: HydrationPriority;
  delay: number;
  components?: string[];
  timeout?: number;
  lazyComponents?: string[];
  preloadAssets?: string[];
  deferUntilIdle?: boolean;
  intersectionRootMargin?: string;
  progressiveLoadOrder?: string[];
}

export interface RoutePreloadConfig {
  preloadNextRoutes?: string[];
  preloadDelay?: number;
  preloadComponents?: string[];
  prefetchData?: boolean;
  preloadAssets?: string[];
}

export type RouteHydrationStrategy = {
  [route: string]: RouteHydrationConfig;
};

export type RoutePreloadStrategy = {
  [route: string]: RoutePreloadConfig;
};

// Enhanced hydration strategy with progressive loading
export const routeHydrationStrategy: RouteHydrationStrategy = {
  '/': {
    priority: 'critical',
    delay: 0,
    components: ['Header', 'Navigation'],
    lazyComponents: ['ParticleField', 'Hero3D'],
    progressiveLoadOrder: ['Header', 'Navigation', 'Hero3D', 'ParticleField'],
    timeout: 3000,
    deferUntilIdle: false,
  },
  '/projects': {
    priority: 'high',
    delay: 100,
    components: ['ProjectHeader', 'ProjectFilter'],
    lazyComponents: [
      'ProjectSlideshow',
      'Project3DPreview',
      'ProjectThumbnails',
    ],
    progressiveLoadOrder: [
      'ProjectHeader',
      'ProjectFilter',
      'ProjectThumbnails',
      'ProjectSlideshow',
      'Project3DPreview',
    ],
    timeout: 5000,
    deferUntilIdle: false,
    intersectionRootMargin: '100px',
    preloadAssets: ['/images/projects/', '/models/projects/'],
  },
  '/resume': {
    priority: 'high',
    delay: 150,
    components: ['ResumeHeader', 'ContactInfo'],
    lazyComponents: [
      'ResumeCharts',
      'SkillsVisualization',
      'ExperienceTimeline',
      'TechStackRadar',
    ],
    progressiveLoadOrder: [
      'ResumeHeader',
      'ContactInfo',
      'ExperienceTimeline',
      'ResumeCharts',
      'SkillsVisualization',
      'TechStackRadar',
    ],
    timeout: 6000,
    deferUntilIdle: true,
    intersectionRootMargin: '50px',
  },
  '*': {
    priority: 'low',
    delay: 500,
    timeout: 8000,
    deferUntilIdle: true,
  },
};

// Intelligent preloading strategy based on user behavior patterns
export const routePreloadStrategy: RoutePreloadStrategy = {
  '/': {
    preloadNextRoutes: ['/projects'],
    preloadDelay: 200,
    preloadComponents: ['ProjectThumbnails'],
    prefetchData: false,
  },
  '/projects': {
    preloadNextRoutes: ['/resume'],
    preloadDelay: 300,
    preloadComponents: ['ResumeHeader', 'ExperienceTimeline'],
    prefetchData: false,
  },
  '/resume': {
    preloadNextRoutes: ['/'],
    preloadDelay: 400,
    preloadComponents: ['ParticleField'],
    prefetchData: false,
  },
};

/**
 * Get hydration configuration for a specific route
 */
export function getRouteHydrationConfig(
  pathname: string
): RouteHydrationConfig {
  const config =
    routeHydrationStrategy[pathname] || routeHydrationStrategy['*'];

  if (!config) {
    return {
      priority: 'high',
      delay: 200,
      timeout: 5000,
      deferUntilIdle: false,
    };
  }

  return config;
}

/**
 * Get preload configuration for a specific route
 */
export function getRoutePreloadConfig(pathname: string): RoutePreloadConfig {
  return routePreloadStrategy[pathname] || {};
}

/**
 * Check if a component should be lazily loaded for the current route
 */
export function shouldLazyLoadComponent(
  pathname: string,
  componentName: string
): boolean {
  const config = getRouteHydrationConfig(pathname);
  return config.lazyComponents?.includes(componentName) || false;
}

/**
 * Get the loading order for components on a route
 */
export function getComponentLoadOrder(pathname: string): string[] {
  const config = getRouteHydrationConfig(pathname);
  return config.progressiveLoadOrder || [];
}

/**
 * Get hydration delay for a specific component based on load order
 */
export function getComponentHydrationDelay(
  pathname: string,
  componentName: string
): number {
  const config = getRouteHydrationConfig(pathname);
  const loadOrder = config.progressiveLoadOrder || [];
  const componentIndex = loadOrder.indexOf(componentName);

  if (componentIndex === -1) {
    return config.delay;
  }

  // Progressive delay: each component waits 50ms longer than the previous
  return config.delay + componentIndex * 50;
}

/**
 * Check if route should defer hydration until idle
 */
export function shouldDeferUntilIdle(pathname: string): boolean {
  const config = getRouteHydrationConfig(pathname);
  return config.deferUntilIdle || false;
}

/**
 * Get intersection observer margins for lazy loading
 */
export function getIntersectionMargins(pathname: string): string {
  const config = getRouteHydrationConfig(pathname);
  return config.intersectionRootMargin || '50px';
}
