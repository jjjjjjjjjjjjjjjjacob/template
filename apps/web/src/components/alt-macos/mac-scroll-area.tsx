import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { cn } from '@/utils/tailwind-utils';

interface MacScrollAreaProps {
  children: ReactNode;
  className?: string;
  orientation?: 'both' | 'vertical' | 'horizontal';
  reserveResizeCorner?: boolean;
  viewportClassName?: string;
  style?: CSSProperties;
  viewportStyle?: CSSProperties;
}

interface ScrollMetrics {
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

type ScrollAxis = 'vertical' | 'horizontal';

const SCROLLBAR_SIZE = 15;
const VERTICAL_SCROLLBAR_GUTTER_SIZE = SCROLLBAR_SIZE;
const VERTICAL_UP_BUTTON_SIZE = 21;
const VERTICAL_DOWN_BUTTON_SIZE = 17;
const VERTICAL_BUTTON_STACK_SIZE =
  VERTICAL_UP_BUTTON_SIZE + VERTICAL_DOWN_BUTTON_SIZE;
const MIN_THUMB_SIZE = 30;
const LINE_SCROLL = 34;
const VERTICAL_TRACK_TOP_INSET = 12;
const VERTICAL_TRACK_BOTTOM_INSET = 0;
const HORIZONTAL_RAIL_INSET = 4;

const INITIAL_METRICS: ScrollMetrics = {
  scrollTop: 0,
  scrollLeft: 0,
  clientWidth: 0,
  clientHeight: 0,
  scrollWidth: 0,
  scrollHeight: 0,
};

function metricsEqual(a: ScrollMetrics, b: ScrollMetrics) {
  return (
    a.scrollTop === b.scrollTop &&
    a.scrollLeft === b.scrollLeft &&
    a.clientWidth === b.clientWidth &&
    a.clientHeight === b.clientHeight &&
    a.scrollWidth === b.scrollWidth &&
    a.scrollHeight === b.scrollHeight
  );
}

function getMetrics(element: HTMLDivElement): ScrollMetrics {
  return {
    scrollTop: element.scrollTop,
    scrollLeft: element.scrollLeft,
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
  };
}

function getThumbSize(
  viewportSize: number,
  scrollSize: number,
  trackSize: number
) {
  if (scrollSize <= 0 || viewportSize <= 0 || trackSize <= 0) return 0;
  return Math.min(
    trackSize,
    Math.max(
      MIN_THUMB_SIZE,
      Math.round((viewportSize / scrollSize) * trackSize)
    )
  );
}

function getThumbOffset(
  scrollPosition: number,
  maxScroll: number,
  travel: number
) {
  if (maxScroll <= 0 || travel <= 0) return 0;
  return Math.round((scrollPosition / maxScroll) * travel);
}

export function MacScrollArea({
  children,
  className,
  orientation = 'both',
  reserveResizeCorner = false,
  viewportClassName,
  style,
  viewportStyle,
}: MacScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    axis: ScrollAxis;
    pointerId: number;
    startPointer: number;
    startScroll: number;
    maxScroll: number;
    trackTravel: number;
  } | null>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>(INITIAL_METRICS);

  const updateMetrics = useCallback(() => {
    const element = viewportRef.current;
    if (!element) return;

    const nextMetrics = getMetrics(element);
    setMetrics((currentMetrics) =>
      metricsEqual(currentMetrics, nextMetrics) ? currentMetrics : nextMetrics
    );
  }, []);

