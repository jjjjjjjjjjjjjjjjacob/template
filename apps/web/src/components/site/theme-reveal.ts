/* site · circular theme reveal.
   A self-contained port of the View Transitions reveal from the sibling repo
   `../the-new-modern` (`app/_components/theme-mode.ts`), scoped to site so it
   never introduces a global pattern. The visible swap is a `clip-path: circle()`
   that grows from the toggle outward to the far viewport corner, in three eased
   stages (overshoot → settle → expand). The matching CSS lives in site.css,
   keyed on the `site-theme-transitioning-circle` class added to <html> below. */

export interface ThemeRevealOrigin {
  x: number;
  y: number;
}

/* Stage radii (px) for the overshoot/settle beats. Total duration (680ms) is in
   the CSS animation; keep the two in sync. */
const STAGE_ONE_RADIUS_PX = 160;
const STAGE_ONE_OVERSHOOT_RADIUS_PX = 176;
/* Stable site-prefixed names keep the transition isolated from app chrome. */
const TRANSITIONING_CLASS = 'site-theme-transitioning';
const CIRCLE_CLASS = 'site-theme-transitioning-circle';
const KEYFRAMES_NAME = 'site-theme-expand-circle';

/** `startViewTransition` isn't in every TS lib target — declare what we use. */
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function shouldReduceThemeMotion(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Final reveal radius = the farthest viewport corner from the origin. */
export function getThemeRevealRadius(
  origin: ThemeRevealOrigin,
  width = typeof window === 'undefined' ? 0 : Math.max(window.innerWidth, 0),
  height = typeof window === 'undefined' ? 0 : Math.max(window.innerHeight, 0)
): number {
  return Math.max(
    Math.hypot(origin.x, origin.y),
    Math.hypot(width - origin.x, origin.y),
    Math.hypot(origin.x, height - origin.y),
    Math.hypot(width - origin.x, height - origin.y)
  );
}

/** Inject the origin-specific expand keyframes; returns a cleanup that removes them. */
function injectThemeRevealKeyframes(
  origin: ThemeRevealOrigin,
  finalRadius: number
): () => void {
  const style = document.createElement('style');
  style.setAttribute('data-site-theme-reveal', '');
  const { x, y } = origin;
  style.textContent = `@keyframes ${KEYFRAMES_NAME}{0%{clip-path:circle(0px at ${x}px ${y}px);animation-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)}38%{clip-path:circle(${STAGE_ONE_OVERSHOOT_RADIUS_PX}px at ${x}px ${y}px);animation-timing-function:cubic-bezier(0.33,1,0.68,1)}48%{clip-path:circle(${STAGE_ONE_RADIUS_PX}px at ${x}px ${y}px);animation-timing-function:cubic-bezier(0.22,1,0.36,1)}100%{clip-path:circle(${Math.ceil(finalRadius)}px at ${x}px ${y}px)}}`;
  document.head.appendChild(style);
  return () => style.remove();
}

/** Drop transitions for two frames so the instant (no-animation) swap is clean. */
function suppressTransitions(root: HTMLElement): void {
  root.classList.add(TRANSITIONING_CLASS);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove(TRANSITIONING_CLASS);
    });
  });
}

/**
 * Run `commit` (the actual theme flip) inside a circular View Transition. Falls
 * back to an instant, un-animated swap when the user prefers reduced motion or
 * the browser lacks the View Transitions API. SSR-safe.
 *
 * `commit` must apply the theme synchronously (e.g. `flushSync(() => setTheme)`)
 * so the API's "new" snapshot captures the new palette.
 */
export function transitionTheme({
  commit,
  origin,
}: {
  commit: () => void;
  origin: ThemeRevealOrigin;
}): void {
  if (typeof document === 'undefined') {
    commit();
    return;
  }

  const root = document.documentElement;
  const doc = document as ViewTransitionDocument;
  const startViewTransition = doc.startViewTransition;

  if (shouldReduceThemeMotion() || typeof startViewTransition !== 'function') {
    suppressTransitions(root);
    commit();
    return;
  }

  const cleanupKeyframes = injectThemeRevealKeyframes(
    origin,
    getThemeRevealRadius(origin)
  );
  root.classList.add(TRANSITIONING_CLASS, CIRCLE_CLASS);

  const cleanup = () => {
    root.classList.remove(TRANSITIONING_CLASS, CIRCLE_CLASS);
    cleanupKeyframes();
  };

  try {
    const transition = startViewTransition.call(doc, () => {
      commit();
    });
    transition.finished.finally(cleanup);
  } catch {
    commit();
    cleanup();
  }
}
