import {
  useDeferredValue,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useMutation } from 'convex/react';
import { api } from '@template/backend';
import type { Id } from '@template/backend/dataModel';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';
import {
  Accessibility,
  BatteryCharging,
  Bluetooth,
  CalendarDays,
  Clock3,
  Cloud,
  Disc3,
  Globe,
  Hand,
  HardDrive,
  Keyboard,
  Mic,
  Monitor,
  Mouse,
  Package2,
  Palette,
  Printer,
  RefreshCcw,
  Search,
  Share2,
  Shield,
  Sparkles,
  Upload,
  Users,
  Volume2,
} from 'lucide-react';

type PaneId =
  | 'appearance'
  | 'desktop'
  | 'cds'
  | 'displays'
  | 'energy-saver'
  | 'keyboard'
  | 'mouse'
  | 'trackpad'
  | 'print-fax'
  | 'sound'
  | 'mobileme'
  | 'network'
  | 'bluetooth'
  | 'sharing'
  | 'accounts'
  | 'date-time'
  | 'parental-controls'
  | 'software-update'
  | 'speech'
  | 'startup-disk'
  | 'time-machine'
  | 'universal-access'
  | 'retrospect';

interface PaneDefinition {
  id: PaneId;
  label: string;
  section: string;
  searchTerms: string[];
  implemented?: boolean;
}

interface SystemPreferencesAppProps {
  ipKey: string | null;
  currentWallpaperUrl: string | null;
  defaultWallpaperUrl: string;
}

const PANES: PaneDefinition[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    section: 'Personal',
    searchTerms: ['theme', 'style', 'aqua'],
  },
  {
    id: 'desktop',
    label: 'Desktop & Screen Saver',
    section: 'Personal',
    searchTerms: ['wallpaper', 'background', 'screen saver', 'desktop'],
    implemented: true,
  },
  {
    id: 'cds',
    label: 'CDs & DVDs',
    section: 'Hardware',
    searchTerms: ['disc', 'optical'],
  },
  {
    id: 'displays',
    label: 'Displays',
    section: 'Hardware',
    searchTerms: ['monitor', 'resolution'],
  },
  {
    id: 'energy-saver',
    label: 'Energy Saver',
    section: 'Hardware',
    searchTerms: ['battery', 'sleep', 'power'],
  },
  {
    id: 'keyboard',
    label: 'Keyboard',
    section: 'Hardware',
    searchTerms: ['typing', 'input'],
  },
  {
    id: 'mouse',
    label: 'Mouse',
    section: 'Hardware',
    searchTerms: ['pointer', 'scroll'],
  },
  {
    id: 'trackpad',
    label: 'Trackpad',
    section: 'Hardware',
    searchTerms: ['gesture', 'touch'],
  },
  {
    id: 'print-fax',
    label: 'Print & Fax',
    section: 'Hardware',
    searchTerms: ['printer', 'fax'],
  },
  {
    id: 'sound',
    label: 'Sound',
    section: 'Hardware',
    searchTerms: ['audio', 'speaker'],
  },
  {
    id: 'mobileme',
    label: 'MobileMe',
    section: 'Internet & Wireless',
    searchTerms: ['cloud', 'sync'],
  },
  {
    id: 'network',
    label: 'Network',
    section: 'Internet & Wireless',
    searchTerms: ['internet', 'ethernet', 'wifi'],
  },
  {
    id: 'bluetooth',
    label: 'Bluetooth',
    section: 'Internet & Wireless',
    searchTerms: ['wireless', 'device'],
  },
  {
    id: 'sharing',
    label: 'Sharing',
    section: 'Internet & Wireless',
    searchTerms: ['share', 'network'],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    section: 'System',
    searchTerms: ['users', 'login'],
  },
  {
    id: 'date-time',
    label: 'Date & Time',
    section: 'System',
    searchTerms: ['clock', 'calendar'],
  },
  {
    id: 'parental-controls',
    label: 'Parental Controls',
    section: 'System',
    searchTerms: ['family', 'restrictions'],
  },
  {
    id: 'software-update',
    label: 'Software Update',
    section: 'System',
    searchTerms: ['update', 'system'],
  },
  {
    id: 'speech',
    label: 'Speech',
    section: 'System',
    searchTerms: ['voice', 'microphone'],
  },
  {
    id: 'startup-disk',
    label: 'Startup Disk',
    section: 'System',
    searchTerms: ['disk', 'boot'],
  },
  {
    id: 'time-machine',
    label: 'Time Machine',
    section: 'System',
    searchTerms: ['backup', 'restore'],
  },
  {
    id: 'universal-access',
    label: 'Universal Access',
    section: 'System',
    searchTerms: ['accessibility', 'assistive'],
  },
  {
    id: 'retrospect',
    label: 'Retrospect',
    section: 'Other',
    searchTerms: ['backup', 'retro'],
  },
];