  const maxScrollTop = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  const maxScrollLeft = Math.max(0, metrics.scrollWidth - metrics.clientWidth);
  const hasVerticalScrollbar = orientation !== 'horizontal' && maxScrollTop > 1;
  const hasHorizontalScrollbar =
    orientation !== 'vertical' && maxScrollLeft > 1;
  const hasScrollCorner = hasVerticalScrollbar && hasHorizontalScrollbar;
  const reservesResizeCorner =
    reserveResizeCorner && (hasVerticalScrollbar || hasHorizontalScrollbar);
  const reservesCorner = hasScrollCorner || reservesResizeCorner;
  const verticalBottomInset = reservesCorner ? SCROLLBAR_SIZE : 0;
  const horizontalRightInset = hasVerticalScrollbar
    ? VERTICAL_SCROLLBAR_GUTTER_SIZE
    : reservesCorner
      ? SCROLLBAR_SIZE
      : 0;
  const verticalScrollbarLength = Math.max(
    0,
    metrics.clientHeight -
      (reservesCorner && !hasHorizontalScrollbar ? SCROLLBAR_SIZE : 0)
  );
  const horizontalScrollbarLength = Math.max(
    0,
    metrics.clientWidth -
      (reservesCorner && !hasVerticalScrollbar ? SCROLLBAR_SIZE : 0)
  );
  const verticalTrackSize = Math.max(
    0,
    verticalScrollbarLength - VERTICAL_BUTTON_STACK_SIZE
  );
  const horizontalTrackSize = Math.max(
    0,
    horizontalScrollbarLength - SCROLLBAR_SIZE * 2
  );
  const verticalTrackInner = Math.max(
    0,
    verticalTrackSize - VERTICAL_TRACK_TOP_INSET - VERTICAL_TRACK_BOTTOM_INSET
  );
  const horizontalTrackInner = Math.max(
    0,
    horizontalTrackSize - HORIZONTAL_RAIL_INSET * 2
  );
  const verticalThumbSize = hasVerticalScrollbar
    ? getThumbSize(
        metrics.clientHeight,
        metrics.scrollHeight,
        verticalTrackInner
      )
    : 0;
  const horizontalThumbSize = hasHorizontalScrollbar
    ? getThumbSize(
        metrics.clientWidth,
        metrics.scrollWidth,
        horizontalTrackInner
      )
    : 0;
  const verticalThumbTravel = Math.max(
    0,
    verticalTrackInner - verticalThumbSize
  );
  const horizontalThumbTravel = Math.max(
    0,
    horizontalTrackInner - horizontalThumbSize
  );
  const verticalThumbOffset =
    VERTICAL_TRACK_TOP_INSET +
    getThumbOffset(metrics.scrollTop, maxScrollTop, verticalThumbTravel);
  const horizontalThumbOffset =
    HORIZONTAL_RAIL_INSET +
    getThumbOffset(metrics.scrollLeft, maxScrollLeft, horizontalThumbTravel);

  const viewportBounds = useMemo<CSSProperties>(
    () => ({
      right: hasVerticalScrollbar ? VERTICAL_SCROLLBAR_GUTTER_SIZE : 0,
      bottom: hasHorizontalScrollbar ? SCROLLBAR_SIZE : 0,
      ...viewportStyle,
    }),
    [hasHorizontalScrollbar, hasVerticalScrollbar, viewportStyle]
  );

  const scrollBy = useCallback((axis: ScrollAxis, amount: number) => {
    const element = viewportRef.current;
    if (!element) return;

    if (axis === 'vertical') {
      element.scrollBy({ top: amount, behavior: 'auto' });
      return;
    }

    element.scrollBy({ left: amount, behavior: 'auto' });
  }, []);

