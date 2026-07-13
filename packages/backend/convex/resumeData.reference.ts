import type {
  ResumeProfileRecord,
  LegacyResumeProjectRecord as ResumeProjectRecord,
  ResumeSkillRecord,
} from './resume';

export const resumeProfiles: ResumeProfileRecord[] = [
  {
    slug: 'default',
    name: 'Jacob Stein',
    title: 'Founding Engineer & UI/UX',
    location: 'Remote',
    summary:
      'Founder/developer building The Market, a compatibility-focused dating app for web and mobile, since November 2025. Technical leader with 4+ years of experience shipping cross-platform products, real-time systems, AI-assisted workflows, and production infrastructure across TypeScript, React, React Native, Convex, and AWS.',
    contact: {
      email: 'jacob@jacobstein.me',
      github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
      website: 'https://x.com/jaequbh',
    },
    defaults: {
      focusAreas: ['fullstack', 'leadership'],
      topTechnologies: [
        'React',
        'React Native',
        'TypeScript',
        'Convex',
        'Google Gemini',
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
      'Product strategist and technical founder focused on zero-to-one social products, currently building The Market as a compatibility-first dating app. Experienced turning product theses into shipped onboarding, discovery, trust, and engagement loops.',
    contact: {
      linkedin: 'https://linkedin.com/in/jacobstein',
      github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
      website: 'https://jacobstein.dev',
    },
    defaults: {
      focusAreas: ['product', 'fullstack'],
      topTechnologies: [
        'Product Vision',
        'Dating Product Strategy',
        'Compatibility Design',
        'Roadmapping',
        'Activation Experiments',
        'Trust & Safety',
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
      'Frontend engineer and product designer focused on building polished web and mobile product experiences, real-time interfaces, and design systems. Currently building The Market across TanStack Start, React 19, Expo, and React Native.',
    contact: {
      linkedin: 'https://linkedin.com/in/jacobstein',
      github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
      website: 'https://jacobstein.dev',
    },
    defaults: {
      focusAreas: ['frontend', 'fullstack'],
      topTechnologies: [
        'React',
        'React Native',
        'TypeScript',
        'TanStack Start',
        'Expo',
        'Tailwind CSS',
      ],
      priorityDomains: ['frontend', 'social', '3d'],
    },
    order: 2,
  },
  {
    slug: 'fde',
    name: 'Jacob Stein',
    title: 'Forward Deployed Engineer',
    location: 'Remote',
    summary:
      'Technical leader with 4+ years building production AI applications, cross-platform systems, and customer-facing integrations. Currently building The Market across AI-assisted matching, identity verification, real-time communication, and mobile/web product delivery.',
    contact: {
      email: 'jacob@jacobstein.me',
      github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
      website: 'https://x.com/jaequbh',
    },
    defaults: {
      focusAreas: ['ai', 'fullstack', 'customer-facing'],
      topTechnologies: [
        'Google Gemini',
        'AWS Rekognition',
        'TypeScript',
        'React',
        'React Native',
        'Convex',
        'AWS',
      ],
      priorityDomains: ['ai', 'llm', 'integration', 'customer-success'],
    },
    order: 3,
  },
];

export const resumeProjects: Record<string, ResumeProjectRecord[]> = {
  default: [
    {
      projectId: 'the-market',
      priority: 10,
      title: 'The Market',
      url: undefined,
      company: 'The Market',
      timeline: 'November 2025 - Present',
      role: 'Founder & Developer',
      description:
        'Founded and built The Market, a compatibility-focused dating app for web and mobile. Own the product end-to-end across onboarding, discovery, AI-assisted matching, identity verification, real-time chat, backend architecture, and deployment.',
      focusAreas: ['fullstack', 'leadership', 'product', 'realtime', 'ai'],
      domains: ['social', 'realtime', 'auth', 'ai', 'mobile', 'infrastructure'],
      achievements: [
        {
          description:
            'Built the full product as a solo founder/developer across TanStack Start web, Expo/React Native mobile, and a shared Convex backend',
          impact:
            'Delivered a cohesive cross-platform dating product from product concept through production architecture',
          technologies: [
            'TanStack Start',
            'Expo',
            'React Native',
            'Convex',
            'TypeScript',
          ],
          domains: ['social', 'mobile', 'backend'],
          type: 'architecture',
          priority: 0,
        },
        {
          description:
            'Architected compatibility-driven discovery with AI-assisted category feeds, matching logic, and profile variant testing',
          impact:
            'Moved the product beyond swipe-first discovery toward richer compatibility signals',
          technologies: ['Google Gemini', 'Convex', 'TypeScript'],
          domains: ['social', 'ai', 'backend'],
          type: 'architecture',
          priority: 1,
        },
        {
          description:
            'Implemented identity and safety systems with Clerk auth, profile onboarding, AWS Rekognition face verification, and selfie/liveness flows',
          impact:
            'Created a safer onboarding path for a trust-sensitive dating product',
          technologies: ['Clerk', 'AWS Rekognition', 'Cloudflare Workers'],
          domains: ['auth', 'security', 'infrastructure'],
          type: 'integration',
          priority: 2,
        },
        {
          description:
            'Designed and shipped a 40+ screen onboarding and profile setup flow for progressive dating preferences, prompts, photos, and match criteria',
          impact:
            'Captured richer user context while keeping profile creation structured and approachable',
          technologies: ['React 19', 'Expo', 'React Native'],
          domains: ['frontend', 'mobile', 'social'],
          type: 'development',
          priority: 3,
        },
        {
          description:
            'Built real-time chat with reactions, typing indicators, presence, match flows, and in-chat interactive experiences',
          impact:
            'Supported post-match engagement with instant, stateful communication primitives',
          technologies: ['Convex', 'React 19', 'React Native'],
          domains: ['realtime', 'social', 'frontend'],
          type: 'development',
          priority: 4,
        },
      ],
      technologies: {
        frontend: [
          'TanStack Start',
          'React 19',
          'Expo',
          'React Native',
          'TypeScript',
          'Tailwind CSS',
          'NativeWind',
        ],
        backend: ['Convex', 'Clerk', 'Google Gemini', 'AWS Rekognition'],
        infrastructure: ['Cloudflare Workers', 'Terraform', 'AWS'],
        databases: ['Convex (Real-time)'],
        tools: ['Bun', 'Turbo', 'Vitest', 'Maestro', 'Biome'],
      },
      previews: [],
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
      title: 'Freelance Web Development',
      url: undefined,
      company: 'Independent',
      timeline: 'November 2025 - Present',
      role: 'Freelance Web Developer',
      description:
        'Recent freelance web work for consumer retail and film clients, translating brand direction into responsive, production-ready websites.',
      focusAreas: ['frontend', 'product'],
      domains: ['e-commerce', 'creative', 'frontend', 'portfolio'],
      achievements: [
        {
          description:
            'Built Mershy.com for online retailer MERSHY, supporting product discovery, editorial brand content, ecommerce navigation, and mobile shopping flows',
          impact:
            'Delivered a polished retail web presence for a consumer brand',
          technologies: ['E-commerce UX', 'Responsive Web Design', 'SEO'],
          domains: ['e-commerce', 'frontend', 'retail'],
          type: 'development',
          priority: 0,
        },
        {
          description:
            'Built MadelineLearyFilm.com for director Madeline Leary, presenting film/music-video work, imagery, about/contact pages, and inquiry capture',
          impact: 'Created a media-forward portfolio site for a film director',
          technologies: ['Media-rich Portfolio UX', 'Responsive Web Design'],
          domains: ['creative', 'frontend', 'portfolio'],
          type: 'development',
          priority: 1,
        },
        {
          description:
            'Delivered polished responsive interfaces tuned for brand expression, navigation clarity, and fast handoff',
          impact:
            'Kept small-client builds focused, maintainable, and easy to iterate',
          technologies: ['TypeScript', 'React', 'Tailwind CSS'],
          domains: ['frontend', 'delivery'],
          type: 'development',
          priority: 2,
        },
      ],
      technologies: {
        frontend: [
          'Responsive Web Design',
          'React',
          'Next.js',
          'TypeScript',
          'Tailwind CSS',
        ],
        backend: [],
        infrastructure: ['Vercel'],
        databases: [],
        tools: ['SEO', 'Performance Optimization', 'Git'],
      },
      previews: [],
    },
  ],
  product: [
    {
      projectId: 'the-market-product',
      priority: 9,
      title: 'The Market',
      url: undefined,
      company: 'The Market',
      timeline: 'November 2025 - Present',
      role: 'Founder & Head of Product',
      description:
        'Leading product strategy and execution for a compatibility-focused dating app. Defined the initial product surface, onboarding model, matching thesis, safety requirements, and release roadmap while building the app as the sole developer.',
      focusAreas: ['product', 'fullstack', 'realtime'],
      domains: ['social', 'realtime', 'auth', 'ai'],
      achievements: [
        {
          description:
            'Defined the MVP scope and product roadmap across onboarding, compatibility discovery, profile prompts, verification, matching, and chat.',
          impact:
            'Kept a broad dating-app surface focused around the core compatibility and trust thesis.',
          technologies: [
            'Product Strategy',
            'Roadmapping',
            'User Journey Mapping',
          ],
          domains: ['social', 'realtime'],
          type: 'innovation',
          priority: 0,
        },
        {
          description:
            'Designed progressive profiling and 40+ onboarding screens to capture dating preferences, prompts, photos, and match criteria without overloading new users.',
          impact:
            'Turned complex preference collection into a structured, guided product flow.',
          technologies: ['UX Design', 'Onboarding Design', 'Product Discovery'],
          domains: ['social', 'auth'],
          type: 'development',
          priority: 1,
        },
        {
          description:
            'Built the product around compatibility-led discovery, AI-assisted category feeds, and profile variant testing.',
          impact:
            'Established product loops that can be tested beyond simple swipe ranking.',
          technologies: ['Google Gemini', 'Experiment Design', 'Convex'],
          domains: ['social', 'ai'],
          type: 'development',
          priority: 2,
        },
      ],
      technologies: {
        frontend: ['Product Strategy', 'User Journey Mapping', 'UX Design'],
        backend: ['Experiment Design', 'Compatibility Modeling'],
        infrastructure: ['Release Planning', 'Trust & Safety Planning'],
        databases: ['Cohort Design'],
        tools: ['Figma', 'Linear', 'Notion'],
      },
      previews: [],
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
      projectId: 'the-market-frontend',
      priority: 9,
      title: 'The Market',
      url: undefined,
      company: 'The Market',
      timeline: 'November 2025 - Present',
      role: 'Founder & Frontend Engineer',
      description:
        'Designed and implemented the web and mobile frontend for a compatibility-focused dating app, spanning onboarding, discovery, profile editing, verification, map/explore surfaces, and real-time chat.',
      focusAreas: ['frontend', 'fullstack', 'realtime', 'product'],
      domains: ['social', 'realtime', 'frontend', 'mobile'],
      achievements: [
        {
          description:
            'Built cross-platform UI across TanStack Start/React 19 and Expo/React Native with shared product primitives and a consistent visual system.',
          impact:
            'Kept the web and mobile experiences aligned while still respecting platform-specific interaction patterns.',
          technologies: ['TanStack Start', 'React 19', 'Expo', 'React Native'],
          domains: ['frontend', 'mobile'],
          type: 'development',
          priority: 0,
        },
        {
          description:
            'Designed and shipped a 40+ screen onboarding/profile setup flow with prompts, preferences, photos, education, verification, and match criteria.',
          impact:
            'Made complex dating-profile setup feel progressive and manageable across mobile and desktop.',
          technologies: ['React Native', 'NativeWind', 'Tailwind CSS'],
          domains: ['frontend', 'mobile', 'social'],
          type: 'architecture',
          priority: 1,
        },
        {
          description:
            'Implemented real-time discovery, match, and chat interfaces backed by Convex subscriptions and optimistic UI updates.',
          impact:
            'Delivered instant feedback for high-frequency dating interactions and messaging flows.',
          technologies: ['Convex', 'React 19', 'React Native'],
          domains: ['realtime', 'frontend'],
          type: 'development',
          priority: 2,
        },
      ],
      technologies: {
        frontend: [
          'TanStack Start',
          'React 19',
          'Expo',
          'React Native',
          'TypeScript',
          'Tailwind CSS',
          'NativeWind',
        ],
        backend: ['Convex', 'Clerk', 'Google Gemini'],
        infrastructure: ['Cloudflare Workers'],
        databases: ['Convex Real-time'],
        tools: ['Figma', 'Bun', 'Vitest', 'Maestro'],
      },
      previews: [],
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
  fde: [
    {
      projectId: 'cookt',
      priority: 10,
      title: 'cookt',
      url: undefined,
      company: 'cookt',
      timeline: '2025 - present',
      role: 'Founder & Lead Developer',
      description:
        'Built AI-powered recipe generation platform using multi-LLM orchestration to create personalized cooking experiences. Implemented advanced prompt engineering patterns, structured output parsing, and evaluation frameworks for consistent recipe quality.',
      focusAreas: ['ai', 'fullstack', 'product'],
      domains: ['ai', 'llm', 'consumer', 'frontend'],
      achievements: [
        {
          description:
            'Architected multi-LLM orchestration layer supporting Claude, GPT-4, and Gemini with intelligent model routing based on task complexity',
          impact:
            'Achieved 40% cost reduction while maintaining output quality through dynamic model selection',
          technologies: [
            'Claude API',
            'OpenAI API',
            'Gemini API',
            'TypeScript',
          ],
          domains: ['ai', 'llm', 'backend'],
          type: 'architecture',
          priority: 10,
        },
        {
          description:
            'Developed structured output parsing system with Zod schema validation for reliable recipe data extraction',
          impact:
            'Eliminated malformed outputs and enabled consistent UI rendering across LLM providers',
          technologies: ['Zod', 'TypeScript', 'JSON Schema'],
          domains: ['ai', 'llm', 'backend'],
          type: 'development',
          priority: 9,
        },
        {
          description:
            'Built evaluation framework to measure recipe quality, coherence, and instruction clarity across model versions',
          impact:
            'Enabled data-driven prompt iteration and regression testing for LLM outputs',
          technologies: ['Python', 'Prompt Engineering', 'Evaluation Metrics'],
          domains: ['ai', 'llm'],
          type: 'innovation',
          priority: 8,
        },
        {
          description:
            'Implemented real-time streaming responses with progressive UI updates for improved perceived latency',
          impact: 'Reduced time-to-first-token visibility to under 200ms',
          technologies: ['Server-Sent Events', 'React', 'Streaming APIs'],
          domains: ['ai', 'frontend'],
          type: 'development',
          priority: 7,
        },
      ],
      technologies: {
        frontend: ['React', 'TypeScript', 'TanStack Start', 'Tailwind CSS'],
        backend: [
          'Convex',
          'Node.js',
          'Claude API',
          'OpenAI API',
          'Gemini API',
        ],
        infrastructure: ['Cloudflare Workers', 'Vercel'],
        databases: ['Convex (Real-time)'],
        tools: ['Zod', 'Vitest', 'Prompt Engineering'],
      },
      previews: [],
    },
    {
      projectId: 'snoball',
      priority: 9,
      title: 'snoball',
      url: undefined,
      company: 'snoball',
      timeline: '2025 - present',
      role: 'Founder & Lead Developer',
      description:
        'Developed autonomous AI agent for social media content discovery and curation. Built agent architecture with tool use, memory systems, and multi-step reasoning for independent content analysis and recommendations.',
      focusAreas: ['ai', 'fullstack', 'agent'],
      domains: ['ai', 'llm', 'agent', 'social'],
      achievements: [
        {
          description:
            'Designed and implemented autonomous agent architecture with tool calling, memory persistence, and multi-step planning',
          impact:
            'Created self-directed agent capable of independent research and content curation workflows',
          technologies: [
            'Claude API',
            'Agent Architecture',
            'Tool Use',
            'TypeScript',
          ],
          domains: ['ai', 'agent', 'backend'],
          type: 'architecture',
          priority: 10,
        },
        {
          description:
            'Built conversation memory system with context window management and intelligent summarization',
          impact:
            'Enabled coherent multi-session interactions while staying within token limits',
          technologies: ['Vector Embeddings', 'Context Management', 'Python'],
          domains: ['ai', 'agent'],
          type: 'development',
          priority: 9,
        },
        {
          description:
            'Implemented tool ecosystem for web scraping, API integrations, and content analysis with structured outputs',
          impact:
            'Expanded agent capabilities across diverse data sources and interaction patterns',
          technologies: ['Function Calling', 'REST APIs', 'Puppeteer'],
          domains: ['ai', 'agent', 'integration'],
          type: 'development',
          priority: 8,
        },
        {
          description:
            'Created evaluation harness for agent behavior testing and prompt regression detection',
          impact:
            'Ensured consistent agent behavior across model updates and prompt changes',
          technologies: ['Evaluation Frameworks', 'Test Harnesses', 'Python'],
          domains: ['ai', 'agent'],
          type: 'innovation',
          priority: 7,
        },
      ],
      technologies: {
        frontend: ['React', 'TypeScript', 'Next.js'],
        backend: [
          'Python',
          'Claude API',
          'OpenAI API',
          'Agent Frameworks',
          'Tool Use',
        ],
        infrastructure: ['AWS Lambda', 'Vercel'],
        databases: ['PostgreSQL', 'Vector Store'],
        tools: ['Puppeteer', 'Evaluation Frameworks'],
      },
      previews: [],
    },
    {
      projectId: 'the-market',
      priority: 10,
      title: 'The Market',
      url: undefined,
      company: 'The Market',
      timeline: 'November 2025 - Present',
      role: 'Founder & Developer',
      description:
        'Built a compatibility-focused dating app end-to-end across web, mobile, Convex backend, AI-assisted matching, safety verification, and real-time communication systems.',
      focusAreas: ['fullstack', 'product', 'ai', 'customer-facing'],
      domains: ['social', 'ai', 'realtime', 'auth', 'integration'],
      achievements: [
        {
          description:
            'Integrated AI-assisted discovery and compatibility features using Google Gemini and Convex-backed product logic',
          impact:
            'Translated an ambiguous matching problem into shippable backend and product workflows',
          technologies: ['Google Gemini', 'Convex', 'TypeScript'],
          domains: ['ai', 'backend', 'social'],
          type: 'integration',
          priority: 0,
        },
        {
          description:
            'Integrated AWS Rekognition, Clerk, and mobile camera flows for face verification, onboarding trust, and account safety',
          impact:
            'Created the trust layer needed for a dating product where identity quality matters',
          technologies: ['AWS Rekognition', 'Clerk', 'React Native'],
          domains: ['auth', 'integration', 'mobile'],
          type: 'integration',
          priority: 1,
        },
        {
          description:
            'Built real-time matching and messaging systems with Convex subscriptions, reactions, typing indicators, presence, and in-chat interaction states',
          impact:
            'Delivered customer-facing workflows that depend on low-latency state synchronization',
          technologies: ['Convex', 'React 19', 'React Native'],
          domains: ['realtime', 'frontend', 'backend'],
          type: 'development',
          priority: 2,
        },
      ],
      technologies: {
        frontend: ['TanStack Start', 'React 19', 'Expo', 'React Native'],
        backend: ['Convex', 'Google Gemini', 'AWS Rekognition', 'Clerk'],
        infrastructure: ['Cloudflare Workers', 'Terraform', 'AWS'],
        databases: ['Convex (Real-time)'],
        tools: ['TypeScript', 'Bun', 'Vitest', 'Maestro'],
      },
      previews: [],
    },
    {
      projectId: 'heat-tech-fde',
      priority: 7,
      title: 'HEAT.tech',
      url: 'https://heat.tech',
      company: 'HEAT.tech',
      timeline: '2022 - 2025',
      role: 'Senior Engineer & Technical Integration Lead',
      description:
        'Led technical integrations and partnership engineering for a16z and Samsung Next-backed motion capture marketplace. Embedded with external partners during beta programs, coordinated across engineering teams, and translated customer requirements into product improvements.',
      focusAreas: ['fullstack', 'customer-facing', 'integration'],
      domains: ['marketplace', '3d', 'integration', 'customer-success'],
      achievements: [
        {
          description:
            'Embedded with Move AI during beta program to integrate video-to-animation pipeline, coordinating across engineering and product teams on both sides',
          impact:
            'Successfully launched AI-powered video-to-animation feature through close technical partnership',
          technologies: ['ONNX', 'MediaPipe', 'Python', 'REST APIs'],
          domains: ['integration', 'customer-success', '3d'],
          type: 'integration',
          priority: 10,
        },
        {
          description:
            'Contributed to implementation strategy for platform partnerships with Unreal, Daz 3D, and Maya—navigating different stakeholders and technical requirements',
          impact:
            'Informed partnership decisions and integration approaches across major platform vendors',
          technologies: [
            'Technical Strategy',
            'Partnership Development',
            'C++',
            'Python',
          ],
          domains: ['integration', 'customer-success', 'business'],
          type: 'leadership',
          priority: 9,
        },
        {
          description:
            'Developed cross-platform plugin ecosystem managing compatibility across conflicting APIs in Blender, Unity, Unreal Engine, and Maya',
          impact:
            'Extended platform reach while maintaining consistent user experience across diverse technical environments',
          technologies: ['Python', 'C#', 'C++', 'MEL', 'AWS S3'],
          domains: ['3d', 'integration', 'cross-platform'],
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
          priority: 7,
        },
        {
          description:
            'Trained and deployed armature-generating ML model using PyTorch and ONNX Runtime',
          impact: 'Automated skeleton generation for motion capture assets',
          technologies: ['PyTorch', 'ONNX Runtime', 'Python'],
          domains: ['3d', 'ml'],
          type: 'innovation',
          priority: 6,
        },
      ],
      technologies: {
        frontend: ['React', 'Three.js', 'TypeScript', 'Qt'],
        backend: ['NestJS', 'Python', 'REST APIs'],
        infrastructure: ['AWS ECS', 'Terraform', 'CloudFront', 'S3'],
        databases: ['PostgreSQL'],
        tools: ['PyTorch', 'ONNX Runtime', 'Blender', 'Unity', 'Unreal Engine'],
      },
      previews: [
        'https://heat.tech/marketplace/animations/05867c5d-0542-48d1-bc7a-7f1f81ffee73',
        'https://heat.tech/plugins',
      ],
    },
    {
      projectId: 'freelance-recent-fde',
      priority: 6,
      title: 'Freelance Web Development',
      url: undefined,
      company: 'Independent',
      timeline: 'November 2025 - Present',
      role: 'Freelance Web Developer',
      description:
        'Delivered recent freelance websites for an online retailer and a film director, balancing client requirements, visual direction, responsive implementation, and handoff.',
      focusAreas: ['frontend', 'customer-facing', 'integration'],
      domains: ['frontend', 'customer-success', 'creative'],
      achievements: [
        {
          description:
            'Built Mershy.com for online retailer MERSHY, supporting product discovery, brand content, ecommerce navigation, and mobile shopping flows',
          impact:
            'Translated retail goals into a polished customer-facing website',
          technologies: ['E-commerce UX', 'Responsive Web Design', 'SEO'],
          domains: ['frontend', 'customer-success'],
          type: 'development',
          priority: 0,
        },
        {
          description:
            'Built MadelineLearyFilm.com for director Madeline Leary with media-forward project pages, imagery, about/contact flows, and inquiry capture',
          impact: 'Created a focused portfolio presence for a creative client',
          technologies: ['Media-rich Portfolio UX', 'Responsive Web Design'],
          domains: ['frontend', 'creative'],
          type: 'development',
          priority: 1,
        },
        {
          description:
            'Managed client-facing implementation details from visual direction through responsive QA and launch handoff',
          impact:
            'Kept small-project delivery pragmatic and production-focused',
          technologies: ['TypeScript', 'React', 'Tailwind CSS'],
          domains: ['customer-success', 'frontend'],
          type: 'development',
          priority: 2,
        },
      ],
      technologies: {
        frontend: ['Responsive Web Design', 'React', 'TypeScript'],
        backend: [],
        infrastructure: ['Vercel'],
        databases: [],
        tools: ['SEO', 'Performance Optimization', 'Git'],
      },
      previews: ['https://mershy.com', 'https://madelinelearyfilm.com'],
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
        'Google Gemini',
        'AWS Rekognition',
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
        'React Native',
        'TypeScript',
        'TanStack Start',
        'Expo',
        'Three.js',
        'Tailwind CSS',
        'NativeWind',
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
  fde: [
    {
      priority: 10,
      category: 'AI & LLM',
      skills: [
        'Claude API',
        'OpenAI API',
        'Gemini API',
        'Google Gemini',
        'AWS Rekognition',
        'Prompt Engineering',
        'Multi-LLM Orchestration',
        'Agent Development',
        'Evaluation Frameworks',
        'Structured Outputs',
      ],
      proficiency: 'expert',
      domains: ['ai', 'llm', 'agent'],
    },
    {
      priority: 9,
      category: 'Languages',
      skills: ['TypeScript', 'Python', 'JavaScript', 'C++', 'SQL'],
      proficiency: 'expert',
      domains: ['frontend', 'backend', 'ai'],
    },
    {
      priority: 9,
      category: 'Full-Stack Development',
      skills: [
        'React',
        'React Native',
        'Next.js',
        'TanStack Start',
        'Expo',
        'NestJS',
        'Node.js',
        'Convex',
        'AWS Rekognition',
        'REST APIs',
        'WebSocket',
      ],
      proficiency: 'expert',
      domains: ['frontend', 'backend', 'realtime'],
    },
    {
      priority: 8,
      category: 'Customer-Facing Engineering',
      skills: [
        'Technical Integration',
        'Partner Coordination',
        'Requirements Discovery',
        'Cross-team Communication',
        'Implementation Strategy',
        'Technical Documentation',
      ],
      proficiency: 'proficient',
      domains: ['customer-success', 'integration'],
    },
    {
      priority: 8,
      category: 'Infrastructure & DevOps',
      skills: [
        'AWS',
        'Terraform',
        'Cloudflare Workers',
        'Docker',
        'GitHub Actions',
        'CI/CD',
      ],
      proficiency: 'proficient',
      domains: ['infrastructure', 'devops'],
    },
    {
      priority: 7,
      category: 'Cross-Platform Integration',
      skills: [
        'Qt',
        'Unreal Engine (C++)',
        'Unity',
        'Blender',
        'Maya',
        'Plugin Development',
      ],
      proficiency: 'proficient',
      domains: ['3d', 'cross-platform', 'integration'],
    },
    {
      priority: 6,
      category: 'ML & 3D',
      skills: ['PyTorch', 'ONNX Runtime', 'Three.js', 'WebGL', 'MediaPipe'],
      proficiency: 'proficient',
      domains: ['3d', 'ml'],
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
