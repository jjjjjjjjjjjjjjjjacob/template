import { createFileRoute } from '@tanstack/react-router';
import { useState, Suspense, lazy, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { ExternalLink } from 'lucide-react';

const ProjectSlideshow = lazy(() => import('@/components/project-slideshow'));
const ProjectThumbnails = lazy(
  () => import('@/components/projects/project-thumbnails')
);

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
});

interface Project {
  id: string;
  title: string;
  url: string;
  description: string;
  role: string;
  responsibilities: string[];
  technologies: string[];
  timeline: string;
  previews: string[];
}

function getPreviewsFromMedia(
  media: { type: string; url?: string }[]
): string[] {
  return media
    .filter((m) => (m.type === 'video' || m.type === 'iframe') && m.url)
    .map((m) => m.url as string)
    .concat(
      media
        .filter((m) => m.type === 'image' && m.url)
        .map((m) => m.url as string)
    );
}

function useProjects(): Project[] {
  const dbProjects = useQuery(api.projects.list, { includeUnpublished: false });

  return useMemo(() => {
    if (!dbProjects) {
      return [];
    }

    return dbProjects.map((p) => ({
      id: p.slug,
      title: p.title,
      url: p.url || '',
      description: p.description,
      role: p.role,
      responsibilities: p.responsibilities ?? [],
      technologies: p.technologies,
      timeline: p.timeline,
      previews: getPreviewsFromMedia(p.media),
    }));
  }, [dbProjects]);
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="space-y-8" role="region" aria-label="Project showcase">
      {/* Interactive Project Preview */}
      <Suspense
        fallback={
          <div className="bg-muted/20 h-80 w-full animate-pulse rounded-lg" />
        }
      >
        <ProjectSlideshow
          previews={project.previews}
          title={project.title}
          projectUrl={project.url}
          className="relative h-80 w-full"
        />
      </Suspense>

      {/* Project Details */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-foreground text-2xl font-light">
              {project.title}
            </h3>
            <p className="text-muted-foreground">
              {project.timeline} • {project.role}
            </p>
          </div>
          <button
            onClick={() =>
              window.open(project.url, '_blank', 'noopener,noreferrer')
            }
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors duration-200"
            aria-label={`Visit ${project.title} project`}
          >
            <ExternalLink className="h-4 w-4" />
            visit
          </button>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          {project.description}
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="text-foreground mb-2 text-sm font-light">
              key contributions
            </h4>
            <ul className="space-y-1">
              {project.responsibilities.map((responsibility, index) => (
                <li
                  key={index}
                  className="text-muted-foreground flex items-start gap-2 text-sm"
                >
                  <span className="bg-muted-foreground mt-2 h-1 w-1 flex-shrink-0 rounded-full" />
                  {responsibility}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground mb-2 text-sm font-light">
              technologies
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-light"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsPage() {
  const projects = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="bg-background min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 space-y-4">
            <h1 className="text-foreground text-4xl font-light tracking-tight">
              projects
            </h1>
            <p className="text-muted-foreground">
              recent work in full-stack development and product design
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Suspense
                fallback={
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-muted/20 h-48 w-full animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                }
              >
                <ProjectThumbnails
                  projects={projects}
                  onProjectSelect={setSelectedProject}
                  selectedProject={selectedProject?.id}
                />
              </Suspense>
            </div>

            <div className="lg:col-span-2">
              {selectedProject ? (
                <ProjectCard project={selectedProject} />
              ) : (
                <div className="space-y-24">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
