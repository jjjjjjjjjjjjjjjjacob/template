import * as React from 'react';
import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

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

interface ProjectSlideshowProps {
  project: Project;
  isActive?: boolean;
}

function ProjectSlideshow({
  project,
  isActive = false,
}: ProjectSlideshowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div
      className="group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Project preview slideshow"
    >
      <div
        className={`transition-transform-smooth relative h-80 w-full overflow-hidden rounded-lg [perspective:1000px] ${
          isHovered && !isLoading
            ? '[transform:rotateX(0deg)_rotateY(0deg)_scale(1.02)]'
            : '[transform:rotateX(12deg)_rotateY(-8deg)_scale(0.96)]'
        } [transform-origin:center_center]`}
      >
        {isLoading ? (
          <div className="bg-muted/10 flex h-full w-full items-center justify-center rounded-xl">
            <div className="text-muted-foreground text-sm">
              Loading preview...
            </div>
          </div>
        ) : (
          <>
            <iframe
              src={project.preview}
              className="bg-background h-full w-full overflow-hidden rounded-xl border-0 shadow-2xl"
              title={`${project.title} preview`}
              loading="lazy"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
            {/* Interactive Overlay */}
            <div
              className={`transition-smooth-fast absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 ${
                isHovered ? 'opacity-0' : 'opacity-0 hover:opacity-100'
              }`}
              onClick={() =>
                window.open(project.url, '_blank', 'noopener,noreferrer')
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.open(project.url, '_blank', 'noopener,noreferrer');
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open ${project.title} project in new tab`}
            >
              <div className="bg-primary/90 text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <ExternalLink className="h-4 w-4" />
                Visit Project
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(ProjectSlideshow);
