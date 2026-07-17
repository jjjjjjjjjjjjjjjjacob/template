import { Link } from '@tanstack/react-router';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePortfolioData } from '@/hooks/use-portfolio-data';
import { ProjectDetail, ProjectRow } from './project-row';
import { SitePublicNav, useHasPublishedBlogPosts } from './public-nav';
import { SiteResumeAction } from './public-shell';
import { SiteThemeToggle } from './theme-toggle';
import { useMenuAim } from './use-menu-aim';
import { projectStage, useSiteVisuals } from './visual-provider';

const FALLBACK = {
  name: 'jacob stein',
  title: 'ui/ux · fullstack · product',
  location: 'remote',
  email: 'jacob@jacobstein.me',
  github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
  website: 'https://jacobstein.dev',
};

type CascadeStyle = CSSProperties & {
  '--site-cascade-delay': string;
};

const cascadeStyle = (delayMs: number): CascadeStyle => ({
  '--site-cascade-delay': `${delayMs}ms`,
});

const SIDEBAR_ACTION_START_MS = 240;
const SIDEBAR_ACTION_STEP_MS = 45;
const SIDEBAR_PROJECT_START_MS = 520;
const SIDEBAR_PROJECT_STEP_MS = 55;

export function SiteLanding() {
  const { profile, projects, summary, isLoading } = usePortfolioData();
  const { activeIndex, panelRef, navProps, getRowProps } = useMenuAim(0);
  const { theme, setStage } = useSiteVisuals();
  const actionEndRef = useRef<HTMLSpanElement | null>(null);
  const [showMobileHeader, setShowMobileHeader] = useState(false);
  const hasPublishedPosts = useHasPublishedBlogPosts();

  const activeProject = projects[activeIndex];

  useEffect(() => {
    setStage(projectStage(activeIndex, activeProject?.id, theme));
  }, [activeIndex, activeProject?.id, setStage, theme]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!mobileQuery.matches) {
        setShowMobileHeader(false);
        return;
      }

      const marker = actionEndRef.current;
      setShowMobileHeader(
        Boolean(marker && marker.getBoundingClientRect().top <= 0)
      );
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    mobileQuery.addEventListener('change', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      mobileQuery.removeEventListener('change', requestUpdate);
    };
  }, []);

  const name = profile?.name ?? FALLBACK.name;
  const title = profile?.title ?? FALLBACK.title;
  const location = profile?.location ?? FALLBACK.location;
  const email = profile?.contact?.email ?? FALLBACK.email;
  const github = profile?.contact?.github ?? FALLBACK.github;
  const website = profile?.contact?.website ?? FALLBACK.website;
  const loaded = !isLoading;

  if (!loaded) {
    return (
      <main
        className="site-shell mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-[minmax(260px,32%)_1fr] md:gap-16 md:px-10"
        aria-busy="true"
      />
    );
  }

  return (
    <main className="site-shell mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-[minmax(260px,32%)_1fr] md:gap-16 md:px-10">
      <header
        className="site-mobile-topbar"
        data-visible={showMobileHeader ? 'true' : 'false'}
      >
        <SitePublicNav
          className="site-mobile-topbar-inner"
          linksClassName="site-mobile-topbar-actions"
          nameClassName="site-mobile-topbar-name"
          themeToggleClassName="site-mobile-theme-toggle"
          resumeAction={
            <SiteResumeAction
              className="site-mobile-resume-trigger"
              source="site_mobile_header"
              contentSide="bottom"
              contentAlign="end"
            />
          }
        />
      </header>

      <aside className="site-aside">
        <header>
          <div
            className="site-cascade-item mb-8 flex items-start justify-between gap-4"
            style={cascadeStyle(0)}
          >
            <p className="site-mono text-[0.68rem] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
              index — selected work
            </p>
            <SiteThemeToggle />
          </div>
          <h1
            className="site-cascade-item site-grotesk text-[clamp(2rem,4.5vw,2.9rem)] leading-[0.98] font-[600] tracking-[-0.02em] capitalize"
            style={cascadeStyle(60)}
          >
            {name}
          </h1>
          <p
            className="site-cascade-item mt-3 text-[0.95rem] text-[var(--ink-soft)]"
            style={cascadeStyle(120)}
          >
            {title}
          </p>
          {summary && (
            <p
              className="site-cascade-item mt-6 max-w-xs text-[0.9rem] leading-relaxed text-[var(--ink-soft)]"
              style={cascadeStyle(180)}
            >
              {summary}
            </p>
          )}

          <div className="mt-9 flex flex-col gap-1.5 text-[0.88rem]">
            <a
              className="site-cascade-item site-link w-fit"
              href={`mailto:${email}`}
              style={cascadeStyle(SIDEBAR_ACTION_START_MS)}
            >
              {email}
            </a>
            <Link
              className="site-cascade-item site-link w-fit"
              to="/book"
              style={cascadeStyle(
                SIDEBAR_ACTION_START_MS + SIDEBAR_ACTION_STEP_MS
              )}
            >
              book a call
            </Link>
            <div
              className="site-cascade-item w-fit"
              style={cascadeStyle(
                SIDEBAR_ACTION_START_MS + SIDEBAR_ACTION_STEP_MS * 2
              )}
            >
              <SiteResumeAction
                className="w-fit"
                source="site_landing_actions"
                contentSide="right"
                contentAlign="start"
              />
            </div>
            {hasPublishedPosts && (
              <Link
                className="site-cascade-item site-link w-fit"
                to="/blog"
                style={cascadeStyle(
                  SIDEBAR_ACTION_START_MS + SIDEBAR_ACTION_STEP_MS * 3
                )}
              >
                blog
              </Link>
            )}
            <a
              className="site-cascade-item site-link w-fit"
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              style={cascadeStyle(
                SIDEBAR_ACTION_START_MS + SIDEBAR_ACTION_STEP_MS * 4
              )}
            >
              github ↗
            </a>
            <a
              className="site-cascade-item site-link w-fit"
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              style={cascadeStyle(
                SIDEBAR_ACTION_START_MS + SIDEBAR_ACTION_STEP_MS * 5
              )}
            >
              {website.replace(/^https?:\/\//, '')} ↗
            </a>
            <span ref={actionEndRef} aria-hidden="true" />
          </div>
          <p
            className="site-cascade-item site-mono mt-9 text-[0.68rem] tracking-[0.14em] text-[var(--ink-faint)]"
            style={cascadeStyle(
              SIDEBAR_ACTION_START_MS + SIDEBAR_ACTION_STEP_MS * 6
            )}
          >
            {location} · © {new Date().getFullYear()}
          </p>
        </header>

        <nav
          aria-label="project index"
          className="site-index md:mt-auto"
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
                enterDelayMs={
                  SIDEBAR_PROJECT_START_MS + index * SIDEBAR_PROJECT_STEP_MS
                }
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

      <section ref={panelRef} aria-live="polite" className="site-detail-col">
        {activeProject && (
          <ProjectDetail
            key={activeProject.id}
            project={activeProject}
            index={activeIndex}
          />
        )}
      </section>
    </main>
  );
}
