// Comprehensive resume data structure based on repository analysis

export type Technology = string;
export type Domain = 'frontend' | 'backend' | 'infrastructure' | '3d' | 'payments' | 'realtime' | 'auth' | 'marketplace' | 'social' | 'testing' | 'devops';
export type FocusArea = 'frontend' | 'backend' | 'fullstack' | 'leadership' | 'product' | '3d-graphics' | 'realtime';
export type ExperienceLevel = 'junior' | 'senior' | 'lead' | 'founder' | 'consultant';
export type ResponsibilityType = 'architecture' | 'development' | 'optimization' | 'integration' | 'leadership' | 'innovation';

export interface Achievement {
  description: string;
  impact?: string;
  technologies: Technology[];
  domains: Domain[];
  type: ResponsibilityType;
  priority: number; // 1-10 for filtering
}

export interface ProjectContribution {
  id: string;
  title: string;
  url?: string;
  company: string;
  timeline: string;
  description: string;
  role: string;
  focusAreas: FocusArea[];
  domains: Domain[];
  
  // Detailed achievements broken down by category
  achievements: Achievement[];
  
  // Technology breakdown
  technologies: {
    frontend: Technology[];
    backend: Technology[];
    infrastructure: Technology[];
    databases: Technology[];
    tools: Technology[];
  };
  
  // Preview URLs for portfolio
  previews: string[];
  
  priority: number; // For sorting/filtering
}

export interface SkillCategory {
  category: string;
  skills: Technology[];
  proficiency: 'expert' | 'proficient' | 'familiar';
  domains: Domain[];
  priority: number;
}

