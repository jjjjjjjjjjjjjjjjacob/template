import { Moon, Sun } from 'lucide-react';
import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { type ThemeRevealOrigin, transitionTheme } from './theme-reveal';
import { type SiteTheme, useSiteVisuals } from './visual-provider';

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function SiteThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useSiteVisuals();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const dark = theme === 'dark';

  const handleToggle = () => {
    const next: SiteTheme = dark ? 'light' : 'dark';
    const rect = toggleRef.current?.getBoundingClientRect();
    const origin: ThemeRevealOrigin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: typeof window === 'undefined' ? 0 : window.innerWidth, y: 0 };

    transitionTheme({
      origin,
      commit: () => flushSync(() => setTheme(next)),
    });
  };

  return (
    <button
      ref={toggleRef}
      type="button"
      className={classes('site-theme-toggle', className)}
      onClick={handleToggle}
      aria-label={`switch to ${dark ? 'light' : 'dark'} mode`}
      title={`switch to ${dark ? 'light' : 'dark'} mode`}
    >
      {dark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
}
