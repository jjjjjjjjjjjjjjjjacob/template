import { useDeferredValue, useEffect, useRef, useState } from 'react';
import type { Doc, Id } from '@template/convex/dataModel';

export type StickyNote = Doc<'stickies'>;
export type StickyColor = StickyNote['color'];

export interface StickySeed {
  content: string;
  color: StickyColor;
  x: number;
  y: number;
  width: number;
  height: number;
  isCollapsed?: boolean;
  isTranslucent?: boolean;
  isZoomed?: boolean;
}

export interface StickyPatch {
  content?: string;
  color?: StickyColor;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isCollapsed?: boolean;
  isTranslucent?: boolean;
  isZoomed?: boolean;
}

interface StickyColorTheme {
  border: string;
  shadow: string;
  header: string;
  paper: string;
  paperAlt: string;
  text: string;
}

export const STICKY_FONT_OPTIONS = [
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Lucida Grande', value: 'Lucida Grande' },
  { label: 'Marker Felt', value: 'Marker Felt' },
  { label: 'Courier', value: 'Courier New' },
  { label: 'Times', value: 'Times New Roman' },
] as const;

export const STICKY_FONT_SIZE_OPTIONS = [
  { label: 'Small', value: '3' },
  { label: 'Medium', value: '4' },
  { label: 'Large', value: '5' },
  { label: 'Huge', value: '6' },
] as const;

