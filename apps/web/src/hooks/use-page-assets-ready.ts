import { useEffect, useMemo, useState } from 'react';
import { useFontLoading } from '@/lib/font-loading-strategy';

export function usePageAssetsReady() {
  const { isLoaded: fontsLoadedFromHook } = useFontLoading();
  const [pageLoaded, setPageLoaded] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);
  const [fontsReadyFallback, setFontsReadyFallback] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const markLoaded = () => setPageLoaded(true);

    if (document.readyState === 'complete') {
      setPageLoaded(true);
    } else {
      window.addEventListener('load', markLoaded, { once: true });
    }

    return () => {
      window.removeEventListener('load', markLoaded);
    };
  }, []);

  // Fallback: consider fonts ready when document.fonts.ready resolves or CSS class is present
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkClass = () => {
      if (document.documentElement.classList.contains('fonts-loaded')) {
        setFontsReadyFallback(true);
      }
    };

    checkClass();

    // Use Font Loading API if available
    if ('fonts' in document) {
      // @ts-expect-error - fonts exists in modern browsers
      (document as any).fonts?.ready?.then?.(() => setFontsReadyFallback(true));
    }

    // Observe class changes as a safety net
    const observer = new MutationObserver(checkClass);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const assetsReady = useMemo(() => {
    const fontsReady = fontsLoadedFromHook || fontsReadyFallback;
    return pageLoaded && fontsReady && particlesReady;
  }, [pageLoaded, fontsLoadedFromHook, fontsReadyFallback, particlesReady]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (assetsReady) {
      root.classList.add('assets-ready');
      root.classList.remove('assets-loading');
    } else {
      root.classList.add('assets-loading');
      root.classList.remove('assets-ready');
    }
  }, [assetsReady]);

  const markParticlesReady = () => setParticlesReady(true);

  return { assetsReady, markParticlesReady };
}


