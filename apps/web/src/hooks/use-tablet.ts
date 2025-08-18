import { useMediaQuery } from './use-media-query';

/**
 * Hook to detect tablet devices using responsive breakpoints
 *
 * @param minBreakpoint - Minimum width for tablet (default: 768px)
 * @param maxBreakpoint - Maximum width for tablet (default: 1024px)
 * @returns boolean indicating if the current viewport is tablet-sized
 *
 * @example
 * ```tsx
 * const isTablet = useTablet();
 * const isLargeTablet = useTablet(768, 1200);
 *
 * return (
 *   <div>
 *     {isTablet ? <TabletLayout /> : <DefaultLayout />}
 *   </div>
 * );
 * ```
 */
export function useTablet(
  minBreakpoint: number = 768,
  maxBreakpoint: number = 1024
): boolean {
  return useMediaQuery(
    `(min-width: ${minBreakpoint}px) and (max-width: ${maxBreakpoint - 1}px)`
  );
}

/**
 * Hook to detect if the device is tablet in portrait orientation
 */
export function useTabletPortrait(): boolean {
  return useMediaQuery(
    '(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)'
  );
}

/**
 * Hook to detect if the device is tablet in landscape orientation
 */
export function useTabletLandscape(): boolean {
  return useMediaQuery(
    '(min-width: 768px) and (max-width: 1023px) and (orientation: landscape)'
  );
}

/**
 * Hook to detect if the device is desktop (larger than tablet)
 */
export function useDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
