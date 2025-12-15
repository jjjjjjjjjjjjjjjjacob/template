import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/convex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';
import { useState } from 'react';
import type { Id } from '@template/convex/dataModel';

export const Route = createFileRoute('/admin/projects/')({
  component: ProjectsIndexPage,
});

function ProjectsIndexPage() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const projects = useQuery(api.projects.list, { includeUnpublished: true });
  const removeMutation = useMutation(api.projects.remove);
  const updateMutation = useMutation(api.projects.update);
  const reorderMutation = useMutation(api.projects.reorder);

  const [draggedId, setDraggedId] = useState<Id<'portfolio_projects'> | null>(
    null
  );

  const isLoading = authLoading || projects === undefined;

  const handleDelete = async (id: Id<'portfolio_projects'>, title: string) => {
    if (
      !confirm(`are you sure you want to delete "${title}"? this cannot be undone.`)
    ) {
      return;
    }

    try {
      await removeMutation({ id });
      toast.success('project deleted');
    } catch {
      toast.error('failed to delete project');
    }
  };

  const handleTogglePublish = async (project: NonNullable<typeof projects>[0]) => {
    try {
      await updateMutation({
        id: project._id,
        data: {
          slug: project.slug,
          title: project.title,
          url: project.url,
          description: project.description,
          role: project.role,
          company: project.company,
          timeline: project.timeline,
          responsibilities: project.responsibilities,
          technologies: project.technologies,
          order: project.order,
          published: !project.published,
          media: project.media,
          thumbnailIndex: project.thumbnailIndex,
          includeInResume: project.includeInResume,
          resumeProfileSlugs: project.resumeProfileSlugs,
        },
      });
      toast.success(project.published ? 'project unpublished' : 'project published');
    } catch {
      toast.error('failed to update project');
    }
  };

  const handleDragStart = (id: Id<'portfolio_projects'>) => {
    setDraggedId(id);
  };

  const handleDragOver = async (
    e: React.DragEvent,
    targetId: Id<'portfolio_projects'>
  ) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || !projects) return;

    const currentOrder = projects.map((p) => p._id);
    const fromIndex = currentOrder.indexOf(draggedId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedId);

    try {
      await reorderMutation({ projectIds: newOrder });
    } catch {
      toast.error('failed to reorder projects');
    }

    setDraggedId(targetId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-light">projects</h1>
            <p className="text-muted-foreground text-sm">
              manage portfolio projects
            </p>
          </div>
        </div>
        <Link to="/admin/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            new project
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-light">no projects yet</h3>
            <p className="text-muted-foreground mb-4">
              create your first project to get started
            </p>
            <Link to="/admin/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                create project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-light">
              all projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>project</TableHead>
                  <TableHead>status</TableHead>
                  <TableHead>media</TableHead>
                  <TableHead>resume</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project._id}
                    className={draggedId === project._id ? 'opacity-50' : ''}
                    draggable
                    onDragStart={() => handleDragStart(project._id)}
                    onDragOver={(e) => handleDragOver(e, project._id)}
                    onDragEnd={handleDragEnd}
                  >
                    <TableCell>
                      <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-light">{project.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {project.timeline} • {project.role}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.published ? 'default' : 'secondary'}>
                        {project.published ? 'published' : 'draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Image className="h-4 w-4" />
                        <span className="text-sm">{project.media.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.includeInResume ? (
                        <Badge variant="outline">included</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/projects/${project._id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTogglePublish(project)}
                          >
                            {project.published ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(project._id, project.title)
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


