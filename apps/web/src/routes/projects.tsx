import { createFileRoute } from '@tanstack/react-router';
import { api } from '@template/backend';
import { useQuery } from 'convex/react';
import { ExternalLink } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { SitePublicShell } from '@/components/site/public-shell';
import { getProjectPreviewUrls } from '@/lib/project-previews';

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
      description: p.description ?? '',
      role: p.role,
      responsibilities: p.responsibilities ?? [],
      technologies: p.technologies ?? [],
      timeline: p.timeline,
      previews: getProjectPreviewUrls(p.media),
    }));
  }, [dbProjects]);
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div
      className="site-public-project"
      role="region"
      aria-label="Project showcase"
    >
      {/* Interactive Project Preview */}
      <Suspense fallback={<div className="site-public-preview-skeleton" />}>
        <ProjectSlideshow
          previews={project.previews}
          title={project.title}
          projectUrl={project.url}
          className="relative h-80 w-full"
        />
      </Suspense>

      {/* Project Details */}
      <div className="site-public-project-body">
        <div className="site-public-project-head">
          <div>
            <h3>{project.title}</h3>
            <p className="site-public-project-meta">
              {project.timeline} • {project.role}
            </p>
          </div>
          {project.url && (
            <button
              onClick={() =>
                window.open(project.url, '_blank', 'noopener,noreferrer')
              }
              className="site-link site-link-button site-public-project-visit"
              aria-label={`Visit ${project.title} project`}
            >
              <ExternalLink className="h-4 w-4" />
              visit
            </button>
          )}
        </div>

        <p>{project.description}</p>

        <div className="site-public-project-details">
          <div>
            <h4>key contributions</h4>
            <ul className="space-y-1">
              {project.responsibilities.map((responsibility, index) => (
                <li key={index} className="site-public-project-bullet">
                  <span aria-hidden="true" />
                  {responsibility}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>technologies</h4>
            <div className="site-public-project-tags">
              {project.technologies.map((tech) => (
                <span key={tech}>{tech}</span>
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
    <SitePublicShell
      eyebrow="index — projects"
      title="Selected Work"
      description="Recent product, web, mobile, and systems work."
      wide
    >
      <div className="site-public-project-grid">
        <div>
          <Suspense
            fallback={
              <div className="site-public-thumb-skeletons">
                {[...Array(3)].map((_, i) => (
                  <div key={i} />
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

        <div>
          {selectedProject ? (
            <ProjectCard project={selectedProject} />
          ) : (
            <div className="site-public-project-list">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SitePublicShell>
  );
}
