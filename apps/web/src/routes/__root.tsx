import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useNavigate,
  useLocation,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import * as React from 'react';

// Lazy load devtools only in development
const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : () => null;

const TanStackRouterDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      }))
    )
  : () => null;

import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { DefaultCatchBoundary } from '@/components/default-catch-boundary';
import { NotFound } from '@/components/not-found';
import { Header } from '@/components/header';
import { SiteChrome } from '@/components/site/chrome';
import { SiteVisualProvider } from '@/components/site/visual-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { PostHogProvider } from '@/components/posthog-provider';
import { PostHogPageTracker } from '@/components/posthog-page-tracker';
import appCss from '@/styles/app.css?url';
import siteCss from '@/components/site/site.css?url';
import blogCss from '@/styles/blog.css?url';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start';
import { useSectionStore } from '@/stores/section-store';
import { getRouteExperience } from '@/lib/route-experience';

// Optimized server function with caching and mobile optimizations
const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) {
    return {
      userId: null,
      token: null,
      fromCache: false,
      computeTime: 0,
    };
  }

  // Use optimized auth with caching
  const { getOptimizedAuth } = await import('@/lib/optimized-auth');
  return await getOptimizedAuth(request);
});

// NOTE: confirm these two values for production —
//  - SITE_URL: canonical origin (used for og:url + canonical link)
//  - a 1200x630 share image must exist at apps/web/public/og-image.png
const SITE_URL = 'https://jacobstein.dev';
const SITE_TITLE = 'jacob stein | ui/ux - fullstack - product';
const SITE_DESCRIPTION =
  'the portfolio of jacob stein — ui/ux designer and fullstack developer building real-time, 3d-capable web products.';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  ssrAuth?: { userId: string | null };
  request?: Request;
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'jacob stein' },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:image', content: OG_IMAGE },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: siteCss },
      { rel: 'stylesheet', href: blogCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'canonical', href: SITE_URL },
      // The first-class site font is needed for the initial public paint.
      {
        rel: 'preload',
        href: '/fonts/site/Archivo-Variable.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    try {
      const auth = await fetchClerkAuth();
      const { userId, token } = auth;

      // During SSR, set the Clerk auth token for authenticated Convex requests
      if (token && ctx.context.convexQueryClient.serverHttpClient) {
        // Set auth on the convex client for server-side requests
        ctx.context.convexQueryClient.serverHttpClient.setAuth(token);
      }

      return {
        userId,
        token,
      };
    } catch {
      // Error in beforeLoad
      // Return empty auth state on error
      return {
        userId: null,
        token: null,
      };
    }
  },
  errorComponent: (props) => {
    return (
      <ClerkProviderWrapper>
        <RootDocument forceSiteChrome>
          <DefaultCatchBoundary {...props} />
        </RootDocument>
      </ClerkProviderWrapper>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [clerkError, setClerkError] = React.useState<Error | null>(null);

  // Handle Clerk initialization errors
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes('Clerk') ||
        event.error?.message?.includes('clerk')
      ) {
        setClerkError(event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If Clerk fails to load, show error state but continue rendering
  if (clerkError) {
    // Clerk failed to initialize, continuing without auth
  }

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        elements: {
          card: 'bg-card shadow-lg text-primary',
          buttonPrimary: 'bg-card text-primary hover:bg-card/90',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
      routerPush={(to) => navigate({ to })}
      routerReplace={(to) => navigate({ to, replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
}

function RootComponent() {
  const context = Route.useRouteContext();

  return (
    <ClerkProviderWrapper>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <QueryClientProvider client={context.queryClient}>
          <RootDocument>
            <Outlet />
          </RootDocument>
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProviderWrapper>
  );
}

function HeaderWrapper() {
  const location = useLocation();

  if (getRouteExperience(location.pathname) === 'legacy') {
    return <Header />;
  }

  return null;
}

function RoutePresentation({
  children,
  forceSiteChrome = false,
}: {
  children: React.ReactNode;
  forceSiteChrome?: boolean;
}) {
  const location = useLocation();
  const experience = getRouteExperience(location.pathname);

  if (forceSiteChrome || experience === 'public') {
    return (
      <SiteChrome>
        <div key={location.pathname} className="site-route-swap">
          {children}
        </div>
      </SiteChrome>
    );
  }

  if (experience === 'admin' || experience === 'macos') {
    return <>{children}</>;
  }

  return <main className="mt-14">{children}</main>;
}

function RootDocument({
  children,
  forceSiteChrome = false,
}: {
  children: React.ReactNode;
  forceSiteChrome?: boolean;
}) {
  const { initializeObserver, cleanup } = useSectionStore();

  // Initialize section observer once at app mount
  React.useEffect(() => {
    initializeObserver();

    // Cleanup on app unmount
    return () => {
      cleanup();
    };
  }, [initializeObserver, cleanup]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var legacySiteTheme = localStorage.getItem('alt-3b-theme');
                  var theme = localStorage.getItem('theme');
                  var resolvedTheme = 'light';

                  if (legacySiteTheme === 'light' || legacySiteTheme === 'dark') {
                    theme = legacySiteTheme;
                    localStorage.setItem('theme', legacySiteTheme);
                    localStorage.removeItem('alt-3b-theme');
                  } else if (legacySiteTheme !== null) {
                    localStorage.removeItem('alt-3b-theme');
                  }
                  
                  if (theme === 'dark') {
                    resolvedTheme = 'dark';
                  } else if (theme === 'system' || !theme) {
                    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.add(resolvedTheme);
                  document.documentElement.dataset.siteTheme = resolvedTheme;
                  
                  var colorTheme = localStorage.getItem('colorTheme');
                  if (colorTheme) {
                    document.documentElement.classList.add(colorTheme);
                  }
                  
                  var secondaryColorTheme = localStorage.getItem('secondaryColorTheme');
                  if (secondaryColorTheme) {
                    document.documentElement.classList.add(secondaryColorTheme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-screen transition-colors duration-300">
        <PostHogProvider>
          <ThemeProvider>
            <SiteVisualProvider>
              <PostHogPageTracker />
              <HeaderWrapper />

              <RoutePresentation forceSiteChrome={forceSiteChrome}>
                {children}
              </RoutePresentation>

              {/* Development Tools */}
              {import.meta.env.DEV && (
                <React.Suspense fallback={null}>
                  <ReactQueryDevtools />
                  <TanStackRouterDevtools position="bottom-left" />
                </React.Suspense>
              )}
            </SiteVisualProvider>
          </ThemeProvider>
        </PostHogProvider>

        <Scripts />
      </body>
    </html>
  );
}
