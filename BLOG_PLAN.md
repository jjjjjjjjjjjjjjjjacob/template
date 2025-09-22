# Markdown Blog Feature Plan

Scope: Add a markdown-powered blog with public routes at `/blog` and an authenticated admin editor at `/admin` that supports live preview and paste/drag-drop of `.md` files. Persist posts in Convex.

## Milestones

1. Convex data + API

- Add `blogPosts` table (title, slug, markdown, authorId, createdAt, updatedAt, published)
- Queries: `list`, `getBySlug`
- Mutations: `upsert`, `delete`
- Auth: restrict mutations to admin allowlist via env `ADMIN_EMAILS`

2. Markdown rendering

- Add `react-markdown` + `remark-gfm`
- Add minimal GitHub-style markdown CSS, apply via `.markdown-body`

3. Public routes

- `/blog`: list posts with title, date, excerpt
- `/blog/$slug`: render markdown with GitHub styles

4. Admin editor

- `/admin`: auth-gated via Clerk (`useAuthGuard`)
- Form: title, slug (auto-generate), markdown editor
- Live preview using same renderer
- Paste/drag-drop `.md` support
- Save via Convex mutation

5. Polish

- Basic error/loading states
- Slug uniqueness check + friendly errors
- Simple success toasts

## Progress Log

- [x] 1. Convex data + API
- [x] 2. Markdown rendering deps + styles
- [x] 3. Public routes (/blog, /blog/$slug)
- [ ] 4. Admin editor (/admin) with live preview + file import
- [ ] 5. Polish and validation

Notes:

- Admin allowlist controlled via `ADMIN_EMAILS` in `apps/convex/.env.local`.
- Types for new Convex functions appear after `convex dev`/codegen.
- After setting `ADMIN_EMAILS`, restart Convex (`bun run dev:backend`) so server picks up env.
