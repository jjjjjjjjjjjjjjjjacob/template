/**
 * Progressive Font Loading Strategy
 * Implements hybrid font loading with preloading, fallbacks, and performance monitoring
 */

import { useEffect, useState } from 'react';

interface FontLoadingOptions {
  enablePreload?: boolean;
  enableProgressiveLoading?: boolean;
  enablePerformanceMonitoring?: boolean;
  fallbackTimeout?: number;
}

interface FontMetrics {
  loadTime: number;
  fontFamily: string;
  success: boolean;
  fallbackUsed: boolean;
}

class FontLoadingManager {
  private fonts: Map<string, FontMetrics> = new Map();
  private options: Required<FontLoadingOptions>;
  private loadingPromises: Map<string, Promise<void>> = new Map();

  constructor(options: FontLoadingOptions = {}) {
    this.options = {
      enablePreload: true,
      enableProgressiveLoading: true,
      enablePerformanceMonitoring: true,
      fallbackTimeout: 3000,
      ...options,
    };
  }

  /**
   * Initialize font loading strategy
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Add font loading class to document
    document.documentElement.classList.add('font-loading');

    // Set up font loading detection
    if ('fonts' in document) {
      this.setupFontLoadingDetection();
    }

    // Enable progressive loading if supported
    if (this.options.enableProgressiveLoading) {
      this.setupProgressiveLoading();
    }

    // Monitor performance if enabled
    if (this.options.enablePerformanceMonitoring) {
      this.monitorFontPerformance();
    }
  }

  /**
   * Preload critical fonts
   */
  preloadCriticalFonts(): void {
    if (!this.options.enablePreload || typeof document === 'undefined') return;

    const criticalFonts = [
      '/fonts/optimized/GeistSans-Variable.woff2',
      '/fonts/optimized/noto-color-emoji-core.woff2',
    ];

    criticalFonts.forEach((fontUrl) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Load font with fallback strategy
   */
  async loadFont(fontFamily: string, fontUrl?: string): Promise<void> {
    if (this.loadingPromises.has(fontFamily)) {
      return this.loadingPromises.get(fontFamily);
    }

    const startTime = performance.now();

    const loadPromise = new Promise<void>((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      // Check if font is already loaded
      if (document.fonts && document.fonts.check(`12px "${fontFamily}"`)) {
        this.recordFontMetrics(fontFamily, startTime, true, false);
        resolve();
        return;
      }

      // Set up timeout for fallback
      const timeout = setTimeout(() => {
        this.recordFontMetrics(fontFamily, startTime, false, true);
        console.warn(`Font ${fontFamily} loading timeout, using fallback`);
        resolve(); // Don't reject, just use fallback
      }, this.options.fallbackTimeout);

      // Try to load font using Font Loading API
      if (document.fonts && fontUrl) {
        const font = new FontFace(fontFamily, `url(${fontUrl})`);
        font
          .load()
          .then(() => {
            document.fonts.add(font);
            clearTimeout(timeout);
            this.recordFontMetrics(fontFamily, startTime, true, false);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            console.warn(`Failed to load font ${fontFamily}:`, error);
            this.recordFontMetrics(fontFamily, startTime, false, true);
            resolve(); // Don't reject, just use fallback
          });
      } else {
        // Fallback to CSS-based loading detection
        this.detectFontLoadingCSS(fontFamily, timeout, startTime, resolve);
      }
    });

    this.loadingPromises.set(fontFamily, loadPromise);
    return loadPromise;
  }

  /**
   * Get font loading metrics
   */
  getMetrics(): FontMetrics[] {
    return Array.from(this.fonts.values());
  }

  /**
   * Check if all critical fonts are loaded
   */
  areCriticalFontsLoaded(): boolean {
    const criticalFonts = ['GeistSans', 'NotoColorEmoji'];
    return criticalFonts.every((font) => {
      const metrics = this.fonts.get(font);
      return metrics?.success || metrics?.fallbackUsed;
    });
  }

  private setupFontLoadingDetection(): void {
    if (!document.fonts) return;

    document.fonts.ready.then(() => {
      document.documentElement.classList.remove('font-loading');
      document.documentElement.classList.add('fonts-loaded');

      if (this.options.enablePerformanceMonitoring) {
        this.reportFontLoadingComplete();
      }
    });

    // Monitor individual font loads
    document.fonts.addEventListener('loadingdone', (event) => {
      const fontFaces = event.fontfaces;
      fontFaces.forEach((fontFace) => {
        console.log(`Font loaded: ${fontFace.family}`);
      });
    });

    document.fonts.addEventListener('loadingerror', (event) => {
      const fontFaces = event.fontfaces;
      fontFaces.forEach((fontFace) => {
        console.warn(`Font failed to load: ${fontFace.family}`);
      });
    });
  }

  private setupProgressiveLoading(): void {
    // Load fonts in order of priority
    const fontLoadingQueue = [
      { name: 'GeistSans', url: '/fonts/optimized/GeistSans-Variable.woff2' },
      {
        name: 'NotoColorEmoji',
        url: '/fonts/optimized/noto-color-emoji-core.woff2',
      },
      { name: 'GeistMono', url: '/fonts/optimized/GeistMono-Variable.woff2' },
      {
        name: 'Doto',
        url: '/fonts/optimized/Doto-VariableFont_ROND,wght.woff2',
      },
    ];

    // Load high-priority fonts immediately
    this.loadFont(fontLoadingQueue[0].name, fontLoadingQueue[0].url);
    this.loadFont(fontLoadingQueue[1].name, fontLoadingQueue[1].url);

    // Load lower priority fonts after a delay
    setTimeout(() => {
      fontLoadingQueue.slice(2).forEach((font) => {
        this.loadFont(font.name, font.url);
      });
    }, 1000);
  }

  private detectFontLoadingCSS(
    fontFamily: string,
    timeout: NodeJS.Timeout,
    startTime: number,
    resolve: () => void
  ): void {
    // Create test elements to detect font loading
    const testString = 'giItT1WQy@!-/#';
    const fallbackFont = 'monospace';
    const testFontSize = '100px';

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      clearTimeout(timeout);
      resolve();
      return;
    }

    // Measure fallback font
    context.font = `${testFontSize} ${fallbackFont}`;
    const fallbackWidth = context.measureText(testString).width;

    // Measure target font with fallback
    context.font = `${testFontSize} ${fontFamily}, ${fallbackFont}`;

    const checkFont = () => {
      const targetWidth = context.measureText(testString).width;

      if (targetWidth !== fallbackWidth) {
        // Font has loaded
        clearTimeout(timeout);
        this.recordFontMetrics(fontFamily, startTime, true, false);
        resolve();
      } else {
        // Check again
        requestAnimationFrame(checkFont);
      }
    };

    checkFont();
  }

  private recordFontMetrics(
    fontFamily: string,
    startTime: number,
    success: boolean,
    fallbackUsed: boolean
  ): void {
    const loadTime = performance.now() - startTime;

    this.fonts.set(fontFamily, {
      loadTime,
      fontFamily,
      success,
      fallbackUsed,
    });

    if (this.options.enablePerformanceMonitoring) {
      // Report to analytics if available
      if (typeof window !== 'undefined' && 'posthog' in window) {
        (window as any).posthog?.capture('font_loaded', {
          font_family: fontFamily,
          load_time: loadTime,
          success,
          fallback_used: fallbackUsed,
        });
      }
    }
  }

  private monitorFontPerformance(): void {
    if (typeof window === 'undefined') return;

    // Monitor Cumulative Layout Shift caused by font loading
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (
              entry.entryType === 'layout-shift' &&
              !(entry as any).hadRecentInput
            ) {
              // Check if layout shift might be caused by font loading
              const fontLoadingShift = (entry as any).value;
              if (fontLoadingShift > 0.1) {
                console.warn(
                  'Potential font-related layout shift detected:',
                  fontLoadingShift
                );
              }
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Could not monitor layout shifts:', error);
      }
    }
  }

