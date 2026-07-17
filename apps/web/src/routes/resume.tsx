import { createFileRoute, Link } from '@tanstack/react-router';
import { Calendar, ExternalLink, Mail, MapPin } from 'lucide-react';
import { lazy, Suspense } from 'react';
import {
  SitePublicShell,
  SiteResumeAction,
} from '@/components/site/public-shell';
import { trackEvents } from '@/lib/track-events';

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
    company: 'The Market',
    role: 'Founder & Developer',
    location: 'Remote',
    timeline: 'November 2025 - Present',
    description:
      'Founded and built The Market, a compatibility-focused dating app for web and mobile. Own the product end-to-end across onboarding, discovery, AI-assisted matching, identity verification, real-time chat, backend architecture, and deployment.',
    achievements: [
      'Built the full product as a solo founder/developer across TanStack Start web, Expo/React Native mobile, and a shared Convex backend',
      'Architected compatibility-driven discovery with AI-assisted category feeds, matching logic, and profile variant testing',
      'Implemented identity and safety systems with Clerk auth, profile onboarding, AWS Rekognition face verification, and selfie/liveness flows',
      'Designed and shipped a 40+ screen onboarding and profile setup flow for progressive dating preferences, prompts, photos, and match criteria',
      'Built real-time chat with reactions, typing indicators, presence, match flows, and in-chat interactive experiences',
    ],
    technologies: [
      'TanStack Start',
      'React 19',
      'Expo',
      'React Native',
      'Convex',
      'Clerk',
      'Google Gemini',
      'AWS Rekognition',
      'Cloudflare Workers',
      'Terraform',
    ],
  },
  {
    company: 'HEAT.tech',
    role: 'Senior Full-Stack Developer & Technical Lead',
    location: 'Remote',
    timeline: '2022 - 2025',
    description:
      'Led development of a sophisticated motion capture marketplace backed by Andreessen Horowitz (a16z) and Samsung Next, connecting viral movements with gaming. Architected full-stack TypeScript ecosystem with real-time 3D animation processing and cross-platform plugin system spanning multiple game engines and 3D applications.',
    achievements: [
      'Architected monorepo platform with real-time 3D animation marketplace using Nx workspace',
      'Built advanced 3D viewer with Three.js/React Three Fiber for real-time animation preview',
      'Integrated Stripe marketplace with subscription management and creator payout system',
      'Developed cross-platform plugin ecosystem for Blender, Unity, Unreal Engine, and Maya',
      'Built Qt desktop application with custom web view layer to unify interaction patterns across disparate 3D applications',
      'Wrote Unreal Engine plugin in C++ for native engine integration',
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
  },
  {
    company: 'Independent',
    role: 'Freelance Web Developer',
    location: 'Remote',
    timeline: 'November 2025 - Present',
    description:
      'Recent freelance web work for consumer retail and film clients, translating brand direction into responsive, production-ready websites.',
    achievements: [
      'Built Mershy.com for online retailer MERSHY, supporting product discovery, editorial brand content, ecommerce navigation, and mobile shopping flows',
      'Built MadelineLearyFilm.com for director Madeline Leary, presenting film/music-video work, imagery, about/contact pages, and inquiry capture',
      'Delivered polished responsive interfaces tuned for brand expression, navigation clarity, and fast handoff',
    ],
    technologies: [
      'Responsive Web Design',
      'E-commerce UX',
      'Media-rich Portfolio UX',
      'React',
      'Next.js',
      'TypeScript',
      'Tailwind CSS',
      'SEO',
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
  Languages: ['TypeScript', 'JavaScript', 'Python', 'C++', 'SQL', 'GLSL'],
  Frontend: [
    'React',
    'React Native',
    'Expo',
    'Next.js',
    'Three.js',
    'React Three Fiber',
    'TanStack Start',
    'Tailwind CSS',
    'NativeWind',
    'shadcn/ui',
    'Radix UI',
  ],
  Backend: [
    'NestJS',
    'Node.js',
    'Convex',
    'Google Gemini',
    'PostgreSQL',
    'TypeORM',
    'REST APIs',
    'WebSocket',
    'Auth0',
    'Clerk',
  ],
  Infrastructure: [
    'AWS',
    'AWS Rekognition',
    'Terraform',
    'Docker',
    'Cloudflare Workers',
    'GitHub Actions',
    'CI/CD',
    'ECS',
    'S3',
    'CloudFront',
  ],
  'ML & 3D': [
    'PyTorch',
    'ONNX Runtime',
    'Three.js',
    'WebGL',
    'Motion Capture',
    'Animation Systems',
    'MediaPipe',
  ],
  'Cross-Platform': [
    'Qt',
    'Unreal Engine (C++)',
    'Unity',
    'Blender',
    'Maya',
    'Daz 3D',
  ],
  Payments: [
    'Stripe',
    'Stripe Connect',
    'Subscription Management',
    'Marketplace Architecture',
  ],
  Testing: [
    'Jest',
    'Vitest',
    'React Testing Library',
    'Cypress',
    'E2E Testing',
  ],
  Design: [
    'Figma',
    'Design Systems',
    'User Research',
    'Prototyping',
    'Accessibility',
    'Mobile-first Design',
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
            <h3 className="text-foreground text-xl font-[200]">
              {experience.role}
            </h3>
            <p className="text-primary text-lg font-light">
              {experience.company}
            </p>
          </div>
          <div
            className="text-muted-foreground flex items-center text-sm"
            style={{ gap: '0.25rem' }}
          >
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
          <h4 className="text-foreground mb-2 font-light">key achievements</h4>
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
          <h4 className="text-foreground mb-2 font-light">technologies</h4>
          <div className="flex flex-wrap gap-2">
            {experience.technologies.map((tech, techIndex) => (
              <span
                key={tech}
                className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-light"
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
        <h3 className="text-foreground font-[200]">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {skillList.map((skill, skillIndex) => (
            <span
              key={skill}
              className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm font-light"
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
    <SitePublicShell
      title="Jacob Stein"
      description="Founding engineer and UI/UX-focused product developer building cross-platform software, real-time systems, AI-assisted workflows, and production infrastructure."
      wide
    >
      <div className="site-resume-stack">
        <div className="site-resume-actions">
          <a
            href="mailto:jacob@jacobstein.me"
            className="site-link site-resume-contact"
            onClick={() =>
              trackEvents.contactInitiated(
                'email',
                'resume_page',
                'mailto:jacob@jacobstein.me'
              )
            }
          >
            <Mail aria-hidden="true" />
            <span>jacob@jacobstein.me</span>
          </a>
          <span className="site-resume-contact">
            <MapPin aria-hidden="true" />
            <span>San Francisco, CA</span>
          </span>
          <SiteResumeAction
            label="download resume"
            source="site_resume_page"
            contentSide="bottom"
            contentAlign="start"
          />
        </div>

        <section>
          <div>
            <h2 className="text-foreground mb-8 text-3xl font-[200]">
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
            <h2 className="text-foreground mb-8 text-3xl font-[200]">skills</h2>
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
            <h2 className="text-foreground mb-8 text-3xl font-[200]">
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
            <h2 className="text-foreground mb-8 text-3xl font-[200]">
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
                      <h3 className="text-foreground text-xl font-[200]">
                        {edu.degree}
                      </h3>
                      <p className="text-primary text-lg font-light">
                        {edu.institution}
                      </p>
                    </div>
                    <div
                      className="text-muted-foreground flex items-center text-sm"
                      style={{ gap: '0.25rem' }}
                    >
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
          <section className="site-public-section text-center">
            <div>
              <h3 className="text-foreground mb-4 text-2xl font-[200]">
                view my work
              </h3>
              <p className="text-muted-foreground mb-6">
                Explore detailed case studies and live demos of my recent
                projects
              </p>
              <Link
                to="/projects"
                className="site-link site-resume-projects-link"
                onClick={() =>
                  trackEvents.navLinkClicked(
                    'projects',
                    'resume',
                    'projects',
                    window.scrollY
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
                see projects
              </Link>
            </div>
          </section>
        </div>
      </div>
    </SitePublicShell>
  );
}
