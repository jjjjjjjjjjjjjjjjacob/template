# Web Workspace Learnings

Contextual advice for tasks in `apps/web/`. Read before starting work here.

## Resume export (ATS / plaintext)

**Situation: anything touching resume download/export, ATS compatibility, or `pdf-download-popover`.**

- The original export (`use-story-canvas.ts`) renders the resume to a `<canvas>` and
  exports PNG/PDF. That PDF is a **rasterized image** — it has zero extractable text, so
  it scores ~0 on ATS parsers / Enhancv. Do not treat that PDF path as ATS-friendly.
- The ATS-friendly export lives in `src/lib/resume-export-text.ts`: pure
  `buildResumeMarkdown(data)` / `buildResumePlainText(data)` over the `ResumeData` shape.
  Keep these **pure** (no DOM) so they stay unit-testable; the download/Blob logic lives
  in `pdf-download-popover.tsx`.
- `ResumeData` (defined in `use-story-canvas.ts`) was extended additively with optional
  `location`, `education[]`, and `contact.phone/linkedin`. The canvas exporter ignores
  them; only the text exporter renders them. Keep new fields optional to avoid breaking
  the existing canvas path and the `resumeExportData` literal in `routes/index.tsx`.
- The export payload is assembled in `routes/index.tsx` as `resumeExportData` and passed
  to `<PDFDownloadPopover>` (the only mount site). Experience/skills/summary come from the
  dynamic `useResumeFilter()` hook; **location + education are static** there (SF, UCLA)
  because the filtered resume data doesn't carry them.
- Casing: the app UI convention is lowercase, but a downloaded resume is a **document**, so
  the export payload uses proper case (`Jacob Stein`, `Founding Engineer & UI/UX`). The
  canvas hardcodes its own lowercase `'jacob stein'` and does NOT read `resumeData.name`,
  so changing the payload name is safe.
- The reference format (Google Doc) is: Name → contact line → Summary → Experience
  (`Role` / `Company | timeline | location` / description / `Key Achievements:` bullets /
  `Technologies:` csv) → Skills (`Category: a, b, c`) → Education. Match this; it parses well.
- `track-events.ts` `resumeDownloaded` / `resumeDownloadAttempted` format unions include
  `'md' | 'txt'` alongside `'pdf' | 'png'`.
- **DOCX font:** `resume-export-docx.ts` pins the font to **Helvetica** (`RESUME_FONT`),
  set BOTH as the document default (`styles.default.document.run.font`) AND on every
  `TextRun`. The run-level font is the one that matters: Word's built-in heading styles
  (`HEADING_1`/`HEADING_2`) override docDefaults, so without a run-level font the headings
  would fall back to the theme's heading font. `.md`/`.txt` carry no font (viewer decides);
  the now-dead canvas path used `Utendo, system-ui, sans-serif`. Helvetica is a Mac font —
  Word on Windows substitutes a metric-similar sans-serif (use `Arial` if true cross-platform
  identical rendering is ever required).

**Caveat for the user, not code:** Enhancv prefers `.pdf`/`.docx` uploads and rewards
quantified, metric-driven bullets + consistent date formats. The current data has some
month-precision and some year-only dates ("March 2021 - present" vs "2022 - 2025"). If a
future task needs a true ATS _PDF_, generate a text-based PDF (jsPDF text API or print CSS),
NOT the canvas image.

## Alternative landing pages (`/alt-*`)

**Situation: building or editing any `/alt-N` landing concept, or adding a new one.**

- `__root.tsx` already special-cases any path starting with `/alt-`: `HeaderWrapper`
  returns `null` and `MainWrapper` drops the `mt-14` offset. So an alt route owns the full
  viewport with **no global header and no top margin** — do not re-add chrome, and don't
  modify `__root` for a new alt. (`/alt-macos` is the original; `/alt-1`…`/alt-5` are the
  refined "Jony Ive" minimal family.)
- **Data:** use `usePortfolioData()` (→ `api.resume.getProfile`, slug `default`). It returns
  `{ profile, projects, skills, summary }` and works regardless of the `portfolio_projects`
  `published` flag — unlike `api.projects.list` (`includeUnpublished:false`), which is empty
  right now. The live resume profile's projects are vibechecc.io / HEAT.tech / Freelance
  Development (NOT the `portfolioProjects.ts` seed set). **`project.previews[]` is empty** —
  design typography-first; never depend on uploaded imagery.
