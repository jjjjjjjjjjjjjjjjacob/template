import { createFileRoute } from '@tanstack/react-router';
import { Download, Mail, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    description: 'Led development of comprehensive energy management platform serving enterprise clients.',
    achievements: [
      'Architected and built scalable React/Node.js platform',
      'Designed intuitive dashboards that reduced customer onboarding time',
      'Led frontend team of 4 developers, establishing coding standards and best practices',
      'Optimized application performance, reducing load times by 60% through caching strategies'
    ],
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Figma']
  },
  {
    company: 'Vibechecc',
    role: 'Lead Full-Stack Developer & Product Designer',
    location: 'New York, NY',
    timeline: '2025 - present',
    description: 'Spearheaded development of next-generation social platform focused on authentic connections.',
    achievements: [
      'Built responsive React application using Tanstack Start, Convex, and Clerk',
      'Created comprehensive design system reducing development time by 50%',
      'Conducted user research and A/B testing, improving user engagement by 35%',
      'Mentored 3 junior developers on modern React patterns and TypeScript'
    ],
    technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Socket.io', 'Prisma', 'Vercel']
  },
  {
    company: 'Freelance',
    role: 'Full-Stack Developer & Designer',
    location: 'Various',
    timeline: '2019 - 2021',
    description: 'Delivered custom web applications and digital experiences for diverse clients.',
    achievements: [
      'Completed 25+ projects ranging from e-commerce to SaaS platforms',
      'Maintained 5-star client rating across 20+ reviews on freelance platforms',
      'Built custom CMS solutions reducing content management overhead by 70%',
      'Designed responsive websites improving mobile conversion rates by 45%',
      'Established efficient development workflows using modern tooling and CI/CD'
    ],
    technologies: ['React', 'Vue.js', 'Laravel', 'WordPress', 'Shopify', 'MySQL', 'AWS', 'Stripe']
  }
];

const education: Education[] = [
  {
    institution: 'University of California, Los Angeles',
    degree: 'Bachelor of Arts in Ethnomusicology',
    timeline: '2010 - 2015',
    location: 'Los Angeles, CA'
  }
];

const skills = {
  'Frontend Development': ['React', 'TypeScript', 'Next.js', 'Vue.js', 'Tailwind CSS', 'Three.js', 'Framer Motion'],
  'Backend Development': ['Node.js', 'Python', 'PHP', 'PostgreSQL', 'Redis', 'GraphQL', 'REST APIs'],
  'UI/UX Design': ['Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Design Systems', 'Accessibility'],
  'DevOps & Tools': ['AWS', 'Docker', 'Vercel', 'Git', 'CI/CD', 'Monitoring', 'Performance Optimization']
};

function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <div className="border-l-2 border-primary/20 pl-8 relative">
      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary"></div>
      
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{experience.role}</h3>
            <p className="text-lg font-medium text-primary">{experience.company}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          <h4 className="mb-2 font-medium text-foreground">key achievements</h4>
          <ul className="space-y-1">
            {experience.achievements.map((achievement, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                {achievement}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-medium text-foreground">technologies</h4>
          <div className="flex flex-wrap gap-2">
            {experience.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
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

function SkillCategory({ title, skills: skillList }: { title: string; skills: string[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skillList.map((skill) => (
          <span
            key={skill}
            className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResumePage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* Header */}
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                jacob stein
              </h1>
              <p className="mt-2 text-xl text-muted-foreground">
                full-stack developer & ui/ux designer
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>jacob@example.com</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // In a real app, this would download a PDF version
                  window.print();
                }}
              >
                <Download className="h-4 w-4" />
                download pdf
              </Button>
            </div>

            <p className="mx-auto max-w-2xl text-muted-foreground leading-relaxed">
              Passionate full-stack developer and designer with 5+ years of experience building 
              scalable web applications and intuitive user experiences. Proven track record of 
              leading development teams and delivering high-impact products that serve millions of users.
            </p>
          </div>

          {/* Experience */}
          <section>
            <h2 className="mb-8 text-3xl font-bold text-foreground">experience</h2>
            <div className="space-y-12">
              {experiences.map((experience, index) => (
                <ExperienceCard key={index} experience={experience} />
              ))}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h2 className="mb-8 text-3xl font-bold text-foreground">skills</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {Object.entries(skills).map(([category, skillList]) => (
                <SkillCategory key={category} title={category} skills={skillList} />
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <h2 className="mb-8 text-3xl font-bold text-foreground">education</h2>
            <div className="space-y-6">
              {education.map((edu, index) => (
                <div key={index} className="border-l-2 border-primary/20 pl-8 relative">
                  <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary"></div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{edu.degree}</h3>
                      <p className="text-lg font-medium text-primary">{edu.institution}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          </section>

          {/* Projects Link */}
          <section className="text-center">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h3 className="mb-4 text-2xl font-semibold text-foreground">view my work</h3>
              <p className="mb-6 text-muted-foreground">
                Explore detailed case studies and live demos of my recent projects
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
  );
}