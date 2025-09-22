import { Sun, Moon, Github } from 'lucide-react';
import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { useTheme } from './theme-provider';
import { useSectionTracking } from '@/hooks/use-section-tracking';
import { trackEvents } from '@/lib/track-events';
import { Link } from '@tanstack/react-router';
import { useAdminAuth } from '@/features/admin/hooks/use-admin';

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
  const { isAdmin } = useAdminAuth();
  const hasPublishedPosts = useQuery(api.blog.hasPublishedPosts);

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
    const fromTheme = resolvedTheme || 'light';
    const toTheme = fromTheme === 'dark' ? 'light' : 'dark';

    // Track theme toggle interaction
    trackEvents.themeToggleClicked(fromTheme, toTheme, 'header');

    setTheme(toTheme);
  };

  const handleNavClick = (section: 'home' | 'projects' | 'resume') => {
    // Track navigation clicks
    trackEvents.navLinkClicked(
      section,
      activeSection || 'unknown',
      section,
      window.scrollY
    );
    scrollToSection(section);
  };

  const handleSocialClick = (platform: 'github' | 'twitter', url: string) => {
    // Track social media clicks
    trackEvents.socialLinkClicked(platform, 'header', url);
  };

  return (
    <header
      data-fading={isFading}
      className="border-border bg-background/50 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md transition-opacity duration-1000 data-[fading=true]:opacity-0"
      style={style}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          onClick={() => handleNavClick('home')}
          className={`text-xl font-[200] tracking-wider transition-colors ${
            activeSection === 'home'
              ? 'text-foreground'
              : 'text-foreground/80 hover:text-foreground'
          }`}
        >
          jacob stein
        </button>

        <nav className="flex items-center gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/jjjjjjjjjjjjjjjjacob"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground p-2 transition-colors"
              aria-label="GitHub"
              onClick={() =>
                handleSocialClick(
                  'github',
                  'https://github.com/jjjjjjjjjjjjjjjjacob'
                )
              }
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://x.com/jaequbh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground p-2 transition-colors"
              aria-label="X (Twitter)"
              onClick={() =>
                handleSocialClick('twitter', 'https://x.com/jaequbh')
              }
            >
              <XIcon className="h-4 w-4" />
            </a>
          </div>

          <button
            onClick={() => handleNavClick('projects')}
            className={`text-sm tracking-wider transition-colors ${
              activeSection === 'projects'
                ? 'text-foreground font-[200]'
                : 'text-muted-foreground hover:text-foreground font-[200]'
            }`}
          >
            projects
          </button>
          <button
            onClick={() => handleNavClick('resume')}
            className={`text-sm tracking-wider transition-colors ${
              activeSection === 'resume'
                ? 'text-foreground font-[200]'
                : 'text-muted-foreground hover:text-foreground font-[200]'
            }`}
          >
            resume
          </button>
          {hasPublishedPosts && (
            <Link
              to="/blog"
              className="text-muted-foreground hover:text-foreground text-sm font-[200] tracking-wider transition-colors"
            >
              blog
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="text-muted-foreground hover:text-foreground text-sm font-[200] tracking-wide transition-colors hover:font-light"
            >
              admin
            </Link>
          )}

          <button
            onClick={toggleTheme}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg p-2 transition-colors"
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
