import { Link } from '@tanstack/react-router';
import React from 'react';
import { SiteStatusPage } from '@/components/site/status-page';

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <SiteStatusPage
      eyebrow="system / 404"
      title="Page not found"
      animate
      actions={
        <>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="site-status-action"
          >
            go back
          </button>
          <Link
            to="/"
            className="site-status-action site-status-action-primary"
          >
            return to index
          </Link>
        </>
      }
    >
      {children || <p>The page you are looking for does not exist.</p>}
    </SiteStatusPage>
  );
}
