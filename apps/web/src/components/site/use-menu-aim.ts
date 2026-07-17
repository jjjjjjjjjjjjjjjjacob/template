import {
  type FocusEventHandler,
  type MouseEventHandler,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * "Safe triangle" hover intent, à la Amazon's mega-dropdown (and Ben Kamens'
 * jquery-menu-aim). The project index sits on the left; the focused project's
 * detail panel sits on the right. Hovering a row normally activates it, but if
 * the cursor is travelling *diagonally toward the detail panel* — clipping rows
 * on the way — we must NOT switch the focus to those passed-over rows.
 *
 * Each pointer move we compare the slopes from the cursor to the panel's near
 * (left) edge corners against the slopes from the previous cursor position. If
 * the cone to those corners is narrowing, the user is aiming at the panel, so
 * we defer activation and re-check shortly. Activation only commits once the
 * cursor settles over a row (motion goes stale) while still inside the index.
 */

const RECHECK_MS = 65; // re-evaluate cadence while the cursor is "aiming"
const STALL_MS = 60; // motion older than this counts as "stopped"
const EDGE_BUFFER = 12; // px slack above/below the panel's edge corners

interface Loc {
  x: number;
  y: number;
  t: number;
}

interface RowHandlers {
  onMouseEnter: MouseEventHandler;
  onFocus: FocusEventHandler;
  onClick: MouseEventHandler;
}

export interface MenuAim {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  /** Attach to the detail panel — its left edge forms the safe triangle. */
  panelRef: RefObject<HTMLElement | null>;
  /** Spread on the index/list container. */
  navProps: { onMouseLeave: MouseEventHandler };
  /** Returns the hover/focus/click handlers for the row at `index`. */
  getRowProps: (index: number) => RowHandlers;
}

const slope = (a: Loc, b: Loc) => (b.y - a.y) / (b.x - a.x);

export function useMenuAim(initialIndex = 0): MenuAim {
  const [activeIndex, setActiveIndexState] = useState(initialIndex);

  const panelRef = useRef<HTMLElement | null>(null);
  const locsRef = useRef<Loc[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredIndexRef = useRef(initialIndex);
  const navOverRef = useRef(false);

  // Record a short trail of pointer positions to derive direction.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const locs = locsRef.current;
      locs.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (locs.length > 3) locs.shift();
    };
    document.addEventListener('pointermove', onMove);
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setActiveIndex = useCallback(
    (index: number) => {
      clearTimer();
      hoveredIndexRef.current = index;
      setActiveIndexState(index);
    },
    [clearTimer]
  );

  // Is the cursor currently travelling toward the detail panel?
  const isAiming = useCallback(() => {
    const panel = panelRef.current;
    const locs = locsRef.current;
    if (!panel || locs.length < 2) return false;

    const loc = locs[locs.length - 1];
    const prev = locs[locs.length - 2];

    // Motion has stalled — the user has settled; commit to the hovered row.
    if (performance.now() - loc.t > STALL_MS) return false;

    const rect = panel.getBoundingClientRect();
    // The triangle only makes sense while the cursor is left of the panel.
    if (loc.x >= rect.left) return false;

    const upper: Loc = { x: rect.left, y: rect.top - EDGE_BUFFER, t: 0 };
    const lower: Loc = { x: rect.left, y: rect.bottom + EDGE_BUFFER, t: 0 };

    // Heading toward the panel ⇒ the cone to its corners is tightening.
    return (
      slope(loc, upper) < slope(prev, upper) &&
      slope(loc, lower) > slope(prev, lower)
    );
  }, []);

  // Commit, or wait, depending on whether the cursor is aiming at the panel.
  const tryActivate = useCallback(() => {
    clearTimer();
    if (isAiming()) {
      timeoutRef.current = setTimeout(tryActivate, RECHECK_MS);
      return;
    }
    // Only switch if the cursor is still inside the index. If it has crossed
    // into the panel, the focused project stays put — that's the whole point.
    if (navOverRef.current) {
      setActiveIndexState(hoveredIndexRef.current);
    }
  }, [clearTimer, isAiming]);

  const getRowProps = useCallback(
    (index: number): RowHandlers => ({
      onMouseEnter: () => {
        navOverRef.current = true;
        hoveredIndexRef.current = index;
        tryActivate();
      },
      // Keyboard and pointer taps are unambiguous — activate immediately.
      onFocus: () => setActiveIndex(index),
      onClick: () => setActiveIndex(index),
    }),
    [setActiveIndex, tryActivate]
  );

  const navProps = {
    onMouseLeave: useCallback<MouseEventHandler>(() => {
      navOverRef.current = false;
      clearTimer();
    }, [clearTimer]),
  };

  useEffect(() => clearTimer, [clearTimer]);

  return { activeIndex, setActiveIndex, panelRef, navProps, getRowProps };
}
