# AI Assistant Rules for Template Repository

These rules override default AI behavior when working on this codebase.

## Core Principles

1. **Additive Changes Preferred**
   - Always extend existing patterns rather than modifying them
   - Never change existing function signatures without explicit permission
   - Create v(n+1) versions when replacing code
   - Document breaking changes and request permission

2. **Pattern Preservation**
   - Follow existing codebase patterns exactly
   - Do not introduce new patterns without explicit request
   - When unsure about a pattern, ask for clarification

3. **Monorepo Awareness**
   - Always use workspace imports (`@template/types`, `@template/utils`, `@template/convex`)
   - Run commands from the repository root using `bun`
   - Never use npm, yarn, pnpm, or npx - use `bun` and `bunx` exclusively

## Development Workflow

### Before Making Changes

1. Check `.agent/rules/` for specific workspace rules
2. Understand existing patterns by examining neighboring code
3. Use the TodoWrite tool for any multi-step tasks
4. Check existing backend implementations before creating new features

### During Development

1. Mark todos as in_progress before starting work
2. Only have one todo in_progress at a time
3. Complete current tasks before starting new ones
4. Update task status in real-time

### After Completing Tasks

1. Mark todos as completed immediately
2. Run quality checks (`bun run quality`)
3. Run type checking (`bun run typecheck`)
4. Run tests (`bun run test`)

## Code Style Rules

### Naming Conventions

#### File Names

- **kebab-case** for all file names: `user-profile.tsx`, `data-utils.ts`
- Test files: `[name].test.ts` or `[name].test.tsx`
- NO underscores, NO camelCase in file names

#### TypeScript/JavaScript

- **camelCase** for:
  - Variable names: `const userName = 'John'`
  - Function names (non-components): `function getUserData() {}`
  - Object properties: `{ firstName: 'John', lastName: 'Doe' }`
- **PascalCase** for:
  - React components: `function UserProfile() {}`
  - Classes: `class UserService {}`
  - Types/Interfaces: `type UserData = {}`, `interface UserProfile {}`
  - Enums: `enum UserRole {}`

- **UPPER_SNAKE_CASE** for:
  - Constants: `const MAX_RETRIES = 3`
  - Environment variables: `process.env.DATABASE_URL`

### UI Design Style

- **Lowercase text** throughout the UI (buttons, labels, headers)
  - Button: "save changes" NOT "Save Changes"
  - Headers: "user profile" NOT "User Profile"
  - Labels: "email address" NOT "Email Address"
- Exception: Proper nouns and user-generated content maintain their casing

### Import Rules

- **shadcn/ui components** can ONLY be imported in `apps/web/` directory
  - Reason: Only `apps/web/components.json` exists
  - Example: `import { Button } from '@/components/ui/button'`
  - NEVER attempt to use shadcn imports in other workspaces

### General

- NO COMMENTS unless explicitly requested
- Prefer existing utility functions over creating new ones
- Match indentation of surrounding code (2 spaces for TS/JS/JSON)

## Testing Rules

1. Never skip tests - they're considered failing
2. Co-locate test files with source code
3. Use existing test patterns and utilities
4. Run tests before marking tasks complete

## Documentation Rules

1. Only create documentation when explicitly requested
2. Update existing docs rather than creating new ones
3. Keep README files focused on their specific scope
4. Don't duplicate information across README files

## Security Rules

1. Never commit secrets or API keys
2. Always validate user input
3. Use proper authentication checks
4. Follow existing security patterns

## Workspace-Specific Rules

### Frontend (`apps/web/`)
- Use TanStack Start for routing and SSR
- Import shadcn/ui components only in this workspace
- Use `@/` path alias for src directory imports
- Organize features in `src/features/` directory
- Use lowercase text in all UI elements

### Backend (`apps/convex/`)
- Prefer Convex indexes over filters for queries
- Use proper authentication checks in mutations
- Organize functions by domain (e.g., `convex/users.ts`)
- Export functions for API access

### Shared Packages
- `@template/types`: TypeScript interfaces shared across workspaces
- `@template/utils`: Pure utility functions with no workspace dependencies
- Only extract to shared packages when used by 2+ workspaces

## Command Execution

### Safe Commands
```bash
bun run build
bun run test
bun run typecheck
bun run lint
bun run quality
```

### Never Run Without Timeout
- `bun run dev` or any dev server
- Any watch mode commands
- Commands that take over the terminal

## Testing Requirements

1. Use Vitest for all tests
2. Never skip tests - they're considered failing
3. Frontend: Use @testing-library/react
4. Backend: Use convex-test
5. Include proper DOM references in frontend tests
6. Run tests before marking tasks complete

## Performance & Optimization

### Bundle Size
- Monitor with `bun run analyze-bundle`
- Keep total JS under 500KB
- Lazy load heavy components
- Use dynamic imports for code splitting

### Font Loading
- Use progressive font loading
- Subset large font files
- Implement proper font-display strategies

### Web Vitals
- Track LCP, FID, CLS metrics
- Use performance monitoring in development
- Implement proper loading states

## Feature Implementation

### Search Features
- Backend search already exists at `convex/search.ts`
- Includes fuzzy matching and scoring
- Use debouncing (300ms) for search inputs
- Implement client-side caching

### Auth Features
- Combine Clerk (authentication) with Convex (user data)
- Use feature-based organization in `features/auth/`
- Implement proper auth guards and permission checks

### Error Handling
- Use specialized error boundaries
- Implement retry strategies
- Log errors to PostHog in production
- Provide user-friendly error messages

## Quality Standards

1. Full TypeScript coverage required
2. No linter errors (unless fixing is explicitly requested)
3. Run `bun run quality` before completing tasks
4. Ensure backward compatibility
5. Maintain test coverage above 50%
