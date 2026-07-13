import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@template/backend';
import type { Id } from '@template/backend/dataModel';
import { ClientOnly } from '@/components/ui/client-only';
import { usePortfolioData } from '@/hooks/use-portfolio-data';
import { useMobile } from '@/hooks/use-mobile';
import { BootScreen } from '@/components/alt-macos/boot-screen';
import { Desktop } from '@/components/alt-macos/desktop';
import { Window, type WindowDockTarget } from '@/components/alt-macos/window';
import { Dock } from '@/components/alt-macos/dock';
import { MenuBar } from '@/components/alt-macos/menu-bar';
import { FinderApp } from '@/components/alt-macos/apps/finder-app';
import {
  buildDefaultStickies,
  buildNewStickySeed,
  STICKIES_HELP_NOTE_HTML,
  StickiesApp,
  StickyNoteWindow,
  type StickyColor,
  type StickyNote,
  type StickyPatch,
} from '@/components/alt-macos/apps/stickies-app';
import { SafariApp } from '@/components/alt-macos/apps/safari-app';
import { PhotosApp } from '@/components/alt-macos/apps/photos-app';
import { MailApp } from '@/components/alt-macos/apps/mail-app';
import { TerminalApp } from '@/components/alt-macos/apps/terminal-app';
import { PhotoBoothApp } from '@/components/alt-macos/apps/photo-booth-app';
import { IChatApp } from '@/components/alt-macos/apps/ichat-app';
import { SystemPreferencesApp } from '@/components/alt-macos/apps/system-preferences-app';
import { getWallpaperClientKey } from '@/utils/wallpaper-client-key';

export const Route = createFileRoute('/macos')({
  component: OSPage,
});

