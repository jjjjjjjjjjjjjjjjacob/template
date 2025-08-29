import { createFileRoute } from '@tanstack/react-router';
import { Download, Mail, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense, lazy } from 'react';

// Lazy load heavy data visualization components
const ResumeCharts = lazy(() => import('@/components/resume/resume-charts'));
const SkillsVisualization = lazy(
  () => import('@/components/resume/skills-visualization')
);

export const Route = createFileRoute('/resume')({
  component: ResumePage,
});

interface Experience {
  company: string;
  role: string;
  location: string;
  timeline: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

interface Education {
  institution: string;
  degree: string;
  timeline: string;
  location: string;
}

const experiences: Experience[] = [
  {
    company: 'Heat.tech',
    role: 'Senior Full-Stack Developer & UI/UX Designer',
    location: 'Remote',
    timeline: '2022 - 2025',
    description:
      'Led development of comprehensive energy management platform serving enterprise clients.',
    achievements: [
      'Architected and built scalable React/Node.js platform',
      'Designed intuitive dashboards that reduced customer onboarding time',
      'Led frontend team of 4 developers, establishing coding standards and best practices',
      'Optimized application performance, reducing load times by 60% through caching strategies',
    ],
    technologies: [
      'React',
      'TypeScript',
      'Node.js',
      'PostgreSQL',
      'Redis',
      'Docker',
      'AWS',
      'Figma',
    ],
  },
  {
    company: 'Vibechecc',
    role: 'Lead Full-Stack Developer & Product Designer',
    location: 'New York, NY',
    timeline: '2025 - present',
    description:
      'Spearheaded development of next-generation social platform focused on authentic connections.',
    achievements: [
      'Built responsive React application using Tanstack Start, Convex, and Clerk',
      'Created comprehensive design system reducing development time by 50%',
      'Conducted user research and A/B testing, improving user engagement by 35%',
      'Mentored 3 junior developers on modern React patterns and TypeScript',
    ],
    technologies: [
      'React',
      'Next.js',
      'TypeScript',
      'Tailwind CSS',
      'Socket.io',
      'Prisma',
      'Vercel',
    ],
  },
  {
    company: 'Freelance',
    role: 'Full-Stack Developer & Designer',
    location: 'Various',
    timeline: '2019 - 2021',
    description:
      'Delivered custom web applications and digital experiences for diverse clients.',
    achievements: [
      'Completed 25+ projects ranging from e-commerce to SaaS platforms',
      'Maintained 5-star client rating across 20+ reviews on freelance platforms',
      'Built custom CMS solutions reducing content management overhead by 70%',
      'Designed responsive websites improving mobile conversion rates by 45%',
      'Established efficient development workflows using modern tooling and CI/CD',
    ],
    technologies: [
      'React',
      'Vue.js',
      'Laravel',
      'WordPress',
      'Shopify',
      'MySQL',
      'AWS',
      'Stripe',
    ],
  },
];

const education: Education[] = [
  {
    institution: 'University of California, Los Angeles',
    degree: 'Bachelor of Arts in Ethnomusicology',
    timeline: '2010 - 2015',
    location: 'Los Angeles, CA',
  },
];

const skills = {
  'Frontend Development': [
    'React',
    'TypeScript',
    'Next.js',
    'Vue.js',
    'Tailwind CSS',
    'Three.js',
    'Framer Motion',
  ],
  'Backend Development': [
    'Node.js',
    'Python',
    'PHP',
    'PostgreSQL',
    'Redis',
    'GraphQL',
    'REST APIs',
  ],
  'UI/UX Design': [
    'Figma',
    'Adobe Creative Suite',
    'Prototyping',
    'User Research',
    'Design Systems',
    'Accessibility',
  ],
  'DevOps & Tools': [
    'AWS',
    'Docker',
    'Vercel',
    'Git',
    'CI/CD',
    'Monitoring',
    'Performance Optimization',
  ],
};

function ExperienceCard({
  experience,
  index,
}: {
  experience: Experience;
  index: number;
}) {
  return (
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

        <p className="text-muted-foreground">{experience.description}</p>

        <div>
          <h4 className="text-foreground mb-2 font-medium">key achievements</h4>
          <ul className="space-y-1">
            {experience.achievements.map((achievement, achievementIndex) => (
              <li
                key={achievementIndex}
                className="text-muted-foreground flex items-start gap-2 text-sm"
              >
                <span className="bg-primary mt-2 h-1 w-1 flex-shrink-0 rounded-full" />
                {achievement}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-foreground mb-2 font-medium">technologies</h4>
          <div className="flex flex-wrap gap-2">
            {experience.technologies.map((tech, techIndex) => (
              <span
                key={tech}
                className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  opacity: 0,
                  animation: `fadeInScale 0.4s ease-out forwards`,
                  animationDelay: `${index * 100 + 200 + techIndex * 30}ms`,
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillCategory({
  title,
  skills: skillList,
  index,
}: {
  title: string;
  skills: string[];
  index: number;
}) {
  return (
    <div>
      <div className="space-y-3">
        <h3 className="text-foreground font-semibold">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {skillList.map((skill, skillIndex) => (
            <span
              key={skill}
              className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm font-medium"
              style={{
                opacity: 0,
                animation: `fadeInScale 0.4s ease-out forwards`,
                animationDelay: `${index * 150 + skillIndex * 40}ms`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResumePage() {
  return (
    <div className="bg-background min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl space-y-16">
          <div>
            <div className="space-y-6 text-center">
              <div>
                <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
                  jacob stein
                </h1>
                <p className="text-muted-foreground mt-2 text-xl">
                  full-stack developer & ui/ux designer
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>jjjjjjjjjjjjjjjjacob@gmail.com</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>San Francisco, CA</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.print()}
                >
                  <Download className="h-4 w-4" />
                  download pdf
                </Button>
              </div>
              <p className="text-muted-foreground mx-auto max-w-2xl leading-relaxed">
                Passionate full-stack developer and designer with 5+ years of
                experience building scalable web applications and intuitive user
                experiences.
              </p>
            </div>
          </div>

          <section>
            <div>
              <h2 className="text-foreground mb-8 text-3xl font-bold">
                experience
              </h2>
            </div>
            <div className="space-y-12">
              {experiences.map((experience, index) => (
                <ExperienceCard
                  key={index}
                  experience={experience}
                  index={index}
                />
              ))}
            </div>
          </section>

          <section>
            <div>
              <h2 className="text-foreground mb-8 text-3xl font-bold">
                skills
              </h2>
            </div>
            <div className="space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                {Object.entries(skills).map(([category, skillList], index) => (
                  <SkillCategory
                    key={category}
                    title={category}
                    skills={skillList}
                    index={index}
                  />
                ))}
              </div>
              <Suspense
                fallback={
                  <div className="bg-muted/20 h-64 w-full animate-pulse rounded-lg" />
                }
              >
                <SkillsVisualization />
              </Suspense>
            </div>
          </section>

          <section>
            <div>
              <h2 className="text-foreground mb-8 text-3xl font-bold">
                performance metrics
              </h2>
            </div>
            <Suspense
              fallback={
                <div className="bg-muted/20 h-64 w-full animate-pulse rounded-lg" />
              }
            >
              <ResumeCharts />
            </Suspense>
          </section>

          <section>
            <div>
              <h2 className="text-foreground mb-8 text-3xl font-bold">
                education
              </h2>
              <div className="space-y-6">
                {education.map((edu, index) => (
                  <div
                    key={index}
                    className="border-primary/20 relative border-l-2 pl-8"
                  >
                    <div className="bg-primary absolute top-0 -left-2 h-4 w-4 rounded-full"></div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-foreground text-xl font-semibold">
                          {edu.degree}
                        </h3>
                        <p className="text-primary text-lg font-medium">
                          {edu.institution}
                        </p>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {edu.timeline}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {edu.location}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div>
            <section className="text-center">
              <div className="border-border bg-card rounded-2xl border p-8">
                <h3 className="text-foreground mb-4 text-2xl font-semibold">
                  view my work
                </h3>
                <p className="text-muted-foreground mb-6">
                  Explore detailed case studies and live demos of my recent
                  projects
                </p>
                <Button asChild>
                  <a href="/projects" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    see projects
                  </a>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
