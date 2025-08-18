/**
 * Font Preloader Component
 * Implements critical font preloading and progressive loading strategy
 */

import { useEffect } from 'react';
import {
  initializeFontLoading,
  useFontLoading,
} from '@/lib/font-loading-strategy';

interface FontPreloaderProps {
  enableProgressiveLoading?: boolean;
  enablePerformanceMonitoring?: boolean;
  children?: React.ReactNode;
}

export function FontPreloader({
  enableProgressiveLoading = true,
  enablePerformanceMonitoring = true,
  children,
}: FontPreloaderProps) {
  useEffect(() => {
    initializeFontLoading({
      enablePreload: true,
      enableProgressiveLoading,
      enablePerformanceMonitoring,
      fallbackTimeout: 3000,
    });
  }, [enableProgressiveLoading, enablePerformanceMonitoring]);

  return <>{children}</>;
}

/**
 * Font Loading Status Component
 * Shows font loading progress in development
 */
export function FontLoadingStatus() {
  const { isLoaded, metrics } = useFontLoading();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      className="fixed right-4 bottom-4 z-50 rounded-lg bg-black/80 p-3 font-mono text-xs text-white"
      style={{ fontFamily: 'ui-monospace, monospace' }}
    >
      <div>Fonts: {isLoaded ? '✅ Loaded' : '⏳ Loading...'}</div>
      {metrics.length > 0 && (
        <div className="mt-2 space-y-1">
          {metrics.map((metric) => (
            <div key={metric.fontFamily} className="flex justify-between gap-2">
              <span>{metric.fontFamily}:</span>
              <span>
                {metric.success ? '✅' : metric.fallbackUsed ? '⚠️' : '❌'}
                {metric.loadTime.toFixed(0)}ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Critical Font Preload Links
 * Generate preload links for critical fonts
 */
export function CriticalFontPreloads() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const preloadLinks = [
      {
        href: '/fonts/optimized/GeistSans-Variable.woff2',
        type: 'font/woff2',
      },
      {
        href: '/fonts/optimized/noto-color-emoji-core.woff2',
        type: 'font/woff2',
      },
    ];

    preloadLinks.forEach(({ href, type }) => {
      // Check if preload link already exists
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = 'font';
        link.type = type;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, []);

  return null;
}

/**
 * Font Loading Optimization Hook
 * Provides utilities for optimizing font loading in components
 */
export function useFontOptimization() {
  const { isLoaded, metrics } = useFontLoading();

  const getFontClass = (
    priority: 'critical' | 'normal' | 'lazy' = 'normal'
  ) => {
    if (!isLoaded && priority === 'critical') {
      return 'font-loading text-fallback';
    }
    if (isLoaded) {
      return 'fonts-loaded';
    }
    return 'font-loading';
  };

  const shouldShowFallback = (fontFamily: string) => {
    const metric = metrics.find((m) => m.fontFamily === fontFamily);
    return !metric?.success && !metric?.fallbackUsed;
  };

  const getFontLoadTime = (fontFamily: string) => {
    const metric = metrics.find((m) => m.fontFamily === fontFamily);
    return metric?.loadTime || 0;
  };

  return {
    isLoaded,
    metrics,
    getFontClass,
    shouldShowFallback,
    getFontLoadTime,
  };
}