const SECTION_ORDER = [
  'Personal',
  'Hardware',
  'Internet & Wireless',
  'System',
  'Other',
] as const;

function PreferenceGlyph({ paneId }: { paneId: PaneId }) {
  const commonProps = {
    size: 24,
    strokeWidth: 1.8,
  };

  const shell: CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: 13,
    border: '1px solid rgba(109,126,145,0.55)',
    boxShadow:
      '0 1px 0 rgba(255,255,255,0.95) inset, 0 8px 10px rgba(62,76,92,0.14)',
    background:
      'radial-gradient(circle at 32% 25%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.8) 22%, rgba(207,220,235,0.96) 58%, rgba(157,176,197,0.98) 100%)',
  };

  const shellClassName =
    'relative flex items-center justify-center overflow-hidden';

  switch (paneId) {
    case 'appearance':
      return (
        <div className={shellClassName} style={shell}>
          <Palette {...commonProps} color="#506b84" />
        </div>
      );
    case 'desktop':
      return (
        <div className={shellClassName} style={shell}>
          <Monitor {...commonProps} color="#4c6988" />
          <Sparkles
            size={14}
            strokeWidth={2}
            color="#7eaaf6"
            className="absolute top-2 right-2"
          />
        </div>
      );
    case 'cds':
      return (
        <div className={shellClassName} style={shell}>
          <Disc3 {...commonProps} color="#7f8a93" />
        </div>
      );
    case 'displays':
      return (
        <div className={shellClassName} style={shell}>
          <Monitor {...commonProps} color="#4f6f95" />
        </div>
      );
    case 'energy-saver':
      return (
        <div className={shellClassName} style={shell}>
          <BatteryCharging {...commonProps} color="#d4a500" />
        </div>
      );
    case 'keyboard':
      return (
        <div className={shellClassName} style={shell}>
          <Keyboard {...commonProps} color="#767676" />
        </div>
      );
    case 'mouse':
      return (
        <div className={shellClassName} style={shell}>
          <Mouse {...commonProps} color="#7f8f9d" />
        </div>
      );
    case 'trackpad':
      return (
        <div className={shellClassName} style={shell}>
          <Hand {...commonProps} color="#7f7f7f" />
        </div>
      );
    case 'print-fax':
      return (
        <div className={shellClassName} style={shell}>
          <Printer {...commonProps} color="#656565" />
        </div>
      );
    case 'sound':
      return (
        <div className={shellClassName} style={shell}>
          <Volume2 {...commonProps} color="#767d8a" />
        </div>
      );
    case 'mobileme':
      return (
        <div className={shellClassName} style={shell}>
          <Cloud {...commonProps} color="#6aa6e7" />
        </div>
      );
    case 'network':
      return (
        <div className={shellClassName} style={shell}>
          <Globe {...commonProps} color="#5f7fa2" />
        </div>
      );
    case 'bluetooth':
      return (
        <div className={shellClassName} style={shell}>
          <Bluetooth {...commonProps} color="#3d6dff" />
        </div>
      );
    case 'sharing':
      return (
        <div className={shellClassName} style={shell}>
          <Share2 {...commonProps} color="#66844d" />
        </div>
      );
    case 'accounts':
      return (
        <div className={shellClassName} style={shell}>
          <Users {...commonProps} color="#202020" />
        </div>
      );
    case 'date-time':
      return (
        <div className={shellClassName} style={shell}>
          <CalendarDays {...commonProps} color="#817a54" />
        </div>
      );
    case 'parental-controls':
      return (
        <div className={shellClassName} style={shell}>
          <Shield {...commonProps} color="#d0a11f" />
        </div>
      );
    case 'software-update':
      return (
        <div className={shellClassName} style={shell}>
          <RefreshCcw {...commonProps} color="#5c82d5" />
        </div>
      );
    case 'speech':
      return (
        <div className={shellClassName} style={shell}>
          <Mic {...commonProps} color="#777" />
        </div>
      );
    case 'startup-disk':
      return (
        <div className={shellClassName} style={shell}>
          <HardDrive {...commonProps} color="#7e7e7e" />
        </div>
      );
    case 'time-machine':
      return (
        <div className={shellClassName} style={shell}>
          <Clock3 {...commonProps} color="#5a807d" />
        </div>
      );
    case 'universal-access':
      return (
        <div className={shellClassName} style={shell}>
          <Accessibility {...commonProps} color="#4e74e4" />
        </div>
      );
    case 'retrospect':
      return (
        <div className={shellClassName} style={shell}>
          <Package2 {...commonProps} color="#9a1616" />
        </div>
      );
  }
}

