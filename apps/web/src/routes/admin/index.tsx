import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useClerk,
  OrganizationSwitcher,
} from '@clerk/tanstack-react-start';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LogOut,
  FileText,
  FolderKanban,
  User,
  TrendingUp,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  BarChart3,
  PieChart,
  Plus,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';
import { cn } from '@/utils/tailwind-utils';

declare global {
  interface Window {
    Clerk?: { user?: unknown };
  }
}

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    if (typeof document !== 'undefined') {
      const isSignedIn = !!window.Clerk?.user;
      if (!isSignedIn) throw redirect({ to: '/sign-in' });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const clerk = useClerk();
  const { isAdmin, isLoading, needsOrgContext, error } = useAdminAuth();
  const stats = useQuery(api.admin.getStats);

  const handleSignOut = () => {
    clerk.signOut();
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin" />
      </SignedOut>
      <SignedIn>
        {isLoading ? (
          <LoadingState />
        ) : needsOrgContext ? (
          <OrgSelectorState />
        ) : !isAdmin ? (
          <AccessDeniedState error={error} onSignOut={handleSignOut} />
        ) : (
          <Dashboard stats={stats} onSignOut={handleSignOut} />
        )}
      </SignedIn>
    </>
  );
}

function LoadingState() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground">loading dashboard...</span>
        </div>
      </div>
    </div>
  );
}

function OrgSelectorState() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <User className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-light">
            select organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            you have admin access. select your organization to continue.
          </p>
          <div className="flex justify-center">
            <OrganizationSwitcher
              afterSelectOrganizationUrl="/admin"
              hidePersonal={true}
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-xs',
                  organizationSwitcherTrigger:
                    'w-full justify-center border rounded-lg px-4 py-3',
                },
              }}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            this will activate your admin privileges
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessDeniedState({
  error,
  onSignOut,
}: {
  error?: string;
  onSignOut: () => void;
}) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Card className="border-destructive/50 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <EyeOff className="text-destructive h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-light">access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            {error || 'you need admin privileges to access this area'}
          </p>
          <Button variant="outline" onClick={onSignOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalContent: number;
  pendingModeration: number;
  blog: {
    total: number;
    published: number;
    drafts: number;
    thisMonth: number;
    recentPosts: Array<{
      id: string;
      title: string;
      slug: string;
      published: boolean;
      createdAt: number;
    }>;
  };
  projects: {
    total: number;
    published: number;
    drafts: number;
    thisMonth: number;
    recentProjects: Array<{
      id: string;
      title: string;
      slug: string;
      published: boolean;
      createdAt: number;
    }>;
  };
  resume: {
    profiles: number;
  };
  charts: {
    postsOverTime: Array<{ month: string; count: number }>;
    contentByType: Array<{ name: string; value: number }>;
  };
};

