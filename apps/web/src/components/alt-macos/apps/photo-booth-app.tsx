import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@template/backend';
import type { Id } from '@template/backend/dataModel';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

type Effect =
  | 'normal'
  | 'sepia'
  | 'bw'
  | 'mirror'
  | 'xray'
  | 'thermal'
  | 'stretch'
  | 'warhol';

type ViewMode = 'grid' | 'single' | 'filmstrip';

const EFFECTS: Array<{
  id: Effect;
  label: string;
  filter: string;
  description: string;
  swatch: string;
}> = [
  {
    id: 'normal',
    label: 'Normal',
    filter: 'none',
    description: 'Clean camera feed with the usual slight vanity.',
    swatch: 'linear-gradient(135deg, #f5f7fb 0%, #bcc8d9 100%)',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    filter: 'sepia(1)',
    description: 'Instantly makes everything feel historic and expensive.',
    swatch: 'linear-gradient(135deg, #e0c39a 0%, #8c6040 100%)',
  },
  {
    id: 'bw',
    label: 'B&W',
    filter: 'grayscale(1)',
    description: 'Monochrome, dramatic, and mildly judgmental.',
    swatch: 'linear-gradient(135deg, #f8f8f8 0%, #616161 100%)',
  },
  {
    id: 'mirror',
    label: 'Mirror',
    filter: 'none',
    description: 'Like real life, but flipped so it feels suspicious.',
    swatch: 'linear-gradient(135deg, #dff6ff 0%, #4d7cf7 100%)',
  },
  {
    id: 'xray',
    label: 'X-Ray',
    filter: 'invert(1)',
    description: 'Great for looking ghostly without the paperwork.',
    swatch: 'linear-gradient(135deg, #eff3ff 0%, #32408d 100%)',
  },
  {
    id: 'thermal',
    label: 'Thermal',
    filter: 'hue-rotate(180deg) saturate(3)',
    description: 'Every room becomes a sci-fi emergency for a second.',
    swatch: 'linear-gradient(135deg, #ffda63 0%, #fd4962 52%, #7b38ff 100%)',
  },
  {
    id: 'stretch',
    label: 'Stretch',
    filter: 'none',
    description: 'For when reality needs a little elastic sincerity.',
    swatch: 'linear-gradient(135deg, #f4b7ff 0%, #6b6bff 100%)',
  },
  {
    id: 'warhol',
    label: 'Warhol',
    filter: 'none',
    description: 'Four panels, loud colors, and absolutely no subtlety.',
    swatch:
      'linear-gradient(135deg, #ff7e7e 0%, #ffd45b 35%, #6af0d3 68%, #6e82ff 100%)',
  },
];

const WARHOL_FILTERS = [
  'saturate(1.9) hue-rotate(-25deg) contrast(1.15) brightness(1.05)',
  'saturate(1.7) hue-rotate(70deg) contrast(1.08)',
  'saturate(1.8) hue-rotate(155deg) brightness(1.08)',
  'saturate(2) hue-rotate(235deg) contrast(1.12)',
] as const;

const VIEW_MODES: Array<{ id: ViewMode; label: string }> = [
  { id: 'grid', label: 'Grid View' },
  { id: 'single', label: 'Single View' },
  { id: 'filmstrip', label: 'Filmstrip View' },
];

function getEffectDefinition(effect: Effect) {
  return EFFECTS.find((item) => item.id === effect) ?? EFFECTS[0];
}

function drawEffectFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
  effect: Exclude<Effect, 'warhol'>
) {
  const effectDef = getEffectDefinition(effect);

  if (effect === 'mirror') {
    ctx.save();
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight,
      0,
      0,
      width,
      height
    );
    ctx.restore();
    return;
  }

  if (effect === 'stretch') {
    ctx.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight,
      x,
      y,
      width,
      height * 0.6
    );
    ctx.drawImage(
      video,
      0,
      video.videoHeight * 0.38,
      video.videoWidth,
      video.videoHeight * 0.62,
      x,
      y + height * 0.3,
      width,
      height * 0.7
    );
    return;
  }

  ctx.save();
  ctx.filter = effectDef.filter !== 'none' ? effectDef.filter : 'none';
  ctx.drawImage(
    video,
    0,
    0,
    video.videoWidth,
    video.videoHeight,
    x,
    y,
    width,
    height
  );
  ctx.restore();
}

