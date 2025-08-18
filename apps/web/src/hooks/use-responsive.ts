import { useMediaQuery } from './use-media-query';

/**
 * Breakpoint configuration for consistent responsive design
 */
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook for comprehensive responsive state management
 *
 * @returns object with responsive state indicators
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
 *
 * return (
 *   <div>
 *     <p>current breakpoint: {breakpoint}</p>
 *     {isMobile && <MobileComponent />}
 *     {isTablet && <TabletComponent />}
 *     {isDesktop && <DesktopComponent />}
 *   </div>
 * );
 * ```
 */
export function useResponsive() {
  const isXs = useMediaQuery(`(max-width: ${BREAKPOINTS.xs - 1}px)`);
  const isSm = useMediaQuery(
    `(min-width: ${BREAKPOINTS.xs}px) and (max-width: ${BREAKPOINTS.sm - 1}px)`
  );
  const isMd = useMediaQuery(
    `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`
  );
  const isLg = useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  );
  const isXl = useMediaQuery(
    `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`
  );
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);

  // Device categories
  const isMobile = isXs || isSm;
  const isTablet = isMd || isLg;
  const isDesktop = isXl || is2xl;

  // Determine current breakpoint
  let breakpoint: Breakpoint = '2xl';
  if (isXs) breakpoint = 'xs';
  else if (isSm) breakpoint = 'sm';
  else if (isMd) breakpoint = 'md';
  else if (isLg) breakpoint = 'lg';
  else if (isXl) breakpoint = 'xl';

  return {
    // Individual breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,

    // Device categories
    isMobile,
    isTablet,
    isDesktop,

    // Current breakpoint
    breakpoint,

    // Utility functions
    isBreakpoint: (bp: Breakpoint) => breakpoint === bp,
    isBreakpointUp: (bp: Breakpoint) =>
      BREAKPOINTS[breakpoint] >= BREAKPOINTS[bp],
    isBreakpointDown: (bp: Breakpoint) =>
      BREAKPOINTS[breakpoint] <= BREAKPOINTS[bp],
  };
}

/**
 * Hook to check if viewport is at or above a specific breakpoint
 */
export function useBreakpointUp(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

/**
 * Hook to check if viewport is at or below a specific breakpoint
 */
export function useBreakpointDown(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
}

/**
 * Hook to check if viewport is within a specific breakpoint range
 */
export function useBreakpointBetween(
  min: Breakpoint,
  max: Breakpoint
): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS[min]}px) and (max-width: ${BREAKPOINTS[max] - 1}px)`
  );
}
