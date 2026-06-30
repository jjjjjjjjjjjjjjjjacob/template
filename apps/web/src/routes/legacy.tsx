import { useHashScroll } from '@/hooks/use-hash-scroll';
import { useSectionObserverById } from '@/hooks/use-section-observer';
import { createFileRoute } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@template/convex';
import { defaultParticleConfig } from '@/components/particle-controls';
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/components/theme-provider';
import { AnimatedSection } from '@/components/animated-section';
import { useResumeFilter } from '@/hooks/use-resume-filter';
import { Github } from 'lucide-react';
import { ProjectCard } from '@/components/project-card';
import { ResumeExperience } from '@/components/resume-experience';
import { ResumeSkills } from '@/components/resume-skills';
import { SiteFooter } from '@/components/site-footer';
import { buildResumeDataFromSource } from '@/lib/resume-export-data';

// Custom X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { Separator } from '@/components/ui';
import { usePageAssetsReady } from '@/hooks/use-page-assets-ready';
import { HeroTitle } from '@/components/hero-title';
import { PDFDownloadPopover } from '@/components/pdf-download-popover';
import { trackEvents } from '@/lib/track-events';

// Lazy-load the Three.js particle field so three/fiber/drei leave the
// initial route bundle. It only mounts after the intro, so the dynamic
// chunk loads off the critical path.
const ParticleField = lazy(() =>
  import('@/components/particle-field').then((module) => ({
    default: module.ParticleField,
  }))
);

export const Route = createFileRoute('/legacy')({
  component: HomePage,
  // Prefetch the default resume profile so the projects/resume/skills content
  // is server-rendered (SEO + no client-side pop-in on first paint).
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.resume.getProfile, { slug: 'default' })
    );
  },
});

