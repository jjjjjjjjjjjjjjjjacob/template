import { createLazyFileRoute, Link, useRouter } from '@tanstack/react-router';
import { api } from '@template/backend';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  MediaItem,
  ProjectMediaManager,
} from '@/components/admin/project-media-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';

export const Route = createLazyFileRoute('/admin/projects/new')({
  component: NewProjectPage,
});

function NewProjectPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const createMutation = useMutation(api.projects.create);
  const resumeProfiles = useQuery(api.resume.listProfiles);

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

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities([...responsibilities, newResponsibility.trim()]);
      setNewResponsibility('');
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const handleAddTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim())) {
      setTechnologies([...technologies, newTechnology.trim()]);
      setNewTechnology('');
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  const handleToggleProfile = (profileSlug: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileSlug)
        ? prev.filter((s) => s !== profileSlug)
        : [...prev, profileSlug]
    );
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
      const existingProjects = await createMutation({
        slug: slug.trim(),
        title: title.trim(),
        url: url.trim() || undefined,
        description: description.trim(),
        role: role.trim(),
        company: company.trim() || undefined,
        timeline: timeline.trim(),
        responsibilities,
        technologies,
        order: 0,
        published,
        media,
        thumbnailIndex,
        includeInResume,
        resumeProfileSlugs:
          includeInResume && selectedProfiles.length > 0
            ? selectedProfiles
            : undefined,
      });

      toast.success('project created');
      router.navigate({ to: `/admin/projects/${existingProjects}` });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to create project'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
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
    <div className="admin-page admin-page-wide">
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <Link to="/admin/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              back
            </Button>
          </Link>
          <div>
            <p className="admin-page-kicker">portfolio</p>
            <h1 className="admin-page-title">new project</h1>
            <p className="admin-page-description">
              create a new portfolio project
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'saving...' : 'save project'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="admin-card">
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
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="project title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
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
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">company (optional)</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
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
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="full-stack developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">timeline</Label>
                  <Input
                    id="timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="2023 - present"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="describe the project..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card">
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

          <Card className="admin-card">
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

          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="font-light">media</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectMediaManager
                media={media}
                thumbnailIndex={thumbnailIndex}
                onMediaChange={setMedia}
                onThumbnailChange={setThumbnailIndex}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="font-light">publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="published">published</Label>
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {published
                  ? 'this project is visible on the public projects page'
                  : 'this project is hidden from the public'}
              </p>
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="font-light">resume settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeInResume">include in resume</Label>
                <Switch
                  id="includeInResume"
                  checked={includeInResume}
                  onCheckedChange={setIncludeInResume}
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
