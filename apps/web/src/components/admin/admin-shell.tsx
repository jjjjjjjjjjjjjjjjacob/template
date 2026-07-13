import * as React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { OrganizationSwitcher, useUser } from '@clerk/tanstack-react-start';
import {
  ArrowUpRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  PanelLeft,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteThemeToggle } from '@/components/site/theme-toggle';
import { cn } from '@/utils/tailwind-utils';
import './admin.css';

type AdminNavItem = {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const NAVIGATION_GROUPS: AdminNavGroup[] = [
  {
    label: 'overview',
    items: [{ title: 'dashboard', path: '/admin', icon: Home }],
  },
  {
    label: 'content',
    items: [
      { title: 'blog posts', path: '/admin/blog', icon: FileText },
      { title: 'projects', path: '/admin/projects', icon: FolderKanban },
      { title: 'resume profiles', path: '/admin/resume', icon: User },
    ],
  },
  {
    label: 'operations',
    items: [
      {
        title: 'scheduling',
        path: '/admin/scheduling',
        icon: CalendarClock,
      },
    ],
  },
];

const LIVE_LINKS = [
  { label: 'site', href: '/' },
  { label: 'blog', href: '/blog' },
  { label: 'projects', href: '/projects' },
];

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'admin',
  blog: 'blog posts',
  projects: 'projects',
  resume: 'resume profiles',
  scheduling: 'scheduling',
  new: 'new',
};

function isNavItemActive(path: string, currentPath: string) {
  if (path === '/admin') {
    return currentPath === '/admin' || currentPath === '/admin/';
  }

  return currentPath === path || currentPath.startsWith(`${path}/`);
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return ['admin'];

  return segments.map((segment, index) => {
    if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
    const previous = segments[index - 1];
    if (previous === 'blog') return 'post editor';
    if (previous === 'projects') return 'project editor';
    if (previous === 'resume') return 'profile editor';
    return segment;
  });
}

function AdminSidebar({
  currentPath,
  onSignOut,
  isCollapsed,
  onToggleSidebar,
}: {
  currentPath: string;
  onSignOut: () => void;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { user } = useUser();
  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    'admin';

  return (
    <aside className="admin-sidebar hidden lg:flex">
      <div className="admin-sidebar-header">
        <Link to="/admin" className="admin-sidebar-brand" title="admin">
          <span className="admin-brand-mark">
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="admin-brand-copy">
            <span className="admin-brand-title">admin</span>
            <span className="admin-brand-subtitle">jacob stein</span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="admin-icon-button admin-sidebar-toggle"
          aria-label={isCollapsed ? 'expand sidebar' : 'collapse sidebar'}
          aria-pressed={isCollapsed}
          title={isCollapsed ? 'expand sidebar' : 'collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <nav className="admin-sidebar-nav" aria-label="admin navigation">
        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.label} className="admin-nav-group">
            <p className="admin-nav-label">{group.label}</p>
            <div className="admin-nav-items">
              {group.items.map((item) => {
                const active = isNavItemActive(item.path, currentPath);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn('admin-nav-link', active && 'is-active')}
                    aria-current={active ? 'page' : undefined}
                    title={isCollapsed ? item.title : undefined}
                    aria-label={item.title}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-live-links" aria-label="public links">
          {LIVE_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="admin-live-link"
              title={item.label}
            >
              {item.label}
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          ))}
        </div>
        <div className="admin-account-card">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-[var(--admin-faint)]">
              {user?.primaryEmailAddress?.emailAddress ?? 'signed in'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="admin-icon-button"
            aria-label="sign out"
            title="sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function AdminMobileHeader({
  currentPath,
  onSignOut,
}: {
  currentPath: string;
  onSignOut: () => void;
}) {
  return (
    <header className="admin-mobile-header lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link to="/admin" className="admin-sidebar-brand min-w-0">
          <span className="admin-brand-mark">
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="admin-brand-title">admin</span>
            <span className="admin-brand-subtitle">jacob stein</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <SiteThemeToggle className="admin-theme-toggle" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="admin-icon-button"
            aria-label="sign out"
            title="sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <nav
        className="admin-mobile-nav"
        aria-label="admin navigation"
        tabIndex={-1}
      >
        {NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => {
          const active = isNavItemActive(item.path, currentPath);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('admin-mobile-link', active && 'is-active')}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function AdminTopBar({ currentPath }: { currentPath: string }) {
  const breadcrumbs = buildBreadcrumbs(currentPath);

  return (
    <header className="admin-topbar hidden lg:flex">
      <nav className="admin-breadcrumbs" aria-label="breadcrumb">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={`${crumb}-${index}`}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === 0 && !isLast ? (
                <Link to="/admin" className="admin-breadcrumb-link">
                  {crumb}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{crumb}</span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <SiteThemeToggle className="admin-theme-toggle" />
        <OrganizationSwitcher
          afterSelectOrganizationUrl="/admin"
          appearance={{
            elements: {
              rootBox: 'admin-org-switcher',
              organizationSwitcherTrigger: 'admin-org-trigger',
            },
          }}
        />
      </div>
    </header>
  );
}

export function AdminShell({
  children,
  onSignOut,
}: {
  children: React.ReactNode;
  onSignOut: () => void;
}) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('admin-sidebar-collapsed') === 'true';
  });

  React.useEffect(() => {
    window.localStorage.setItem(
      'admin-sidebar-collapsed',
      String(isSidebarCollapsed)
    );
  }, [isSidebarCollapsed]);

  return (
    <div
      className={cn(
        'admin-shell',
        isSidebarCollapsed && 'is-sidebar-collapsed'
      )}
    >
      <AdminSidebar
        currentPath={currentPath}
        onSignOut={onSignOut}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
      />
      <div className="admin-main-region">
        <AdminMobileHeader currentPath={currentPath} onSignOut={onSignOut} />
        <AdminTopBar currentPath={currentPath} />
        <main className="admin-main-scroll">{children}</main>
      </div>
    </div>
  );
}
