import * as React from 'react';
import { ExternalLink, Code, Calendar } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  url: string;
  description: string;
  role: string;
  responsibilities: string[];
  technologies: string[];
  timeline: string;
  preview: string;
}

interface ProjectThumbnailsProps {
  projects: Project[];
  onProjectSelect?: (project: Project) => void;
  selectedProject?: string;
}

function ProjectThumbnail({
  project,
  isSelected = false,
  onSelect,
}: {
  project: Project;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={`group cursor-pointer rounded-lg border transition-all duration-300 ${
        isSelected
          ? 'border-primary/50 bg-primary/5 shadow-md'
          : 'border-border/50 hover:border-primary/30 hover:shadow-sm'
      }`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select ${project.title} project`}
    >
      <div className="space-y-3 p-4">
        {/* Project Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <h3 className="text-foreground group-hover:text-primary text-lg font-semibold transition-colors">
              {project.title}
            </h3>
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {project.timeline}
              </div>
              <div className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                {project.role}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(project.url, '_blank', 'noopener,noreferrer');
            }}
            className="text-muted-foreground hover:text-primary p-1 opacity-0 transition-all duration-200 group-hover:opacity-100"
            aria-label={`Open ${project.title} in new tab`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {project.description}
        </p>

        {/* Technologies Preview */}
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="text-muted-foreground px-2 py-1 text-xs">
              +{project.technologies.length - 4} more
            </span>
          )}
        </div>

        {/* Hover Indicator */}
        <div
          className={`from-primary to-primary/50 h-0.5 bg-gradient-to-r transition-all duration-300 ${
            isSelected
              ? 'w-full opacity-100'
              : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
          }`}
        />
      </div>
    </div>
  );
}

function ProjectThumbnails({
  projects,
  onProjectSelect,
  selectedProject,
}: ProjectThumbnailsProps) {
  return (
    <div className="space-y-6" role="region" aria-label="Project thumbnails">
      <div className="space-y-1">
        <h2 className="text-foreground text-xl font-semibold">
          featured projects
        </h2>
        <p className="text-muted-foreground text-sm">
          Select a project to view detailed preview
        </p>
      </div>

      <div className="space-y-4">
        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
        {projects.map((project, _index) => (
          <ProjectThumbnail
            key={project.id}
            project={project}
            isSelected={selectedProject === project.id}
            onSelect={() => onProjectSelect?.(project)}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(ProjectThumbnails);
