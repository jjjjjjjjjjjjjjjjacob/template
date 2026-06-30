---
name: project-profiles
description: Reference profiles for Jacob's standalone projects (The Market, no-mess, Stoopd) with descriptions, tech stacks, and achievements
type: reference
---

# Project Profiles

Reference documentation for Jacob's standalone projects. These map to `portfolio_projects` entries in Convex.

---

## The Market

- **Slug**: `the-market`
- **Title**: The Market
- **Description**: A compatibility-focused dating app with AI-driven matching, rich interactive prompts, face verification, and real-time chat — built for web and mobile.
- **Role**: Founder & Lead Developer
- **Timeline**: 2025 - Present
- **Technologies**: TanStack Start, React 19, Expo, React Native, Convex, Clerk, Tailwind CSS, Three.js, Google Gemini, AWS Rekognition, Cloudflare Workers, Terraform, TypeScript, Bun, Turbo

### Achievements

1. Built dual-platform (web + mobile) dating app with shared Convex backend (~67k lines)
2. Implemented AI-driven category feeds and compatibility scoring using Google Gemini
3. Integrated AWS Rekognition for face verification and liveness detection
4. Designed 40+ screen onboarding flow with multi-phase progressive profiling
5. Built real-time chat with reactions, typing indicators, presence, and in-chat games
6. Architected cohort-based discovery system with profile variant A/B testing

---

## no-mess

- **Slug**: `no-mess`
- **Title**: no-mess
- **Description**: A multi-tenant headless CMS with schema-as-code, Shopify integration, iframe-based live preview/editing, and a Cloudflare Workers edge API gateway with rate limiting and caching.
- **Role**: Founder & Lead Developer
- **Timeline**: 2025 - Present
- **Technologies**: Next.js 16, React 19, Convex, Clerk, Cloudflare Workers, Cloudflare KV, Tailwind CSS, TypeScript, Biome, Changesets, Bun

### Achievements

1. Designed flexible schema system (templates + recursive fragments) with draft/publish workflow
2. Built iframe-based live preview with HMAC-SHA256 session security and 10-min TTL
3. Created Cloudflare Workers edge API gateway with sliding-window rate limiting and response caching
4. Developed TypeScript SDK (@no-mess/client) and CLI tool for schema-as-code workflows
5. Built MCP server enabling AI agents to manage CMS content
6. Implemented Shopify product/collection sync with handle-based references

---

## Stoopd

- **Slug**: `stoopd`
- **Title**: Stoopd
- **Description**: A real-time building community platform connecting residents for communication, governance, and collaborative problem-solving — with web and mobile apps sharing a unified backend.
- **Role**: Founder & Lead Developer
- **Timeline**: 2025 - Present
- **Technologies**: TanStack Start, React 19, Expo, React Native, Convex, Clerk, Tailwind CSS, NativeWind, Framer Motion, Google Maps, Zustand, TypeScript, Bun, Turbo

### Achievements

1. Architected dual-platform (web + mobile) community app with shared backend and UI primitives
2. Built multi-channel communication system (chat, threads, alerts) with real-time messaging
3. Designed tiered building claim system (resident → management → ownership) with verification
4. Implemented role-based access control with fine-grained moderation tools
5. Created multi-step onboarding with user type detection (tenant, owner, PM, landlord)
6. Built achievement badge system with global, building, and role-scoped earning rules
