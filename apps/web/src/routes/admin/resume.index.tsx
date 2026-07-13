import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/convex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  User,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';

export const Route = createFileRoute('/admin/resume/')({
  component: ResumeIndexPage,
});

function ResumeIndexPage() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const profiles = useQuery(api.resume.listProfiles);
  const deleteProfileMutation = useMutation(api.resume.deleteProfile);

  const isLoading = authLoading || profiles === undefined;

  const handleDeleteProfile = async (slug: string, name: string) => {
    if (
      !confirm(
        `are you sure you want to delete "${name}"? this will also delete all associated projects and skills.`
      )
    ) {
      return;
    }

    try {
      await deleteProfileMutation({ slug });
      toast.success('profile deleted');
    } catch {
      toast.error('failed to delete profile');
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="flex items-center justify-center py-12">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
          <span className="ml-2">loading...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Card className="admin-card border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              you do not have permission to access this area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-page-kicker">resume</p>
          <h1 className="admin-page-title">resume profiles</h1>
          <p className="admin-page-description">
            manage your resume configurations
          </p>
        </div>
        <Link to="/admin/resume/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            new profile
          </Button>
        </Link>
      </div>

      {!profiles || profiles.length === 0 ? (
        <Card className="admin-card">
          <CardContent className="py-12 text-center">
            <User className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-light">no profiles yet</h3>
            <p className="text-muted-foreground mb-4">
              create your first resume profile to get started
            </p>
            <Link to="/admin/resume/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                create profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card
              key={profile.slug}
              className="admin-card group relative flex min-h-64 flex-col overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg leading-tight font-medium">
                        {profile.name}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm leading-snug">
                        {profile.title}
                      </p>
                    </div>
                  </div>
                  <GripVertical className="text-muted-foreground h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{profile.slug}</Badge>
                  <Badge variant="secondary">order: {profile.order}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/resume?profile=${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    view resume
                  </a>
                </div>

                <div className="mt-auto flex gap-2 pt-2">
                  <Link
                    to="/admin/resume/$profileSlug"
                    params={{ profileSlug: profile.slug }}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                    aria-label={`delete ${profile.name}`}
                    onClick={() =>
                      handleDeleteProfile(profile.slug, profile.name)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
