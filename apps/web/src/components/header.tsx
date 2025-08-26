import { Sun, Moon } from 'lucide-react';
import * as React from 'react';
import { useTheme } from './theme-provider';
import { useSectionTracking } from '@/hooks/use-section-tracking';

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const { activeSection, scrollToSection } = useSectionTracking();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-border bg-background/50 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md">
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
