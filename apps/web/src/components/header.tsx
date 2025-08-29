import { Sun, Moon, Github } from 'lucide-react';
import * as React from 'react';
import { useTheme } from './theme-provider';
import { useSectionTracking } from '@/hooks/use-section-tracking';

// Custom X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function Header({ style }: { style?: React.CSSProperties } = {}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isFading, setIsFading] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setIsFading(false);
    }, 4000);
    return () => clearTimeout(timeout);
  }, []);
  const { activeSection, scrollToSection } = useSectionTracking();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      data-fading={isFading}
      className="border-border bg-background/50 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md transition-opacity duration-1000 data-[fading=true]:opacity-0"
      style={style}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          onClick={() => scrollToSection('home')}
          className={`text-xl font-medium transition-colors ${
            activeSection === 'home'
              ? 'text-foreground'
              : 'text-foreground/80 hover:text-foreground'
          }`}
        >
          jacob stein
        </button>

        <nav className="flex items-center gap-6">
          {/* Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/jjjjjjjjjjjjjjjjacob"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground p-2 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://x.com/jaequbh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground p-2 transition-colors"
              aria-label="X (Twitter)"
            >
              <XIcon className="h-4 w-4" />
            </a>
          </div>

          <button
            onClick={() => scrollToSection('projects')}
            className={`text-sm transition-colors ${
              activeSection === 'projects'
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:font-medium'
            }`}
          >
            projects
          </button>
          <button
            onClick={() => scrollToSection('resume')}
            className={`text-sm transition-colors ${
              activeSection === 'resume'
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:font-medium'
            }`}
          >
            resume
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className={`text-sm transition-colors ${
              activeSection === 'contact'
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:font-medium'
            }`}
          >
            contact
          </button>

          <button
            onClick={toggleTheme}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground ml-2 rounded-lg p-2 transition-colors"
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            ) : (
              // Render a placeholder to avoid hydration mismatch
              <Sun className="h-5 w-5 opacity-0" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
