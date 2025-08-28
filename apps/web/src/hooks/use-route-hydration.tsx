import * as React from 'react';
import { useRouter, useMatches } from '@tanstack/react-router';
import {
  useHydrationPriority,
  type HydrationPriority,
} from './use-hydration-priority';

interface RouteHydrationConfig {
  priority: HydrationPriority;
  delay: number;
  components?: string[];
  timeout?: number;
}

type RouteHydrationStrategy = {
  [route: string]: RouteHydrationConfig;
};

const defaultHydrationStrategy: RouteHydrationStrategy = {
  '/': {
    priority: 'critical',
    delay: 0,
    components: ['ParticleField', 'Header', 'Navigation'],
  },
  '/projects': {
    priority: 'high',
    delay: 100,
    components: ['ProjectSlideshow', 'ProjectGrid'],
  },
  '/resume': {
    priority: 'high',
    delay: 150,
    components: ['ResumeFilter', 'WorkExperience'],
  },
  '*': {
    priority: 'low',
    delay: 500,
    timeout: 8000,
  },
};

interface UseRouteHydrationOptions {
  strategy?: RouteHydrationStrategy;
  componentName?: string;
  disabled?: boolean;
  forceStrategy?: RouteHydrationConfig;
}

export function useRouteHydration({
  strategy = defaultHydrationStrategy,
  componentName,
  disabled = false,
  forceStrategy,
}: UseRouteHydrationOptions = {}) {
  const router = useRouter();
  const matches = useMatches();

  const currentRoute = React.useMemo(() => {
    const lastMatch = matches[matches.length - 1];
    return lastMatch?.pathname || '/';
  }, [matches]);

  const routeConfig = React.useMemo(() => {
    if (forceStrategy) return forceStrategy;

    const config = strategy[currentRoute] || strategy['*'];

    if (!config) {
      return {
        priority: 'high' as HydrationPriority,
        delay: 200,
        timeout: 5000,
      };
    }

    return config;
  }, [strategy, currentRoute, forceStrategy]);

  const shouldHydrate = React.useMemo(() => {
    if (disabled) return false;

    if (!componentName) return true;

    if (routeConfig.components) {
      return routeConfig.components.includes(componentName);
    }

    return true;
  }, [disabled, componentName, routeConfig.components]);

  const hydration = useHydrationPriority({
    priority: routeConfig.priority,
    delay: routeConfig.delay,
    timeout: routeConfig.timeout,
    disabled: !shouldHydrate,
  });

  const routeTransition = React.useMemo(() => {
    const isNavigating = router.state.isTransitioning || router.state.isLoading;
    return {
      isNavigating,
      pendingLocation: router.state.location.href,
    };
  }, [router.state]);

  React.useEffect(() => {
    if (routeTransition.isNavigating && hydration.isHydrated) {
      hydration.resetHydration();
    }
  }, [routeTransition.isNavigating, hydration]);

  return {
    ...hydration,
    currentRoute,
    routeConfig,
    shouldHydrate,
    routeTransition,
  };
}

export function useComponentHydrationPriority(
  componentName: string,
  options: Omit<UseRouteHydrationOptions, 'componentName'> = {}
) {
  return useRouteHydration({
    ...options,
    componentName,
  });
}

export function useDeferredRouteComponent<T extends React.ComponentType<any>>(
  Component: T,
  options: {
    componentName?: string;
    fallback?: React.ComponentType<any>;
    strategy?: RouteHydrationConfig;
  } = {}
) {
  const { componentName = Component.displayName || Component.name } = options;

  const hydration = useRouteHydration({
    componentName,
    forceStrategy: options.strategy,
  });

  const DeferredComponent = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return React.forwardRef<any, any>((props, _ref) => {
      if (!hydration.isHydrated) {
        if (options.fallback) {
          const FallbackComponent = options.fallback;
          return <FallbackComponent {...props} />;
        }
        return null;
      }

      return React.createElement(Component, props);
    });
  }, [Component, hydration.isHydrated, options.fallback]);

  DeferredComponent.displayName = `DeferredRoute(${componentName})`;

  return {
    Component: DeferredComponent,
    ...hydration,
  };
}

export function withRouteHydration<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  options: {
    priority?: HydrationPriority;
    delay?: number;
    componentName?: string;
    fallback?: React.ComponentType<any>;
  } = {}
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const WrappedComponent = React.forwardRef<any, P>((props, _ref) => {
    const hydration = useRouteHydration({
      componentName:
        options.componentName || Component.displayName || Component.name,
      forceStrategy: {
        priority: options.priority || 'high',
        delay: options.delay || 100,
      },
    });

    if (!hydration.isHydrated) {
      if (options.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...(props as P)} />;
  });

  WrappedComponent.displayName = `withRouteHydration(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

export function useRoutePreloader() {
  const router = useRouter();

  const preloadRoute = React.useCallback(
    (to: string) => {
      router.preloadRoute({ to });
    },
    [router]
  );

  const preloadCurrentRouteAssets = React.useCallback(() => {
    const currentPath = router.state.location.pathname;
    const routeConfig =
      defaultHydrationStrategy[currentPath] || defaultHydrationStrategy['*'];

    if (routeConfig.components) {
      routeConfig.components.forEach((componentName) => {
        if (typeof window !== 'undefined') {
          const prefetchLinks = document.querySelectorAll(
            `link[rel="prefetch"][data-component="${componentName}"]`
          );
          prefetchLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href) {
              fetch(href, { mode: 'no-cors' }).catch(() => {});
            }
          });
        }
      });
    }
  }, [router]);

  return {
    preloadRoute,
    preloadCurrentRouteAssets,
    isPreloading: router.state.isLoading,
  };
}