export interface ResumeProfile {
  personal: {
    name: string;
    title: string;
    location: string;
    summary: string;
    contact: {
      email?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
  };
  
  projects: ProjectContribution[];
  skills: SkillCategory[];
  
  // Default content when no filters applied
  defaults: {
    focusAreas: FocusArea[];
    topTechnologies: Technology[];
    priorityDomains: Domain[];
  };
}

// Comprehensive resume data based on repository analysis
export const resumeProfile: ResumeProfile = {
  personal: {
    name: 'Jacob Stein',
    title: 'Senior Full-Stack Developer & UI/UX Designer',
    location: 'Remote',
    summary: 'Full-stack developer and UI/UX designer with experience building scalable web applications and intuitive user experiences. Proven track record of architecting complex systems and delivering high-impact products.',
    contact: {
      website: 'https://jacobstein.dev',
      github: 'https://github.com/jacobstein',
      linkedin: 'https://linkedin.com/in/jacobstein'
    }
  },
  
  projects: [
    {
      id: 'heat-tech',
      title: 'Heat.tech',
      url: 'https://heat.tech',
      company: 'Heat.tech',
      timeline: '2022 - 2025',
      role: 'Senior Full-Stack Developer & Technical Lead',
      description: 'Led development of a sophisticated motion capture marketplace platform connecting viral movements with gaming. Architected full-stack TypeScript ecosystem with real-time 3D animation processing.',
      focusAreas: ['fullstack', 'leadership', '3d-graphics'],
      domains: ['marketplace', '3d', 'payments', 'auth', 'infrastructure'],
      
      achievements: [
        {
          description: 'Architected monorepo platform with real-time 3D animation marketplace using Nx workspace',
          impact: 'Created scalable foundation for motion capture creator economy',
          technologies: ['React', 'Three.js', 'NestJS', 'PostgreSQL', 'AWS', 'Nx'],
          domains: ['marketplace', '3d', 'infrastructure'],
          type: 'architecture',
          priority: 10
        },
        {
          description: 'Built advanced 3D viewer with Three.js/React Three Fiber for real-time animation preview',
          impact: 'Enabled interactive 3D model rendering with custom camera controls and lighting',
          technologies: ['Three.js', 'React Three Fiber', 'WebGL', 'GLSL'],
          domains: ['3d', 'frontend'],
          type: 'development',
          priority: 9
        },
        {
          description: 'Integrated Stripe marketplace with subscription management and creator payout system',
          impact: 'Enabled sustainable revenue model for platform and content creators',
          technologies: ['Stripe', 'Stripe Connect', 'NestJS', 'PostgreSQL'],
          domains: ['payments', 'backend'],
          type: 'integration',
          priority: 8
        },
        {
          description: 'Developed plugin ecosystem for Blender, Unity, Unreal Engine, and Maya',
          impact: 'Extended platform reach across major 3D software applications',
          technologies: ['Python', 'C#', 'C++', 'MEL', 'AWS S3'],
          domains: ['3d', 'integration'],
          type: 'development',
          priority: 8
        },
        {
          description: 'Designed and implemented AWS infrastructure with Terraform IaC',
          impact: 'Created auto-scaling, production-ready cloud architecture',
          technologies: ['Terraform', 'AWS ECS', 'CloudFront', 'RDS', 'S3'],
          domains: ['infrastructure', 'devops'],
          type: 'architecture',
          priority: 7
        },
        {
          description: 'Built real-time motion capture integration with Move.ai and MediaPipe',
          impact: 'Enabled AI-powered video-to-animation processing pipeline',
          technologies: ['ONNX', 'WebAssembly', 'MediaPipe', 'Python'],
          domains: ['3d', 'realtime'],
          type: 'innovation',
          priority: 7
        },
        {
          description: 'Implemented comprehensive testing strategy across full stack',
          impact: 'Established quality gates with automated testing pipeline',
          technologies: ['Jest', 'React Testing Library', 'Cypress', 'GitHub Actions'],
          domains: ['testing', 'devops'],
          type: 'development',
          priority: 6
        }
      ],
      
      technologies: {
        frontend: ['React', 'Three.js', 'React Three Fiber', 'TypeScript', 'Tailwind CSS', 'Radix UI'],
        backend: ['NestJS', 'TypeORM', 'PostgreSQL', 'Auth0', 'Stripe'],
        infrastructure: ['AWS ECS', 'Terraform', 'CloudFront', 'S3', 'RDS Aurora'],
        databases: ['PostgreSQL', 'Redis'],
        tools: ['Nx', 'Docker', 'GitHub Actions', 'ESLint', 'Prettier']
      },
      
      previews: [
        'https://heat.tech/search/animations/05867c5d-0542-48d1-bc7a-7f1f81ffee73?q=boxer',
        'https://heat.tech',
        'https://heat.tech/plugins',
        'https://heat.tech/3d-viewer'
      ],
      
      priority: 10
    },
    
    {
      id: 'vibechecc',
      title: 'vibechecc.io',
      url: 'https://vibechecc.io',
      company: 'vibechecc',
      timeline: '2025 - present',
      role: 'Founder & Lead Developer',
      description: 'Founded and architected innovative social platform for sharing life experiences with emoji-based rating system. Built real-time application using cutting-edge TanStack ecosystem and Convex backend.',
      focusAreas: ['fullstack', 'leadership', 'product', 'realtime'],
      domains: ['social', 'realtime', 'auth', 'infrastructure'],
      
      achievements: [
        {
          description: 'Architected real-time social platform with TanStack Start and Convex backend',
          impact: 'Created novel social interaction patterns with emoji-based rating system',
          technologies: ['TanStack Start', 'Convex', 'TypeScript', 'Tailwind CSS'],
          domains: ['social', 'realtime', 'frontend'],
          type: 'architecture',
          priority: 9
        },
        {
          description: 'Designed innovative emoji rating system replacing traditional star ratings',
          impact: 'Pioneered unique UX patterns for social content evaluation',
          technologies: ['React', 'TypeScript', 'CSS Animations', 'emoji-mart'],
          domains: ['social', 'frontend'],
          type: 'innovation',
          priority: 9
        },
        {
          description: 'Implemented real-time subscriptions with optimistic UI updates',
          impact: 'Delivered seamless user experience with instant feedback',
          technologies: ['Convex', 'TanStack Query', 'WebSocket'],
          domains: ['realtime', 'frontend'],
          type: 'development',
          priority: 8
        },
        {
          description: 'Built comprehensive infrastructure with Terraform and Cloudflare Workers',
          impact: 'Created scalable deployment pipeline with automated CI/CD',
          technologies: ['Terraform', 'Cloudflare Workers', 'GitHub Actions'],
          domains: ['infrastructure', 'devops'],
          type: 'architecture',
          priority: 7
        },
        {
          description: 'Created extensive test suite with Vitest and Convex testing framework',
          impact: 'Ensured reliability with comprehensive testing strategy',
          technologies: ['Vitest', 'Testing Library', 'Convex Test'],
          domains: ['testing'],
          type: 'development',
          priority: 6
        },
        {
          description: 'Integrated Clerk authentication with real-time user synchronization',
          impact: 'Streamlined onboarding with multi-provider social authentication',
          technologies: ['Clerk', 'Convex', 'WebHooks'],
          domains: ['auth', 'realtime'],
          type: 'integration',
          priority: 6
        }
      ],
      
      technologies: {
        frontend: ['TanStack Start', 'TanStack Router', 'TanStack Query', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'],
        backend: ['Convex', 'Clerk', 'Node.js'],
        infrastructure: ['Cloudflare Workers', 'Terraform', 'GitHub Actions'],
        databases: ['Convex (Real-time)'],
        tools: ['Bun', 'Nx', 'Vitest', 'ESLint', 'Prettier']
      },
      
      previews: [
        'https://vibechecc.io',
        'https://vibechecc.io/explore',
        'https://vibechecc.io/profile',
        'https://vibechecc.io/vibes/new'
      ],
      
      priority: 9
    }
  ],
  
  skills: [
    {
      category: 'Frontend Development',
      skills: ['React', 'TypeScript', 'Three.js', 'TanStack Start', 'Next.js', 'Tailwind CSS', 'shadcn/ui', 'Radix UI'],
      proficiency: 'expert',
      domains: ['frontend', '3d'],
      priority: 10
    },
    {
      category: 'Backend Development',
      skills: ['NestJS', 'Node.js', 'Convex', 'PostgreSQL', 'TypeORM', 'REST APIs', 'WebSocket', 'Auth0', 'Clerk'],
      proficiency: 'expert',
      domains: ['backend', 'realtime', 'auth'],
      priority: 9
    },
    {
      category: '3D Graphics & Animation',
      skills: ['Three.js', 'React Three Fiber', 'WebGL', 'GLSL', 'Motion Capture', 'Animation Systems', 'ONNX', 'MediaPipe'],
      proficiency: 'expert',
      domains: ['3d', 'frontend'],
      priority: 9
    },
    {
      category: 'Infrastructure & DevOps',
      skills: ['AWS', 'Terraform', 'Docker', 'Cloudflare Workers', 'GitHub Actions', 'CI/CD', 'ECS', 'S3', 'CloudFront'],
      proficiency: 'proficient',
      domains: ['infrastructure', 'devops'],
      priority: 8
    },
    {
      category: 'Real-time Systems',
      skills: ['WebSocket', 'Convex', 'TanStack Query', 'Optimistic Updates', 'Event-driven Architecture'],
      proficiency: 'expert',
      domains: ['realtime', 'backend'],
      priority: 8
    },
    {
      category: 'Payment & Marketplace',
      skills: ['Stripe', 'Stripe Connect', 'Subscription Management', 'Marketplace Architecture', 'Revenue Systems'],
      proficiency: 'proficient',
      domains: ['payments', 'marketplace'],
      priority: 7
    },
    {
      category: 'Testing & Quality',
      skills: ['Jest', 'Vitest', 'React Testing Library', 'Cypress', 'Convex Test', 'E2E Testing'],
      proficiency: 'proficient',
      domains: ['testing'],
      priority: 6
    },
    {
      category: 'UI/UX Design',
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Accessibility', 'Mobile-first Design'],
      proficiency: 'proficient',
      domains: ['frontend'],
      priority: 7
    }
  ],
  
  defaults: {
    focusAreas: ['fullstack', 'leadership'],
    topTechnologies: ['React', 'TypeScript', 'Three.js', 'NestJS', 'Convex', 'AWS', 'Terraform'],
    priorityDomains: ['frontend', 'backend', '3d', 'realtime', 'infrastructure']
  }
};