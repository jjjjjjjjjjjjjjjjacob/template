# template

A modern full-stack monorepo template built with TanStack Start, Convex, and Cloudflare.

---

## Monorepo Structure

This project is a Turborepo-powered monorepo, enabling code sharing between the frontend application, Convex backend, and shared packages.

```
template/
├── apps/
│   └── web/              # React web application (TanStack Start)
├── packages/
│   ├── backend/          # @template/backend - Convex backend
│   ├── scheduler/        # @template/scheduler - Headless scheduler SDK + React UI
│   ├── types/            # @template/types - Shared TypeScript interfaces
│   └── utils/            # @template/utils - Shared utility functions
├── terraform/            # Infrastructure as code
├── .github/              # GitHub Actions workflows
├── turbo.json            # Turborepo task configuration
├── package.json          # Root workspace package.json
└── ...
```

- **Frontend details:** See [`apps/web/README.md`](./apps/web/README.md)
- **Backend details:** See [`packages/backend/README.md`](./packages/backend/README.md)
- **Infrastructure:** See [`terraform/README.md`](./terraform/README.md)

---

## Tech Stack

### Frontend

- [TanStack Start](https://tanstack.com/start) (React framework)
- [shadcn/ui](https://ui.shadcn.com/) (UI components)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query) (server state)
- [TanStack Router](https://tanstack.com/router)
- [Three.js](https://threejs.org/) (3D graphics)
- [Framer Motion](https://framer.com/motion/) (animations)

### Backend

- [Convex](https://convex.dev/) (real-time DB, serverless functions)
- [Clerk](https://clerk.com/) (authentication)

### Infrastructure

- [Cloudflare Workers](https://workers.cloudflare.com/) (frontend hosting)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) (state storage)
- [Terraform](https://www.terraform.io/) (infra as code)
- [ngrok](https://ngrok.com/) (webhook tunneling)

### Development Tools

- [Bun](https://bun.sh/) (runtime, package manager)
- [Vinxi](https://vinxi.vercel.app/) (build system)
- [Vitest](https://vitest.dev/) (testing)
- [TypeScript](https://typescriptlang.org/) (type checking)
- [Biome](https://biomejs.dev/) (linting)
- [Prettier](https://prettier.io/) (formatting)
- [Turborepo](https://turborepo.dev/) (monorepo orchestration)

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- [Git](https://git-scm.com/)
- [ngrok](https://ngrok.com/download)
- [Convex CLI](https://docs.convex.dev/cli/install)
- A code editor (e.g., [VS Code](https://code.visualstudio.com/))

### Installation

```bash
git clone https://github.com/your-username/template.git
cd template
bun install
```

### Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in values for:
   - `VITE_CONVEX_URL`, `CONVEX_DEPLOYMENT` (Convex dashboard)
   - `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` (Clerk dashboard)
   - Google Calendar scheduling:
     - Enable the Google Calendar API in Google Cloud. Google Meet links are created through Calendar event `conferenceData`; no Gmail API or separate email provider is required.
     - Configure the OAuth consent screen and create OAuth Web Application credentials.
     - Add `http://localhost:3030/admin/scheduling/google/callback` and the production callback URL as authorized redirect URIs.
     - Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_CALENDAR_ID`, `GOOGLE_ALLOWED_ACCOUNT_EMAIL`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, and `BOOKING_PUBLIC_BASE_URL` in Convex.
   - `NGROK_AUTHTOKEN`

### Running Locally

```bash
bun run dev
```

- Starts Convex backend, launches frontend (http://localhost:3030), and ngrok tunnel.
- See [apps/web/README.md](./apps/web/README.md) and [packages/backend/README.md](./packages/backend/README.md) for app-specific dev info.

### Troubleshooting

- Clerk webhooks: Ensure ngrok is running and webhook URL is set in Clerk dashboard.
- Convex errors: Check Convex CLI output and env vars.
- Bun issues: Upgrade Bun, clear node_modules, reinstall.

---

## Development & Scripts

All scripts are run from the root with Bun:

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `bun run dev`          | Start full dev environment     |
| `bun run dev:frontend` | Start frontend only            |
| `bun run dev:backend`  | Start backend only             |
| `bun run build`        | Build all projects             |
| `bun run test`         | Run all tests                  |
| `bun run typecheck`    | Type check all projects        |
| `bun run lint`         | Lint all projects              |
| `bun run check`        | Biome check (lint + assists)   |
| `bun run check:fix`    | Biome check with autofix       |
| `bun run quality`      | Run typecheck + check + format |
| `bun run quality:fix`  | Run typecheck + check fix + fmt |

#### Turborepo Usage

- List workspaces: `bunx turbo ls`
- Run a task for one workspace: `bunx turbo run <task> --filter=<workspace>`
- Run a task for all applicable workspaces: `bunx turbo run <task>`
- Inspect the task graph: `bunx turbo run <task> --dry`
- Clear build outputs and the local Turbo cache: `bun run clean`

#### Adding New Apps

- Add a new application under `apps/` with its own `package.json`
- Add the required package scripts and register new task names in `turbo.json`
- See [Import Patterns](#import-patterns) for shared code usage

---

## CI/CD & Deployment

- **Environments:**
  - Production (`main` branch)
  - Development (`develop` branch)
  - Ephemeral (per PR)
- **Workflows:** Automated via GitHub Actions:
  - Lint, typecheck, test, build, deploy (see `.github/workflows/`)
  - Terraform manages infra, Convex and Cloudflare deploys
- **Scheduling CI/CD secrets:** add `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_CALENDAR_ID`, `GOOGLE_ALLOWED_ACCOUNT_EMAIL`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, and `BOOKING_PUBLIC_BASE_URL` to the GitHub environment used by deployment. The deploy workflow writes these into Convex env vars before deploy.
- **Manual Deploys/Rollbacks:**
  - Trigger from GitHub Actions tab
  - Rollback via Cloudflare/Convex dashboards

---

## Infrastructure (Terraform)

- All infra as code in [`terraform/`](./terraform)
- Cloudflare Workers for frontend, R2 for state, Convex for backend
- Three environments: production, development, ephemeral (PR)
- State stored remotely (Cloudflare R2)
- **Build before Terraform:**
  ```bash
  bun run build
  cd terraform
  terraform init
  terraform plan
  terraform apply
  ```
- See [`terraform/README.md`](./terraform/README.md) for details.

---

## Import Patterns

### From Browser App

```typescript
import { api } from '@template/backend';
import { BookingFlow } from '@template/scheduler/react';
import type { User, DataType } from '@template/types';
import { utilityFunction } from '@template/utils';
import { seo } from '@template/utils';
import { cn } from '@template/utils/tailwind';
```

### From Backend Package

```typescript
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { User, DataType } from '@template/types';
import { utilityFunction } from '@template/utils';
```

### From Shared Packages

```typescript
// @template/types
export interface User { id: string; name: string; email: string; }
// @template/scheduler
export { BookingFlow } from '@template/scheduler/react';
// @template/utils
export function utilityFunction(param: string): string { ... }
// @template/utils/tailwind
export function cn(...classes: string[]): string { ... }
```

---

## Contributing

- Follow existing code style and patterns
- Run `bun run quality` before PRs
- Write tests for new features
- Update docs as needed
- See app/infra READMEs for deep dives

---

## Testing

### Unit Testing

- Frontend: Vitest + React Testing Library for component tests
- Backend: convex-test for Convex function testing
- Run all tests: `bun run test`
- Run a specific workspace: `bunx turbo run test --filter=<workspace>`

### E2E Testing

- No E2E framework currently configured
- Manual testing via local development environment

### Test Coverage

- Component tests for UI elements
- Function tests for backend logic
- Integration tests for critical workflows

---

## License

[Add your license information here]
