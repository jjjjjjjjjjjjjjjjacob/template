import type {
  ResumeProfileRecord,
  ResumeProjectRecord,
  ResumeSkillRecord,
} from './resume';

export const resumeProfiles: ResumeProfileRecord[] = [
  {
    slug: 'default',
    name: 'Jacob Stein',
    title: 'Founding Engineer & UI/UX',
    location: 'Remote',
    summary:
      'Technical leader and architect with 4+ years of experience building cross-platform software systems that bridge legacy applications with modern infrastructure. Proven track record integrating disparate APIs, deploying ML models to production, and managing technical partnerships with major platform vendors. Experience across TypeScript, Python, and C++ in complex multi-platform environments.',
    contact: {
      email: 'jacob@jacobstein.me',
      github: 'https://github.com/jjjjjjjjjjjjjjacob',
      website: 'https://x.com/jaequbh',
    },
    defaults: {
      focusAreas: ['fullstack', 'leadership'],
      topTechnologies: [
        'React',
        'TypeScript',
        'Three.js',
        'NestJS',
        'Convex',
        'AWS',
        'Terraform',
      ],
      priorityDomains: [
        'frontend',
        'backend',
        '3d',
        'realtime',
        'infrastructure',
      ],
    },
    order: 0,
  },
  {
    slug: 'product',
    name: 'Jacob Stein',
    title: 'Product & Growth Lead',
    location: 'Remote',
    summary:
      'Product strategist and technical founder focused on shipping high-impact social and 3D creator products. Proven track record of launching platforms from zero-to-one, aligning product vision with GTM, and scaling cross-functional teams.',
    contact: {
      linkedin: 'https://linkedin.com/in/jacobstein',
      github: 'https://github.com/jacobstein',
      website: 'https://jacobstein.dev',
    },
    defaults: {
      focusAreas: ['product', 'fullstack'],
      topTechnologies: [
        'Product Vision',
        'Growth Strategy',
        'Customer Discovery',
        'Roadmapping',
        'Activation Experiments',
        'Retention Analysis',
      ],
      priorityDomains: ['social', 'marketplace', 'payments'],
    },
    order: 1,
  },
  {
    slug: 'frontend',
    name: 'Jacob Stein',
    title: 'Principal Frontend Engineer & Product Designer',
    location: 'Remote',
    summary:
      'Frontend engineer and product designer focused on building immersive web experiences, real-time interfaces, and visually polished design systems. Experienced shipping high-impact UI work from concept through production.',
    contact: {
      linkedin: 'https://linkedin.com/in/jacobstein',
      github: 'https://github.com/jacobstein',
      website: 'https://jacobstein.dev',
    },
    defaults: {
      focusAreas: ['frontend', 'fullstack'],
      topTechnologies: [
        'React',
        'TypeScript',
        'TanStack Start',
        'Tailwind CSS',
        'Three.js',
        'Framer Motion',
      ],
      priorityDomains: ['frontend', 'social', '3d'],
    },
    order: 2,
  },
];