function WallpaperPreview({
  wallpaperUrl,
  wallpaperLabel,
}: {
  wallpaperUrl: string;
  wallpaperLabel: string;
}) {
  return (
    <div
      className="mx-auto overflow-hidden rounded-[12px] border p-3"
      style={{
        borderColor: '#9eabb8',
        background: 'linear-gradient(180deg, #f6f9fd 0%, #dbe4ef 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.95) inset, 0 10px 24px rgba(67,86,105,0.16)',
      }}
    >
      <div
        className="overflow-hidden rounded-[8px] border"
        style={{
          borderColor: '#8c9aaa',
          aspectRatio: '16 / 10',
          background: '#dbe6f4',
          boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset',
        }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <img
            src={wallpaperUrl}
            alt={wallpaperLabel}
            className="h-full w-full object-cover"
          />

          <div
            className="absolute top-0 right-0 left-0 h-4"
            style={{
              background:
                'linear-gradient(180deg, rgba(240,240,240,0.96) 0%, rgba(216,216,216,0.82) 100%)',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
          />

          <div className="absolute top-7 right-3 flex flex-col gap-3">
            <div className="flex flex-col items-center gap-1">
              <img
                src="/os-x/hd.png"
                alt=""
                width={28}
                height={28}
                draggable={false}
              />
              <span
                className="text-[9px]"
                style={{
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.75)',
                }}
              >
                Macintosh HD
              </span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <div
              className="h-11 w-[170px] rounded-[18px] px-2"
              style={{
                background:
                  'linear-gradient(180deg, rgba(253,253,253,0.78) 0%, rgba(214,219,226,0.72) 100%)',
                border: '1px solid rgba(126,136,149,0.56)',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.8) inset, 0 8px 14px rgba(0,0,0,0.22)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopAndScreenSaverPane({
  ipKey,
  currentWallpaperUrl,
  defaultWallpaperUrl,
}: {
  ipKey: string | null;
  currentWallpaperUrl: string | null;
  defaultWallpaperUrl: string;
}) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const generateUploadUrl = useMutation(api.wallpapers.generateUploadUrl);
  const saveWallpaper = useMutation(api.wallpapers.saveForIpKey);
  const clearWallpaper = useMutation(api.wallpapers.clearForIpKey);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);

  const activeWallpaperUrl = currentWallpaperUrl ?? defaultWallpaperUrl;
  const activeWallpaperLabel = currentWallpaperUrl
    ? 'Uploaded Wallpaper'
    : 'Aurora Default';

  async function handleFileSelection(file: File | null) {
    if (!file) {
      return;
    }

    if (!ipKey) {
      setUploadError('Resolving your connection. Try again in a moment.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Choose an image file for the desktop background.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setStatusText(`Uploading ${file.name}...`);

    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed.');
      }

      const { storageId } = (await response.json()) as {
        storageId: Id<'_storage'>;
      };

      await saveWallpaper({
        ipKey,
        storageId,
        fileName: file.name,
        mimeType: file.type,
      });

      setStatusText(`${file.name} is now your desktop picture.`);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : 'Unable to set that picture right now.'
      );
      setStatusText(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleRestoreDefault() {
    if (!ipKey || !currentWallpaperUrl) {
      setStatusText('Using the default Aurora desktop picture.');
      setUploadError(null);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await clearWallpaper({ ipKey });
      setStatusText('Restored the default Aurora desktop picture.');
    } catch {
      setUploadError('Unable to restore the default desktop picture.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[170px_minmax(0,1fr)]">
      <aside
        className="min-h-0 border-r"
        style={{
          borderColor: '#b9c1ca',
          background: 'linear-gradient(180deg, #eceff3 0%, #d8dde4 100%)',
        }}
      >
        <div className="px-4 py-4">
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{ color: '#7a8087' }}
          >
            Collections
          </p>
        </div>

        <div className="space-y-1 px-2 pb-3">
          {[
            { label: 'Apple', selected: true },
            { label: 'Pictures Folder', selected: false },
            { label: 'Uploads', selected: false },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center rounded-[6px] px-3 py-[6px] text-left text-[12px]"
              style={{
                background: item.selected
                  ? 'linear-gradient(180deg, #6fbfff 0%, #3c83dc 100%)'
                  : 'transparent',
                color: item.selected ? '#fff' : '#26303b',
                textShadow: item.selected
                  ? '0 1px 0 rgba(0,0,0,0.2)'
                  : '0 1px 0 rgba(255,255,255,0.75)',
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <div
        className="flex min-h-0 flex-col"
        style={{
          background: 'linear-gradient(180deg, #f6f7f9 0%, #ebedf1 100%)',
        }}
      >
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{
            borderColor: '#bcc5cf',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(222,227,233,0.75) 100%)',
          }}
        >
          <button
            className="rounded-[6px] px-3 py-[4px] text-[12px] font-semibold"
            style={{
              background: 'linear-gradient(180deg, #6fbfff 0%, #3c83dc 100%)',
              border: '1px solid #2f6db4',
              color: '#fff',
              textShadow: '0 1px 0 rgba(0,0,0,0.18)',
            }}
            type="button"
          >
            Desktop
          </button>
          <button
            className="rounded-[6px] px-3 py-[4px] text-[12px]"
            style={{
              background: 'linear-gradient(180deg, #fdfdfd 0%, #d8dde3 100%)',
              border: '1px solid #b3bcc6',
              color: '#707780',
              textShadow: '0 1px 0 rgba(255,255,255,0.75)',
            }}
            type="button"
          >
            Screen Saver
          </button>
        </div>

        <MacScrollArea
          className="min-h-0 flex-1"
          orientation="vertical"
          viewportClassName="p-5"
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
            <div className="space-y-4">
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.24em] uppercase"
                  style={{ color: '#7f8790' }}
                >
                  Desktop Preview
                </p>
                <div className="mt-3 max-w-[440px]">
                  <WallpaperPreview
                    wallpaperUrl={activeWallpaperUrl}
                    wallpaperLabel={activeWallpaperLabel}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className="overflow-hidden rounded-[10px] border text-left transition-transform hover:-translate-y-0.5"
                  style={{
                    borderColor: currentWallpaperUrl ? '#c3ccd5' : '#3a79c7',
                    background: '#fff',
                    boxShadow: currentWallpaperUrl
                      ? '0 1px 0 rgba(255,255,255,0.85) inset'
                      : '0 0 0 2px rgba(76,138,223,0.22)',
                  }}
                  onClick={handleRestoreDefault}
                  type="button"
                >
                  <img
                    src={defaultWallpaperUrl}
                    alt="Aurora default"
                    className="block h-28 w-full object-cover"
                  />
                  <div className="px-3 py-2">
                    <p
                      className="text-[12px] font-semibold"
                      style={{ color: '#24303c' }}
                    >
                      Aurora Default
                    </p>
                    <p className="text-[10px]" style={{ color: '#6e7680' }}>
                      Standard early Mac OS X blue.
                    </p>
                  </div>
                </button>

                <label
                  htmlFor={fileInputId}
                  className="block cursor-pointer overflow-hidden rounded-[10px] border transition-transform hover:-translate-y-0.5"
                  style={{
                    borderColor: currentWallpaperUrl ? '#3a79c7' : '#c3ccd5',
                    background: '#fff',
                    boxShadow: currentWallpaperUrl
                      ? '0 0 0 2px rgba(76,138,223,0.22)'
                      : '0 1px 0 rgba(255,255,255,0.85) inset',
                  }}
                >
                  {currentWallpaperUrl ? (
                    <img
                      src={currentWallpaperUrl}
                      alt="Uploaded wallpaper"
                      className="block h-28 w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-28 items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(180deg, #edf2f7 0%, #d8e0ea 100%)',
                      }}
                    >
                      <Upload size={26} color="#72849a" />
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <p
                      className="text-[12px] font-semibold"
                      style={{ color: '#24303c' }}
                    >
                      {currentWallpaperUrl
                        ? 'Uploaded Wallpaper'
                        : 'Choose Picture...'}
                    </p>
                    <p className="text-[10px]" style={{ color: '#6e7680' }}>
                      Upload a custom desktop picture.
                    </p>
                  </div>
                </label>
              </div>

              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleFileSelection(file);
                }}
              />
            </div>

            <div
              className="rounded-[12px] border p-4"
              style={{
                borderColor: '#c5ccd4',
                background: 'rgba(255,255,255,0.7)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset',
              }}
            >
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase"
                style={{ color: '#7f8790' }}
              >
                Current Selection
              </p>
              <p
                className="mt-3 text-[18px] font-semibold"
                style={{ color: '#24303c' }}
              >
                {activeWallpaperLabel}
              </p>
              <p
                className="mt-1 text-[12px] leading-5"
                style={{ color: '#5d6670' }}
              >
                Choose a desktop picture to update the wallpaper for this
                connection.
              </p>

              <div
                className="mt-4 rounded-[10px] border px-3 py-3"
                style={{
                  borderColor: '#ced5dc',
                  background:
                    'linear-gradient(180deg, #fdfefe 0%, #eef2f6 100%)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Monitor size={16} color="#4e6b8b" />
                  <span className="text-[12px]" style={{ color: '#34414e' }}>
                    Desktop updates immediately
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <HardDrive size={16} color="#707780" />
                  <span className="text-[12px]" style={{ color: '#34414e' }}>
                    Stored by IP-derived preference key
                  </span>
                </div>
              </div>

              <button
                className="mt-4 inline-flex items-center rounded-[7px] px-3 py-[6px] text-[12px] font-semibold"
                style={{
                  background:
                    'linear-gradient(180deg, #fdfdfd 0%, #d8dde3 100%)',
                  border: '1px solid #b4bcc6',
                  color: '#2f3b47',
                  textShadow: '0 1px 0 rgba(255,255,255,0.9)',
                  opacity: isUploading ? 0.75 : 1,
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                type="button"
              >
                Choose Picture...
              </button>

              {statusText ? (
                <p className="mt-3 text-[11px]" style={{ color: '#5e768d' }}>
                  {statusText}
                </p>
              ) : null}

              {uploadError ? (
                <p className="mt-3 text-[11px]" style={{ color: '#b03b33' }}>
                  {uploadError}
                </p>
              ) : null}
            </div>
          </div>
        </MacScrollArea>
      </div>
    </div>
  );
}

export function SystemPreferencesApp({
  ipKey,
  currentWallpaperUrl,
  defaultWallpaperUrl,
}: SystemPreferencesAppProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPaneId, setSelectedPaneId] = useState<PaneId | null>(null);
  const [alertPane, setAlertPane] = useState<PaneDefinition | null>(null);
  const deferredSearch = useDeferredValue(searchValue);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredSections = SECTION_ORDER.map((section) => ({
    section,
    panes: PANES.filter((pane) => {
      if (pane.section !== section) return false;
      if (!normalizedSearch) return true;
      const searchHaystack = [pane.label, ...pane.searchTerms]
        .join(' ')
        .toLowerCase();
      return searchHaystack.includes(normalizedSearch);
    }),
  })).filter(({ panes }) => panes.length > 0);

  const selectedPane = selectedPaneId
    ? (PANES.find((pane) => pane.id === selectedPaneId) ?? null)
    : null;

  function openPane(pane: PaneDefinition) {
    if (pane.implemented) {
      setSelectedPaneId(pane.id);
      return;
    }

    setAlertPane(pane);
  }

  const alertCopy =
    alertPane?.id === 'retrospect'
      ? {
          title: 'Loading Retrospect...',
          body: `To use the "${alertPane.label}" preferences pane, System Preferences must quit and reopen.`,
        }
      : alertPane
        ? {
            title: `Loading ${alertPane.label}...`,
            body: `The "${alertPane.label}" preferences pane is not available yet.`,
          }
        : null;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{
        background: '#e7eaee',
        fontFamily: "'Lucida Grande', Geneva, 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-[6px]"
        style={{
          borderColor: '#989ea6',
          background:
            'linear-gradient(180deg, #d7d7d7 0%, #bdbdbd 55%, #b3b3b3 100%)',
        }}
      >
        <button
          className="flex h-[22px] w-[26px] items-center justify-center rounded-[4px]"
          style={{
            background: selectedPane
              ? 'linear-gradient(180deg, #fefefe 0%, #d9d9d9 100%)'
              : 'linear-gradient(180deg, #d9d9d9 0%, #c1c1c1 100%)',
            border: '1px solid #8e8e8e',
            color: selectedPane ? '#2d343c' : '#8b8f94',
          }}
          onClick={() => setSelectedPaneId(null)}
          disabled={!selectedPane}
          type="button"
        >
          {'<'}
        </button>
        <button
          className="flex h-[22px] w-[26px] items-center justify-center rounded-[4px]"
          style={{
            background: 'linear-gradient(180deg, #d9d9d9 0%, #c1c1c1 100%)',
            border: '1px solid #8e8e8e',
            color: '#8b8f94',
          }}
          disabled
          type="button"
        >
          {'>'}
        </button>
        <button
          className="rounded-[6px] px-3 py-[3px] text-[12px]"
          style={{
            background: 'linear-gradient(180deg, #fbfbfb 0%, #d9d9d9 100%)',
            border: '1px solid #8f8f8f',
            color: '#2c343c',
            textShadow: '0 1px 0 rgba(255,255,255,0.82)',
          }}
          onClick={() => setSelectedPaneId(null)}
          type="button"
        >
          Show All
        </button>

        <div className="flex-1" />

        <div
          className="flex h-[28px] w-[188px] items-center gap-2 rounded-full px-3"
          style={{
            border: '1px solid rgba(136,136,136,0.8)',
            background: 'linear-gradient(180deg, #fbfbfb 0%, #f0f0f0 100%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset',
          }}
        >
          <Search size={14} color="#7b7b7b" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search"
            className="w-full border-0 bg-transparent text-[12px] outline-none"
            style={{ color: '#2c343c' }}
          />
        </div>
      </div>

      {selectedPane?.id === 'desktop' ? (
        <DesktopAndScreenSaverPane
          ipKey={ipKey}
          currentWallpaperUrl={currentWallpaperUrl}
          defaultWallpaperUrl={defaultWallpaperUrl}
        />
      ) : (
        <MacScrollArea
          className="min-h-0 flex-1"
          orientation="vertical"
          style={{ background: '#efefef' }}
        >
          {filteredSections.length > 0 ? (
            filteredSections.map(({ section, panes }) => (
              <section
                key={section}
                className="border-b"
                style={{
                  borderColor: '#cfcfcf',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.95) inset',
                }}
              >
                <div className="px-5 py-2">
                  <h2
                    className="text-[13px] font-bold"
                    style={{ color: '#111' }}
                  >
                    {section}
                  </h2>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-y-5 px-4 pb-4">
                  {panes.map((pane) => (
                    <button
                      key={pane.id}
                      className="flex flex-col items-center gap-1 rounded-[8px] px-1 py-1 text-center transition-colors hover:bg-white/55"
                      onClick={() => openPane(pane)}
                      type="button"
                    >
                      <PreferenceGlyph paneId={pane.id} />
                      <span
                        className="max-w-[88px] text-[11px] leading-[14px]"
                        style={{ color: '#000' }}
                      >
                        {pane.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <div className="max-w-[300px] text-center">
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: '#2a3139' }}
                >
                  No preference panes match "{searchValue}".
                </p>
                <p className="mt-2 text-[11px]" style={{ color: '#67707a' }}>
                  Try searching for wallpaper, displays, or bluetooth.
                </p>
              </div>
            </div>
          )}
        </MacScrollArea>
      )}

      {alertPane && alertCopy ? (
        <div
          className="absolute inset-0 flex items-start justify-center px-6 pt-9"
          style={{ background: 'rgba(0,0,0,0.18)' }}
        >
          <div
            className="w-full max-w-[430px] overflow-hidden rounded-[6px] border"
            style={{
              borderColor: '#8f8f8f',
              background: '#f3f3f3',
              boxShadow: '0 20px 40px rgba(0,0,0,0.28)',
            }}
          >
            <div
              className="border-b px-4 py-2 text-center text-[14px] font-semibold"
              style={{
                borderColor: '#b1b1b1',
                background:
                  'linear-gradient(180deg, #d6d6d6 0%, #b9b9b9 56%, #afafaf 100%)',
                color: '#2c343c',
                textShadow: '0 1px 0 rgba(255,255,255,0.74)',
              }}
            >
              {alertCopy.title}
            </div>

            <div className="flex gap-4 px-5 py-5">
              <div className="pt-1">
                <PreferenceGlyph paneId={alertPane.id} />
              </div>

              <div className="min-w-0 pt-1">
                <p
                  className="text-[13px] leading-5"
                  style={{ color: '#171a1d' }}
                >
                  {alertCopy.body}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 pb-4">
              <button
                className="min-w-[90px] rounded-full px-4 py-[4px] text-[12px]"
                style={{
                  background:
                    'linear-gradient(180deg, #ffffff 0%, #dddddd 100%)',
                  border: '1px solid #a4a4a4',
                  color: '#30363d',
                }}
                onClick={() => setAlertPane(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-w-[90px] rounded-full px-4 py-[4px] text-[12px]"
                style={{
                  background:
                    'linear-gradient(180deg, #9fdcff 0%, #4aa8ff 45%, #1970d1 100%)',
                  border: '1px solid #2a79c8',
                  color: '#fff',
                  textShadow: '0 1px 0 rgba(0,0,0,0.2)',
                }}
                onClick={() => setAlertPane(null)}
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
