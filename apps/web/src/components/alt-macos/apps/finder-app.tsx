import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

interface Project {
  id: string;
  title: string;
  company: string;
  timeline: string;
  role: string;
  description: string;
  achievements: Array<{
    description: string;
    impact?: string;
    technologies: string[];
    type: string;
  }>;
  technologies: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    databases: string[];
    tools: string[];
  };
  domains: string[];
  url?: string;
}

interface FinderAppProps {
  projects: Project[];
  mode?: 'finder' | 'trash';
  windowId?: string;
  onTitleChange?: (windowId: string, title: string) => void;
}

type FinderLocation =
  | 'guest'
  | 'macintosh-hd'
  | 'idisk'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'applications'
  | 'library'
  | 'movies'
  | 'music'
  | 'pictures'
  | 'public'
  | 'sites'
  | 'trash';

interface GridItem {
  id: string;
  label: string;
  kind: 'folder' | 'document' | 'drive' | 'app' | 'trash';
  iconSrc?: string;
  action?: FinderLocation;
  subtitle?: string;
}

interface TrashItem {
  id: string;
  name: string;
  kind: string;
  dateAdded: string;
  quip: string;
}

type FinderViewMode = 'icon' | 'list' | 'columns';

interface BrowserItem {
  id: string;
  label: string;
  kind: GridItem['kind'];
  kindLabel: string;
  iconSrc?: string;
  action?: FinderLocation;
  subtitle?: string;
  dateLabel?: string;
  sizeLabel?: string;
  note?: string;
  project?: Project;
  trashItem?: TrashItem;
}

const GUEST_FOLDERS: GridItem[] = [
  { id: 'desktop', label: 'Desktop', kind: 'folder', action: 'desktop' },
  { id: 'documents', label: 'Documents', kind: 'folder', action: 'documents' },
  { id: 'downloads', label: 'Downloads', kind: 'folder', action: 'downloads' },
  { id: 'library', label: 'Library', kind: 'folder', action: 'library' },
  { id: 'movies', label: 'Movies', kind: 'folder', action: 'movies' },
  { id: 'music', label: 'Music', kind: 'folder', action: 'music' },
  { id: 'pictures', label: 'Pictures', kind: 'folder', action: 'pictures' },
  { id: 'public', label: 'Public', kind: 'folder', action: 'public' },
  { id: 'sites', label: 'Sites', kind: 'folder', action: 'sites' },
];

const DESKTOP_FOLDERS: GridItem[] = [
  {
    id: 'macintosh-hd',
    label: 'Macintosh HD',
    kind: 'drive',
    action: 'macintosh-hd',
  },
  {
    id: 'documents-shortcut',
    label: 'Documents',
    kind: 'folder',
    action: 'documents',
  },
  {
    id: 'downloads-shortcut',
    label: 'Downloads',
    kind: 'folder',
    action: 'downloads',
  },
];

const APPLICATION_ITEMS: GridItem[] = [
  {
    id: 'app-safari',
    label: 'Safari',
    kind: 'app',
    iconSrc: '/os-x/safari.png',
  },
  { id: 'app-mail', label: 'Mail', kind: 'app', iconSrc: '/os-x/mail.png' },
  {
    id: 'app-ichat',
    label: 'iChat',
    kind: 'app',
    iconSrc: '/os-x/imessage.png',
  },
  {
    id: 'app-stickies',
    label: 'Stickies',
    kind: 'app',
    iconSrc: '/os-x/stickies.png',
  },
  {
    id: 'app-terminal',
    label: 'Terminal',
    kind: 'app',
    iconSrc: '/os-x/terminal.png',
  },
  {
    id: 'app-photobooth',
    label: 'Photo Booth',
    kind: 'app',
    iconSrc: '/os-x/photo-booth.png',
  },
];

const DOWNLOAD_ITEMS: GridItem[] = [
  {
    id: 'brief',
    label: 'client-brief-rev4.pdf',
    kind: 'document',
    subtitle: 'PDF Document',
  },
  {
    id: 'deck',
    label: 'launch-plan-actually-final.key',
    kind: 'document',
    subtitle: 'Keynote Presentation',
  },
  {
    id: 'notes',
    label: 'airport-brainstorm.txt',
    kind: 'document',
    subtitle: 'Plain Text Document',
  },
];

const TRASH_ITEMS: TrashItem[] = [
  {
    id: 'music-career',
    name: 'music-career.pdf',
    kind: 'PDF Document',
    dateAdded: 'Today, 8:47 AM',
    quip: 'Proof that the former touring act eventually multiclassed into software.',
  },
  {
    id: 'synergy-deck',
    name: 'synergy-strategy-FINAL-v18.key',
    kind: 'Keynote Presentation',
    dateAdded: 'Today, 9:04 AM',
    quip: 'Retired after the word "synergy" started appearing in dreams.',
  },
  {
    id: 'invoice',
    name: 'invoice-definitely-not-scary.pdf',
    kind: 'PDF Document',
    dateAdded: 'Yesterday, 6:12 PM',
    quip: 'Accounting requested fewer suspense elements.',
  },
  {
    id: 'sketch',
    name: 'pixel-perfect-ish.sketch',
    kind: 'Sketch Document',
    dateAdded: 'Yesterday, 3:28 PM',
    quip: 'Looked perfect from several feet away and one hallway over.',
  },
  {
    id: 'readme',
    name: 'README_for_future_me.txt',
    kind: 'Plain Text Document',
    dateAdded: 'March 20, 11:17 PM',
    quip: 'Future me opened it, sighed, and threw it back in here.',
  },
  {
    id: 'checklist',
    name: 'launch-checklist-actually-final.pages',
    kind: 'Pages Document',
    dateAdded: 'March 20, 7:55 PM',
    quip: 'The title and reality had a complicated relationship.',
  },
  {
    id: 'script',
    name: 'do-not-double-click.command',
    kind: 'Unix Executable',
    dateAdded: 'March 18, 2:02 AM',
    quip: 'Someone double-clicked it. Science was done.',
  },
  {
    id: 'feedback',
    name: 'client-feedback-but-make-it-vague.doc',
    kind: 'Word Document',
    dateAdded: 'March 17, 4:41 PM',
    quip: 'Contains "can it pop more?" enough times to qualify as poetry.',
  },
];

