import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production';
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import * as React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { DefaultCatchBoundary } from '@/components/default-catch-boundary';
import { NotFound } from '@/components/not-found';
import { Header } from '@/components/header';
import { PerformanceDashboard } from '@/components/performance-dashboard';
import {
  FontPreloader,
  CriticalFontPreloads,
  FontLoadingStatus,
} from '@/components/font-preloader';
import { SearchProvider } from '@/features/search';
import { ThemeProvider } from '@/components/theme-provider';
import appCss from '@/styles/app.css?url';
import fontsCss from '@/styles/fonts.css?url';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { performanceMonitor } from '@/lib/performance-monitor';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'jacob stein | ui/ux - fullstack - product',
        content:
          'A portfolio website for Jacob Stein, a UI/UX designer and fullstack developer',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: fontsCss },
      { rel: 'icon', href: '/favicon.ico' },
      // Critical font preloads
      {
        rel: 'preload',
        href: '/fonts/optimized/GeistSans-Variable.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/fonts/optimized/noto-color-emoji-core.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  const { convexClient } = Route.useRouteContext();

  return (
    <ConvexProvider client={convexClient}>
      <ThemeProvider>
        <FontPreloader
          enableProgressiveLoading={true}
          enablePerformanceMonitoring={true}
        >
          <SearchProvider>
            <RootDocument>
              <Outlet />
            </RootDocument>
          </SearchProvider>
        </FontPreloader>
      </ThemeProvider>
    </ConvexProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  // Initialize performance monitoring
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize performance monitor with custom budgets if needed
      performanceMonitor.init();

      // Track navigation timing after component mounts
      setTimeout(() => {
        performanceMonitor.trackNavigationTiming();
        performanceMonitor.trackResourceTiming();
      }, 1000);
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-loading min-h-screen bg-background text-foreground transition-colors duration-300">
        <CriticalFontPreloads />
        <Header />
        <main className="mt-16 select-none">{children}</main>
        <ReactQueryDevtools />
        <TanStackRouterDevtools position="bottom-right" />
        <PerformanceDashboard />
        <FontLoadingStatus />
        <Scripts />
      </body>
    </html>
  );
}
