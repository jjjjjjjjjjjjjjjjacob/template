import {
  type ErrorComponentProps,
  Link,
  rootRouteId,
  useLocation,
  useMatch,
  useRouter,
} from '@tanstack/react-router';
import { SiteStatusPage } from '@/components/site/status-page';
import { getRouteExperience } from '@/lib/route-experience';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const location = useLocation();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  // biome-ignore lint/suspicious/noConsole: intentional logging
  console.error(error);

  return (
    <SiteStatusPage
      eyebrow="system / error"
      title="Something went wrong"
      embedded={getRouteExperience(location.pathname) === 'admin'}
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              router.invalidate();
            }}
            className="site-status-action site-status-action-primary"
          >
            try again
          </button>
          {isRoot ? (
            <Link to="/" className="site-status-action">
              return to index
            </Link>
          ) : (
            <Link
              to="/"
              className="site-status-action"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                window.history.back();
              }}
            >
              go back
            </Link>
          )}
        </>
      }
    >
      <p>The page could not load. Try again, or return to the index.</p>
      {import.meta.env.DEV && error instanceof Error && (
        <details className="site-status-details">
          <summary>technical details</summary>
          <code>{error.message}</code>
        </details>
      )}
    </SiteStatusPage>
  );
}
