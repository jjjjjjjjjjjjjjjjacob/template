import { useMediaQuery } from './use-media-query';

/**
 * Hook to detect mobile devices using responsive breakpoints
 *
 * @param breakpoint - Custom breakpoint to use (default: 768px)
 * @returns boolean indicating if the current viewport is mobile-sized
 *
 * @example
 * ```tsx
 * const isMobile = useMobile();
 * const isSmallMobile = useMobile(480);
 *
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 * ```
 */
export function useMobile(breakpoint: number = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

/**
 * Hook to detect if the device is mobile in portrait orientation
 */
export function useMobilePortrait(): boolean {
  return useMediaQuery('(max-width: 767px) and (orientation: portrait)');
}

/**
 * Hook to detect if the device is mobile in landscape orientation
 */
export function useMobileLandscape(): boolean {
  return useMediaQuery('(max-width: 767px) and (orientation: landscape)');
}