interface BaseWindowState {
  id: string;
  title: string;
  appType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface AppWindowState extends BaseWindowState {
  kind: 'app';
  isMinimized: boolean;
  isMinimizing?: boolean;
  minimizeTarget?: WindowDockTarget;
  isMaximized: boolean;
}

interface StickyWindowState extends BaseWindowState {
  kind: 'sticky';
  appType: 'stickies';
  stickyId: Id<'stickies'>;
}

type WindowState = AppWindowState | StickyWindowState;

const MINIMIZE_DURATION_MS = 420;

const APP_DEFS = [
  {
    id: 'finder',
    label: 'Finder',
    iconSrc: '/os-x/finder-face.png',
    dockScale: 0.98,
    icon: (
      <img
        src="/os-x/finder-face.png"
        alt="Finder"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'preferences',
    label: 'System Preferences',
    iconSrc: '/os-x/settings.png',
    dockScale: 0.95,
    icon: (
      <img
        src="/os-x/settings.png"
        alt="About"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'stickies',
    label: 'Stickies',
    iconSrc: '/os-x/stickies.png',
    dockScale: 0.88,
    syntheticReflection: true,
    icon: (
      <img
        src="/os-x/stickies.png"
        alt="Stickies"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'safari',
    label: 'Safari',
    iconSrc: '/os-x/safari.png',
    dockScale: 0.99,
    icon: (
      <img
        src="/os-x/safari.png"
        alt="Safari"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'photos',
    label: 'iPhoto',
    iconSrc: '/os-x/photos.png',
    dockScale: 1.01,
    icon: (
      <img
        src="/os-x/photos.png"
        alt="iPhoto"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'mail',
    label: 'Mail',
    iconSrc: '/os-x/mail.png',
    dockScale: 1,
    icon: (
      <img
        src="/os-x/mail.png"
        alt="Mail"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'photobooth',
    label: 'Photo Booth',
    iconSrc: '/os-x/photo-booth.png',
    dockScale: 1.04,
    icon: (
      <img
        src="/os-x/photo-booth.png"
        alt="Photo Booth"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'ichat',
    label: 'iChat',
    iconSrc: '/os-x/imessage.png',
    dockScale: 1.02,
    icon: (
      <img
        src="/os-x/imessage.png"
        alt="iChat"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'terminal',
    label: 'Terminal',
    iconSrc: '/os-x/terminal.png',
    dockScale: 0.92,
    syntheticReflection: true,
    startsSection: true,
    icon: (
      <img
        src="/os-x/terminal.png"
        alt="Terminal"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
  {
    id: 'trash',
    label: 'Trash',
    iconSrc: '/os-x/trash-full.png',
    dockScale: 0.96,
    syntheticReflection: true,
    icon: (
      <img
        src="/os-x/trash-full.png"
        alt="Trash"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
];

const DESKTOP_ITEMS = [
  {
    id: 'finder',
    label: 'Macintosh HD',
    icon: (
      <img
        src="/os-x/hd.png"
        alt="Macintosh HD"
        width={48}
        height={48}
        draggable={false}
      />
    ),
  },
];

const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  finder: { w: 700, h: 480 },
  preferences: { w: 760, h: 560 },
  stickies: { w: 480, h: 520 },
  safari: { w: 720, h: 500 },
  photos: { w: 920, h: 610 },
  mail: { w: 880, h: 520 },
  photobooth: { w: 640, h: 480 },
  ichat: { w: 580, h: 460 },
  terminal: { w: 520, h: 380 },
  trash: { w: 580, h: 420 },
};

function isAppWindow(windowState: WindowState): windowState is AppWindowState {
  return windowState.kind === 'app';
}

function isStickyWindow(
  windowState: WindowState
): windowState is StickyWindowState {
  return windowState.kind === 'sticky';
}

function OSPage() {
  const data = usePortfolioData();
  const isMobile = useMobile();
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [wallpaperIpKey, setWallpaperIpKey] = useState<string | null>(null);
  const windowsRef = useRef<WindowState[]>([]);
  const nextZRef = useRef(100);
  const dockTargetsRef = useRef<Record<string, WindowDockTarget>>({});
  const minimizeTimersRef = useRef<Record<string, number>>({});
  const stickyEditorsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const lastFindTermRef = useRef('');

  const stickies = useQuery(api.stickies.listStickies);
  const wallpaper = useQuery(
    api.wallpapers.getByIpKey,
    wallpaperIpKey ? { ipKey: wallpaperIpKey } : 'skip'
  );
  const stickyDocs = useMemo(() => stickies ?? [], [stickies]);
  const ensureDefaultStickies = useMutation(api.stickies.ensureDefaultStickies);
  const createSticky = useMutation(api.stickies.createSticky);
  const updateSticky = useMutation(api.stickies.updateSticky);
  const deleteSticky = useMutation(api.stickies.deleteSticky);

  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  useEffect(() => {
    const minimizeTimers = minimizeTimersRef.current;
    return () => {
      Object.values(minimizeTimers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getWallpaperClientKey()
      .then((result) => {
        if (!cancelled) {
          setWallpaperIpKey(result.ipKey);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWallpaperIpKey(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stickies) return;

    const stickyIds = new Set(stickies.map((sticky) => sticky._id));
    setWindows((previous) =>
      previous.filter((windowState) => {
        if (!isStickyWindow(windowState)) return true;
        return stickyIds.has(windowState.stickyId);
      })
    );
  }, [stickies]);

  const allocateZIndex = useCallback(() => {
    const next = nextZRef.current;
    nextZRef.current += 1;
    return next;
  }, []);

  const clearMinimizeTimer = useCallback((id: string) => {
    const timerId = minimizeTimersRef.current[id];
    if (timerId === undefined) return;
    window.clearTimeout(timerId);
    delete minimizeTimersRef.current[id];
  }, []);

  const getViewport = useCallback(() => {
    if (typeof window === 'undefined') {
      return { width: 1440, height: 900 };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  const openStickyWindows = useCallback(
    (notes: StickyNote[]) => {
      if (notes.length === 0) return;

      setWindows((previous) => {
        const openStickyIds = new Set(
          previous
            .filter(isStickyWindow)
            .map((windowState) => windowState.stickyId)
        );

        const stickyWindows = notes
          .filter((note) => !openStickyIds.has(note._id))
          .map<StickyWindowState>((note) => ({
            kind: 'sticky',
            id: `sticky-${note._id}`,
            title: 'Stickies',
            appType: 'stickies',
            stickyId: note._id,
            x: note.x,
            y: note.y,
            width: note.width,
            height: note.height,
            zIndex: allocateZIndex(),
          }));

        return stickyWindows.length > 0
          ? [...previous, ...stickyWindows]
          : previous;
      });
    },
    [allocateZIndex]
  );

  const ensureStickiesExist = useCallback(async () => {
    if (stickies === undefined) return null;
    if (stickyDocs.length > 0) return stickyDocs;

    const viewport = getViewport();
    return await ensureDefaultStickies({
      stickies: buildDefaultStickies({
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
      }),
    });
  }, [ensureDefaultStickies, getViewport, stickies, stickyDocs]);

  const createStickyNote = useCallback(async () => {
    const viewport = getViewport();
    const created = await createSticky(
      buildNewStickySeed({
        index: stickyDocs.length,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
      })
    );

    if (!created || isMobile) return;
    openStickyWindows([created]);
  }, [
    createSticky,
    getViewport,
    isMobile,
    openStickyWindows,
    stickyDocs.length,
  ]);

  const openRegularApp = useCallback(
    (appType: string) => {
      const existing = windowsRef.current.find(
        (windowState) =>
          isAppWindow(windowState) && windowState.appType === appType
      );
      const zIndex = allocateZIndex();

      if (existing) {
        clearMinimizeTimer(existing.id);
        setWindows((previous) =>
          previous.map((windowState) =>
            windowState.id === existing.id
              ? {
                  ...windowState,
                  isMinimized: false,
                  isMinimizing: false,
                  minimizeTarget: undefined,
                  zIndex,
                }
              : windowState
          )
        );
        return;
      }

      const size = DEFAULT_SIZES[appType] ?? { w: 500, h: 400 };
      const offset = windowsRef.current.length * 30;
      const appDefinition = APP_DEFS.find((app) => app.id === appType);

      setWindows((previous) => [
        ...previous,
        {
          kind: 'app',
          id: `${appType}-${Date.now()}`,
          title: appDefinition?.label ?? appType,
          appType,
          x: 80 + offset,
          y: 60 + offset,
          width: size.w,
          height: size.h,
          isMinimized: false,
          isMinimizing: false,
          minimizeTarget: undefined,
          isMaximized: false,
          zIndex,
        },
      ]);
    },
    [allocateZIndex, clearMinimizeTimer]
  );

  const openStickiesApp = useCallback(async () => {
    const notes = await ensureStickiesExist();
    if (!notes || notes.length === 0) return;

    const openStickyIds = new Set(
      windowsRef.current
        .filter(isStickyWindow)
        .map((windowState) => windowState.stickyId)
    );
    const unopenedNotes = notes.filter((note) => !openStickyIds.has(note._id));

    if (unopenedNotes.length > 0) {
      openStickyWindows(unopenedNotes);
      return;
    }

    await createStickyNote();
  }, [createStickyNote, ensureStickiesExist, openStickyWindows]);

  const openApp = useCallback(
    (appType: string) => {
      if (appType === 'stickies') {
        if (isMobile) {
          void ensureStickiesExist();
          openRegularApp(appType);
          return;
        }

        void openStickiesApp();
        return;
      }

      openRegularApp(appType);
    },
    [ensureStickiesExist, isMobile, openRegularApp, openStickiesApp]
  );

  const closeWindow = useCallback(
    (id: string) => {
      clearMinimizeTimer(id);
      setWindows((previous) =>
        previous.filter((windowState) => windowState.id !== id)
      );
    },
    [clearMinimizeTimer]
  );

  const minimizeWindow = useCallback(
    (id: string) => {
      const activeWindow = windowsRef.current.find(
        (windowState): windowState is AppWindowState =>
          isAppWindow(windowState) && windowState.id === id
      );
      if (!activeWindow) return;

      clearMinimizeTimer(id);

      const minimizeTarget = dockTargetsRef.current[activeWindow.appType];

      if (!minimizeTarget) {
        setWindows((previous) =>
          previous.map((windowState) =>
            windowState.id === id && isAppWindow(windowState)
              ? {
                  ...windowState,
                  isMinimized: true,
                  isMinimizing: false,
                  minimizeTarget: undefined,
                }
              : windowState
          )
        );
        return;
      }

      setWindows((previous) =>
        previous.map((windowState) =>
          windowState.id === id && isAppWindow(windowState)
            ? {
                ...windowState,
                isMinimized: false,
                isMinimizing: true,
                minimizeTarget,
              }
            : windowState
        )
      );

      minimizeTimersRef.current[id] = window.setTimeout(() => {
        setWindows((previous) =>
          previous.map((windowState) =>
            windowState.id === id && isAppWindow(windowState)
              ? {
                  ...windowState,
                  isMinimized: true,
                  isMinimizing: false,
                  minimizeTarget: undefined,
                }
              : windowState
          )
        );
        delete minimizeTimersRef.current[id];
      }, MINIMIZE_DURATION_MS);
    },
    [clearMinimizeTimer]
  );

  const maximizeWindow = useCallback((id: string) => {
    setWindows((previous) =>
      previous.map((windowState) =>
        windowState.id === id && isAppWindow(windowState)
          ? { ...windowState, isMaximized: !windowState.isMaximized }
          : windowState
      )
    );
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      const zIndex = allocateZIndex();
      setWindows((previous) =>
        previous.map((windowState) =>
          windowState.id === id ? { ...windowState, zIndex } : windowState
        )
      );
    },
    [allocateZIndex]
  );

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((previous) =>
      previous.map((windowState) =>
        windowState.id === id ? { ...windowState, x, y } : windowState
      )
    );
  }, []);

  const resizeWindow = useCallback(
    (id: string, width: number, height: number) => {
      setWindows((previous) =>
        previous.map((windowState) =>
          windowState.id === id
            ? { ...windowState, width, height }
            : windowState
        )
      );
    },
    []
  );

  const patchStickyNote = useCallback(
    async (stickyId: Id<'stickies'>, patch: StickyPatch) => {
      await updateSticky({ stickyId, ...patch });
    },
    [updateSticky]
  );

  const handleStickyContentChange = useCallback(
    async (stickyId: Id<'stickies'>, html: string) => {
      await patchStickyNote(stickyId, { content: html });
    },
    [patchStickyNote]
  );

  const deleteStickyNote = useCallback(
    async (stickyId: Id<'stickies'>) => {
      setWindows((previous) =>
        previous.filter(
          (windowState) =>
            !(isStickyWindow(windowState) && windowState.stickyId === stickyId)
        )
      );
      await deleteSticky({ stickyId });
    },
    [deleteSticky]
  );

  const focusedWindow = useMemo(() => {
    const visibleWindows = windows.filter(
      (windowState) => !isAppWindow(windowState) || !windowState.isMinimized
    );
    if (visibleWindows.length === 0) return null;
    return visibleWindows.reduce((previous, current) =>
      previous.zIndex > current.zIndex ? previous : current
    );
  }, [windows]);

  const focusedStickyWindow = useMemo(
    () =>
      focusedWindow && isStickyWindow(focusedWindow) ? focusedWindow : null,
    [focusedWindow]
  );

  const focusedSticky = useMemo(
    () =>
      focusedStickyWindow
        ? (stickyDocs.find(
            (note) => note._id === focusedStickyWindow.stickyId
          ) ?? null)
        : null,
    [focusedStickyWindow, stickyDocs]
  );

  const handleFinderTitleChange = useCallback(
    (windowId: string, title: string) => {
      setWindows((previous) => {
        let didChange = false;

        const nextWindows = previous.map((windowState) => {
          if (windowState.id !== windowId || windowState.title === title) {
            return windowState;
          }

          didChange = true;
          return {
            ...windowState,
            title,
          };
        });

        return didChange ? nextWindows : previous;
      });
    },
    []
  );

  const minimizedIds = useMemo(
    () =>
      windows
        .filter(
          (windowState) =>
            isAppWindow(windowState) &&
            (windowState.isMinimized || windowState.isMinimizing)
        )
        .map((windowState) => windowState.appType),
    [windows]
  );

  const openAppIds = useMemo(
    () =>
      Array.from(new Set(windows.map((windowState) => windowState.appType))),
    [windows]
  );

  const registerStickyEditor = useCallback(
    (stickyId: Id<'stickies'>, editor: HTMLDivElement | null) => {
      if (editor) {
        stickyEditorsRef.current[stickyId] = editor;
        return;
      }

      delete stickyEditorsRef.current[stickyId];
    },
    []
  );

  const focusStickyEditor = useCallback(
    (stickyId?: Id<'stickies'>) => {
      const targetId = stickyId ?? focusedSticky?._id;
      if (!targetId) return null;

      const editor = stickyEditorsRef.current[targetId];
      if (!editor) return null;

      editor.focus();
      return editor;
    },
    [focusedSticky?._id]
  );

  const syncStickyEditorContent = useCallback(
    (stickyId: Id<'stickies'>) => {
      const editor = stickyEditorsRef.current[stickyId];
      if (!editor) return;
      void patchStickyNote(stickyId, {
        content: editor.innerHTML.trim() || '<div><br></div>',
      });
    },
    [patchStickyNote]
  );

  const runStickyExecCommand = useCallback(
    async (command: string, value?: string) => {
      if (!focusedSticky) return;

      const editor = focusStickyEditor(focusedSticky._id);
      if (!editor) return;

      document.execCommand('styleWithCSS', false, 'true');
      const success = document.execCommand(command, false, value);

      if (!success && command === 'paste' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.execCommand('insertText', false, text);
        }
      }

      if (
        !success &&
        (command === 'copy' || command === 'cut') &&
        navigator.clipboard?.writeText
      ) {
        const selectedText = window.getSelection()?.toString() ?? '';
        if (selectedText) {
          await navigator.clipboard.writeText(selectedText);
          if (command === 'cut') {
            document.execCommand('delete');
          }
        }
      }

      syncStickyEditorContent(focusedSticky._id);
    },
    [focusStickyEditor, focusedSticky, syncStickyEditorContent]
  );

  const createHelpStickyNote = useCallback(async () => {
    const viewport = getViewport();
    const created = await createSticky(
      buildNewStickySeed({
        index: stickyDocs.length,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        color: 'yellow',
        width: 360,
        height: 170,
        content: STICKIES_HELP_NOTE_HTML,
      })
    );

    if (!created || isMobile) return;
    openStickyWindows([created]);
  }, [
    createSticky,
    getViewport,
    isMobile,
    openStickyWindows,
    stickyDocs.length,
  ]);

  const duplicateFocusedSticky = useCallback(async () => {
    if (!focusedSticky) return;

    const viewport = getViewport();
    const seed = buildNewStickySeed({
      index: stickyDocs.length,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      content: focusedSticky.content,
      color: focusedSticky.color,
      width: focusedStickyWindow?.width ?? focusedSticky.width,
      height: focusedStickyWindow?.height ?? focusedSticky.height,
    });

    seed.x = Math.min(
      Math.max(22, viewport.width - seed.width - 22),
      (focusedStickyWindow?.x ?? focusedSticky.x) + 26
    );
    seed.y = Math.min(
      Math.max(30, viewport.height - seed.height - 120),
      (focusedStickyWindow?.y ?? focusedSticky.y) + 26
    );
    seed.isTranslucent = focusedSticky.isTranslucent;

    const created = await createSticky(seed);
    if (!created || isMobile) return;
    openStickyWindows([created]);
  }, [
    createSticky,
    focusedSticky,
    focusedStickyWindow,
    getViewport,
    isMobile,
    openStickyWindows,
    stickyDocs.length,
  ]);

  const deleteFocusedSticky = useCallback(() => {
    if (!focusedSticky) return;
    void deleteStickyNote(focusedSticky._id);
  }, [deleteStickyNote, focusedSticky]);

  const setFocusedStickyColor = useCallback(
    (color: StickyColor) => {
      if (!focusedSticky) return;
      void patchStickyNote(focusedSticky._id, { color });
    },
    [focusedSticky, patchStickyNote]
  );

  const toggleFocusedStickyCollapse = useCallback(() => {
    if (!focusedSticky) return;
    void patchStickyNote(focusedSticky._id, {
      isCollapsed: !focusedSticky.isCollapsed,
      isZoomed: focusedSticky.isCollapsed ? focusedSticky.isZoomed : false,
    });
  }, [focusedSticky, patchStickyNote]);

  const toggleFocusedStickyZoom = useCallback(() => {
    if (!focusedSticky) return;
    void patchStickyNote(focusedSticky._id, {
      isCollapsed: false,
      isZoomed: !focusedSticky.isZoomed,
    });
  }, [focusedSticky, patchStickyNote]);

  const toggleFocusedStickyTranslucency = useCallback(() => {
    if (!focusedSticky) return;
    void patchStickyNote(focusedSticky._id, {
      isTranslucent: !focusedSticky.isTranslucent,
    });
  }, [focusedSticky, patchStickyNote]);

  const bringAllStickiesToFront = useCallback(() => {
    openStickyWindows(stickyDocs);
    setWindows((previous) => {
      const stickyWindows = previous.filter(isStickyWindow);
      const orderedIds = stickyWindows
        .sort((left, right) => left.zIndex - right.zIndex)
        .map((windowState) => windowState.id);

      const zIndexes = new Map(
        orderedIds.map((id, index) => [id, nextZRef.current + index])
      );
      nextZRef.current += orderedIds.length;

      return previous.map((windowState) =>
        zIndexes.has(windowState.id)
          ? { ...windowState, zIndex: zIndexes.get(windowState.id)! }
          : windowState
      );
    });
  }, [openStickyWindows, stickyDocs]);

  const cascadeStickyWindows = useCallback(() => {
    const stickyWindows = windowsRef.current.filter(isStickyWindow);
    if (stickyWindows.length === 0) return;

    stickyWindows
      .sort((left, right) => left.zIndex - right.zIndex)
      .forEach((windowState, index) => {
        const x = 40 + index * 30;
        const y = 54 + index * 24;
        moveWindow(windowState.id, x, y);
        void patchStickyNote(windowState.stickyId, { x, y });
      });
  }, [moveWindow, patchStickyNote]);

  const tileStickyWindows = useCallback(() => {
    const stickyWindows = windowsRef.current.filter(isStickyWindow);
    if (stickyWindows.length === 0) return;

    const viewport = getViewport();
    const columns = Math.max(1, Math.ceil(Math.sqrt(stickyWindows.length)));
    const cellWidth = Math.floor((viewport.width - 64) / columns);
    const rows = Math.ceil(stickyWindows.length / columns);
    const cellHeight = Math.floor((viewport.height - 140) / rows);

    stickyWindows.forEach((windowState, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const width = Math.max(220, cellWidth - 22);
      const height = Math.max(150, cellHeight - 18);
      const x = 24 + column * cellWidth;
      const y = 36 + row * cellHeight;

      moveWindow(windowState.id, x, y);
      resizeWindow(windowState.id, width, height);
      void patchStickyNote(windowState.stickyId, { x, y, width, height });
    });
  }, [getViewport, moveWindow, patchStickyNote, resizeWindow]);

  const findInFocusedSticky = useCallback(
    (repeat = false) => {
      const editor = focusStickyEditor();
      if (!editor) return;

      const nextTerm = repeat
        ? lastFindTermRef.current
        : window.prompt(
            'Find text in the active note',
            lastFindTermRef.current
          );

      if (!nextTerm) return;
      lastFindTermRef.current = nextTerm;
      editor.focus();
      const stickyWindow = window as Window & {
        find?: (
          string: string,
          caseSensitive?: boolean,
          backwards?: boolean,
          wrapAround?: boolean,
          wholeWord?: boolean,
          searchInFrames?: boolean,
          showDialog?: boolean
        ) => boolean;
      };
      stickyWindow.find?.(nextTerm, false, false, true, false, false, false);
    },
    [focusStickyEditor]
  );

  const renderAppContent = (appType: string, windowId?: string) => {
    switch (appType) {
      case 'finder':
        return (
          <FinderApp
            projects={data.projects}
            windowId={windowId}
            onTitleChange={handleFinderTitleChange}
          />
        );
      case 'trash':
        return (
          <FinderApp
            projects={data.projects}
            mode="trash"
            windowId={windowId}
            onTitleChange={handleFinderTitleChange}
          />
        );
      case 'preferences':
        return (
          <SystemPreferencesApp
            ipKey={wallpaperIpKey}
            currentWallpaperUrl={wallpaper?.url ?? null}
            defaultWallpaperUrl="/os-x/background.png"
          />
        );
      case 'stickies':
        return (
          <StickiesApp
            stickies={stickyDocs}
            onCreateSticky={createStickyNote}
            onDeleteSticky={deleteStickyNote}
            onPatchSticky={patchStickyNote}
            onContentChange={handleStickyContentChange}
          />
        );
      case 'safari':
        return <SafariApp projects={data.projects} />;
      case 'photos':
        return <PhotosApp projects={data.projects} />;
      case 'mail':
        return (
          <MailApp
            email={data.profile?.contact?.email ?? 'jacob@jacobstein.me'}
            name={data.profile?.name ?? 'Jacob Stein'}
          />
        );
      case 'photobooth':
        return <PhotoBoothApp />;
      case 'ichat':
        return (
          <IChatApp
            name={data.profile?.name ?? 'Jacob Stein'}
            title={data.profile?.title ?? 'Developer'}
            summary={data.summary}
            skills={data.skills}
            projects={data.projects}
          />
        );
      case 'terminal':
        return (
          <TerminalApp
            name={data.profile?.name ?? 'Jacob Stein'}
            title={data.profile?.title ?? 'Developer'}
            skills={data.skills}
            projectCount={data.projects.length}
          />
        );
      default:
        return (
          <div className="p-4 text-[11px]" style={{ color: '#666' }}>
            Unknown app
          </div>
        );
    }
  };

  useEffect(() => {
    if (isMobile) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 'n'
      ) {
        return;
      }

      if (focusedWindow?.appType !== 'stickies') return;
      event.preventDefault();
      void createStickyNote();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createStickyNote, focusedWindow?.appType, isMobile]);

  return (
    <ClientOnly
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: '#e8e8e8' }}
        >
          <p className="text-[13px]" style={{ color: '#888' }}>
            Loading...
          </p>
        </div>
      }
    >
      {!booted ? (
        <BootScreen onComplete={() => setBooted(true)} />
      ) : (
        <div
          className="fixed inset-0 overflow-hidden select-none"
          style={{
            fontFamily:
              "'Lucida Grande', 'Geneva', 'Helvetica Neue', sans-serif",
          }}
        >
          <Desktop
            icons={DESKTOP_ITEMS}
            onOpenApp={openApp}
            wallpaperUrl={wallpaper?.url ?? null}
          />

          {!isMobile && (
            <MenuBar
              focusedWindowTitle={focusedWindow?.title ?? null}
              focusedAppType={focusedWindow?.appType ?? null}
              onOpenApp={openApp}
              stickiesMenu={{
                enabled: focusedWindow?.appType === 'stickies',
                activeColor: focusedSticky?.color ?? 'yellow',
                hasFocusedNote: focusedSticky !== null,
                isCollapsed: focusedSticky?.isCollapsed ?? false,
                isTranslucent: focusedSticky?.isTranslucent ?? false,
                isZoomed: focusedSticky?.isZoomed ?? false,
                onAbout: createHelpStickyNote,
                onNewNote: createStickyNote,
                onDuplicateNote: duplicateFocusedSticky,
                onDeleteNote: deleteFocusedSticky,
                onUndo: () => void runStickyExecCommand('undo'),
                onRedo: () => void runStickyExecCommand('redo'),
                onCut: () => void runStickyExecCommand('cut'),
                onCopy: () => void runStickyExecCommand('copy'),
                onPaste: () => void runStickyExecCommand('paste'),
                onSelectAll: () => void runStickyExecCommand('selectAll'),
                onFind: () => findInFocusedSticky(false),
                onFindNext: () => findInFocusedSticky(true),
                onToggleBold: () => void runStickyExecCommand('bold'),
                onToggleItalic: () => void runStickyExecCommand('italic'),
                onToggleUnderline: () => void runStickyExecCommand('underline'),
                onToggleStrikeThrough: () =>
                  void runStickyExecCommand('strikeThrough'),
                onAlignLeft: () => void runStickyExecCommand('justifyLeft'),
                onAlignCenter: () => void runStickyExecCommand('justifyCenter'),
                onAlignRight: () => void runStickyExecCommand('justifyRight'),
                onSetFont: (font) =>
                  void runStickyExecCommand('fontName', font),
                onSetFontSize: (size) =>
                  void runStickyExecCommand('fontSize', size),
                onSetTextColor: (color) =>
                  void runStickyExecCommand('foreColor', color),
                onSetNoteColor: setFocusedStickyColor,
                onToggleTranslucent: toggleFocusedStickyTranslucency,
                onToggleCollapse: toggleFocusedStickyCollapse,
                onToggleZoom: toggleFocusedStickyZoom,
                onBringAllToFront: bringAllStickiesToFront,
                onCascade: cascadeStickyWindows,
                onTile: tileStickyWindows,
                onOpenHelp: createHelpStickyNote,
              }}
            />
          )}

          {windows.map((windowState) => {
            if (isStickyWindow(windowState) && !isMobile) {
              const sticky = stickyDocs.find(
                (stickyNote) => stickyNote._id === windowState.stickyId
              );
              if (!sticky) return null;

              return (
                <StickyNoteWindow
                  key={windowState.id}
                  note={sticky}
                  x={windowState.x}
                  y={windowState.y}
                  width={windowState.width}
                  height={windowState.height}
                  zIndex={windowState.zIndex}
                  isFocused={focusedWindow?.id === windowState.id}
                  onFocus={() => focusWindow(windowState.id)}
                  onDelete={deleteStickyNote}
                  onPatchSticky={patchStickyNote}
                  onContentChange={handleStickyContentChange}
                  onRegisterEditor={registerStickyEditor}
                  onMove={(x, y) => moveWindow(windowState.id, x, y)}
                  onMoveEnd={(x, y) => {
                    moveWindow(windowState.id, x, y);
                    void patchStickyNote(sticky._id, { x, y });
                  }}
                  onResize={(width, height) =>
                    resizeWindow(windowState.id, width, height)
                  }
                  onResizeEnd={(width, height) => {
                    resizeWindow(windowState.id, width, height);
                    void patchStickyNote(sticky._id, { width, height });
                  }}
                />
              );
            }

            if (!isAppWindow(windowState)) return null;

            return (
              <Window
                key={windowState.id}
                id={windowState.id}
                title={windowState.title}
                x={windowState.x}
                y={windowState.y}
                width={windowState.width}
                height={windowState.height}
                isMinimized={windowState.isMinimized}
                isMinimizing={windowState.isMinimizing}
                minimizeTarget={windowState.minimizeTarget}
                isMaximized={windowState.isMaximized}
                zIndex={windowState.zIndex}
                isFocused={focusedWindow?.id === windowState.id}
                isMobile={isMobile}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onMaximize={maximizeWindow}
                onFocus={focusWindow}
                onMove={moveWindow}
                onResize={resizeWindow}
              >
                {renderAppContent(windowState.appType, windowState.id)}
              </Window>
            );
          })}

          <Dock
            apps={APP_DEFS}
            minimizedIds={minimizedIds}
            openAppIds={openAppIds}
            onOpenApp={openApp}
            isMobile={isMobile}
            onIconLayout={(appId, target) => {
              dockTargetsRef.current[appId] = target;
            }}
          />
        </div>
      )}
    </ClientOnly>
  );
}
