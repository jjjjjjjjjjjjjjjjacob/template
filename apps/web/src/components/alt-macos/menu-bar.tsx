import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useEffect, useState } from 'react';
import {
  STICKY_COLOR_ORDER,
  STICKY_FONT_OPTIONS,
  STICKY_FONT_SIZE_OPTIONS,
  STICKY_TEXT_COLOR_OPTIONS,
  type StickyColor,
} from '@/components/alt-macos/apps/stickies-app';

interface StickiesMenuControls {
  enabled: boolean;
  hasFocusedNote: boolean;
  activeColor: StickyColor;
  isCollapsed: boolean;
  isTranslucent: boolean;
  isZoomed: boolean;
  onAbout: () => void;
  onNewNote: () => void;
  onDuplicateNote: () => void;
  onDeleteNote: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onFind: () => void;
  onFindNext: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onToggleStrikeThrough: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onSetFont: (font: string) => void;
  onSetFontSize: (size: string) => void;
  onSetTextColor: (color: string) => void;
  onSetNoteColor: (color: StickyColor) => void;
  onToggleTranslucent: () => void;
  onToggleCollapse: () => void;
  onToggleZoom: () => void;
  onBringAllToFront: () => void;
  onCascade: () => void;
  onTile: () => void;
  onOpenHelp: () => void;
}

interface MenuBarProps {
  focusedWindowTitle: string | null;
  focusedAppType: string | null;
  onOpenApp: (appType: string) => void;
  stickiesMenu: StickiesMenuControls;
}

const menuContentClassName =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 z-[10000] min-w-[220px] overflow-hidden outline-none';
const menuItemClassName =
  'mx-1 flex cursor-default items-center justify-between rounded-sm px-3 py-[3px] text-[13px] outline-none data-[highlighted]:bg-[#3872c0] data-[highlighted]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-40';
const menuTriggerClassName =
  'flex cursor-default items-center justify-center rounded px-[10px] py-0 text-[13px] outline-none hover:bg-[#3872c0] hover:text-white data-[state=open]:bg-[#3872c0] data-[state=open]:text-white';

const menuContentStyle: React.CSSProperties = {
  fontFamily: "'Lucida Grande', sans-serif",
  fontSize: '13px',
  background: 'rgba(240,240,240,0.96)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: '6px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
  padding: '4px 0',
  color: '#111',
};

function MenuItem({
  children,
  shortcut,
  disabled = false,
  onSelect,
}: {
  children: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <DropdownMenuPrimitive.Item
      disabled={disabled}
      className={menuItemClassName}
      onSelect={(event) => {
        event.preventDefault();
        if (disabled) return;
        onSelect?.();
      }}
    >
      <span>{children}</span>
      <span className="ml-8 text-[11px] opacity-70">{shortcut}</span>
    </DropdownMenuPrimitive.Item>
  );
}

function MenuSeparator() {
  return (
    <DropdownMenuPrimitive.Separator
      className="mx-2 my-1 h-px"
      style={{ background: 'rgba(0,0,0,0.1)' }}
    />
  );
}

function TopMenu({
  label,
  children,
  bold = false,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger
        className={`${menuTriggerClassName}${bold ? 'font-bold' : ''}`}
      >
        {label}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          sideOffset={2}
          className={menuContentClassName}
          style={menuContentStyle}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

function AppleMenuIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="14"
      viewBox="0 0 12 14"
      fill="currentColor"
    >
      <path d="M8.37 2.44c.64-.78 1.04-1.86.93-2.44-.93.05-2 .62-2.66 1.39-.6.69-1.1 1.78-.96 2.32.99.08 2.03-.49 2.69-1.27Z" />
      <path d="M10.61 7.28c0-1.79 1.47-2.65 1.54-2.69-.84-1.22-2.14-1.39-2.59-1.41-1.09-.12-2.15.65-2.71.65-.57 0-1.42-.64-2.34-.62-1.19.02-2.3.7-2.92 1.79-1.26 2.18-.32 5.38.89 7.12.6.84 1.3 1.78 2.21 1.74.88-.04 1.22-.56 2.29-.56 1.06 0 1.36.56 2.3.54.95-.02 1.55-.85 2.13-1.7.69-.96.96-1.91.97-1.96-.02-.01-1.84-.71-1.84-2.9Z" />
    </svg>
  );
}

