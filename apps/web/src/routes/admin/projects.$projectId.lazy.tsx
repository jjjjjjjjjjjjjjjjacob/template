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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';
import {
  ProjectMediaManager,
  MediaItem,
} from '@/components/admin/project-media-manager';
import type { Id } from '@template/convex/dataModel';

interface Achievement {
  description: string;
  impact?: string;
  technologies: string[];
  domains: string[];
  type: string;
  priority: number;
}

const ACHIEVEMENT_TYPES = [
  'architecture',
  'development',
  'integration',
  'optimization',
  'leadership',
  'design',
  'testing',
  'documentation',
  'other',
];

const DOMAIN_OPTIONS = [
  'frontend',
  'backend',
  '3d',
  'realtime',
  'infrastructure',
  'payments',
  'auth',
  'ai',
  'ml',
  'devops',
  'testing',
  'video',
  'search',
];

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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [editingAchievement, setEditingAchievement] = useState<{
    index: number | null;
    data: Achievement;
  } | null>(null);
  const [newAchievementTech, setNewAchievementTech] = useState('');
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
      setResponsibilities(project.responsibilities || []);
      setTechnologies(project.technologies);
      setAchievements(project.achievements || []);
      setPublished(project.published);
      setMedia(project.media as MediaItem[]);
      setThumbnailIndex(project.thumbnailIndex);
      setIncludeInResume(project.includeInResume ?? false);
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

  const handleOpenAchievementDialog = (index: number | null) => {
    if (index !== null) {
      setEditingAchievement({ index, data: { ...achievements[index] } });
    } else {
      setEditingAchievement({
        index: null,
        data: {
          description: '',
          impact: '',
          technologies: [],
          domains: [],
          type: 'development',
          priority: achievements.length,
        },
      });
    }
    setNewAchievementTech('');
  };

  const handleCloseAchievementDialog = () => {
    setEditingAchievement(null);
    setNewAchievementTech('');
  };

  const handleSaveAchievement = () => {
    if (!editingAchievement || !editingAchievement.data.description.trim()) {
      toast.error('description is required');
      return;
    }

    const newAchievements = [...achievements];
    if (editingAchievement.index !== null) {
      newAchievements[editingAchievement.index] = editingAchievement.data;
    } else {
      newAchievements.push({
        ...editingAchievement.data,
        priority: newAchievements.length,
      });
    }
    setAchievements(newAchievements);
    markChanged();
    handleCloseAchievementDialog();
  };

  const handleRemoveAchievement = (index: number) => {
    const newAchievements = achievements
      .filter((_, i) => i !== index)
      .map((a, i) => ({ ...a, priority: i }));
    setAchievements(newAchievements);
    markChanged();
  };

  const handleMoveAchievement = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === achievements.length - 1)
    ) {
      return;
    }

    const newAchievements = [...achievements];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newAchievements[index], newAchievements[targetIndex]] = [
      newAchievements[targetIndex],
      newAchievements[index],
    ];
    newAchievements.forEach((a, i) => {
      a.priority = i;
    });
    setAchievements(newAchievements);
    markChanged();
  };

  const handleAddAchievementTech = () => {
    if (
      !editingAchievement ||
      !newAchievementTech.trim() ||
      editingAchievement.data.technologies.includes(newAchievementTech.trim())
    ) {
      return;
    }
    setEditingAchievement({
      ...editingAchievement,
      data: {
        ...editingAchievement.data,
        technologies: [
          ...editingAchievement.data.technologies,
          newAchievementTech.trim(),
        ],
      },
    });
    setNewAchievementTech('');
  };

  const handleRemoveAchievementTech = (tech: string) => {
    if (!editingAchievement) return;
    setEditingAchievement({
      ...editingAchievement,
      data: {
        ...editingAchievement.data,
        technologies: editingAchievement.data.technologies.filter(
          (t) => t !== tech
        ),
      },
    });
  };

  const handleToggleAchievementDomain = (domain: string) => {
    if (!editingAchievement) return;
    const currentDomains = editingAchievement.data.domains;
    const newDomains = currentDomains.includes(domain)
      ? currentDomains.filter((d) => d !== domain)
      : [...currentDomains, domain];
    setEditingAchievement({
      ...editingAchievement,
      data: { ...editingAchievement.data, domains: newDomains },
    });
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
          responsibilities:
            responsibilities.length > 0 ? responsibilities : undefined,
          technologies,
          achievements: achievements.length > 0 ? achievements : undefined,
          order: project?.order ?? 0,
          published,
          media,
          thumbnailIndex,
          includeInResume: includeInResume || undefined,
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

  if (!project) {
    return (
      <div className="admin-page">
        <Card className="admin-card border-destructive">
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
            <div className="flex items-center gap-2">
              <div>
                <p className="admin-page-kicker">portfolio</p>
                <h1 className="admin-page-title">edit project</h1>
              </div>
              {hasChanges && (
                <Badge variant="outline" className="text-orange-500">
                  unsaved
                </Badge>
              )}
            </div>
            <p className="admin-page-description">{project.title}</p>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-light">
                achievements ({achievements.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAchievementDialog(null)}
              >
                <Plus className="mr-1 h-4 w-4" />
                add
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {achievements.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  no achievements yet. add achievements to showcase on resume
                  profiles.
                </p>
              ) : (
                achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-muted flex items-start gap-3 rounded-lg p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveAchievement(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveAchievement(index, 'down')}
                        disabled={index === achievements.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{achievement.description}</p>
                      {achievement.impact && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          impact: {achievement.impact}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {achievement.type}
                        </Badge>
                        {achievement.technologies.slice(0, 3).map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {achievement.technologies.length > 3 && (
                          <span className="text-muted-foreground text-xs">
                            +{achievement.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenAchievementDialog(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0"
                        onClick={() => handleRemoveAchievement(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="admin-card">
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

      <Dialog
        open={!!editingAchievement}
        onOpenChange={handleCloseAchievementDialog}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement?.index !== null
                ? 'edit achievement'
                : 'add achievement'}
            </DialogTitle>
            <DialogDescription>
              describe what you accomplished and the technologies used
            </DialogDescription>
          </DialogHeader>

          {editingAchievement && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="achievement-description">description</Label>
                <Textarea
                  id="achievement-description"
                  value={editingAchievement.data.description}
                  onChange={(e) =>
                    setEditingAchievement({
                      ...editingAchievement,
                      data: {
                        ...editingAchievement.data,
                        description: e.target.value,
                      },
                    })
                  }
                  placeholder="what did you accomplish?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement-impact">impact (optional)</Label>
                <Input
                  id="achievement-impact"
                  value={editingAchievement.data.impact || ''}
                  onChange={(e) =>
                    setEditingAchievement({
                      ...editingAchievement,
                      data: {
                        ...editingAchievement.data,
                        impact: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., reduced load time by 40%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement-type">type</Label>
                <Select
                  value={editingAchievement.data.type}
                  onValueChange={(value) =>
                    setEditingAchievement({
                      ...editingAchievement,
                      data: { ...editingAchievement.data, type: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACHIEVEMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>technologies</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAchievementTech}
                    onChange={(e) => setNewAchievementTech(e.target.value)}
                    placeholder="add a technology..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAchievementTech();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAchievementTech}
                    disabled={!newAchievementTech.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editingAchievement.data.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {editingAchievement.data.technologies.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="cursor-pointer gap-1 pr-1"
                        onClick={() => handleRemoveAchievementTech(tech)}
                      >
                        {tech}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>domains</Label>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map((domain) => (
                    <Badge
                      key={domain}
                      variant={
                        editingAchievement.data.domains.includes(domain)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => handleToggleAchievementDomain(domain)}
                    >
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAchievementDialog}>
              cancel
            </Button>
            <Button onClick={handleSaveAchievement}>
              {editingAchievement?.index !== null ? 'save' : 'add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