export const resumeProjects: Record<string, ResumeProjectRecord[]> = {
  default: [
    {
      projectId: 'vibechecc',
      priority: 10,
      title: 'vibechecc.io',
      url: 'https://vibechecc.io',
      company: 'vibechecc',
      timeline: '2025 - present',
      role: 'Founder & Lead Developer',
      description:
        'Founded and architected innovative social platform for sharing life experiences with emoji-based rating system. Built real-time application using the TanStack ecosystem, Convex backend, and investor-backed launch playbooks.',
      focusAreas: ['fullstack', 'leadership', 'product', 'realtime'],
      domains: ['social', 'realtime', 'auth', 'infrastructure'],
      achievements: [
        {
          description:
            'Architected real-time social platform with TanStack Start and Convex backend',
          impact:
            'Created novel social interaction patterns with emoji-based rating system',
          technologies: [
            'TanStack Start',
            'Convex',
            'TypeScript',
            'Tailwind CSS',
          ],
          domains: ['social', 'realtime', 'frontend'],
          type: 'architecture',
          priority: 10,
        },
        {
          description:
            'Designed innovative emoji rating system replacing traditional star ratings',
          impact: 'Pioneered unique UX patterns for social content evaluation',
          technologies: ['React', 'TypeScript', 'CSS Animations', 'emoji-mart'],
          domains: ['social', 'frontend'],
          type: 'innovation',
          priority: 9,
        },
        {
          description:
            'Implemented real-time subscriptions with optimistic UI updates',
          impact: 'Delivered seamless user experience with instant feedback',
          technologies: ['Convex', 'TanStack Query', 'WebSocket'],
          domains: ['realtime', 'frontend'],
          type: 'development',
          priority: 8,
        },
        {
          description:
            'Built comprehensive infrastructure with Terraform and Cloudflare Workers',
          impact: 'Created scalable deployment pipeline with automated CI/CD',
          technologies: ['Terraform', 'Cloudflare Workers', 'GitHub Actions'],
          domains: ['infrastructure', 'devops'],
          type: 'architecture',
          priority: 7,
        },
        {
          description:
            'Created extensive test suite with Vitest and Convex testing framework',
          impact: 'Ensured reliability with comprehensive testing strategy',
          technologies: ['Vitest', 'Testing Library', 'Convex Test'],
          domains: ['testing'],
          type: 'development',
          priority: 6,
        },
      ],
      technologies: {
        frontend: [
          'TanStack Start',
          'TanStack Router',
          'TanStack Query',
          'React',
          'TypeScript',
          'Tailwind CSS',
          'shadcn/ui',
        ],
        backend: ['Convex', 'Clerk', 'Node.js'],
        infrastructure: ['Cloudflare Workers', 'Terraform', 'GitHub Actions'],
        databases: ['Convex (Real-time)'],
        tools: ['Bun', 'Nx', 'Vitest', 'ESLint', 'Prettier'],
      },
      previews: [
        'https://vibechecc.io',
        'https://vibechecc.io/explore',
        'https://vibechecc.io/profile',
        'https://vibechecc.io/vibes/new',
      ],
    },
    {
      projectId: 'heat-tech',
      priority: 8,
      title: 'HEAT.tech',
      url: 'https://heat.tech',
      company: 'HEAT.tech',
      timeline: '2022 - 2025',
      role: 'Senior Full-Stack Developer & Technical Lead',
      description:
        'Led development of a sophisticated motion capture marketplace backed by Andreessen Horowitz (a16z) and Samsung Next, connecting viral movements with gaming. Architected full-stack TypeScript ecosystem with real-time 3D animation processing and cross-platform plugin system spanning multiple game engines and 3D applications.',
      focusAreas: ['fullstack', 'leadership', '3d-graphics'],
      domains: ['marketplace', '3d', 'payments', 'auth', 'infrastructure'],
      achievements: [
        {
          description:
            'Architected monorepo platform with real-time 3D animation marketplace using Nx workspace',
          impact:
            'Created scalable foundation for motion capture creator economy',
          technologies: [
            'React',
            'Three.js',
            'NestJS',
            'PostgreSQL',
            'AWS',
            'Nx',
          ],
          domains: ['marketplace', '3d', 'infrastructure'],
          type: 'architecture',
          priority: 10,
        },
        {
          description:
            'Built advanced 3D viewer with Three.js/React Three Fiber for real-time animation preview',
          impact:
            'Enabled interactive 3D model rendering with custom camera controls and lighting',
          technologies: ['Three.js', 'React Three Fiber', 'WebGL', 'GLSL'],
          domains: ['3d', 'frontend'],
          type: 'development',
          priority: 9,
        },
        {
          description:
            'Integrated Stripe marketplace with subscription management and creator payout system',
          impact:
            'Enabled sustainable revenue model for platform and content creators',
          technologies: ['Stripe', 'Stripe Connect', 'NestJS', 'PostgreSQL'],
          domains: ['payments', 'backend'],
          type: 'integration',
          priority: 9,
        },
        {
          description:
            'Developed cross-platform plugin ecosystem for Blender, Unity, Unreal Engine, and Maya, managing compatibility across conflicting APIs',
          impact:
            'Extended platform reach across major 3D software applications',
          technologies: ['Python', 'C#', 'C++', 'MEL', 'AWS S3'],
          domains: ['3d', 'integration'],
          type: 'development',
          priority: 8,
        },
        {
          description:
            'Built Qt desktop application with custom web view layer to unify interaction patterns across disparate 3D applications',
          impact:
            'Unified user experience across legacy 3D software with conflicting APIs',
          technologies: ['Qt', 'C++', 'TypeScript', 'WebView'],
          domains: ['3d', 'cross-platform'],
          type: 'architecture',
          priority: 8,
        },
        {
          description:
            'Wrote Unreal Engine plugin in C++ for native engine integration',
          impact:
            'Enabled direct integration with Unreal Engine for game developers',
          technologies: ['C++', 'Unreal Engine'],
          domains: ['3d', 'integration'],
          type: 'development',
          priority: 8,
        },
        {
          description:
            'Trained and deployed armature-generating ML model using PyTorch and ONNX Runtime',
          impact: 'Automated skeleton generation for motion capture assets',
          technologies: ['PyTorch', 'ONNX Runtime', 'Python'],
          domains: ['3d', 'ml'],
          type: 'innovation',
          priority: 9,
        },
        {
          description:
            "Led technical integration with Move AI's beta API program, implementing video-to-animation pipeline",
          impact: 'Enabled AI-powered video-to-animation processing pipeline',
          technologies: ['ONNX', 'MediaPipe', 'Python', 'REST APIs'],
          domains: ['3d', 'realtime'],
          type: 'integration',
          priority: 8,
        },
        {
          description:
            'Developed Python lambdas and helper scripts for pipeline automation',
          impact: 'Streamlined content processing and deployment workflows',
          technologies: ['Python', 'AWS Lambda'],
          domains: ['infrastructure', 'backend'],
          type: 'development',
          priority: 7,
        },
        {
          description:
            'Contributed to due diligence and implementation strategy for partnerships with Unreal, Daz 3D, and Maya',
          impact: 'Informed partnership decisions with major platform vendors',
          technologies: ['Technical Strategy', 'Partnership Development'],
          domains: ['business', 'integration'],
          type: 'leadership',
          priority: 7,
        },
        {
          description:
            'Designed and implemented AWS infrastructure with Terraform IaC',
          impact: 'Created auto-scaling, production-ready cloud architecture',
          technologies: ['Terraform', 'AWS ECS', 'CloudFront', 'RDS', 'S3'],
          domains: ['infrastructure', 'devops'],
          type: 'architecture',
          priority: 7,
        },
      ],
      technologies: {
        frontend: [
          'React',
          'Three.js',
          'React Three Fiber',
          'TypeScript',
          'Tailwind CSS',
          'Radix UI',
        ],
        backend: ['NestJS', 'TypeORM', 'PostgreSQL', 'Auth0', 'Stripe'],
        infrastructure: [
          'AWS ECS',
          'Terraform',
          'CloudFront',
          'S3',
          'RDS Aurora',
        ],
        databases: ['PostgreSQL', 'Redis'],
        tools: [
          'Nx',
          'Docker',
          'GitHub Actions',
          'ESLint',
          'Prettier',
          'Qt',
          'PyTorch',
          'ONNX Runtime',
        ],
      },
      previews: [
        'https://heat.tech/marketplace/animations/05867c5d-0542-48d1-bc7a-7f1f81ffee73',
        'https://heat.tech/plugins',
        'https://heat.tech/3d-viewer',
      ],
    },
    {
      projectId: 'freelance',
      priority: 7,
      title: 'Freelance Development',
      url: undefined,
      company: 'Independent',
      timeline: 'March 2021 - present',
      role: 'Freelance Full-Stack Developer',
      description:
        'Providing full-stack development services to startups across healthtech, hospitality, creative industries, and early-stage ventures.',
      focusAreas: ['fullstack', 'frontend', 'backend'],
      domains: ['healthtech', 'hospitality', 'creative', 'startup', 'saas'],
      achievements: [
        {
          description:
            'Built platform for Biogenesis, a healthtech startup connecting clinical trial facilities with pharmaceutical companies',
          impact:
            'Streamlined clinical trial facility discovery and matching process',
          technologies: ['React', 'Next.js', 'TypeScript', 'PostgreSQL'],
          domains: ['healthtech', 'backend'],
          type: 'development',
          priority: 9,
        },
        {
          description:
            "Developed event management platform for Jean's, a New York restaurant",
          impact:
            'Enabled seamless event booking and management for hospitality venue',
          technologies: ['React', 'Next.js', 'TypeScript', 'Node.js'],
          domains: ['hospitality', 'frontend'],
          type: 'development',
          priority: 8,
        },
        {
          description:
            'Created portfolio websites for director and copywriter Madeline Leary',
          impact: 'Delivered polished creative portfolio showcasing work',
          technologies: ['React', 'Next.js', 'TypeScript'],
          domains: ['creative', 'frontend'],
          type: 'development',
          priority: 7,
        },
        {
          description:
            'Built ticket and job management application for Wonder, streamlining workflow coordination',
          impact:
            'Improved team workflow and task coordination for startup operations',
          technologies: ['React', 'TypeScript', 'Node.js'],
          domains: ['saas', 'frontend'],
          type: 'development',
          priority: 6,
        },
      ],
      technologies: {
        frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
        backend: ['Node.js', 'PostgreSQL'],
        infrastructure: ['Vercel'],
        databases: ['PostgreSQL'],
        tools: ['Git', 'ESLint', 'Prettier'],
      },
      previews: [],
    },
  ],
  product: [
    {
      projectId: 'vibechecc-product',
      priority: 9,
      title: 'vibechecc.io',
      url: 'https://vibechecc.io',
      company: 'vibechecc',
      timeline: '2025 - present',
      role: 'Founder & Head of Product',
      description:
        'Bootstrapped social discovery platform with emoji-native engagement loops, backed by product-market fit experiments and investor conversations. Led product vision through alpha launch and user research cycles as a solo founder-engineer.',
      focusAreas: ['product', 'fullstack', 'realtime'],
      domains: ['social', 'realtime', 'auth'],
      achievements: [
        {
          description:
            'Defined product north star metrics (DAU/WAU, reaction depth) and built analytics instrumentation to drive weekly roadmap decisions.',
          impact:
            'Improved onboarding conversion through iterative experimentation on signup flow, social proof placements, and personalized activation nudges.',
          technologies: [
            'Convex Analytics',
            'Product Analytics',
            'A/B Testing',
          ],
          domains: ['social', 'realtime'],
          type: 'innovation',
          priority: 10,
        },
        {
          description:
            'Implemented emoji-first rating system and moderation policies informed by qualitative interviews and in-app surveys.',
          impact:
            'Increased repeat engagement per session by pairing emoji-based interactions with habit-forming reminders and creator spotlights.',
          technologies: ['UX Research', 'Product Discovery', 'Growth Loops'],
          domains: ['social'],
          type: 'development',
          priority: 9,
        },
        {
          description:
            'Managed cross-functional release cadence (design, engineering, ops) with weekly roadmap reviews and objective tracking.',
          impact:
            'Delivered 15 feature releases in first quarter while maintaining 95% on-time delivery and zero critical regressions.',
          technologies: ['Product Operations', 'Agile Delivery', 'Roadmapping'],
          domains: ['realtime', 'auth'],
          type: 'development',
          priority: 8,
        },
      ],
      technologies: {
        frontend: ['Product Strategy', 'User Research', 'Experience Mapping'],
        backend: ['Experiment Design', 'Retention Analysis'],
        infrastructure: ['Growth Experimentation'],
        databases: ['Cohort Analytics'],
        tools: ['Notion', 'Linear', 'Figma', 'Mixpanel'],
      },
      previews: ['https://vibechecc.io', 'https://vibechecc.io/explore'],
    },
    {
      projectId: 'heat-platform-product',
      priority: 10,
      title: 'HEAT.tech',
      url: 'https://heat.tech',
      company: 'HEAT.tech',
      timeline: '2022 - 2025',
      role: 'Product & Platform Lead',
      description:
        'Led product discovery and market positioning for a16z and Samsung Next-backed motion capture marketplace, aligning enterprise partnerships with creator tooling roadmap and monetization models.',
      focusAreas: ['product', 'leadership'],
      domains: ['marketplace', 'payments', '3d'],
      achievements: [
        {
          description:
            'Conducted customer development with AAA studios, indie creators, and esports partners to validate marketplace features and pricing.',
          impact:
            'Secured 3 pilot customers and guided subscription packaging that unlocked $250k ARR pipeline.',
          technologies: [
            'Customer Discovery',
            'Pricing Strategy',
            'Partnerships',
          ],
          domains: ['marketplace', 'payments'],
          type: 'integration',
          priority: 10,
        },
        {
          description:
            'Coordinated go-to-market launches across plugins, marketplace, and creator onboarding with shared KPI dashboards.',
          impact:
            'Reduced time-to-value for creators from 14 days to 3 days by aligning product education, tooling, and support content.',
          technologies: ['GTM Strategy', 'Lifecycle Automation', 'Enablement'],
          domains: ['3d', 'marketplace'],
          type: 'architecture',
          priority: 9,
        },
        {
          description:
            'Chaired weekly product strategy syncs with engineering, design, sales, and marketing to prioritize roadmap trade-offs.',
          impact:
            'Maintained cross-team alignment on enterprise feature milestones while delivering on community-driven requests.',
          technologies: [
            'Stakeholder Management',
            'OKR Planning',
            'Product Communication',
          ],
          domains: ['payments', 'infrastructure'],
          type: 'leadership',
          priority: 8,
        },
      ],
      technologies: {
        frontend: ['Product Requirement Docs', 'User Journey Mapping'],
        backend: ['Platform Strategy', 'Ecosystem Partnerships'],
        infrastructure: ['Marketplace Operations'],
        databases: ['Revenue Analytics'],
        tools: ['Jira', 'Productboard', 'Miro', 'Salesforce'],
      },
      previews: ['https://heat.tech/marketplace', 'https://heat.tech/plugins'],
    },
  ],
  frontend: [
    {
      projectId: 'vibechecc-frontend',
      priority: 9,
      title: 'vibechecc.io',
      url: 'https://vibechecc.io',
      company: 'vibechecc',
      timeline: '2025 - present',
      role: 'Founder & Frontend Engineer',
      description:
        'Designed and implemented an emoji-native social platform with TanStack Start, focusing on real-time UI, playful interactions, and accessibility-minded design systems.',
      focusAreas: ['frontend', 'fullstack', 'realtime'],
      domains: ['social', 'realtime', 'frontend'],
      achievements: [
        {
          description:
            'Built responsive, animation-rich vibe feed with TanStack Router transitions and edge-rendered data hydration.',
          impact:
            'Delivered sub-100ms perceived load times and increased engagement with smooth micro-interactions.',
          technologies: ['TanStack Start', 'React', 'Tailwind CSS'],
          domains: ['social', 'frontend'],
          type: 'development',
          priority: 10,
        },
        {
          description:
            'Crafted design system using shadcn/ui, custom iconography, and CSS variable theming.',
          impact:
            'Enabled rapid feature prototyping with consistent aesthetics and dark mode support.',
          technologies: ['shadcn/ui', 'Design Tokens', 'Figma'],
          domains: ['frontend'],
          type: 'architecture',
          priority: 9,
        },
        {
          description:
            'Implemented optimistic updates and live reaction counts backed by Convex subscriptions.',
          impact:
            'Produced instant UI feedback loops without compromising perceived performance.',
          technologies: ['TanStack Query', 'Convex', 'WebSocket'],
          domains: ['realtime', 'frontend'],
          type: 'development',
          priority: 8,
        },
      ],
      technologies: {
        frontend: [
          'TanStack Start',
          'React',
          'TypeScript',
          'Tailwind CSS',
          'shadcn/ui',
          'Framer Motion',
        ],
        backend: ['Convex', 'Clerk'],
        infrastructure: ['Cloudflare Workers'],
        databases: ['Convex Real-time'],
        tools: ['Figma', 'Bun', 'Vitest'],
      },
      previews: [
        'https://vibechecc.io',
        'https://vibechecc.io/explore',
        'https://vibechecc.io/profile',
      ],
    },
    {
      projectId: 'heat-frontend',
      priority: 10,
      title: 'HEAT.tech Marketplace',
      url: 'https://heat.tech',
      company: 'HEAT.tech',
      timeline: '2022 - 2025',
      role: 'Senior Frontend Engineer',
      description:
        'Led frontend architecture for a16z and Samsung Next-backed motion capture marketplace, delivering 3D experiences, plugin onboarding flows, and enterprise-ready dashboards.',
      focusAreas: ['frontend', '3d-graphics'],
      domains: ['marketplace', '3d', 'frontend'],
      achievements: [
        {
          description:
            'Developed Three.js-based animation viewer with advanced lighting, camera rigs, and timeline controls.',
          impact:
            'Enabled creators to preview motion capture assets directly in-browser.',
          technologies: ['Three.js', 'React Three Fiber', 'GLSL'],
          domains: ['3d', 'frontend'],
          type: 'development',
          priority: 9,
        },
        {
          description:
            'Implemented modular frontend architecture with Nx and shared UI libraries.',
          impact:
            'Reduced bundle size and improved developer velocity across web and plugin surfaces.',
          technologies: ['Nx', 'React', 'Storybook'],
          domains: ['frontend', 'infrastructure'],
          type: 'architecture',
          priority: 8,
        },
        {
          description:
            'Collaborated on UX research for enterprise buyer dashboards and marketplace flows.',
          impact:
            'Shaped roadmap for onboarding improvements and customer retention efforts.',
          technologies: ['User Research', 'Prototyping'],
          domains: ['marketplace', 'frontend'],
          type: 'innovation',
          priority: 7,
        },
      ],
      technologies: {
        frontend: ['React', 'Three.js', 'TypeScript', 'Tailwind CSS'],
        backend: ['NestJS'],
        infrastructure: ['AWS CloudFront'],
        databases: ['PostgreSQL'],
        tools: ['Storybook', 'Jest'],
      },
      previews: [
        'https://heat.tech/3d-viewer',
        'https://heat.tech/marketplace',
      ],
    },
  ],
};