function FontSubmenu({ onSetFont }: { onSetFont: (font: string) => void }) {
  return (
    <DropdownMenuPrimitive.Sub>
      <DropdownMenuPrimitive.SubTrigger className={menuItemClassName}>
        <span>Font</span>
        <span className="ml-8 text-[11px] opacity-70">›</span>
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.SubContent
          sideOffset={4}
          className={menuContentClassName}
          style={menuContentStyle}
        >
          {STICKY_FONT_OPTIONS.map((font) => (
            <MenuItem key={font.value} onSelect={() => onSetFont(font.value)}>
              {font.label}
            </MenuItem>
          ))}
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  );
}

function FontSizeSubmenu({
  onSetFontSize,
}: {
  onSetFontSize: (size: string) => void;
}) {
  return (
    <DropdownMenuPrimitive.Sub>
      <DropdownMenuPrimitive.SubTrigger className={menuItemClassName}>
        <span>Size</span>
        <span className="ml-8 text-[11px] opacity-70">›</span>
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.SubContent
          sideOffset={4}
          className={menuContentClassName}
          style={menuContentStyle}
        >
          {STICKY_FONT_SIZE_OPTIONS.map((fontSize) => (
            <MenuItem
              key={fontSize.value}
              onSelect={() => onSetFontSize(fontSize.value)}
            >
              {fontSize.label}
            </MenuItem>
          ))}
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  );
}

function TextColorSubmenu({
  onSetTextColor,
}: {
  onSetTextColor: (color: string) => void;
}) {
  return (
    <DropdownMenuPrimitive.Sub>
      <DropdownMenuPrimitive.SubTrigger className={menuItemClassName}>
        <span>Text Color</span>
        <span className="ml-8 text-[11px] opacity-70">›</span>
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.SubContent
          sideOffset={4}
          className={menuContentClassName}
          style={menuContentStyle}
        >
          {STICKY_TEXT_COLOR_OPTIONS.map((color) => (
            <MenuItem
              key={color.value}
              onSelect={() => onSetTextColor(color.value)}
            >
              {color.label}
            </MenuItem>
          ))}
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  );
}

function NoteColorSubmenu({
  activeColor,
  onSetNoteColor,
}: {
  activeColor: StickyColor;
  onSetNoteColor: (color: StickyColor) => void;
}) {
  return (
    <DropdownMenuPrimitive.Sub>
      <DropdownMenuPrimitive.SubTrigger className={menuItemClassName}>
        <span>Note Color</span>
        <span className="ml-8 text-[11px] opacity-70">›</span>
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.SubContent
          sideOffset={4}
          className={menuContentClassName}
          style={menuContentStyle}
        >
          {STICKY_COLOR_ORDER.map((color) => (
            <MenuItem key={color} onSelect={() => onSetNoteColor(color)}>
              {color[0].toUpperCase() + color.slice(1)}
              {activeColor === color ? ' ✓' : ''}
            </MenuItem>
          ))}
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  );
}