  const handleThumbPointerDown = useCallback(
    (axis: ScrollAxis, event: PointerEvent<HTMLDivElement>) => {
      const element = viewportRef.current;
      if (!element) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);

      dragRef.current =
        axis === 'vertical'
          ? {
              axis,
              pointerId: event.pointerId,
              startPointer: event.clientY,
              startScroll: metrics.scrollTop,
              maxScroll: maxScrollTop,
              trackTravel: verticalThumbTravel,
            }
          : {
              axis,
              pointerId: event.pointerId,
              startPointer: event.clientX,
              startScroll: metrics.scrollLeft,
              maxScroll: maxScrollLeft,
              trackTravel: horizontalThumbTravel,
            };
    },
    [
      horizontalThumbTravel,
      maxScrollLeft,
      maxScrollTop,
      metrics.scrollLeft,
      metrics.scrollTop,
      verticalThumbTravel,
    ]
  );

  const handleThumbPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const element = viewportRef.current;
      const drag = dragRef.current;
      if (!element || !drag || drag.pointerId !== event.pointerId) return;

      const currentPointer =
        drag.axis === 'vertical' ? event.clientY : event.clientX;
      const scrollDelta =
        drag.trackTravel > 0
          ? ((currentPointer - drag.startPointer) / drag.trackTravel) *
            drag.maxScroll
          : 0;
      const nextScroll = drag.startScroll + scrollDelta;

      if (drag.axis === 'vertical') {
        element.scrollTop = nextScroll;
      } else {
        element.scrollLeft = nextScroll;
      }

      updateMetrics();
    },
    [updateMetrics]
  );

  const handleThumbPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
      }
    },
    []
  );

  const handleTrackPointerDown = useCallback(
    (axis: ScrollAxis, event: PointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const pointer =
        axis === 'vertical'
          ? event.clientY - rect.top
          : event.clientX - rect.left;
      const thumbStart =
        axis === 'vertical' ? verticalThumbOffset : horizontalThumbOffset;
      const thumbSize =
        axis === 'vertical' ? verticalThumbSize : horizontalThumbSize;
      const pageSize =
        axis === 'vertical' ? metrics.clientHeight : metrics.clientWidth;
      const direction =
        pointer < thumbStart ? -1 : pointer > thumbStart + thumbSize ? 1 : 0;

      if (direction !== 0) {
        scrollBy(
          axis,
          direction * Math.max(LINE_SCROLL, pageSize - LINE_SCROLL)
        );
      }
    },
    [
      horizontalThumbOffset,
      horizontalThumbSize,
      metrics.clientHeight,
      metrics.clientWidth,
      scrollBy,
      verticalThumbOffset,
      verticalThumbSize,
    ]
  );

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    let frameId = 0;
    const observedElements = new Set<Element>();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            window.cancelAnimationFrame(frameId);
            frameId = window.requestAnimationFrame(updateMetrics);
          });

    const observeElement = (target: Element) => {
      if (!resizeObserver || observedElements.has(target)) return;
      observedElements.add(target);
      resizeObserver.observe(target);
    };

    const observeContent = () => {
      observeElement(element);
      Array.from(element.children).forEach(observeElement);
    };

    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            observeContent();
            updateMetrics();
          });

    observeContent();
    mutationObserver?.observe(element, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });

    element.addEventListener('load', updateMetrics, true);
    window.addEventListener('resize', updateMetrics);
    updateMetrics();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      element.removeEventListener('load', updateMetrics, true);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [updateMetrics]);

  return (
    <div className={cn('alt7-scroll-area', className)} style={style}>
      <div
        ref={viewportRef}
        className={cn('alt7-scroll-viewport', viewportClassName)}
        style={viewportBounds}
        onScroll={updateMetrics}
      >
        {children}
      </div>

      {hasVerticalScrollbar && (
        <div
          className="alt7-scrollbar alt7-scrollbar-vertical"
          style={{ bottom: verticalBottomInset }}
        >
          <button
            aria-label="scroll up"
            className="alt7-scrollbar-button alt7-scrollbar-button-up"
            style={{ bottom: VERTICAL_DOWN_BUTTON_SIZE }}
            type="button"
            onPointerDown={() => scrollBy('vertical', -LINE_SCROLL)}
          />
          <div
            className="alt7-scrollbar-track alt7-scrollbar-track-vertical"
            onPointerDown={(event) => handleTrackPointerDown('vertical', event)}
          >
            <div
              className="alt7-scrollbar-thumb alt7-scrollbar-thumb-vertical"
              style={{
                height: verticalThumbSize,
                transform: `translateY(${verticalThumbOffset}px)`,
              }}
              onPointerDown={(event) =>
                handleThumbPointerDown('vertical', event)
              }
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
            />
          </div>
          <button
            aria-label="scroll down"
            className="alt7-scrollbar-button alt7-scrollbar-button-down"
            type="button"
            onPointerDown={() => scrollBy('vertical', LINE_SCROLL)}
          />
        </div>
      )}

      {hasHorizontalScrollbar && (
        <div
          className="alt7-scrollbar alt7-scrollbar-horizontal"
          style={{ right: horizontalRightInset }}
        >
          <button
            aria-label="scroll left"
            className="alt7-scrollbar-button alt7-scrollbar-button-left"
            type="button"
            onPointerDown={() => scrollBy('horizontal', -LINE_SCROLL)}
          />
          <div
            className="alt7-scrollbar-track alt7-scrollbar-track-horizontal"
            onPointerDown={(event) =>
              handleTrackPointerDown('horizontal', event)
            }
          >
            <div
              className="alt7-scrollbar-thumb alt7-scrollbar-thumb-horizontal"
              style={{
                width: horizontalThumbSize,
                transform: `translateX(${horizontalThumbOffset}px)`,
              }}
              onPointerDown={(event) =>
                handleThumbPointerDown('horizontal', event)
              }
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
            />
          </div>
          <button
            aria-label="scroll right"
            className="alt7-scrollbar-button alt7-scrollbar-button-right"
            type="button"
            onPointerDown={() => scrollBy('horizontal', LINE_SCROLL)}
          />
        </div>
      )}

      {hasScrollCorner && !reserveResizeCorner && (
        <div className="alt7-scrollbar-corner" />
      )}
    </div>
  );
}
