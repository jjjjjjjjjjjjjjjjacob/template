import { Link } from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';
import { SiteThemeToggle } from './theme-toggle';
import { projectStage, useSiteVisuals } from './visual-provider';

export function SiteAuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { theme, setStage } = useSiteVisuals();

  useEffect(() => {
    setStage(projectStage(3, undefined, theme));
  }, [setStage, theme]);

  return (
    <main className="site-auth-page">
      <div className="site-auth-shell">
        <header className="site-fade-in site-auth-nav">
          <Link to="/" className="site-link site-auth-home">
            Jacob Stein
          </Link>
          <SiteThemeToggle className="site-auth-theme-toggle" />
        </header>

        <div className="site-auth-layout">
          <section className="site-fade-in site-auth-intro">
            <p className="site-mono site-auth-kicker">{eyebrow}</p>
            <h1 className="site-grotesk site-auth-title">{title}</h1>
            <p className="site-auth-copy">{description}</p>
            <Link to="/" className="site-link site-auth-back">
              back to index
            </Link>
          </section>

          <section
            className="site-fade-in site-auth-panel"
            style={{ animationDelay: '0.12s' }}
          >
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