function drawWarholComposition(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0
) {
  const panelWidth = width / 2;
  const panelHeight = height / 2;

  WARHOL_FILTERS.forEach((filter, index) => {
    const x = (index % 2) * panelWidth;
    const y = Math.floor(index / 2) * panelHeight;

    ctx.save();
    ctx.filter = filter;
    ctx.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight,
      offsetX + x,
      offsetY + y,
      panelWidth,
      panelHeight
    );
    ctx.restore();
  });

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = Math.max(2, width * 0.004);
  ctx.beginPath();
  ctx.moveTo(offsetX + panelWidth, offsetY);
  ctx.lineTo(offsetX + panelWidth, offsetY + height);
  ctx.moveTo(offsetX, offsetY + panelHeight);
  ctx.lineTo(offsetX + width, offsetY + panelHeight);
  ctx.stroke();
  ctx.restore();
}

function drawGridComposition(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  effect: Effect
) {
  const cellWidth = width / 2;
  const cellHeight = height / 2;
  const gap = Math.max(2, Math.round(width * 0.006));
  const renderEffect = effect === 'warhol' ? 'normal' : effect;

  ctx.clearRect(0, 0, width, height);

  for (let index = 0; index < 4; index += 1) {
    const x = (index % 2) * cellWidth;
    const y = Math.floor(index / 2) * cellHeight;
    drawEffectFrame(
      ctx,
      video,
      x + gap / 2,
      y + gap / 2,
      cellWidth - gap,
      cellHeight - gap,
      renderEffect
    );
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = gap;
  ctx.beginPath();
  ctx.moveTo(cellWidth, 0);
  ctx.lineTo(cellWidth, height);
  ctx.moveTo(0, cellHeight);
  ctx.lineTo(width, cellHeight);
  ctx.stroke();
  ctx.restore();
}

function ViewModeIcon({ mode }: { mode: ViewMode }) {
  if (mode === 'grid') {
    return (
      <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
        <rect
          x="1"
          y="1"
          width="4"
          height="4"
          rx="0.6"
          fill="none"
          stroke="currentColor"
        />
        <rect
          x="9"
          y="1"
          width="4"
          height="4"
          rx="0.6"
          fill="none"
          stroke="currentColor"
        />
        <rect
          x="1"
          y="7"
          width="4"
          height="4"
          rx="0.6"
          fill="none"
          stroke="currentColor"
        />
        <rect
          x="9"
          y="7"
          width="4"
          height="4"
          rx="0.6"
          fill="none"
          stroke="currentColor"
        />
      </svg>
    );
  }

  if (mode === 'single') {
    return (
      <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
        <rect
          x="1"
          y="1"
          width="12"
          height="10"
          rx="0.9"
          fill="none"
          stroke="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="12"
        height="2"
        rx="0.6"
        fill="none"
        stroke="currentColor"
      />
      <rect
        x="1"
        y="5"
        width="12"
        height="2"
        rx="0.6"
        fill="none"
        stroke="currentColor"
      />
      <rect
        x="1"
        y="9"
        width="12"
        height="2"
        rx="0.6"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}

function ShutterIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      <path
        d="M5.4 2.2 6.4 1h3.2l1 1.2H13c1.1 0 2 .9 2 2v5.6c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V4.2c0-1.1.9-2 2-2h2.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle
        cx="8"
        cy="7"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export function PhotoBoothApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [activeEffect, setActiveEffect] = useState<Effect>('normal');
  const [viewMode, setViewMode] = useState<ViewMode>('filmstrip');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);

  const generateUploadUrl = useMutation(api.photobooth.generateUploadUrl);
  const savePhoto = useMutation(api.photobooth.savePhoto);
  const photos = useQuery(api.photobooth.listPhotos) ?? [];

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera unavailable');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          setCameraError(false);
        }
      } catch {
        if (mounted) {
          setCameraError(true);
          setCameraReady(false);
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    try {
      const audio = new Audio('/os-x/sounds/photo-booth-action.wav');
      audio.preload = 'auto';
      audio.volume = 0.7;
      shutterAudioRef.current = audio;
    } catch {
      shutterAudioRef.current = null;
    }

    return () => {
      shutterAudioRef.current?.pause();
      shutterAudioRef.current = null;
    };
  }, []);

  const showCanvasPreview = activeEffect === 'warhol' || viewMode === 'grid';

  useEffect(() => {
    if (!showCanvasPreview || !cameraReady) return;

    let frameId = 0;

    const render = () => {
      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (activeEffect === 'warhol') {
            drawWarholComposition(ctx, video, canvas.width, canvas.height);
          } else {
            drawGridComposition(
              ctx,
              video,
              canvas.width,
              canvas.height,
              activeEffect
            );
          }
        }
      }

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frameId);
  }, [activeEffect, cameraReady, showCanvasPreview]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    setEffectsOpen(false);
    try {
      const audio = shutterAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } catch {
      // audio playback not available
    }
    setFlashVisible(true);
    window.setTimeout(() => setFlashVisible(false), 200);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeEffect === 'warhol') {
      drawWarholComposition(ctx, video, canvas.width, canvas.height);
    } else {
      drawEffectFrame(
        ctx,
        video,
        0,
        0,
        canvas.width,
        canvas.height,
        activeEffect as Exclude<Effect, 'warhol'>
      );
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'image/png' },
          body: blob,
        });
        const { storageId } = (await result.json()) as {
          storageId: Id<'_storage'>;
        };
        await savePhoto({ storageId, effect: activeEffect });
      } catch {
        // upload failed silently
      }
    }, 'image/png');
  }, [cameraReady, activeEffect, generateUploadUrl, savePhoto]);

  const currentEffect = getEffectDefinition(activeEffect);
  const visiblePhotos = photos.slice(0, 10).reverse();
  const photoStatus =
    photos.length === 0
      ? 'No photos'
      : photos.length === 1
        ? '1 photo'
        : `${photos.length} photos`;

  const videoStyle: React.CSSProperties = {
    filter:
      currentEffect.filter !== 'none' && !showCanvasPreview
        ? currentEffect.filter
        : undefined,
    transform: activeEffect === 'mirror' ? 'scaleX(-1)' : undefined,
  };

  if (activeEffect === 'stretch') {
    videoStyle.transform = 'scaleY(1.28)';
    videoStyle.filter = undefined;
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        background: '#d7d7d7',
      }}
    >
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{
          background: '#000',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-10"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
          }}
        />

        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          playsInline
          muted
          style={{
            ...videoStyle,
            opacity: showCanvasPreview ? 0 : 1,
          }}
        />

        <canvas
          ref={previewCanvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: showCanvasPreview ? 1 : 0 }}
        />

        {flashVisible && (
          <div
            className="absolute inset-0 bg-white"
            style={{ animation: 'fadeOut 200ms ease-out forwards' }}
          />
        )}

        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-[6px] border px-4 py-2 text-center"
              style={{
                borderColor: 'rgba(255,255,255,0.16)',
                background: 'rgba(0,0,0,0.34)',
              }}
            >
              <p
                className="text-[12px]"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                Connecting to camera...
              </p>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-[6px] border px-5 py-4 text-center"
              style={{
                borderColor: 'rgba(255,255,255,0.16)',
                background: 'rgba(0,0,0,0.38)',
              }}
            >
              <p
                className="text-[12px]"
                style={{ color: 'rgba(255,255,255,0.82)' }}
              >
                Camera access required
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Allow camera access in your browser settings.
              </p>
            </div>
          </div>
        )}

        {effectsOpen && (
          <div
            className="absolute right-3 bottom-3 z-20 w-[232px] rounded-[8px] border p-[6px]"
            style={{
              borderColor: '#8d8d8d',
              background:
                'linear-gradient(180deg, rgba(246,246,246,0.98) 0%, rgba(210,210,210,0.98) 100%)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
            }}
          >
            <div
              className="mb-[6px] flex items-center justify-between px-[4px] text-[10px]"
              style={{ color: '#5d5d5d' }}
            >
              <span className="font-bold tracking-wide uppercase">Effects</span>
              <span>{currentEffect.label}</span>
            </div>

            <div className="grid grid-cols-4 gap-[6px]">
              {EFFECTS.map((effect) => {
                const isActive = activeEffect === effect.id;

                return (
                  <button
                    key={effect.id}
                    type="button"
                    className="rounded-[5px] border p-[3px] text-left"
                    style={{
                      borderColor: isActive ? '#6689c7' : '#9a9a9a',
                      background: isActive
                        ? 'linear-gradient(180deg, #dce9ff 0%, #b7cef7 100%)'
                        : 'linear-gradient(180deg, #fcfcfc 0%, #d7d7d7 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
                    }}
                    onClick={() => {
                      setActiveEffect(effect.id);
                      setEffectsOpen(false);
                    }}
                  >
                    <span
                      className="mb-[3px] block h-[24px] rounded-[3px] border"
                      style={{
                        background: effect.swatch,
                        borderColor: 'rgba(0,0,0,0.16)',
                      }}
                    />
                    <span
                      className="block truncate text-center text-[9px]"
                      style={{ color: '#444' }}
                    >
                      {effect.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex h-[42px] shrink-0 items-center justify-between border-t px-[10px]"
        style={{
          borderTop: '1px solid #e8e8e8',
          borderBottom: '1px solid #9b9b9b',
          background:
            'linear-gradient(180deg, #dddddd 0%, #c9c9c9 52%, #b8b8b8 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        <div
          className="flex overflow-hidden rounded-[3px] border"
          style={{
            borderColor: '#828282',
            background: 'linear-gradient(180deg, #b1b1b1 0%, #9f9f9f 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
          }}
        >
          {VIEW_MODES.map((mode) => {
            const isActive = viewMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                aria-label={mode.label}
                className="flex h-[20px] w-[24px] items-center justify-center"
                style={{
                  color: isActive ? '#3a3a3a' : '#666',
                  background: isActive
                    ? 'linear-gradient(180deg, #f7f7f7 0%, #cdcdcd 100%)'
                    : 'transparent',
                  borderLeft:
                    mode.id === VIEW_MODES[0].id
                      ? 'none'
                      : '1px solid rgba(0,0,0,0.18)',
                  boxShadow: isActive
                    ? 'inset 0 1px 0 rgba(255,255,255,0.82)'
                    : 'none',
                }}
                onClick={() => setViewMode(mode.id)}
              >
                <ViewModeIcon mode={mode.id} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="flex h-[29px] w-[29px] items-center justify-center rounded-full"
          style={{
            color: '#fff',
            background: cameraReady
              ? 'radial-gradient(circle at 30% 30%, #ff8b88 0%, #ff5450 40%, #d51f1b 100%)'
              : 'radial-gradient(circle at 30% 30%, #d4d4d4 0%, #b7b7b7 100%)',
            border: '1px solid rgba(255,255,255,0.96)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.45), 0 1px 3px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
          onClick={capture}
          disabled={!cameraReady}
        >
          <ShutterIcon />
        </button>

        <button
          type="button"
          className="flex h-[20px] min-w-[82px] items-center justify-center rounded-[4px] border px-3 text-[11px]"
          style={{
            color: '#444',
            borderColor: effectsOpen ? '#6f8fc6' : '#868686',
            background: effectsOpen
              ? 'linear-gradient(180deg, #dce9ff 0%, #b4ccf3 100%)'
              : 'linear-gradient(180deg, #f8f8f8 0%, #cdcdcd 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
          }}
          onClick={() => setEffectsOpen((open) => !open)}
        >
          Effects
        </button>
      </div>

      {viewMode === 'filmstrip' && (
        <div
          className="shrink-0 border-t px-3 py-[9px]"
          style={{
            minHeight: '74px',
            borderTop: '1px solid #f7f7f7',
            background: 'linear-gradient(180deg, #f4f4f4 0%, #ececec 100%)',
          }}
        >
          {visiblePhotos.length > 0 ? (
            <MacScrollArea
              className="h-[58px]"
              orientation="horizontal"
              viewportClassName="flex gap-[8px] pb-[2px]"
            >
              {visiblePhotos.map((photo) => (
                <img
                  key={photo._id}
                  src={photo.url!}
                  alt="capture"
                  className="shrink-0 rounded-[2px]"
                  style={{
                    width: '80px',
                    height: '56px',
                    objectFit: 'cover',
                    border: '1px solid #b5b5b5',
                    background: '#fff',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.12)',
                  }}
                />
              ))}
            </MacScrollArea>
          ) : (
            <div
              className="h-full rounded-[2px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 46%, rgba(0,0,0,0.03) 100%)',
              }}
            />
          )}
        </div>
      )}

      <div
        className="flex h-[18px] shrink-0 items-center justify-center border-t text-[10px]"
        style={{
          borderTop: '1px solid #d0d0d0',
          background: 'linear-gradient(180deg, #efefef 0%, #dcdcdc 100%)',
          color: '#777',
          textShadow: '0 1px 0 rgba(255,255,255,0.65)',
        }}
      >
        {photoStatus}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
