interface DesktopIconDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DesktopProps {
  icons: DesktopIconDef[];
  onOpenApp: (appType: string) => void;
  wallpaperUrl?: string | null;
}

export function Desktop({ icons, onOpenApp, wallpaperUrl }: DesktopProps) {
  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundImage: `url(${wallpaperUrl ?? '/os-x/background.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute top-8 right-4 grid grid-cols-1 gap-0 p-2"
        style={{ fontFamily: "'Lucida Grande', sans-serif" }}
      >
        {icons.map((icon) => (
          <button
            key={icon.id}
            className="group flex flex-col items-center gap-[2px] rounded p-2 transition-colors hover:bg-white/15 active:bg-white/25"
            onDoubleClick={() => onOpenApp(icon.id)}
            onClick={() => onOpenApp(icon.id)}
          >
            <span
              className="flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}
            >
              {icon.icon}
            </span>
            <span
              className="max-w-[84px] truncate text-[11px] text-white"
              style={{
                textShadow:
                  '0 1px 3px rgba(0,0,0,0.9), 0 0px 6px rgba(0,0,0,0.5)',
              }}
            >
              {icon.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