  private reportFontLoadingComplete(): void {
    const metrics = this.getMetrics();
    const totalLoadTime = Math.max(...metrics.map((m) => m.loadTime));
    const failedFonts = metrics.filter((m) => !m.success);

    console.log('Font loading complete:', {
      totalLoadTime,
      loadedFonts: metrics.length,
      failedFonts: failedFonts.length,
      metrics,
    });

    // Report to analytics
    if (typeof window !== 'undefined' && 'posthog' in window) {
      (window as any).posthog?.capture('font_loading_complete', {
        total_load_time: totalLoadTime,
        loaded_fonts: metrics.length,
        failed_fonts: failedFonts.length,
        critical_fonts_loaded: this.areCriticalFontsLoaded(),
      });
    }
  }
}

// Export singleton instance
export const fontLoadingManager = new FontLoadingManager();

// Utility function to initialize font loading
export function initializeFontLoading(options?: FontLoadingOptions): void {
  const manager = new FontLoadingManager(options);
  manager.init();
  manager.preloadCriticalFonts();
}

// React hook for font loading status
export function useFontLoading() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [metrics, setMetrics] = useState<FontMetrics[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkFontStatus = () => {
      const loaded = fontLoadingManager.areCriticalFontsLoaded();
      setIsLoaded(loaded);
      setMetrics(fontLoadingManager.getMetrics());
    };

    // Check immediately
    checkFontStatus();

    // Set up periodic checks
    const interval = setInterval(checkFontStatus, 100);

    // Clean up
    const timeout = setTimeout(() => {
      clearInterval(interval);
      checkFontStatus(); // Final check
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return { isLoaded, metrics };
}

export type { FontLoadingOptions, FontMetrics };