- **Pattern:** `routes/alt-N.tsx` = `createFileRoute('/alt-N')` → component in
  `components/alt-N/` (`index.tsx` + sub-pieces + co-located `alt-N.css`). Shared helpers in
  `components/alt-shared/` (`AltSwitcher`, `flattenTechnologies`/`startYear`/`topAchievements`).
- **Fonts:** distinct self-hosted variable woff2 per page under `public/fonts/alt/`
  (Fraunces, Mona Sans, Archivo, Cormorant, Bodoni Moda), declared via `@font-face` in the
  page's co-located CSS — keeps the global `fonts.css`/`app.css` untouched. In dev these are
  JS-injected (not in SSR `<head>`); they extract normally in prod builds.
- **Theme isolation:** each `.alt-N-root` sets its own explicit bg/fg (not the flipping
  `--background` token) so it reads as designed regardless of the global dark/light toggle.
- Pointer/`window`-dependent pages: effects-only access is SSR-safe (alt-2 SSRs fine).
  Wrap in `ClientOnly` only when first render depends on capability (alt-5 picks an
  immersive vs static variant via `matchMedia('(hover/pointer)')` + reduced-motion). Always
  give a no-hover/reduced-motion fallback that shows all content (alt-5's `alt-5-static`).
- Switcher uses plain `<a href>` (full reload) on purpose, so each immersive page tears down
  cleanly; it's intentionally decoupled from the typed route tree.

## Hash-anchor scrolling on the home page (`#projects` / `#resume` / `#contact`)

**Situation: anything touching in-page anchor navigation, the header navlinks, or "scroll
lands in the wrong place / under the header" bugs on `routes/index.tsx`.**

- Nav is plain `<a href="/#resume">` (header) + `<a href="#resume">` (hero), NOT TanStack
  `<Link>`. So scrolling is **browser-native** (`scroll-behavior: smooth` in `app.css`), the
  router does not manage it (`scrollRestoration: false` in `router.tsx`), and same-page hash
  clicks fire a `hashchange` event.
- The bug: native anchor scroll fires **once, immediately**, before layout settles. The
  home page reflows after the initial scroll because **fonts swap** (tracked via
  `document.fonts.ready` in `use-page-assets-ready.ts`), the particle field mounts, and the
  intro animation runs. The target's measured top moves after the scroll, so you land at the
  stale position (heading tucked under the fixed `h-16`/64px header). Scrolling down first
  settles fonts/layout, which is why it "works after scrolling."
- NOT the cause: slideshow `<img>` is `absolute inset-0` inside a fixed-height container
  (`min-h-96` / `md:min-h-[500px]`), and resume data is SSR-prefetched in the route loader
  (`api.resume.getProfile` slug `default`). Neither shifts the projects section height.
- Fix: `use-hash-scroll.ts` (mounted in `HomePage`), two modes over a ~2s settle window:
  - **Visit/refresh** (browser already jumped to the anchor) → `lock()`: an rAF loop that
    re-pins the target with `behavior: 'instant'` every frame. Reflow above the fold is
    absorbed with **no animation**, so the section never visibly moves. Critical: do NOT use
    a smooth correction here — animating the post-reflow correction is exactly what reads as
    a "jerk down" on visit.
  - **In-page click** (`hashchange`) → `glide()`: keeps a smooth scroll, re-issuing it only
    when reflow actually moves the target (which retargets the in-progress smooth scroll, so
    it stays smooth instead of starting a second animated correction).
  - Both bail on the first real user scroll (`wheel` / `touchmove` / nav `keydown`). Uses
    `touchmove` (a drag), NOT `touchstart`, so tapping the nav button doesn't self-cancel.
- This race usually does NOT reproduce on localhost (fonts are cached/instant). Verify with a
  throttled/cold network or a hard reload of `/#resume`.

## Alt landing variants + the soluo metaball + cursor-safe (menu-aim) index

**Situation: porting visuals from a sibling `../soluo` repo, adding a WebGL background to an
alt landing, or building "safe triangle" hover-intent over a hover-activated list.**

- Alt pages follow a fixed shape: `routes/alt-N.tsx` is a 6-line `createFileRoute` that renders
  `IndexLanding` from `components/alt-N/index.tsx`; styles live in a co-located `alt-N.css`
  scoped under a `.alt-N-root` class (CSS vars + most row/link rules are defined there).
  Data comes from `usePortfolioData()` (`api.resume.getProfile`, slug `default`) — projects carry
  `previews: string[]` (live-example URLs = "work cited") and categorized `technologies`.
- **Additive variant pattern:** to evolve an alt page without touching it, copy to `alt-Nb/` and
  add `routes/alt-Nb.tsx`. Reuse the original CSS by importing it and stacking both root classes
  (`<div className="alt-3-root alt-3b-root">`), then layer only the new rules in `alt-Nb.css`.
  This inherits every `--ink/--rule` var and row style for free; no edits to the original.
- **routeTree.gen.ts is auto-generated by the `tanstackStart` vite plugin** (it's tracked but
  rewritten on dev/build — note it imports `createServerRootRoute`, so the bare
  `@tanstack/router-generator` would produce a different shape; don't hand-roll it). Just add the
  route file: if `bun run dev` is running it regenerates within ~a second, and typecheck/SSR pick
  the new path up. No CLI/`tsr` script exists in this repo.
- **Porting the soluo metaball** (`../soluo/components/metaball-stage.tsx`): it's a single raymarched
  fragment shader on a full-screen `PlaneGeometry(2,2)` with `THREE.Camera()` (no projection),
  4 variants (orbs/strand/cluster/halo) and a click shockwave. soluo gates SSR via Next
  `dynamic(ssr:false)`; here you don't need that — drive three.js **imperatively inside `useEffect`**
  (like `particle-field.tsx`) so WebGL never runs server-side, and render a plain host `<div>` (no
  JSX `<Canvas>`). Keep the FRAG/VERT verbatim to match pixels; inline the `HeroVariant`/`CursorMode`
  types (don't import soluo's `@/lib/site-config`). To re-theme per project without remounting WebGL,
  store `uniformsRef`+`targetRef` and lerp colors each frame; update `uVariant`/intensity live in a
  second effect keyed on props.
- **First-paint gating (no default-purple flash, no half-empty content):** `usePortfolioData()` is a
  plain client `useQuery` — `payload` is `undefined` on SSR + first client paint (`isLoading: true`),
  and `routes/index.tsx` does NOT preload. So `IndexLanding` must hold: early-return just the
  `.alt-3-root.alt-3b-root` backdrop (with `aria-busy`) while `isLoading`, placed AFTER all hooks. Two
  separate gates, not one — content gates on `!isLoading` (so the whole `<main>` mounts at once and the
  existing staggered `.alt-3-fade-in` 0/0.1/0.2s delays actually cascade _populated_ content), while the
  metaball gates one step further on `activeProject` (so its palette is known). Mounting `MetaballStage`
  only when the palette is known means its uniforms initialize directly to the project's accents — no
  purple→color lerp. Fade it in a beat _after_ the content via a `.alt-3b-metaball-veil` wrapper
  (opacity 0→1, `0.5s` delay; `animation:none;opacity:1` under `prefers-reduced-motion`). Keep the gates
  split so a genuine zero-projects payload still renders the content (just without the blob).
- **Menu-aim ("safe triangle") hover intent** (`alt-3b/use-menu-aim.ts`): the index is on the left,
  the focused project's detail panel on the right; moving the cursor diagonally toward the panel must
  NOT switch focus to rows it clips. Algorithm (per jquery-menu-aim): keep a 2–3 sample pointer trail;
  the cursor is "aiming" when the slopes from it to the panel's near-edge corners
  (`slope(loc,upper) < slope(prev,upper) && slope(loc,lower) > slope(prev,lower)`) are tightening.
  While aiming, defer activation on a short re-check timer; commit only when motion goes **stale**
  (`now - loc.t > ~60ms`) AND the pointer is still inside the nav (a `navProps.onMouseLeave` flag) —
  this is what stops the "arrive at the panel and snap to the last passed row" bug. Keyboard `onFocus`
  / `onClick` bypass the triangle and activate immediately (a11y + touch). Degrades cleanly: on the
  single-column mobile layout the panel isn't to the right, so `loc.x >= rect.left` short-circuits and
  hover behaves normally.
- **Two-pane "jumping selectors" gotcha:** the original alt-3 grid puts the detail panel as a
  `row-span-2` item while the index nav is `row 2` of the left column. CSS grid distributes a spanned
  item's extra height across the rows it spans, so when the right content height changes per project,
  the left **nav shifts vertically** — selectors visibly jump. Fix = stop coupling the columns: make
  the left identity+index an **independent `position: sticky; top: 0; height: 100dvh; align-self: start`
  column** (its own `overflow-y: auto`; `mt-auto` to anchor the index near the bottom like the comp),
  and let the right detail column scroll in the document. The selectors then never move when the right
  resizes. **Critical:** `.alt-3-root` sets `overflow-x: hidden`, which makes it a scroll container and
  breaks the sticky — override to `overflow-x: clip` (clips without establishing a scroll container, so
  sticky still pins to the viewport).
- **Preview type is fragment-encoded** — `getProfile` (`resume.ts`) builds `previews: string[]` from the
  portfolio `media` table as: `iframe` → bare URL; `image` → `${url}#image`; stored `video` →
  `${url}#video` (external `video` with a `url` is bare, so also sniff `.mp4/.webm/...`). To render
  visual examples instead of links, branch on the `#image`/`#video` suffix (+ extension fallback) →
  `<img>` / `<video muted loop autoplay playsInline>` / `<iframe>`. For iframes: the cited sites here
  (mershy.com=Vercel, madelinelearyfilm.com=Framer) send no `X-Frame-Options`/CSP, so they embed; use
  `sandbox="allow-scripts allow-same-origin"` (no `allow-top-navigation` → neutralises frame-busting),
  render at 2× the frame + `transform: scale(0.5)` for a roomy thumbnail, set the media
  `pointer-events:none`, and overlay one absolute anchor (with an `sr-only` label) as the single
  accessible click target — that also stops the iframe trapping page scroll.
- **Name casing:** the comp lowercases everything, but a person's name is a proper noun (the CLAUDE.md
  casing exception). alt-3b renders the name with `capitalize` (not `lowercase`); titles/other copy keep
  the lowercase house style.
- **Media captions are in the schema + CMS already, just dropped on read.** `portfolio_projects.media[]`
  has an optional `caption` (editable in `admin/.../project-media-manager.tsx` via the upload/external
  dialogs + an "edit caption" dialog), but `getProfile` only pushed URLs into `previews: string[]` and
  threw the caption away. To surface descriptions: in `getProfile`'s `sortedMedia` loop, build an
  **index-aligned** `previewCaptions: string[]` — push `m.caption ?? ''` next to EVERY
  `previewItems.push(...)` (the loop skips media with no url/storageId, so pushing together is what keeps
  the arrays aligned). Add `previewCaptions: v.array(v.string())` to the `returns` validator AND the
  inline TS return type, and `previewCaptions?: string[]` (optional) to `ResumeProfilePayload` in
  use-resume-filter.ts. Fully additive — `previews` is unchanged so the other ~6 consumers don't care.
- **Per-example description fallback, keyed by host (not slug+index, not global).** alt-3b resolves a
  media description as `cmsCaption?.trim() || HARDCODED_DESCRIPTIONS[host] || undefined`. Host-keying is
  robust to media reordering and to opaque Convex storage URLs. Reality of the live data (verify by
  POSTing `{path:"resume:getProfile",args:{slug},format:"json"}` to `$CONVEX_URL/api/query`): captions
  are mostly empty; `freelance` previews are real hosts (mershy.com / madelinelearyfilm.com → hardcoded
  copy applies) while `heat-tech` previews are 4 `#video` Convex uploads with no captions (only the CMS
  caption can describe those — host-keying can't). So stored uploads ⇒ describe via CMS; external pages ⇒
  hardcode is fine.
- **"Full to content-height, covering it" = natural media height, NOT `vh`.** Drop the fixed
  `aspect-ratio: 16/10` + `position:absolute; object-fit:cover` crop; images/videos become
  `width:100%; height:auto` (whole asset shown, full column width). Iframes are the exception — no
  intrinsic height — so only `.alt-3b-media-frame[data-kind='iframe']` keeps an `aspect-ratio` box (with
  the 2×-scaled embed). The description sits in a `<figcaption>` UNDER the media (where the old filename
  link was); never render the file/URL name (use host only for `alt`/sr-only text).
- **Verifying a Convex query change is actually live:** a `convex dev` process (per workspace) auto-pushes
  on save — confirm it's running (`ps aux | grep "convex dev"`) and hit `$CONVEX_URL/api/query` directly
  (`{path:"resume:getProfile",args:{...},format:"json"}`) to see the new field, since the alt pages fetch
  client-side (SSR HTML won't show hydrated data).
- **Orientation-adaptive media (reconciling vertical budget):** a full-width portrait asset eats a huge
  vertical block; a landscape one doesn't. So branch the per-example layout on the media's orientation,
  measured on load (no dimensions in the schema): `<img onLoad>` → `naturalHeight > naturalWidth`,
  `<video onLoadedMetadata>` → `videoHeight > videoWidth`; iframes have no intrinsic size so they stay
  landscape. Drive it with `data-orientation` + `data-has-desc` on the `<figure>` and pure CSS:
  landscape = `flex-direction: column` (media then description); portrait+desc =
  `grid-template-columns: 1fr auto` with the description placed `grid-column: 1` and the frame
  `grid-column: 2` (description left, media right — one horizontal block). Portrait media is always
  height-bounded (`max-height: 20rem; width: auto`) so its budget matches landscape rows. Defaults to
  `landscape` so SSR/first paint match (a portrait item reflows once after its media loads).

## alt-3b dark mode + View Transitions circular reveal

**Situation: adding a per-page dark mode, porting `../the-new-modern`'s circular theme reveal,
or anything touching `alt-3b/theme-reveal.ts` / the `data-theme` attr / `::view-transition` CSS.**

- **Theme is page-local, never the global `.dark`.** alt pages are theme-isolated (each `.alt-N-root`
  hardcodes its palette). alt-3b's dark mode is a local `useState<'light'|'dark'>` in `index.tsx`,
  persisted to its OWN key `alt-3b-theme`, applied as `data-theme` on the `.alt-3b-root` div. It does
  NOT use `ThemeProvider`/`useTheme` (that toggles `.dark` on `<html>` for the whole app). Dark palette
  = `.alt-3-root.alt-3b-root[data-theme='dark']` overriding the 5 vars (`--bg/--ink/--ink-soft/
--ink-faint/--rule`). Because every surface is var-driven, that one block re-themes the whole page;
  the only extra override is the media-frame white (`.alt-3b-media-frame` bg). The iframe keeps `#fff`
  (it's a thumbnail of a real light site).
- **The circular reveal = View Transitions API + injected `clip-path` keyframes** (`theme-reveal.ts`,
  ported from `the-new-modern/app/_components/theme-mode.ts`). `transitionTheme({commit, origin})`
  injects a `@keyframes alt3b-theme-expand-circle` that grows `circle(0 at x y)` → `circle(R at x y)`
  where `R` = max hypotenuse to the 4 viewport corners, in 3 eased stages (overshoot 176 → settle 160
  → expand, 680ms), adds two transient classes to `<html>`, runs `document.startViewTransition(commit)`,
  and removes everything on `.finished`. The matching CSS (`alt-3b.css`) is **scoped entirely under
  `html.alt3b-theme-transitioning-circle`** so it can never leak into any other (future/global) view
  transition: `::view-transition-old(root){animation:none;z-index:1}` (old held opaque underneath),
  `::view-transition-new(root){animation:…680ms;z-index:2}` (new revealed over it by the circle).
- **React + View Transitions gotcha — commit MUST be synchronous.** The API snapshots the "new" state
  right after the `startViewTransition` callback resolves. React's `setState` is async/batched, so the
  snapshot would miss the flip. Wrap it: `commit: () => flushSync(() => setTheme(next))` (`react-dom`
  `flushSync`). flushSync here is safe — the VT callback runs as a microtask, not during React render.
- **The metaball lags the chrome by design.** `MetaballStage` eases its colours via a per-frame lerp
  (no remount), so at snapshot time the blob is still mid-transition; it finishes settling into the
  dark tints ~1s after the circle lands. Acceptable because it's masked + ambient. Dark uses a parallel
  `SPECIMENS_DARK` (deep muted jewel tones, same choreographies) + `light={false}` + dark `bg`/`ink`.
- **Fallbacks:** `transitionTheme` commits instantly (no animation) when `prefers-reduced-motion` OR
  `document.startViewTransition` is absent (Firefox/Safari<18); a CSS media query also nulls the
  `new(root)` animation. All `window`/`document` access is `typeof`-guarded (SSR-safe).
- **First paint is light on both server & client** (avoids hydration mismatch); the saved theme is
  applied in a mount `useEffect`, so a returning dark-mode user sees a brief light→dark settle on load
  (no anti-FOUC inline `<head>` script — out of scope for an alt page; note if that flash ever matters).
- **Toggle:** a bespoke `.alt-3b-theme-toggle` button (lucide `Sun`/`Moon`, shows the CURRENT mode like
  the global `theme-toggle.tsx`), in the aside eyebrow row, with a `ref` — the reveal origin is its
  `getBoundingClientRect()` centre. `AltSwitcher` already has a `tone` prop; pass `dark ? 'dark':'light'`.

## Per-example portfolio captions (alt-3b "work cited" media)

**Situation: adding/editing the descriptive copy under each project example image/video,
or anything touching `previewCaptions` / the alt-3b media list.**

- **The caption pipeline already exists end-to-end — don't build a new one.** Source of
  truth is `portfolio_projects.media[].caption` (Convex). `resume.getProfile` sorts each
  project's media by `order` and emits index-aligned `previews` + `previewCaptions`
  (`apps/convex/convex/resume.ts`, `caption = m.caption ?? ''`). `usePortfolioData()` →
  alt-3b `ProjectDetail` → `<PreviewMedia caption={captions[i]} />`.
- **Per-example captions render in ONLY one surface: alt-3b** (`components/alt-3b/
project-row.tsx`, `PreviewMedia` figcaption). The other themes (alt-1..5, alt-macos
  Photos/Finder/Safari, the main `/` `ProjectCard`) show the project-level `description`
  per preview, not per-example copy. If a request says "copy on each example," it's alt-3b.
- **Multiline captions need `whitespace-pre-line` on the caption `<span>`** (project-row.tsx,
  the `<span>{description}</span>` inside `.alt-3b-media-desc`). Captions are stored with
  real `\n`; without the class they collapse to one line. `caption?.trim()` trims ends but
  keeps internal newlines. The codebase's other multiline pattern is `whitespace-pre-wrap`
  (`alt-macos/apps/terminal-app.tsx`); use `pre-line` for prose.
- **Empty caption falls back to `HARDCODED_DESCRIPTIONS[host]`** (one generic blurb per
  host, e.g. `heat.tech`). Real per-example captions override it.
- **HEAT's live media is NOT in any seed file** — it lives only in the Convex DB (uploaded
  videos with `storageId`s). `resumeData.reference.ts` is stale (3 unrelated iframe URLs).
  To bulk-set captions on live media, write an idempotent `internalMutation` that looks up
  the project by slug and patches `media` matched by `order` (see
  `apps/convex/convex/seed/heatMediaCaptions.ts`), run via
  `bunx convex run seed/heatMediaCaptions:seedHeatMediaCaptions`. Have it return a
  `{ totalMedia, matched, mapping }` summary to verify order→caption alignment, since the
  live media order isn't visible from source. The admin caption editor
  (`components/admin/project-media-manager.tsx`) is already a multiline `<Textarea>`.
- **Portrait examples render side-by-side via a CSS grid that needs explicit
  `grid-row: 1`.** `.alt-3b-media[data-orientation='portrait'][data-has-desc='true']`
  is `display:grid; grid-template-columns:1fr auto` with the caption assigned
  `grid-column:1` (left) and the frame `grid-column:2` (right). But the frame comes
  FIRST in the DOM (assigned col 2) and the caption SECOND (assigned col 1) — so
  default _sparse_ grid auto-placement drops the caption into a NEW row and they
  stack. Fix = pin both children to `grid-row: 1`. Use `align-items: start` so a
  tall multi-line caption top-aligns with the video. Landscape media (e.g. the
  1436×1080 HEAT auto-rig clip) intentionally stays stacked (flex column), but its
  frame is indented `calc(1.6rem + 0.75rem)` (number column + gap) so it aligns
  with the description text and the number hangs to the left of the whole block
  instead of the frame bleeding full-width over the number. When a
  portrait example "stacks instead of sitting beside its caption," suspect grid
  placement first — `data-orientation` is set correctly by the video's
  `onLoadedMetadata` (verified: HEAT clips are 1080×2344 / 1080×1240 / 1080×1238
  portrait + one 1436×1080 landscape).
