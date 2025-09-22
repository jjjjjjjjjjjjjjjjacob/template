import * as React from 'react';
import { Github, ExternalLink } from 'lucide-react';

interface ProjectLinksProps {
  githubUrl?: string;
  liveUrl?: string;
  projectName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function ProjectLinks({
  githubUrl,
  liveUrl,
  projectName,
  size = 'md',
  showLabels = false,
  className = '',
}: ProjectLinksProps) {
  // Don't render if no links are provided
  if (!githubUrl && !liveUrl) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors duration-200"
          aria-label={`View ${projectName || 'project'} source code on GitHub`}
        >
          <Github className={iconSize} />
          {showLabels && <span className="text-sm font-[200]">code</span>}
        </a>
      )}

      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors duration-200"
          aria-label={`View ${projectName || 'project'} live demo`}
        >
          <ExternalLink className={iconSize} />
          {showLabels && <span className="text-sm font-[200]">live</span>}
        </a>
      )}
    </div>
  );
}
