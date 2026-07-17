import { useCallback, useEffect, useRef } from 'react';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

export interface WindowDockTarget {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface WindowProps {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMinimizing?: boolean;
  minimizeTarget?: WindowDockTarget;
  isMaximized: boolean;
  zIndex: number;
  isFocused: boolean;
  isMobile: boolean;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

export function Window({
  id,
  title,
  x,
  y,
  width,
  height,
  isMinimized,
  isMinimizing = false,
  minimizeTarget,
  isMaximized,
  zIndex,
  isFocused,
  isMobile,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  children,
}: WindowProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (isMobile || isMaximized) return;
      e.preventDefault();
      onFocus(id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: x,
        origY: y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [id, x, y, isMobile, isMaximized, onFocus]
  );

  const handleDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onMove(id, dragRef.current.origX + dx, dragRef.current.origY + dy);
    },
    [id, onMove]
  );

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      if (isMobile || isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus(id);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: width,
        origH: height,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [id, width, height, isMobile, isMaximized, onFocus]
  );

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeRef.current) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      const newW = Math.max(MIN_WIDTH, resizeRef.current.origW + dx);
      const newH = Math.max(MIN_HEIGHT, resizeRef.current.origH + dy);
      onResize(id, newW, newH);
    },
    [id, onResize]
  );

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose(id);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, onClose]);

  if (isMinimized) return null;

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[8000] flex flex-col"
        style={{ zIndex, background: '#fff' }}
        onPointerDown={() => onFocus(id)}
      >
        <div
          className="flex h-11 shrink-0 items-center justify-between px-4"
          style={{
            background: 'linear-gradient(180deg, #c8c8c8 0%, #ababab 100%)',
            borderBottom: '1px solid rgba(0,0,0,0.3)',
          }}
        >
          <button
            className="text-[13px] font-medium"
            style={{
              color: '#333',
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}
            onClick={() => onClose(id)}
          >
            Back
          </button>
          <span
            className="text-[13px] font-medium"
            style={{
              color: '#333',
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            {title}
          </span>
          <div className="w-10" />
        </div>
        <MacScrollArea className="alt7-scroll-surface flex-1">
          {children}
        </MacScrollArea>
      </div>
    );
  }

  const activeGradient = 'linear-gradient(180deg, #c8c8c8 0%, #ababab 100%)';
  const inactiveGradient = 'linear-gradient(180deg, #e8e8e8 0%, #d5d5d5 100%)';
  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : width;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : height;
  const resolvedLeft = isMaximized ? 0 : x;
  const resolvedTop = isMaximized ? 22 : y;
  const resolvedWidth = isMaximized ? viewportWidth : width;
  const resolvedHeight = isMaximized ? viewportHeight - 22 : height;
  const genieDeltaX = minimizeTarget
    ? minimizeTarget.left +
      minimizeTarget.width / 2 -
      (resolvedLeft + resolvedWidth / 2)
    : 0;
  const genieDeltaY = minimizeTarget
    ? minimizeTarget.top +
      minimizeTarget.height / 2 -
      (resolvedTop + resolvedHeight / 2)
    : 0;
  const genieDirection = genieDeltaX === 0 ? 1 : Math.sign(genieDeltaX);
  const genieStyle =
    isMinimizing && minimizeTarget
      ? ({
          animation:
            'alt7GenieMinimize 420ms cubic-bezier(0.2, 0.72, 0.15, 1) forwards',
          transformOrigin: '50% 100%',
          pointerEvents: 'none',
          willChange: 'transform, opacity, filter, clip-path',
          ['--genie-dx' as string]: `${genieDeltaX}px`,
          ['--genie-dy' as string]: `${genieDeltaY}px`,
          ['--genie-direction' as string]: `${genieDirection}`,
        } satisfies React.CSSProperties)
      : undefined;

  return (
    <>
      <style>{`
        @keyframes alt7GenieMinimize {
          0% {
            transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
            filter: blur(0px) saturate(1);
          }
          18% {
            transform: translate3d(
              calc(var(--genie-dx) * 0.08 + var(--genie-direction) * 10px),
              calc(var(--genie-dy) * 0.08),
              0
            ) scale3d(0.97, 0.98, 1);
          }
          44% {
            transform: translate3d(
              calc(var(--genie-dx) * 0.34 + var(--genie-direction) * 52px),
              calc(var(--genie-dy) * 0.28),
              0
            ) scale3d(0.72, 0.82, 1) skewX(calc(var(--genie-direction) * -10deg));
            clip-path: polygon(12% 0, 88% 0, 100% 100%, 0 100%);
          }
          70% {
            transform: translate3d(
              calc(var(--genie-dx) * 0.76 + var(--genie-direction) * 36px),
              calc(var(--genie-dy) * 0.76),
              0
            ) scale3d(0.24, 0.34, 1) skewX(calc(var(--genie-direction) * -22deg));
            clip-path: polygon(42% 0, 58% 0, 82% 100%, 18% 100%);
            opacity: 0.92;
          }
          100% {
            transform: translate3d(var(--genie-dx), var(--genie-dy), 0)
              scale3d(0.08, 0.05, 1)
              skewX(calc(var(--genie-direction) * -28deg));
            clip-path: polygon(49% 0, 51% 0, 60% 100%, 40% 100%);
            opacity: 0.82;
            filter: blur(0.35px) saturate(1.05);
          }
        }
      `}</style>
      <div
        className="absolute flex flex-col"
        style={{
          borderRadius: '6px 6px 0 0',
          border: '1px solid #888',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          ...(isMaximized
            ? {
                top: 22,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: 'calc(100vh - 22px)',
                zIndex,
              }
            : { left: x, top: y, width, height, zIndex }),
          ...genieStyle,
        }}
        onPointerDown={() => onFocus(id)}
      >
        <div
          className="flex h-[22px] shrink-0 cursor-grab items-center px-[8px] select-none active:cursor-grabbing"
          style={{
            background: isFocused ? activeGradient : inactiveGradient,
            borderBottom: isFocused ? '1px solid #888' : '1px solid #aaa',
            position: 'relative',
          }}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: isFocused
                ? 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)'
                : 'none',
            }}
          />

          <div className="relative flex items-center gap-[7px]">
            <button
              className="group/btn relative h-[13px] w-[13px] rounded-full transition-transform hover:scale-110"
              style={{
                background: isFocused
                  ? 'radial-gradient(circle at 50% 35%, #ff9a96, #ed6a5f 40%, #c04840 100%)'
                  : '#ddd',
                border: isFocused ? '1px solid #e24b41' : '1px solid #d1d0d2',
                boxShadow: isFocused
                  ? 'inset 0 -1px 1px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.2)'
                  : 'none',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClose(id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {isFocused && (
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                  <span
                    className="absolute top-[1px] right-[2px] left-[2px]"
                    style={{
                      height: '45%',
                      borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%)',
                    }}
                  />
                </span>
              )}
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold opacity-0 group-hover/btn:opacity-100"
                style={{ color: '#4d0000', lineHeight: 1 }}
              >
                &times;
              </span>
            </button>

            <button
              className="group/btn relative h-[13px] w-[13px] rounded-full transition-transform hover:scale-110"
              style={{
                background: isFocused
                  ? 'radial-gradient(circle at 50% 35%, #ffe090, #f6be50 40%, #c09030 100%)'
                  : '#ddd',
                border: isFocused ? '1px solid #e1a73e' : '1px solid #d1d0d2',
                boxShadow: isFocused
                  ? 'inset 0 -1px 1px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.2)'
                  : 'none',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMinimize(id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {isFocused && (
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                  <span
                    className="absolute top-[1px] right-[2px] left-[2px]"
                    style={{
                      height: '45%',
                      borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%)',
                    }}
                  />
                </span>
              )}
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold opacity-0 group-hover/btn:opacity-100"
                style={{ color: '#995700', lineHeight: 1 }}
              >
                &ndash;
              </span>
            </button>

            <button
              className="group/btn relative h-[13px] w-[13px] rounded-full transition-transform hover:scale-110"
              style={{
                background: isFocused
                  ? 'radial-gradient(circle at 50% 35%, #90e880, #61c555 40%, #349828 100%)'
                  : '#ddd',
                border: isFocused ? '1px solid #2dac2f' : '1px solid #d1d0d2',
                boxShadow: isFocused
                  ? 'inset 0 -1px 1px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.2)'
                  : 'none',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMaximize(id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {isFocused && (
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                  <span
                    className="absolute top-[1px] right-[2px] left-[2px]"
                    style={{
                      height: '45%',
                      borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%)',
                    }}
                  />
                </span>
              )}
              <span
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold opacity-0 group-hover/btn:opacity-100"
                style={{ color: '#006500', lineHeight: 1 }}
              >
                +
              </span>
            </button>
          </div>

          <span
            className="relative flex-1 text-center text-[13px]"
            style={{
              color: isFocused ? '#333' : '#999',
              textShadow: isFocused ? '0 1px 0 rgba(255,255,255,0.5)' : 'none',
            }}
          >
            {title}
          </span>
          <div className="w-[54px]" />
        </div>

        <MacScrollArea
          className="alt7-scroll-surface flex-1"
          reserveResizeCorner={!isMaximized}
          style={{ background: '#fff' }}
        >
          {children}
        </MacScrollArea>

        {!isMaximized && (
          <div
            className="absolute right-0 bottom-0 z-[4] h-[15px] w-[15px] cursor-nwse-resize"
            style={{
              backgroundImage: 'url(/os-x/ui/resize-corner.png)',
              backgroundPosition: 'right bottom',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '15px 15px',
            }}
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
          />
        )}
      </div>
    </>
  );
}
