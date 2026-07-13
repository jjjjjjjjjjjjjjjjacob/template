import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePortfolioData } from '@/hooks/use-portfolio-data';
import { ProjectRow, ProjectDetail } from './project-row';
import { useMenuAim } from './use-menu-aim';
import { projectStage, useSiteVisuals } from './visual-provider';
import { SiteResumeAction } from './public-shell';
import { SiteThemeToggle } from './theme-toggle';

const FALLBACK = {
  name: 'jacob stein',
  title: 'ui/ux · fullstack · product',
  location: 'remote',
  email: 'jacob@jacobstein.me',
  github: 'https://github.com/jjjjjjjjjjjjjjjjacob',
  website: 'https://jacobstein.dev',
};

export function SiteLanding() {
  const { profile, projects, summary, isLoading } = usePortfolioData();
  const { activeIndex, panelRef, navProps, getRowProps } = useMenuAim(0);
  const { theme, setStage } = useSiteVisuals();
  const actionEndRef = useRef<HTMLSpanElement | null>(null);
  const [showMobileHeader, setShowMobileHeader] = useState(false);

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
        <div className="site-mobile-topbar-inner">
          <Link to="/" className="site-mobile-topbar-name">
            Jacob Stein
          </Link>
          <nav
            className="site-mobile-topbar-actions"
            aria-label="quick contact"
          >
            <a className="site-link" href={`mailto:${email}`}>
              email
            </a>
            <Link className="site-link" to="/book">
              book
            </Link>
            <SiteResumeAction
              className="site-mobile-resume-trigger"
              source="site_mobile_header"
              contentSide="bottom"
              contentAlign="end"
            />
            <SiteThemeToggle className="site-mobile-theme-toggle" />
          </nav>
        </div>
      </header>

      <aside className="site-aside">
        <header className="site-fade-in">
          <div className="mb-8 flex items-start justify-between gap-4">
            <p className="site-mono text-[0.68rem] tracking-[0.22em] text-[var(--ink-faint)] uppercase">
              index — selected work
            </p>
            <SiteThemeToggle />
          </div>
          <h1 className="site-grotesk text-[clamp(2rem,4.5vw,2.9rem)] leading-[0.98] font-[600] tracking-[-0.02em] capitalize">
            {name}
          </h1>
          <p className="mt-3 text-[0.95rem] text-[var(--ink-soft)]">{title}</p>
          {summary && (
            <p className="mt-6 max-w-xs text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
              {summary}
            </p>
          )}

          <div className="mt-9 flex flex-col gap-1.5 text-[0.88rem]">
            <a className="site-link w-fit" href={`mailto:${email}`}>
              {email}
            </a>
            <Link className="site-link w-fit" to="/book">
              book a call
            </Link>
            <SiteResumeAction
              className="w-fit"
              source="site_landing_actions"
              contentSide="right"
              contentAlign="start"
            />
            <a
              className="site-link w-fit"
              href={github}
              target="_blank"
              rel="noopener noreferrer"
            >
              github ↗
            </a>
            <a
              className="site-link w-fit"
              href={website}
              target="_blank"
              rel="noopener noreferrer"
            >
              {website.replace(/^https?:\/\//, '')} ↗
            </a>
            <span ref={actionEndRef} aria-hidden="true" />
          </div>
          <p className="site-mono mt-9 text-[0.68rem] tracking-[0.14em] text-[var(--ink-faint)]">
            {location} · © {new Date().getFullYear()}
          </p>
        </header>

        <nav
          aria-label="project index"
          className="site-fade-in site-index md:mt-auto"
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

      <section
        ref={panelRef}
        aria-live="polite"
        className="site-fade-in site-detail-col"
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
  );
}
