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
    id: 'vibechecc',
    title: 'vibechecc.io',
    url: 'https://vibechecc.io',
    description:
      'Social platform for sharing life experiences ("vibes") with emoji ratings and community interaction. Features real-time updates and modern React architecture.',
    role: 'Founder & Lead Developer',
    responsibilities: [
      'Architected real-time social platform with TanStack Start and Convex backend',
      'Designed innovative emoji rating system replacing traditional star ratings',
      'Implemented real-time subscriptions with optimistic UI updates',
      'Built comprehensive infrastructure with Terraform and Cloudflare Workers',
      'Created extensive test suite with Vitest and Convex testing framework',
    ],
    technologies: [
      'TanStack Start',
      'TanStack Router',
      'TanStack Query',
      'Convex',
      'Clerk',
      'Node.js',
      'Cloudflare Workers',
      'Terraform',
    ],
    timeline: '2025 - present',
    previews: ['https://vibechecc.io'],
  },
  {
    id: 'heat-tech',
    title: 'heat.tech',
    url: 'https://heat.tech/search/animations/05867c5d-0542-48d1-bc7a-7f1f81ffee73',
    description:
      'Motion capture marketplace backed by a16z and Samsung Next, connecting viral movements with gaming. Architected full-stack TypeScript ecosystem with real-time 3D animation processing and cross-platform plugin system.',
    role: 'Senior Full-Stack Developer & Technical Lead',
    responsibilities: [
      'Architected monorepo platform with real-time 3D animation marketplace using Nx workspace',
      'Built advanced 3D viewer with Three.js/React Three Fiber for real-time animation preview',
      'Integrated Stripe marketplace with subscription management and creator payout system',
      'Developed cross-platform plugin ecosystem for Blender, Unity, Unreal Engine, and Maya',
      'Built Qt desktop application with custom web view layer to unify interaction patterns',
      'Trained and deployed armature-generating ML model using PyTorch and ONNX Runtime',
      "Led technical integration with Move AI's beta API program",
      'Designed and implemented AWS infrastructure with Terraform IaC',
    ],
    technologies: [
      'React',
      'Three.js',
      'React Three Fiber',
      'NestJS',
      'TypeORM',
      'PostgreSQL',
      'AWS ECS',
      'Terraform',
      'Python',
      'C++',
      'Qt',
      'PyTorch',
    ],
    timeline: '2022 - 2025',
    previews: ['https://heat.tech'],
  },
  {
    id: 'freelance',
    title: 'Freelance Development',
    url: '',
    description:
      'Providing full-stack development services to startups across healthtech, hospitality, creative industries, and early-stage ventures.',
    role: 'Freelance Full-Stack Developer',
    responsibilities: [
      'Built platform for Biogenesis, a healthtech startup connecting clinical trial facilities with pharmaceutical companies',
      "Developed event management platform for Jean's, a New York restaurant",
      'Created portfolio websites for director and copywriter Madeline Leary',
      'Built ticket and job management application for Wonder, streamlining workflow coordination',
    ],
    technologies: [
      'React',
      'Next.js',
      'TypeScript',
      'Node.js',
      'PostgreSQL',
      'Tailwind CSS',
    ],
    timeline: 'March 2021 - present',
    previews: [],
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="bg-background min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mb-16 space-y-4">
            <h1 className="text-foreground text-4xl font-light tracking-tight">
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
