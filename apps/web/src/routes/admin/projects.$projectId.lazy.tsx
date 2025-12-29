import { createLazyFileRoute, useRouter, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/convex';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';
import {
  ProjectMediaManager,
  MediaItem,
} from '@/components/admin/project-media-manager';
import type { Id } from '@template/convex/dataModel';

export const Route = createLazyFileRoute('/admin/projects/$projectId')({
  component: EditProjectPage,
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const updateMutation = useMutation(api.projects.update);
  const removeMutation = useMutation(api.projects.remove);
  const resumeProfiles = useQuery(api.resume.listProfiles);

  const project = useQuery(api.projects.getById, {
    id: projectId as Id<'portfolio_projects'>,
  });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [timeline, setTimeline] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [newResponsibility, setNewResponsibility] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [newTechnology, setNewTechnology] = useState('');
  const [published, setPublished] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number | undefined>();
  const [includeInResume, setIncludeInResume] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setSlug(project.slug);
      setUrl(project.url || '');
      setDescription(project.description);
      setRole(project.role);
      setCompany(project.company || '');
      setTimeline(project.timeline);
      setResponsibilities(project.responsibilities);
      setTechnologies(project.technologies);
      setPublished(project.published);
      setMedia(project.media as MediaItem[]);
      setThumbnailIndex(project.thumbnailIndex);
      setIncludeInResume(project.includeInResume);
      setSelectedProfiles(project.resumeProfileSlugs || []);
      setHasChanges(false);
    }
  }, [project]);

  const markChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities([...responsibilities, newResponsibility.trim()]);
      setNewResponsibility('');
      markChanged();
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
    markChanged();
  };

  const handleAddTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim())) {
      setTechnologies([...technologies, newTechnology.trim()]);
      setNewTechnology('');
      markChanged();
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
    markChanged();
  };

  const handleToggleProfile = (profileSlug: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileSlug)
        ? prev.filter((s) => s !== profileSlug)
        : [...prev, profileSlug]
    );
    markChanged();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('please enter a title');
      return;
    }
    if (!slug.trim()) {
      toast.error('please enter a slug');
      return;
    }
    if (!description.trim()) {
      toast.error('please enter a description');
      return;
    }
    if (!role.trim()) {
      toast.error('please enter a role');
      return;
    }
    if (!timeline.trim()) {
      toast.error('please enter a timeline');
      return;
    }

    setIsSaving(true);

    try {
      await updateMutation({
        id: projectId as Id<'portfolio_projects'>,
        data: {
          slug: slug.trim(),
          title: title.trim(),
          url: url.trim() || undefined,
          description: description.trim(),
          role: role.trim(),
          company: company.trim() || undefined,
          timeline: timeline.trim(),
          responsibilities,
          technologies,
          order: project?.order ?? 0,
          published,
          media,
          thumbnailIndex,
          includeInResume,
          resumeProfileSlugs:
            includeInResume && selectedProfiles.length > 0
              ? selectedProfiles
              : undefined,
        },
      });

      toast.success('project saved');
      setHasChanges(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to save project'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `are you sure you want to delete "${title}"? this cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await removeMutation({ id: projectId as Id<'portfolio_projects'> });
      toast.success('project deleted');
      router.navigate({ to: '/admin/projects' });
    } catch {
      toast.error('failed to delete project');
    }
  };

  const isLoading = authLoading || project === undefined;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
          <span className="ml-2">loading...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              you do not have permission to access this area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">project not found</p>
            <Link to="/admin/projects">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                back to projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-light">edit project</h1>
              {hasChanges && (
                <Badge variant="outline" className="text-orange-500">
                  unsaved
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{project.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'saving...' : 'save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-light">project details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      markChanged();
                    }}
                    placeholder="project title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      markChanged();
                    }}
                    placeholder="project-slug"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="url">project url (optional)</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      markChanged();
                    }}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">company (optional)</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      markChanged();
                    }}
                    placeholder="company name"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">role</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      markChanged();
                    }}
                    placeholder="full-stack developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">timeline</Label>
                  <Input
                    id="timeline"
                    value={timeline}
                    onChange={(e) => {
                      setTimeline(e.target.value);
                      markChanged();
                    }}
                    placeholder="2023 - present"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    markChanged();
                  }}
                  placeholder="describe the project..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-light">responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  placeholder="add a responsibility..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddResponsibility();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleAddResponsibility}
                  disabled={!newResponsibility.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {responsibilities.length > 0 && (
                <ul className="space-y-2">
                  {responsibilities.map((resp, index) => (
                    <li
                      key={index}
                      className="bg-muted flex items-start justify-between gap-2 rounded-lg p-3"
                    >
                      <span className="text-sm">{resp}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveResponsibility(index)}
                        className="h-6 w-6 flex-shrink-0 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-light">technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  placeholder="add a technology..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTechnology();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleAddTechnology}
                  disabled={!newTechnology.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTechnology(tech)}
                    >
                      {tech}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-light">media</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectMediaManager
                projectId={projectId as Id<'portfolio_projects'>}
                media={media}
                thumbnailIndex={thumbnailIndex}
                onMediaChange={(newMedia) => {
                  setMedia(newMedia);
                  markChanged();
                }}
                onThumbnailChange={(index) => {
                  setThumbnailIndex(index);
                  markChanged();
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-light">publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="published">published</Label>
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={(checked) => {
                    setPublished(checked);
                    markChanged();
                  }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {published
                  ? 'this project is visible on the public projects page'
                  : 'this project is hidden from the public'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-light">resume settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeInResume">include in resume</Label>
                <Switch
                  id="includeInResume"
                  checked={includeInResume}
                  onCheckedChange={(checked) => {
                    setIncludeInResume(checked);
                    markChanged();
                  }}
                />
              </div>

              {includeInResume &&
                resumeProfiles &&
                resumeProfiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>profile visibility</Label>
                    <p className="text-muted-foreground mb-2 text-xs">
                      select which resume profiles should show this project
                    </p>
                    <div className="space-y-2">
                      {resumeProfiles.map((profile) => (
                        <div
                          key={profile.slug}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium">
                              {profile.title}
                            </span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              ({profile.slug})
                            </span>
                          </div>
                          <Switch
                            checked={selectedProfiles.includes(profile.slug)}
                            onCheckedChange={() =>
                              handleToggleProfile(profile.slug)
                            }
                          />
                        </div>
                      ))}
                    </div>
                    {selectedProfiles.length === 0 && (
                      <p className="text-muted-foreground text-xs">
                        no profiles selected - project will appear in all
                        profiles
                      </p>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
