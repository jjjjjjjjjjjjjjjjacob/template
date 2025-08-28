import { createFileRoute } from '@tanstack/react-router';
import { useState, Suspense, lazy } from 'react';
import { ExternalLink } from 'lucide-react';

// Lazy load heavy components
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

const projects: Project[] = [
  {
    id: 'heat-tech',
    title: 'heat.tech',
    url: 'https://heat.tech',
    description:
      'Motion capture marketplace connecting viral movements with gaming. Artists upload mocap content, developers integrate via plugins for Blender, Unity, Unreal, and Maya.',
    role: 'Senior Full-Stack Developer',
    responsibilities: [
      'Built React frontend with Three.js 3D viewer for motion preview',
      'Integrated Stripe marketplace with subscription management',
      'Developed plugin exporters for major 3D software platforms',
      'Implemented Auth0 authentication and user management',
      'Created responsive design system with Tailwind CSS',
      'Optimized performance for 3D content rendering',
    ],
    technologies: [
      'React',
      'Three.js',
      'TypeScript',
      'NestJS',
      'PostgreSQL',
      'Stripe',
      'Auth0',
      'AWS',
    ],
    timeline: '2022 - 2025',
    previews: ['https://heat.tech'],
  },
  {
    id: 'vibechecc',
    title: 'vibechecc.io',
    url: 'https://vibechecc.io',
    description:
      'Social platform for sharing life experiences ("vibes") with emoji ratings and community interaction. Features real-time updates and modern React architecture.',
    role: 'Full-Stack Developer & Founder',
    responsibilities: [
      'Architected TanStack Start application with type-safe routing',
      'Built Convex real-time backend with optimistic updates',
      'Designed emoji-based rating system with advanced UX',
      'Implemented Clerk authentication with social providers',
      'Created comprehensive test suite with Vitest',
      'Deployed infrastructure with Terraform and Cloudflare Workers',
    ],
    technologies: [
      'TanStack Start',
      'Convex',
      'TypeScript',
      'Tailwind CSS',
      'Clerk',
      'Cloudflare',
      'Terraform',
    ],
    timeline: '2025 - present',
    previews: ['https://vibechecc.io'],
  },
];

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
            <h3 className="text-foreground text-2xl font-medium">
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
            className="text-muted-foreground hover:text-foreground transition-colors-smooth flex items-center gap-2 text-sm"
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
            <h4 className="text-foreground mb-2 text-sm font-medium">
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
            <h4 className="text-foreground mb-2 text-sm font-medium">
              technologies
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-medium"
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="bg-background min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mb-16 space-y-4">
            <h1 className="text-foreground text-4xl font-medium tracking-tight">
              projects
            </h1>
            <p className="text-muted-foreground">
              recent work in full-stack development and product design
            </p>
          </div>

          {/* Two-column layout for better UX */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Project Thumbnails */}
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

            {/* Project Details */}
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
