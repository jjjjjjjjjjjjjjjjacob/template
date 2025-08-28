import {
  routePreloadStrategy,
  type RoutePreloadConfig,
  type RouteHydrationConfig,
  routeHydrationStrategy,
} from './route-hydration-config';

/**
 * Get preload configuration for a specific route
 */
export function getRoutePreloadConfig(pathname: string): RoutePreloadConfig {
  return routePreloadStrategy[pathname] || {};
}

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
 * Intelligent route preloader based on user behavior patterns
 */
export class RoutePreloader {
  private preloadedRoutes = new Set<string>();
  private preloadPromises = new Map<string, Promise<void>>();

  constructor(private router: any) {}

  /**
   * Preload a route and its dependencies
   */
  async preloadRoute(
    to: string,
    priority: 'high' | 'low' = 'low'
  ): Promise<void> {
    if (this.preloadedRoutes.has(to)) {
      return this.preloadPromises.get(to);
    }

    const preloadPromise = this.performPreload(to, priority);
    this.preloadPromises.set(to, preloadPromise);

    try {
      await preloadPromise;
      this.preloadedRoutes.add(to);
    } catch (error) {
      console.warn(`Failed to preload route ${to}:`, error);
      this.preloadPromises.delete(to);
    }
  }

  private async performPreload(
    to: string,
    priority: 'high' | 'low'
  ): Promise<void> {
    const config = getRoutePreloadConfig(to);

    // Preload route code
    const routePromise = this.router.preloadRoute({ to });

    // Preload route-specific assets
    const assetPromises = this.preloadRouteAssets(to, config);

    if (priority === 'high') {
      // Wait for both route and assets
      await Promise.all([routePromise, ...assetPromises]);
    } else {
      // Just start the preloads, don't wait
      routePromise.catch(() => {});
      assetPromises.forEach((promise) => promise.catch(() => {}));
    }
  }

  private preloadRouteAssets(
    route: string,
    config: RoutePreloadConfig
  ): Promise<void>[] {
    const promises: Promise<void>[] = [];

    // Preload route-specific components
    if (config.preloadComponents) {
      config.preloadComponents.forEach((componentName) => {
        promises.push(this.preloadComponent(componentName));
      });
    }

    // Preload static assets
    if (config.preloadAssets) {
      config.preloadAssets.forEach((assetPath: string) => {
        promises.push(this.preloadAsset(assetPath));
      });
    }

    return promises;
  }

  private async preloadComponent(componentName: string): Promise<void> {
    // This would dynamically import the component
    // Implementation depends on your component structure
    try {
      switch (componentName) {
        case 'ProjectSlideshow':
          await import('../components/project-slideshow');
          break;
        case 'ProjectThumbnails':
          await import('../components/projects/project-thumbnails');
          break;
        case 'ResumeCharts':
          await import('../components/resume/resume-charts');
          break;
        case 'SkillsVisualization':
          await import('../components/resume/skills-visualization');
          break;
        default:
          console.warn(`Unknown component for preloading: ${componentName}`);
      }
    } catch (error) {
      console.warn(`Failed to preload component ${componentName}:`, error);
    }
  }

  private async preloadAsset(assetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (assetPath.endsWith('/')) {
        // For directory paths, we can't preload everything
        // Could implement manifest-based preloading here
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = assetPath;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${assetPath}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Preload next logical routes based on current route
   */
  preloadNextRoutes(currentRoute: string): void {
    const config = getRoutePreloadConfig(currentRoute);

    if (config.preloadNextRoutes) {
      config.preloadNextRoutes.forEach((nextRoute) => {
        setTimeout(() => {
          this.preloadRoute(nextRoute, 'low');
        }, config.preloadDelay || 150);
      });
    }
  }

  /**
   * Smart preloading based on user interaction patterns
   */
  handleUserInteraction(element: Element, targetRoute?: string): void {
    if (!targetRoute) return;

    // Preload on hover with debounce
    let hoverTimeout: NodeJS.Timeout;

    element.addEventListener('mouseenter', () => {
      hoverTimeout = setTimeout(() => {
        this.preloadRoute(targetRoute, 'high');
      }, 100);
    });

    element.addEventListener('mouseleave', () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    });

    // Preload on focus (keyboard navigation)
    element.addEventListener('focus', () => {
      this.preloadRoute(targetRoute, 'high');
    });

    // High priority preload on touchdown/mousedown
    element.addEventListener(
      'touchstart',
      () => {
        this.preloadRoute(targetRoute, 'high');
      },
      { passive: true }
    );

    element.addEventListener('mousedown', () => {
      this.preloadRoute(targetRoute, 'high');
    });
  }
}

/**
 * Performance budget checker for route loading
 */
export class RoutePerformanceBudget {
  private budgets = {
    '/': { ttfb: 200, fcp: 800, lcp: 1200 },
    '/projects': { ttfb: 300, fcp: 1000, lcp: 1500 },
    '/resume': { ttfb: 300, fcp: 1200, lcp: 1800 },
  };

  checkBudget(
    route: string,
    metrics: Record<string, number>
  ): {
    passed: boolean;
    violations: string[];
  } {
    const budget = this.budgets[route as keyof typeof this.budgets];
    if (!budget) {
      return { passed: true, violations: [] };
    }

    const violations: string[] = [];

    if (metrics.ttfb > budget.ttfb) {
      violations.push(`TTFB: ${metrics.ttfb}ms > ${budget.ttfb}ms`);
    }

    if (metrics.fcp > budget.fcp) {
      violations.push(`FCP: ${metrics.fcp}ms > ${budget.fcp}ms`);
    }

    if (metrics.lcp > budget.lcp) {
      violations.push(`LCP: ${metrics.lcp}ms > ${budget.lcp}ms`);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  reportViolations(route: string, violations: string[]): void {
    if (violations.length > 0) {
      console.warn(`Performance budget violations for ${route}:`, violations);

      // Report to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'performance_budget_violation', {
          route,
          violations: violations.join(', '),
        });
      }
    }
  }
}

/**
 * Route transition optimizer
 */
export class RouteTransitionOptimizer {
  private transitionStartTime = 0;

  startTransition(fromRoute: string, toRoute: string): void {
    this.transitionStartTime = performance.now();

    // Start preloading destination route assets
    const config = getRoutePreloadConfig(toRoute);
    if (config.preloadComponents) {
      // Preload components for smoother transition
      config.preloadComponents.forEach(async (componentName) => {
        try {
          switch (componentName) {
            case 'ProjectSlideshow':
              await import('../components/project-slideshow');
              break;
            case 'ResumeCharts':
              await import('../components/resume/resume-charts');
              break;
            // Add other components as needed
          }
        } catch (error) {
          console.warn(`Failed to preload component during transition:`, error);
        }
      });
    }
  }

  endTransition(toRoute: string): void {
    const transitionTime = performance.now() - this.transitionStartTime;

    console.log(
      `Route transition to ${toRoute} completed in ${transitionTime}ms`
    );

    // Track transition performance
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'route_transition', {
        to_route: toRoute,
        duration: transitionTime,
      });
    }
  }
}