export const resumeSkills: Record<string, ResumeSkillRecord[]> = {
  default: [
    {
      priority: 10,
      category: 'Languages',
      skills: ['TypeScript', 'JavaScript', 'Python', 'C++', 'SQL', 'GLSL'],
      proficiency: 'expert',
      domains: ['frontend', 'backend', '3d'],
    },
    {
      priority: 9,
      category: 'Frontend Development',
      skills: [
        'React',
        'Next.js',
        'Three.js',
        'React Three Fiber',
        'TanStack Start',
        'Tailwind CSS',
        'shadcn/ui',
        'Radix UI',
      ],
      proficiency: 'expert',
      domains: ['frontend', '3d'],
    },
    {
      priority: 9,
      category: 'Backend Development',
      skills: [
        'NestJS',
        'Node.js',
        'Convex',
        'PostgreSQL',
        'TypeORM',
        'REST APIs',
        'WebSocket',
        'Auth0',
        'Clerk',
      ],
      proficiency: 'expert',
      domains: ['backend', 'realtime', 'auth'],
    },
    {
      priority: 8,
      category: 'Infrastructure & DevOps',
      skills: [
        'AWS',
        'Terraform',
        'Docker',
        'Cloudflare Workers',
        'GitHub Actions',
        'CI/CD',
        'ECS',
        'S3',
        'CloudFront',
      ],
      proficiency: 'proficient',
      domains: ['infrastructure', 'devops'],
    },
    {
      priority: 8,
      category: 'ML & 3D',
      skills: [
        'PyTorch',
        'ONNX Runtime',
        'Three.js',
        'WebGL',
        'Motion Capture',
        'Animation Systems',
        'MediaPipe',
      ],
      proficiency: 'proficient',
      domains: ['3d', 'ml'],
    },
    {
      priority: 7,
      category: 'Cross-Platform',
      skills: [
        'Qt',
        'Unreal Engine (C++)',
        'Unity',
        'Blender',
        'Maya',
        'Daz 3D',
      ],
      proficiency: 'proficient',
      domains: ['3d', 'cross-platform'],
    },
    {
      priority: 7,
      category: 'Payments',
      skills: [
        'Stripe',
        'Stripe Connect',
        'Subscription Management',
        'Marketplace Architecture',
      ],
      proficiency: 'proficient',
      domains: ['payments', 'marketplace'],
    },
    {
      priority: 6,
      category: 'Testing',
      skills: [
        'Jest',
        'Vitest',
        'React Testing Library',
        'Cypress',
        'E2E Testing',
      ],
      proficiency: 'proficient',
      domains: ['testing'],
    },
    {
      priority: 7,
      category: 'Design',
      skills: [
        'Figma',
        'Design Systems',
        'User Research',
        'Prototyping',
        'Accessibility',
        'Mobile-first Design',
      ],
      proficiency: 'proficient',
      domains: ['frontend'],
    },
    {
      priority: 5,
      category: 'Credentials',
      skills: ['UCLA, B.A. 2015'],
      proficiency: 'proficient',
      domains: ['education'],
    },
  ],
  product: [
    {
      priority: 10,
      category: 'Product Leadership',
      skills: [
        'Product Vision',
        'North Star Metrics',
        'Roadmapping',
        'Cross-functional Alignment',
        'Stakeholder Communication',
      ],
      proficiency: 'expert',
      domains: ['marketplace', 'social'],
    },
    {
      priority: 9,
      category: 'Product Discovery',
      skills: [
        'Customer Interviews',
        'JTBD Analysis',
        'Opportunity Sizing',
        'Usability Testing',
        'Product Analytics',
      ],
      proficiency: 'expert',
      domains: ['social', 'payments'],
    },
    {
      priority: 8,
      category: 'Growth & Lifecycle',
      skills: [
        'Activation Experiments',
        'Retention Strategy',
        'Lifecycle Messaging',
        'Community Programs',
        'Product-led Growth',
      ],
      proficiency: 'proficient',
      domains: ['social', 'marketplace'],
    },
    {
      priority: 8,
      category: 'Go-to-Market',
      skills: [
        'Positioning',
        'Pricing & Packaging',
        'Launch Playbooks',
        'Sales Enablement',
      ],
      proficiency: 'proficient',
      domains: ['marketplace', 'payments'],
    },
    {
      priority: 7,
      category: 'Team Operations',
      skills: [
        'Agile Facilitation',
        'Product Ops',
        'OKR Development',
        'Vendor Management',
      ],
      proficiency: 'proficient',
      domains: ['infrastructure'],
    },
    {
      priority: 5,
      category: 'Credentials',
      skills: ['UCLA, B.A. 2015'],
      proficiency: 'proficient',
      domains: ['education'],
    },
  ],
  frontend: [
    {
      priority: 10,
      category: 'Frontend Engineering',
      skills: [
        'React',
        'TypeScript',
        'TanStack Start',
        'Three.js',
        'Tailwind CSS',
        'Framer Motion',
        'Radix UI',
      ],
      proficiency: 'expert',
      domains: ['frontend', '3d'],
    },
    {
      priority: 9,
      category: 'Design & UX',
      skills: [
        'Product Design',
        'Interaction Design',
        'Design Systems',
        'Accessibility',
        'Prototyping',
      ],
      proficiency: 'expert',
      domains: ['frontend'],
    },
    {
      priority: 8,
      category: 'Real-time Interfaces',
      skills: [
        'Optimistic UI',
        'Live Subscriptions',
        'State Synchronization',
        'Event-driven UI',
      ],
      proficiency: 'proficient',
      domains: ['realtime', 'frontend'],
    },
    {
      priority: 7,
      category: '3D & Visuals',
      skills: [
        'React Three Fiber',
        'GLSL Shaders',
        'Motion Design',
        'WebGL Performance',
      ],
      proficiency: 'proficient',
      domains: ['3d', 'frontend'],
    },
    {
      priority: 5,
      category: 'Credentials',
      skills: ['UCLA, B.A. 2015'],
      proficiency: 'proficient',
      domains: ['education'],
    },
  ],
};