export const STICKY_TEXT_COLOR_OPTIONS = [
  { label: 'Black', value: '#111111' },
  { label: 'Red', value: '#c22f2f' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Green', value: '#1f7a3d' },
  { label: 'Purple', value: '#7c3aed' },
] as const;

const STICKY_THEMES: Record<StickyColor, StickyColorTheme> = {
  yellow: {
    border: '#d8b42c',
    shadow: 'rgba(103, 78, 10, 0.28)',
    header: '#f8e97c',
    paper: '#fff28d',
    paperAlt: '#fff6b6',
    text: '#1c1c1c',
  },
  blue: {
    border: '#3ab0d6',
    shadow: 'rgba(20, 82, 116, 0.28)',
    header: '#75d8f7',
    paper: '#8fe4ff',
    paperAlt: '#b4efff',
    text: '#111111',
  },
  green: {
    border: '#77c85d',
    shadow: 'rgba(49, 93, 30, 0.26)',
    header: '#93e779',
    paper: '#a7f18e',
    paperAlt: '#c4f6b5',
    text: '#111111',
  },
  pink: {
    border: '#d28b9d',
    shadow: 'rgba(108, 58, 69, 0.24)',
    header: '#f3abb6',
    paper: '#f5bac0',
    paperAlt: '#f8d0d6',
    text: '#111111',
  },
  purple: {
    border: '#9177d9',
    shadow: 'rgba(70, 50, 120, 0.24)',
    header: '#b59cf0',
    paper: '#c7b3fb',
    paperAlt: '#ddd0ff',
    text: '#111111',
  },
  gray: {
    border: '#a0a0a0',
    shadow: 'rgba(60, 60, 60, 0.2)',
    header: '#d3d3d3',
    paper: '#ececec',
    paperAlt: '#f6f6f6',
    text: '#111111',
  },
};

export const STICKY_COLOR_ORDER = Object.keys(STICKY_THEMES) as StickyColor[];

const STICKY_MIN_WIDTH = 200;
const STICKY_MIN_HEIGHT = 140;
const EMPTY_STICKY_HTML = '<div><br></div>';
const STICKY_EDITOR_CLASS = 'alt7-sticky-editor';
const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

export const STICKIES_HELP_NOTE_HTML = `
  <div><b>Stickies menu quick reference</b></div>
  <div><br></div>
  <div>File: new, duplicate, delete, help note</div>
  <div>Edit: undo, redo, cut, copy, paste, select all, find</div>
  <div>Note: bold, italic, underline, strike, align, font, size</div>
  <div>Color: swap the paper color of the active note</div>
  <div>Window: bring forward, cascade, tile, zoom</div>
`;

interface BuildDefaultStickiesArgs {
  viewportWidth: number;
  viewportHeight: number;
}

interface BuildNewStickySeedArgs {
  index: number;
  viewportWidth: number;
  viewportHeight: number;
  content?: string;
  color?: StickyColor;
  width?: number;
  height?: number;
}

interface StickyEditorProps {
  note: StickyNote;
  onContentChange: (
    stickyId: Id<'stickies'>,
    html: string
  ) => Promise<void> | void;
  onRegisterEditor?: (
    stickyId: Id<'stickies'>,
    editor: HTMLDivElement | null
  ) => void;
  onFocus?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

interface StickyNoteWindowProps {
  note: StickyNote;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isFocused: boolean;
  onFocus: () => void;
  onDelete: (stickyId: Id<'stickies'>) => Promise<void> | void;
  onPatchSticky: (
    stickyId: Id<'stickies'>,
    patch: StickyPatch
  ) => Promise<void> | void;
  onMove: (x: number, y: number) => void;
  onMoveEnd: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onResizeEnd: (width: number, height: number) => void;
  onContentChange: (
    stickyId: Id<'stickies'>,
    html: string
  ) => Promise<void> | void;
  onRegisterEditor: (
    stickyId: Id<'stickies'>,
    editor: HTMLDivElement | null
  ) => void;
}

interface StickiesAppProps {
  stickies: StickyNote[];
  onCreateSticky: () => Promise<void> | void;
  onDeleteSticky: (stickyId: Id<'stickies'>) => Promise<void> | void;
  onPatchSticky: (
    stickyId: Id<'stickies'>,
    patch: StickyPatch
  ) => Promise<void> | void;
  onContentChange: (
    stickyId: Id<'stickies'>,
    html: string
  ) => Promise<void> | void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toStickyHtml(content: string) {
  if (!content.trim()) return EMPTY_STICKY_HTML;
  if (HTML_PATTERN.test(content)) return content;
  return escapeHtml(content).replace(/\n/g, '<br>');
}

function normalizeStickyHtml(html: string) {
  const trimmed = html.trim();
  return trimmed.length > 0 ? trimmed : EMPTY_STICKY_HTML;
}

function stickyHtmlToText(content: string) {
  const html = toStickyHtml(content);
  if (typeof document === 'undefined') {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  return (container.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

function getStickyTitle(content: string) {
  return (
    stickyHtmlToText(content)
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? 'untitled note'
  );
}

function formatStickyInfo(note: StickyNote) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return `created ${formatter.format(new Date(note.createdAt))} • updated ${formatter.format(new Date(note.updatedAt))}`;
}

function StickyEditor({
  note,
  onContentChange,
  onRegisterEditor,
  onFocus,
  className,
  style,
}: StickyEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState(() =>
    normalizeStickyHtml(toStickyHtml(note.content))
  );
  const deferredHtml = useDeferredValue(html);

  useEffect(() => {
    const nextHtml = normalizeStickyHtml(toStickyHtml(note.content));
    setHtml(nextHtml);

    if (editorRef.current && editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [note._id, note.content]);

  useEffect(() => {
    if (!onRegisterEditor) return;
    onRegisterEditor(note._id, editorRef.current);
    return () => onRegisterEditor(note._id, null);
  }, [note._id, onRegisterEditor]);

  useEffect(() => {
    const savedHtml = normalizeStickyHtml(toStickyHtml(note.content));
    if (deferredHtml === savedHtml) return;

    const timeoutId = window.setTimeout(() => {
      void onContentChange(note._id, deferredHtml);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [deferredHtml, note._id, note.content, onContentChange]);

  return (
    <>
      <style>{`
        .${STICKY_EDITOR_CLASS},
        .${STICKY_EDITOR_CLASS} * {
          box-sizing: border-box;
        }

        .${STICKY_EDITOR_CLASS} {
          white-space: pre-wrap;
          word-break: break-word;
          outline: none;
        }

        .${STICKY_EDITOR_CLASS} div,
        .${STICKY_EDITOR_CLASS} p {
          margin: 0;
          min-height: 1.15em;
        }

        .${STICKY_EDITOR_CLASS} ul,
        .${STICKY_EDITOR_CLASS} ol {
          margin: 0.25rem 0;
          padding-left: 1.2rem;
        }
      `}</style>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        tabIndex={0}
        suppressContentEditableWarning
        spellCheck
        className={`${STICKY_EDITOR_CLASS} ${className ?? ''}`.trim()}
        style={style}
        onFocus={onFocus}
        onInput={(event) => {
          const nextHtml = normalizeStickyHtml(
            (event.currentTarget as HTMLDivElement).innerHTML
          );
          setHtml(nextHtml);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          document.execCommand('insertText', false, '    ');
        }}
      />
    </>
  );
}

function StickyColorPicker({
  activeColor,
  onChange,
}: {
  activeColor: StickyColor;
  onChange: (color: StickyColor) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-sm bg-black/10 px-1.5 py-1">
      {STICKY_COLOR_ORDER.map((color) => {
        const theme = STICKY_THEMES[color];
        return (
          <button
            key={color}
            type="button"
            aria-label={`switch to ${color} sticky`}
            className="h-3.5 w-3.5 border transition-transform hover:scale-110"
            style={{
              background: theme.paper,
              borderColor: color === activeColor ? '#111' : theme.border,
              boxShadow:
                color === activeColor
                  ? '0 0 0 1px rgba(255,255,255,0.55) inset'
                  : '0 1px 0 rgba(255,255,255,0.35) inset',
            }}
            onClick={() => onChange(color)}
          />
        );
      })}
    </div>
  );
}

export function buildNewStickySeed({
  index,
  viewportWidth,
  viewportHeight,
  content = EMPTY_STICKY_HTML,
  color = STICKY_COLOR_ORDER[index % STICKY_COLOR_ORDER.length] ?? 'yellow',
  width = 260,
  height = 210,
}: BuildNewStickySeedArgs): StickySeed {
  const x = clamp(
    82 + (index % 4) * 36,
    22,
    Math.max(22, viewportWidth - width - 22)
  );
  const y = clamp(
    54 + (index % 5) * 28,
    30,
    Math.max(30, viewportHeight - height - 120)
  );

  return {
    content,
    color,
    x,
    y,
    width,
    height,
    isCollapsed: false,
    isTranslucent: false,
    isZoomed: false,
  };
}

export function buildDefaultStickies({
  viewportWidth,
  viewportHeight,
}: BuildDefaultStickiesArgs): StickySeed[] {
  return [
    {
      ...buildNewStickySeed({
        index: 0,
        viewportWidth,
        viewportHeight,
        color: 'yellow',
        content: EMPTY_STICKY_HTML,
        width: 188,
        height: 220,
      }),
      x: clamp(40, 22, Math.max(22, viewportWidth - 230)),
      y: clamp(54, 30, Math.max(30, viewportHeight - 280)),
    },
    {
      ...buildNewStickySeed({
        index: 1,
        viewportWidth,
        viewportHeight,
        color: 'green',
        width: 380,
        height: 104,
        content: `
          <div><b>Welcome to Stickies</b></div>
          <div><br></div>
          <div>This is a Mac OS X implementation of the popular Classic Mac OS Stickies application.</div>
        `,
      }),
      x: clamp(248, 22, Math.max(22, viewportWidth - 420)),
      y: clamp(53, 30, Math.max(30, viewportHeight - 164)),
    },
    {
      ...buildNewStickySeed({
        index: 2,
        viewportWidth,
        viewportHeight,
        color: 'blue',
        width: 331,
        height: 87,
        content: `
          <div>Stickies lets you write notes (like these) and stick them on your screen. You can use Stickies to jot quick notes, to write reminders, or to store frequently used text. Your notes are visible whenever the Stickies program is active.</div>
        `,
      }),
      x: clamp(271, 22, Math.max(22, viewportWidth - 371)),
      y: clamp(141, 30, Math.max(30, viewportHeight - 147)),
    },
    {
      ...buildNewStickySeed({
        index: 3,
        viewportWidth,
        viewportHeight,
        color: 'pink',
        width: 476,
        height: 134,
        content: `
          <div><b>This version has the following enhancements over the Classic Mac OS version</b></div>
          <div><br></div>
          <div>Styled text, <b>bold</b>, <i>italic</i>, <span style="color:#c22f2f;">color</span>, font and graphics.</div>
          <div>Notes of unlimited size.</div>
          <div>Find text in single notes or across multiple notes.</div>
          <div>Notes save automatically and reopen through the desktop route.</div>
        `,
      }),
      x: clamp(289, 22, Math.max(22, viewportWidth - 516)),
      y: clamp(227, 30, Math.max(30, viewportHeight - 194)),
    },
  ];
}

export function StickyNoteWindow({
  note,
  x,
  y,
  width,
  height,
  zIndex,
  isFocused,
  onFocus,
  onDelete,
  onPatchSticky,
  onMove,
  onMoveEnd,
  onResize,
  onResizeEnd,
  onContentChange,
  onRegisterEditor,
}: StickyNoteWindowProps) {
  const theme = STICKY_THEMES[note.color];
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originWidth: number;
    originHeight: number;
  } | null>(null);

  const resolvedHeight = note.isCollapsed ? 18 : height;

  const handleDelete = () => {
    if (!window.confirm('delete this sticky?')) return;
    void onDelete(note._id);
  };

  const handleHeaderPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    event.preventDefault();
    onFocus();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: x,
      originY: y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHeaderPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId)
      return;

    const nextX =
      dragRef.current.originX + (event.clientX - dragRef.current.startX);
    const nextY =
      dragRef.current.originY + (event.clientY - dragRef.current.startY);
    onMove(nextX, nextY);
  };

  const handleHeaderPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId)
      return;

    const nextX =
      dragRef.current.originX + (event.clientX - dragRef.current.startX);
    const nextY =
      dragRef.current.originY + (event.clientY - dragRef.current.startY);
    dragRef.current = null;
    onMoveEnd(nextX, nextY);
  };

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onFocus();

    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: width,
      originHeight: height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!resizeRef.current || resizeRef.current.pointerId !== event.pointerId)
      return;

    const nextWidth = Math.max(
      STICKY_MIN_WIDTH,
      resizeRef.current.originWidth + (event.clientX - resizeRef.current.startX)
    );
    const nextHeight = Math.max(
      STICKY_MIN_HEIGHT,
      resizeRef.current.originHeight +
        (event.clientY - resizeRef.current.startY)
    );

    onResize(nextWidth, nextHeight);
  };

  const handleResizePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current || resizeRef.current.pointerId !== event.pointerId)
      return;

    const nextWidth = Math.max(
      STICKY_MIN_WIDTH,
      resizeRef.current.originWidth + (event.clientX - resizeRef.current.startX)
    );
    const nextHeight = Math.max(
      STICKY_MIN_HEIGHT,
      resizeRef.current.originHeight +
        (event.clientY - resizeRef.current.startY)
    );

    resizeRef.current = null;
    onResizeEnd(nextWidth, nextHeight);
  };

  const toggleCollapsed = () => {
    void onPatchSticky(note._id, {
      isCollapsed: !note.isCollapsed,
      isZoomed: note.isCollapsed ? note.isZoomed : false,
    });
  };

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: note.isZoomed ? 26 : x,
        top: note.isZoomed ? 34 : y,
        width: note.isZoomed ? 'calc(100vw - 52px)' : width,
        height: note.isZoomed ? 'calc(100vh - 116px)' : resolvedHeight,
        border: `1px solid ${theme.border}`,
        background: `linear-gradient(180deg, ${theme.paperAlt} 0%, ${theme.paper} 100%)`,
        boxShadow: isFocused
          ? `0 12px 30px ${theme.shadow}`
          : `0 8px 22px ${theme.shadow}`,
        zIndex,
        backdropFilter: note.isTranslucent ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: note.isTranslucent ? 'blur(12px)' : 'none',
        opacity: note.isTranslucent ? 0.88 : 1,
      }}
      onPointerDown={onFocus}
    >
      <div
        className="relative flex h-[18px] items-center justify-between px-1.5"
        title={formatStickyInfo(note)}
        role="button"
        tabIndex={0}
        style={{
          background: theme.header,
          borderBottom: `1px solid ${theme.border}`,
        }}
        onDoubleClick={toggleCollapsed}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          toggleCollapsed();
        }}
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
      >
        <button
          type="button"
          aria-label="delete sticky"
          className="h-[8px] w-[8px] border"
          style={{
            borderColor: '#b88900',
            background: '#fff7b0',
          }}
          onClick={handleDelete}
        />
        {note.isCollapsed && (
          <span className="pointer-events-none absolute inset-x-5 top-[1px] truncate text-[10px] font-medium text-[#222]">
            {getStickyTitle(note.content)}
          </span>
        )}
        <button
          type="button"
          aria-label={note.isZoomed ? 'restore sticky size' : 'zoom sticky'}
          className="relative h-[10px] w-[10px]"
          onClick={() =>
            void onPatchSticky(note._id, {
              isCollapsed: false,
              isZoomed: !note.isZoomed,
            })
          }
        >
          <span
            className="absolute top-0 right-0"
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderBottom: '8px solid rgba(0,0,0,0.28)',
            }}
          />
        </button>
      </div>

      {!note.isCollapsed && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[18px] bottom-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.02) 26%, transparent 100%)',
            }}
          />
          <StickyEditor
            note={note}
            onContentChange={onContentChange}
            onRegisterEditor={onRegisterEditor}
            onFocus={onFocus}
            className="h-full w-full"
            style={{
              minHeight: `calc(100% - 18px)`,
              padding: '12px 10px 16px',
              color: theme.text,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '14px',
              lineHeight: 1.3,
            }}
          />
          {!note.isZoomed && (
            <div
              className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize"
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            >
              <span
                className="absolute right-0 bottom-0"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '12px solid transparent',
                  borderTop: '12px solid rgba(255,255,255,0.5)',
                  filter: 'drop-shadow(-1px -1px 0 rgba(0,0,0,0.12))',
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function StickiesApp({
  stickies,
  onCreateSticky,
  onDeleteSticky,
  onPatchSticky,
  onContentChange,
}: StickiesAppProps) {
  return (
    <div
      className="min-h-full px-4 py-4"
      style={{
        background:
          'linear-gradient(180deg, rgba(236,236,236,0.96) 0%, rgba(210,210,210,0.94) 100%)',
      }}
    >
      <div
        className="mb-4 flex items-center justify-between border px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.72)',
          borderColor: 'rgba(0,0,0,0.15)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <p className="text-[12px] font-bold text-[#333]">Stickies</p>
          <p className="text-[12px] text-[#555]">
            styled notes, colors, and autosave are enabled.
          </p>
        </div>
        <button
          type="button"
          className="border px-3 py-1 text-[12px] font-semibold text-[#1c1c1c]"
          style={{
            background: 'linear-gradient(180deg, #fbfbfb 0%, #dadada 100%)',
            borderColor: '#999',
          }}
          onClick={() => void onCreateSticky()}
        >
          new note
        </button>
      </div>

      <div className="space-y-4">
        {stickies.map((sticky) => {
          const theme = STICKY_THEMES[sticky.color];
          return (
            <div
              key={sticky._id}
              className="relative overflow-hidden border"
              style={{
                background: `linear-gradient(180deg, ${theme.paperAlt} 0%, ${theme.paper} 100%)`,
                borderColor: theme.border,
                boxShadow: `0 10px 24px ${theme.shadow}`,
              }}
            >
              <div
                className="flex items-center justify-between border-b px-3 py-2"
                style={{
                  borderColor: theme.border,
                  background: theme.header,
                }}
              >
                <div className="text-[11px] font-semibold text-[#111]">
                  {getStickyTitle(sticky.content)}
                </div>
                <div className="flex items-center gap-2">
                  <StickyColorPicker
                    activeColor={sticky.color}
                    onChange={(color) =>
                      void onPatchSticky(sticky._id, { color })
                    }
                  />
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-[#111]"
                    onClick={() =>
                      void onPatchSticky(sticky._id, {
                        isTranslucent: !sticky.isTranslucent,
                      })
                    }
                  >
                    glass
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-[#111]"
                    onClick={() => {
                      if (!window.confirm('delete this sticky?')) return;
                      void onDeleteSticky(sticky._id);
                    }}
                  >
                    delete
                  </button>
                </div>
              </div>
              <StickyEditor
                note={sticky}
                onContentChange={onContentChange}
                className="min-h-[180px] w-full"
                style={{
                  padding: '12px 10px 14px',
                  color: theme.text,
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: '14px',
                  lineHeight: 1.3,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
