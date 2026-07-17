import { ExternalLink } from 'lucide-react';
import { memo } from 'react';
import { AnimatedSection } from '@/components/animated-section';
import { ProjectSlideshow } from '@/components/project-slideshow';
import type { ResumeProject } from '@/hooks/use-resume-filter';

interface ProjectCardProps {
  project: ResumeProject;
  index: number;
  onVisit: (projectName: string, projectUrl: string | undefined) => void;
}

function ProjectCardComponent({ project, index, onVisit }: ProjectCardProps) {
  const isEven = index % 2 === 0;
  const slideDirection = isEven ? 'left-to-right' : 'right-to-left';
  const hasPreviews = project.previews.length > 0;

  if (!hasPreviews) {
    return (
      <div className="group">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-foreground text-2xl font-light md:text-3xl">
                {project.title}
              </h3>
              <p className="text-muted-foreground font-light">
                {project.timeline} • {project.role}
              </p>
            </div>
          </div>

          <p className="text-muted-foreground max-w-3xl leading-relaxed font-light md:text-lg">
            {project.description}
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="text-foreground mb-3 text-sm font-light">
                key contributions
              </h4>
              <ul className="space-y-2">
                {project.achievements
                  .slice(0, 6)
                  .map((achievement, achIndex) => (
                    <li
                      key={achIndex}
                      className="text-muted-foreground flex items-start gap-3 text-sm font-light"
                    >
                      <span className="bg-muted-foreground mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                      {achievement.description}
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h4 className="text-foreground mb-3 text-sm font-light">
                technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  ...project.technologies.frontend,
                  ...project.technologies.backend,
                  ...project.technologies.infrastructure,
                ]
                  .slice(0, 10)
                  .map((tech) => (
                    <span
                      key={tech}
                      className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-light"
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

  return (
    <div className="group">
      {/* Mobile Layout - Vertical */}
      <div className="space-y-8 md:hidden">
        <ProjectSlideshow
          previews={project.previews}
          title={project.title}
          projectUrl={project.url}
          className="relative h-80 w-full"
          slideDirection={slideDirection}
          isMobile={true}
        />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-foreground text-2xl font-light">
                {project.title}
              </h3>
              <p className="text-muted-foreground font-light">
                {project.timeline} • {project.role}
              </p>
            </div>
            <button
              onClick={() => onVisit(project.title, project.url)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors duration-200"
            >
              <ExternalLink className="h-4 w-4" />
              visit
            </button>
          </div>

          <p className="text-muted-foreground leading-relaxed font-light">
            {project.description}
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="text-foreground mb-2 text-sm font-light">
                key contributions
              </h4>
              <ul className="space-y-1">
                {project.achievements
                  .slice(0, 6)
                  .map((achievement, achIndex) => (
                    <li
                      key={achIndex}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <span className="bg-muted-foreground mt-2 h-1 w-1 flex-shrink-0 rounded-full font-light" />
                      {achievement.description}
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h4 className="text-foreground mb-2 text-sm font-light">
                technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  ...project.technologies.frontend,
                  ...project.technologies.backend,
                  ...project.technologies.infrastructure,
                ]
                  .slice(0, 8)
                  .map((tech) => (
                    <span
                      key={tech}
                      className="text-muted-foreground text-xs font-light"
                    >
                      {tech}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Horizontal with Alternating */}
      <div className="hidden md:flex md:min-h-[500px] md:items-stretch md:gap-16">
        {/* Preview Section */}
        <AnimatedSection
          animationType="section"
          delay={0}
          className={`flex-1 overflow-hidden ${isEven ? 'md:order-2' : 'md:order-1'}`}
        >
          <ProjectSlideshow
            previews={project.previews}
            title={project.title}
            projectUrl={project.url}
            className="relative h-full w-full"
            slideDirection={slideDirection}
            isMobile={false}
          />
        </AnimatedSection>

        {/* Info Section */}
        <div
          className={`flex-1 space-y-6 ${isEven ? 'md:order-1' : 'md:order-2'}`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex justify-between">
                <h3 className="text-foreground text-3xl font-light">
                  {project.title}
                </h3>
                <button
                  onClick={() => onVisit(project.title, project.url)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  visit
                </button>
              </div>
              <p className="text-muted-foreground font-light">
                {project.timeline} • {project.role}
              </p>
            </div>
          </div>

          <p className="text-muted-foreground text-lg leading-relaxed font-light">
            {project.description}
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="text-foreground mb-3 text-sm font-light">
                key contributions
              </h4>
              <ul className="space-y-2">
                {project.achievements
                  .slice(0, 6)
                  .map((achievement, achIndex) => (
                    <li
                      key={achIndex}
                      className="text-muted-foreground flex items-start gap-3 text-sm font-light"
                    >
                      <span className="bg-muted-foreground mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full font-light" />
                      {achievement.description}
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h4 className="text-foreground mb-3 text-sm font-light">
                technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  ...project.technologies.frontend,
                  ...project.technologies.backend,
                  ...project.technologies.infrastructure,
                ]
                  .slice(0, 8)
                  .map((tech) => (
                    <span
                      key={tech}
                      className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-light"
                    >
                      {tech}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProjectCard = memo(ProjectCardComponent);
