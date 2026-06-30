import { useEffect } from 'react';

const SETTLE_MS = 2000;
const STABLE_FRAMES = 10;
const DRIFT_PX = 4;
const GLIDE_INTERVAL_MS = 100;
const NAV_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
];

/**
 * Aligns the viewport to the URL hash target while the page is still settling
 * (font swaps reflowing text, the particle field mounting, animated sections).
 *
 * Visit/refresh (the browser has already jumped to the anchor) is held in place
 * with *instant* scrolls so reflow above the fold is absorbed without any
 * visible motion. In-page clicks keep a smooth scroll and only re-issue it when
 * reflow actually moves the target, which retargets the in-progress smooth
 * scroll rather than animating a second correction (no "jerk"). Both bail the
 * moment the user scrolls.
 */
export function useHashScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let rafId = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let restoreScrollBehavior: (() => void) | null = null;
    let interrupted = false;

    const getTargetId = () =>
      decodeURIComponent(window.location.hash.replace(/^#/, ''));

    const measureTop = (id: string) => {
      const element = document.getElementById(id);
      if (!element) return null;
      return Math.max(0, element.getBoundingClientRect().top + window.scrollY);
    };

    function handleUserInput() {
      interrupted = true;
      teardown();
    }

    function handleKeydown(event: KeyboardEvent) {
      if (NAV_KEYS.includes(event.key)) handleUserInput();
    }

    function teardown() {
      if (rafId) cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      rafId = 0;
      intervalId = null;
      timeoutId = null;
      if (restoreScrollBehavior) {
        restoreScrollBehavior();
        restoreScrollBehavior = null;
      }
      window.removeEventListener('wheel', handleUserInput);
      window.removeEventListener('touchmove', handleUserInput);
      window.removeEventListener('keydown', handleKeydown);
    }

    function listen() {
      window.addEventListener('wheel', handleUserInput, { passive: true });
      window.addEventListener('touchmove', handleUserInput, { passive: true });
      window.addEventListener('keydown', handleKeydown);
    }

    function lock(id: string) {
      teardown();
      interrupted = false;
      listen();

      // Force instant scrolling in every browser (avoids the CSS smooth-scroll
      // re-introducing an animated correction, i.e. the "jerk").
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      restoreScrollBehavior = () => {
        root.style.scrollBehavior = previous;
      };

      const startTime = performance.now();
      let stable = 0;

      const frame = () => {
        if (interrupted) return;
        const top = measureTop(id);
        if (top !== null) {
          if (Math.abs(window.scrollY - top) > 1) {
            window.scrollTo({ top });
            stable = 0;
          } else {
            stable += 1;
          }
        }
        if (
          stable < STABLE_FRAMES &&
          performance.now() - startTime < SETTLE_MS
        ) {
          rafId = requestAnimationFrame(frame);
        } else {
          teardown();
        }
      };

      rafId = requestAnimationFrame(frame);
    }

    function glide(id: string) {
      teardown();
      interrupted = false;
      listen();

      const behavior: ScrollBehavior = reducedMotion ? 'instant' : 'smooth';
      const startTime = performance.now();
      let lastTarget = -1;

      const tick = () => {
        if (interrupted) return;
        const top = measureTop(id);
        if (
          top !== null &&
          (lastTarget < 0 || Math.abs(top - lastTarget) > DRIFT_PX)
        ) {
          lastTarget = top;
          window.scrollTo({ top, behavior });
        }
      };

      tick();
      intervalId = setInterval(() => {
        if (interrupted || performance.now() - startTime > SETTLE_MS) {
          teardown();
          return;
        }
        tick();
      }, GLIDE_INTERVAL_MS);
    }

    const handleHashChange = () => {
      const id = getTargetId();
      if (id && measureTop(id) !== null) glide(id);
    };

    window.addEventListener('hashchange', handleHashChange);

    if (getTargetId()) {
      rafId = requestAnimationFrame(() => {
        const id = getTargetId();
        if (id && measureTop(id) !== null) lock(id);
      });
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      teardown();
    };
  }, []);
}