function HomePage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)'
  );
  const { resolvedTheme } = useTheme();
  const resumeData = useResumeFilter({ from: '/legacy' });
  // Observe all sections for intersection tracking
  useSectionObserverById('home');
  useSectionObserverById('projects');
  useSectionObserverById('resume');
  useSectionObserverById('contact');

  // Re-align hash-anchor scrolling while fonts/layout are still settling
  useHashScroll();

  // Track project interactions
  const handleProjectVisit = useCallback(
    (projectName: string, projectUrl: string | undefined) => {
      if (projectUrl) {
        trackEvents.projectVisited(projectName, projectUrl, 'homepage');
        window.open(projectUrl, '_blank');
      }
    },
    []
  );

  // Track contact button clicks
  const handleContactClick = (
    contactType: 'email' | 'github' | 'twitter',
    url: string
  ) => {
    trackEvents.contactInitiated(contactType, 'homepage', url);
  };

  // Loader state
  const [showLoader, setShowLoader] = useState(true);
  const [showParticleField, setShowParticleField] = useState(false);

  // Reduced motion: skip the intro gate and the animated particle field
  useEffect(() => {
    if (prefersReducedMotion) {
      setShowLoader(false);
    }
  }, [prefersReducedMotion]);

  // Play the intro once per session; return visits skip straight to content
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('landing-intro-seen')) {
      setShowLoader(false);
      setShowParticleField(true);
    }
  }, []);

  const handleLoaderComplete = useCallback(() => {
    return setTimeout(() => {
      setShowLoader(false);
      return setTimeout(() => {
        setShowParticleField(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('landing-intro-seen', '1');
        }
      }, 1200);
    }, 200);
  }, []);

  // Cheap device tiering so low-end machines don't get the full ~20k particles
  const deviceTier = useMemo<'low' | 'high'>(() => {
    if (typeof navigator === 'undefined') return 'high';
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    if (cores <= 4 || (typeof memory === 'number' && memory <= 4)) {
      return 'low';
    }
    return 'high';
  }, []);

  const gpuParticleCounts = useMemo(() => {
    if (isMobile) {
      return { field1: 500, field2: 400, field3: 2000, isLoading: false };
    }
    if (deviceTier === 'low') {
      return { field1: 1500, field2: 1500, field3: 6000, isLoading: false };
    }
    return { field1: 3000, field2: 3000, field3: 14000, isLoading: false };
  }, [isMobile, deviceTier]);

  // Dynamic colors based on theme
  const primaryColor = useMemo(() => {
    return resolvedTheme === 'dark' ? '#f43f5e' : '#f43f5e';
  }, [resolvedTheme]);

  const secondaryColor = useMemo(() => {
    return resolvedTheme === 'dark' ? '#06b6d4' : '#06b6d4';
  }, [resolvedTheme]);

  // Shared configuration - only area/boundary definitions
  const [sharedConfig, setSharedConfig] = useState({
    // Mouse interaction area
    mouseRadius: defaultParticleConfig.mouseRadius,
    // Boundary area
    boundaryPadding: defaultParticleConfig.boundaryPadding,
    // Obstacle area - start with disabled
    obstacleEnabled: true,
    obstacleX: defaultParticleConfig.obstacleX,
    obstacleY: defaultParticleConfig.obstacleY,
    obstacleRadius: defaultParticleConfig.obstacleRadius,
  });

  const mobileBoundaryRoundness = 0;
  const mobileObstacleRadius = 256;
  const desktopBoundaryRoundness = 0;
  const desktopObstacleRadius = 320;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { assetsReady, markParticlesReady } = usePageAssetsReady();

  useEffect(() => {
    setSharedConfig((prev) => ({
      ...prev,
      boundaryRoundness: isMobile
        ? mobileBoundaryRoundness
        : desktopBoundaryRoundness,
      obstacleRadius: isMobile ? mobileObstacleRadius : desktopObstacleRadius,
    }));
  }, [isMobile]);

  // Update particle colors when theme changes
  useEffect(() => {
    setParticleConfig1((prev) =>
      prev.color === primaryColor ? prev : { ...prev, color: primaryColor }
    );
    setParticleConfig3((prev) =>
      prev.color === secondaryColor ? prev : { ...prev, color: secondaryColor }
    );
  }, [primaryColor, secondaryColor]);

  // Update particle counts when GPU detection completes
  const { isLoading: gpuLoading, field1, field2, field3 } = gpuParticleCounts;
  useEffect(() => {
    if (!gpuLoading) {
      setParticleConfig1((prev) =>
        prev.count === field1 ? prev : { ...prev, count: field1 }
      );
      setParticleConfig2((prev) =>
        prev.count === field2 ? prev : { ...prev, count: field2 }
      );
      setParticleConfig3((prev) =>
        prev.count === field3 ? prev : { ...prev, count: field3 }
      );
    }
  }, [gpuLoading, field1, field2, field3]);

  // Use filtered project data from resume hook
  const { projects } = resumeData;

  // Use filtered data from resume hook
  const { skills, summary } = resumeData;

  const resumeExportData = useMemo(
    () =>
      buildResumeDataFromSource({
        profile: resumeData.profile,
        summary,
        projects,
        skills,
      }),
    [projects, resumeData.profile, skills, summary]
  );

  // Transform projects for experience section
  const experiences = projects.map((project) => ({
    company: project.company,
    role: project.role,
    location: 'Remote',
    timeline: project.timeline,
    description: project.description,
    achievements: project.achievements
      .slice(0, 5)
      .map((achievement) => achievement.description),
    technologies: [
      ...project.technologies.frontend.slice(0, 3),
      ...project.technologies.backend.slice(0, 3),
      ...project.technologies.infrastructure.slice(0, 2),
    ],
  }));

  // Independent configs for each particle field (including how they respond to areas)
  const [particleConfig1, setParticleConfig1] = useState({
    ...defaultParticleConfig,
    color: secondaryColor,
    count: gpuParticleCounts.field1,
    size: !isMobile ? 1.5 : 1,
    speed: 0.025,
    opacity: 0.6,
    spreadX: 0.1,
    spreadY: 0.1,
    clusterCount: 3,
    clusterRadius: 0.15,
    initialVelocity: 0.3,
    damping: 0.975,
    turbulence: 0.358,
    turbulenceScale: 0.4,
    convectionStrength: 0.08,
    convectionSpeedX: 0.2,
    convectionSpeedY: 0.25,
    convectionScaleX: 0.013,
    convectionScaleY: 0.013,
    buoyancy: 0.05,
    temperatureDiffusion: 0.008,
    mouseRadius: 45,
    mouseForce: 0.4,
    mouseHeat: 0.25,
    boundaryDamping: 1,
    boundaryPadding: 0,
    boundaryRoundness: isMobile
      ? mobileBoundaryRoundness
      : desktopBoundaryRoundness,
    coolingRate: 1,
    heatingRate: 1.1,
    windX: 0,
    windY: 0,
    windVariation: 0.01,
    gravityX: 0,
    gravityY: 0.0001,
    gravityRange: 375,
    vortexStrength: 0.01,
    vortexRadius: 320,
    obstacleEnabled: true,
    obstacleX: 0,
    obstacleY: 0,
    obstacleForce: 1.6,
    obstacleHeat: 0,
    innerBoundary: 180,
    outerBoundary: 1500,
    slopeSharpness: 7,
    scrollInertiaStrength: 2.7,
    scrollInertiaDamping: 0.975,
    scrollInertiaMax: 0.3,
  });
  const [particleConfig2, setParticleConfig2] = useState({
    ...defaultParticleConfig,
    color: '#ff0059', // Magenta for field 2 - lerps between H 137 & H 340
    count: gpuParticleCounts.field2,
    size: !isMobile ? 1.5 : 1,
    speed: 0.02,
    opacity: 0.6,
    spreadX: 0.1,
    spreadY: 0.1,
    clusterCount: 3,
    clusterRadius: 0.15,
    initialVelocity: 0.3,
    damping: 0.975,
    turbulence: 0.122,
    turbulenceScale: 0.4,
    convectionStrength: 0.05,
    convectionSpeedX: 0.2,
    convectionSpeedY: 0.25,
    convectionScaleX: 0.013,
    convectionScaleY: 0.013,
    buoyancy: 0.05,
    temperatureDiffusion: 0.008,
    mouseRadius: 45,
    mouseForce: 0.8,
    mouseHeat: 0.25,
    boundaryDamping: 1,
    boundaryPadding: 5,
    boundaryRoundness: isMobile
      ? mobileBoundaryRoundness
      : desktopBoundaryRoundness,
    coolingRate: 1,
    heatingRate: 1.1,
    windX: 0,
    windY: 0,
    windVariation: 0.01,
    gravityX: 0,
    gravityY: 0.0001,
    gravityRange: 375,
    vortexStrength: 0.01,
    vortexRadius: 320,
    obstacleEnabled: true,
    obstacleX: 0,
    obstacleY: 0,
    obstacleForce: 1.2,
    obstacleHeat: 0,
    innerBoundary: 180,
    outerBoundary: 1500,
    slopeSharpness: 7,
    scrollInertiaStrength: 2.6,
    scrollInertiaDamping: 0.97,
    scrollInertiaMax: 0.2,
  });
  const [particleConfig3, setParticleConfig3] = useState({
    ...defaultParticleConfig,
    color: secondaryColor, // Secondary color particles
    count: gpuParticleCounts.field3,
    size: !isMobile ? 1.5 : 1,
    speed: 0.005,
    opacity: 0.4,
    spreadX: 0.1,
    spreadY: 0.1,
    clusterCount: 3,
    clusterRadius: 0.15,
    initialVelocity: 0.3,
    damping: 0.975,
    turbulence: 0.23,
    turbulenceScale: 2,
    convectionStrength: 0.12,
    convectionSpeedX: 0.2,
    convectionSpeedY: 0.25,
    convectionScaleX: 0.013,
    convectionScaleY: 0.013,
    buoyancy: 0.05,
    temperatureDiffusion: 0.008,
    mouseRadius: 45,
    mouseForce: 0.5,
    mouseHeat: 0.25,
    boundaryDamping: 1,
    boundaryPadding: 5,
    boundaryRoundness: isMobile
      ? mobileBoundaryRoundness
      : desktopBoundaryRoundness,
    coolingRate: 1,
    heatingRate: 1.1,
    windX: 0,
    windY: 0,
    windVariation: 0.01,
    gravityX: 0,
    gravityY: 0.0001,
    gravityRange: 375,
    vortexStrength: 0.01,
    vortexRadius: 320,
    obstacleEnabled: true,
    obstacleX: 0,
    obstacleY: 0,
    obstacleForce: 1.6,
    obstacleHeat: 0,
    innerBoundary: 180,
    outerBoundary: 1500,
    slopeSharpness: 7,
    scrollInertiaStrength: 3,
    scrollInertiaDamping: 0.99,
    scrollInertiaMax: 0.2,
  });

  const handleCopyPositions = (positions: Float32Array) => {
    // Convert positions to a more readable format
    const positionsArray = Array.from(positions);
    const formattedPositions = [];
    for (let i = 0; i < positionsArray.length; i += 3) {
      formattedPositions.push([
        Math.round(positionsArray[i] * 100) / 100,
        Math.round(positionsArray[i + 1] * 100) / 100,
        Math.round(positionsArray[i + 2] * 100) / 100,
      ]);
    }

    const positionData = {
      count: formattedPositions.length,
      positions: formattedPositions,
      timestamp: new Date().toISOString(),
      containerSize: { width: 800, height: 600 }, // Default size, will be updated by component
    };

    // Copy positions to clipboard instead of downloading
    navigator.clipboard.writeText(JSON.stringify(positionData, null, 2));
  };

  // No-op: hero visibility is controlled by assetsReady

  // Merge configs for each field (shared areas override individual settings)
  const config1 = useMemo(
    () => ({
      ...particleConfig1,
      mouseRadius: sharedConfig.mouseRadius,
      boundaryPadding: sharedConfig.boundaryPadding,
      obstacleEnabled: sharedConfig.obstacleEnabled,
      obstacleX: sharedConfig.obstacleX,
      obstacleY: sharedConfig.obstacleY,
      obstacleRadius: sharedConfig.obstacleRadius,
    }),
    [particleConfig1, sharedConfig]
  );
  const config2 = useMemo(
    () => ({
      ...particleConfig2,
      mouseRadius: sharedConfig.mouseRadius,
      boundaryPadding: sharedConfig.boundaryPadding,
      obstacleEnabled: sharedConfig.obstacleEnabled,
      obstacleX: sharedConfig.obstacleX,
      obstacleY: sharedConfig.obstacleY,
      obstacleRadius: sharedConfig.obstacleRadius,
    }),
    [particleConfig2, sharedConfig]
  );
  const config3 = useMemo(
    () => ({
      ...particleConfig3,
      mouseRadius: sharedConfig.mouseRadius,
      boundaryPadding: sharedConfig.boundaryPadding,
      obstacleEnabled: sharedConfig.obstacleEnabled,
      obstacleX: sharedConfig.obstacleX,
      obstacleY: sharedConfig.obstacleY,
      obstacleRadius: sharedConfig.obstacleRadius,
    }),
    [particleConfig3, sharedConfig]
  );
  const mergedConfigs = useMemo(
    () => [config1, config2, config3],
    [config1, config2, config3]
  );

  // Use keys that change when we need to reinitialize
  const particleKey1 = `particle1-${particleConfig1.count}-${particleConfig1.clusterCount}`;
  const particleKey2 = `particle2-${particleConfig2.count}-${particleConfig2.clusterCount}`;
  const particleKey3 = `particle3-${particleConfig3.count}-${particleConfig3.clusterCount}`;

  return (
    <div
      data-section="home"
      className={`relative mt-16 min-h-[80vh] overflow-hidden bg-transparent transition-colors duration-200`}
    >
      <div className="relative flex min-h-[90vh] flex-grow flex-col items-center justify-center">
        <div className="relative flex h-full w-full flex-grow flex-col items-center justify-center overflow-hidden p-0">
          {/* Single particle field with combined configurations - direct load for testing */}
          {showParticleField && !prefersReducedMotion && (
            <Suspense fallback={null}>
              <ParticleField
                key={`combined-${particleKey1}-${particleKey2}-${particleKey3}`}
                configs={mergedConfigs}
                onCopyPositions={
                  import.meta.env.DEV ? handleCopyPositions : undefined
                }
                onReady={markParticlesReady}
              />
            </Suspense>
          )}

          {/* Hero content - hidden while loader is active */}
          <div
            className={`pointer-events-none relative z-10 flex flex-col items-center justify-center gap-4 px-4 transition-opacity duration-300`}
          >
            {/* Loader - renders in exact hero position */}
            <HeroTitle onComplete={handleLoaderComplete} />

            <p
              data-visible={!showLoader}
              className="text-muted-foreground max-w-md text-center text-[14px] font-light tracking-wide opacity-0 transition-all delay-600 duration-1500 data-[visible=false]:translate-y-[2px] data-[visible=false]:scale-102 data-[visible=true]:opacity-100 sm:text-lg"
            >
              ui/ux | fullstack | product
            </p>

            <div
              data-visible={!showLoader}
              className="flex gap-2 font-light opacity-0 transition-all delay-1000 duration-1500 data-[visible=false]:translate-y-[2px] data-[visible=false]:scale-102 data-[visible=true]:opacity-100"
            >
              <a href="#projects">
                <Button
                  className="border-border bg-primary/10 text-primary hover:bg-primary/20 transition-smooth pointer-events-auto rounded-lg border px-4 py-2 text-[10px] font-light backdrop-blur-sm sm:px-5 sm:py-3 sm:text-xs"
                  size="sm"
                >
                  projects
                </Button>
              </a>
              <a href="#resume">
                <Button
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-smooth pointer-events-auto rounded-lg border bg-transparent px-4 py-2 text-[10px] font-light sm:px-5 sm:py-3 sm:text-sm"
                  size="sm"
                >
                  resume
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
      <Separator className="w-full" />

      {/* Projects Section */}
      <AnimatedSection animationType="section">
        <div id="projects" className="bg-background py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <AnimatedSection animationType="header" delay={200}>
                    <h2 className="text-foreground text-4xl font-light tracking-wide">
                      projects
                    </h2>
                  </AnimatedSection>
                  <AnimatedSection animationType="header" delay={400}>
                    <p className="text-muted-foreground font-light">
                      recent work in full-stack development and product design
                    </p>
                  </AnimatedSection>
                </div>
              </div>
            </div>

            <div className="space-y-24">
              {projects.map((project, index) => (
                <AnimatedSection
                  key={project.id}
                  animationType="card"
                  delay={600 + index * 200}
                >
                  <ProjectCard
                    project={project}
                    index={index}
                    onVisit={handleProjectVisit}
                  />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Resume Section */}
      <AnimatedSection animationType="section">
        <div id="resume" className="bg-background py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl space-y-16">
              <div className="space-y-6 text-center">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-foreground text-4xl font-light tracking-wide sm:text-5xl">
                      jacob stein
                    </h2>
                    <AnimatedSection animationType="header" delay={200}>
                      <p className="text-muted-foreground mt-2 text-xl font-light">
                        full-stack developer & ui/ux designer
                      </p>
                    </AnimatedSection>
                    <div className="flex-shrink-0">
                      <PDFDownloadPopover
                        resumeData={resumeExportData}
                        className="mt-2"
                        source="homepage"
                      />
                    </div>
                  </div>
                </div>

                <AnimatedSection animationType="section" delay={400}>
                  <p className="text-muted-foreground mx-auto max-w-2xl leading-relaxed font-light">
                    {summary}
                  </p>
                </AnimatedSection>
              </div>

              <AnimatedSection animationType="section" delay={600}>
                <ResumeExperience experiences={experiences} />
              </AnimatedSection>
              <AnimatedSection animationType="section" delay={800}>
                <ResumeSkills skills={skills} />
              </AnimatedSection>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Contact Section */}
      <AnimatedSection animationType="section">
        <div id="contact" className="bg-background py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <AnimatedSection animationType="header">
                <h2 className="text-foreground mb-8 text-4xl font-light tracking-wide">
                  let's connect
                </h2>
              </AnimatedSection>

              <AnimatedSection animationType="section" delay={200}>
                <p className="text-muted-foreground mb-12 text-lg">
                  interested in collaborating or have a project in mind? i'd
                  love to hear from you.
                </p>
              </AnimatedSection>

              <div className="flex justify-center">
                <AnimatedSection animationType="card" delay={400}>
                  <div className="border-border bg-background/50 flex items-center gap-6 rounded-lg border px-8 py-6 backdrop-blur-sm">
                    {/* Email Section */}
                    <a
                      href="mailto:jacob@jacobstein.me"
                      className="group flex items-center gap-3 transition-colors hover:opacity-80"
                      onClick={() =>
                        handleContactClick(
                          'email',
                          'mailto:jacob@jacobstein.me'
                        )
                      }
                    >
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                        <svg
                          className="text-primary h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-foreground text-sm font-light">
                          email
                        </p>
                        <p className="text-muted-foreground group-hover:text-foreground text-sm font-light transition-colors">
                          jacob@jacobstein.me
                        </p>
                      </div>
                    </a>

                    {/* Divider */}
                    <div className="bg-border h-12 w-px"></div>

                    {/* Social Links */}
                    <div className="flex gap-3">
                      <a
                        href="https://github.com/jjjjjjjjjjjjjjjjacob"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                        aria-label="GitHub"
                        onClick={() =>
                          handleContactClick(
                            'github',
                            'https://github.com/jjjjjjjjjjjjjjjjacob'
                          )
                        }
                      >
                        <Github className="h-5 w-5" />
                      </a>
                      <a
                        href="https://x.com/jaequbh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                        aria-label="X (Twitter)"
                        onClick={() =>
                          handleContactClick('twitter', 'https://x.com/jaequbh')
                        }
                      >
                        <XIcon className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Separator className="w-full" />
      <SiteFooter />
    </div>
  );
}