function FolderIcon({ size = 16 }: { size?: number }) {
  return (
    <img
      src="/os-x/finder.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}

function DocIcon({ size = 16 }: { size?: number }) {
  return (
    <img
      src="/os-x/document.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}

function HardDriveIcon({ size = 16 }: { size?: number }) {
  return (
    <img
      src="/os-x/hd.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <img
      src="/os-x/trash-full.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}

function SidebarDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-full"
      style={{
        width: '8px',
        height: '8px',
        background: color,
        boxShadow: '0 1px 0 rgba(255,255,255,0.55)',
      }}
    />
  );
}

function ToolbarArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path
        d={
          direction === 'left'
            ? 'M5.75 1.5 2.25 4.5l3.5 3'
            : 'm3.25 1.5 3.5 3-3.5 3'
        }
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ToolbarViewIcon({ mode }: { mode: FinderViewMode }) {
  if (mode === 'icon') {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="1.25"
          y="1.25"
          width="3"
          height="3"
          rx="0.6"
          fill="currentColor"
        />
        <rect
          x="7.75"
          y="1.25"
          width="3"
          height="3"
          rx="0.6"
          fill="currentColor"
        />
        <rect
          x="1.25"
          y="7.75"
          width="3"
          height="3"
          rx="0.6"
          fill="currentColor"
        />
        <rect
          x="7.75"
          y="7.75"
          width="3"
          height="3"
          rx="0.6"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (mode === 'list') {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="1.25"
          y="1.8"
          width="1.8"
          height="1.8"
          rx="0.55"
          fill="currentColor"
        />
        <rect
          x="1.25"
          y="5.1"
          width="1.8"
          height="1.8"
          rx="0.55"
          fill="currentColor"
        />
        <rect
          x="1.25"
          y="8.4"
          width="1.8"
          height="1.8"
          rx="0.55"
          fill="currentColor"
        />
        <path
          d="M4.2 2.7h6.3M4.2 6h6.3M4.2 9.3h6.3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
    );
  }

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1.1"
        y="1.1"
        width="2.35"
        height="9.8"
        rx="0.7"
        fill="currentColor"
      />
      <rect
        x="4.85"
        y="1.1"
        width="2.35"
        height="9.8"
        rx="0.7"
        fill="currentColor"
      />
      <rect
        x="8.55"
        y="1.1"
        width="2.35"
        height="9.8"
        rx="0.7"
        fill="currentColor"
      />
    </svg>
  );
}

function ToolbarGearIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m6 1.35.68.32.72-.18.45.58.73.08.16.7.6.4-.16.71.35.64-.45.58.08.73-.68.32-.32.68-.73-.08-.58.45-.64-.35-.71.16-.4-.6-.7-.16-.08-.73-.58-.45.18-.72L1.35 6l.32-.68-.18-.72.58-.45.08-.73.7-.16.4-.6.71.16.64-.35.58.45Z"
        fill="currentColor"
        opacity="0.95"
      />
      <circle cx="6" cy="6" r="1.45" fill="rgba(255,255,255,0.92)" />
    </svg>
  );
}

function ToolbarSearchIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="4.8"
        cy="4.8"
        r="3.15"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="m7.2 7.2 2.2 2.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ToolbarControlGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex overflow-hidden rounded-[4px]"
      style={{
        border: '1px solid rgba(52,52,52,0.34)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.82), 0 1px 0 rgba(255,255,255,0.28)',
      }}
    >
      {children}
    </div>
  );
}

