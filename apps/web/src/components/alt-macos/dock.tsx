import { useState, useRef, useCallback, useEffect } from 'react';
import type { WindowDockTarget } from '@/components/alt-macos/window';

interface DockApp {
  id: string;
  label: string;
  icon: React.ReactNode;
  iconSrc?: string;
  dockScale?: number;
  syntheticReflection?: boolean;
  startsSection?: boolean;
}

interface DockProps {
  apps: DockApp[];
  minimizedIds: string[];
  openAppIds: string[];
  onOpenApp: (appType: string) => void;
  isMobile: boolean;
  onIconLayout?: (appId: string, target: WindowDockTarget) => void;
}

const DOCK_SIZES = [
  { label: 'small', value: 36 },
  { label: 'medium', value: 48 },
  { label: 'large', value: 64 },
] as const;

const MAGNIFICATION_LEVELS = [
  { label: 'off', value: 1.0 },
  { label: 'low', value: 1.4 },
  { label: 'medium', value: 1.8 },
  { label: 'high', value: 2.2 },
] as const;

const DOCK_HORIZONTAL_PADDING = 4;
const DOCK_SEPARATOR_WIDTH = 18;
const DOCK_ITEM_GAP = 1;
const DOCK_TRANSITION = '180ms cubic-bezier(0.22, 1, 0.36, 1)';
const DOCK_MIN_VISUAL_GAP = 0;
const DOCK_DISPLACEMENT_STRENGTH = 0.68;
const DOCK_SECTION_DISPLACEMENT_STRENGTH = 1;
const DOCK_RESOLUTION_PASSES = 3;

const APP_RENDER_ADJUSTMENTS: Partial<
  Record<string, { dockScaleDelta?: number; reflectionOffsetPx?: number }>
> = {
  preferences: { dockScaleDelta: -0.02 },
  stickies: { reflectionOffsetPx: -4 },
  photobooth: { dockScaleDelta: 0.03 },
  terminal: { reflectionOffsetPx: -6 },
  trash: { dockScaleDelta: -0.04, reflectionOffsetPx: -2 },
};

