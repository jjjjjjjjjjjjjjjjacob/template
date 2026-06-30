import './alt-3b.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio-data';
import { ProjectRow, ProjectDetail } from './project-row';
import { MetaballStage, type MetaballVariant } from './metaball-stage';
import { useMenuAim } from './use-menu-aim';
import {
  ALT3B_THEME_STORAGE_KEY,
  transitionTheme,
  type ThemeRevealOrigin,
} from './theme-reveal';

type Alt3bTheme = 'light' | 'dark';

const FALLBACK = {
  name: 'jacob stein',
  title: 'ui/ux · fullstack · product',
  location: 'remote',
  email: 'jacob@jacobstein.me',
  github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
  website: 'https://jacobstein.dev',
};

/* Each project gets a "specimen" — a blob choreography + pale tint pair. The
   metaball eases between them as the focus changes, all within the paper
   palette so the morph reads as ambient rather than loud. */
const SPECIMENS: {
  variant: MetaballVariant;
  accent: string;
  accent2: string;
}[] = [
  { variant: 'orbs', accent: '#e4e0f0', accent2: '#f1e0e6' }, // lilac · blush
  { variant: 'strand', accent: '#dee7e1', accent2: '#ece5d4' }, // sage · sand
  { variant: 'cluster', accent: '#e8e2d4', accent2: '#f1ddc8' }, // sand · clay
  { variant: 'halo', accent: '#dbe4ea', accent2: '#e7e0ef' }, // sky · lilac
];

/* Dark counterparts — same choreographies, but saturated jewel tones (not the
   near-black shades) so each project's blob reads as a clear, distinct colour
   glowing softly against the near-black bg. */
const SPECIMENS_DARK: typeof SPECIMENS = [
  { variant: 'orbs', accent: '#5446c0', accent2: '#8a4fb8' }, // indigo · violet
  { variant: 'strand', accent: '#2a9b85', accent2: '#4fae5c' }, // teal · green
  { variant: 'cluster', accent: '#c8832f', accent2: '#cc5836' }, // amber · orange
  { variant: 'halo', accent: '#3b8fc6', accent2: '#b85590' }, // sky · rose
];

/* Dark-mode tints keyed by project slug (Tailwind 500s), so each project keeps
   its colour regardless of position in the list. The per-index set above is the
   fallback for any project not listed here. */
const DARK_TINTS_BY_SLUG: Record<string, { accent: string; accent2: string }> =
  {
    'heat-tech': { accent: '#16a34a', accent2: '#de4427' }, // green · red-orange
    'the-market': { accent: '#ec4899', accent2: '#f43f5e' }, // pink · rose
    freelance: { accent: '#10b981', accent2: '#0ea5e9' }, // emerald · sky
  };

/* The bg/ink the metaball shader paints behind the page, plus its glow
   intensity, per theme — dark glows harder so the vivid tints bloom. */
const META_PALETTE: Record<
  Alt3bTheme,
  { bg: string; ink: string; intensity: number }
> = {
  light: { bg: '#efeeea', ink: '#1a1a18', intensity: 0.55 },
  dark: { bg: '#131210', ink: '#26241f', intensity: 1.15 },
};

/* Dark tints are pulled slightly toward their luma grey so the Tailwind 500s
   read a touch softer behind the page — same hue and brightness, less punch.
   0 = full saturation, 1 = greyscale. */
const DARK_DESATURATE = 0.18;