function ToolbarButton({
  icon,
  onClick,
  disabled = false,
  title,
  active = false,
  isLast = false,
  width = 24,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title: string;
  active?: boolean;
  isLast?: boolean;
  width?: number;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      className="flex h-[22px] items-center justify-center"
      style={{
        width: `${width}px`,
        background: active
          ? 'linear-gradient(180deg, #b8d3ee 0%, #7ea7d2 48%, #5c7fa7 100%)'
          : 'linear-gradient(180deg, #fbfbfb 0%, #ececec 48%, #d3d3d3 100%)',
        borderRight: isLast ? 'none' : '1px solid rgba(70,70,70,0.24)',
        color: active ? '#fff' : '#4f5f6f',
        textShadow: active
          ? '0 -1px 0 rgba(0,0,0,0.28)'
          : '0 1px 0 rgba(255,255,255,0.74)',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(34,63,95,0.24)'
          : 'inset 0 1px 0 rgba(255,255,255,0.84)',
        opacity: disabled ? 0.45 : 1,
      }}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function formatPseudoSize(sizeInKilobytes: number) {
  if (sizeInKilobytes >= 1024) {
    return `${(sizeInKilobytes / 1024).toFixed(1)} MB`;
  }
  return `${sizeInKilobytes} KB`;
}

function getProjectDate(timeline: string) {
  return (
    timeline.split('–')[0]?.trim() || timeline.split('-')[0]?.trim() || timeline
  );
}

function getLocationLabel(location: FinderLocation) {
  switch (location) {
    case 'guest':
      return 'Guest';
    case 'macintosh-hd':
      return 'Macintosh HD';
    case 'desktop':
      return 'Desktop';
    case 'documents':
      return 'Documents';
    case 'downloads':
      return 'Downloads';
    case 'applications':
      return 'Applications';
    case 'library':
      return 'Library';
    case 'movies':
      return 'Movies';
    case 'music':
      return 'Music';
    case 'pictures':
      return 'Pictures';
    case 'public':
      return 'Public';
    case 'sites':
      return 'Sites';
    case 'trash':
      return 'Trash';
    case 'idisk':
      return 'iDisk';
    default:
      return 'Finder';
  }
}

function getPreferredViewMode(location: FinderLocation): FinderViewMode {
  return location === 'documents' || location === 'trash' ? 'list' : 'icon';
}

const LOCATION_PARENTS: Partial<Record<FinderLocation, FinderLocation>> = {
  guest: 'macintosh-hd',
  desktop: 'guest',
  documents: 'guest',
  downloads: 'guest',
  applications: 'guest',
  library: 'guest',
  movies: 'guest',
  music: 'guest',
  pictures: 'guest',
  public: 'guest',
  sites: 'guest',
  trash: 'guest',
};

const EMPTY_LOCATION_COPY: Partial<
  Record<FinderLocation, { title: string; note: string }>
> = {
  library: {
    title: 'Library',
    note: 'System odds and ends stay neatly stacked here.',
  },
  movies: {
    title: 'Movies',
    note: 'No trailers. Just tasteful restraint.',
  },
  music: {
    title: 'Music',
    note: 'Silent, but in an intentional way.',
  },
  pictures: {
    title: 'Pictures',
    note: 'The camera roll is elsewhere on purpose.',
  },
  public: {
    title: 'Public',
    note: 'Polite, empty, and ready for guests.',
  },
  sites: {
    title: 'Sites',
    note: 'A tiny web empire used to live here.',
  },
};

const FINDER_SCROLL_PANE_CLASS_NAME =
  'finder-scroll-pane min-h-0 min-w-0 overscroll-contain';

export function FinderApp({
  projects,
  mode = 'finder',
  windowId,
  onTitleChange,
}: FinderAppProps) {
  const defaultLocation: FinderLocation = mode === 'trash' ? 'trash' : 'guest';
  const [location, setLocation] = useState<FinderLocation>(defaultLocation);
  const [viewMode, setViewMode] = useState<FinderViewMode>(
    getPreferredViewMode(defaultLocation)
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedTrashId, setSelectedTrashId] = useState<string | null>(
    TRASH_ITEMS[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<FinderLocation[]>([defaultLocation]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocation(defaultLocation);
    setViewMode(getPreferredViewMode(defaultLocation));
    setSelectedItemId(null);
    setSelectedProjectId(null);
    setActiveProjectId(null);
    setSelectedTrashId(TRASH_ITEMS[0]?.id ?? null);
    setSearchQuery('');
    setHistory([defaultLocation]);
    setHistoryIndex(0);
  }, [defaultLocation]);

  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setIsActionMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isActionMenuOpen]);

  const projectRows = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        name: project.title,
        kind: project.role,
        date: getProjectDate(project.timeline),
        size: formatPseudoSize(
          Math.max(
            96,
            Math.round(
              (project.description.length +
                project.achievements.length * 140 +
                project.domains.length * 40) /
                6
            )
          )
        ),
      })),
    [projects]
  );

  const getItemsForLocation = useCallback(
    (targetLocation: FinderLocation): BrowserItem[] => {
      switch (targetLocation) {
        case 'guest':
        case 'macintosh-hd':
          return GUEST_FOLDERS.map((item) => ({
            id: item.id,
            label: item.label,
            kind: item.kind,
            kindLabel: item.kind === 'drive' ? 'Hard Disk' : 'Folder',
            action: item.action,
            subtitle: item.subtitle,
            iconSrc: item.iconSrc,
            note: `${item.label} is ready to open.`,
          }));
        case 'desktop':
          return DESKTOP_FOLDERS.map((item) => ({
            id: item.id,
            label: item.label,
            kind: item.kind,
            kindLabel: item.kind === 'drive' ? 'Hard Disk' : 'Folder',
            action: item.action,
            subtitle: item.subtitle,
            iconSrc: item.iconSrc,
            note: `${item.label} sits on the desktop for quick access.`,
          }));
        case 'downloads':
          return DOWNLOAD_ITEMS.map((item) => ({
            id: item.id,
            label: item.label,
            kind: item.kind,
            kindLabel: item.subtitle ?? 'Document',
            action: item.action,
            subtitle: item.subtitle,
            iconSrc: item.iconSrc,
            note: `${item.label} recently landed in Downloads.`,
          }));
        case 'applications':
          return APPLICATION_ITEMS.map((item) => ({
            id: item.id,
            label: item.label,
            kind: item.kind,
            kindLabel: 'Application',
            action: item.action,
            subtitle: item.subtitle,
            iconSrc: item.iconSrc,
            note: `${item.label} is installed and ready.`,
          }));
        case 'documents':
          return projectRows.map((projectRow) => {
            const project =
              projects.find((entry) => entry.id === projectRow.id) ?? null;

            return {
              id: projectRow.id,
              label: projectRow.name,
              kind: 'document',
              kindLabel: projectRow.kind,
              subtitle: project?.company,
              dateLabel: projectRow.date,
              sizeLabel: projectRow.size,
              note: project?.description,
              project: project ?? undefined,
            };
          });
        case 'trash':
          return TRASH_ITEMS.map((item) => ({
            id: item.id,
            label: item.name,
            kind: 'document',
            kindLabel: item.kind,
            dateLabel: item.dateAdded,
            subtitle: 'Deleted item',
            note: item.quip,
            trashItem: item,
          }));
        default:
          return [];
      }
    },
    [projectRows, projects]
  );

  const currentItems = useMemo(
    () => getItemsForLocation(location),
    [getItemsForLocation, location]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return currentItems;

    return currentItems.filter((item) =>
      [
        item.label,
        item.kindLabel,
        item.subtitle,
        item.dateLabel,
        item.sizeLabel,
        item.note,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery))
    );
  }, [currentItems, searchQuery]);

  const selectedProject =
    projects.find((project) => project.id === activeProjectId) ?? null;
  const windowTitle = selectedProject?.title ?? getLocationLabel(location);

  const selectedBrowserItemId =
    location === 'documents'
      ? selectedProjectId
      : location === 'trash'
        ? selectedTrashId
        : selectedItemId;

  const selectedBrowserItem =
    filteredItems.find((item) => item.id === selectedBrowserItemId) ??
    currentItems.find((item) => item.id === selectedBrowserItemId) ??
    filteredItems[0] ??
    currentItems[0] ??
    null;

  const parentLocation =
    mode === 'trash' ? null : (LOCATION_PARENTS[location] ?? null);
  const canGoBack = activeProjectId !== null || historyIndex > 0;
  const canGoForward =
    activeProjectId === null && historyIndex < history.length - 1;

  useEffect(() => {
    if (!windowId || !onTitleChange) return;
    onTitleChange(windowId, windowTitle);
  }, [onTitleChange, windowId, windowTitle]);

  const setDefaultSelectionForLocation = useCallback(
    (targetLocation: FinderLocation) => {
      const nextItems = getItemsForLocation(targetLocation);
      const nextSelectionId = nextItems[0]?.id ?? null;

      setSelectedItemId(
        targetLocation === 'documents' || targetLocation === 'trash'
          ? null
          : nextSelectionId
      );
      setSelectedProjectId(
        targetLocation === 'documents' ? nextSelectionId : null
      );
      setSelectedTrashId(
        targetLocation === 'trash'
          ? nextSelectionId
          : (TRASH_ITEMS[0]?.id ?? null)
      );
    },
    [getItemsForLocation]
  );

  const openLocation = useCallback(
    (
      next: FinderLocation,
      options?: { pushHistory?: boolean; preserveSearch?: boolean }
    ) => {
      if (mode === 'trash' && next !== 'trash') return;

      const shouldPushHistory = options?.pushHistory ?? true;
      const shouldPreserveSearch = options?.preserveSearch ?? false;

      setLocation(next);
      setActiveProjectId(null);
      setDefaultSelectionForLocation(next);
      setIsActionMenuOpen(false);

      if (!shouldPreserveSearch) {
        setSearchQuery('');
      }

      if (!shouldPushHistory) return;

      setHistory((previous) => {
        const trimmed = previous.slice(0, historyIndex + 1);
        if (trimmed[trimmed.length - 1] === next) return trimmed;

        const nextHistory = [...trimmed, next];
        setHistoryIndex(nextHistory.length - 1);
        return nextHistory;
      });
    },
    [historyIndex, mode, setDefaultSelectionForLocation]
  );

  const changeViewMode = useCallback((nextMode: FinderViewMode) => {
    setViewMode(nextMode);
    setActiveProjectId(null);
    setIsActionMenuOpen(false);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setActiveProjectId(null);
  }, []);

  const handleBack = useCallback(() => {
    if (activeProjectId) {
      setActiveProjectId(null);
      return;
    }

    if (historyIndex <= 0) return;

    const previousLocation = history[historyIndex - 1];
    setHistoryIndex((index) => Math.max(0, index - 1));
    openLocation(previousLocation, { pushHistory: false });
  }, [activeProjectId, history, historyIndex, openLocation]);

  const handleForward = useCallback(() => {
    if (activeProjectId) return;
    if (historyIndex >= history.length - 1) return;

    const nextLocation = history[historyIndex + 1];
    setHistoryIndex((index) => Math.min(history.length - 1, index + 1));
    openLocation(nextLocation, { pushHistory: false });
  }, [activeProjectId, history, historyIndex, openLocation]);

  const handleUp = useCallback(() => {
    if (activeProjectId) {
      setActiveProjectId(null);
      return;
    }

    if (!parentLocation) return;
    openLocation(parentLocation);
  }, [activeProjectId, openLocation, parentLocation]);

  const selectItem = useCallback(
    (item: BrowserItem) => {
      if (location === 'documents') {
        setSelectedProjectId(item.id);
        return;
      }

      if (location === 'trash') {
        setSelectedTrashId(item.id);
        return;
      }

      setSelectedItemId(item.id);
    },
    [location]
  );

  const openItem = useCallback(
    (item: BrowserItem) => {
      selectItem(item);

      if (location === 'documents') {
        setActiveProjectId(item.id);
        return;
      }

      if (item.action) {
        openLocation(item.action);
      }
    },
    [location, openLocation, selectItem]
  );

  const renderGridIcon = (item: BrowserItem, size = 58) => {
    switch (item.kind) {
      case 'drive':
        return <HardDriveIcon size={size} />;
      case 'document':
        return <DocIcon size={Math.max(16, size - 4)} />;
      case 'trash':
        return <TrashIcon size={Math.max(16, size - 4)} />;
      case 'app':
        return (
          <img
            src={item.iconSrc}
            alt=""
            width={Math.max(16, size - 4)}
            height={Math.max(16, size - 4)}
            draggable={false}
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.22))' }}
          />
        );
      case 'folder':
      default:
        return <FolderIcon size={size} />;
    }
  };

  const renderIconGrid = (items: BrowserItem[]) => (
    <MacScrollArea
      className={`${FINDER_SCROLL_PANE_CLASS_NAME} h-full`}
      viewportClassName="px-6 py-5"
    >
      <div
        className="grid min-h-full content-start gap-x-5 gap-y-7"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 110px))',
          justifyContent: 'start',
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            className="group flex flex-col items-center gap-2 rounded-[8px] px-3 py-2 text-center transition-colors hover:bg-[#3877d91f]"
            style={{
              background:
                selectedBrowserItem?.id === item.id
                  ? '#3877d926'
                  : 'transparent',
              boxShadow:
                selectedBrowserItem?.id === item.id
                  ? '0 0 0 1px rgba(56,119,217,0.18) inset'
                  : 'none',
            }}
            onClick={() => selectItem(item)}
            onDoubleClick={() => openItem(item)}
          >
            <span
              className="flex items-center justify-center"
              style={{ minHeight: '62px' }}
            >
              {renderGridIcon(item, item.kind === 'document' ? 54 : 58)}
            </span>
            <span
              className="text-[11px] leading-tight"
              style={{
                color: '#202020',
                textShadow: '0 1px 0 rgba(255,255,255,0.55)',
              }}
            >
              {item.label}
            </span>
            {(item.subtitle || item.kindLabel) && (
              <span className="text-[10px]" style={{ color: '#7c8791' }}>
                {item.subtitle ?? item.kindLabel}
              </span>
            )}
          </button>
        ))}
      </div>
    </MacScrollArea>
  );

  const renderSidebarRow = ({
    label,
    selected,
    icon,
    onClick,
  }: {
    label: string;
    selected: boolean;
    icon: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      className="mb-[1px] flex w-full items-center gap-2 rounded px-2 py-[3px] text-left text-[11px]"
      style={
        selected
          ? {
              background: 'linear-gradient(180deg, #5fa3f5 0%, #2f78d8 100%)',
              color: '#fff',
              textShadow: '0 -1px 0 rgba(0,0,0,0.22)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.08) inset',
            }
          : {
              color: '#2b2f33',
              textShadow: '0 1px 0 rgba(255,255,255,0.55)',
            }
      }
      onClick={onClick}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );

  const renderSectionTitle = (label: string) => (
    <p
      className="mb-1 px-2 text-[10px] font-bold tracking-wider uppercase"
      style={{ color: '#6d7782' }}
    >
      {label}
    </p>
  );

  const renderEmptyFolder = (title: string, note: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <FolderIcon size={64} />
      <div>
        <p className="text-[13px] font-semibold" style={{ color: '#444' }}>
          {title}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: '#8a8a8a' }}>
          {note}
        </p>
      </div>
    </div>
  );

  const renderProjectDetail = (project: Project) => {
    return (
      <MacScrollArea
        className={`${FINDER_SCROLL_PANE_CLASS_NAME} h-full`}
        viewportClassName="px-5 py-4"
        style={{ background: '#fff' }}
      >
        <button
          className="mb-4 rounded border px-2 py-[3px] text-[10px]"
          style={{
            background: 'linear-gradient(180deg, #f8f8f8 0%, #dddddd 100%)',
            borderColor: '#b4b4b4',
            color: '#444',
          }}
          onClick={() => setActiveProjectId(null)}
        >
          Back to Documents
        </button>

        <div className="mb-4 flex items-start gap-3">
          <FolderIcon size={42} />
          <div>
            <h2
              className="text-[16px] font-medium"
              style={{ color: '#161616' }}
            >
              {project.title}
            </h2>
            <p className="text-[11px]" style={{ color: '#666' }}>
              {project.company} &middot; {project.role}
            </p>
            <p className="text-[11px]" style={{ color: '#999' }}>
              {project.timeline}
            </p>
          </div>
        </div>

        <p
          className="mb-5 text-[12px] leading-relaxed"
          style={{ color: '#333' }}
        >
          {project.description}
        </p>

        {project.achievements.length > 0 && (
          <div className="mb-5">
            <p
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: '#7d8791' }}
            >
              Highlights
            </p>
            <ul className="space-y-1">
              {project.achievements.map((achievement, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-[11px]"
                  style={{ color: '#333' }}
                >
                  <span style={{ color: '#99a3ad' }}>&bull;</span>
                  <span>{achievement.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-5">
          <p
            className="mb-2 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: '#7d8791' }}
          >
            Technologies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(project.technologies)
              .flat()
              .map((tech) => (
                <span
                  key={tech}
                  className="rounded px-[6px] py-[2px] text-[10px]"
                  style={{
                    background: '#edf3fb',
                    border: '1px solid #c9d7e8',
                    color: '#3a6c9d',
                  }}
                >
                  {tech}
                </span>
              ))}
          </div>
        </div>

        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] hover:underline"
            style={{ color: '#2e79d6' }}
          >
            {project.url}
          </a>
        )}
      </MacScrollArea>
    );
  };

  const renderResultsTable = (items: BrowserItem[]) => {
    const dateHeader = location === 'trash' ? 'Date Added' : 'Date Modified';

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div
          className="flex items-center px-3"
          style={{
            height: '18px',
            background: 'linear-gradient(180deg, #ececec 0%, #d4d4d4 100%)',
            borderBottom: '1px solid #b3b3b3',
          }}
        >
          <span
            className="flex-1 text-[11px] font-bold"
            style={{ color: '#383838' }}
          >
            Name
          </span>
          <span
            className="w-28 text-[11px] font-bold"
            style={{
              color: '#383838',
              borderLeft: '1px solid #c2c2c2',
              paddingLeft: '8px',
            }}
          >
            Kind
          </span>
          <span
            className="w-24 text-[11px] font-bold"
            style={{
              color: '#383838',
              borderLeft: '1px solid #c2c2c2',
              paddingLeft: '8px',
            }}
          >
            {dateHeader}
          </span>
          <span
            className="w-16 text-right text-[11px] font-bold"
            style={{ color: '#383838' }}
          >
            Size
          </span>
        </div>

        <MacScrollArea className={`${FINDER_SCROLL_PANE_CLASS_NAME} flex-1`}>
          {items.map((item, index) => {
            const isSelected = selectedBrowserItem?.id === item.id;

            return (
              <button
                key={item.id}
                className="flex w-full items-center gap-2 px-3 text-left"
                style={{
                  height: '22px',
                  background: isSelected
                    ? 'linear-gradient(180deg, #6cb3f5 0%, #358cdb 100%)'
                    : index % 2 === 0
                      ? '#ffffff'
                      : '#ecf2fb',
                  color: isSelected ? '#fff' : '#111',
                }}
                onClick={() => selectItem(item)}
                onDoubleClick={() => openItem(item)}
              >
                {renderGridIcon(item, 18)}
                <span className="flex-1 truncate text-[11px]">
                  {item.label}
                </span>
                <span className="w-28 truncate text-[11px]">
                  {item.kindLabel}
                </span>
                <span
                  className="w-24 truncate text-[11px]"
                  style={{ opacity: isSelected ? 0.95 : 0.72 }}
                >
                  {item.dateLabel ?? '—'}
                </span>
                <span
                  className="w-16 text-right text-[11px]"
                  style={{ opacity: isSelected ? 0.95 : 0.72 }}
                >
                  {item.sizeLabel ?? '—'}
                </span>
              </button>
            );
          })}
        </MacScrollArea>
      </div>
    );
  };

  const renderInspector = (item: BrowserItem | null) => {
    if (!item) {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="text-[11px]" style={{ color: '#7a848d' }}>
            Select an item to inspect it.
          </p>
        </div>
      );
    }

    if (item.project) {
      return (
        <MacScrollArea
          className={`${FINDER_SCROLL_PANE_CLASS_NAME} h-full`}
          viewportClassName="px-4 py-5"
        >
          <div className="mb-4 flex justify-center">
            <FolderIcon size={58} />
          </div>
          <p
            className="text-center text-[11px] font-bold"
            style={{ color: '#2c3136' }}
          >
            {item.project.title}
          </p>
          <p
            className="mt-1 text-center text-[10px]"
            style={{ color: '#7c8791' }}
          >
            {item.project.company}
          </p>
          <p
            className="mt-3 text-[11px] leading-relaxed"
            style={{ color: '#59636d' }}
          >
            {item.project.description}
          </p>

          <div className="mt-5">
            <p
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: '#7b8691' }}
            >
              Metadata
            </p>
            <div className="space-y-2 text-[11px]" style={{ color: '#4f5861' }}>
              <div>
                <span className="font-semibold">Role:</span> {item.project.role}
              </div>
              <div>
                <span className="font-semibold">Timeline:</span>{' '}
                {item.project.timeline}
              </div>
              <div>
                <span className="font-semibold">Highlights:</span>{' '}
                {item.project.achievements.length}
              </div>
            </div>
          </div>
        </MacScrollArea>
      );
    }

    if (item.trashItem) {
      return (
        <MacScrollArea
          className={`${FINDER_SCROLL_PANE_CLASS_NAME} h-full`}
          viewportClassName="px-4 py-5"
        >
          <div className="mb-4 flex justify-center">
            <TrashIcon size={58} />
          </div>
          <p
            className="text-center text-[11px] font-bold"
            style={{ color: '#2c3136' }}
          >
            {item.trashItem.name}
          </p>
          <p
            className="mt-3 text-[11px] leading-relaxed"
            style={{ color: '#59636d' }}
          >
            {item.trashItem.quip}
          </p>

          <div className="mt-5">
            <p
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: '#7b8691' }}
            >
              Metadata
            </p>
            <div className="space-y-2 text-[11px]" style={{ color: '#4f5861' }}>
              <div>
                <span className="font-semibold">Kind:</span>{' '}
                {item.trashItem.kind}
              </div>
              <div>
                <span className="font-semibold">Added:</span>{' '}
                {item.trashItem.dateAdded}
              </div>
              <div>
                <span className="font-semibold">Status:</span> Regret pending
              </div>
            </div>
          </div>
        </MacScrollArea>
      );
    }

    const nestedCount = item.action
      ? getItemsForLocation(item.action).length
      : 0;

    return (
      <MacScrollArea
        className={`${FINDER_SCROLL_PANE_CLASS_NAME} h-full`}
        viewportClassName="px-4 py-5"
      >
        <div className="mb-4 flex justify-center">
          {renderGridIcon(item, 58)}
        </div>
        <p
          className="text-center text-[11px] font-bold"
          style={{ color: '#2c3136' }}
        >
          {item.label}
        </p>
        <p
          className="mt-1 text-center text-[10px]"
          style={{ color: '#7c8791' }}
        >
          {item.kindLabel}
        </p>
        <p
          className="mt-3 text-[11px] leading-relaxed"
          style={{ color: '#59636d' }}
        >
          {item.note ??
            `${item.label} is available from ${getLocationLabel(location)}.`}
        </p>

        <div className="mt-5">
          <p
            className="mb-2 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: '#7b8691' }}
          >
            Metadata
          </p>
          <div className="space-y-2 text-[11px]" style={{ color: '#4f5861' }}>
            <div>
              <span className="font-semibold">Kind:</span> {item.kindLabel}
            </div>
            <div>
              <span className="font-semibold">Contains:</span>{' '}
              {item.action ? `${nestedCount} items` : '—'}
            </div>
            <div>
              <span className="font-semibold">Location:</span>{' '}
              {getLocationLabel(location)}
            </div>
          </div>
        </div>
      </MacScrollArea>
    );
  };

  const renderColumnsBrowser = (items: BrowserItem[]) => {
    const nestedItems = selectedBrowserItem?.action
      ? getItemsForLocation(selectedBrowserItem.action)
      : [];
    const filteredNestedItems = searchQuery
      ? nestedItems.filter((item) =>
          [item.label, item.kindLabel, item.subtitle, item.dateLabel, item.note]
            .filter(Boolean)
            .some((value) =>
              value?.toLowerCase().includes(searchQuery.trim().toLowerCase())
            )
        )
      : nestedItems;

    const renderColumnList = (
      columnItems: BrowserItem[],
      selectedId: string | null,
      onSelectItem: (item: BrowserItem) => void,
      onOpenColumnItem: (item: BrowserItem) => void
    ) => (
      <div className="flex h-full min-h-0 flex-col">
        <div
          className="px-3 py-[5px] text-[10px] font-bold tracking-wider uppercase"
          style={{
            color: '#6d7782',
            borderBottom: '1px solid #d4d7db',
            background: 'linear-gradient(180deg, #f9f9f9 0%, #ebedef 100%)',
          }}
        >
          Items
        </div>
        <MacScrollArea className={`${FINDER_SCROLL_PANE_CLASS_NAME} flex-1`}>
          {columnItems.map((item) => {
            const isSelected = selectedId === item.id;

            return (
              <button
                key={item.id}
                className="flex w-full items-center gap-2 px-3 py-[5px] text-left text-[11px]"
                style={{
                  background: isSelected ? '#dbe9fb' : 'transparent',
                  boxShadow: isSelected
                    ? '0 0 0 1px rgba(56,119,217,0.16) inset'
                    : 'none',
                  color: '#21262c',
                }}
                onClick={() => onSelectItem(item)}
                onDoubleClick={() => onOpenColumnItem(item)}
              >
                {renderGridIcon(item, 16)}
                <span className="flex-1 truncate">{item.label}</span>
                {item.action && <span style={{ color: '#85909a' }}>›</span>}
              </button>
            );
          })}
        </MacScrollArea>
      </div>
    );

    return (
      <div className="grid h-full min-h-0 grid-cols-[220px_240px_1fr]">
        <div className="min-h-0" style={{ borderRight: '1px solid #d6dade' }}>
          {renderColumnList(
            items,
            selectedBrowserItem?.id ?? null,
            selectItem,
            openItem
          )}
        </div>
        <div
          className="min-h-0"
          style={{
            borderRight: '1px solid #d6dade',
            background: 'linear-gradient(180deg, #fcfcfc 0%, #f4f6f8 100%)',
          }}
        >
          {selectedBrowserItem?.action
            ? filteredNestedItems.length > 0
              ? renderColumnList(
                  filteredNestedItems,
                  null,
                  () => undefined,
                  (item) => {
                    if (item.action) {
                      openLocation(item.action);
                      return;
                    }

                    if (selectedBrowserItem.action === 'documents') {
                      setSelectedProjectId(item.id);
                      setActiveProjectId(item.id);
                      return;
                    }

                    if (selectedBrowserItem.action === 'trash') {
                      setSelectedTrashId(item.id);
                    }
                  }
                )
              : renderEmptyFolder(
                  getLocationLabel(selectedBrowserItem.action),
                  EMPTY_LOCATION_COPY[selectedBrowserItem.action]?.note ??
                    'Nothing is stored here at the moment.'
                )
            : renderInspector(selectedBrowserItem)}
        </div>
        <div
          className="min-h-0"
          style={{
            background: 'linear-gradient(180deg, #f9fbfd 0%, #eef2f6 100%)',
          }}
        >
          {renderInspector(selectedBrowserItem)}
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (selectedProject) {
      return renderProjectDetail(selectedProject);
    }

    if (searchQuery && filteredItems.length === 0) {
      return renderEmptyFolder(
        'No Results',
        searchQuery
          ? `No items in ${getLocationLabel(location)} match "${searchQuery}".`
          : 'Nothing to see here just now.'
      );
    }

    if (currentItems.length === 0) {
      const emptyCopy = EMPTY_LOCATION_COPY[location];
      if (emptyCopy) {
        return renderEmptyFolder(emptyCopy.title, emptyCopy.note);
      }

      return renderEmptyFolder('Finder', 'Nothing to see here just now.');
    }

    if (viewMode === 'columns') {
      return renderColumnsBrowser(filteredItems);
    }

    if (viewMode === 'list') {
      return renderResultsTable(filteredItems);
    }

    return renderIconGrid(filteredItems);
  };

  const footerText = searchQuery
    ? `${filteredItems.length} of ${currentItems.length} items shown`
    : location === 'trash'
      ? `${TRASH_ITEMS.length} items, some decisions were time-sensitive`
      : location === 'documents'
        ? `${projectRows.length} items, portfolio archive`
        : location === 'downloads'
          ? `${DOWNLOAD_ITEMS.length} items, all apparently important`
          : location === 'applications'
            ? `${APPLICATION_ITEMS.length} applications`
            : location === 'guest' || location === 'macintosh-hd'
              ? `${GUEST_FOLDERS.length} items, 15.86 GB available`
              : currentItems.length > 0
                ? `${currentItems.length} items in ${getLocationLabel(location)}`
                : `${getLocationLabel(location)} ready`;

  const actionItems: Array<
    | {
        label: string;
        onClick: () => void;
        disabled?: boolean;
      }
    | { separator: true }
  > = [
    {
      label: 'Open Selected',
      onClick: () => {
        if (selectedBrowserItem) openItem(selectedBrowserItem);
        setIsActionMenuOpen(false);
      },
      disabled: !selectedBrowserItem,
    },
    { separator: true },
    { label: 'Back', onClick: handleBack, disabled: !canGoBack },
    { label: 'Forward', onClick: handleForward, disabled: !canGoForward },
    {
      label: 'Enclosing Folder',
      onClick: handleUp,
      disabled: !parentLocation && !activeProjectId,
    },
    { separator: true },
    {
      label: 'Icon View',
      onClick: () => changeViewMode('icon'),
      disabled: viewMode === 'icon',
    },
    {
      label: 'List View',
      onClick: () => changeViewMode('list'),
      disabled: viewMode === 'list',
    },
    {
      label: 'Columns View',
      onClick: () => changeViewMode('columns'),
      disabled: viewMode === 'columns',
    },
  ];

  if (mode !== 'trash') {
    actionItems.push(
      { separator: true },
      { label: 'Go to Guest', onClick: () => openLocation('guest') },
      { label: 'Go to Documents', onClick: () => openLocation('documents') },
      {
        label: 'Go to Applications',
        onClick: () => openLocation('applications'),
      },
      { label: 'Go to Trash', onClick: () => openLocation('trash') }
    );
  }

  if (searchQuery.trim()) {
    actionItems.push(
      { separator: true },
      {
        label: 'Clear Search',
        onClick: () => {
          setSearchQuery('');
          setIsActionMenuOpen(false);
        },
      }
    );
  }

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ fontFamily: "'Lucida Grande', sans-serif" }}
    >
      <div
        className="flex min-h-0 w-[170px] shrink-0 flex-col"
        style={{
          background:
            'linear-gradient(180deg, #cfd7df 0%, #b3bcc6 55%, #a4adb7 100%)',
          borderRight: '1px solid #8f98a2',
        }}
      >
        <MacScrollArea
          className={`${FINDER_SCROLL_PANE_CLASS_NAME} flex-1`}
          orientation="vertical"
          viewportClassName="overflow-x-hidden px-1 py-2"
        >
          {mode === 'trash' ? (
            <>
              {renderSectionTitle('Places')}
              {renderSidebarRow({
                label: 'Trash',
                selected: true,
                icon: <TrashIcon size={14} />,
                onClick: () => openLocation('trash'),
              })}
            </>
          ) : (
            <>
              {renderSectionTitle('Devices')}
              {renderSidebarRow({
                label: 'Macintosh HD',
                selected: location === 'macintosh-hd',
                icon: <HardDriveIcon size={14} />,
                onClick: () => openLocation('macintosh-hd'),
              })}
              {renderSidebarRow({
                label: 'iDisk',
                selected: false,
                icon: <SidebarDot color="#79a7f2" />,
                onClick: () => openLocation('guest'),
              })}

              <div className="mt-3">
                {renderSectionTitle('Places')}
                {renderSidebarRow({
                  label: 'Desktop',
                  selected: location === 'desktop',
                  icon: <FolderIcon size={14} />,
                  onClick: () => openLocation('desktop'),
                })}
                {renderSidebarRow({
                  label: 'Guest',
                  selected: location === 'guest',
                  icon: <FolderIcon size={14} />,
                  onClick: () => openLocation('guest'),
                })}
                {renderSidebarRow({
                  label: 'Documents',
                  selected: location === 'documents',
                  icon: <FolderIcon size={14} />,
                  onClick: () => openLocation('documents'),
                })}
                {renderSidebarRow({
                  label: 'Applications',
                  selected: location === 'applications',
                  icon: <FolderIcon size={14} />,
                  onClick: () => openLocation('applications'),
                })}
                {renderSidebarRow({
                  label: 'Trash',
                  selected: location === 'trash',
                  icon: <TrashIcon size={14} />,
                  onClick: () => openLocation('trash'),
                })}
              </div>

              <div className="mt-3">
                {renderSectionTitle('Search For')}
                {renderSidebarRow({
                  label: 'Today',
                  selected: false,
                  icon: <SidebarDot color="#b9bcc1" />,
                  onClick: () => {
                    openLocation('documents', { preserveSearch: true });
                    handleSearchChange('202');
                  },
                })}
                {renderSidebarRow({
                  label: 'Yesterday',
                  selected: false,
                  icon: <SidebarDot color="#c8cbcf" />,
                  onClick: () => {
                    openLocation('trash', { preserveSearch: true });
                    handleSearchChange('Yesterday');
                  },
                })}
                {renderSidebarRow({
                  label: 'Past Week',
                  selected: false,
                  icon: <SidebarDot color="#d7dade" />,
                  onClick: () => {
                    openLocation('trash', { preserveSearch: true });
                    handleSearchChange('March');
                  },
                })}
                {renderSidebarRow({
                  label: 'All Images',
                  selected: false,
                  icon: <SidebarDot color="#8db6f5" />,
                  onClick: () => {
                    openLocation('downloads', { preserveSearch: true });
                    handleSearchChange('.pdf');
                  },
                })}
                {renderSidebarRow({
                  label: 'All Movies',
                  selected: false,
                  icon: <SidebarDot color="#f0b56b" />,
                  onClick: () => openLocation('movies'),
                })}
                {renderSidebarRow({
                  label: 'All Documents',
                  selected: false,
                  icon: <SidebarDot color="#b89be8" />,
                  onClick: () => openLocation('documents'),
                })}
              </div>
            </>
          )}
        </MacScrollArea>
      </div>

      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        style={{ background: '#fff' }}
      >
        <div
          className="flex h-[38px] items-center justify-between px-[10px]"
          style={{
            background:
              'linear-gradient(180deg, #f7f7f7 0%, #ececec 16%, #d8d8d8 58%, #c4c4c4 100%)',
            borderBottom: '1px solid #a8a8a8',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(120,120,120,0.16)',
          }}
        >
          <div className="flex items-center gap-[6px]">
            <ToolbarControlGroup>
              <ToolbarButton
                icon={<ToolbarArrowIcon direction="left" />}
                title="Back"
                disabled={!canGoBack}
                onClick={handleBack}
              />
              <ToolbarButton
                icon={<ToolbarArrowIcon direction="right" />}
                title="Forward"
                disabled={!canGoForward}
                onClick={handleForward}
                isLast
              />
            </ToolbarControlGroup>
            <ToolbarControlGroup>
              <ToolbarButton
                icon={<ToolbarViewIcon mode="icon" />}
                title="Icon View"
                active={viewMode === 'icon'}
                onClick={() => changeViewMode('icon')}
              />
              <ToolbarButton
                icon={<ToolbarViewIcon mode="list" />}
                title="List View"
                active={viewMode === 'list'}
                onClick={() => changeViewMode('list')}
              />
              <ToolbarButton
                icon={<ToolbarViewIcon mode="columns" />}
                title="Columns View"
                active={viewMode === 'columns'}
                onClick={() => changeViewMode('columns')}
                isLast
              />
            </ToolbarControlGroup>
            {parentLocation || activeProjectId ? (
              <ToolbarControlGroup>
                <ToolbarButton
                  icon={
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 1.4v6.2M2.2 4.2 5 1.4l2.8 2.8"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.2"
                      />
                    </svg>
                  }
                  title="Enclosing Folder"
                  onClick={handleUp}
                  isLast
                />
              </ToolbarControlGroup>
            ) : null}
            <div className="relative" ref={actionMenuRef}>
              <ToolbarControlGroup>
                <ToolbarButton
                  icon={<ToolbarGearIcon />}
                  title="Action"
                  onClick={() => setIsActionMenuOpen((open) => !open)}
                  isLast
                  width={26}
                />
              </ToolbarControlGroup>
              {isActionMenuOpen && (
                <div
                  className="absolute left-0 z-20 mt-2 w-[180px] overflow-hidden rounded-[6px]"
                  style={{
                    background: 'rgba(241,241,241,0.96)',
                    border: '1px solid rgba(0,0,0,0.16)',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.26)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                  }}
                >
                  {actionItems.map((item, index) =>
                    'separator' in item ? (
                      <div
                        key={`separator-${index}`}
                        className="mx-2 my-1"
                        style={{
                          height: '1px',
                          background: 'rgba(0,0,0,0.12)',
                        }}
                      />
                    ) : (
                      <button
                        key={item.label}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-[5px] text-left text-[11px]"
                        style={{
                          color: item.disabled ? '#8a8a8a' : '#202020',
                          opacity: item.disabled ? 0.58 : 1,
                        }}
                        disabled={item.disabled}
                        onClick={item.onClick}
                      >
                        <span>{item.label}</span>
                        {item.label.endsWith('View') && (
                          <span style={{ color: '#8b97a2' }}>›</span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <span
                className="pointer-events-none absolute top-1/2 left-[8px] -translate-y-1/2"
                style={{ color: '#98a0a8' }}
              >
                <ToolbarSearchIcon />
              </span>
              <input
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search"
                className="h-[24px] rounded-full pr-3 pl-[24px] text-[10px] text-[#444] outline-none placeholder:text-[#9ca3aa]"
                style={{
                  width: '146px',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,248,248,0.94) 100%)',
                  border: '1px solid rgba(94,94,94,0.18)',
                  boxShadow:
                    'inset 0 1px 2px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.42)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {renderMainContent()}
        </div>

        <div
          className="flex h-[15px] items-center justify-between px-3 text-[10px]"
          style={{
            background: 'linear-gradient(180deg, #ededed 0%, #d6d6d6 100%)',
            borderTop: '1px solid #b7b7b7',
            color: '#6a6a6a',
          }}
        >
          <span>{footerText}</span>
          <span>{getLocationLabel(location)}</span>
        </div>
      </div>
    </div>
  );
}
