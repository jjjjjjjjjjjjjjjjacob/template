import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GripVertical,
  Plus,
  Trash2,
  Settings2,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/tailwind-utils';
import { Link } from '@tanstack/react-router';

interface ResumeProjectManagerProps {
  profileSlug: string;
}

export function ResumeProjectManager({
  profileSlug,
}: ResumeProjectManagerProps) {
  const availableProjects = useQuery(api.resume.listAvailableProjects, {
    profileSlug,
  });

  const linkProject = useMutation(api.resume.linkProjectToProfile);
  const unlinkProject = useMutation(api.resume.unlinkProjectFromProfile);
  const reorderProjects = useMutation(api.resume.reorderProfileProjects);
  const updateSettings = useMutation(api.resume.updateProfileProjectSettings);

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [editingProjectSlug, setEditingProjectSlug] = React.useState<
    string | null
  >(null);
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(
    new Set()
  );
  const [selectedAchievements, setSelectedAchievements] = React.useState<
    number[]
  >([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const editingProject = availableProjects?.linked.find(
    (p) => p.slug === editingProjectSlug
  );

  React.useEffect(() => {
    if (editingProject) {
      if (
        editingProject.achievementFilter &&
        editingProject.achievementFilter.length > 0
      ) {
        setSelectedAchievements(editingProject.achievementFilter);
      } else {
        setSelectedAchievements(
          (editingProject.achievements || []).map((_, i) => i)
        );
      }
    }
  }, [editingProject]);

  const toggleExpanded = (projectSlug: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectSlug)) {
        next.delete(projectSlug);
      } else {
        next.add(projectSlug);
      }
      return next;
    });
  };

  const handleLink = async (portfolioProjectSlug: string) => {
    try {
      await linkProject({ profileSlug, portfolioProjectSlug });
      toast.success('project linked');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to link project'
      );
    }
  };

  const handleUnlink = async (projectSlug: string) => {
    if (!confirm('remove this project from the resume profile?')) {
      return;
    }

    try {
      await unlinkProject({ profileSlug, projectSlug });
      toast.success('project unlinked');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to unlink project'
      );
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || !availableProjects)
      return;

    const newOrder = [...availableProjects.linked];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    reorderProjects({
      profileSlug,
      projectOrder: newOrder.map((p) => p.slug),
    });

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleToggleAchievement = (index: number) => {
    setSelectedAchievements((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  const handleSelectAll = () => {
    if (!editingProject?.achievements) return;
    setSelectedAchievements(editingProject.achievements.map((_, i) => i));
  };

  const handleSelectNone = () => {
    setSelectedAchievements([]);
  };

  const handleSaveAchievementFilter = async () => {
    if (!editingProjectSlug || !editingProject) return;

    setIsSaving(true);
    try {
      const isAllSelected =
        selectedAchievements.length ===
        (editingProject.achievements?.length || 0);

      await updateSettings({
        profileSlug,
        projectSlug: editingProjectSlug,
        updates: {
          achievementFilter: isAllSelected ? [] : selectedAchievements,
        },
      });
      toast.success('achievement filter updated');
      setEditingProjectSlug(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to update filter'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDialog = () => {
    setEditingProjectSlug(null);
    setSelectedAchievements([]);
  };

  type LinkedProject = NonNullable<typeof availableProjects>['linked'][0];

  const getDisplayedAchievementsCount = (project: LinkedProject) => {
    if (!project.achievements) return 0;
    if (!project.achievementFilter || project.achievementFilter.length === 0) {
      return project.achievements.length;
    }
    return project.achievementFilter.length;
  };

  type Achievement = NonNullable<LinkedProject['achievements']>[0];

  const getDisplayedAchievements = (project: LinkedProject): Achievement[] => {
    if (!project.achievements) return [];
    if (!project.achievementFilter || project.achievementFilter.length === 0) {
      return project.achievements;
    }
    return project.achievementFilter
      .map((idx: number) => project.achievements![idx])
      .filter((a): a is Achievement => Boolean(a));
  };

  if (!availableProjects) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2" />
        <span className="text-muted-foreground ml-2">loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">
            linked projects ({availableProjects.linked.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableProjects.linked.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              no projects linked yet. add projects from the list below.
            </p>
          ) : (
            <div className="space-y-2">
              {availableProjects.linked.map((project, index) => (
                <Collapsible
                  key={project.slug}
                  open={expandedProjects.has(project.slug)}
                  onOpenChange={() => toggleExpanded(project.slug)}
                >
                  <div
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${project.title} - drag to reorder`}
                    className={cn(
                      'rounded-lg border transition-opacity',
                      draggedIndex === index && 'opacity-50'
                    )}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleExpanded(project.slug);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <GripVertical className="text-muted-foreground h-5 w-5 cursor-grab" />

                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-light">
                              {project.title}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {project.role} • {project.timeline}
                            </p>
                          </div>

                          <Badge variant="outline" className="shrink-0 text-xs">
                            {getDisplayedAchievementsCount(project)} /{' '}
                            {project.achievements?.length || 0} items
                          </Badge>

                          {expandedProjects.has(project.slug) ? (
                            <ChevronUp className="text-muted-foreground h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingProjectSlug(project.slug)}
                          className="h-8 w-8 p-0"
                          title="filter achievements"
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnlink(project.slug)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0"
                          title="remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="border-t px-3 py-3">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-muted-foreground text-xs">
                            displayed achievements:
                          </p>
                          <Link
                            to="/admin/projects/$projectId"
                            params={{ projectId: project._id }}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            edit in portfolio
                          </Link>
                        </div>
                        <ul className="space-y-1">
                          {getDisplayedAchievements(project)
                            .slice(0, 5)
                            .map((achievement, i) => (
                              <li
                                key={i}
                                className="text-muted-foreground flex items-start gap-2 text-xs"
                              >
                                <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                                <span className="line-clamp-1">
                                  {achievement.description}
                                </span>
                              </li>
                            ))}
                          {getDisplayedAchievementsCount(project) > 5 && (
                            <li className="text-muted-foreground text-xs">
                              +{getDisplayedAchievementsCount(project) - 5} more
                            </li>
                          )}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">
            available projects ({availableProjects.available.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableProjects.available.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              all portfolio projects are already linked to this profile.
            </p>
          ) : (
            <div className="space-y-2">
              {availableProjects.available.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-light">{project.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {project.role} • {project.timeline}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLink(project.slug)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    link
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingProjectSlug} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>filter achievements</DialogTitle>
            <DialogDescription>
              select which achievements to display on this resume profile.
              achievements are managed in the portfolio project editor.
            </DialogDescription>
          </DialogHeader>
          {editingProject && (
            <>
              <div className="py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-light">{editingProject.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {editingProject.role} • {editingProject.timeline}
                    </p>
                  </div>
                  <Link
                    to="/admin/projects/$projectId"
                    params={{ projectId: editingProject._id }}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    edit project
                  </Link>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    select all
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                  >
                    select none
                  </Button>
                  <span className="text-muted-foreground ml-auto text-sm">
                    {selectedAchievements.length} /{' '}
                    {editingProject.achievements?.length || 0} selected
                  </span>
                </div>

                <div className="space-y-2">
                  {(editingProject.achievements || []).map(
                    (achievement, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                          selectedAchievements.includes(index)
                            ? 'border-primary bg-primary/5'
                            : 'border-muted'
                        )}
                      >
                        <Checkbox
                          checked={selectedAchievements.includes(index)}
                          onCheckedChange={() => handleToggleAchievement(index)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{achievement.description}</p>
                          {achievement.impact && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              impact: {achievement.impact}
                            </p>
                          )}
                          {achievement.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {achievement.technologies.map((tech) => (
                                <Badge
                                  key={tech}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {(!editingProject.achievements ||
                  editingProject.achievements.length === 0) && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      no achievements found for this project.
                    </p>
                    <Link
                      to="/admin/projects/$projectId"
                      params={{ projectId: editingProject._id }}
                      className="text-primary mt-2 inline-flex items-center gap-1 text-sm hover:underline"
                    >
                      <Plus className="h-4 w-4" />
                      add achievements in portfolio
                    </Link>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  cancel
                </Button>
                <Button
                  onClick={handleSaveAchievementFilter}
                  disabled={isSaving}
                >
                  {isSaving ? 'saving...' : 'save filter'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