function desaturate(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  const ch = (c: number) =>
    Math.round(c + (grey - c) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

export function IndexLanding() {
  const { profile, projects, summary, isLoading } = usePortfolioData();
  const { activeIndex, panelRef, navProps, getRowProps } = useMenuAim(0);
  const [theme, setTheme] = useState<Alt3bTheme>('light');
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Restore the page-local theme on mount (no reveal animation on first load).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ALT3B_THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') setTheme(saved);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, []);

  const handleToggle = () => {
    const next: Alt3bTheme = theme === 'dark' ? 'light' : 'dark';
    const rect = toggleRef.current?.getBoundingClientRect();
    // Reveal grows from the toggle's centre; fall back to the top-right corner.
    const origin: ThemeRevealOrigin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: typeof window === 'undefined' ? 0 : window.innerWidth, y: 0 };
    try {
      localStorage.setItem(ALT3B_THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
    // flushSync so the View Transitions "new" snapshot captures the new palette.
    transitionTheme({
      origin,
      commit: () => flushSync(() => setTheme(next)),
    });
  };

  // On desktop the detail panel sits beside the index (always visible); on
  // mobile it stacks below, so tapping a selector would otherwise swap the
  // content off-screen. Bring the detail section into view on tap.
  const scrollToDetail = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    requestAnimationFrame(() =>
      panelRef.current?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      })
    );
  }, [panelRef]);

  const name = profile?.name ?? FALLBACK.name;
  const title = profile?.title ?? FALLBACK.title;
  const location = profile?.location ?? FALLBACK.location;
  const email = profile?.contact?.email ?? FALLBACK.email;
  const github = profile?.contact?.github ?? FALLBACK.github;
  const website = profile?.contact?.website ?? FALLBACK.website;
  const activeProject = projects[activeIndex];
  const dark = theme === 'dark';
  // Variant (choreography) is always the per-index specimen. Light keeps its
  // hand-tuned pale tint; dark colours come from the project's slug, falling
  // back to the per-index dark set.
  const spec = SPECIMENS[activeIndex % SPECIMENS.length];
  const darkTint =
    (activeProject && DARK_TINTS_BY_SLUG[activeProject.id]) ??
    SPECIMENS_DARK[activeIndex % SPECIMENS_DARK.length];
  const accent = dark
    ? desaturate(darkTint.accent, DARK_DESATURATE)
    : spec.accent;
  const accent2 = dark
    ? desaturate(darkTint.accent2, DARK_DESATURATE)
    : spec.accent2;
  const metaPalette = META_PALETTE[theme];
  // Hold the page until the resume data has loaded, so the content cascades in
  // as a unit instead of flashing half-empty. The metaball is gated one step
  // further (on an active project) so its palette is known before it blooms —
  // no default-purple field. Bloom timing lives in alt-3b.css.
  const loaded = !isLoading;

  if (!loaded) {
    return (
      <div
        className="alt-3-root alt-3b-root"
        data-theme={theme}
        aria-busy="true"
      />
    );
  }

  return (
    <div className="alt-3-root alt-3b-root" data-theme={theme}>
      {/* the soluo morph metaball — a fixed field behind the page. Mounted only
          once the active project's palette is known, then faded in via the veil. */}
      <div className="alt-3b-metaball" aria-hidden="true">
        {activeProject && (
          <div className="alt-3b-metaball-veil">
            <MetaballStage
              variant={spec.variant}
              cursorMode="trail"
              intensity={metaPalette.intensity}
              bg={metaPalette.bg}
              ink={metaPalette.ink}
              accent={accent}
              accent2={accent2}
              light={!dark}
            />
          </div>
        )}
      </div>

      <main className="alt-3b-shell mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-[minmax(260px,32%)_1fr] md:gap-16 md:px-10">
        {/* identity + index — an independent sticky column. Its height is
            decoupled from the detail panel, so changing projects (which resizes
            the right side) never shifts the selectors below. */}
        <aside className="alt-3b-aside">
          <header className="alt-3-fade-in">
            <div className="mb-8 flex items-start justify-between gap-4">
              <p className="alt-3-mono text-[0.68rem] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
                index — selected work
              </p>
              <button
                ref={toggleRef}
                type="button"
                className="alt-3b-theme-toggle"
                onClick={handleToggle}
                aria-label={`switch to ${dark ? 'light' : 'dark'} mode`}
                title={`switch to ${dark ? 'light' : 'dark'} mode`}
              >
                {dark ? (
                  <Moon aria-hidden="true" />
                ) : (
                  <Sun aria-hidden="true" />
                )}
              </button>
            </div>
            <h1 className="alt-3-grotesk text-[clamp(2rem,4.5vw,2.9rem)] leading-[0.98] font-[600] tracking-[-0.02em] capitalize">
              {name}
            </h1>
            <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">
              {title}
            </p>
            {summary && (
              <p className="mt-6 max-w-xs text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
                {summary}
              </p>
            )}

            <div className="mt-9 flex flex-col gap-1.5 text-[0.88rem]">
              <a className="alt-3-link w-fit" href={`mailto:${email}`}>
                {email}
              </a>
              <a
                className="alt-3-link w-fit"
                href={github}
                target="_blank"
                rel="noopener noreferrer"
              >
                github ↗
              </a>
              <a
                className="alt-3-link w-fit"
                href={website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {website.replace(/^https?:\/\//, '')} ↗
              </a>
            </div>
            <p className="alt-3-mono mt-9 text-[0.68rem] tracking-[0.14em] text-[var(--ink-faint)]">
              {location} · © {new Date().getFullYear()}
            </p>
          </header>

          {/* index list — hovering a row activates it, but the menu-aim guard
              forgives rows clipped while the cursor heads for the detail panel */}
          <nav
            aria-label="project index"
            className="alt-3-fade-in alt-3b-index md:mt-auto"
            style={{ animationDelay: '0.1s' }}
            {...navProps}
          >
            {projects.map((project, index) => {
              const rowProps = getRowProps(index);
              return (
                <ProjectRow
                  key={project.id}
                  project={project}
                  index={index}
                  isActive={index === activeIndex}
                  rowProps={{
                    ...rowProps,
                    onClick: (event) => {
                      rowProps.onClick(event);
                      scrollToDetail();
                    },
                  }}
                />
              );
            })}
          </nav>
        </aside>

        {/* large active-project specimen — scrolls in the document, and is the
            menu-aim target */}
        <section
          ref={panelRef}
          aria-live="polite"
          className="alt-3-fade-in alt-3b-detail-col"
          style={{ animationDelay: '0.2s' }}
        >
          {activeProject && (
            <ProjectDetail
              key={activeProject.id}
              project={activeProject}
              index={activeIndex}
            />
          )}
        </section>
      </main>
    </div>
  );
}
