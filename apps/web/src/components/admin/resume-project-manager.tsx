import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/convex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  GripVertical,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/tailwind-utils';
import { AchievementSelector, Achievement } from './achievement-selector';

interface ResumeProjectManagerProps {
  profileSlug: string;
}

export function ResumeProjectManager({
  profileSlug,
}: ResumeProjectManagerProps) {
  const profileData = useQuery(api.resume.getProfile, { slug: profileSlug });
  const availableProjects = useQuery(api.resume.listAvailableProjects, {
    profileSlug,
  });

  const linkProject = useMutation(api.resume.linkProjectToProfile);
  const unlinkProject = useMutation(api.resume.unlinkProjectFromProfile);
  const reorderProjects = useMutation(api.resume.reorderProfileProjects);
  const updateProject = useMutation(api.resume.updateResumeProject);

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(
    null
  );
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(
    new Set()
  );
  const [editingAchievements, setEditingAchievements] = React.useState<
    Achievement[] | null
  >(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const editingProject = profileData?.projects.find(
    (p) => p.projectId === editingProjectId
  );

  React.useEffect(() => {
    if (editingProject) {
      setEditingAchievements(editingProject.achievements);
    }
  }, [editingProject]);

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
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

  const handleUnlink = async (projectId: string) => {
    if (!confirm('remove this project from the resume profile?')) {
      return;
    }

    try {
      await unlinkProject({ profileSlug, projectId });
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
    if (draggedIndex === null || draggedIndex === index || !profileData) return;

    const newOrder = [...profileData.projects];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    reorderProjects({
      profileSlug,
      projectOrder: newOrder.map((p) => p.projectId),
    });

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveAchievements = async () => {
    if (!editingProjectId || !editingAchievements) return;

    setIsSaving(true);
    try {
      await updateProject({
        profileSlug,
        projectId: editingProjectId,
        updates: {
          achievements: editingAchievements,
        },
      });
      toast.success('achievements updated');
      setEditingProjectId(null);
      setEditingAchievements(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'failed to update achievements'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDialog = () => {
    setEditingProjectId(null);
    setEditingAchievements(null);
  };

  if (!profileData || !availableProjects) {
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
            linked projects ({profileData.projects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileData.projects.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              no projects linked yet. add projects from the list below.
            </p>
          ) : (
            <div className="space-y-2">
              {profileData.projects.map((project, index) => (
                <Collapsible
                  key={project.projectId}
                  open={expandedProjects.has(project.projectId)}
                  onOpenChange={() => toggleExpanded(project.projectId)}
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
                        toggleExpanded(project.projectId);
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
                            {
                              project.achievements.filter(
                                (a) => a.included !== false
                              ).length
                            }{' '}
                            / {project.achievements.length} items
                          </Badge>

                          {expandedProjects.has(project.projectId) ? (
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
                          onClick={() => setEditingProjectId(project.projectId)}
                          className="h-8 w-8 p-0"
                          title="edit achievements"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnlink(project.projectId)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0"
                          title="remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="border-t px-3 py-3">
                        <p className="text-muted-foreground mb-3 text-xs">
                          included achievements:
                        </p>
                        <ul className="space-y-1">
                          {project.achievements
                            .filter((a) => a.included !== false)
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
                          {project.achievements.filter(
                            (a) => a.included !== false
                          ).length > 5 && (
                            <li className="text-muted-foreground text-xs">
                              +
                              {project.achievements.filter(
                                (a) => a.included !== false
                              ).length - 5}{' '}
                              more
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

      <Dialog open={!!editingProjectId} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>edit achievements</DialogTitle>
          </DialogHeader>
          {editingProject && editingAchievements && (
            <>
              <div className="py-4">
                <div className="mb-4">
                  <p className="font-light">{editingProject.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {editingProject.role} • {editingProject.timeline}
                  </p>
                </div>

                <AchievementSelector
                  achievements={editingAchievements}
                  onAchievementsChange={setEditingAchievements}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  cancel
                </Button>
                <Button onClick={handleSaveAchievements} disabled={isSaving}>
                  {isSaving ? 'saving...' : 'save changes'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