export function Dock({
  apps,
  minimizedIds,
  openAppIds,
  onOpenApp,
  isMobile,
  onIconLayout,
}: DockProps) {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [dockSize, setDockSize] = useState(48);
  const [magnification, setMagnification] = useState(1.8);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mouseFrameRef = useRef<number | null>(null);
  const pendingMouseClientXRef = useRef<number | null>(null);
  const baseItemWidth = dockSize + DOCK_ITEM_GAP;
  const separatorOffsets = apps.reduce<number[]>((offsets, app, index) => {
    const previousOffset = index === 0 ? 0 : offsets[index - 1];
    offsets.push(
      previousOffset + (app.startsSection ? DOCK_SEPARATOR_WIDTH : 0)
    );
    return offsets;
  }, []);
  const totalSeparatorWidth =
    separatorOffsets[separatorOffsets.length - 1] ?? 0;
  const trackWidth = apps.length * baseItemWidth + totalSeparatorWidth;
  const dockBaseWidth = trackWidth + DOCK_HORIZONTAL_PADDING * 2;

  const flushMousePosition = useCallback(() => {
    mouseFrameRef.current = null;
    if (!dockRef.current || pendingMouseClientXRef.current === null) return;

    const rect = dockRef.current.getBoundingClientRect();
    const trackLeft = rect.left + DOCK_HORIZONTAL_PADDING;
    setMouseX(pendingMouseClientXRef.current - trackLeft);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      pendingMouseClientXRef.current = e.clientX;
      if (mouseFrameRef.current !== null) return;
      mouseFrameRef.current = window.requestAnimationFrame(flushMousePosition);
    },
    [flushMousePosition]
  );

  const handleMouseLeave = useCallback(() => {
    pendingMouseClientXRef.current = null;
    if (mouseFrameRef.current !== null) {
      window.cancelAnimationFrame(mouseFrameRef.current);
      mouseFrameRef.current = null;
    }
    setMouseX(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [contextMenu]);

  useEffect(() => {
    return () => {
      if (mouseFrameRef.current !== null) {
        window.cancelAnimationFrame(mouseFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobile || !onIconLayout) return;

    const updateIconLayouts = () => {
      apps.forEach((app) => {
        const node = iconRefs.current[app.id];
        if (!node) return;
        const rect = node.getBoundingClientRect();
        onIconLayout(app.id, {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      });
    };

    const frameId = window.requestAnimationFrame(updateIconLayouts);
    window.addEventListener('resize', updateIconLayouts);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateIconLayouts);
    };
  }, [apps, dockSize, isMobile, onIconLayout]);

  if (isMobile) {
    return (
      <div
        className="fixed right-0 bottom-0 left-0 z-[8500] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
        style={{
          background:
            'linear-gradient(180deg, rgba(200,200,200,0.85) 0%, rgba(160,165,170,0.9) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {apps.map((app) => (
          <button
            key={app.id}
            className="flex flex-col items-center gap-0.5 px-2 py-2"
            onClick={() => onOpenApp(app.id)}
          >
            <span className="text-xl">{app.icon}</span>
            <span className="text-[10px] font-medium" style={{ color: '#333' }}>
              {app.label}
            </span>
          </button>
        ))}
      </div>
    );
  }
  const getBaseCenter = (index: number) =>
    index * baseItemWidth + baseItemWidth / 2 + (separatorOffsets[index] ?? 0);

  const getIconScale = (center: number) => {
    if (mouseX === null || magnification <= 1.0) return 1;

    const distance = Math.abs(mouseX - center);
    const radius = dockSize * 2.5;

    if (distance < radius) {
      const t = Math.cos((distance / radius) * (Math.PI / 2));
      return 1 + (magnification - 1) * t * t;
    }
    return 1;
  };

  const appMetrics = apps.map((app) => {
    const renderAdjustments = APP_RENDER_ADJUSTMENTS[app.id];
    const iconScale =
      (app.dockScale ?? 1) + (renderAdjustments?.dockScaleDelta ?? 0);

    return {
      iconSize: Math.round(dockSize * iconScale),
      reflectionOffsetPx: renderAdjustments?.reflectionOffsetPx ?? 0,
      usesSyntheticReflection: app.syntheticReflection ?? false,
    };
  });

  const baseCenters = apps.map((_, index) => getBaseCenter(index));
  const scales = baseCenters.map((center) => getIconScale(center));
  const focusWeights =
    magnification <= 1.0
      ? scales.map(() => 0)
      : scales.map((scale) => (scale - 1) / (magnification - 1));
  const visualWidths = appMetrics.map(
    (metric, index) => metric.iconSize * scales[index]
  );
  const requiredDistances = baseCenters.slice(0, -1).map((center, index) => {
    const baseDistance = baseCenters[index + 1] - center;
    const sectionGap = apps[index + 1]?.startsSection
      ? DOCK_SEPARATOR_WIDTH
      : 0;
    const idealDistance =
      (visualWidths[index] + visualWidths[index + 1]) / 2 +
      sectionGap +
      DOCK_MIN_VISUAL_GAP;
    const displacementStrength =
      sectionGap > 0
        ? DOCK_SECTION_DISPLACEMENT_STRENGTH
        : DOCK_DISPLACEMENT_STRENGTH;

    return (
      baseDistance +
      Math.max(0, idealDistance - baseDistance) * displacementStrength
    );
  });

  const adjustedCenters = [...baseCenters];
  for (let pass = 0; pass < DOCK_RESOLUTION_PASSES; pass += 1) {
    for (let index = 0; index < requiredDistances.length; index += 1) {
      const currentDistance =
        adjustedCenters[index + 1] - adjustedCenters[index];
      const overlap = requiredDistances[index] - currentDistance;
      if (overlap <= 0) continue;

      const leftMobility = Math.max(0.06, 1 - focusWeights[index]);
      const rightMobility = Math.max(0.06, 1 - focusWeights[index + 1]);
      const totalMobility = leftMobility + rightMobility;

      adjustedCenters[index] -= overlap * (leftMobility / totalMobility);
      adjustedCenters[index + 1] += overlap * (rightMobility / totalMobility);
    }

    for (let index = requiredDistances.length - 1; index >= 0; index -= 1) {
      const currentDistance =
        adjustedCenters[index + 1] - adjustedCenters[index];
      const overlap = requiredDistances[index] - currentDistance;
      if (overlap <= 0) continue;

      const leftMobility = Math.max(0.06, 1 - focusWeights[index]);
      const rightMobility = Math.max(0.06, 1 - focusWeights[index + 1]);
      const totalMobility = leftMobility + rightMobility;

      adjustedCenters[index] -= overlap * (leftMobility / totalMobility);
      adjustedCenters[index + 1] += overlap * (rightMobility / totalMobility);
    }
  }

  let minLeftEdge = 0;
  let maxRightEdge = trackWidth;
  adjustedCenters.forEach((center, index) => {
    const halfVisualWidth = visualWidths[index] / 2;
    minLeftEdge = Math.min(minLeftEdge, center - halfVisualWidth);
    maxRightEdge = Math.max(maxRightEdge, center + halfVisualWidth);
  });

  const extraLeftPadding = Math.max(0, -minLeftEdge);
  const extraRightPadding = Math.max(0, maxRightEdge - trackWidth);
  const dockBackgroundLeft = extraLeftPadding;
  const dockBackgroundRight = extraRightPadding;
  const dockBackgroundOffset = (dockBackgroundRight - dockBackgroundLeft) / 2;
  const dockBackgroundScaleX =
    (dockBaseWidth + dockBackgroundLeft + dockBackgroundRight) / dockBaseWidth;

  const horizontalShifts = adjustedCenters.map(
    (center, index) => center - baseCenters[index]
  );
  const sectionDividerShifts = apps.map((app, index) => {
    if (!app.startsSection) return 0;

    return ((horizontalShifts[index - 1] ?? 0) + horizontalShifts[index]) / 2;
  });
  const sectionDividerPositions = apps.flatMap((app, index) => {
    if (!app.startsSection) return [];

    return [
      DOCK_HORIZONTAL_PADDING +
        index * baseItemWidth +
        (separatorOffsets[index] ?? 0) -
        DOCK_SEPARATOR_WIDTH / 2 +
        sectionDividerShifts[index],
    ];
  });

  return (
    <div
      className="fixed bottom-0 left-1/2 z-[8500] -translate-x-1/2"
      style={{ paddingBottom: 0 }}
    >
      <div
        ref={dockRef}
        role="toolbar"
        aria-label="dock"
        className="relative flex items-end pt-2"
        style={{
          width: `${dockBaseWidth}px`,
          paddingLeft: `${DOCK_HORIZONTAL_PADDING}px`,
          paddingRight: `${DOCK_HORIZONTAL_PADDING}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-0 left-1/2"
          style={{
            width: `${dockBaseWidth}px`,
            transform: `translateX(-50%) translateX(${dockBackgroundOffset}px)`,
            transition: `transform ${DOCK_TRANSITION}`,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scaleX(${dockBackgroundScaleX})`,
              transformOrigin: 'center bottom',
              transition: `transform ${DOCK_TRANSITION}`,
              willChange: 'transform',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, rgba(100,120,140,0.3) 100%)',
              border: '1px solid rgba(255,255,255,0.5)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 -1px 0 rgba(255,255,255,0.3) inset',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />
        </div>
        {sectionDividerPositions.map((position, index) => (
          <div
            key={`dock-divider-${index}`}
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              left: `${position}px`,
              top: `${Math.round(dockSize * 0.2)}px`,
              width: `${DOCK_SEPARATOR_WIDTH}px`,
              height: `${Math.round(dockSize * 0.92)}px`,
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '4px',
                height: '100%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '1px',
                  width: '1px',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(31,37,45,0.72) 18%, rgba(28,33,40,0.56) 82%, rgba(255,255,255,0.04) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '2px',
                  width: '1px',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.14) 22%, rgba(173,184,197,0.12) 78%, rgba(255,255,255,0.08) 100%)',
                }}
              />
            </div>
          </div>
        ))}
        {apps.map((app, i) => {
          const scale = scales[i];
          const horizontalShift = horizontalShifts[i];
          const { iconSize, reflectionOffsetPx, usesSyntheticReflection } =
            appMetrics[i];
          const tooltipLiftPx = Math.max(0, iconSize * (scale - 1));
          return (
            <div key={app.id} className="flex items-end">
              {app.startsSection && (
                <div
                  aria-hidden="true"
                  className="shrink-0 self-center"
                  style={{
                    width: `${DOCK_SEPARATOR_WIDTH}px`,
                    height: `${Math.round(dockSize * 0.94)}px`,
                  }}
                />
              )}
              <div
                className="flex justify-center"
                style={{
                  width: `${baseItemWidth}px`,
                }}
              >
                <button
                  ref={(node) => {
                    iconRefs.current[app.id] = node;
                  }}
                  className="group relative flex flex-col items-center"
                  onClick={() => onOpenApp(app.id)}
                  style={{
                    transform: `translateX(${horizontalShift}px)`,
                    transition: `transform ${DOCK_TRANSITION}`,
                    zIndex: 2,
                  }}
                >
                  <span
                    className="pointer-events-none absolute left-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100"
                    style={{
                      top: `${-34 - tooltipLiftPx}px`,
                      transform: 'translateX(-50%)',
                      transition: 'opacity 110ms linear',
                      fontFamily:
                        "'Lucida Grande', Geneva, 'Helvetica Neue', sans-serif",
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        letterSpacing: '-0.01em',
                        display: 'inline-block',
                        padding: '4px 10px 5px',
                        borderRadius: '999px',
                        background:
                          'linear-gradient(180deg, rgba(76,84,96,0.82) 0%, rgba(49,56,66,0.8) 52%, rgba(33,38,46,0.84) 100%)',
                        boxShadow:
                          '0 1px 0 rgba(255,255,255,0.12) inset, 0 3px 10px rgba(0,0,0,0.28)',
                        color: '#fff',
                        textShadow: '0 -1px 0 rgba(0,0,0,0.72)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      {app.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2"
                      style={{
                        bottom: '-6px',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '7px solid rgba(38,44,52,0.84)',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.18))',
                      }}
                    />
                  </span>
                  <span
                    className="flex justify-center"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'bottom center',
                      transition: `transform ${DOCK_TRANSITION}`,
                      alignItems: usesSyntheticReflection
                        ? 'flex-start'
                        : 'flex-end',
                      width: `${dockSize}px`,
                      height: `${dockSize}px`,
                    }}
                  >
                    <span
                      className="flex items-center justify-center [&_img]:h-full [&_img]:w-full [&_img]:object-contain"
                      style={{
                        width: `${iconSize}px`,
                        height: `${iconSize}px`,
                        filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))',
                        WebkitBoxReflect: usesSyntheticReflection
                          ? `below ${reflectionOffsetPx}px linear-gradient(transparent 40%, rgba(255,255,255,0.22) 100%)`
                          : undefined,
                      }}
                    >
                      {app.icon}
                    </span>
                  </span>
                  {(openAppIds.includes(app.id) ||
                    minimizedIds.includes(app.id)) && (
                    <div
                      className="absolute -bottom-[2px]"
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,220,255,0.6) 70%, transparent 100%)',
                        boxShadow: '0 0 4px rgba(255,255,255,0.8)',
                      }}
                    />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <div
          role="menu"
          aria-label="dock settings"
          className="fixed z-[9999]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            transform: 'translateY(-100%)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            style={{
              fontFamily:
                "'Lucida Grande', Geneva, 'Helvetica Neue', sans-serif",
              fontSize: '13px',
              background: 'rgba(240,240,240,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '6px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              padding: '4px 0',
              minWidth: '180px',
              color: '#222',
            }}
          >
            <div
              className="px-3 py-[3px] text-[11px] font-semibold"
              style={{ color: '#666' }}
            >
              dock size
            </div>
            {DOCK_SIZES.map((size) => (
              <button
                type="button"
                key={size.label}
                aria-pressed={dockSize === size.value}
                className="mx-1 flex w-[calc(100%-0.5rem)] cursor-default items-center gap-2 rounded-sm border-0 bg-transparent px-3 py-[3px] text-left text-inherit hover:bg-[#3872c0] hover:text-white"
                onClick={() => {
                  setDockSize(size.value);
                  setContextMenu(null);
                }}
              >
                <span className="w-3 text-center text-[10px]">
                  {dockSize === size.value ? '●' : '○'}
                </span>
                {size.label}
              </button>
            ))}
            <div
              className="mx-2 my-1"
              style={{ height: '1px', background: 'rgba(0,0,0,0.1)' }}
            />
            <div
              className="px-3 py-[3px] text-[11px] font-semibold"
              style={{ color: '#666' }}
            >
              magnification
            </div>
            {MAGNIFICATION_LEVELS.map((level) => (
              <button
                type="button"
                key={level.label}
                aria-pressed={magnification === level.value}
                className="mx-1 flex w-[calc(100%-0.5rem)] cursor-default items-center gap-2 rounded-sm border-0 bg-transparent px-3 py-[3px] text-left text-inherit hover:bg-[#3872c0] hover:text-white"
                onClick={() => {
                  setMagnification(level.value);
                  setContextMenu(null);
                }}
              >
                <span className="w-3 text-center text-[10px]">
                  {magnification === level.value ? '●' : '○'}
                </span>
                {level.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