function Dashboard({
  stats,
  onSignOut,
}: {
  stats: AdminStats | undefined;
  onSignOut: () => void;
}) {
  return (
    <div className="bg-background min-h-screen">
      <div className="from-primary/5 via-background to-background absolute inset-0 bg-gradient-to-br" />

      <div className="relative">
        <header className="border-b backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-2xl font-light tracking-tight">
                admin dashboard
              </h1>
              <p className="text-muted-foreground text-sm">
                manage your content and portfolio
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrganizationSwitcher
                afterSelectOrganizationUrl="/admin"
                appearance={{
                  elements: {
                    rootBox: 'w-auto',
                    organizationSwitcherTrigger:
                      'border rounded-lg px-3 py-2 text-sm',
                  },
                }}
              />
              <Button variant="outline" size="sm" onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
          <QuickStats stats={stats} />

          <div className="grid gap-6 xl:grid-cols-4">
            <div className="space-y-6 xl:col-span-3">
              <NavigationCards />
              <ChartsSection stats={stats} />
            </div>
            <div className="space-y-6 xl:col-span-1">
              <RecentActivity stats={stats} />
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function QuickStats({ stats }: { stats: AdminStats | undefined }) {
  const statCards = [
    {
      label: 'total content',
      value: stats?.totalContent ?? 0,
      icon: Layers,
      trend: stats?.blog.thisMonth
        ? `+${stats.blog.thisMonth + (stats.projects?.thisMonth ?? 0)} this month`
        : undefined,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'blog posts',
      value: stats?.blog.total ?? 0,
      icon: FileText,
      subValue: stats?.blog.published
        ? `${stats.blog.published} published`
        : undefined,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'projects',
      value: stats?.projects?.total ?? 0,
      icon: FolderKanban,
      subValue: stats?.projects?.published
        ? `${stats.projects.published} published`
        : undefined,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'resume profiles',
      value: stats?.resume?.profiles ?? 0,
      icon: User,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className="hover:shadow-primary/5 group min-w-0 overflow-hidden transition-shadow hover:shadow-lg"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1 sm:space-y-2">
                <p className="text-muted-foreground truncate text-xs sm:text-sm">{stat.label}</p>
                {stats === undefined ? (
                  <Skeleton className="h-7 w-12 sm:h-8 sm:w-16" />
                ) : (
                  <p className="text-2xl font-light tabular-nums sm:text-3xl">
                    {stat.value}
                  </p>
                )}
                {stat.subValue && (
                  <p className="text-muted-foreground truncate text-[10px] sm:text-xs">{stat.subValue}</p>
                )}
                {stat.trend && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="truncate text-[10px] text-emerald-500 sm:text-xs">{stat.trend}</span>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  'shrink-0 rounded-lg p-2 transition-transform group-hover:scale-110 sm:rounded-xl sm:p-3',
                  stat.bg
                )}
              >
                <stat.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NavigationCards() {
  const navItems = [
    {
      title: 'blog posts',
      description: 'create, edit, and publish blog content',
      href: '/admin/blog',
      icon: FileText,
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'projects',
      description: 'manage your portfolio projects and media',
      href: '/admin/projects',
      icon: FolderKanban,
      color: 'from-violet-500/20 to-violet-600/5',
      iconColor: 'text-violet-500',
    },
    {
      title: 'resume profiles',
      description: 'configure resume content and settings',
      href: '/admin/resume',
      icon: User,
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {navItems.map((item) => (
        <Link key={item.href} to={item.href}>
          <Card
            className={cn(
              'group relative h-full cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg',
              'border-transparent hover:border-primary/20'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100',
                item.color
              )}
            />
            <CardContent className="relative flex h-full flex-col p-5">
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted transition-transform group-hover:scale-110'
                )}
              >
                <item.icon className={cn('h-6 w-6', item.iconColor)} />
              </div>
              <h3 className="mb-1 font-medium">{item.title}</h3>
              <p className="text-muted-foreground flex-1 text-sm">
                {item.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium">
                <span>manage</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ChartsSection({ stats }: { stats: AdminStats | undefined }) {
  const postsData = stats?.charts?.postsOverTime ?? [];
  const maxCount = Math.max(...postsData.map((d) => d.count), 1);

  const contentData = stats?.charts?.contentByType ?? [];
  const totalContent = contentData.reduce((sum, d) => sum + d.value, 0) || 1;

  const colors = [
    'bg-emerald-500',
    'bg-violet-500',
    'bg-blue-500',
    'bg-amber-500',
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-muted-foreground h-4 w-4 shrink-0" />
            <CardTitle className="truncate text-sm font-medium">
              posts over time
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {stats === undefined ? (
            <div className="flex h-40 items-end gap-1">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="min-w-0 flex-1"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {postsData.map((data, i) => (
                <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="bg-primary/80 hover:bg-primary w-full min-w-1 rounded-t transition-all"
                    style={{
                      height: `${Math.max((data.count / maxCount) * 100, 4)}%`,
                    }}
                  />
                  <span className="text-muted-foreground truncate text-[10px] sm:text-xs">
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PieChart className="text-muted-foreground h-4 w-4 shrink-0" />
            <CardTitle className="truncate text-sm font-medium">
              content breakdown
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {stats === undefined ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {contentData.map((item, i) => (
                <div key={item.name} className="min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{item.name}</span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {item.value}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        colors[i % colors.length]
                      )}
                      style={{
                        width: `${(item.value / totalContent) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivity({ stats }: { stats: AdminStats | undefined }) {
  const recentPosts = stats?.blog?.recentPosts ?? [];
  const recentProjects = stats?.projects?.recentProjects ?? [];

  const allRecent = [
    ...recentPosts.map((p) => ({ ...p, type: 'post' as const })),
    ...recentProjects.map((p) => ({ ...p, type: 'project' as const })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
          <CardTitle className="truncate text-sm font-medium">recent activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {stats === undefined ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allRecent.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            no recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {allRecent.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    item.type === 'post' ? 'bg-emerald-500/10' : 'bg-violet-500/10'
                  )}
                >
                  {item.type === 'post' ? (
                    <FileText className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <FolderKanban className="h-4 w-4 text-violet-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDate(item.createdAt)}
                    </span>
                    <Badge
                      variant={item.published ? 'default' : 'secondary'}
                      className="shrink-0 text-[10px]"
                    >
                      {item.published ? 'published' : 'draft'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const createActions = [
    {
      label: 'new blog post',
      href: '/admin/blog/new',
      icon: FileText,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'new project',
      href: '/admin/projects/new',
      icon: FolderKanban,
      gradient: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
    },
  ];

  const viewActions = [
    {
      label: 'view site',
      href: '/',
      icon: ExternalLink,
    },
    {
      label: 'view blog',
      href: '/blog',
      icon: Eye,
    },
    {
      label: 'view projects',
      href: '/projects',
      icon: FolderKanban,
    },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="truncate text-sm font-medium">quick actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {createActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <div
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-2 rounded-xl p-3 transition-all hover:scale-[1.02] active:scale-[0.98] sm:gap-3 sm:p-4',
                  'bg-gradient-to-br',
                  action.gradient
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110 sm:h-10 sm:w-10',
                    'bg-white/20'
                  )}
                >
                  <action.icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                </div>
                <span className="text-center text-[10px] font-medium text-white sm:text-xs">
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-3 text-[10px] uppercase tracking-wider sm:text-xs">
            view live
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {viewActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-muted hover:text-foreground text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] transition-colors sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                <action.icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
