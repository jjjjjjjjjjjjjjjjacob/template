import { createFileRoute } from '@tanstack/react-router';
import { ParticleField } from '@/components/particle-field';
import {
  ParticleControls,
  defaultParticleConfig,
} from '@/components/particle-controls';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/components/theme-provider';
import { ProjectSlideshow } from '@/components/project-slideshow';
import { ResumeFilterControls } from '@/components/resume-filter-controls';
import { AnimatedSection } from '@/components/animated-section';
import { useResumeFilter } from '@/hooks/use-resume-filter';
import { ExternalLink, Calendar, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [showControls1, setShowControls1] = useState(false);
  const [showControls2, setShowControls2] = useState(false);
  const [showControls3, setShowControls3] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const { resolvedTheme } = useTheme();
  const resumeData = useResumeFilter();

  // Dynamic colors based on theme
  const primaryColor = useMemo(() => {
    return resolvedTheme === 'dark' ? '#f0f0f0' : '#080808';
  }, [resolvedTheme]);

  const secondaryColor = useMemo(() => {
    return resolvedTheme === 'dark' ? '#808080' : '#080808';
  }, [resolvedTheme]);

  // Shared configuration - only area/boundary definitions
  const [sharedConfig, setSharedConfig] = useState({
    // Mouse interaction area
    mouseRadius: defaultParticleConfig.mouseRadius,
    // Boundary area
    boundaryPadding: defaultParticleConfig.boundaryPadding,
    // Obstacle area - start with disabled
    obstacleEnabled: false,
    obstacleX: defaultParticleConfig.obstacleX,
    obstacleY: defaultParticleConfig.obstacleY,
    obstacleRadius: defaultParticleConfig.obstacleRadius,
  });

  const mobileBoundaryRoundness = 0;
  const mobileObstacleRadius = 256;
  const desktopBoundaryRoundness = 0;
  const desktopObstacleRadius = 280;

  useEffect(() => {
    if (isMobile) {
      setSharedConfig((prev) => ({
        ...prev,
        boundaryRoundness: isMobile
          ? mobileBoundaryRoundness
          : desktopBoundaryRoundness,
        obstacleRadius: isMobile ? mobileObstacleRadius : desktopObstacleRadius,
      }));
    }
  }, [isMobile]);

  // Enable obstacle after 200ms delay
  useEffect(() => {
    // Immediately scroll to top and prevent any automatic scrolling
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Prevent any focus-related scrolling for the first few seconds
    const preventScroll = (e: Event) => {
      e.preventDefault();
      window.scrollTo(0, 0);
    };
    
    window.addEventListener('scroll', preventScroll, { passive: false });
    
    const scrollTimer = setTimeout(() => {
      window.removeEventListener('scroll', preventScroll);
    }, 1000);

    const timer = setTimeout(() => {
      setSharedConfig((prev) => ({
        ...prev,
        obstacleEnabled: true,
        obstacleRadius: isMobile ? mobileObstacleRadius : desktopObstacleRadius,
      }));
    }, 200);

    return () => {
      clearTimeout(timer);
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', preventScroll);
    };
  }, [isMobile]);

  // Update particle colors when theme changes
  useEffect(() => {
    setParticleConfig1((prev) => ({
      ...prev,
      color: primaryColor,
    }));
    setParticleConfig3((prev) => ({
      ...prev,
      color: secondaryColor,
    }));
  }, [primaryColor, secondaryColor]);

  // Use filtered project data from resume hook
  const { projects } = resumeData;

  // ProjectCard component
  const ProjectCard = ({
    project,
    index,
  }: {
    project: (typeof projects)[0];
    index: number;
  }) => {
    const [projectCardIsHovered, setProjectCardIsHovered] = useState(false);

    const isEven = index % 2 === 0;
    const slideDirection = isEven ? 'left-to-right' : 'right-to-left';

    return (
      <div
        className="group"
        onMouseEnter={() => setProjectCardIsHovered(true)}
        onMouseLeave={() => setProjectCardIsHovered(false)}
      >
        {/* Mobile Layout - Vertical */}
        <div className="space-y-8 md:hidden">
          <ProjectSlideshow
            previews={project.previews}
            title={project.title}
            isHovered={false}
            className="relative h-80 w-full"
            slideDirection={slideDirection}
            isMobile={true}
          />

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
                onClick={() => window.open(project.url, '_blank')}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
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
                  {project.achievements
                    .slice(0, 6)
                    .map((achievement, achIndex) => (
                      <li
                        key={achIndex}
                        className="text-muted-foreground flex items-start gap-2 text-sm"
                      >
                        <span className="bg-muted-foreground mt-2 h-1 w-1 flex-shrink-0 rounded-full" />
                        {achievement.description}
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <h4 className="text-foreground mb-2 text-sm font-medium">
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
                        className="text-muted-foreground text-xs"
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
          <div
            className={`flex-1 overflow-hidden ${isEven ? 'md:order-2' : 'md:order-1'}`}
          >
            <ProjectSlideshow
              previews={project.previews}
              title={project.title}
              isHovered={projectCardIsHovered}
              className="relative h-full w-full"
              slideDirection={slideDirection}
              isMobile={false}
            />
          </div>

          {/* Info Section */}
          <div
            className={`flex-1 space-y-6 ${isEven ? 'md:order-1' : 'md:order-2'}`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-foreground text-3xl font-medium">
                  {project.title}
                </h3>
                <p className="text-muted-foreground">
                  {project.timeline} • {project.role}
                </p>
              </div>
              <button
                onClick={() => window.open(project.url, '_blank')}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                visit
              </button>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {project.description}
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-foreground mb-3 text-sm font-medium">
                  key contributions
                </h4>
                <ul className="space-y-2">
                  {project.achievements
                    .slice(0, 6)
                    .map((achievement, achIndex) => (
                      <li
                        key={achIndex}
                        className="text-muted-foreground flex items-start gap-3 text-sm"
                      >
                        <span className="bg-muted-foreground mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                        {achievement.description}
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <h4 className="text-foreground mb-3 text-sm font-medium">
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
                        className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
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
  };

  // Use filtered data from resume hook
  const { skills, topAchievements, summary } = resumeData;

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

  const ResumeExperience = () => (
    <section>
      <AnimatedSection animationType="header">
        <h2 className="text-foreground mb-8 text-3xl font-bold">experience</h2>
      </AnimatedSection>
      <div className="space-y-12">
        {experiences.map((experience, index) => (
          <AnimatedSection key={index} animationType="card" delay={index * 150}>
            <div className="border-primary/20 relative border-l-2 pl-8">
              <div className="bg-primary absolute top-0 -left-2 h-4 w-4 rounded-full"></div>

              <div className="mb-6 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-foreground text-xl font-semibold">
                      {experience.role}
                    </h3>
                    <p className="text-primary text-lg font-medium">
                      {experience.company}
                    </p>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {experience.timeline}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {experience.location}
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  {experience.description}
                </p>

                <div>
                  <h4 className="text-foreground mb-2 font-medium">
                    key achievements
                  </h4>
                  <ul className="space-y-1">
                    {experience.achievements.map(
                      (achievement, achievementIndex) => (
                        <li
                          key={achievementIndex}
                          className="text-muted-foreground flex items-start gap-2 text-sm"
                        >
                          <span className="bg-primary mt-2 h-1 w-1 flex-shrink-0 rounded-full" />
                          {achievement}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="text-foreground mb-2 font-medium">
                    technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {experience.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );

  const ResumeSkills = () => (
    <section>
      <AnimatedSection animationType="header">
        <h2 className="text-foreground mb-8 text-3xl font-bold">skills</h2>
      </AnimatedSection>
      <div className="grid gap-8 md:grid-cols-2">
        {skills.map((skillCategory, index) => (
          <AnimatedSection
            key={skillCategory.category}
            animationType="card"
            delay={index % 2 === 0 ? 200 : 400}
          >
            <div className="space-y-3">
              <h3 className="text-foreground font-semibold">
                {skillCategory.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillCategory.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );

  // Independent configs for each particle field (including how they respond to areas)
  const [particleConfig1, setParticleConfig1] = useState({
    ...defaultParticleConfig,
    color: primaryColor, // Primary color for field 1
    count: 6000,
    size: 1.5,
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
    scrollInertiaStrength: 2.7,
    scrollInertiaDamping: 0.975,
    scrollInertiaMax: 0.3,
  });
  const [particleConfig2, setParticleConfig2] = useState({
    ...defaultParticleConfig,
    color: '#ff0059', // Magenta for field 2 - lerps between H 137 & H 340
    count: 3000,
    size: 1.5,
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
    count: 27000,
    size: 1.5,
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

  const [initKey1, setInitKey1] = useState(0);
  const [initKey2, setInitKey2] = useState(0);
  const [initKey3, setInitKey3] = useState(0);
  const [copyTrigger, setCopyTrigger] = useState(0);

  const handleReset1 = () => {
    setParticleConfig1({
      ...defaultParticleConfig,
      color: primaryColor,
      count: 6000,
      size: 1.5,
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
      obstacleRadius: isMobile ? mobileObstacleRadius : desktopObstacleRadius,
      obstacleForce: 1.6,
      obstacleHeat: 0,
      innerBoundary: 180,
      outerBoundary: 1500,
      slopeSharpness: 7,
      scrollInertiaStrength: 2.7,
      scrollInertiaDamping: 0.975,
      scrollInertiaMax: 0.3,
    });
    setInitKey1((prev) => prev + 1);
  };

  const handleReset2 = () => {
    setParticleConfig2({
      ...defaultParticleConfig,
      color: '#ff0059',
      count: 3000,
      size: 1.5,
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
      obstacleRadius: isMobile ? mobileObstacleRadius : desktopObstacleRadius,
      obstacleForce: 1.2,
      obstacleHeat: 0,
      innerBoundary: 180,
      outerBoundary: 1500,
      slopeSharpness: 7,
      scrollInertiaStrength: 2.6,
      scrollInertiaDamping: 0.97,
      scrollInertiaMax: 0.2,
    });
    setInitKey2((prev) => prev + 1);
  };

  const handleReset3 = () => {
    setParticleConfig3({
      ...defaultParticleConfig,
      color: secondaryColor,
      count: 27000,
      size: 1.5,
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
      obstacleRadius: isMobile ? mobileObstacleRadius : desktopObstacleRadius,
      obstacleForce: 1.6,
      obstacleHeat: 0,
      innerBoundary: 180,
      outerBoundary: 1500,
      slopeSharpness: 7,
      scrollInertiaStrength: 3,
      scrollInertiaDamping: 0.99,
      scrollInertiaMax: 0.2,
    });
    setInitKey3((prev) => prev + 1);
  };

  const handleInitialize1 = () => {
    setInitKey1((prev) => prev + 1);
    // Temporarily disable obstacle and re-enable after delay
    setSharedConfig((prev) => ({ ...prev, obstacleEnabled: false }));
    setTimeout(() => {
      setSharedConfig((prev) => ({ ...prev, obstacleEnabled: true }));
    }, 200);
  };

  const handleInitialize2 = () => {
    setInitKey2((prev) => prev + 1);
    // Temporarily disable obstacle and re-enable after delay
    setSharedConfig((prev) => ({ ...prev, obstacleEnabled: false }));
    setTimeout(() => {
      setSharedConfig((prev) => ({ ...prev, obstacleEnabled: true }));
    }, 200);
  };

  const handleInitialize3 = () => {
    setInitKey3((prev) => prev + 1);
    // Temporarily disable obstacle and re-enable after delay
    setSharedConfig((prev) => ({ ...prev, obstacleEnabled: false }));
    setTimeout(() => {
      setSharedConfig((prev) => ({ ...prev, obstacleEnabled: true }));
    }, 200);
  };

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

  // Merge configs for each field (shared areas override individual settings)
  const config1 = {
    ...particleConfig1,
    mouseRadius: sharedConfig.mouseRadius,
    boundaryPadding: sharedConfig.boundaryPadding,
    obstacleEnabled: sharedConfig.obstacleEnabled,
    obstacleX: sharedConfig.obstacleX,
    obstacleY: sharedConfig.obstacleY,
    obstacleRadius: sharedConfig.obstacleRadius,
  };
  const config2 = {
    ...particleConfig2,
    mouseRadius: sharedConfig.mouseRadius,
    boundaryPadding: sharedConfig.boundaryPadding,
    obstacleEnabled: sharedConfig.obstacleEnabled,
    obstacleX: sharedConfig.obstacleX,
    obstacleY: sharedConfig.obstacleY,
    obstacleRadius: sharedConfig.obstacleRadius,
  };
  const config3 = {
    ...particleConfig3,
    mouseRadius: sharedConfig.mouseRadius,
    boundaryPadding: sharedConfig.boundaryPadding,
    obstacleEnabled: sharedConfig.obstacleEnabled,
    obstacleX: sharedConfig.obstacleX,
    obstacleY: sharedConfig.obstacleY,
    obstacleRadius: sharedConfig.obstacleRadius,
  };

  // Use keys that change when we need to reinitialize
  const particleKey1 = `particle1-${initKey1}-${particleConfig1.count}-${particleConfig1.clusterCount}`;
  const particleKey2 = `particle2-${initKey2}-${particleConfig2.count}-${particleConfig2.clusterCount}`;
  const particleKey3 = `particle3-${initKey3}-${particleConfig3.count}-${particleConfig3.clusterCount}`;

  return (
    <div
      data-section="home"
      className={`relative mt-16 min-h-[80vh] overflow-hidden bg-transparent transition-colors duration-300`}
    >
      <div className="relative flex min-h-[90vh] flex-grow flex-col items-center justify-center">
        {/* Control Buttons */}
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-4 md:top-20 md:right-4 md:bottom-auto md:left-auto md:translate-x-0">
          {/* Cyan Controls */}
          {isMobile ? (
            <Dialog open={showControls1} onOpenChange={setShowControls1}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-cyan-400/50 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                >
                  cyan controls
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm border-white/20 bg-black/95">
                <ParticleControls
                  config={config1}
                  onChange={(newConfig) => {
                    const sharedUpdates: any = {};
                    if (newConfig.mouseRadius !== config1.mouseRadius)
                      sharedUpdates.mouseRadius = newConfig.mouseRadius;
                    if (newConfig.boundaryPadding !== config1.boundaryPadding)
                      sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                    if (newConfig.obstacleEnabled !== config1.obstacleEnabled)
                      sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                    if (newConfig.obstacleX !== config1.obstacleX)
                      sharedUpdates.obstacleX = newConfig.obstacleX;
                    if (newConfig.obstacleY !== config1.obstacleY)
                      sharedUpdates.obstacleY = newConfig.obstacleY;
                    if (newConfig.obstacleRadius !== config1.obstacleRadius)
                      sharedUpdates.obstacleRadius = newConfig.obstacleRadius;

                    if (Object.keys(sharedUpdates).length > 0) {
                      setSharedConfig((prev) => ({
                        ...prev,
                        ...sharedUpdates,
                      }));
                    }

                    setParticleConfig1(newConfig);
                  }}
                  onReset={handleReset1}
                  onInitialize={handleInitialize1}
                  onCopyPositions={() => {
                    setCopyTrigger((prev) => prev + 1);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = 'copied!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 1000);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Popover open={showControls1} onOpenChange={setShowControls1}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-cyan-400/50 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                >
                  cyan controls
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="border-border bg-popover m-0 w-full p-0"
                align="end"
              >
                <ParticleControls
                  config={config1}
                  onChange={(newConfig) => {
                    const sharedUpdates: any = {};
                    if (newConfig.mouseRadius !== config1.mouseRadius)
                      sharedUpdates.mouseRadius = newConfig.mouseRadius;
                    if (newConfig.boundaryPadding !== config1.boundaryPadding)
                      sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                    if (newConfig.obstacleEnabled !== config1.obstacleEnabled)
                      sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                    if (newConfig.obstacleX !== config1.obstacleX)
                      sharedUpdates.obstacleX = newConfig.obstacleX;
                    if (newConfig.obstacleY !== config1.obstacleY)
                      sharedUpdates.obstacleY = newConfig.obstacleY;
                    if (newConfig.obstacleRadius !== config1.obstacleRadius)
                      sharedUpdates.obstacleRadius = newConfig.obstacleRadius;

                    if (Object.keys(sharedUpdates).length > 0) {
                      setSharedConfig((prev) => ({
                        ...prev,
                        ...sharedUpdates,
                      }));
                    }

                    setParticleConfig1(newConfig);
                  }}
                  onReset={handleReset1}
                  onInitialize={handleInitialize1}
                  onCopyPositions={() => {
                    setCopyTrigger((prev) => prev + 1);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = 'copied!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 1000);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Magenta Controls */}
          {isMobile ? (
            <Dialog open={showControls2} onOpenChange={setShowControls2}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-pink-400/50 bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
                >
                  magenta controls
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm border-white/20 bg-black/95">
                <ParticleControls
                  config={config2}
                  onChange={(newConfig) => {
                    const sharedUpdates: any = {};
                    if (newConfig.mouseRadius !== config2.mouseRadius)
                      sharedUpdates.mouseRadius = newConfig.mouseRadius;
                    if (newConfig.boundaryPadding !== config2.boundaryPadding)
                      sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                    if (newConfig.obstacleEnabled !== config2.obstacleEnabled)
                      sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                    if (newConfig.obstacleX !== config2.obstacleX)
                      sharedUpdates.obstacleX = newConfig.obstacleX;
                    if (newConfig.obstacleY !== config2.obstacleY)
                      sharedUpdates.obstacleY = newConfig.obstacleY;
                    if (newConfig.obstacleRadius !== config2.obstacleRadius)
                      sharedUpdates.obstacleRadius = newConfig.obstacleRadius;

                    if (Object.keys(sharedUpdates).length > 0) {
                      setSharedConfig((prev) => ({
                        ...prev,
                        ...sharedUpdates,
                      }));
                    }

                    setParticleConfig2(newConfig);
                  }}
                  onReset={handleReset2}
                  onInitialize={handleInitialize2}
                  onCopyPositions={() => {
                    setCopyTrigger((prev) => prev + 1);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = 'copied!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 1000);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Popover open={showControls2} onOpenChange={setShowControls2}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-pink-400/50 bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
                >
                  magenta controls
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="border-border bg-popover m-0 w-full p-0"
                align="end"
              >
                <ParticleControls
                  config={config2}
                  onChange={(newConfig) => {
                    const sharedUpdates: any = {};
                    if (newConfig.mouseRadius !== config2.mouseRadius)
                      sharedUpdates.mouseRadius = newConfig.mouseRadius;
                    if (newConfig.boundaryPadding !== config2.boundaryPadding)
                      sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                    if (newConfig.obstacleEnabled !== config2.obstacleEnabled)
                      sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                    if (newConfig.obstacleX !== config2.obstacleX)
                      sharedUpdates.obstacleX = newConfig.obstacleX;
                    if (newConfig.obstacleY !== config2.obstacleY)
                      sharedUpdates.obstacleY = newConfig.obstacleY;
                    if (newConfig.obstacleRadius !== config2.obstacleRadius)
                      sharedUpdates.obstacleRadius = newConfig.obstacleRadius;

                    if (Object.keys(sharedUpdates).length > 0) {
                      setSharedConfig((prev) => ({
                        ...prev,
                        ...sharedUpdates,
                      }));
                    }

                    setParticleConfig2(newConfig);
                  }}
                  onReset={handleReset2}
                  onInitialize={handleInitialize2}
                  onCopyPositions={() => {
                    setCopyTrigger((prev) => prev + 1);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = 'copied!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 1000);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* White Controls */}
          {isMobile ? (
            <Dialog open={showControls3} onOpenChange={setShowControls3}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-muted-foreground/50 bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30"
                >
                  gray controls
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-popover max-h-[80vh] overflow-y-auto">
                <ParticleControls
                  config={config3}
                  onChange={(newConfig) => {
                    const sharedUpdates: any = {};
                    if (newConfig.mouseRadius !== config3.mouseRadius)
                      sharedUpdates.mouseRadius = newConfig.mouseRadius;
                    if (newConfig.boundaryPadding !== config3.boundaryPadding)
                      sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                    if (newConfig.obstacleEnabled !== config3.obstacleEnabled)
                      sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                    if (newConfig.obstacleX !== config3.obstacleX)
                      sharedUpdates.obstacleX = newConfig.obstacleX;
                    if (newConfig.obstacleY !== config3.obstacleY)
                      sharedUpdates.obstacleY = newConfig.obstacleY;
                    if (newConfig.obstacleRadius !== config3.obstacleRadius)
                      sharedUpdates.obstacleRadius = newConfig.obstacleRadius;

                    if (Object.keys(sharedUpdates).length > 0) {
                      setSharedConfig((prev) => ({
                        ...prev,
                        ...sharedUpdates,
                      }));
                    }

                    setParticleConfig3(newConfig);
                  }}
                  onReset={handleReset3}
                  onInitialize={handleInitialize3}
                  onCopyPositions={() => {
                    setCopyTrigger((prev) => prev + 1);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = 'copied!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 1000);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Popover open={showControls3} onOpenChange={setShowControls3}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-muted-foreground/50 bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30"
                >
                  gray controls
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="border-border bg-popover m-0 w-full p-0"
                align="end"
              >
                <ParticleControls
                  config={config3}
                  onChange={(newConfig) => {
                    const sharedUpdates: any = {};
                    if (newConfig.mouseRadius !== config3.mouseRadius)
                      sharedUpdates.mouseRadius = newConfig.mouseRadius;
                    if (newConfig.boundaryPadding !== config3.boundaryPadding)
                      sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                    if (newConfig.obstacleEnabled !== config3.obstacleEnabled)
                      sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                    if (newConfig.obstacleX !== config3.obstacleX)
                      sharedUpdates.obstacleX = newConfig.obstacleX;
                    if (newConfig.obstacleY !== config3.obstacleY)
                      sharedUpdates.obstacleY = newConfig.obstacleY;
                    if (newConfig.obstacleRadius !== config3.obstacleRadius)
                      sharedUpdates.obstacleRadius = newConfig.obstacleRadius;

                    if (Object.keys(sharedUpdates).length > 0) {
                      setSharedConfig((prev) => ({
                        ...prev,
                        ...sharedUpdates,
                      }));
                    }

                    setParticleConfig3(newConfig);
                  }}
                  onReset={handleReset3}
                  onInitialize={handleInitialize3}
                  onCopyPositions={() => {
                    setCopyTrigger((prev) => prev + 1);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = 'copied!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 1000);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        {/*<div className="relative flex w-full  max-w-2xl flex-grow flex-col items-center justify-center overflow-hidden sm:max-h-128">*/}
        <div className="relative flex h-full w-full flex-grow flex-col items-center justify-center overflow-hidden">
          {/* Single particle field with combined configurations */}
          <ParticleField
            key={`combined-${particleKey1}-${particleKey2}-${particleKey3}`}
            configs={[config1, config2, config3]}
            onCopyPositions={handleCopyPositions}
            copyTrigger={copyTrigger}
          />

          <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center gap-4 px-4">
            <h1 className="text-foreground text-4xl font-bold tracking-tight transition-colors duration-300 sm:text-5xl">
              jacob stein
            </h1>

            <p className="text-muted-foreground text-md max-w-md text-center tracking-tight transition-colors duration-300 sm:text-lg">
              ui/ux - fullstack - product
            </p>

            <div className="flex gap-2">
              <Button
                className="border-border bg-primary/10 text-primary hover:bg-primary/20 pointer-events-auto rounded-lg border px-6 py-3 text-[10px] backdrop-blur-sm transition-all duration-300 sm:text-sm"
                size="sm"
              >
                projects
              </Button>
              <Button
                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground pointer-events-auto rounded-lg border bg-transparent px-6 py-3 text-[10px] transition-all duration-300 sm:text-sm"
                size="sm"
              >
                resume
              </Button>
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
                    <h1 className="text-foreground text-4xl font-medium tracking-tight">
                      projects
                    </h1>
                  </AnimatedSection>
                  <AnimatedSection animationType="header" delay={400}>
                    <p className="text-muted-foreground">
                      recent work in full-stack development and product design
                    </p>
                  </AnimatedSection>
                </div>
                <ResumeFilterControls
                  currentFilters={resumeData.filters}
                  resumeData={resumeData}
                />
              </div>
            </div>

            <div className="space-y-24">
              {projects.map((project, index) => (
                <AnimatedSection
                  key={project.id}
                  animationType="card"
                  delay={600 + index * 200}
                >
                  <ProjectCard project={project} index={index} />
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
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <AnimatedSection animationType="header" delay={200}>
                      <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
                        jacob stein
                      </h1>
                      <p className="text-muted-foreground mt-2 text-xl">
                        full-stack developer & ui/ux designer
                      </p>
                    </AnimatedSection>
                  </div>
                  <div className="hidden md:block">
                    <ResumeFilterControls
                      currentFilters={resumeData.filters}
                      resumeData={resumeData}
                      className="mb-4"
                    />
                  </div>
                </div>
                <div className="md:hidden">
                  <ResumeFilterControls
                    currentFilters={resumeData.filters}
                    resumeData={resumeData}
                    className="justify-center"
                  />
                </div>

                <AnimatedSection animationType="section" delay={400}>
                  <p className="text-muted-foreground mx-auto max-w-2xl leading-relaxed">
                    {summary}
                  </p>
                </AnimatedSection>
              </div>

              <AnimatedSection animationType="section" delay={600}>
                <ResumeExperience />
              </AnimatedSection>
              <AnimatedSection animationType="section" delay={800}>
                <ResumeSkills />
              </AnimatedSection>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
