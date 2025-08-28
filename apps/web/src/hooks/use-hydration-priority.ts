import * as React from 'react';

export type HydrationPriority = 'critical' | 'high' | 'low';

interface HydrationState {
  isHydrating: boolean;
  isHydrated: boolean;
  error: Error | null;
}

interface UseHydrationPriorityOptions {
  priority?: HydrationPriority;
  delay?: number;
  timeout?: number;
  disabled?: boolean;
}

export function useHydrationPriority({
  priority = 'high',
  delay = 0,
  timeout = 10000,
  disabled = false,
}: UseHydrationPriorityOptions = {}) {
  const [state, setState] = React.useState<HydrationState>({
    isHydrating: false,
    isHydrated: false,
    error: null,
  });

  const [isClient, setIsClient] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = React.useRef<AbortController | undefined>(
    undefined
  );

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const startHydration = React.useCallback(() => {
    if (disabled || state.isHydrated || state.isHydrating) {
      return;
    }

    if (typeof AbortController !== 'undefined') {
      abortControllerRef.current = new AbortController();
    }

    setState((prev) => ({ ...prev, isHydrating: true, error: null }));

    const hydrateWithTransition = () => {
      if (React.startTransition) {
        React.startTransition(() => {
          setState((prev) => ({
            ...prev,
            isHydrating: false,
            isHydrated: true,
          }));
        });
      } else {
        setState((prev) => ({
          ...prev,
          isHydrating: false,
          isHydrated: true,
        }));
      }
    };

    const scheduleHydration = () => {
      if (abortControllerRef.current?.signal.aborted) return;

      switch (priority) {
        case 'critical':
          if (delay > 0) {
            timeoutRef.current = setTimeout(hydrateWithTransition, delay);
          } else {
            hydrateWithTransition();
          }
          break;

        case 'high':
          timeoutRef.current = setTimeout(hydrateWithTransition, delay);
          break;

        case 'low':
          if (
            typeof window !== 'undefined' &&
            'requestIdleCallback' in window
          ) {
            window.requestIdleCallback(
              () => {
                if (abortControllerRef.current?.signal.aborted) return;
                if (delay > 0) {
                  timeoutRef.current = setTimeout(hydrateWithTransition, delay);
                } else {
                  hydrateWithTransition();
                }
              },
              { timeout: Math.min(timeout, 5000) }
            );
          } else {
            const lowPriorityDelay = Math.max(delay, 100);
            timeoutRef.current = setTimeout(
              hydrateWithTransition,
              lowPriorityDelay
            );
          }
          break;
      }
    };

    try {
      scheduleHydration();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isHydrating: false,
        error: error instanceof Error ? error : new Error('Hydration failed'),
      }));
    }

    if (timeout > 0) {
      const timeoutId = setTimeout(() => {
        if (!abortControllerRef.current?.signal.aborted && state.isHydrating) {
          setState((prev) => ({
            ...prev,
            isHydrating: false,
            error: new Error(`Hydration timeout after ${timeout}ms`),
          }));
        }
      }, timeout);

      return () => clearTimeout(timeoutId);
    }
  }, [priority, delay, timeout, disabled, state.isHydrated, state.isHydrating]);

  const cancelHydration = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isHydrating: false,
      error: new Error('Hydration cancelled'),
    }));
  }, []);

  const resetHydration = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      isHydrating: false,
      isHydrated: false,
      error: null,
    });
  }, []);

  React.useEffect(() => {
    if (isClient && !disabled) {
      startHydration();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isClient, disabled, startHydration]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    isClient,
    startHydration,
    cancelHydration,
    resetHydration,
    canHydrate: isClient && !disabled,
  };
}

export function useIntersectionHydration(
  options: UseHydrationPriorityOptions & {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
) {
  const elementRef = React.useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  const hydration = useHydrationPriority({
    ...options,
    disabled: options.disabled || !isIntersecting,
  });

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || !hydration.canHydrate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const { isIntersecting: intersecting } = entry;
        setIsIntersecting(intersecting);

        if (intersecting && options.triggerOnce !== false) {
          observer.unobserve(element);
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '50px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [
    hydration.canHydrate,
    options.threshold,
    options.rootMargin,
    options.triggerOnce,
  ]);

  return {
    ...hydration,
    elementRef,
    isIntersecting,
  };
}
