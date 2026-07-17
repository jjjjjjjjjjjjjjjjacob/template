import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from '@template/backend';
import { useQuery } from 'convex/react';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  Layers,
  PieChart,
  TrendingUp,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/tailwind-utils';

export const Route = createFileRoute('/admin/')({
  component: AdminPage,
});

function AdminPage() {
  const stats = useQuery(api.admin.getStats, {});

  return <Dashboard stats={stats} />;
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

function Dashboard({ stats }: { stats: AdminStats | undefined }) {
  return (
    <div className="admin-page admin-page-wide space-y-6">
      <header className="admin-page-header">
        <div>
          <p className="admin-page-kicker">control room</p>
          <h1 className="admin-page-title">admin dashboard</h1>
          <p className="admin-page-description">
            manage the writing, project archive, resume profiles, and booking
            system from one place.
          </p>
        </div>
        <div className="hidden rounded-lg border px-4 py-3 text-right md:block">
          <p className="text-sm text-[var(--admin-faint)]">content total</p>
          {stats === undefined ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="text-3xl font-semibold tabular-nums">
              {stats.totalContent}
            </p>
          )}
        </div>
      </header>

      <QuickStats stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <NavigationCards />
          <ChartsSection stats={stats} />
        </div>
        <div className="space-y-6">
          <RecentActivity stats={stats} />
          <QuickActions />
        </div>
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
        <Card key={stat.label} className="admin-card group min-w-0">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1 sm:space-y-2">
                <p className="truncate text-sm text-[var(--admin-faint)]">
                  {stat.label}
                </p>
                {stats === undefined ? (
                  <Skeleton className="h-7 w-12 sm:h-8 sm:w-16" />
                ) : (
                  <p className="text-3xl font-semibold tabular-nums">
                    {stat.value}
                  </p>
                )}
                {stat.subValue && (
                  <p className="truncate text-xs text-[var(--admin-faint)]">
                    {stat.subValue}
                  </p>
                )}
                {stat.trend && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="truncate text-xs text-emerald-500">
                      {stat.trend}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  'shrink-0 rounded-lg p-3 transition-transform group-hover:scale-[1.04]',
                  stat.bg
                )}
              >
                <stat.icon
                  className={cn('h-4 w-4 sm:h-5 sm:w-5', stat.color)}
                />
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
      iconColor: 'text-emerald-500',
    },
    {
      title: 'projects',
      description: 'manage your portfolio projects and media',
      href: '/admin/projects',
      icon: FolderKanban,
      iconColor: 'text-violet-500',
    },
    {
      title: 'resume profiles',
      description: 'configure resume content and settings',
      href: '/admin/resume',
      icon: User,
      iconColor: 'text-amber-500',
    },
    {
      title: 'scheduling',
      description: 'manage booking links and google calendar connection',
      href: '/admin/scheduling',
      icon: CalendarClock,
      iconColor: 'text-cyan-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {navItems.map((item) => (
        <Link key={item.href} to={item.href}>
          <Card
            className={cn(
              'admin-card group relative h-full cursor-pointer overflow-hidden'
            )}
          >
            <CardContent className="relative flex h-full min-h-40 flex-col p-5">
              <div
                className={cn(
                  'bg-muted mb-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-[1.04]'
                )}
              >
                <item.icon className={cn('h-5 w-5', item.iconColor)} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
              <p className="flex-1 text-sm leading-6 text-[var(--admin-soft)]">
                {item.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium">
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
      <Card className="admin-card min-w-0">
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
            <div className="flex h-44 items-end gap-1">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="min-w-0 flex-1"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-44 items-end gap-1">
              {postsData.map((data, i) => (
                <div
                  key={i}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full min-w-1 rounded-t bg-[var(--admin-accent)] transition-[height,opacity] hover:opacity-80"
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

      <Card className="admin-card min-w-0">
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
                        'h-full rounded-full transition-[width] duration-300 ease-out',
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
    <Card className="admin-card min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
          <CardTitle className="truncate text-sm font-medium">
            recent activity
          </CardTitle>
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
                    item.type === 'post'
                      ? 'bg-emerald-500/10'
                      : 'bg-violet-500/10'
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
      tone: 'post',
    },
    {
      label: 'new project',
      href: '/admin/projects/new',
      icon: FolderKanban,
      tone: 'project',
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
    <Card className="admin-card min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="truncate text-sm font-medium">
          quick actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {createActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <div className="admin-action-tile" data-tone={action.tone}>
                <div className="admin-action-icon">
                  <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-3 font-mono text-xs">
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
