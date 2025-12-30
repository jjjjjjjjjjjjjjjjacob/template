import { Sun, Moon, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useTheme } from './theme-provider';
import { Link, useLocation } from '@tanstack/react-router';
import { useAdminAuth } from '@/features/admin/hooks/use-admin';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';

export function BlogHeader() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { isAdmin } = useAdminAuth();
  const location = useLocation();

  // Check if we're on a blog post page
  const blogPostMatch = location.pathname.match(/^\/blog\/(.+)$/);
  const slug = blogPostMatch ? blogPostMatch[1] : null;

  // Get the post data if we're on a blog post page
  const post = useQuery(api.blog.getBySlug, slug ? { slug } : 'skip');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const toTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(toTheme);
  };

  return (
    <header className="border-border/20 bg-background fixed top-0 right-0 left-0 z-50 border-b">
      <div className="mx-auto flex h-14 max-w-[680px] items-center px-4">
        <nav className="flex flex-1 items-center gap-6">
          <Link
            to="/"
            className="text-foreground text-lg font-light tracking-wide transition-colors hover:opacity-80"
          >
            jacob stein
          </Link>

          {/* Show breadcrumb only when on a blog post page */}
          {post && (
            <div className="flex items-center gap-2">
              <Link
                to="/blog"
                className="text-foreground text-sm font-light transition-colors hover:opacity-80"
              >
                blog
              </Link>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground max-w-[200px] truncate text-sm font-light">
                {post.title}
              </span>
            </div>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors hover:font-light"
            >
              jacob stein
            </Link>
          )}
        </nav>

        <button
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
          aria-label="Toggle theme"
        >
          {mounted ? (
            resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <Sun className="h-4 w-4 opacity-0" />
          )}
        </button>
      </div>
    </header>
  );
}
