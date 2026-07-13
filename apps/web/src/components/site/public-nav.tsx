import { Link } from '@tanstack/react-router';
import { api } from '@template/backend';
import { useQuery } from 'convex/react';
import type { ReactNode } from 'react';
import { SiteThemeToggle } from './theme-toggle';

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function useHasPublishedBlogPosts() {
  return useQuery(api.blog.hasPublishedPosts) === true;
}

export function SitePublicNav({
  resumeAction,
  className = 'site-public-nav',
  linksClassName = 'site-public-nav-links',
  nameClassName,
  themeToggleClassName = 'site-public-theme-toggle',
}: {
  resumeAction: ReactNode;
  className?: string;
  linksClassName?: string;
  nameClassName?: string;
  themeToggleClassName?: string;
}) {
  const hasPublishedPosts = useHasPublishedBlogPosts();

  return (
    <div className={className}>
      <Link to="/" className={classes('site-link', nameClassName)}>
        Jacob Stein
      </Link>
      <nav aria-label="public pages" className={linksClassName}>
        <Link to="/projects" className="site-link">
          projects
        </Link>
        {hasPublishedPosts && (
          <Link to="/blog" className="site-link">
            blog
          </Link>
        )}
        <Link to="/book" className="site-link">
          book
        </Link>
        {resumeAction}
        <SiteThemeToggle className={themeToggleClassName} />
      </nav>
    </div>
  );
}