export function MenuBar({
  focusedWindowTitle,
  focusedAppType,
  onOpenApp,
  stickiesMenu,
}: MenuBarProps) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    }

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isStickiesActive =
    focusedAppType === 'stickies' && stickiesMenu.enabled;

  return (
    <div
      className="fixed top-0 right-0 left-0 z-[9000] flex h-[22px] items-center justify-between px-2"
      style={{
        background: [
          'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,240,240,0.94) 42%, rgba(216,216,216,0.92) 100%)',
          'repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px)',
        ].join(','),
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.12)',
        borderBottom: '1px solid rgba(0,0,0,0.18)',
        fontFamily: "'Lucida Grande', Geneva, 'Helvetica Neue', sans-serif",
        fontSize: '13px',
        fontWeight: 400,
        color: '#000',
        textShadow: '0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      <div className="flex items-center gap-0">
        <TopMenu label={<AppleMenuIcon />} bold>
          <MenuItem onSelect={() => onOpenApp('about')}>
            About This Mac
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => onOpenApp('finder')}>Finder</MenuItem>
          <MenuItem onSelect={() => onOpenApp('safari')}>Safari</MenuItem>
          <MenuItem onSelect={() => onOpenApp('stickies')}>Stickies</MenuItem>
          <MenuItem onSelect={() => onOpenApp('photos')}>iPhoto</MenuItem>
          <MenuItem onSelect={() => onOpenApp('terminal')}>Terminal</MenuItem>
          <MenuItem onSelect={() => onOpenApp('photobooth')}>
            Photo Booth
          </MenuItem>
          <MenuItem onSelect={() => onOpenApp('ichat')}>iChat</MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => onOpenApp('mail')}>Contact</MenuItem>
        </TopMenu>

        {isStickiesActive ? (
          <>
            <TopMenu label="Stickies" bold>
              <MenuItem onSelect={stickiesMenu.onAbout}>
                About Stickies
              </MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={stickiesMenu.onNewNote} shortcut="⌘N">
                New Note
              </MenuItem>
              <MenuItem onSelect={stickiesMenu.onOpenHelp}>
                Open Help Note
              </MenuItem>
            </TopMenu>

            <TopMenu label="File">
              <MenuItem onSelect={stickiesMenu.onNewNote} shortcut="⌘N">
                New Note
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onDuplicateNote}
                shortcut="⇧⌘N"
              >
                Duplicate Note
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onDeleteNote}
                shortcut="⌘W"
              >
                Delete Note
              </MenuItem>
            </TopMenu>

            <TopMenu label="Edit">
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onUndo}
                shortcut="⌘Z"
              >
                Undo
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onRedo}
                shortcut="⇧⌘Z"
              >
                Redo
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onCut}
                shortcut="⌘X"
              >
                Cut
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onCopy}
                shortcut="⌘C"
              >
                Copy
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onPaste}
                shortcut="⌘V"
              >
                Paste
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onSelectAll}
                shortcut="⌘A"
              >
                Select All
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onFind}
                shortcut="⌘F"
              >
                Find…
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onFindNext}
                shortcut="⌘G"
              >
                Find Next
              </MenuItem>
            </TopMenu>

            <TopMenu label="Note">
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onToggleBold}
                shortcut="⌘B"
              >
                Bold
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onToggleItalic}
                shortcut="⌘I"
              >
                Italic
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onToggleUnderline}
                shortcut="⌘U"
              >
                Underline
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onToggleStrikeThrough}
              >
                Strikethrough
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onAlignLeft}
              >
                Align Left
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onAlignCenter}
              >
                Align Center
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onAlignRight}
              >
                Align Right
              </MenuItem>
              <MenuSeparator />
              <FontSubmenu onSetFont={stickiesMenu.onSetFont} />
              <FontSizeSubmenu onSetFontSize={stickiesMenu.onSetFontSize} />
              <TextColorSubmenu onSetTextColor={stickiesMenu.onSetTextColor} />
              <MenuSeparator />
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onToggleTranslucent}
              >
                {stickiesMenu.isTranslucent
                  ? 'Opaque Note'
                  : 'Translucent Note'}
              </MenuItem>
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onToggleCollapse}
              >
                {stickiesMenu.isCollapsed ? 'Expand Note' : 'Collapse Note'}
              </MenuItem>
            </TopMenu>

            <TopMenu label="Color">
              <NoteColorSubmenu
                activeColor={stickiesMenu.activeColor}
                onSetNoteColor={stickiesMenu.onSetNoteColor}
              />
            </TopMenu>

            <TopMenu label="Window">
              <MenuItem
                disabled={!stickiesMenu.hasFocusedNote}
                onSelect={stickiesMenu.onToggleZoom}
              >
                {stickiesMenu.isZoomed ? 'Actual Size' : 'Zoom'}
              </MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={stickiesMenu.onBringAllToFront}>
                Bring All to Front
              </MenuItem>
              <MenuItem onSelect={stickiesMenu.onCascade}>
                Cascade Notes
              </MenuItem>
              <MenuItem onSelect={stickiesMenu.onTile}>Tile Notes</MenuItem>
            </TopMenu>

            <TopMenu label="Help">
              <MenuItem onSelect={stickiesMenu.onOpenHelp}>
                Stickies Help
              </MenuItem>
            </TopMenu>
          </>
        ) : (
          <>
            <span className="cursor-default rounded px-[10px] py-0 text-[13px] font-bold hover:bg-[#3872c0] hover:text-white">
              {focusedWindowTitle ?? 'Finder'}
            </span>
            {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((item) => (
              <span
                key={item}
                className="cursor-default rounded px-[10px] py-0 text-[13px] hover:bg-[#3872c0] hover:text-white"
              >
                {item}
              </span>
            ))}
          </>
        )}
      </div>

      <div className="flex items-center gap-3 text-[13px]">
        <span>{dateStr}</span>
        <span className="font-medium">{time}</span>
      </div>
    </div>
  );
}
