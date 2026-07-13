import type { ReactNode } from 'react';

export function SiteStatusPage({
  eyebrow,
  title,
  children,
  actions,
  embedded = false,
  animate = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  embedded?: boolean;
  animate?: boolean;
}) {
  const Element = embedded ? 'div' : 'main';

  return (
    <Element className="site-status-page" data-embedded={embedded || undefined}>
      <section className={`site-status-card${animate ? 'site-fade-in' : ''}`}>
        <p className="site-mono site-status-kicker">{eyebrow}</p>
        <h1 className="site-grotesk site-status-title">{title}</h1>
        <div className="site-status-copy">{children}</div>
        <div className="site-status-actions">{actions}</div>
      </section>
    </Element>
  );
}
